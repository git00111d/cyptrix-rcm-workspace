import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Upload, Eye, Activity, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DocumentUpload } from '@/components/provider/DocumentUpload';

interface Document {
  id: string;
  filename: string;
  file_url: string;
  page_count: number;
  uploaded_at: string;
  status: string;
}

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPDF = (documentId: string) => {
    navigate(`/pdf-coding/${documentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete associated page codes first
      const { error: pageCodesError } = await supabase
        .from('page_codes')
        .delete()
        .in('document_id', selectedDocuments);

      if (pageCodesError) {
        console.error('Error deleting page codes:', pageCodesError);
        toast.error('Failed to delete associated page codes');
        return;
      }

      // Delete associated document queries
      const { error: queriesError } = await supabase
        .from('document_queries')
        .delete()
        .in('document_id', selectedDocuments);

      if (queriesError) {
        console.error('Error deleting document queries:', queriesError);
        toast.error('Failed to delete associated queries');
        return;
      }

      // Get file paths for storage cleanup
      const { data: documentsToDelete, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .in('id', selectedDocuments);

      if (fetchError) {
        console.error('Error fetching documents for deletion:', fetchError);
        toast.error('Failed to fetch documents for deletion');
        return;
      }

      // Delete files from storage
      if (documentsToDelete && documentsToDelete.length > 0) {
        const filePaths = documentsToDelete.map(doc => doc.file_path);
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
          // Continue with database deletion even if storage cleanup fails
        }
      }

      // Finally, delete the documents
      const { error: documentsError } = await supabase
        .from('documents')
        .delete()
        .in('id', selectedDocuments);

      if (documentsError) {
        console.error('Error deleting documents:', documentsError);
        toast.error('Failed to delete documents');
        return;
      }

      toast.success(`Successfully deleted ${selectedDocuments.length} document(s)`);
      setSelectedDocuments([]);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error during deletion:', error);
      toast.error('An error occurred while deleting documents');
    } finally {
      setIsDeleting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Provider Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Manage your documents and coding workflow.
            </p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            {showUpload ? 'Hide Upload' : 'Upload Document'}
          </Button>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle>Upload New Document</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload />
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploaded</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documents.filter(d => d.status === 'UPLOADED').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documents.filter(d => d.status === 'IN_PROGRESS').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documents.filter(d => d.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Documents</CardTitle>
              {documents.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectedDocuments.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedDocuments.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Documents</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedDocuments.length} document(s)? 
                            This action cannot be undone and will also delete all associated data including coding and queries.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteSelected}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Documents
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedDocuments.length === documents.length && documents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents uploaded yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first PDF document to start the coding workflow.
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedDocuments.includes(document.id)}
                        onCheckedChange={(checked) => handleSelectDocument(document.id, checked as boolean)}
                      />
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{document.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          {document.page_count} pages • Uploaded {formatDate(document.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(document.status)}>
                        {document.status.replace('_', ' ')}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPDF(document.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Open & Code
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};