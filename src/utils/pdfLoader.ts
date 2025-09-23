import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PDFLoadResult {
  blobUrl: string;
  cleanup: () => void;
}

export const loadPDFSecurely = async (filePath: string): Promise<PDFLoadResult | null> => {
  try {
    console.log('Loading PDF from path:', filePath);
    
    // First try: Direct signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedError || !signedData) {
      console.error('Error creating signed URL:', signedError);
      throw new Error('Failed to create signed URL');
    }

    // Construct the proper URL
    const supabaseUrl = supabase.storage.from('documents').getPublicUrl('dummy').data.publicUrl;
    const baseUrl = supabaseUrl.replace('/storage/v1/object/public/documents/dummy', '');
    const fullSignedUrl = `${baseUrl}/storage/v1${signedData.signedUrl}`;
    
    console.log('Fetching PDF from:', fullSignedUrl);
    
    try {
      // Try direct fetch first
      const response = await fetch(fullSignedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'Range': 'bytes=0-',
        },
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Ensure proper PDF content type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      console.log('PDF loaded successfully via direct fetch');
      
      return {
        blobUrl,
        cleanup: () => URL.revokeObjectURL(blobUrl)
      };
      
    } catch (directError) {
      console.warn('Direct fetch failed, trying proxy:', directError);
      
      // Fallback: Use edge function proxy
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session for proxy request');
      }

      const proxyUrl = `${baseUrl}/functions/v1/pdf-proxy?file=${encodeURIComponent(filePath)}`;
      
      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/pdf',
        }
      });

      if (!proxyResponse.ok) {
        throw new Error(`Proxy failed: ${proxyResponse.status}`);
      }

      const proxyBlob = await proxyResponse.blob();
      const pdfBlob = new Blob([proxyBlob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      console.log('PDF loaded successfully via proxy');
      
      return {
        blobUrl,
        cleanup: () => URL.revokeObjectURL(blobUrl)
      };
    }
    
  } catch (error) {
    console.error('PDF loading failed:', error);
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