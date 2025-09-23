import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ClipboardCheck, 
  FileText, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DocumentWithCodes {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  page_count: number;
  provider_id: string;
  profiles?: {
    name: string;
    email: string;
  };
  page_codes: Array<{
    id: string;
    page_number: number;
    icd_codes: string[];
    cpt_codes: string[];
    notes: string;
    created_by: string;
    created_at: string;
    profiles?: {
      name: string;
      email: string;
    };
  }>;
}

export const AuditQueue: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentWithCodes[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithCodes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditComment, setAuditComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles:provider_id (name, email),
          page_codes (*)
        `)
        .in('status', ['CODING_COMPLETE', 'UNDER_AUDIT'])
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as any || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents for audit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'APPROVED' })
        .eq('id', documentId);

      if (error) throw error;
      
      toast.success('Document approved successfully');
      fetchDocuments();
      setSelectedDoc(null);
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    if (!auditComment.trim()) {
      toast.error('Please provide a comment for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'REJECTED' })
        .eq('id', documentId);

      if (error) throw error;
      
      toast.success('Document rejected with feedback');
      fetchDocuments();
      setSelectedDoc(null);
      setAuditComment('');
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CODING_COMPLETE': 'bg-primary/10 text-primary border-primary/20',
      'UNDER_AUDIT': 'bg-warning/10 text-warning border-warning/20',
      'APPROVED': 'bg-success/10 text-success border-success/20',
      'REJECTED': 'bg-error/10 text-error border-error/20',
    };
    return colors[status] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'CODING_COMPLETE').length,
    inReview: documents.filter(d => d.status === 'UNDER_AUDIT').length,
    approved: documents.filter(d => d.status === 'APPROVED').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Audit Queue
        </h1>
        <p className="text-muted-foreground">
          Review and approve medical coding assignments with quality assurance tools.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Document Queue</CardTitle>
          <CardDescription>
            Review coded documents and provide audit feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents or providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{doc.filename}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Provider: {doc.profiles?.name || 'Unknown'}
                      </span>
                      <span>Pages: {doc.page_count}</span>
                      <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      <span>Codes: {doc.page_codes.length} pages coded</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/pdf-coding/${doc.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      
                      {doc.status === 'CODING_COMPLETE' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          Audit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show coded pages summary */}
                {doc.page_codes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Coded Pages Summary:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {doc.page_codes.slice(0, 3).map((code) => (
                        <div key={code.id} className="text-xs bg-muted/50 rounded p-2">
                          <div className="font-medium">Page {code.page_number}</div>
                          <div className="text-muted-foreground">
                            ICD: {code.icd_codes.length}, CPT: {code.cpt_codes.length}
                          </div>
                          <div className="text-muted-foreground">
                            By: {code.profiles?.name || 'Unknown'}
                          </div>
                        </div>
                      ))}
                      {doc.page_codes.length > 3 && (
                        <div className="text-xs bg-muted/30 rounded p-2 flex items-center justify-center">
                          +{doc.page_codes.length - 3} more pages
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents in audit queue</p>
                <p className="text-sm">All documents have been processed</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Modal */}
      {selectedDoc && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Audit Document: {selectedDoc.filename}
              </CardTitle>
              <CardDescription>
                Review and approve/reject this coded document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Document Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Provider:</strong> {selectedDoc.profiles?.name}
                  </div>
                  <div>
                    <strong>Pages:</strong> {selectedDoc.page_count}
                  </div>
                  <div>
                    <strong>Coded Pages:</strong> {selectedDoc.page_codes.length}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedDoc.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Audit Comment</h4>
                <Textarea
                  placeholder="Add audit comments, feedback, or reasons for rejection..."
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => handleApproveDocument(selectedDoc.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Document
                </Button>
                
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleRejectDocument(selectedDoc.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Document
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDoc(null);
                    setAuditComment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
};