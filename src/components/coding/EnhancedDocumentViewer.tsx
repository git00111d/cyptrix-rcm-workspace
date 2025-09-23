import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Maximize2,
  RotateCw
} from 'lucide-react';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  filename: string;
  file_path: string;
  page_count: number;
  status: string;
  provider_id: string;
}

interface EnhancedDocumentViewerProps {
  document: Document;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const EnhancedDocumentViewer: React.FC<EnhancedDocumentViewerProps> = ({
  document,
  currentPage,
  onPageChange,
  className = ''
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchPdfUrl();
  }, [document.id]);

  const fetchPdfUrl = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error getting signed URL:', error);
        toast.error('Failed to load document');
        return;
      }

      setPdfUrl(data.signedUrl);
    } catch (error) {
      console.error('Error fetching PDF:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => [Math.min(prev[0] + 25, 300)]);
  };

  const handleZoomOut = () => {
    setZoom(prev => [Math.max(prev[0] - 25, 50)]);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < document.page_count) {
      onPageChange(currentPage + 1);
    }
  };

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download document');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Viewer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{document.filename}</Badge>
            <Badge variant="secondary">
              {document.status.replace('_', ' ').toLowerCase()}
            </Badge>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 py-1 text-sm bg-muted rounded">
              Page {currentPage} of {document.page_count}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= document.page_count}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[120px]">
              <Slider
                value={zoom}
                onValueChange={handleZoomChange}
                min={50}
                max={300}
                step={25}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {zoom[0]}%
              </span>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div 
          className="bg-muted/30 rounded-lg overflow-hidden"
          style={{ 
            height: isFullscreen ? 'calc(100vh - 200px)' : '500px',
            transform: `rotate(${rotation}deg)`
          }}
        >
          {pdfUrl && (
            <PDFViewer
              fileUrl={pdfUrl}
              currentPage={currentPage}
              onPageChange={onPageChange}
              className="h-full"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};