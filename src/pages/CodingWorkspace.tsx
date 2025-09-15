import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Code, FileText, Save, Plus, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  page_count: number;
  status: string;
}

interface DocumentCode {
  id?: string;
  document_id: string;
  page_number: number;
  icd10_codes: string[];
  cpt_codes: string[];
  notes: string;
}

export const CodingWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [codes, setCodes] = useState<DocumentCode>({
    document_id: '',
    page_number: 1,
    icd10_codes: [],
    cpt_codes: [],
    notes: ''
  });
  const [newIcd10, setNewIcd10] = useState('');
  const [newCpt, setNewCpt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const docId = searchParams.get('docId');
  const supabaseConfigured = isSupabaseConfigured();
  useEffect(() => {
    if (docId && supabaseConfigured) {
      fetchDocument();
      fetchExistingCodes();
    } else {
      setIsLoading(false);
    }
  }, [docId, supabaseConfigured]);

  const fetchDocument = async () => {
    if (!docId) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        });
        return;
      }

      setDocument(data);
      setCodes(prev => ({ ...prev, document_id: data.id }));
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: "Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingCodes = async () => {
    if (!docId || !user) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('document_codes')
        .select('*')
        .eq('document_id', docId)
        .eq('employee_id', user.userId)
        .eq('page_number', currentPage)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching codes:', error);
        return;
      }

      if (data) {
        setCodes({
          id: data.id,
          document_id: data.document_id,
          page_number: data.page_number,
          icd10_codes: data.icd10_codes || [],
          cpt_codes: data.cpt_codes || [],
          notes: data.notes || ''
        });
      } else {
        setCodes(prev => ({
          ...prev,
          id: undefined,
          page_number: currentPage,
          icd10_codes: [],
          cpt_codes: [],
          notes: ''
        }));
      }
    } catch (error) {
      console.error('Error fetching existing codes:', error);
    }
  };

  const addIcd10Code = () => {
    if (newIcd10.trim()) {
      setCodes(prev => ({
        ...prev,
        icd10_codes: [...prev.icd10_codes, newIcd10.trim()]
      }));
      setNewIcd10('');
    }
  };

  const addCptCode = () => {
    if (newCpt.trim()) {
      setCodes(prev => ({
        ...prev,
        cpt_codes: [...prev.cpt_codes, newCpt.trim()]
      }));
      setNewCpt('');
    }
  };

  const removeCode = (type: 'icd10' | 'cpt', index: number) => {
    setCodes(prev => ({
      ...prev,
      [type === 'icd10' ? 'icd10_codes' : 'cpt_codes']: 
        prev[type === 'icd10' ? 'icd10_codes' : 'cpt_codes'].filter((_, i) => i !== index)
    }));
  };

  const saveCodes = async () => {
    if (!user || !docId) return;

    setIsSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const codeData = {
        document_id: docId,
        employee_id: user.userId,
        page_number: currentPage,
        icd10_codes: codes.icd10_codes,
        cpt_codes: codes.cpt_codes,
        notes: codes.notes
      };

      if (codes.id) {
        // Update existing codes
        const { error } = await supabase
          .from('document_codes')
          .update(codeData)
          .eq('id', codes.id);

        if (error) throw error;
      } else {
        // Insert new codes
        const { data, error } = await supabase
          .from('document_codes')
          .insert(codeData)
          .select()
          .single();

        if (error) throw error;
        setCodes(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Codes Saved",
        description: `Codes for page ${currentPage} have been saved successfully`,
      });
    } catch (error) {
      console.error('Error saving codes:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    setCodes(prev => ({ ...prev, page_number: newPage }));
    fetchExistingCodes();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!docId || !document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No document selected for coding</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Coding Workspace
        </h1>
        <p className="text-muted-foreground">
          Document: {document.filename} - Page {currentPage} of {document.page_count}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Viewer Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Viewer
            </CardTitle>
            <CardDescription>
              PDF viewer will be integrated here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 h-96 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">PDF Viewer Placeholder</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => changePage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage} / {document.page_count}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage >= document.page_count}
                    onClick={() => changePage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coding Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Medical Codes
            </CardTitle>
            <CardDescription>
              Add ICD-10 and CPT codes for page {currentPage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ICD-10 Codes */}
            <div className="space-y-3">
              <Label>ICD-10 Codes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ICD-10 code"
                  value={newIcd10}
                  onChange={(e) => setNewIcd10(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIcd10Code()}
                />
                <Button onClick={addIcd10Code} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {codes.icd10_codes.map((code, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {code}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeCode('icd10', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* CPT Codes */}
            <div className="space-y-3">
              <Label>CPT Codes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter CPT code"
                  value={newCpt}
                  onChange={(e) => setNewCpt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCptCode()}
                />
                <Button onClick={addCptCode} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {codes.cpt_codes.map((code, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {code}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeCode('cpt', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add coding notes for this page..."
                value={codes.notes}
                onChange={(e) => setCodes(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={saveCodes} 
              disabled={isSaving || !user}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Codes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};