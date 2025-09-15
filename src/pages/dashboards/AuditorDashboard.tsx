import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Users, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  filename: string;
  file_url: string;
  page_count: number;
  uploaded_at: string;
  status: string;
  provider_id: string;
  profiles?: {
    name: string;
    email: string;
  };
}

interface PageCode {
  id: string;
  document_id: string;
  page_number: number;
  created_by: string;
  created_at: string;
  profiles?: {
    name: string;
    role: string;
  };
}

export const AuditorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pageCodes, setPageCodes] = useState<PageCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all documents with provider information
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          *,
          profiles:provider_id (name, email)
        `)
        .order('uploaded_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        toast.error('Failed to load documents');
      } else {
        setDocuments(documentsData || []);
      }

      // Fetch all page codes with user information
      const { data: pageCodesData, error: pageCodesError } = await supabase
        .from('page_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (pageCodesError) {
        console.error('Error fetching page codes:', pageCodesError);
        toast.error('Failed to load coding data');
      } else {
        // Fetch user information separately for now
        const userIds = [...new Set(pageCodesData?.map(code => code.created_by) || [])];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, name, role')
          .in('id', userIds);

        // Merge user data with page codes
        const enrichedPageCodes = pageCodesData?.map(code => ({
          ...code,
          profiles: usersData?.find(user => user.id === code.created_by)
        })) || [];

        setPageCodes(enrichedPageCodes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
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

  const getUniqueCoders = () => {
    const coders = new Set();
    pageCodes.forEach(code => {
      if (code.profiles?.name) {
        coders.add(code.profiles.name);
      }
    });
    return coders.size;
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
        <div>
          <h1 className="text-3xl font-bold">Auditor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Review all documents and coding activities.
          </p>
        </div>

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
              <CardTitle className="text-sm font-medium">Active Coders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUniqueCoders()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coded Pages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pageCodes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pageCodes.filter(code => {
                  const codeDate = new Date(code.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return codeDate > weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>All Documents (Read-Only Review)</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  No documents have been uploaded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => {
                  const documentCodes = pageCodes.filter(code => code.document_id === document.id);
                  return (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{document.filename}</h3>
                          <p className="text-sm text-muted-foreground">
                            Provider: {document.profiles?.name || 'Unknown'} • 
                            {document.page_count} pages • 
                            {documentCodes.length} coded pages • 
                            Uploaded {formatDate(document.uploaded_at)}
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
                          Review
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Coding Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Coding Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {pageCodes.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No coding activity yet</h3>
                <p className="text-muted-foreground">
                  No pages have been coded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pageCodes.slice(0, 10).map((code) => {
                  const document = documents.find(d => d.id === code.document_id);
                  return (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{document?.filename || 'Unknown Document'}</p>
                        <p className="text-sm text-muted-foreground">
                          Page {code.page_number} coded by {code.profiles?.name || 'Unknown'} ({code.profiles?.role || 'Unknown Role'})
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(code.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};