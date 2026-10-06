/* Provedor Tycoon · andar em 3D (Three.js, vendor/three). Carregado só quando o jogador abre um andar.
   Floor3D.open(elemento, dados) monta a sala com a equipe do andar e devolve {dispose}.
   dados: {id, name, emoji, color, ops, n2, sup, ger, headset, title}
   Operadores sentados digitando, N2 de roxo, supervisores andando pelos corredores, gerente na sala de vidro
   (de vez em quando dá uma volta) e gente indo tomar café. Arrastar gira, pinça/roda aproxima. */
(function () {
  const T = window.THREE;
  const MAX_OPS = 48, MAX_N2 = 8, MAX_SUP = 6;

  function open(el, d) {
    if (!T) throw new Error('Three.js não carregou');
    const disposables = [];
    const keep = o => (disposables.push(o), o);
    const geo = {}, mat = {};
    const G = (k, f) => geo[k] || (geo[k] = keep(f()));
    const M = (k, f) => mat[k] || (mat[k] = keep(f()));
    const lam = (c, extra) => new T.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));

    // ---------- renderizador, cena e câmera ----------
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
    const scene = new T.Scene();
    scene.background = new T.Color('#9fd8f7');
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0x9a8f7a, 1.15));
    const sun = new T.DirectionalLight(0xffffff, 1.35); sun.position.set(8, 16, 10); scene.add(sun);

    // ---------- tamanho da sala pela equipe ----------
    const nOps = Math.min(MAX_OPS, d.ops | 0), nN2 = Math.min(MAX_N2, d.n2 | 0), nSup = Math.min(MAX_SUP, d.sup | 0), hasGer = (d.ger | 0) > 0;
    const seats = Math.max(4, nOps + nN2);
    const cols = Math.max(3, Math.min(7, Math.ceil(Math.sqrt(seats * 0.75))));
    const pods = Math.max(1, Math.ceil(seats / (cols * 2)));
    const PX = 1.6, PZ = 3.6;                  // passo das mesas (x) e dos blocos (z)
    const deskW = cols * PX;
    const W = Math.max(13, deskW + 7.5), D = 4.8 + pods * PZ + 2.2;
    const x0 = -W / 2 + 3.6;                    // corredor da esquerda (café) e da direita
    const z0 = -D / 2 + 5.4;                    // depois da faixa da sala do gerente
    const sideL = x0 - 1.3, sideR = x0 + deskW + 0.3;
    const accent = new T.Color(d.color || '#2a83d8'), WHITE = new T.Color('#ffffff');
    const signX = Math.min(x0 + deskW / 2 - PX / 2, W / 2 - 6.4);

    // ---------- piso e paredes (casa de boneca: só fundo e esquerda) ----------
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
      g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#dccca9';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 64, j * 64, 64, 64);
      g.strokeStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
      const tx = keep(new T.CanvasTexture(cv)); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(W / 4, D / 4); tx.colorSpace = T.SRGBColorSpace;
      const floor = new T.Mesh(keep(new T.BoxGeometry(W, 0.2, D)), keep(lam(0xffffff, { map: tx })));
      floor.position.y = -0.1; scene.add(floor);
      const base = new T.Mesh(keep(new T.BoxGeometry(W + 0.4, 0.5, D + 0.4)), keep(lam('#1b2a4a')));
      base.position.y = -0.45; scene.add(base);
    }
    const wallM = keep(lam('#fff8ea')), trimM = keep(lam('#1b2a4a')), glassSky = keep(new T.MeshBasicMaterial({ color: '#bfe7ff' }));
    const H = 3.2;
    const back = new T.Mesh(keep(new T.BoxGeometry(W, H, 0.25)), wallM); back.position.set(0, H / 2, -D / 2 - 0.12); scene.add(back);
    const left = new T.Mesh(keep(new T.BoxGeometry(0.25, H, D)), wallM); left.position.set(-W / 2 - 0.12, H / 2, 0); scene.add(left);
    const rodapeB = new T.Mesh(keep(new T.BoxGeometry(W, 0.18, 0.28)), trimM); rodapeB.position.set(0, 0.09, -D / 2 - 0.1); scene.add(rodapeB);
    const rodapeL = new T.Mesh(keep(new T.BoxGeometry(0.28, 0.18, D)), trimM); rodapeL.position.set(-W / 2 - 0.1, 0.09, 0); scene.add(rodapeL);
    // janelas na parede da esquerda
    const winG = keep(new T.BoxGeometry(0.05, 1.3, 1.6)), frameG = keep(new T.BoxGeometry(0.08, 1.46, 1.76));
    for (let z = -D / 2 + 2.2; z < D / 2 - 1; z += 2.6) {
      const f = new T.Mesh(frameG, trimM); f.position.set(-W / 2 + 0.03, 1.75, z); scene.add(f);
      const w = new T.Mesh(winG, glassSky); w.position.set(-W / 2 + 0.07, 1.75, z); scene.add(w);
    }

    // ---------- placa do setor ----------
    {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const g = cv.getContext('2d');
      g.fillStyle = '#1b2a4a'; roundRect(g, 0, 0, 1024, 256, 48); g.fill();
      g.fillStyle = '#' + accent.getHexString(); roundRect(g, 14, 14, 996, 228, 38); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 120px "Lilita One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowOffsetY = 6; g.fillText((d.emoji ? d.emoji + ' ' : '') + d.name, 512, 136);
      const tx = keep(new T.CanvasTexture(cv)); tx.colorSpace = T.SRGBColorSpace;
      const sg = new T.Mesh(keep(new T.PlaneGeometry(3.4, 0.85)), keep(new T.MeshBasicMaterial({ map: tx, transparent: true })));
      sg.position.set(signX, 2.72, -D / 2 + 0.02); scene.add(sg);
    }

    // ---------- móveis ----------
    const deskTopG = G('deskTop', () => new T.BoxGeometry(1.4, 0.07, 0.8)), legG = G('leg', () => new T.BoxGeometry(0.06, 0.72, 0.06));
    const deskM = M('desk', () => lam('#ffffff')), legM = M('leg', () => lam('#8a93a6'));
    const monG = G('mon', () => new T.BoxGeometry(0.62, 0.4, 0.05)), monStandG = G('monStand', () => new T.BoxGeometry(0.06, 0.22, 0.06));
    const darkM = M('dark', () => lam('#22283a')), kbG = G('kb', () => new T.BoxGeometry(0.42, 0.03, 0.14)), kbM = M('kb', () => lam('#d6dbe6'));
    const scrG = G('scr', () => new T.PlaneGeometry(0.56, 0.34));
    const scrMs = [0, 1, 2, 3].map(i => keep(new T.MeshBasicMaterial({ color: accent.clone().lerp(new T.Color('#ffffff'), 0.25 + i * 0.08) })));
    const chairSeatG = G('cs', () => new T.BoxGeometry(0.48, 0.08, 0.46)), chairBackG = G('cb', () => new T.BoxGeometry(0.46, 0.5, 0.07)), chairPoleG = G('cp', () => new T.CylinderGeometry(0.04, 0.04, 0.42, 8));
    const chairM = M('chair', () => lam('#2b3f6b')), panelM = M('panel', () => lam(accent.clone().lerp(new T.Color('#ffffff'), 0.45)));

    function desk(x, z, face) { // face: +1 = pessoa do lado +z olhando para -z
      const g = new T.Group();
      const top = new T.Mesh(deskTopG, deskM); top.position.y = 0.74; g.add(top);
      for (const [lx, lz] of [[-0.64, -0.34], [0.64, -0.34], [-0.64, 0.34], [0.64, 0.34]]) { const l = new T.Mesh(legG, legM); l.position.set(lx, 0.36, lz); g.add(l); }
      const st = new T.Mesh(monStandG, darkM); st.position.set(0, 0.88, -0.22); g.add(st);
      const mon = new T.Mesh(monG, darkM); mon.position.set(0, 1.1, -0.22); g.add(mon);
      const sm = scrMs[(Math.random() * scrMs.length) | 0];
      const scr = new T.Mesh(scrG, sm); scr.position.set(0, 1.1, -0.19); g.add(scr);
      const kb = new T.Mesh(kbG, kbM); kb.position.set(0, 0.79, 0.12); g.add(kb);
      g.position.set(x, 0, z); g.rotation.y = face > 0 ? 0 : Math.PI; scene.add(g);
      return g;
    }
    function chair(x, z, face) {
      const g = new T.Group();
      const p = new T.Mesh(chairPoleG, legM); p.position.y = 0.22; g.add(p);
      const s = new T.Mesh(chairSeatG, chairM); s.position.y = 0.46; g.add(s);
      const b = new T.Mesh(chairBackG, chairM); b.position.set(0, 0.76, 0.24); g.add(b);
      g.position.set(x, 0, z); g.rotation.y = face > 0 ? 0 : Math.PI; scene.add(g); return g;
    }

    // ---------- pessoas ----------
    const SKIN = ['#f1c7a3', '#d9a27b', '#b97c56', '#8d5a3b', '#f5d4b8'], HAIR = ['#2b1d14', '#5a3a22', '#1b1b1b', '#a8743a', '#d9b26a', '#7a2f1f'];
    const legsG = G('legs', () => new T.BoxGeometry(0.13, 0.48, 0.13)), torsoG = G('torso', () => new T.CapsuleGeometry(0.21, 0.32, 4, 10));
    const headG = G('head', () => new T.SphereGeometry(0.17, 16, 12)), hairG = G('hair', () => new T.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55));
    const armG = G('arm', () => new T.BoxGeometry(0.09, 0.4, 0.09)), pantsM = M('pants', () => lam('#33415e'));
    const shadowG = G('shadow', () => new T.CircleGeometry(0.32, 20)), shadowM = M('shadow', () => new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false }));
    const hsG = G('hs', () => new T.TorusGeometry(0.19, 0.02, 6, 20, Math.PI)), hsM = M('hs', () => lam('#1b1b1b'));
    const tieG = G('tie', () => new T.BoxGeometry(0.07, 0.28, 0.03)), tieM = M('tie', () => lam('#e5a21e'));
    const shirt = c => M('shirt' + c, () => lam(c));
    const pick = a => a[(Math.random() * a.length) | 0];

    function person(shirtColor, opts) {
      opts = opts || {};
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const sh = new T.Mesh(shadowG, shadowM); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; g.add(sh);
      const legL = new T.Group(), legR = new T.Group();
      for (const [lg, x] of [[legL, -0.09], [legR, 0.09]]) { const m = new T.Mesh(legsG, pantsM); m.position.y = -0.24; lg.add(m); lg.position.set(x, 0.5, 0); body.add(lg); }
      const torso = new T.Mesh(torsoG, shirt(shirtColor)); torso.position.y = 0.92; body.add(torso);
      if (opts.tie) { const t = new T.Mesh(tieG, tieM); t.position.set(0, 0.98, 0.2); body.add(t); }
      const head = new T.Group(); head.position.y = 1.37; body.add(head);
      head.add(new T.Mesh(headG, M('skin' + (opts.skin || 0), () => lam(SKIN[opts.skin || 0]))));
      const hair = new T.Mesh(hairG, M('hair' + (opts.hair || 0), () => lam(HAIR[opts.hair || 0]))); hair.position.y = 0.03; hair.rotation.x = -0.25; head.add(hair);
      if (opts.headset) { const h = new T.Mesh(hsG, hsM); h.rotation.z = 0; h.position.y = 0.04; head.add(h); }
      const armL = new T.Group(), armR = new T.Group();
      for (const [ar, x] of [[armL, -0.27], [armR, 0.27]]) { const m = new T.Mesh(armG, shirt(shirtColor)); m.position.y = -0.18; ar.add(m); ar.position.set(x, 1.1, 0); body.add(ar); }
      scene.add(g);
      return { g, body, legL, legR, armL, armR, head, phase: Math.random() * 10, state: 'idle' };
    }
    const randLook = () => ({ skin: (Math.random() * SKIN.length) | 0, hair: (Math.random() * HAIR.length) | 0 });
    function sit(p, x, z, face) { // sentado na cadeira, olhando para a mesa
      p.g.position.set(x, 0, z); p.g.rotation.y = face > 0 ? Math.PI : 0;
      p.body.position.y = -0.04; p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2 + 0.1;
      p.armL.rotation.x = p.armR.rotation.x = -1.15; p.state = 'sit';
    }
    function stand(p) { p.body.position.y = 0; p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = p.armR.rotation.x = 0; }

    // ---------- mesas e equipe ----------
    const seatsList = []; // {x,z,face,chair}
    for (let r = 0; r < pods; r++) {
      const zc = z0 + r * PZ;
      const pan = new T.Mesh(keep(new T.BoxGeometry(deskW, 0.5, 0.05)), panelM); pan.position.set(x0 + deskW / 2 - PX / 2, 0.98, zc); scene.add(pan);
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * PX;
        desk(x, zc - 0.45, -1); seatsList.push({ x, z: zc - 1.25, face: -1, chair: chair(x, zc - 1.25, -1) });
        desk(x, zc + 0.45, 1); seatsList.push({ x, z: zc + 1.25, face: 1, chair: chair(x, zc + 1.25, 1) });
      }
    }
    // a frente da sala (perto da câmera) enche primeiro
    seatsList.sort((a, b) => b.z - a.z || a.x - b.x);
    const people = [];
    const seated = [];
    for (let i = 0; i < nOps + nN2; i++) {
      const s = seatsList[i]; if (!s) break;
      const n2 = i >= nOps;
      const p = person(n2 ? '#7a4fd6' : (d.color || '#2a83d8'), Object.assign(randLook(), { headset: d.headset || n2 }));
      sit(p, s.x, s.z, s.face); p.seat = s; p.role = n2 ? 'n2' : 'op'; seated.push(p); people.push(p);
    }

    // ---------- sala do gerente (vidro, canto do fundo à direita) ----------
    const ox1 = W / 2 - 4.3, oz2 = -D / 2 + 3.6;
    {
      const glass = keep(new T.MeshLambertMaterial({ color: '#bfe7ff', transparent: true, opacity: 0.32, depthWrite: false }));
      const gF = new T.Mesh(keep(new T.BoxGeometry(4.3 - 1.2, 2.3, 0.06)), glass); gF.position.set(ox1 + 1.2 + (4.3 - 1.2) / 2, 1.15, oz2); scene.add(gF);
      const gL = new T.Mesh(keep(new T.BoxGeometry(0.06, 2.3, 3.6)), glass); gL.position.set(ox1, 1.15, oz2 - 1.8); scene.add(gL);
      for (const [x, z, w, dd] of [[ox1 + 1.2 + (4.3 - 1.2) / 2, oz2, 4.3 - 1.2, 0.08], [ox1, oz2 - 1.8, 0.08, 3.6]]) { const tr = new T.Mesh(keep(new T.BoxGeometry(w, 0.08, dd)), trimM); tr.position.set(x, 2.32, z); scene.add(tr); }
      const big = new T.Mesh(keep(new T.BoxGeometry(1.8, 0.08, 0.9)), keep(lam('#8a5a2b'))); big.position.set(ox1 + 2.3, 0.76, oz2 - 2.2); scene.add(big);
      for (const [lx, lz] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) { const l = new T.Mesh(legG, legM); l.position.set(ox1 + 2.3 + lx, 0.36, oz2 - 2.2 + lz); scene.add(l); }
      const mon = new T.Mesh(monG, darkM); mon.position.set(ox1 + 2.3, 1.12, oz2 - 2.45); scene.add(mon);
      const sc = new T.Mesh(scrG, scrMs[0]); sc.position.set(ox1 + 2.3, 1.12, oz2 - 2.42); scene.add(sc);
      chair(ox1 + 2.3, oz2 - 1.45, 1);
      plant(ox1 + 3.9, oz2 - 3.2, 1.1);
    }
    let ger = null; const gerSeat = { x: ox1 + 2.3, z: oz2 - 1.45, face: 1 };
    if (hasGer) { ger = person('#1b2a4a', Object.assign(randLook(), { tie: true })); sit(ger, gerSeat.x, gerSeat.z, 1); ger.role = 'ger'; ger.seat = gerSeat; people.push(ger); }

    // ---------- canto do café (esquerda, perto da frente) ----------
    const cafe = { x: -W / 2 + 1.1, z: D / 2 - 2.0 };
    {
      const counter = new T.Mesh(keep(new T.BoxGeometry(0.9, 1.0, 2.2)), keep(lam('#c98a4a'))); counter.position.set(-W / 2 + 0.5, 0.5, cafe.z); scene.add(counter);
      const top = new T.Mesh(keep(new T.BoxGeometry(0.95, 0.06, 2.25)), deskM); top.position.set(-W / 2 + 0.5, 1.03, cafe.z); scene.add(top);
      const mac = new T.Mesh(keep(new T.BoxGeometry(0.4, 0.5, 0.4)), keep(lam('#3a3a3a'))); mac.position.set(-W / 2 + 0.45, 1.31, cafe.z - 0.5); scene.add(mac);
      const ml = new T.Mesh(keep(new T.BoxGeometry(0.02, 0.08, 0.08)), keep(new T.MeshBasicMaterial({ color: '#ff5a3c' }))); ml.position.set(-W / 2 + 0.66, 1.42, cafe.z - 0.5); scene.add(ml);
      const wat = new T.Mesh(keep(new T.CylinderGeometry(0.18, 0.18, 0.5, 16)), keep(new T.MeshLambertMaterial({ color: '#7cc7f2', transparent: true, opacity: 0.8 }))); wat.position.set(-W / 2 + 0.45, 1.31, cafe.z + 0.55); scene.add(wat);
      plant(-W / 2 + 0.6, D / 2 - 0.6, 1.3);
    }
    function plant(x, z, h) {
      const pot = new T.Mesh(G('pot', () => new T.CylinderGeometry(0.22, 0.17, 0.4, 12)), M('pot', () => lam('#c0623a'))); pot.position.set(x, 0.2, z); scene.add(pot);
      const leaf = new T.Mesh(G('leaf', () => new T.IcosahedronGeometry(0.42, 0)), M('leaf', () => lam('#3fae5a'))); leaf.position.set(x, 0.4 + h * 0.45, z); leaf.scale.set(1, h, 1); scene.add(leaf);
    }
    plant(W / 2 - 0.6, D / 2 - 0.6, 1.0); plant(sideL - 0.4, -D / 2 + 0.6, 1.2);

    // ---------- objetos do setor ----------
    const id = d.id;
    if (id === 'logistica' || id === 'tecnico') {
      const shelfM = M('shelf', () => lam('#8a93a6')), boxM = M('box', () => lam('#c9935a')), routerM = M('router', () => lam('#f2f2f2'));
      for (let k = 0; k < 2; k++) {
        const sx = sideL + 1.4 + k * 2.4, sz = -D / 2 + 0.45;
        for (let lv = 0; lv < 4; lv++) { const sh = new T.Mesh(G('shelfB', () => new T.BoxGeometry(2.0, 0.05, 0.6)), shelfM); sh.position.set(sx, 0.2 + lv * 0.55, sz); scene.add(sh);
          for (let b = 0; b < 3; b++) if (Math.random() < 0.8) { const bx = new T.Mesh(G('boxG', () => new T.BoxGeometry(0.45, 0.38, 0.45)), id === 'tecnico' && lv > 1 ? routerM : boxM); bx.position.set(sx - 0.6 + b * 0.6, 0.42 + lv * 0.55, sz); scene.add(bx); } }
        for (const px of [-0.98, 0.98]) { const pp = new T.Mesh(G('shelfP', () => new T.BoxGeometry(0.06, 2.0, 0.6)), shelfM); pp.position.set(sx + px, 1.0, sz); scene.add(pp); }
      }
    }
    let nocScreen = null, nocCtx = null, nocTx = null;
    if (id === 'noc' || id === 'comercial' || id === 'marketing') {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; nocCtx = cv.getContext('2d');
      nocTx = keep(new T.CanvasTexture(cv)); nocTx.colorSpace = T.SRGBColorSpace;
      const fr = new T.Mesh(keep(new T.BoxGeometry(2.95, 1.35, 0.06)), trimM); fr.position.set(signX, 1.5, -D / 2 + 0.02); scene.add(fr);
      nocScreen = new T.Mesh(keep(new T.PlaneGeometry(2.8, 1.2)), keep(new T.MeshBasicMaterial({ map: nocTx })));
      nocScreen.position.set(signX, 1.5, -D / 2 + 0.06); scene.add(nocScreen);
    }
    const graph = Array.from({ length: 40 }, () => 0.5);
    function drawBoard(t) {
      if (!nocCtx) return; const g = nocCtx;
      g.fillStyle = id === 'marketing' ? '#ffffff' : '#0f1d33'; g.fillRect(0, 0, 512, 256);
      if (id === 'marketing') {
        const cs = ['#ffd84d', '#ff9fb1', '#9fe0ff', '#b8f29f'];
        for (let i = 0; i < 12; i++) { g.fillStyle = cs[i % 4]; g.fillRect(24 + (i % 6) * 80, 30 + Math.floor(i / 6) * 110, 64, 64); }
        g.fillStyle = '#1b2a4a'; g.font = 'bold 22px sans-serif'; g.fillText('Campanhas do mês', 24, 238); return;
      }
      graph.push(Math.max(0.08, Math.min(0.95, graph[graph.length - 1] + (Math.random() - 0.5) * 0.18))); graph.shift();
      g.strokeStyle = id === 'noc' ? '#3fe08a' : '#ffc72c'; g.lineWidth = 4; g.beginPath();
      graph.forEach((v, i) => { const x = 16 + i * 12.3, y = 230 - v * 190; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.fillText(id === 'noc' ? 'Tráfego da rede' : 'Meta de vendas', 18, 32);
      nocTx.needsUpdate = true;
    }
    drawBoard(0);

    // ---------- supervisores andando ----------
    const walkers = [];
    for (let i = 0; i < nSup; i++) {
      const p = person('#0f9a8d', randLook()); stand(p); p.role = 'sup';
      const r = (Math.random() * pods) | 0; p.g.position.set(sideR, 0, z0 + r * PZ + PZ / 2);
      p.path = []; p.wait = Math.random() * 2; walkers.push(p); people.push(p);
    }
    const aisleZ = r => z0 + r * PZ + PZ / 2 - 0.0; // corredor entre blocos
    function routeTo(p, tx, tz) {
      const cx = p.g.position.x, cz = p.g.position.z;
      const side = Math.abs(cx - sideL) < Math.abs(cx - sideR) ? sideL : sideR;
      p.path = [[side, cz], [side, tz], [tx, tz]];
    }
    function supNext(p) {
      const r = (Math.random() * pods) | 0, z = Math.random() < 0.5 ? aisleZ(r) : z0 + r * PZ - PZ / 2 + 0.05;
      routeTo(p, x0 + Math.random() * (deskW - PX), Math.min(D / 2 - 0.8, Math.max(z0 - 2.0, z)));
    }

    // ---------- câmera (arrastar gira, pinça/roda aproxima) ----------
    const target = new T.Vector3(0, 0.6, -0.4);
    let theta = 0.62, phi = 0.98, rad = Math.max(W, D) * 1.12;
    const rMin = 5, rMax = Math.max(W, D) * 2.0;
    function placeCam() { camera.position.set(target.x + rad * Math.sin(phi) * Math.sin(theta), target.y + rad * Math.cos(phi), target.z + rad * Math.sin(phi) * Math.cos(theta)); camera.lookAt(target); }
    const ptr = new Map(); let pinch0 = 0, rad0 = rad;
    const cvEl = renderer.domElement;
    const onDown = e => { cvEl.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); rad0 = rad; } cvEl.style.cursor = 'grabbing'; };
    const onMove = e => {
      const p = ptr.get(e.pointerId); if (!p) return;
      if (ptr.size === 1) { theta = Math.max(0.02, Math.min(1.52, theta - (e.clientX - p.x) * 0.006)); phi = Math.max(0.45, Math.min(1.3, phi - (e.clientY - p.y) * 0.004)); }
      p.x = e.clientX; p.y = e.clientY;
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) rad = Math.max(rMin, Math.min(rMax, rad0 * pinch0 / dd)); }
    };
    const onUp = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch0 = 0; cvEl.style.cursor = 'grab'; };
    const onWheel = e => { e.preventDefault(); rad = Math.max(rMin, Math.min(rMax, rad * (e.deltaY > 0 ? 1.1 : 0.9))); };
    cvEl.addEventListener('pointerdown', onDown); cvEl.addEventListener('pointermove', onMove);
    cvEl.addEventListener('pointerup', onUp); cvEl.addEventListener('pointercancel', onUp);
    cvEl.addEventListener('wheel', onWheel, { passive: false });

    let fitted = false;
    function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 200; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      if (!fitted) { fitted = true; const a = w / h; rad = Math.max(W, D) * (a > 2 ? 0.82 : a > 1.5 ? 0.95 : 1.12); } }
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    // ---------- animação ----------
    const SPEED = 1.15;
    function walkStep(p, dt, t) {
      if (!p.path.length) return true;
      const [tx, tz] = p.path[0], dx = tx - p.g.position.x, dz = tz - p.g.position.z, dist = Math.hypot(dx, dz);
      if (dist < 0.05) { p.path.shift(); return !p.path.length; }
      const step = Math.min(dist, SPEED * dt); p.g.position.x += dx / dist * step; p.g.position.z += dz / dist * step;
      p.g.rotation.y = Math.atan2(dx, dz);
      const s = Math.sin(t * 9 + p.phase); p.legL.rotation.x = s * 0.55; p.legR.rotation.x = -s * 0.55; p.armL.rotation.x = -s * 0.45; p.armR.rotation.x = s * 0.45;
      p.body.position.y = Math.abs(Math.cos(t * 9 + p.phase)) * 0.04;
      return false;
    }
    let coffeeNext = 3, gerNext = 14, raf = 0, last = performance.now(), boardT = 0, alive = true;
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      // telas piscando
      scrMs.forEach((m, i) => { const k = 0.82 + 0.18 * Math.sin(t * (1.7 + i * 0.6) + i); m.color.copy(accent).lerp(WHITE, 0.2 + 0.25 * k); });
      // sentados digitando
      for (const p of seated) if (p.state === 'sit') { const s = Math.sin(t * 14 + p.phase * 3); p.armL.rotation.x = -1.15 + s * 0.08; p.armR.rotation.x = -1.15 - s * 0.08; p.head.rotation.y = Math.sin(t * 0.7 + p.phase) * 0.18; p.body.position.y = -0.04 + Math.sin(t * 2 + p.phase) * 0.005; }
      // supervisores
      for (const p of walkers) { if (p.wait > 0) { p.wait -= dt; p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = p.armR.rotation.x = 0; p.head.rotation.y = Math.sin(t * 1.3 + p.phase) * 0.5; continue; } if (walkStep(p, dt, t)) { p.wait = 1.5 + Math.random() * 3; supNext(p); } }
      // café: alguém levanta, vai até o café e volta
      coffeeNext -= dt;
      if (coffeeNext <= 0 && seated.length) {
        coffeeNext = 5 + Math.random() * 7;
        const away = seated.filter(p => p.state !== 'sit').length;
        if (away < Math.min(3, Math.ceil(seated.length / 6))) { const p = pick(seated.filter(q => q.state === 'sit')); if (p) { stand(p); p.state = 'toCafe'; p.g.position.z += p.seat.face * 0.45; p.path = []; routeTo(p, cafe.x + 0.6 + Math.random() * 0.4, cafe.z + (Math.random() - 0.5) * 1.2); p.path[0][0] = sideL; p.path[1][0] = sideL; } }
      }
      for (const p of seated) {
        if (p.state === 'toCafe') { if (walkStep(p, dt, t)) { p.state = 'cafe'; p.wait = 2.5 + Math.random() * 3; p.g.rotation.y = -Math.PI / 2; p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = 0; p.armR.rotation.x = -1.2; } }
        else if (p.state === 'cafe') { p.wait -= dt; p.armR.rotation.x = -1.2 + Math.sin(t * 2) * 0.25; if (p.wait <= 0) { p.state = 'back'; p.path = [[sideL, p.g.position.z], [sideL, p.seat.z + p.seat.face * 0.45], [p.seat.x, p.seat.z + p.seat.face * 0.45], [p.seat.x, p.seat.z]]; } }
        else if (p.state === 'back') { if (walkStep(p, dt, t)) sit(p, p.seat.x, p.seat.z, p.seat.face); }
      }
      // gerente dá uma volta pelo andar de vez em quando
      if (ger) {
        if (ger.state === 'sit') { ger.armL.rotation.x = -1.15 + Math.sin(t * 9) * 0.05; ger.armR.rotation.x = -1.15 - Math.sin(t * 9) * 0.05; gerNext -= dt;
          if (gerNext <= 0) { gerNext = 22 + Math.random() * 15; stand(ger); ger.state = 'tour'; const door = [ox1 + 0.6, oz2 + 0.5], tz = z0 + ((Math.random() * pods) | 0) * PZ + PZ / 2; ger.path = [[gerSeat.x, gerSeat.z + 0.6], [ox1 + 0.6, gerSeat.z + 0.6], door, [sideR, door[1]], [sideR, tz], [x0 + Math.random() * (deskW - PX), tz]]; } }
        else if (ger.state === 'tour') { if (walkStep(ger, dt, t)) { ger.state = 'look'; ger.wait = 3; } }
        else if (ger.state === 'look') { ger.wait -= dt; ger.legL.rotation.x = ger.legR.rotation.x = 0; ger.armL.rotation.x = ger.armR.rotation.x = 0; ger.head.rotation.y = Math.sin(t * 1.5) * 0.6;
          if (ger.wait <= 0) { ger.state = 'home'; const pz = ger.g.position.z; ger.path = [[sideR, pz], [sideR, oz2 + 0.5], [ox1 + 0.6, oz2 + 0.5], [ox1 + 0.6, gerSeat.z + 0.6], [gerSeat.x, gerSeat.z + 0.6], [gerSeat.x, gerSeat.z]]; } }
        else if (ger.state === 'home') { if (walkStep(ger, dt, t)) sit(ger, gerSeat.x, gerSeat.z, 1); }
      }
      boardT += dt; if (boardT > 0.5) { boardT = 0; drawBoard(t); }
      placeCam(); renderer.render(scene, camera);
    }
    placeCam(); raf = requestAnimationFrame(frame);

    function dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect();
      cvEl.removeEventListener('pointerdown', onDown); cvEl.removeEventListener('pointermove', onMove); cvEl.removeEventListener('pointerup', onUp); cvEl.removeEventListener('pointercancel', onUp); cvEl.removeEventListener('wheel', onWheel);
      for (const o of disposables) { try { o.dispose && o.dispose(); } catch (e) {} }
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      if (cvEl.parentNode) cvEl.parentNode.removeChild(cvEl);
    }
    return { dispose, shown: { ops: nOps, n2: nN2, sup: nSup, ger: hasGer ? 1 : 0 } };
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  window.Floor3D = { open };
})();
