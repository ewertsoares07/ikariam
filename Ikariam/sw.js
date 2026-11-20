// =====================================================================
// SERVICE WORKER — deixa o app abrir sem internet.
// Ao mudar qualquer arquivo, suba a VERSAO para o celular baixar a nova.
// =====================================================================
const VERSAO = 'imperial-2.2.2';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css', './css/menu.css', './css/grego.css', './css/tatico.css',
  './js/app.js', './js/config.js', './js/data.js', './js/calc.js', './js/store.js', './js/parser.js', './js/ui.js',
  './js/folha.js', './js/modal.js', './js/menu.js', './js/timers.js', './js/cloud.js', './js/icones.js', './js/combate.js',
  './js/views/comum.js', './js/views/inicio.js', './js/views/imperio.js', './js/views/militar.js', './js/views/simulador.js', './js/views/alvos.js',
  './js/views/cronometros.js', './js/views/pve.js', './js/views/guias.js', './js/views/alianca.js', './js/views/sistema.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './img/hero.svg',
];
// Fora do app: fontes e o SDK do Firebase (guardados na primeira vez que carregam)
const EXTERNOS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://www.gstatic.com/firebasejs/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO && k.startsWith('imperial-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mesmo = url.origin === self.location.origin;
  const externo = EXTERNOS.some(p => req.url.startsWith(p));
  if (!mesmo && !externo) return; // Firestore, login do Google etc. passam direto

  // Página: tenta a rede (pega versão nova) e cai no cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Demais arquivos: responde do cache na hora e atualiza por trás
  e.respondWith(caches.match(req).then(cache => {
    const rede = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSAO).then(k => k.put(req, c)); }
      return r;
    }).catch(() => cache);
    return cache || rede;
  }));
});

// Tocar na notificação abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    const aberto = lista.find(c => 'focus' in c);
    return aberto ? aberto.focus() : self.clients.openWindow('./index.html#/cronometros');
  }));
});
