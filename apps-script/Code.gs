/**
 * Provedor Tycoon · Banco de quadras no Google Drive
 *
 * Este script guarda as quadras de cada cidade como arquivos JSON numa pasta do seu Drive
 * e entrega para o jogo por um link aberto (o link do "app da web").
 *
 *   Ler:     GET  .../exec?cidade=3514304            (código IBGE)  ou  ?nome=duartina|SP
 *   Listar:  GET  .../exec?lista=1                    (códigos que já existem; usado pelo robô)
 *   Regiões: GET  .../exec?regioes=1                  (cidades que os jogadores atendem; o robô desenha as vizinhas)
 *   Gravar:  POST .../exec   corpo JSON (texto)       ver doPost
 *   Região:  POST .../exec   {"acao":"regiao", ...}    o jogo avisa uma cidade que o jogador atende
 *   Mapa:    POST .../exec   {"acao":"geo", ...}       o jogo guarda o mapa da cidade (centro, tamanho e bairros) junto das quadras,
 *                                                       para a próxima abertura não precisar do OpenStreetMap nem dos Correios
 *   Acesso:  POST .../exec   {"acao":"acesso", ...}    aviso por e-mail quando alguém entra na conta (se o jogador deixou ligado);
 *                                                       sai do Gmail de quem publicou o script (MailApp, até 100 por dia na conta grátis)
 *   Código:  POST .../exec   {"acao":"codigo"} e {"acao":"conferir"}  código de 6 números para trocar a senha (Minha conta)
 *
 * Quem pode gravar:
 *   - jogador logado no Supabase: só cria cidade nova (não sobrescreve);
 *   - o robô do GitHub, com a SENHA_DO_ROBO: cria e atualiza.
 *
 * Instalação: veja o README do projeto (seção "Banco de quadras no Google Drive").
 * Depois de colar este código, rode uma vez a função  configurar  (menu Executar) e, para o código de senha e o
 * aviso de acesso, a função  autorizarEmail  (o Google pede a permissão de enviar e-mail).
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
/* Rode uma vez pelo editor (menu Executar) depois de colar uma versão nova: o Google pede a permissão de enviar
   e-mail (código de senha e aviso de acesso) e o registro mostra a cota do dia e o projeto Supabase configurado. */
function autorizarEmail() {
  const p = props_();
  Logger.log('E-mails que ainda dá para mandar hoje: ' + MailApp.getRemainingDailyQuota());
  Logger.log('SUPABASE_URL: ' + (p.getProperty('SUPABASE_URL') || '(vazia)'));
  Logger.log('SUPABASE_ANON_KEY: ' + (p.getProperty('SUPABASE_ANON_KEY') ? p.getProperty('SUPABASE_ANON_KEY').slice(0, 18) + '…' : '(vazia)'));
}

/* ---------- utilidades ---------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function chaveOk_(k) { return typeof k === 'string' && /^[0-9a-z| _-]{3,80}$/i.test(k); }
function nomeArquivo_(k) { return k.replace(/[^0-9a-z]+/gi, '_') + '.json'; }
/* O id de cada arquivo fica guardado nas Propriedades (F_<nome>): abrir por id é bem mais rápido que procurar por nome na pasta. */
function arquivo_(k) {
  const p = props_(), nome = nomeArquivo_(k), chave = 'F_' + nome, id = p.getProperty(chave);
  if (id) { try { const f = DriveApp.getFileById(id); if (!f.isTrashed()) return f; } catch (e) {} p.deleteProperty(chave); }
  const it = pasta_().getFilesByName(nome);
  const f = it.hasNext() ? it.next() : null;
  if (f) p.setProperty(chave, f.getId());
  return f;
}
function lerJson_(k) {
  const f = arquivo_(k);
  if (!f) return {};
  try { return JSON.parse(f.getBlob().getDataAsString()); } catch (e) { return {}; }
}
function salvarJson_(k, obj) {
  const txt = JSON.stringify(obj);
  const f = arquivo_(k);
  if (f) f.setContent(txt); else { const n = pasta_().createFile(nomeArquivo_(k), txt, 'application/json'); props_().setProperty('F_' + nomeArquivo_(k), n.getId()); }
}
function indice_() { return lerJson_('_indice'); }
function salvarIndice_(idx) { salvarJson_('_indice', idx); }
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
/* Mapa da cidade: centro, tamanho do tabuleiro e até 30 bairros com nome e posição dentro do Brasil. */
function geoValido_(g) {
  if (!g || typeof g !== 'object' || JSON.stringify(g).length > 20000) return false;
  if (!isFinite(g.lat) || !isFinite(g.lon) || !(g.side >= 500 && g.side <= 60000)) return false;
  if (!Array.isArray(g.bairros) || g.bairros.length < 1 || g.bairros.length > 30) return false;
  return g.bairros.every(function (b) { return b && typeof b.name === 'string' && b.name.length <= 80 && b.lat >= -35 && b.lat <= 6 && b.lon >= -75 && b.lon <= -28; });
}
/* Motivo da última recusa de login (vai na resposta, para o jogo mostrar o que corrigir). */
let MOTIVO_ = '';
function usuarioSupabase_(token) {
  const p = props_(), url = p.getProperty('SUPABASE_URL'), key = p.getProperty('SUPABASE_ANON_KEY');
  MOTIVO_ = '';
  if (!url || !key) { MOTIVO_ = 'Faltam SUPABASE_URL e SUPABASE_ANON_KEY nas Propriedades do script.'; return null; }
  if (!token) { MOTIVO_ = 'Entre na sua conta de novo.'; return null; }
  try {
    const r = UrlFetchApp.fetch(url.replace(/\/+$/, '') + '/auth/v1/user', {
      headers: { apikey: key, Authorization: 'Bearer ' + token }, muteHttpExceptions: true,
    });
    const st = r.getResponseCode();
    if (st !== 200) {
      // login de outro projeto ou chave errada: o Supabase do script não reconhece a conta
      MOTIVO_ = st === 401 || st === 403
        ? 'O Supabase das Propriedades do script (' + url.replace(/^https:\/\//, '').split('.')[0] + ') não reconheceu o login: confira SUPABASE_URL e SUPABASE_ANON_KEY.'
        : 'O Supabase respondeu ' + st + ' ao conferir o login.';
      return null;
    }
    const u = JSON.parse(r.getContentText());
    return u && u.id ? u : null;
  } catch (e) { MOTIVO_ = 'Não deu para falar com o Supabase: ' + e; return null; }
}
/* Diagnóstico: {"acao":"quem","token":"..."} responde o e-mail da conta ou o motivo da recusa. */
function quem_(d) {
  const u = usuarioSupabase_(d.token);
  const p = props_().getProperty('SUPABASE_URL') || '';
  return json_(u ? { ok: true, email: u.email, projeto: p.replace(/^https:\/\//, '').split('.')[0] } : { ok: false, erro: MOTIVO_ });
}
function loginSupabaseOk_(token) { return !!usuarioSupabase_(token); }

/* ---------- aviso de acesso ----------
   corpo: {"acao":"acesso","token":"<login do Supabase>","device":"Chrome no Android","method":"senha","site":"https://..."}
   Só manda para o e-mail da própria conta, se user_metadata.loginAlert não for false, no máximo 1 a cada 10 min por conta. */
function esc_(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function acesso_(d) {
  const u = usuarioSupabase_(d.token);
  if (!u || !u.email) return json_({ ok: false, erro: MOTIVO_ || 'sem permissão: entre na sua conta' });
  const meta = u.user_metadata || {};
  if (meta.loginAlert === false) return json_({ ok: true, enviado: false, motivo: 'desligado' });
  const cache = CacheService.getScriptCache(), ck = 'acesso_' + u.id;
  if (cache.get(ck)) return json_({ ok: true, enviado: false, motivo: 'aviso recente' });
  cache.put(ck, '1', 600);
  const metodos = { senha: 'e-mail e senha', facebook: 'Facebook', link: 'link do e-mail', codigo: 'código do e-mail' };
  const dev = esc_(String(d.device || 'aparelho').slice(0, 80));
  const met = esc_(metodos[d.method] || 'e-mail e senha');
  const site = /^https:\/\/[^\s"'<>]{4,200}$/.test(String(d.site || '')) ? String(d.site).replace(/\/+$/, '') : '';
  const quando = Utilities.formatDate(new Date(), 'America/Sao_Paulo', "dd/MM/yyyy 'às' HH:mm");
  const nome = esc_(String(meta.name || '').slice(0, 40));
  const fundo = site ? site + '/templates%20email/cidade.jpg' : '';
  const titulo = "font-family:'Lilita One','Arial Black',Arial,sans-serif;";
  const html =
    '<div style="margin:0;padding:24px 12px;background:#2a83d8;font-family:Arial,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto">' +
    '<div style="height:120px;border:3px solid #1b2a4a;border-bottom:0;border-radius:18px 18px 0 0;background:#2a83d8' +
      (fundo ? " url('" + fundo + "') center/cover no-repeat" : '') + ';padding:0 22px;position:relative">' +
      '<div style="' + titulo + 'position:absolute;left:22px;bottom:14px;font-size:28px;color:#fff;text-shadow:0 2px 0 #1b2a4a,2px 0 0 #1b2a4a,-2px 0 0 #1b2a4a,0 -2px 0 #1b2a4a">Provedor Tycoon</div></div>' +
    '<div style="background:#fff8ea;border:3px solid #1b2a4a;border-radius:0 0 18px 18px;padding:22px 24px;color:#1b2a4a">' +
      '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#5a6a88">CONTA</div>' +
      '<div style="' + titulo + 'font-size:24px;color:#8a5a2b;margin:4px 0 12px">Novo acesso à sua conta</div>' +
      '<p style="font-size:16px;line-height:1.5;margin:0 0 14px">' + (nome ? 'Oi, ' + nome + '! ' : 'Oi! ') +
        'Alguém acabou de entrar na conta <b>' + esc_(u.email) + '</b>.</p>' +
      '<div style="background:#d4f1ea;border:2px solid #0f9a8d;border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.6;margin:0 0 16px">' +
        '📱 <b>' + dev + '</b><br>🔑 Entrou com ' + met + '<br>🕒 ' + quando + ' (horário de Brasília)</div>' +
      '<p style="font-size:15px;line-height:1.5;margin:0 0 8px">Foi você? Então está tudo certo, não precisa fazer nada.</p>' +
      '<p style="font-size:15px;line-height:1.5;margin:0 0 16px"><b>Não foi você?</b> Abra o jogo, vá em <b>Menu → Minha conta → Trocar a senha</b> e peça o código.</p>' +
      (site ? '<p style="text-align:center;margin:0 0 6px"><a href="' + site + '" style="display:inline-block;background:#52cc3a;border:3px solid #1b2a4a;border-radius:14px;padding:12px 26px;color:#fff;font-weight:800;font-size:17px;text-decoration:none">Abrir o jogo</a></p>' : '') +
      '<p style="font-size:12px;color:#5a6a88;margin:14px 0 0">Para não receber mais este aviso: Menu → Minha conta → E-mails → Aviso de acesso à conta.</p>' +
    '</div></div></div>';
  try {
    MailApp.sendEmail({ to: u.email, subject: 'Novo acesso à sua conta do Provedor Tycoon', htmlBody: html, name: 'Provedor Tycoon' });
  } catch (e) {
    cache.remove(ck);
    return json_({ ok: false, erro: 'não deu para enviar: ' + e });
  }
  return json_({ ok: true, enviado: true });
}

/* ---------- código para trocar a senha ----------
   {"acao":"codigo","token":"...","site":"https://..."}            gera 6 números, guarda 10 min e manda para o e-mail da conta
   {"acao":"conferir","token":"...","codigo":"123456"}             confere (até 5 tentativas); certo, o jogo grava a senha nova
   O código fica só no cache do script (nunca no Drive) e é apagado ao acertar ou ao estourar as tentativas. */
function cartaHtml_(site, titulo, corpo) {
  const fundo = site ? site + '/templates%20email/cidade.jpg' : '';
  const fonte = "font-family:'Lilita One','Arial Black',Arial,sans-serif;";
  return '<div style="margin:0;padding:24px 12px;background:#2a83d8;font-family:Arial,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto">' +
    '<div style="height:120px;border:3px solid #1b2a4a;border-bottom:0;border-radius:18px 18px 0 0;background:#2a83d8' +
      (fundo ? " url('" + fundo + "') center/cover no-repeat" : '') + ';position:relative">' +
      '<div style="' + fonte + 'position:absolute;left:22px;bottom:14px;font-size:28px;color:#fff;text-shadow:0 2px 0 #1b2a4a,2px 0 0 #1b2a4a,-2px 0 0 #1b2a4a,0 -2px 0 #1b2a4a">Provedor Tycoon</div></div>' +
    '<div style="background:#fff8ea;border:3px solid #1b2a4a;border-radius:0 0 18px 18px;padding:22px 24px;color:#1b2a4a">' +
      '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#5a6a88">CONTA</div>' +
      '<div style="' + fonte + 'font-size:24px;color:#8a5a2b;margin:4px 0 12px">' + titulo + '</div>' + corpo +
    '</div></div></div>';
}
function siteOk_(s) { return /^https:\/\/[^\s"'<>]{4,200}$/.test(String(s || '')) ? String(s).replace(/\/+$/, '') : ''; }
function codigo_(d) {
  const u = usuarioSupabase_(d.token);
  if (!u || !u.email) return json_({ ok: false, erro: MOTIVO_ || 'Entre na sua conta de novo.' });
  const cache = CacheService.getScriptCache(), ck = 'cod_' + u.id;
  const velho = JSON.parse(cache.get(ck) || 'null');
  if (velho && Date.now() - velho.t < 60000) return json_({ ok: false, erro: 'Aguarde um minuto para pedir outro código.' });
  const cod = String(Math.floor(100000 + Math.random() * 900000));
  cache.put(ck, JSON.stringify({ c: cod, n: 0, t: Date.now() }), 600);
  const nome = esc_(String((u.user_metadata || {}).name || '').slice(0, 40));
  const corpo =
    '<p style="font-size:16px;line-height:1.5;margin:0 0 14px">' + (nome ? 'Oi, ' + nome + '! ' : 'Oi! ') +
      'Use este código no jogo, em <b>Minha conta → Trocar a senha</b>:</p>' +
    '<div style="text-align:center;margin:0 0 16px"><span style="display:inline-block;background:#fff;border:3px dashed #1b2a4a;border-radius:14px;padding:12px 26px;font-family:\'Courier New\',monospace;font-size:34px;font-weight:700;letter-spacing:8px;color:#1b2a4a">' + cod + '</span></div>' +
    '<div style="background:#d4f1ea;border:2px solid #0f9a8d;border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.5;margin:0 0 14px">🔒 Vale por <b>10 minutos</b> e só para a conta <b>' + esc_(u.email) + '</b>. Ninguém do jogo vai pedir este código.</div>' +
    '<p style="font-size:13px;color:#5a6a88;margin:0">Não pediu para trocar a senha? Ignore este e-mail: a senha atual continua valendo.</p>';
  try {
    MailApp.sendEmail({ to: u.email, subject: 'Seu código: ' + cod + ' · Provedor Tycoon', htmlBody: cartaHtml_(siteOk_(d.site), 'Código para trocar a senha', corpo), name: 'Provedor Tycoon' });
  } catch (e) {
    cache.remove(ck);
    return json_({ ok: false, erro: 'Não deu para enviar o e-mail agora.' });
  }
  return json_({ ok: true });
}
function conferir_(d) {
  const u = usuarioSupabase_(d.token);
  if (!u) return json_({ ok: false, erro: MOTIVO_ || 'Entre na sua conta de novo.' });
  const cache = CacheService.getScriptCache(), ck = 'cod_' + u.id, v = JSON.parse(cache.get(ck) || 'null');
  if (!v) return json_({ ok: false, erro: 'Código vencido. Peça outro.' });
  if (String(d.codigo || '').replace(/\D/g, '') !== v.c) {
    v.n++;
    if (v.n >= 5) { cache.remove(ck); return json_({ ok: false, erro: 'Muitas tentativas erradas. Peça outro código.' }); }
    cache.put(ck, JSON.stringify(v), 600);
    return json_({ ok: false, erro: 'Código errado. Restam ' + (5 - v.n) + ' tentativas.' });
  }
  cache.remove(ck);
  return json_({ ok: true });
}

/* ---------- leitura ---------- */
function doGet(e) {
  const q = (e && e.parameter) || {};
  try {
    if (q.lista) {
      const out = [];
      const it = pasta_().getFiles();
      while (it.hasNext()) { const n = it.next().getName(); if (n.charAt(0) !== '_') out.push(n.replace(/\.json$/, '')); }
      return json_({ ok: true, chaves: out });
    }
    if (q.regioes) {
      const reg = lerJson_('_regioes');
      return json_({ ok: true, regioes: Object.keys(reg).map(function (k) { return Object.assign({ codigo: k }, reg[k]); }) });
    }
    let k = chaveOk_(q.cidade) ? q.cidade : null;
    if (!k && chaveOk_(q.nome)) k = indice_()[q.nome] || q.nome;
    if (!k) return json_({ ok: false, erro: 'informe ?cidade=CÓDIGO_IBGE ou ?nome=cidade|UF' });
    let f = arquivo_(k);
    if (!f && chaveOk_(q.nome)) { const k2 = indice_()[q.nome]; if (k2) f = arquivo_(k2); }
    if (!f) return json_({ ok: false, erro: 'cidade ainda não está no banco' });
    const d = JSON.parse(f.getBlob().getDataAsString());
    return json_({ ok: true, cidade: d.city_key, nome: d.name, uf: d.uf, n: d.n, faces: d.faces, geo: d.geo || null });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

/* ---------- regiões dos jogadores ----------
   corpo: {"acao":"regiao","city_key":"3514502","name":"Duartina","uf":"SP","lat":..,"lon":..,"token":"..."}
   Guarda em _regioes.json as cidades que algum jogador atende. O robô desenha primeiro as cidades em volta delas. */
function regiao_(d, lock) {
  const lat = +d.lat, lon = +d.lon;
  if (!/^\d{7}$/.test(d.city_key)) return json_({ ok: false, erro: 'use o código IBGE da cidade' });
  if (!(lat >= -35 && lat <= 6 && lon >= -75 && lon <= -28)) return json_({ ok: false, erro: 'posição fora do Brasil' });
  lock.waitLock(20000);
  const reg = lerJson_('_regioes'), prev = reg[d.city_key];
  reg[d.city_key] = {
    nome: String(d.name || '').slice(0, 80), uf: String(d.uf || '').slice(0, 2),
    lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4,
    jogadores: ((prev && prev.jogadores) || 0) + 1, desde: (prev && prev.desde) || new Date().toISOString(),
  };
  salvarJson_('_regioes', reg);
  return json_({ ok: true, regiao: d.city_key });
}

/* ---------- mapa da cidade ----------
   corpo: {"acao":"geo","city_key":"3514502","name_key":"duartina|SP","geo":{lat,lon,side,bairros:[...]},"token":"..."}
   Só completa uma cidade que já tem quadras e ainda não tem mapa (o robô pode trocar). */
function geo_(d, robo, lock) {
  if (!geoValido_(d.geo)) return json_({ ok: false, erro: 'mapa da cidade inválido' });
  lock.waitLock(20000);
  let f = arquivo_(d.city_key);
  if (!f && d.name_key) { const k2 = indice_()[d.name_key]; if (k2) f = arquivo_(k2); }
  if (!f) return json_({ ok: false, erro: 'cidade ainda não está no banco' });
  const doc = JSON.parse(f.getBlob().getDataAsString());
  if (doc.geo && !robo) return json_({ ok: true, ja_existia: true });
  doc.geo = d.geo; doc.updated_at = new Date().toISOString();
  f.setContent(JSON.stringify(doc));
  return json_({ ok: true, geo: d.city_key });
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
    if (d.acao === 'quem') return quem_(d);
    if (d.acao === 'acesso') return acesso_(d);
    if (d.acao === 'codigo') return codigo_(d);
    if (d.acao === 'conferir') return conferir_(d);
    const robo = !!d.senha && d.senha === props_().getProperty('SENHA_DO_ROBO');
    if (!robo && !loginSupabaseOk_(d.token)) return json_({ ok: false, erro: 'sem permissão: entre na sua conta' });
    if (!chaveOk_(d.city_key) || (d.name_key && !chaveOk_(d.name_key))) return json_({ ok: false, erro: 'chave da cidade inválida' });
    if (d.acao === 'regiao') return regiao_(d, lock);
    if (d.acao === 'geo') return geo_(d, robo, lock);
    if (!quadrasValidas_(d.faces)) return json_({ ok: false, erro: 'quadras inválidas' });

    lock.waitLock(20000);
    const existe = arquivo_(d.city_key);
    if (existe && !robo) return json_({ ok: true, ja_existia: true });
    const doc = {
      city_key: d.city_key, name_key: d.name_key || null, name: String(d.name || '').slice(0, 80), uf: String(d.uf || '').slice(0, 2),
      lat: +d.lat || null, lon: +d.lon || null, radius: +d.radius || null, n: d.faces.length, faces: d.faces,
      geo: geoValido_(d.geo) ? d.geo : ((existe && JSON.parse(existe.getBlob().getDataAsString()).geo) || null),
      source: robo ? 'robo' : 'jogo', updated_at: new Date().toISOString(),
    };
    const txt = JSON.stringify(doc);
    if (existe) existe.setContent(txt); else { const n = pasta_().createFile(nomeArquivo_(d.city_key), txt, 'application/json'); props_().setProperty('F_' + nomeArquivo_(d.city_key), n.getId()); }
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
