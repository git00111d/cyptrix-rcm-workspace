import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PDFLoadResult {
  blobUrl: string;
  cleanup: () => void;
}

const logPDFError = (error: Error, filePath: string, userId?: string) => {
  console.error('[PDF ERROR]', {
    message: error.message,
    filePath,
    userId,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};

export const loadPDFSecurely = async (filePath: string, userId?: string): Promise<PDFLoadResult | null> => {
  try {
    console.log('Loading PDF from path:', filePath);
    
    // Use Supabase download method for secure access
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      
      // Fallback: Try using edge function proxy
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('No valid session for proxy request');
        }

        const { data: proxyData, error: proxyError } = await supabase.functions.invoke('pdf-proxy', {
          body: { filePath },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });

        if (proxyError || !proxyData) {
          throw new Error(`Proxy failed: ${proxyError?.message}`);
        }

        // Convert the proxy response to blob if it's not already
        let blob: Blob;
        if (proxyData instanceof Blob) {
          blob = proxyData;
        } else {
          blob = new Blob([proxyData], { type: 'application/pdf' });
        }

        const blobUrl = URL.createObjectURL(blob);
        console.log('PDF loaded successfully via proxy');
        
        return {
          blobUrl,
          cleanup: () => URL.revokeObjectURL(blobUrl)
        };
      } catch (proxyError) {
        console.error('Proxy fallback failed:', proxyError);
        throw new Error('Failed to load document through all methods');
      }
    }

    // Verify the downloaded data is a PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const pdfSignature = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    
    if (pdfSignature !== '%PDF') {
      throw new Error('Downloaded file is not a valid PDF');
    }

    // Create blob with proper content type
    const pdfBlob = new Blob([fileData], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    console.log('PDF loaded successfully via download');
    
    return {
      blobUrl,
      cleanup: () => URL.revokeObjectURL(blobUrl)
    };
    
  } catch (error) {
    console.error('PDF loading failed:', error);
    
    // Log error for admin review
    logPDFError(error as Error, filePath, userId);
    
    toast.error(`Failed to load PDF: ${error.message}`);
    return null;
  }
};

export const validatePDFBytes = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
        const pdfSignature = Array.from(bytes.slice(0, 4))
          .map(b => String.fromCharCode(b))
          .join('');
        resolve(pdfSignature === '%PDF');
      } else {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};