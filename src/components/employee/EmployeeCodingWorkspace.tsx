import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ArrowLeft, CheckCircle, XCircle, Upload, Plus, Trash2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  filename: string;
  file_url: string;
  page_count: number;
  status: string;
  provider_id: string;
}

interface IcdPageCode {
  id: string;
  pageNumber: number;
  icdCodes: string[];
  comments: string;
  supportingFiles: string[]; // Store file names as strings for JSON compatibility
}

export const EmployeeCodingWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Document identification and decision
  const [documentId, setDocumentId] = useState('');
  const [document, setDocument] = useState<Document | null>(null);
  const [decision, setDecision] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [isDocumentAccepted, setIsDocumentAccepted] = useState(false);
  
  // ICD coding
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentIcdCodes, setCurrentIcdCodes] = useState<string[]>(['']);
  const [currentComments, setCurrentComments] = useState('');
  const [currentSupportingFiles, setCurrentSupportingFiles] = useState<File[]>([]);
  const [currentSupportingFileNames, setCurrentSupportingFileNames] = useState<string[]>([]);
  
  // ICD Page & Code Table
  const [icdPageCodes, setIcdPageCodes] = useState<IcdPageCode[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocument = async () => {
    if (!documentId.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId.trim())
        .single();

      if (error) {
        toast.error('Document not found');
        setDocument(null);
        return;
      }

      setDocument(data);
      toast.success('Document loaded successfully');
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to fetch document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentDecision = async () => {
    if (!decision || !document || !user) {
      toast.error('Please select Accept or Reject');
      return;
    }

    if (decision === 'REJECTED' && !decisionComments.trim()) {
      toast.error('Comments are required when rejecting a document');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('document_decisions')
        .upsert({
          document_id: document.id,
          employee_id: (user as any)?.id || user?.email,
          decision,
          comments: decisionComments || null,
        });

      if (error) throw error;

      setIsDocumentAccepted(decision === 'ACCEPTED');
      toast.success(
        decision === 'ACCEPTED' 
          ? 'Document accepted. You can now proceed to ICD coding.' 
          : 'Document rejected successfully.'
      );
    } catch (error) {
      console.error('Error saving decision:', error);
      toast.error('Failed to save decision');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIcdCode = () => {
    setCurrentIcdCodes([...currentIcdCodes, '']);
  };

  const handleRemoveIcdCode = (index: number) => {
    setCurrentIcdCodes(currentIcdCodes.filter((_, i) => i !== index));
  };

  const handleIcdCodeChange = (index: number, value: string) => {
    const updatedCodes = [...currentIcdCodes];
    updatedCodes[index] = value.toUpperCase();
    setCurrentIcdCodes(updatedCodes);
  };

  const handleSupportingFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newFileNames = newFiles.map(file => file.name);
      setCurrentSupportingFiles(prev => [...prev, ...newFiles]);
      setCurrentSupportingFileNames(prev => [...prev, ...newFileNames]);
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeSupportingFile = (index: number) => {
    setCurrentSupportingFiles(prev => prev.filter((_, i) => i !== index));
    setCurrentSupportingFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPageAndCodes = () => {
    if (!currentIcdCodes.some(code => code.trim())) {
      toast.error('Please enter at least one ICD-10 code');
      return;
    }

    // Check if page already exists
    const existingPageIndex = icdPageCodes.findIndex(
      entry => entry.pageNumber === currentPageNumber
    );

    const newEntry: IcdPageCode = {
      id: Date.now().toString(),
      pageNumber: currentPageNumber,
      icdCodes: currentIcdCodes.filter(code => code.trim()),
      comments: currentComments,
      supportingFiles: currentSupportingFileNames,
    };

    if (existingPageIndex >= 0) {
      // Update existing page
      const updatedEntries = [...icdPageCodes];
      updatedEntries[existingPageIndex] = newEntry;
      setIcdPageCodes(updatedEntries);
      toast.success(`Page ${currentPageNumber} updated successfully`);
    } else {
      // Add new page
      setIcdPageCodes(prev => [...prev, newEntry]);
      toast.success(`Page ${currentPageNumber} added successfully`);
    }

    // Reset form
    setCurrentIcdCodes(['']);
    setCurrentComments('');
    setCurrentSupportingFiles([]);
    setCurrentSupportingFileNames([]);
    setCurrentPageNumber(currentPageNumber + 1);
  };

  const handleRemovePageEntry = (id: string) => {
    setIcdPageCodes(prev => prev.filter(entry => entry.id !== id));
    toast.success('Page entry removed');
  };

  const handleSubmitForAudit = async () => {
    if (!document || !user || icdPageCodes.length === 0) {
      toast.error('Please add at least one page with ICD codes before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save ICD page codes to database
      const icdPageCodesData = icdPageCodes.map(entry => ({
        document_id: document.id,
        employee_id: (user as any)?.id || user?.email,
        page_number: entry.pageNumber,
        icd_codes: entry.icdCodes,
        comments: entry.comments || null,
        supporting_files: entry.supportingFiles, // Already strings now
      }));

      // Insert/update ICD page codes
      const { error: icdError } = await supabase
        .from('icd_page_codes')
        .upsert(icdPageCodesData);

      if (icdError) throw icdError;

      // Create audit submission
      const { error: submissionError } = await supabase
        .from('audit_submissions')
        .insert([{
          document_id: document.id,
          employee_id: (user as any)?.id || user?.email,
          submission_data: {
            icd_page_codes: icdPageCodes,
            document_decision: {
              decision,
              comments: decisionComments,
            },
          } as any,
          status: 'PENDING',
        }]);

      if (submissionError) throw submissionError;

      // Update document status
      const { error: docError } = await supabase
        .from('documents')
        .update({ status: 'CODING_COMPLETE' })
        .eq('id', document.id);

      if (docError) throw docError;

      toast.success('Document submitted for audit successfully');
      
      // Reset form completely
      setDocument(null);
      setDocumentId('');
      setDecision(null);
      setDecisionComments('');
      setIsDocumentAccepted(false);
      setIcdPageCodes([]);
      setCurrentPageNumber(1);
      setCurrentIcdCodes(['']);
      setCurrentComments('');
      setCurrentSupportingFiles([]);
      setCurrentSupportingFileNames([]);
      
    } catch (error) {
      console.error('Error submitting for audit:', error);
      toast.error('Failed to submit for audit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Employee Coding Workspace
          </h1>
          <p className="text-muted-foreground">
            Document identification, decision making, and ICD-10 coding workflow
          </p>
        </div>
        
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Document Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Document Identification</CardTitle>
          <CardDescription>Enter the Document ID to begin the coding process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="documentId">Enter Document ID</Label>
              <Input
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Enter document ID..."
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchDocument} 
                disabled={!documentId.trim() || isLoading}
              >
                {isLoading ? 'Loading...' : 'Load Document'}
              </Button>
            </div>
          </div>

          {/* Document Info */}
          {document && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">{document.filename}</h3>
              <p className="text-sm text-muted-foreground">
                {document.page_count} pages • Status: {document.status}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Decision */}
      {document && !isDocumentAccepted && (
        <Card>
          <CardHeader>
            <CardTitle>Document Decision</CardTitle>
            <CardDescription>Accept or reject the document for coding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={decision === 'ACCEPTED' ? 'default' : 'outline'}
                className={decision === 'ACCEPTED' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setDecision('ACCEPTED')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Document
              </Button>
              <Button
                variant={decision === 'REJECTED' ? 'destructive' : 'outline'}
                onClick={() => setDecision('REJECTED')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Document
              </Button>
            </div>

            {decision && (
              <div>
                <Label htmlFor="decisionComments">
                  Comments {decision === 'REJECTED' && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="decisionComments"
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder={
                    decision === 'REJECTED' 
                      ? 'Please provide reasons for rejection...' 
                      : 'Optional comments...'
                  }
                  rows={3}
                />
              </div>
            )}

            {decision && (
              <Button onClick={handleDocumentDecision} disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : `Submit ${decision === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ICD-10 Coding Section */}
      {isDocumentAccepted && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - ICD Coding Form */}
          <Card>
            <CardHeader>
              <CardTitle>ICD-10 Coding</CardTitle>
              <CardDescription>Add ICD codes for each page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pageNumber">Page Number</Label>
                <Input
                  id="pageNumber"
                  type="number"
                  value={currentPageNumber}
                  onChange={(e) => setCurrentPageNumber(parseInt(e.target.value) || 1)}
                  min="1"
                  max={document?.page_count || 1}
                />
              </div>

              <div>
                <Label>ICD-10 Codes</Label>
                <div className="space-y-2">
                  {currentIcdCodes.map((code, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={code}
                        onChange={(e) => handleIcdCodeChange(index, e.target.value)}
                        placeholder="Enter ICD-10 code"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveIcdCode(index)}
                        disabled={currentIcdCodes.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddIcdCode}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add ICD Code
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={currentComments}
                  onChange={(e) => setCurrentComments(e.target.value)}
                  placeholder="Optional comments for this page..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Supporting Documents</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleSupportingFileUpload}
                    className="hidden"
                    id="supportingFiles"
                  />
                  <Button
                    variant="outline"
                    onClick={() => window.document.getElementById('supportingFiles')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Supporting Files
                  </Button>
                </div>
                
                {currentSupportingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {currentSupportingFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSupportingFile(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleAddPageAndCodes} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Page & ICD Codes
              </Button>
            </CardContent>
          </Card>

          {/* Right Panel - HCC Table */}
          <Card>
            <CardHeader>
              <CardTitle>HCC</CardTitle>
              <CardDescription>ICD-10 Page & Code Table</CardDescription>
            </CardHeader>
            <CardContent>
              {icdPageCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pages added yet. Use the form on the left to add pages with ICD codes.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Number</TableHead>
                      <TableHead>ICD-10 Code(s)</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Supporting Docs</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {icdPageCodes.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.pageNumber}</TableCell>
                        <TableCell>
                          {entry.icdCodes.map((code, index) => (
                            <Badge key={index} variant="outline" className="mr-1 mb-1">
                              {code}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.comments || '-'}
                        </TableCell>
                        <TableCell>
                          {entry.supportingFiles.length > 0 
                            ? `${entry.supportingFiles.length} file(s)` 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePageEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit for Audit */}
      {isDocumentAccepted && icdPageCodes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmitForAudit} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit for Audit'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};