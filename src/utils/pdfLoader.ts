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
    
    // First try Supabase download method for secure access
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (!downloadError && fileData) {
      console.log('PDF downloaded successfully via Supabase client');
      
      // Verify the downloaded data is a PDF
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const pdfSignature = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
      
      if (pdfSignature !== '%PDF') {
        throw new Error('Downloaded file is not a valid PDF');
      }

      // Create blob with proper content type and headers for PDF.js
      const pdfBlob = new Blob([fileData], { 
        type: 'application/pdf'
      });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      return {
        blobUrl,
        cleanup: () => URL.revokeObjectURL(blobUrl)
      };
    }

    // If direct download fails, try using edge function proxy
    console.log('Direct download failed, trying proxy method:', downloadError);
    
    // Provide specific error message for bucket issues
    if (downloadError?.message?.includes('Bucket not found') || downloadError?.message?.includes('bucket')) {
      throw new Error('Document storage is not properly configured. Please contact admin.');
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No valid session for proxy request');
    }

    const { data: proxyData, error: proxyError } = await supabase.functions.invoke('pdf-proxy', {
      body: { filePath }
    });

    if (proxyError) {
      console.error('Proxy error:', proxyError);
      throw new Error(`Proxy failed: ${proxyError.message}`);
    }

    if (!proxyData) {
      throw new Error('No data received from proxy');
    }

    // Handle different response types from edge function
    let pdfBlob: Blob;
    
    if (proxyData instanceof ArrayBuffer) {
      pdfBlob = new Blob([proxyData], { type: 'application/pdf' });
    } else if (proxyData instanceof Blob) {
      pdfBlob = proxyData;
    } else if (typeof proxyData === 'string') {
      // If it's base64 or similar, convert it
      const binaryString = atob(proxyData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBlob = new Blob([bytes], { type: 'application/pdf' });
    } else {
      // Assume it's already binary data
      pdfBlob = new Blob([new Uint8Array(proxyData)], { type: 'application/pdf' });
    }

    // Validate PDF signature from blob
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const pdfSignature = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    
    if (pdfSignature !== '%PDF') {
      throw new Error('Proxy returned invalid PDF data');
    }

    const blobUrl = URL.createObjectURL(pdfBlob);
    console.log('PDF loaded successfully via proxy');
    
    return {
      blobUrl,
      cleanup: () => URL.revokeObjectURL(blobUrl)
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF loading failed:', error);
    
    // Log error for admin review
    logPDFError(error as Error, filePath, userId);
    
    toast.error(`Failed to load PDF: ${errorMessage}`);
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