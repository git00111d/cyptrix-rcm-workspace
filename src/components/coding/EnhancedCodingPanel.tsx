import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Code, 
  Save, 
  Send, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle 
} from 'lucide-react';
import { CodeAutocomplete } from './CodeAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PageCode {
  id?: string;
  document_id: string;
  page_number: number;
  icd_codes: string[];
  cpt_codes: string[];
  notes: string;
  created_by: string;
}

interface EnhancedCodingPanelProps {
  documentId: string;
  pageNumber: number;
  isReadOnly?: boolean;
  className?: string;
  onSave?: () => void;
  onSubmit?: () => void;
}

export const EnhancedCodingPanel: React.FC<EnhancedCodingPanelProps> = ({
  documentId,
  pageNumber,
  isReadOnly = false,
  className = '',
  onSave,
  onSubmit
}) => {
  const [pageCode, setPageCode] = useState<PageCode>({
    document_id: documentId,
    page_number: pageNumber,
    icd_codes: [],
    cpt_codes: [],
    notes: '',
    created_by: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetchPageCodes();
  }, [documentId, pageNumber]);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && !isReadOnly) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [pageCode, hasChanges]);

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
        .maybeSingle();

      if (data) {
        setPageCode(data);
      } else {
        setPageCode({
          document_id: documentId,
          page_number: pageNumber,
          icd_codes: [],
          cpt_codes: [],
          notes: '',
          created_by: user.id,
        });
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching page codes:', error);
      toast.error('Failed to load page codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges || isReadOnly) return;
    
    setAutoSaveStatus('saving');
    try {
      await saveCodes(true);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const saveCodes = async (isAutoSave = false) => {
    try {
      if (!isAutoSave) setIsSaving(true);
      
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

      if (error) throw error;

      setHasChanges(false);
      if (!isAutoSave) {
        toast.success(`Codes saved for page ${pageNumber}`);
        onSave?.();
      }
      
      await fetchPageCodes(); // Refresh data
    } catch (error) {
      console.error('Error saving page codes:', error);
      if (!isAutoSave) toast.error('Failed to save codes');
      throw error;
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  const handleSubmitForAudit = async () => {
    setIsSubmitting(true);
    try {
      // First save current codes
      await saveCodes(true);
      
      // Update document status to submitted
      const { error } = await supabase
        .from('documents')
        .update({ status: 'CODING_COMPLETE' })
        .eq('id', documentId);

      if (error) throw error;
      
      toast.success('Document submitted for audit');
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting for audit:', error);
      toast.error('Failed to submit for audit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIcdCode = (code: string) => {
    setPageCode(prev => ({
      ...prev,
      icd_codes: [...prev.icd_codes, code.toUpperCase()],
    }));
    setHasChanges(true);
  };

  const handleAddCptCode = (code: string) => {
    setPageCode(prev => ({
      ...prev,
      cpt_codes: [...prev.cpt_codes, code],
    }));
    setHasChanges(true);
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

  const hasValidCodes = pageCode.notes.trim().length > 0;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Medical Codes - Page {pageNumber}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            
            {autoSaveStatus === 'saving' && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
            
            {autoSaveStatus === 'saved' && (
              <Badge variant="outline" className="text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Auto-saved
              </Badge>
            )}
            
            {autoSaveStatus === 'error' && (
              <Badge variant="outline" className="text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Save failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Notes Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Coding Notes</h3>
          <Textarea
            placeholder="Enter coding notes for this page..."
            value={pageCode.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            readOnly={isReadOnly}
            className="resize-none"
          />
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => saveCodes(false)}
              disabled={isSaving || !hasChanges}
              variant="outline"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button
              onClick={handleSubmitForAudit}
              disabled={isSubmitting || !hasValidCodes}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit for Audit'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};