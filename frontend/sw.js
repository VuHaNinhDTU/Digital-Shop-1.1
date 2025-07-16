// Service Worker for CHỢ NÔNG SẢN SỐ
// Version 1.0.2

const CACHE_NAME = 'cho-nong-san-so-v2-no-root';
const urlsToCache = [
  // Remove root and index.html from cache to allow redirect
  // '/',
  // '/index.html',
  '/style.css',
  '/js/api.js',
  '/js/utils.js',
  '/js/lazyLoader.js',
  '/js/imageOptimizer.js',
  '/js/assetOptimizer.js',
  '/js/performanceDashboard.js',
  '/js/optimizationInit.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('⚠️ Service Worker: Cache failed', err);
      })
  );
});

// Fetch events with improved error handling
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip caching for root route to allow redirect
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.log('⚠️ Service Worker: Fetch failed for root', error);
          // Return a fallback response instead of letting it crash
          return new Response(
            '<html><body><h1>Đang tải...</h1><p>Vui lòng đợi server khởi động</p></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        })
    );
    return;
  }
  
  // Handle favicon.ico specially
  if (url.pathname === '/favicon.ico') {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.log('⚠️ Service Worker: Favicon not found, returning empty response');
          // Return empty response for favicon instead of failing
          return new Response(null, {
            status: 204,
            statusText: 'No Content'
          });
        })
    );
    return;
  }
  
  // Handle static files and other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network with proper error handling
        return fetch(event.request)
          .catch(error => {
            console.log('⚠️ Service Worker: Fetch failed for', event.request.url, error);
            
            // For HTML requests, return offline page
            if (event.request.headers.get('Accept') && event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html') || new Response(
                '<html><body><h1>Không thể tải trang</h1><p>Vui lòng kiểm tra kết nối mạng</p></body></html>',
                {
                  status: 503,
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            // For other resources, return appropriate error response
            return new Response(null, {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
      .catch(error => {
        console.log('⚠️ Service Worker: Cache match failed', error);
        // Fallback for cache errors
        return new Response(null, {
          status: 500,
          statusText: 'Internal Server Error'
        });
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('🔄 Service Worker: Background sync')
    );
  }
});

// Push notifications (if needed later)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Có thông báo mới từ Chợ Nông Sản Số',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png'
  };

  event.waitUntil(
    self.registration.showNotification('Chợ Nông Sản Số', options)
  );
});

// Handle Service Worker errors
self.addEventListener('error', event => {
  console.error('⚠️ Service Worker: Error', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
  console.error('⚠️ Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault(); // Prevent the error from bubbling up
}); 