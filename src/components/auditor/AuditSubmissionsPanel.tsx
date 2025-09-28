import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuditSubmission {
  id: string;
  document_id: string;
  employee_id: string;
  submission_data: any; // Using any to handle Json type from Supabase
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auditor_id: string | null;
  auditor_comments: string | null;
  audited_at: string | null;
  created_at: string;
  documents: {
    filename: string;
    page_count: number;
  };
  employees: {
    name: string;
    email: string;
  };
}

export const AuditSubmissionsPanel: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AuditSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AuditSubmission | null>(null);
  const [auditorComments, setAuditorComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_submissions')
        .select(`
          *,
          documents (filename, page_count),
          profiles!audit_submissions_employee_id_fkey (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        employees: item.profiles,
      })) as AuditSubmission[] || [];
      
      setSubmissions(transformedData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load audit submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditDecision = async (submissionId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!user) return;

    if (decision === 'REJECTED' && !auditorComments.trim()) {
      toast.error('Comments are required when rejecting a submission');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('audit_submissions')
        .update({
          status: decision,
          auditor_id: (user as any)?.id || user?.email,
          auditor_comments: auditorComments || null,
          audited_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Submission ${decision.toLowerCase()} successfully`);
      setSelectedSubmission(null);
      setAuditorComments('');
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      console.error('Error processing audit decision:', error);
      toast.error('Failed to process audit decision');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-700 border-red-200';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Submissions</CardTitle>
          <CardDescription>Review employee submissions for ICD-10 coding</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                No audit submissions have been made yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{submission.documents.filename}</h3>
                      <p className="text-sm text-muted-foreground">
                        By: {submission.employees.name} • 
                        {submission.submission_data.icd_page_codes.length} pages coded • 
                        Submitted {formatDate(submission.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Review Modal/Panel */}
      {selectedSubmission && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Submission</CardTitle>
                <CardDescription>
                  {selectedSubmission.documents.filename} by {selectedSubmission.employees.name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Decision */}
            <div>
              <h4 className="font-medium mb-2">Document Decision</h4>
              <div className="p-3 bg-muted rounded-lg">
                <p><strong>Decision:</strong> {selectedSubmission.submission_data.document_decision.decision}</p>
                {selectedSubmission.submission_data.document_decision.comments && (
                  <p><strong>Comments:</strong> {selectedSubmission.submission_data.document_decision.comments}</p>
                )}
              </div>
            </div>

            {/* ICD-10 Page & Code Table */}
            <div>
              <h4 className="font-medium mb-2">ICD-10 Codes by Page</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Number</TableHead>
                    <TableHead>ICD-10 Code(s)</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Supporting Docs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSubmission.submission_data.icd_page_codes.map((pageCode, index) => (
                    <TableRow key={index}>
                      <TableCell>{pageCode.pageNumber}</TableCell>
                      <TableCell>
                        {pageCode.icdCodes.map((code, codeIndex) => (
                          <Badge key={codeIndex} variant="outline" className="mr-1 mb-1">
                            {code}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {pageCode.comments || '-'}
                      </TableCell>
                      <TableCell>
                        {pageCode.supportingFiles.length > 0 
                          ? `${pageCode.supportingFiles.length} file(s)` 
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Auditor Review Section */}
            {selectedSubmission.status === 'PENDING' && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Auditor Review</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auditorComments">Comments</Label>
                    <Textarea
                      id="auditorComments"
                      value={auditorComments}
                      onChange={(e) => setAuditorComments(e.target.value)}
                      placeholder="Optional comments for the employee..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAuditDecision(selectedSubmission.id, 'APPROVED')}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Approve Submission'}
                    </Button>
                    <Button
                      onClick={() => handleAuditDecision(selectedSubmission.id, 'REJECTED')}
                      disabled={isProcessing}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Reject Submission'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Show existing audit results if already processed */}
            {selectedSubmission.status !== 'PENDING' && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-2">Audit Result</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p><strong>Status:</strong> {selectedSubmission.status}</p>
                  {selectedSubmission.auditor_comments && (
                    <p><strong>Auditor Comments:</strong> {selectedSubmission.auditor_comments}</p>
                  )}
                  {selectedSubmission.audited_at && (
                    <p><strong>Audited At:</strong> {formatDate(selectedSubmission.audited_at)}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};