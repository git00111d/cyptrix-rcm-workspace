import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubmissionStatus {
  id: string;
  document_id: string;
  status: string;
  submission_data: any;
  auditor_comments: string | null;
  audited_at: string | null;
  created_at: string;
  documents: {
    filename: string;
    page_count: number;
  };
}

export const SubmissionStatusPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionStatus | null>(null);

  useEffect(() => {
    if (user?.userId) {
      fetchSubmissions();
    }
  }, [user?.userId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_submissions')
        .select(`
          id,
          document_id,
          status,
          submission_data,
          auditor_comments,
          audited_at,
          created_at,
          documents (
            filename,
            page_count
          )
        `)
        .eq('employee_id', user?.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submission status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Submission Status</CardTitle>
        <CardDescription>Track the status of your coding submissions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'PENDING').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter(s => s.status === 'REJECTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No submissions found. Complete your first coding task to see status here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Pages Coded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Audited</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.documents.filename}
                  </TableCell>
                  <TableCell>
                    {submission.submission_data.icd_page_codes?.length || 0} / {submission.documents.page_count}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)} variant="secondary">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(submission.status)}
                        {submission.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(submission.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {submission.audited_at ? formatDate(submission.audited_at) : '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submission Details</DialogTitle>
                        </DialogHeader>
                        {selectedSubmission && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-medium mb-2">Document</h4>
                              <p>{selectedSubmission.documents.filename}</p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Status</h4>
                              <Badge className={getStatusColor(selectedSubmission.status)} variant="secondary">
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(selectedSubmission.status)}
                                  {selectedSubmission.status}
                                </div>
                              </Badge>
                            </div>

                            {selectedSubmission.auditor_comments && (
                              <div>
                                <h4 className="font-medium mb-2">Auditor Comments</h4>
                                <div className="p-3 bg-muted rounded-lg">
                                  {selectedSubmission.auditor_comments}
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="font-medium mb-2">Your ICD-10 Codes</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Page</TableHead>
                                    <TableHead>ICD-10 Codes</TableHead>
                                    <TableHead>Comments</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedSubmission.submission_data.icd_page_codes?.map((pageCode: any, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell>{pageCode.pageNumber}</TableCell>
                                      <TableCell>
                                        {pageCode.icdCodes.map((code: string, codeIndex: number) => (
                                          <Badge key={codeIndex} variant="outline" className="mr-1 mb-1">
                                            {code}
                                          </Badge>
                                        ))}
                                      </TableCell>
                                      <TableCell>{pageCode.comments || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};