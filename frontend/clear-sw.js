// Clear Service Worker Script
// Run this in browser console to completely remove Service Worker

async function clearServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister all
      for (let registration of registrations) {
        await registration.unregister();
        console.log('✅ Service Worker unregistered:', registration);
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      for (let name of cacheNames) {
        await caches.delete(name);
        console.log('✅ Cache cleared:', name);
      }
      
      console.log('🎉 All Service Workers and caches cleared!');
      console.log('🔄 Now reload the page with Ctrl+Shift+R');
      
    } catch (error) {
      console.error('❌ Error clearing Service Worker:', error);
    }
  } else {
    console.log('ℹ️ Service Worker not supported');
  }
}

// Auto run
clearServiceWorker(); 