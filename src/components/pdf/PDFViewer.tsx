import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Configure PDF.js worker immediately - this must happen before any PDF operations
const setupPDFWorker = () => {
  try {
    // First, try to set a CDN worker
    const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('PDF.js worker configured with CDN:', workerUrl);
    return true;
  } catch (error) {
    console.warn('Failed to configure CDN worker, disabling worker:', error);
    // Fallback: disable worker completely to use main thread
    pdfjs.GlobalWorkerOptions.workerSrc = '';
    return false;
  }
};

// Initialize worker immediately when module loads
setupPDFWorker();

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  currentPage,
  onPageChange,
  className = '',
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [retryKey, setRetryKey] = useState(0);

  // Ensure worker is configured before any PDF operations
  useEffect(() => {
    // Double-check worker configuration on component mount
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      console.warn('Worker not configured on mount, setting fallback...');
      pdfjs.GlobalWorkerOptions.workerSrc = '';
    }
  }, []);

  // Memoize PDF options for better performance and security
  const pdfOptions = useMemo(() => ({
    disableRange: false,
    disableStream: false,
    disableAutoFetch: false,
    disableFontFace: false,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/`,
    cMapPacked: true,
    withCredentials: false,
    httpHeaders: {
      'Accept': 'application/pdf',
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, max-age=60'
    },
    standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/`,
    // Security options
    isEvalSupported: false,
    maxImageSize: 16777216 // 16MB limit
  }), []);

  // Security: Disable right-click, keyboard shortcuts, and text selection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts for copying, saving, printing
      if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        toast.error('This action is not allowed for secure documents');
      }
      // Disable F12, F5, Ctrl+Shift+I, etc.
      if (e.key === 'F12' || e.key === 'F5' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        toast.error('Developer tools access is restricted');
      }
    };

    const pdfContainer = document.querySelector('.pdf-container');
    if (pdfContainer) {
      pdfContainer.addEventListener('contextmenu', handleContextMenu);
      pdfContainer.addEventListener('selectstart', (e) => e.preventDefault());
      pdfContainer.addEventListener('dragstart', (e) => e.preventDefault());
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (pdfContainer) {
        pdfContainer.removeEventListener('contextmenu', handleContextMenu);
        pdfContainer.removeEventListener('selectstart', (e) => e.preventDefault());
        pdfContainer.removeEventListener('dragstart', (e) => e.preventDefault());
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log(`PDF loaded successfully with ${numPages} pages`);
    toast.success(`PDF loaded with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
    
    // Handle specific worker-related errors with automatic retry
    if (error.message.includes('worker') || 
        error.message.includes('Worker') || 
        error.message.includes('GlobalWorkerOptions') ||
        error.message.includes('workerSrc') ||
        error.message.includes('setup') || 
        error.message.includes('fake worker failed')) {
      
      console.warn('PDF.js worker error detected, disabling worker and retrying...');
      
      // Disable worker completely to use main thread
      pdfjs.GlobalWorkerOptions.workerSrc = '';
      
      // Trigger a retry by updating the key
      setRetryKey(prev => prev + 1);
      setError('Retrying PDF load without worker...');
      
      // Clear error after a brief delay to trigger retry
      setTimeout(() => {
        setError('');
        setLoading(true);
      }, 500);
      return;
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to load PDF document';
    if (error.message.includes('Invalid PDF structure')) {
      errorMessage = 'The PDF file appears to be corrupted';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage = 'Network error loading PDF. Please try again';
    } else if (error.message.includes('decode')) {
      errorMessage = 'PDF format not supported';
    } else if (error.message.includes('bucket') || error.message.includes('Bucket')) {
      errorMessage = 'Document storage error. Please contact admin.';
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <Card className={`p-4 ${className}`} style={{ userSelect: 'none' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">SECURE VIEW</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        className="border rounded-lg bg-muted/20 flex justify-center min-h-[600px] relative overflow-auto pdf-container"
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none', 
          MozUserSelect: 'none',
          msUserSelect: 'none',
          pointerEvents: 'auto',
          WebkitTouchCallout: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        <Document
          key={`${fileUrl}-${retryKey}`} // Add retry key to force remount on retry
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error={
            error ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Document Loading Failed</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setError('');
                    setRetryKey(prev => prev + 1);
                    setLoading(true);
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : null
          }
          options={pdfOptions}
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-lg select-none"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </Card>
  );
};