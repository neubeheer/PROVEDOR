/**
 * Provedor Tycoon · Banco de quadras no Google Drive
 *
 * Este script guarda as quadras de cada cidade como arquivos JSON numa pasta do seu Drive
 * e entrega para o jogo por um link aberto (o link do "app da web").
 *
 *   Ler:     GET  .../exec?cidade=3514304            (código IBGE)  ou  ?nome=duartina|SP
 *   Listar:  GET  .../exec?lista=1                    (códigos que já existem; usado pelo robô)
 *   Gravar:  POST .../exec   corpo JSON (texto)       ver doPost
 *
 * Quem pode gravar:
 *   - jogador logado no Supabase: só cria cidade nova (não sobrescreve);
 *   - o robô do GitHub, com a SENHA_DO_ROBO: cria e atualiza.
 *
 * Instalação: veja o README do projeto (seção "Banco de quadras no Google Drive").
 * Depois de colar este código, rode uma vez a função  configurar  (menu Executar).
 */

const PASTA_PADRAO = 'Provedor Tycoon - quadras';
const MAX_BYTES = 3 * 1024 * 1024;   // 3 MB por cidade
const MAX_QUADRAS = 2000;

/* ---------- configuração (Propriedades do script) ---------- */
function props_() { return PropertiesService.getScriptProperties(); }
function pasta_() {
  const p = props_();
  let id = p.getProperty('PASTA_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* pasta apagada: cria outra */ } }
  const it = DriveApp.getFoldersByName(PASTA_PADRAO);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(PASTA_PADRAO);
  p.setProperty('PASTA_ID', f.getId());
  return f;
}

/** Rode uma vez depois de colar o código. Cria a pasta, gera a senha do robô e mostra o que falta. */
function configurar() {
  const p = props_();
  const f = pasta_();
  if (!p.getProperty('SENHA_DO_ROBO')) p.setProperty('SENHA_DO_ROBO', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8));
  const faltam = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter(k => !p.getProperty(k));
  Logger.log('Pasta das quadras: ' + f.getName() + ' (' + f.getUrl() + ')');
  Logger.log('SENHA_DO_ROBO (copie para o segredo QUADRAS_SENHA no GitHub): ' + p.getProperty('SENHA_DO_ROBO'));
  if (faltam.length) Logger.log('Falta preencher nas Propriedades do script: ' + faltam.join(', '));
  else Logger.log('Tudo pronto. Publique em Implantar → Nova implantação → App da Web.');
}

/** Gera uma senha nova para o robô (a antiga para de funcionar). */
function trocarSenhaDoRobo() {
  props_().setProperty('SENHA_DO_ROBO', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8));
  Logger.log('Nova SENHA_DO_ROBO: ' + props_().getProperty('SENHA_DO_ROBO'));
}

/* ---------- utilidades ---------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function chaveOk_(k) { return typeof k === 'string' && /^[0-9a-z| _-]{3,80}$/i.test(k); }
function nomeArquivo_(k) { return k.replace(/[^0-9a-z]+/gi, '_') + '.json'; }
function arquivo_(k) {
  const it = pasta_().getFilesByName(nomeArquivo_(k));
  return it.hasNext() ? it.next() : null;
}
function indice_() {
  const f = arquivo_('_indice');
  if (!f) return {};
  try { return JSON.parse(f.getBlob().getDataAsString()); } catch (e) { return {}; }
}
function salvarIndice_(idx) {
  const txt = JSON.stringify(idx);
  const f = arquivo_('_indice');
  if (f) f.setContent(txt); else pasta_().createFile(nomeArquivo_('_indice'), txt, 'application/json');
}
function quadrasValidas_(faces) {
  if (!Array.isArray(faces) || faces.length < 6 || faces.length > MAX_QUADRAS) return false;
  for (const q of faces) {
    if (!q || typeof q.a !== 'number' || !Array.isArray(q.p) || q.p.length < 3 || q.p.length > 300) return false;
    for (const pt of q.p) {
      if (!Array.isArray(pt) || pt.length !== 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') return false;
      if (pt[0] < -35 || pt[0] > 6 || pt[1] < -75 || pt[1] > -28) return false;   // dentro do Brasil
    }
  }
  return true;
}
function loginSupabaseOk_(token) {
  const p = props_(), url = p.getProperty('SUPABASE_URL'), key = p.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key || !token) return false;
  try {
    const r = UrlFetchApp.fetch(url.replace(/\/+$/, '') + '/auth/v1/user', {
      headers: { apikey: key, Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
    });
    if (r.getResponseCode() !== 200) return false;
    const u = JSON.parse(r.getContentText());
    return !!(u && u.id);
  } catch (e) { return false; }
}

/* ---------- leitura ---------- */
function doGet(e) {
  const q = (e && e.parameter) || {};
  try {
    if (q.lista) {
      const out = [];
      const it = pasta_().getFiles();
      while (it.hasNext()) { const n = it.next().getName(); if (n !== '_indice.json') out.push(n.replace(/\.json$/, '')); }
      return json_({ ok: true, chaves: out });
    }
    let k = chaveOk_(q.cidade) ? q.cidade : null;
    if (!k && chaveOk_(q.nome)) k = indice_()[q.nome] || q.nome;
    if (!k) return json_({ ok: false, erro: 'informe ?cidade=CÓDIGO_IBGE ou ?nome=cidade|UF' });
    let f = arquivo_(k);
    if (!f && chaveOk_(q.nome)) { const k2 = indice_()[q.nome]; if (k2) f = arquivo_(k2); }
    if (!f) return json_({ ok: false, erro: 'cidade ainda não está no banco' });
    const d = JSON.parse(f.getBlob().getDataAsString());
    return json_({ ok: true, cidade: d.city_key, nome: d.name, uf: d.uf, n: d.n, faces: d.faces });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

/* ---------- gravação ----------
   corpo: {"city_key":"3514304","name_key":"duartina|SP","name":"Duartina","uf":"SP","lat":..,"lon":..,
           "radius":2000,"faces":[...], "token":"<login do Supabase>" }   ou  "senha":"<SENHA_DO_ROBO>" */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = e && e.postData && e.postData.contents || '';
    if (raw.length > MAX_BYTES) return json_({ ok: false, erro: 'arquivo grande demais' });
    const d = JSON.parse(raw);
    const robo = !!d.senha && d.senha === props_().getProperty('SENHA_DO_ROBO');
    if (!robo && !loginSupabaseOk_(d.token)) return json_({ ok: false, erro: 'sem permissão: entre na sua conta' });
    if (!chaveOk_(d.city_key) || (d.name_key && !chaveOk_(d.name_key))) return json_({ ok: false, erro: 'chave da cidade inválida' });
    if (!quadrasValidas_(d.faces)) return json_({ ok: false, erro: 'quadras inválidas' });

    lock.waitLock(20000);
    const existe = arquivo_(d.city_key);
    if (existe && !robo) return json_({ ok: true, ja_existia: true });
    const doc = {
      city_key: d.city_key, name_key: d.name_key || null, name: String(d.name || '').slice(0, 80), uf: String(d.uf || '').slice(0, 2),
      lat: +d.lat || null, lon: +d.lon || null, radius: +d.radius || null, n: d.faces.length, faces: d.faces,
      source: robo ? 'robo' : 'jogo', updated_at: new Date().toISOString(),
    };
    const txt = JSON.stringify(doc);
    if (existe) existe.setContent(txt); else pasta_().createFile(nomeArquivo_(d.city_key), txt, 'application/json');
    if (d.name_key && d.name_key !== d.city_key) {
      const idx = indice_();
      if (idx[d.name_key] !== d.city_key) { idx[d.name_key] = d.city_key; salvarIndice_(idx); }
    }
    return json_({ ok: true, salvo: d.city_key, n: doc.n });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
