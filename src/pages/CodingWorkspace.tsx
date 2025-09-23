import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, FileText, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EnhancedDocumentViewer } from '@/components/coding/EnhancedDocumentViewer';
import { EnhancedCodingPanel } from '@/components/coding/EnhancedCodingPanel';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  page_count: number;
  status: string;
  provider_id: string;
}

export const CodingWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const docId = searchParams.get('docId');

  useEffect(() => {
    fetchAvailableDocuments();
    if (docId) {
      fetchDocument();
      setSelectedDocId(docId);
    }
  }, [docId]);

  const fetchAvailableDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .in('status', ['UPLOADED', 'ASSIGNED', 'CODING_IN_PROGRESS']);

      if (error) throw error;
      setAvailableDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load available documents');
    }
  };

  const fetchDocument = async () => {
    if (!docId) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) {
        toast.error('Failed to load document');
        return;
      }

      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to connect to database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (newDocId: string) => {
    setSelectedDocId(newDocId);
    navigate(`/coding?docId=${newDocId}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading && docId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dual-Panel Coding Workspace
          </h1>
          <p className="text-muted-foreground">
            Advanced medical document coding with autocomplete and real-time validation
          </p>
        </div>
        
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Document Selection */}
      {!docId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Document to Code</CardTitle>
            <CardDescription>
              Choose from available documents that need coding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDocId} onValueChange={handleDocumentSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document to start coding..." />
              </SelectTrigger>
              <SelectContent>
                {availableDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{doc.filename}</span>
                      <Badge variant="outline" className="ml-2">
                        {doc.page_count} pages
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableDocuments.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents available for coding</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dual Panel Workspace */}
      {docId && document && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[800px]">
          {/* Left Panel - Enhanced Document Viewer */}
          <EnhancedDocumentViewer
            document={document}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            className="h-fit"
          />

          {/* Right Panel - Enhanced Coding Panel */}
          <EnhancedCodingPanel
            documentId={document.id}
            pageNumber={currentPage}
            className="h-fit"
          />
        </div>
      )}
    </div>
  );
};