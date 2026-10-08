/* Service worker do Provedor Tycoon: deixa o jogo abrir sem internet.
   Ao publicar uma versão nova, aumente o número em VERSION para os jogadores receberem a atualização. */
const VERSION = 'v94';
const APP_CACHE = `provedor-app-${VERSION}`;
const FONT_CACHE = 'provedor-fonts';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './config.js',
  './data/municipios.json',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('provedor-app-') && k !== APP_CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fontes do Google: usa a cópia guardada e atualiza em segundo plano.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('', { status: 504 });
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;
  // músicas: direto da rede (o navegador pede pedaços do arquivo, que o cache não entrega)
  if (url.pathname.includes("/audio/")) return;

  // config.js: sempre tenta a versão nova (é onde fica a configuração do Supabase)
  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(fetch(req).then((res) => { if (res.ok) caches.open(APP_CACHE).then((c) => c.put(req, res.clone())); return res; }).catch(() => caches.match(req)));
    return;
  }

  // Página do jogo: tenta a internet primeiro (pega versões novas) e cai para a cópia offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(APP_CACHE);
        cache.put('./index.html', res.clone());
        return res;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // Ícones e demais arquivos: cópia guardada primeiro.
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(APP_CACHE)).put(req, res.clone());
      return res;
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});
