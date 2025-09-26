import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Code, FileText, ArrowLeft, CheckCircle, XCircle, Upload, Plus, Trash2 } from 'lucide-react';
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

// NEW: Interface for ICD-10 Page & Code entries
interface IcdPageCode {
  id: string;
  pageNo: number;
  code: string;
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
  
  // NEW: State for added functionality
  const [documentCode, setDocumentCode] = useState('');
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [icdPageCodes, setIcdPageCodes] = useState<IcdPageCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // NEW: Handlers for added functionality
  const handleDecisionSubmit = async () => {
    if (!decision) {
      toast.error('Please select Accept or Reject');
      return;
    }
    
    if (decision === 'reject' && !comments.trim()) {
      toast.error('Comments are required when rejecting a document');
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically save the decision to the database
      // For now, just show a success message
      toast.success(`Document ${decision === 'accept' ? 'accepted' : 'rejected'} successfully`);
      
      // Reset form
      setDecision(null);
      setComments('');
    } catch (error) {
      toast.error('Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportingFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSupportingFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeSupportingFile = (index: number) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addIcdPageCode = () => {
    const newEntry: IcdPageCode = {
      id: Date.now().toString(),
      pageNo: 1,
      code: ''
    };
    setIcdPageCodes(prev => [...prev, newEntry]);
  };

  const updateIcdPageCode = (id: string, field: 'pageNo' | 'code', value: string | number) => {
    setIcdPageCodes(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const removeIcdPageCode = (id: string) => {
    setIcdPageCodes(prev => prev.filter(entry => entry.id !== id));
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
          {/* Left Panel - Enhanced Document Viewer with NEW Document Details */}
          <div className="space-y-6">
            <EnhancedDocumentViewer
              document={document}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              className="h-fit"
            />
            
            {/* NEW: Document Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NEW: Document Code Field */}
                <div>
                  <Label htmlFor="documentCode">Document Code</Label>
                  <Input
                    id="documentCode"
                    value={documentCode}
                    onChange={(e) => setDocumentCode(e.target.value)}
                    placeholder="Enter unique document code"
                  />
                </div>

                {/* NEW: Decision Section */}
                <div>
                  <Label>Document Decision</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={decision === 'accept' ? 'default' : 'outline'}
                      className={decision === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => setDecision('accept')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Document
                    </Button>
                    <Button
                      variant={decision === 'reject' ? 'destructive' : 'outline'}
                      onClick={() => setDecision('reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Document
                    </Button>
                  </div>
                </div>

                {/* NEW: Comment Box (required if Reject is chosen) */}
                {decision && (
                  <div>
                    <Label htmlFor="comments">
                      Comments {decision === 'reject' && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={decision === 'reject' ? 'Please provide reasons for rejection...' : 'Optional comments...'}
                      rows={3}
                    />
                  </div>
                )}

                {/* NEW: Submit Decision Button */}
                {decision && (
                  <Button 
                    onClick={handleDecisionSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${decision === 'accept' ? 'Acceptance' : 'Rejection'}`}
                  </Button>
                )}

                {/* NEW: Supporting Documents Upload */}
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
                  
                  {/* Display uploaded files */}
                  {supportingFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {supportingFiles.map((file, index) => (
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
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Enhanced Coding Panel with NEW ICD-10 Page & Code Table */}
          <div className="space-y-6">
            <EnhancedCodingPanel
              documentId={document.id}
              pageNumber={currentPage}
              className="h-fit"
            />
            
            {/* NEW: ICD-10 Page & Code Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ICD-10 Page & Code Table</CardTitle>
                  <Button variant="outline" size="sm" onClick={addIcdPageCode}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {icdPageCodes.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No ICD-10 page codes added yet. Click "Add Entry" to start.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground pb-2 border-b">
                      <div className="col-span-3">Page No.</div>
                      <div className="col-span-7">ICD-10 Code</div>
                      <div className="col-span-2">Action</div>
                    </div>
                    
                    {/* Table Rows */}
                    {icdPageCodes.map((entry) => (
                      <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={entry.pageNo}
                            onChange={(e) => updateIcdPageCode(entry.id, 'pageNo', parseInt(e.target.value) || 1)}
                            min="1"
                            max={document.page_count}
                          />
                        </div>
                        <div className="col-span-7">
                          <Input
                            value={entry.code}
                            onChange={(e) => updateIcdPageCode(entry.id, 'code', e.target.value)}
                            placeholder="Enter ICD-10 code"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIcdPageCode(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
};