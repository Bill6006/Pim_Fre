/*
 * Pimsleur French - service worker.
 *
 * Caches ONLY the app shell: the static files in this folder. Lesson audio never
 * passes through here. Lessons play from blob: URLs created from local File
 * objects. Service workers cannot intercept blob: URLs, and nothing is uploaded
 * or fetched from anywhere else.
 *
 * Pages: network-first, so a new deployment is picked up on the next launch.
 * Falls back to the cached shell when offline or when the network is too slow.
 * Icons and manifest: cache-first. Bump VERSION when you change them.
 */
'use strict';

const VERSION = '1.1.0';
const CACHE_PREFIX = 'pim-fr-shell-';
const CACHE = CACHE_PREFIX + VERSION;

// All paths are relative to this file, so the app works under a GitHub Pages
// project subpath such as /Pim_Fre/ as well as at a domain root.
const CRITICAL = ['./', './index.html'];
const OPTIONAL = [
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

const SCOPE_URL = new URL('./', self.location.href).href;
const INDEX_URL = new URL('./index.html', self.location.href).href;
const SHELL_URLS = new Set(CRITICAL.concat(OPTIONAL).map((p) => new URL(p, self.location.href).href));
const NAV_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: 'reload' skips the HTTP cache so a new version never precaches stale files.
    const fresh = (p) => new Request(p, { cache: 'reload' });
    await cache.addAll(CRITICAL.map(fresh));
    // A missing icon must not stop the offline shell from installing.
    await Promise.allSettled(OPTIONAL.map((p) => cache.add(fresh(p))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Delete only this app's older shells. Every GitHub Pages project on the same
    // username.github.io origin shares one Cache Storage.
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE_URL)) return;

  if (req.mode === 'navigate') {
    const network = fetchPage(req);
    event.waitUntil(network.catch(() => null));
    event.respondWith(pageResponse(network));
    return;
  }
  url.search = '';
  url.hash = '';
  if (SHELL_URLS.has(url.href)) event.respondWith(cacheFirst(req, url.href));
  // Everything else goes to the network untouched.
});

// Revalidates with the server (conditional request) instead of trusting the HTTP
// cache. A fresh copy of the page also refreshes the offline shell.
async function fetchPage(req) {
  const res = await fetch(new Request(req, { cache: 'no-cache' }));
  if (res.ok && res.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(INDEX_URL, res.clone());
  }
  return res;
}

async function pageResponse(network) {
  let timer;
  const slow = new Promise((resolve) => { timer = setTimeout(resolve, NAV_TIMEOUT_MS, null); });
  let res = null;
  try {
    res = await Promise.race([network, slow]);
  } catch (err) {
    res = null; // Offline or a network error: use the cached shell.
  }
  clearTimeout(timer);
  if (res && (res.ok || res.type === 'opaqueredirect')) return res;

  const cache = await caches.open(CACHE);
  const cached = (await cache.match(INDEX_URL)) || (await cache.match(SCOPE_URL));
  if (cached) return cached;
  if (res) return res; // A server error page is better than nothing.
  // Nothing cached yet and the network is slow: keep waiting for it after all.
  try {
    return await network;
  } catch (err) {
    return new Response(
      '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<body style="background:#0a1022;color:#eef2ff;font:16px system-ui;padding:32px">' +
      '<h1 style="font-size:20px">You are offline</h1>' +
      '<p>Open Pimsleur French once while online so it can work offline next time.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirst(req, key) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') await cache.put(key, res.clone());
  return res;
}
