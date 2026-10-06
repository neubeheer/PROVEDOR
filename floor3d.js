/* Provedor Tycoon · prédio em 3D (Three.js, vendor/three). Carregado só quando o jogador abre um andar.
   Floor3D.open(el, andar)  → visão de cima do andar (arrastar gira, pinça/roda aproxima).
   Floor3D.tour(el, config) → o jogador anda com o próprio personagem: recepção no térreo, elevador, painel de andares
                              e a equipe trabalhando (e falando com o chefe quando ele passa).
   andar: {id, name, emoji, color, headset, ops, n2, sup, ger, eff, op}
   config: {floors:[{id:'lobby'|setor, label, name, data}], start, lobby:{company, clients, level}, player:{name, color}, sfx} */
(function () {
  const T = window.THREE;
  const MAX_OPS = 48, MAX_N2 = 8, MAX_SUP = 6;
  const SKIN = ['#f1c7a3', '#d9a27b', '#b97c56', '#8d5a3b', '#f5d4b8'], HAIR = ['#2b1d14', '#5a3a22', '#1b1b1b', '#a8743a', '#d9b26a', '#7a2f1f'];
  const pick = a => a[(Math.random() * a.length) | 0];
  const randLook = () => ({ skin: (Math.random() * SKIN.length) | 0, hair: (Math.random() * HAIR.length) | 0 });

  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ---------- contexto de um cenário (andar ou recepção): tudo que for criado é descartado junto ---------- */
  function mkCtx(scene) {
    const root = new T.Group(); scene.add(root);
    const list = [], geo = {}, mat = {};
    const ctx = {
      root, keep: o => (list.push(o), o),
      G: (k, f) => geo[k] || (geo[k] = ctx.keep(f())),
      M: (k, f) => mat[k] || (mat[k] = ctx.keep(f())),
      lam: (c, extra) => ctx.keep(new T.MeshLambertMaterial(Object.assign({ color: c }, extra || {}))),
      add: (m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); root.add(m); return m; },
      box: (w, h, d, matl, x, y, z) => ctx.add(new T.Mesh(ctx.keep(new T.BoxGeometry(w, h, d)), matl), x, y, z),
      colliders: [],
      solid: (x1, z1, x2, z2) => ctx.colliders.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2) }),
      dispose: () => { scene.remove(root); for (const o of list) { try { o.dispose && o.dispose(); } catch (e) {} } },
    };
    return ctx;
  }
  function textTex(ctx, w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const tx = ctx.keep(new T.CanvasTexture(cv)); tx.colorSpace = T.SRGBColorSpace; tx.userData.cv = cv; return tx; }

  /* ---------- pessoas ---------- */
  function person(ctx, shirtColor, opts) {
    opts = opts || {};
    const { G, M, lam } = ctx;
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const sh = new T.Mesh(G('shadow', () => new T.CircleGeometry(0.32, 20)), M('shadow', () => new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false })));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; g.add(sh);
    const shirt = M('shirt' + shirtColor, () => lam(shirtColor)), pants = M('pants' + (opts.pants || ''), () => lam(opts.pants || '#33415e'));
    const legL = new T.Group(), legR = new T.Group();
    for (const [lg, x] of [[legL, -0.09], [legR, 0.09]]) { const m = new T.Mesh(G('legs', () => new T.BoxGeometry(0.13, 0.48, 0.13)), pants); m.position.y = -0.24; lg.add(m); lg.position.set(x, 0.5, 0); body.add(lg); }
    const torso = new T.Mesh(G('torso', () => new T.CapsuleGeometry(0.21, 0.32, 4, 10)), shirt); torso.position.y = 0.92; body.add(torso);
    if (opts.tie) { const t = new T.Mesh(G('tie', () => new T.BoxGeometry(0.07, 0.28, 0.03)), M('tie', () => lam('#e5a21e'))); t.position.set(0, 0.98, 0.2); body.add(t); }
    const head = new T.Group(); head.position.y = 1.37; body.add(head);
    head.add(new T.Mesh(G('head', () => new T.SphereGeometry(0.17, 16, 12)), M('skin' + (opts.skin || 0), () => lam(SKIN[opts.skin || 0]))));
    const hair = new T.Mesh(G('hair', () => new T.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), M('hair' + (opts.hair || 0), () => lam(HAIR[opts.hair || 0]))); hair.position.y = 0.03; hair.rotation.x = -0.25; head.add(hair);
    if (opts.headset) { const h = new T.Mesh(G('hs', () => new T.TorusGeometry(0.19, 0.02, 6, 20, Math.PI)), M('hs', () => lam('#1b1b1b'))); h.position.y = 0.04; head.add(h); }
    if (opts.cap) { const cm = M('cap', () => lam(opts.cap)); const c = new T.Mesh(G('cap', () => new T.CylinderGeometry(0.19, 0.2, 0.1, 16)), cm); c.position.y = 0.13; head.add(c); const v = new T.Mesh(G('visor', () => new T.BoxGeometry(0.22, 0.03, 0.16)), cm); v.position.set(0, 0.1, 0.17); head.add(v); }
    const armL = new T.Group(), armR = new T.Group();
    for (const [ar, x] of [[armL, -0.27], [armR, 0.27]]) { const m = new T.Mesh(G('arm', () => new T.BoxGeometry(0.09, 0.4, 0.09)), shirt); m.position.y = -0.18; ar.add(m); ar.position.set(x, 1.1, 0); body.add(ar); }
    ctx.root.add(g);
    return { g, body, legL, legR, armL, armR, head, phase: Math.random() * 10, state: 'idle', path: [], wait: 0, talkAt: -99 };
  }
  function sit(p, x, z, face) { p.g.position.set(x, 0, z); p.g.rotation.y = face > 0 ? Math.PI : 0; p.body.position.y = -0.04; p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2 + 0.1; p.armL.rotation.x = p.armR.rotation.x = -1.15; p.state = 'sit'; }
  function stand(p) { p.body.position.y = 0; p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = p.armR.rotation.x = 0; }
  function walkPose(p, t, speed) { const f = 6 + speed * 2.6, s = Math.sin(t * f + p.phase); p.legL.rotation.x = s * 0.55; p.legR.rotation.x = -s * 0.55; p.armL.rotation.x = -s * 0.45; p.armR.rotation.x = s * 0.45; p.body.position.y = Math.abs(Math.cos(t * f + p.phase)) * 0.04; }
  function idlePose(p, t) { p.legL.rotation.x = p.legR.rotation.x = 0; p.armL.rotation.x = p.armR.rotation.x = 0; p.body.position.y = Math.sin(t * 2 + p.phase) * 0.008; }
  function walkStep(p, dt, t, speed) {
    if (!p.path.length) return true;
    const [tx, tz] = p.path[0], dx = tx - p.g.position.x, dz = tz - p.g.position.z, dist = Math.hypot(dx, dz);
    if (dist < 0.05) { p.path.shift(); return !p.path.length; }
    const sp = speed || 1.15, step = Math.min(dist, sp * dt); p.g.position.x += dx / dist * step; p.g.position.z += dz / dist * step;
    p.g.rotation.y = Math.atan2(dx, dz); walkPose(p, t, sp);
    return false;
  }

  /* ---------- móveis e paredes ---------- */
  function plant(ctx, x, z, h) {
    ctx.add(new T.Mesh(ctx.G('pot', () => new T.CylinderGeometry(0.22, 0.17, 0.4, 12)), ctx.M('pot', () => ctx.lam('#c0623a'))), x, 0.2, z);
    const leaf = ctx.add(new T.Mesh(ctx.G('leaf', () => new T.IcosahedronGeometry(0.42, 0)), ctx.M('leaf', () => ctx.lam('#3fae5a'))), x, 0.4 + h * 0.45, z); leaf.scale.set(1, h, 1);
    ctx.solid(x - 0.3, z - 0.3, x + 0.3, z + 0.3);
  }
  function floorAndWalls(ctx, W, D, opts) {
    const H = 3.2;
    const tx = textTex(ctx, 256, 256, (g) => {
      g.fillStyle = opts.floorA || '#e9dcc0'; g.fillRect(0, 0, 256, 256); g.fillStyle = opts.floorB || '#dccca9';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 64, j * 64, 64, 64);
      g.strokeStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
    });
    tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(W / 4, D / 4);
    ctx.box(W, 0.2, D, ctx.lam(0xffffff, { map: tx }), 0, -0.1, 0);
    ctx.box(W + 0.4, 0.5, D + 0.4, ctx.lam('#1b2a4a'), 0, -0.45, 0);
    const wallM = ctx.lam(opts.wall || '#fff8ea'), trimM = ctx.lam('#1b2a4a');
    ctx.box(W, H, 0.25, wallM, 0, H / 2, -D / 2 - 0.12);
    ctx.box(W, 0.18, 0.28, trimM, 0, 0.09, -D / 2 - 0.1);
    // parede da esquerda com o vão do elevador
    const ez = opts.ez, z1 = ez - 0.78, z2 = ez + 0.78;
    ctx.box(0.25, H, z1 + D / 2, wallM, -W / 2 - 0.12, H / 2, (-D / 2 + z1) / 2);
    ctx.box(0.25, H, D / 2 - z2, wallM, -W / 2 - 0.12, H / 2, (z2 + D / 2) / 2);
    ctx.box(0.25, H - 2.35, z2 - z1, wallM, -W / 2 - 0.12, 2.35 + (H - 2.35) / 2, ez);
    ctx.box(0.28, 0.18, z1 + D / 2, trimM, -W / 2 - 0.1, 0.09, (-D / 2 + z1) / 2);
    ctx.box(0.28, 0.18, D / 2 - z2, trimM, -W / 2 - 0.1, 0.09, (z2 + D / 2) / 2);
    // frente e direita: só aparecem na primeira pessoa (na visão de cima a sala fica aberta, como casa de boneca)
    ctx.fpWalls = [];
    const fpw = (w, h, d, x, y, z) => { const m = ctx.box(w, h, d, wallM, x, y, z); m.visible = false; ctx.fpWalls.push(m); };
    fpw(0.25, H, D + 0.5, W / 2 + 0.12, H / 2, 0);
    if (opts.gap) { const g1 = opts.gap.x - opts.gap.w / 2, g2 = opts.gap.x + opts.gap.w / 2;
      fpw(g1 + W / 2, H, 0.25, (-W / 2 + g1) / 2, H / 2, D / 2 + 0.12); fpw(W / 2 - g2, H, 0.25, (g2 + W / 2) / 2, H / 2, D / 2 + 0.12); fpw(g2 - g1, H - 2.5, 0.25, opts.gap.x, 2.5 + (H - 2.5) / 2, D / 2 + 0.12); }
    else fpw(W + 0.5, H, 0.25, 0, H / 2, D / 2 + 0.12);
    // teto com luminárias (também só na primeira pessoa)
    { const ceil = ctx.box(W + 0.5, 0.12, D + 0.5, ctx.keep(new T.MeshBasicMaterial({ color: '#e9e2d3' })), 0, H + 0.06, 0); ceil.visible = false; ctx.fpWalls.push(ceil);
      const lampM = ctx.keep(new T.MeshBasicMaterial({ color: '#fffbe8' })), lampG = ctx.keep(new T.BoxGeometry(1.2, 0.04, 0.5));
      for (let lx = -W / 2 + 2; lx < W / 2 - 1; lx += 3.2) for (let lz = -D / 2 + 2; lz < D / 2 - 1; lz += 3) { const l = ctx.add(new T.Mesh(lampG, lampM), lx, H - 0.01, lz); l.visible = false; ctx.fpWalls.push(l); } }
    // janelas (depois do elevador)
    const glassSky = ctx.keep(new T.MeshBasicMaterial({ color: '#bfe7ff' }));
    for (let z = ez + 2.8; z < D / 2 - 1; z += 2.6) { ctx.box(0.08, 1.46, 1.76, trimM, -W / 2 + 0.03, 1.75, z); ctx.box(0.05, 1.3, 1.6, glassSky, -W / 2 + 0.07, 1.75, z); }
    return { H, trimM, wallM };
  }
  /* elevador na parede da esquerda: portas que correm, cabine iluminada atrás da parede, visor e botão de chamar */
  function elevator(ctx, W, ez, label) {
    const x = -W / 2, metal = ctx.lam('#aab4c4'), dark = ctx.lam('#5d6a80');
    ctx.box(0.14, 2.45, 0.12, dark, x + 0.06, 1.22, ez - 0.72); ctx.box(0.14, 2.45, 0.12, dark, x + 0.06, 1.22, ez + 0.72); ctx.box(0.14, 0.14, 1.56, dark, x + 0.06, 2.42, ez);
    const doorG = ctx.keep(new T.BoxGeometry(0.06, 2.3, 0.7));
    const dL = ctx.add(new T.Mesh(doorG, metal), x + 0.03, 1.15, ez - 0.35), dR = ctx.add(new T.Mesh(doorG, metal), x + 0.03, 1.15, ez + 0.35);
    // cabine (atrás da parede)
    const cab = ctx.lam('#e8d9b5'), cabWall = ctx.lam('#c9b48a');
    ctx.box(1.7, 0.1, 1.5, cab, x - 0.85, 0.03, ez); ctx.box(0.1, 2.4, 1.5, cabWall, x - 1.7, 1.2, ez);
    ctx.box(1.7, 2.4, 0.1, cabWall, x - 0.85, 1.2, ez - 0.75); ctx.box(1.7, 2.4, 0.1, cabWall, x - 0.85, 1.2, ez + 0.75);
    ctx.box(1.7, 0.08, 1.5, ctx.keep(new T.MeshBasicMaterial({ color: '#fff6d8' })), x - 0.85, 2.42, ez);
    // visor do andar
    const vis = textTex(ctx, 256, 96, () => {});
    const vm = ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(0.62, 0.23)), ctx.keep(new T.MeshBasicMaterial({ map: vis }))), x + 0.08, 2.72, ez); vm.rotation.y = Math.PI / 2;
    const show = (txt, arrow) => { const g = vis.userData.cv.getContext('2d'); g.fillStyle = '#10161f'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#ffb02e'; g.font = 'bold 64px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((arrow || '') + txt, 128, 52); vis.needsUpdate = true; };
    show(label);
    // botão de chamar
    ctx.box(0.05, 0.32, 0.18, dark, x + 0.04, 1.2, ez + 1.0);
    const btnM = ctx.keep(new T.MeshBasicMaterial({ color: '#ffd84d' }));
    const bt = ctx.add(new T.Mesh(ctx.keep(new T.CylinderGeometry(0.045, 0.045, 0.03, 16)), btnM), x + 0.08, 1.24, ez + 1.0); bt.rotation.z = Math.PI / 2;
    let open = 0;
    return {
      x, z: ez, door: { x: x + 1.1, z: ez }, cabin: { x: x - 0.85, z: ez },
      set(k) { open = Math.max(0, Math.min(1, k)); dL.position.z = ez - 0.35 - open * 0.66; dR.position.z = ez + 0.35 + open * 0.66; btnM.color.set(open > 0 ? '#7cf29a' : '#ffd84d'); },
      show,
    };
  }

  /* ---------- sala de um andar (mesas, equipe, gerente, café, objetos do setor) ---------- */
  function makeRoom(ctx, d) {
    const { G, M, lam } = ctx;
    const nOps = Math.min(MAX_OPS, d.ops | 0), nN2 = Math.min(MAX_N2, d.n2 | 0), nSup = Math.min(MAX_SUP, d.sup | 0), hasGer = (d.ger | 0) > 0;
    const seats = Math.max(4, nOps + nN2);
    const cols = Math.max(3, Math.min(7, Math.ceil(Math.sqrt(seats * 0.75))));
    const pods = Math.max(1, Math.ceil(seats / (cols * 2)));
    const PX = 1.6, PZ = 3.6, deskW = cols * PX;
    const W = Math.max(14, deskW + 8.5), D = 4.8 + pods * PZ + 2.6;
    const x0 = -W / 2 + 4.4, z0 = -D / 2 + 5.4, sideL = x0 - 1.3, sideR = x0 + deskW + 0.3;
    const ez = -D / 2 + 1.7;
    const accent = new T.Color(d.color || '#2a83d8'), WHITE = new T.Color('#ffffff');
    const signX = Math.min(x0 + deskW / 2 - PX / 2, W / 2 - 6.4);
    const { trimM } = floorAndWalls(ctx, W, D, { ez });
    {
      const tx = textTex(ctx, 1024, 256, (g) => { g.fillStyle = '#1b2a4a'; roundRect(g, 0, 0, 1024, 256, 48); g.fill(); g.fillStyle = '#' + accent.getHexString(); roundRect(g, 14, 14, 996, 228, 38); g.fill();
        g.fillStyle = '#fff'; g.font = 'bold 120px "Lilita One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowOffsetY = 6; g.fillText((d.emoji ? d.emoji + ' ' : '') + d.name, 512, 136); });
      ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(3.4, 0.85)), ctx.keep(new T.MeshBasicMaterial({ map: tx, transparent: true }))), signX, 2.72, -D / 2 + 0.02);
    }
    const deskTopG = G('deskTop', () => new T.BoxGeometry(1.4, 0.07, 0.8)), legG = G('leg', () => new T.BoxGeometry(0.06, 0.72, 0.06));
    const deskM = M('desk', () => lam('#ffffff')), legM = M('leg', () => lam('#8a93a6'));
    const monG = G('mon', () => new T.BoxGeometry(0.62, 0.4, 0.05)), monStandG = G('monStand', () => new T.BoxGeometry(0.06, 0.22, 0.06));
    const darkM = M('dark', () => lam('#22283a')), kbG = G('kb', () => new T.BoxGeometry(0.42, 0.03, 0.14)), kbM = M('kb', () => lam('#d6dbe6'));
    const scrG = G('scr', () => new T.PlaneGeometry(0.56, 0.34));
    const scrMs = [0, 1, 2, 3].map(i => ctx.keep(new T.MeshBasicMaterial({ color: accent.clone().lerp(WHITE, 0.25 + i * 0.08) })));
    const chairSeatG = G('cs', () => new T.BoxGeometry(0.48, 0.08, 0.46)), chairBackG = G('cb', () => new T.BoxGeometry(0.46, 0.5, 0.07)), chairPoleG = G('cp', () => new T.CylinderGeometry(0.04, 0.04, 0.42, 8));
    const chairM = M('chair', () => lam('#2b3f6b')), panelM = M('panel', () => lam(accent.clone().lerp(WHITE, 0.45)));
    function desk(x, z, face) {
      const g = new T.Group();
      const top = new T.Mesh(deskTopG, deskM); top.position.y = 0.74; g.add(top);
      for (const [lx, lz] of [[-0.64, -0.34], [0.64, -0.34], [-0.64, 0.34], [0.64, 0.34]]) { const l = new T.Mesh(legG, legM); l.position.set(lx, 0.36, lz); g.add(l); }
      const st = new T.Mesh(monStandG, darkM); st.position.set(0, 0.88, -0.22); g.add(st);
      const mon = new T.Mesh(monG, darkM); mon.position.set(0, 1.1, -0.22); g.add(mon);
      const scr = new T.Mesh(scrG, pick(scrMs)); scr.position.set(0, 1.1, -0.19); g.add(scr);
      const kb = new T.Mesh(kbG, kbM); kb.position.set(0, 0.79, 0.12); g.add(kb);
      g.position.set(x, 0, z); g.rotation.y = face > 0 ? 0 : Math.PI; ctx.root.add(g);
    }
    function chair(x, z, face) {
      const g = new T.Group();
      const p = new T.Mesh(chairPoleG, legM); p.position.y = 0.22; g.add(p);
      const s = new T.Mesh(chairSeatG, chairM); s.position.y = 0.46; g.add(s);
      const b = new T.Mesh(chairBackG, chairM); b.position.set(0, 0.76, 0.24); g.add(b);
      g.position.set(x, 0, z); g.rotation.y = face > 0 ? 0 : Math.PI; ctx.root.add(g);
    }
    const seatsList = [];
    for (let r = 0; r < pods; r++) {
      const zc = z0 + r * PZ;
      ctx.add(new T.Mesh(ctx.keep(new T.BoxGeometry(deskW, 0.5, 0.05)), panelM), x0 + deskW / 2 - PX / 2, 0.98, zc);
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * PX;
        desk(x, zc - 0.45, -1); chair(x, zc - 1.25, -1); seatsList.push({ x, z: zc - 1.25, face: -1 });
        desk(x, zc + 0.45, 1); chair(x, zc + 1.25, 1); seatsList.push({ x, z: zc + 1.25, face: 1 });
      }
      ctx.solid(x0 - 0.78, zc - 1.55, x0 + deskW - PX + 0.78, zc + 1.55);
    }
    seatsList.sort((a, b) => b.z - a.z || a.x - b.x);
    const seated = [], talkers = [];
    for (let i = 0; i < nOps + nN2; i++) {
      const s = seatsList[i]; if (!s) break; const n2 = i >= nOps;
      const p = person(ctx, n2 ? '#7a4fd6' : (d.color || '#2a83d8'), Object.assign(randLook(), { headset: d.headset || n2 }));
      sit(p, s.x, s.z, s.face); p.seat = s; p.role = n2 ? 'n2' : 'op'; seated.push(p); talkers.push(p);
    }
    // sala do gerente
    const ox1 = W / 2 - 4.3, oz2 = -D / 2 + 3.6;
    {
      const glass = ctx.keep(new T.MeshLambertMaterial({ color: '#bfe7ff', transparent: true, opacity: 0.32, depthWrite: false }));
      ctx.box(3.1, 2.3, 0.06, glass, ox1 + 2.75, 1.15, oz2); ctx.box(0.06, 2.3, 3.6, glass, ox1, 1.15, oz2 - 1.8);
      ctx.box(3.1, 0.08, 0.08, trimM, ox1 + 2.75, 2.32, oz2); ctx.box(0.08, 0.08, 3.6, trimM, ox1, 2.32, oz2 - 1.8);
      ctx.solid(ox1 + 1.2, oz2 - 0.12, W / 2, oz2 + 0.12); ctx.solid(ox1 - 0.12, oz2 - 3.6, ox1 + 0.12, oz2);
      ctx.box(1.8, 0.08, 0.9, lam('#8a5a2b'), ox1 + 2.3, 0.76, oz2 - 2.2);
      for (const [lx, lz] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) ctx.add(new T.Mesh(legG, legM), ox1 + 2.3 + lx, 0.36, oz2 - 2.2 + lz);
      ctx.add(new T.Mesh(monG, darkM), ox1 + 2.3, 1.12, oz2 - 2.45); ctx.add(new T.Mesh(scrG, scrMs[0]), ox1 + 2.3, 1.12, oz2 - 2.42);
      chair(ox1 + 2.3, oz2 - 1.45, 1); ctx.solid(ox1 + 1.35, oz2 - 2.7, ox1 + 3.25, oz2 - 1.7);
      plant(ctx, ox1 + 3.9, oz2 - 3.2, 1.1);
    }
    let ger = null; const gerSeat = { x: ox1 + 2.3, z: oz2 - 1.45 };
    if (hasGer) { ger = person(ctx, '#1b2a4a', Object.assign(randLook(), { tie: true })); sit(ger, gerSeat.x, gerSeat.z, 1); ger.role = 'ger'; talkers.push(ger); }
    // café
    const cafe = { x: -W / 2 + 1.1, z: D / 2 - 2.0 };
    {
      ctx.box(0.9, 1.0, 2.2, lam('#c98a4a'), -W / 2 + 0.5, 0.5, cafe.z); ctx.box(0.95, 0.06, 2.25, deskM, -W / 2 + 0.5, 1.03, cafe.z);
      ctx.box(0.4, 0.5, 0.4, lam('#3a3a3a'), -W / 2 + 0.45, 1.31, cafe.z - 0.5); ctx.box(0.02, 0.08, 0.08, ctx.keep(new T.MeshBasicMaterial({ color: '#ff5a3c' })), -W / 2 + 0.66, 1.42, cafe.z - 0.5);
      ctx.add(new T.Mesh(ctx.keep(new T.CylinderGeometry(0.18, 0.18, 0.5, 16)), ctx.keep(new T.MeshLambertMaterial({ color: '#7cc7f2', transparent: true, opacity: 0.8 }))), -W / 2 + 0.45, 1.31, cafe.z + 0.55);
      ctx.solid(-W / 2, cafe.z - 1.15, -W / 2 + 0.98, cafe.z + 1.15);
      plant(ctx, -W / 2 + 0.6, D / 2 - 0.6, 1.3);
    }
    plant(ctx, W / 2 - 0.6, D / 2 - 0.6, 1.0);
    // objetos do setor
    const id = d.id;
    if (id === 'logistica' || id === 'tecnico') {
      const shelfM = M('shelf', () => lam('#8a93a6')), boxM = M('box', () => lam('#c9935a')), routerM = M('router', () => lam('#f2f2f2'));
      for (let k = 0; k < 2; k++) {
        const sx = sideL + 2.0 + k * 2.4, sz = -D / 2 + 0.45;
        for (let lv = 0; lv < 4; lv++) { ctx.add(new T.Mesh(G('shelfB', () => new T.BoxGeometry(2.0, 0.05, 0.6)), shelfM), sx, 0.2 + lv * 0.55, sz);
          for (let b = 0; b < 3; b++) if (Math.random() < 0.8) ctx.add(new T.Mesh(G('boxG', () => new T.BoxGeometry(0.45, 0.38, 0.45)), id === 'tecnico' && lv > 1 ? routerM : boxM), sx - 0.6 + b * 0.6, 0.42 + lv * 0.55, sz); }
        for (const px of [-0.98, 0.98]) ctx.add(new T.Mesh(G('shelfP', () => new T.BoxGeometry(0.06, 2.0, 0.6)), shelfM), sx + px, 1.0, sz);
        ctx.solid(sx - 1.05, sz - 0.35, sx + 1.05, sz + 0.35);
      }
    }
    let board = null;
    if (id === 'noc' || id === 'comercial' || id === 'marketing') {
      board = textTex(ctx, 512, 256, () => {});
      ctx.box(2.95, 1.35, 0.06, trimM, signX, 1.5, -D / 2 + 0.02);
      ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(2.8, 1.2)), ctx.keep(new T.MeshBasicMaterial({ map: board }))), signX, 1.5, -D / 2 + 0.06);
    }
    const graph = Array.from({ length: 40 }, () => 0.5);
    function drawBoard() {
      if (!board) return; const g = board.userData.cv.getContext('2d');
      g.fillStyle = id === 'marketing' ? '#ffffff' : '#0f1d33'; g.fillRect(0, 0, 512, 256);
      if (id === 'marketing') { const cs = ['#ffd84d', '#ff9fb1', '#9fe0ff', '#b8f29f']; for (let i = 0; i < 12; i++) { g.fillStyle = cs[i % 4]; g.fillRect(24 + (i % 6) * 80, 30 + Math.floor(i / 6) * 110, 64, 64); } g.fillStyle = '#1b2a4a'; g.font = 'bold 22px sans-serif'; g.fillText('Campanhas do mês', 24, 238); }
      else { graph.push(Math.max(0.08, Math.min(0.95, graph[graph.length - 1] + (Math.random() - 0.5) * 0.18))); graph.shift();
        g.strokeStyle = id === 'noc' ? '#3fe08a' : '#ffc72c'; g.lineWidth = 4; g.beginPath(); graph.forEach((v, i) => { const x = 16 + i * 12.3, y = 230 - v * 190; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.fillText(id === 'noc' ? 'Tráfego da rede' : 'Meta de vendas', 18, 32); }
      board.needsUpdate = true;
    }
    drawBoard();
    const elev = elevator(ctx, W, ez, d.label || '');
    const walkers = [];
    for (let i = 0; i < nSup; i++) {
      const p = person(ctx, '#0f9a8d', randLook()); stand(p); p.role = 'sup';
      p.g.position.set(sideR, 0, z0 + ((Math.random() * pods) | 0) * PZ + PZ / 2); walkers.push(p); talkers.push(p);
    }
    const routeTo = (p, tx, tz, side) => { const cx = p.g.position.x, cz = p.g.position.z; side = side != null ? side : (Math.abs(cx - sideL) < Math.abs(cx - sideR) ? sideL : sideR); p.path = [[side, cz], [side, tz], [tx, tz]]; };
    const supNext = p => { const r = (Math.random() * pods) | 0, z = Math.random() < 0.5 ? z0 + r * PZ + PZ / 2 : z0 + r * PZ - PZ / 2 + 0.05; routeTo(p, x0 + Math.random() * (deskW - PX), Math.min(D / 2 - 0.8, Math.max(z0 - 2.0, z))); };
    let coffeeNext = 3, gerNext = 14, boardT = 0;
    function update(dt, t) {
      scrMs.forEach((m, i) => { const k = 0.82 + 0.18 * Math.sin(t * (1.7 + i * 0.6) + i); m.color.copy(accent).lerp(WHITE, 0.2 + 0.25 * k); });
      for (const p of seated) if (p.state === 'sit') { const s = Math.sin(t * 14 + p.phase * 3); p.armL.rotation.x = -1.15 + s * 0.08; p.armR.rotation.x = -1.15 - s * 0.08; if (t - p.talkAt > 3) p.head.rotation.y = Math.sin(t * 0.7 + p.phase) * 0.18; }
      for (const p of walkers) { if (p.wait > 0) { p.wait -= dt; idlePose(p, t); p.head.rotation.y = Math.sin(t * 1.3 + p.phase) * 0.5; continue; } if (walkStep(p, dt, t)) { p.wait = 1.5 + Math.random() * 3; supNext(p); } }
      coffeeNext -= dt;
      if (coffeeNext <= 0 && seated.length) {
        coffeeNext = 5 + Math.random() * 7;
        if (seated.filter(p => p.state !== 'sit').length < Math.min(3, Math.ceil(seated.length / 6))) {
          const free = seated.filter(q => q.state === 'sit'); const p = free.length ? pick(free) : null;
          if (p) { stand(p); p.state = 'toCafe'; p.g.position.z += p.seat.face * 0.45; routeTo(p, cafe.x + 0.6 + Math.random() * 0.4, cafe.z + (Math.random() - 0.5) * 1.2, sideL); }
        }
      }
      for (const p of seated) {
        if (p.state === 'toCafe') { if (walkStep(p, dt, t)) { p.state = 'cafe'; p.wait = 2.5 + Math.random() * 3; p.g.rotation.y = -Math.PI / 2; idlePose(p, t); p.armR.rotation.x = -1.2; } }
        else if (p.state === 'cafe') { p.wait -= dt; p.armR.rotation.x = -1.2 + Math.sin(t * 2) * 0.25; if (p.wait <= 0) { p.state = 'back'; p.path = [[sideL, p.g.position.z], [sideL, p.seat.z + p.seat.face * 0.45], [p.seat.x, p.seat.z + p.seat.face * 0.45], [p.seat.x, p.seat.z]]; } }
        else if (p.state === 'back') { if (walkStep(p, dt, t)) sit(p, p.seat.x, p.seat.z, p.seat.face); }
      }
      if (ger) {
        if (ger.state === 'sit') { ger.armL.rotation.x = -1.15 + Math.sin(t * 9) * 0.05; ger.armR.rotation.x = -1.15 - Math.sin(t * 9) * 0.05; gerNext -= dt;
          if (gerNext <= 0) { gerNext = 22 + Math.random() * 15; stand(ger); ger.state = 'tour'; const door = [ox1 + 0.6, oz2 + 0.5], tz = z0 + ((Math.random() * pods) | 0) * PZ + PZ / 2; ger.path = [[gerSeat.x, gerSeat.z + 0.6], [ox1 + 0.6, gerSeat.z + 0.6], door, [sideR, door[1]], [sideR, tz], [x0 + Math.random() * (deskW - PX), tz]]; } }
        else if (ger.state === 'tour') { if (walkStep(ger, dt, t)) { ger.state = 'look'; ger.wait = 3; } }
        else if (ger.state === 'look') { ger.wait -= dt; idlePose(ger, t); ger.head.rotation.y = Math.sin(t * 1.5) * 0.6;
          if (ger.wait <= 0) { ger.state = 'home'; const pz = ger.g.position.z; ger.path = [[sideR, pz], [sideR, oz2 + 0.5], [ox1 + 0.6, oz2 + 0.5], [ox1 + 0.6, gerSeat.z + 0.6], [gerSeat.x, gerSeat.z + 0.6], [gerSeat.x, gerSeat.z]]; } }
        else if (ger.state === 'home') { if (walkStep(ger, dt, t)) sit(ger, gerSeat.x, gerSeat.z, 1); }
      }
      boardT += dt; if (boardT > 0.5) { boardT = 0; drawBoard(); }
    }
    const busy = (d.eff || 1) < 0.9;
    const say = p => p.role === 'ger' ? pick(['Chefe! Quer ver os números do mês? 📊', 'Bom te ver por aqui, chefe!', busy ? 'Precisamos reforçar a equipe 😓' : 'O setor está redondo 👌'])
      : p.role === 'sup' ? pick(busy ? ['Estamos no limite, chefe 😓', 'Dá para contratar mais gente?'] : ['Equipe batendo a meta! 🎯', 'Tudo sob controle, chefe.', 'Fila zerada agora há pouco 💪'])
      : p.role === 'n2' ? pick(['Resolvi um chamado cabeludo 🔧', 'Rede estável por aqui!', 'Oi, chefe!'])
      : pick(busy ? ['Precisamos de mais gente! 😓', 'Hoje está puxado…', 'Bom dia, chefe! (correria)'] : ['Bom dia, chefe!', 'Mais um protocolo fechado ✅', 'Cliente satisfeito! 😊', 'Oi, chefe! 👋', 'Tudo certo por aqui!']);
    return { W, D, update, colliders: ctx.colliders, elev, talkers, say, spawn: elev.door, shown: { ops: nOps, n2: nN2, sup: nSup, ger: hasGer ? 1 : 0 } };
  }

  /* ---------- térreo: recepção ---------- */
  function makeLobby(ctx, info) {
    const W = 16, D = 12, ez = -D / 2 + 1.7, lam = ctx.lam;
    floorAndWalls(ctx, W, D, { ez, floorA: '#efe9df', floorB: '#e2d9cb', gap: { x: -1.6, w: 2.6 } });
    const logo = textTex(ctx, 1024, 384, (g) => {
      g.fillStyle = '#1b2a4a'; roundRect(g, 0, 0, 1024, 384, 60); g.fill(); g.fillStyle = '#ff8a1f'; roundRect(g, 16, 16, 992, 352, 48); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowOffsetY = 6;
      const name = '📡 ' + (info.company || 'Provedor'); let fs = 120; const setF = () => { g.font = `bold ${fs}px "Lilita One", "Arial Black", sans-serif`; }; setF();
      while (g.measureText(name).width > 940 && fs > 46) { fs -= 6; setF(); }
      g.fillText(name, 512, 150); g.shadowOffsetY = 3; g.font = 'bold 48px sans-serif';
      g.fillText(`${(info.clients || 0).toLocaleString('pt-BR')} clientes · nível ${info.level || 1}`, 512, 282);
    });
    ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(5.2, 1.95)), ctx.keep(new T.MeshBasicMaterial({ map: logo, transparent: true }))), 1.2, 2.0, -D / 2 + 0.03);
    // balcão da recepção
    const acc = lam('#ff8a1f'), white = lam('#ffffff');
    ctx.box(4.4, 1.05, 0.9, white, 1.2, 0.52, -D / 2 + 3.3); ctx.box(4.5, 0.08, 1.0, acc, 1.2, 1.08, -D / 2 + 3.3);
    ctx.box(0.62, 0.4, 0.05, lam('#22283a'), 0.4, 1.32, -D / 2 + 3.0);
    ctx.solid(-1.0, -D / 2 + 2.8, 3.4, -D / 2 + 3.8);
    const rec = person(ctx, '#ff8a1f', Object.assign(randLook(), { headset: true })); stand(rec); rec.g.position.set(1.2, 0, -D / 2 + 2.3); rec.role = 'rec';
    ctx.solid(0.7, -D / 2 + 1.8, 1.7, -D / 2 + 2.8);
    // sofás e mesinha
    const sofaM = lam('#2b3f6b');
    for (const [x, z, ry] of [[5.2, 1.2, -Math.PI / 2], [3.3, 3.1, Math.PI]]) {
      const s = new T.Group(); const seat = new T.Mesh(ctx.keep(new T.BoxGeometry(2.2, 0.45, 0.85)), sofaM); seat.position.y = 0.32; s.add(seat);
      const back = new T.Mesh(ctx.keep(new T.BoxGeometry(2.2, 0.6, 0.22)), sofaM); back.position.set(0, 0.75, -0.32); s.add(back);
      s.position.set(x, 0, z); s.rotation.y = ry; ctx.root.add(s);
    }
    ctx.solid(4.7, 0.0, 5.7, 2.4); ctx.solid(2.2, 2.6, 4.4, 3.6);
    ctx.box(1.1, 0.4, 0.8, lam('#8a5a2b'), 3.4, 0.2, 1.3); ctx.solid(2.8, 0.85, 4.0, 1.75);
    plant(ctx, 6.9, -D / 2 + 0.7, 1.4); plant(ctx, -2.2, -D / 2 + 0.7, 1.2); plant(ctx, 7.2, D / 2 - 2.0, 1.2);
    // quadro dos andares ao lado do elevador
    const dir = textTex(ctx, 256, 384, (g) => { g.fillStyle = '#1b2a4a'; g.fillRect(0, 0, 256, 384); g.fillStyle = '#ffb02e'; g.font = 'bold 30px sans-serif'; g.fillText('Andares', 18, 42); g.font = 'bold 20px sans-serif';
      (info.floors || []).slice(0, 13).forEach((f, i) => { g.fillStyle = i % 2 ? '#cfe3ff' : '#ffffff'; g.fillText(`${f.label}  ${f.name}`, 18, 80 + i * 23); }); });
    const dm = ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(0.75, 1.12)), ctx.keep(new T.MeshBasicMaterial({ map: dir }))), -W / 2 + 0.04, 1.65, ez + 2.2); dm.rotation.y = Math.PI / 2;
    // porta de entrada (frente)
    const EX = -1.6; // entrada (capacho) à esquerda dos sofás
    ctx.box(2.3, 0.02, 1.0, lam('#5d6a80'), EX, 0.01, D / 2 - 0.6);
    const mat = textTex(ctx, 256, 96, (g) => { g.fillStyle = '#5d6a80'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BEM-VINDO', 128, 50); });
    const mm = ctx.add(new T.Mesh(ctx.keep(new T.PlaneGeometry(2.0, 0.75)), ctx.keep(new T.MeshBasicMaterial({ map: mat }))), EX, 0.025, D / 2 - 0.6); mm.rotation.x = -Math.PI / 2;
    const elev = elevator(ctx, W, ez, 'T');
    // visitantes: entram, falam com a recepção e saem (a porta de vidro abre sozinha)
    const visitors = [0, 1].map(i => { const p = person(ctx, pick(['#d94f8a', '#3a9a4a', '#7a4fd6', '#e5a21e']), randLook()); stand(p); p.role = 'vis'; p.g.position.set(EX, 0, D / 2 + 3); p.wait = 2 + i * 6; p.state = 'out'; return p; });
    function update(dt, t) {
      rec.armL.rotation.x = -0.9 + Math.sin(t * 10) * 0.06; rec.armR.rotation.x = -0.9 - Math.sin(t * 10) * 0.06; if (t - rec.talkAt > 3) rec.head.rotation.y = Math.sin(t * 0.6) * 0.3;
      for (const v of visitors) {
        if (v.state === 'out') { v.wait -= dt; if (v.wait <= 0) { v.state = 'in'; v.g.position.set(EX, 0, D / 2 + 1.2); v.path = [[EX, D / 2 - 1.5], [1.2 + (Math.random() - 0.5) * 2, -D / 2 + 4.4]]; } }
        else if (v.state === 'in') { if (walkStep(v, dt, t, 1.0)) { v.state = 'talk'; v.wait = 3 + Math.random() * 3; v.g.rotation.y = Math.PI; } }
        else if (v.state === 'talk') { v.wait -= dt; idlePose(v, t); v.armR.rotation.x = -0.6 + Math.sin(t * 3) * 0.3; if (v.wait <= 0) { v.state = 'leave'; v.path = [[EX, D / 2 - 1.5], [EX, D / 2 + 1.2]]; } }
        else if (v.state === 'leave') { if (walkStep(v, dt, t, 1.0)) { v.state = 'out'; v.wait = 4 + Math.random() * 8; v.g.position.z = D / 2 + 3; } }
        v.g.visible = v.state !== 'out';
      }
    }
    return { W, D, update, colliders: ctx.colliders, elev, talkers: [rec], say: () => pick([`Bem-vindo à ${info.company || 'empresa'}! 😊`, 'Bom dia, chefe! O elevador fica à esquerda.', 'Tem cliente novo chegando hoje!']), spawn: { x: 1.4, z: D / 2 - 2.6 } };
  }

  /* ---------- renderizador e câmera ---------- */
  function mkView(el) {
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
    const scene = new T.Scene(); scene.background = new T.Color('#9fd8f7');
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0x9a8f7a, 1.15));
    const sun = new T.DirectionalLight(0xffffff, 1.35); sun.position.set(8, 16, 10); scene.add(sun);
    return { renderer, scene, camera, cv: renderer.domElement };
  }
  function bindOrbit(cv, st) {
    const ptr = new Map(); let pinch0 = 0, rad0 = 0;
    const down = e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); rad0 = st.rad; } cv.style.cursor = 'grabbing'; };
    const move = e => { const p = ptr.get(e.pointerId); if (!p) return;
      if (ptr.size === 1) { st.theta = Math.max(st.tMin, Math.min(st.tMax, st.theta - (e.clientX - p.x) * 0.006)); st.phi = Math.max(0.45, Math.min(1.3, st.phi - (e.clientY - p.y) * 0.004)); }
      p.x = e.clientX; p.y = e.clientY;
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) st.rad = Math.max(st.rMin, Math.min(st.rMax, rad0 * pinch0 / dd)); } };
    const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch0 = 0; cv.style.cursor = 'grab'; };
    const wheel = e => { e.preventDefault(); st.rad = Math.max(st.rMin, Math.min(st.rMax, st.rad * (e.deltaY > 0 ? 1.1 : 0.9))); };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('wheel', wheel, { passive: false });
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.removeEventListener('wheel', wheel); };
  }
  const killView = v => { v.renderer.dispose(); try { v.renderer.forceContextLoss(); } catch (e) {} v.cv.remove(); };

  /* ---------- visão de cima de um andar ---------- */
  function open(el, d) {
    if (!T) throw new Error('Three.js não carregou');
    const v = mkView(el), ctx = mkCtx(v.scene), room = makeRoom(ctx, d);
    const st = { theta: 0.62, phi: 0.98, rad: Math.max(room.W, room.D) * 1.12, rMin: 5, rMax: Math.max(room.W, room.D) * 2, tMin: 0.02, tMax: 1.52 };
    const target = new T.Vector3(0, 0.6, -0.4), unbind = bindOrbit(v.cv, st);
    let fitted = false;
    const resize = () => { const w = el.clientWidth || 300, h = el.clientHeight || 200; v.renderer.setSize(w, h, false); v.camera.aspect = w / h; v.camera.updateProjectionMatrix();
      if (!fitted) { fitted = true; const a = w / h; st.rad = Math.max(room.W, room.D) * (a > 2 ? 0.82 : a > 1.5 ? 0.95 : 1.12); } };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    let raf = 0, last = performance.now(), alive = true;
    const frame = now => { if (!alive) return; raf = requestAnimationFrame(frame); if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now; room.update(dt, t);
      v.camera.position.set(target.x + st.rad * Math.sin(st.phi) * Math.sin(st.theta), target.y + st.rad * Math.cos(st.phi), target.z + st.rad * Math.sin(st.phi) * Math.cos(st.theta)); v.camera.lookAt(target);
      v.renderer.render(v.scene, v.camera); };
    raf = requestAnimationFrame(frame);
    return { shown: room.shown, dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); unbind(); ctx.dispose(); killView(v); } };
  }

  /* ---------- andar pela empresa: personagem, elevador e painel de andares ---------- */
  function tour(el, cfg) {
    if (!T) throw new Error('Three.js não carregou');
    const v = mkView(el), sfx = cfg.sfx || (() => {});
    const touch = !matchMedia('(pointer:fine)').matches;
    const ui = document.createElement('div'); ui.className = 't3-ui'; el.appendChild(ui);
    ui.innerHTML = `<div class="t3-where" id="t3Where"></div><div class="t3-bubs" id="t3Bubs"></div><div class="t3-name" id="t3Name"></div>
      <button type="button" class="t3-cam" id="t3Cam"></button><div class="t3-aim" id="t3Aim" hidden></div><div class="t3-joy" id="t3Joy"><i></i></div><button type="button" class="t3-act" id="t3Act" hidden></button>
      <div class="t3-panel" id="t3Panel" hidden></div><div class="t3-fade" id="t3Fade"></div>
      <p class="t3-help">${touch ? 'Joystick para andar · arraste a tela para girar a câmera' : 'WASD ou setas para andar · Shift corre · E chama o elevador · V troca a câmera · arraste para girar'}</p>`;
    const $u = id => ui.querySelector('#' + id);
    const camBtn = $u('t3Cam'), aim = $u('t3Aim');
    const where = $u('t3Where'), bubs = $u('t3Bubs'), act = $u('t3Act'), panel = $u('t3Panel'), fade = $u('t3Fade'), joy = $u('t3Joy'), nameTag = $u('t3Name');
    nameTag.textContent = (cfg.player && cfg.player.name) || 'Você';
    let ctx = null, room = null, cur = Math.max(0, Math.min(cfg.floors.length - 1, cfg.start || 0));
    const me = { p: null, x: 0, z: 0, ry: Math.PI };
    const st = { theta: 0.55, phi: 0.95, rad: 8.5, rMin: 4, rMax: 16, tMin: -0.7, tMax: 1.8 };
    const unbind = bindOrbit(v.cv, st);
    let fp = false; try { fp = localStorage.getItem('pt-fp') === '1'; } catch (e) {}
    function setFp(on) {
      fp = on; try { localStorage.setItem('pt-fp', on ? '1' : '0'); } catch (e) {}
      camBtn.innerHTML = on ? '🎥 3ª pessoa' : '👁️ 1ª pessoa'; aim.hidden = !on;
      if (on) { st.tMin = -Infinity; st.tMax = Infinity; st.phi = 0.95; } else { st.tMin = -0.7; st.tMax = 1.8; st.theta = 0.55; st.phi = 0.95; firstCam = true; }
      v.camera.fov = on ? 72 : 40; v.camera.updateProjectionMatrix();
      if (ctx) { for (const m of ctx.fpWalls || []) m.visible = on; if (me.p) me.p.g.visible = !on; }
    }
    camBtn.onclick = () => setFp(!fp);
    const floorName = f => (f.label === 'T' ? 'Térreo' : f.label === 'G' ? 'Galpão' : f.label + 'º andar') + ' · ' + f.name;
    function build(i, inCabin) {
      if (ctx) ctx.dispose();
      ctx = mkCtx(v.scene); const f = cfg.floors[i];
      room = f.id === 'lobby' ? makeLobby(ctx, Object.assign({ floors: cfg.floors }, cfg.lobby)) : makeRoom(ctx, Object.assign({ label: f.label }, f.data));
      me.p = person(ctx, (cfg.player && cfg.player.color) || '#ff8a1f', { skin: 1, hair: 0, cap: '#1b2a4a', pants: '#1b2a4a' }); stand(me.p);
      const s = inCabin ? room.elev.cabin : room.spawn; me.x = s.x; me.z = s.z; me.ry = inCabin ? Math.PI / 2 : Math.PI;
      room.elev.show(f.label); room.elev.set(0);
      for (const m of ctx.fpWalls || []) m.visible = fp; me.p.g.visible = !fp;
      where.innerHTML = '<b>' + floorName(f) + '</b>';
      bubs.innerHTML = ''; BUB.length = 0;
    }
    const BUB = [];
    build(cur, false);
    // teclado e joystick
    const keys = {};
    const KEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, ShiftLeft: 1, ShiftRight: 1 };
    const kd = e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (KEYS[e.code]) { keys[e.code] = true; e.preventDefault(); } else if ((e.code === 'KeyE' || e.code === 'Enter') && !act.hidden) { e.preventDefault(); act.click(); } else if (e.code === 'KeyV') { e.preventDefault(); setFp(!fp); } };
    const ku = e => { if (KEYS[e.code]) keys[e.code] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const jv = { x: 0, y: 0, id: null }, knob = joy.querySelector('i');
    const jset = e => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2; let x = (e.clientX - cx) / R, y = (e.clientY - cy) / R; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } jv.x = x; jv.y = y; knob.style.transform = `translate(${x * R * 0.55}px,${y * R * 0.55}px)`; };
    const jdown = e => { e.preventDefault(); e.stopPropagation(); jv.id = e.pointerId; joy.setPointerCapture(e.pointerId); jset(e); };
    const jmove = e => { if (e.pointerId === jv.id) jset(e); };
    const jup = e => { if (e.pointerId === jv.id) { jv.id = null; jv.x = jv.y = 0; knob.style.transform = ''; } };
    joy.addEventListener('pointerdown', jdown); joy.addEventListener('pointermove', jmove); joy.addEventListener('pointerup', jup); joy.addEventListener('pointercancel', jup);
    // colisão (círculo do jogador contra retângulos)
    const R = 0.3;
    const hits = (x, z) => { if (x < -room.W / 2 + R + 0.1 || x > room.W / 2 - R || z < -room.D / 2 + R + 0.1 || z > room.D / 2 - R) return true; for (const c of room.colliders) if (x > c.x1 - R && x < c.x2 + R && z > c.z1 - R && z < c.z2 + R) return true; return false; };
    // sequências (portas, entrar e sair do elevador)
    const tweens = [];
    const tween = (ms, fn) => new Promise(res => tweens.push({ t0: performance.now(), ms, fn, res }));
    const wait = ms => tween(ms, () => {});
    let auto = null, busy = false;
    const walkTo = pts => new Promise(res => { auto = { pts: pts.slice(), res }; });
    async function callElevator() {
      if (busy) return; busy = true; act.hidden = true; sfx('ding');
      await tween(700, k => room.elev.set(k));
      await walkTo([[room.elev.door.x - 0.5, room.elev.z], [room.elev.cabin.x, room.elev.cabin.z]]);
      me.ry = Math.PI / 2; if (fp) { const th0 = st.theta; let dth = -Math.PI / 2 - th0; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI; tween(500, k => { st.theta = th0 + dth * k; }); st.phi = 0.95; }
      await tween(600, k => room.elev.set(1 - k)); showPanel();
    }
    function showPanel() {
      panel.innerHTML = `<div class="t3-pbox"><div class="t3-ptitle">🛗 Para qual andar?</div><div class="t3-btns">${cfg.floors.map((f, i) => `<button type="button" class="t3-fbtn ${i === cur ? 'cur' : ''}" data-fl="${i}"><span>${f.label}</span><small>${f.name}</small></button>`).join('')}</div>
        <button type="button" class="t3-stay" data-fl="${cur}">Ficar neste andar</button></div>`;
      panel.hidden = false;
      panel.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => go(+b.dataset.fl));
    }
    async function go(i) {
      panel.hidden = true;
      if (i !== cur) {
        const step = i > cur ? 1 : -1, arrow = step > 0 ? '▲' : '▼', per = Math.max(240, Math.min(650, 1800 / Math.abs(i - cur)));
        for (let k = cur; k !== i; k += step) { room.elev.show(cfg.floors[k].label, arrow); await wait(per); }
        fade.classList.add('on'); await wait(380);
        cur = i; build(cur, true); st.theta = fp ? -Math.PI / 2 : 0.55;
        fade.classList.remove('on'); await wait(320); sfx('ding');
      }
      await tween(700, k => room.elev.set(k));
      await walkTo([[room.elev.door.x, room.elev.z], [room.elev.door.x + 0.7, room.elev.z + 0.5]]);
      await tween(600, k => room.elev.set(1 - k)); busy = false;
    }
    act.onclick = () => callElevator();
    const talk = (p, txt) => { const d = document.createElement('div'); d.className = 't3-bub'; d.textContent = txt; bubs.appendChild(d); BUB.push({ el: d, p, until: performance.now() + 3000 }); };
    const resize = () => { const w = el.clientWidth || 300, h = el.clientHeight || 200; v.renderer.setSize(w, h, false); v.camera.aspect = w / h; v.camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    const camPos = new T.Vector3(), look = new T.Vector3(), tmp = new T.Vector3();
    let raf = 0, last = performance.now(), alive = true, lastTalk = 0, firstCam = true;
    const frame = now => {
      if (!alive) return; raf = requestAnimationFrame(frame); if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (now - w.t0) / w.ms); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.res(); } }
      room.update(dt, t);
      // movimento do jogador
      let mx = 0, mz = 0, run = false;
      if (auto) {
        const [tx, tz] = auto.pts[0], dx = tx - me.x, dz = tz - me.z, dd = Math.hypot(dx, dz);
        if (dd < 0.06) { auto.pts.shift(); if (!auto.pts.length) { const r = auto.res; auto = null; r(); } } else { mx = dx / dd; mz = dz / dd; }
        if (fp && (mx || mz)) { let dth = Math.atan2(-mx, -mz) - st.theta; while (dth > Math.PI) dth -= 2 * Math.PI; while (dth < -Math.PI) dth += 2 * Math.PI; st.theta += dth * Math.min(1, dt * 5); }
      } else if (!busy) {
        if (fp) st.theta += ((keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0)) * 2.2 * dt;
        const kx = (keys.KeyD || (!fp && keys.ArrowRight) ? 1 : 0) - (keys.KeyA || (!fp && keys.ArrowLeft) ? 1 : 0) + jv.x;
        const kf = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - jv.y;
        run = !!(keys.ShiftLeft || keys.ShiftRight) || Math.hypot(jv.x, jv.y) > 0.95;
        const fx = -Math.sin(st.theta), fz = -Math.cos(st.theta), rx = -fz, rz = fx;
        mx = fx * kf + rx * kx; mz = fz * kf + rz * kx; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
      }
      const sp = auto ? 1.6 : run ? 4.4 : 2.6;
      if (Math.hypot(mx, mz) > 0.05) {
        const nx = me.x + mx * sp * dt, nz = me.z + mz * sp * dt;
        if (auto) { me.x = nx; me.z = nz; } else { if (!hits(nx, me.z)) me.x = nx; if (!hits(me.x, nz)) me.z = nz; }
        let dr = Math.atan2(mx, mz) - me.ry; while (dr > Math.PI) dr -= 2 * Math.PI; while (dr < -Math.PI) dr += 2 * Math.PI; me.ry += dr * Math.min(1, dt * 12);
        walkPose(me.p, t, sp);
      } else idlePose(me.p, t);
      me.p.g.position.set(me.x, 0, me.z); me.p.g.rotation.y = me.ry;
      // botão do elevador quando está perto da porta
      const near = !busy && Math.hypot(me.x - room.elev.door.x, me.z - room.elev.z) < 1.6;
      if (near === act.hidden) { act.hidden = !near; if (near) act.innerHTML = '🛗 Chamar elevador' + (touch ? '' : ' <kbd>E</kbd>'); }
      // quem está perto fala com o chefe (e olha para ele)
      if (!busy && now - lastTalk > 1400) for (const p of room.talkers) {
        const px = p.g.position.x, pz = p.g.position.z;
        if (t - p.talkAt > 25 && Math.hypot(px - me.x, pz - me.z) < 1.9) { p.talkAt = t; lastTalk = now; talk(p, room.say(p)); const a = Math.atan2(me.x - px, me.z - pz) - p.g.rotation.y; p.head.rotation.y = Math.max(-1, Math.min(1, Math.atan2(Math.sin(a), Math.cos(a)))); break; }
      }
      // câmera atrás do jogador
      if (fp) {
        const pitch = Math.max(-0.75, Math.min(0.75, (st.phi - 0.95) * 1.6)), bob = Math.hypot(mx, mz) > 0.05 ? Math.sin(t * (6 + sp * 2.6)) * 0.035 : 0;
        v.camera.position.set(me.x, 1.55 + bob, me.z);
        look.set(me.x - Math.sin(st.theta) * Math.cos(pitch), 1.55 + bob + Math.sin(pitch), me.z - Math.cos(st.theta) * Math.cos(pitch)); v.camera.lookAt(look);
      } else {
      const inCab = me.x < room.elev.x, fx0 = inCab ? room.elev.door.x + 0.4 : me.x, fz0 = inCab ? room.elev.z : me.z;
      camPos.set(fx0 + st.rad * Math.sin(st.phi) * Math.sin(st.theta), st.rad * Math.cos(st.phi) + 0.6, fz0 + st.rad * Math.sin(st.phi) * Math.cos(st.theta));
      if (firstCam) { v.camera.position.copy(camPos); firstCam = false; } else v.camera.position.lerp(camPos, Math.min(1, dt * 6));
      look.set(fx0, 1.0, fz0); v.camera.lookAt(look);
      }
      v.renderer.render(v.scene, v.camera);
      // nome do jogador e balões acompanham as cabeças
      const w = el.clientWidth, h = el.clientHeight, place = (node, x, y, z) => { tmp.set(x, y, z).project(v.camera); node.style.left = ((tmp.x + 1) / 2 * w) + 'px'; node.style.top = ((1 - tmp.y) / 2 * h) + 'px'; node.style.opacity = tmp.z < 1 ? 1 : 0; };
      place(nameTag, me.x, 2.0, me.z); nameTag.style.display = fp || (busy && !auto) ? 'none' : '';
      for (let i = BUB.length - 1; i >= 0; i--) { const b = BUB[i]; if (now > b.until || !b.p.g.parent) { b.el.remove(); BUB.splice(i, 1); continue; } place(b.el, b.p.g.position.x, 2.1, b.p.g.position.z); }
    };
    setFp(fp);
    raf = requestAnimationFrame(frame);
    return {
      dbg: { me, get room() { return room; }, get cur() { return cur; } },
      dispose() {
        alive = false; cancelAnimationFrame(raf); ro.disconnect(); unbind();
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (ctx) ctx.dispose(); killView(v); ui.remove();
      },
    };
  }
  window.Floor3D = { open, tour };
})();
