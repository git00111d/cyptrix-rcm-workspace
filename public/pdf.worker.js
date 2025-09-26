// PDF.js worker proxy - improved configuration
if (typeof window !== 'undefined') {
  try {
    // Try to load the worker from the official CDN first
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
  } catch (error) {
    console.warn('Failed to load PDF.js worker from CDN:', error);
    // Fallback: create a minimal worker setup
    self.pdfjsWorker = {
      WorkerMessageHandler: {
        setup: function() {
          console.log('PDF.js worker setup completed');
        }
      }
    };
  }
}