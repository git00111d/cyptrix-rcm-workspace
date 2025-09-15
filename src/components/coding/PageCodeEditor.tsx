import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateICD10Code, validateCPTCode, debounce } from '@/utils/codeValidation';

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
  const [icdValidation, setIcdValidation] = useState({ isValid: true, message: '' });
  const [cptValidation, setCptValidation] = useState({ isValid: true, message: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  useEffect(() => {
    fetchPageCodes();
  }, [documentId, pageNumber]);

  // Auto-save functionality with debounce
  const debouncedAutoSave = useCallback(
    debounce(async () => {
      if (hasChanges && !isReadOnly) {
        await handleSave(true); // Silent save
      }
    }, 3000), // Auto-save after 3 seconds of inactivity
    [hasChanges, isReadOnly]
  );

  useEffect(() => {
    if (hasChanges) {
      debouncedAutoSave();
    }
  }, [pageCode, hasChanges, debouncedAutoSave]);

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
    const validation = validateICD10Code(newIcdCode);
    if (!validation.isValid) {
      setIcdValidation({ 
        isValid: validation.isValid, 
        message: validation.message || 'Invalid code format' 
      });
      return;
    }
    
    if (newIcdCode.trim() && !pageCode.icd_codes.includes(newIcdCode.trim().toUpperCase())) {
      setPageCode(prev => ({
        ...prev,
        icd_codes: [...prev.icd_codes, newIcdCode.trim().toUpperCase()],
      }));
      setNewIcdCode('');
      setIcdValidation({ isValid: true, message: '' });
      setHasChanges(true);
    }
  };

  const handleAddCptCode = () => {
    const validation = validateCPTCode(newCptCode);
    if (!validation.isValid) {
      setCptValidation({ 
        isValid: validation.isValid, 
        message: validation.message || 'Invalid code format' 
      });
      return;
    }
    
    if (newCptCode.trim() && !pageCode.cpt_codes.includes(newCptCode.trim())) {
      setPageCode(prev => ({
        ...prev,
        cpt_codes: [...prev.cpt_codes, newCptCode.trim()],
      }));
      setNewCptCode('');
      setCptValidation({ isValid: true, message: '' });
      setHasChanges(true);
    }
  };

  const handleRemoveIcdCode = (codeToRemove: string) => {
    setPageCode(prev => ({
      ...prev,
      icd_codes: prev.icd_codes.filter(code => code !== codeToRemove),
    }));
    setHasChanges(true);
  };

  const handleRemoveCptCode = (codeToRemove: string) => {
    setPageCode(prev => ({
      ...prev,
      cpt_codes: prev.cpt_codes.filter(code => code !== codeToRemove),
    }));
    setHasChanges(true);
  };

  const handleNotesChange = (notes: string) => {
    setPageCode(prev => ({ ...prev, notes }));
    setHasChanges(true);
  };

  // Real-time validation for ICD codes
  const handleIcdCodeChange = (value: string) => {
    setNewIcdCode(value);
    if (value.trim()) {
      const validation = validateICD10Code(value);
      setIcdValidation({ 
        isValid: validation.isValid, 
        message: validation.message || '' 
      });
    } else {
      setIcdValidation({ isValid: true, message: '' });
    }
  };

  // Real-time validation for CPT codes
  const handleCptCodeChange = (value: string) => {
    setNewCptCode(value);
    if (value.trim()) {
      const validation = validateCPTCode(value);
      setCptValidation({ 
        isValid: validation.isValid, 
        message: validation.message || '' 
      });
    } else {
      setCptValidation({ isValid: true, message: '' });
    }
  };

  const handleSave = async (silent = false) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!silent) toast.error('You must be logged in to save codes');
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
        if (!silent) toast.error('Failed to save codes');
      } else {
        setHasChanges(false);
        setLastAutoSave(new Date());
        if (!silent) {
          toast.success(`Codes saved for page ${pageNumber}`);
        }
        await fetchPageCodes(); // Refresh to get the updated data
      }
    } catch (error) {
      console.error('Error saving page codes:', error);
      if (!silent) toast.error('Failed to save codes');
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
          <div className="flex items-center gap-2">
            <span>Page {pageNumber} Coding</span>
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            {lastAutoSave && (
              <span className="text-xs text-muted-foreground">
                Auto-saved: {lastAutoSave.toLocaleTimeString()}
              </span>
            )}
          </div>
          {!isReadOnly && (
            <Button
              onClick={() => handleSave(false)}
              disabled={isSaving || !hasChanges}
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
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter ICD-10 code (e.g., A00.0)"
                      value={newIcdCode}
                      onChange={(e) => handleIcdCodeChange(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddIcdCode()}
                      className={!icdValidation.isValid ? 'border-destructive' : ''}
                    />
                    {!icdValidation.isValid && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {icdValidation.message}
                      </p>
                    )}
                    {icdValidation.isValid && newIcdCode.trim() && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Valid ICD-10 format
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleAddIcdCode}
                    size="sm"
                    variant="outline"
                    disabled={!icdValidation.isValid || !newIcdCode.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter CPT code (e.g., 99213)"
                      value={newCptCode}
                      onChange={(e) => handleCptCodeChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCptCode()}
                      className={!cptValidation.isValid ? 'border-destructive' : ''}
                    />
                    {!cptValidation.isValid && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {cptValidation.message}
                      </p>
                    )}
                    {cptValidation.isValid && newCptCode.trim() && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Valid CPT format
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleAddCptCode}
                    size="sm"
                    variant="outline"
                    disabled={!cptValidation.isValid || !newCptCode.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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