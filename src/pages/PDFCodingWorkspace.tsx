import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { PageCodeEditor } from '@/components/coding/PageCodeEditor';

interface Document {
  id: string;
  filename: string;
  file_url: string;
  page_count: number;
  provider_id: string;
}

export const PDFCodingWorkspace: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  useEffect(() => {
    if (document?.file_url) {
      getSignedUrl();
    }
  }, [document]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        toast.error('Failed to load document');
        navigate('/dashboard');
        return;
      }

      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getSignedUrl = async () => {
    if (!document?.file_url) return;

    try {
      // Extract the file path from the full URL
      const urlParts = document.file_url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get bucket/filename

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        // Fallback to original URL if it's already public
        setSignedUrl(document.file_url);
      } else {
        setSignedUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      setSignedUrl(document.file_url);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const isReadOnly = user?.role === 'AUDITOR';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested document could not be found.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{document.filename}</h1>
                <p className="text-sm text-muted-foreground">
                  {isReadOnly ? 'Viewing Mode (Read Only)' : 'Coding Mode'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF Viewer */}
          <div>
            {signedUrl && (
              <PDFViewer
                fileUrl={signedUrl}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* Coding Panel */}
          <div>
            <PageCodeEditor
              documentId={document.id}
              pageNumber={currentPage}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
};