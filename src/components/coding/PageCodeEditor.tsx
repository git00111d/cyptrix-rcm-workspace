import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PageCode {
  id?: string;
  document_id: string;
  page_number: number;
  icd_codes: string[];
  cpt_codes: string[];
  notes: string;
  created_by: string;
}

interface PageCodeEditorProps {
  documentId: string;
  pageNumber: number;
  isReadOnly?: boolean;
  className?: string;
}

export const PageCodeEditor: React.FC<PageCodeEditorProps> = ({
  documentId,
  pageNumber,
  isReadOnly = false,
  className = '',
}) => {
  const [pageCode, setPageCode] = useState<PageCode>({
    document_id: documentId,
    page_number: pageNumber,
    icd_codes: [],
    cpt_codes: [],
    notes: '',
    created_by: '',
  });
  
  const [newIcdCode, setNewIcdCode] = useState('');
  const [newCptCode, setNewCptCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPageCodes();
  }, [documentId, pageNumber]);

  const fetchPageCodes = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('page_codes')
        .select('*')
        .eq('document_id', documentId)
        .eq('page_number', pageNumber)
        .eq('created_by', user.id)
        .single();

      if (data) {
        setPageCode(data);
      } else if (!error || error.code === 'PGRST116') {
        // No existing codes found, initialize empty
        setPageCode({
          document_id: documentId,
          page_number: pageNumber,
          icd_codes: [],
          cpt_codes: [],
          notes: '',
          created_by: user.id,
        });
      }
    } catch (error) {
      console.error('Error fetching page codes:', error);
      toast.error('Failed to load page codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIcdCode = () => {
    if (newIcdCode.trim() && !pageCode.icd_codes.includes(newIcdCode.trim())) {
      setPageCode(prev => ({
        ...prev,
        icd_codes: [...prev.icd_codes, newIcdCode.trim()],
      }));
      setNewIcdCode('');
    }
  };

  const handleAddCptCode = () => {
    if (newCptCode.trim() && !pageCode.cpt_codes.includes(newCptCode.trim())) {
      setPageCode(prev => ({
        ...prev,
        cpt_codes: [...prev.cpt_codes, newCptCode.trim()],
      }));
      setNewCptCode('');
    }
  };

  const handleRemoveIcdCode = (codeToRemove: string) => {
    setPageCode(prev => ({
      ...prev,
      icd_codes: prev.icd_codes.filter(code => code !== codeToRemove),
    }));
  };

  const handleRemoveCptCode = (codeToRemove: string) => {
    setPageCode(prev => ({
      ...prev,
      cpt_codes: prev.cpt_codes.filter(code => code !== codeToRemove),
    }));
  };

  const handleNotesChange = (notes: string) => {
    setPageCode(prev => ({ ...prev, notes }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save codes');
        return;
      }

      const codeData = {
        document_id: documentId,
        page_number: pageNumber,
        icd_codes: pageCode.icd_codes,
        cpt_codes: pageCode.cpt_codes,
        notes: pageCode.notes,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('page_codes')
        .upsert(codeData, {
          onConflict: 'document_id,page_number,created_by',
        });

      if (error) {
        console.error('Error saving page codes:', error);
        toast.error('Failed to save codes');
      } else {
        toast.success(`Codes saved for page ${pageNumber}`);
        await fetchPageCodes(); // Refresh to get the updated data
      }
    } catch (error) {
      console.error('Error saving page codes:', error);
      toast.error('Failed to save codes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Page {pageNumber} Coding</span>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* ICD-10 Codes */}
        <div>
          <label className="text-sm font-medium mb-2 block">ICD-10 Codes</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
              {pageCode.icd_codes.map((code) => (
                <Badge key={code} variant="secondary" className="flex items-center gap-1">
                  {code}
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveIcdCode(code)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ICD-10 code"
                  value={newIcdCode}
                  onChange={(e) => setNewIcdCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIcdCode()}
                />
                <Button
                  onClick={handleAddIcdCode}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* CPT Codes */}
        <div>
          <label className="text-sm font-medium mb-2 block">CPT Codes</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
              {pageCode.cpt_codes.map((code) => (
                <Badge key={code} variant="outline" className="flex items-center gap-1">
                  {code}
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveCptCode(code)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter CPT code"
                  value={newCptCode}
                  onChange={(e) => setNewCptCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCptCode()}
                />
                <Button
                  onClick={handleAddCptCode}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Notes</label>
          <Textarea
            placeholder="Enter notes for this page..."
            value={pageCode.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            readOnly={isReadOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
};