import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Shield, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const UploadDocuments: React.FC = () => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    // Simulate upload process
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Simulate encryption and upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Document Uploaded Successfully",
        description: `${file.name} has been encrypted and stored securely.`,
      });
    }
    
    setUploading(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Upload Medical Documents
        </h1>
        <p className="text-muted-foreground">
          Securely upload patient charts, procedure notes, and medical records for coding.
        </p>
      </div>

      {/* Security Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Encryption & Security
          </CardTitle>
          <CardDescription>
            All documents are encrypted client-side with AES-GCM before upload and stored with IPFS CID references for maximum security.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop your medical documents or click to browse. Supported formats: PDF, DOCX, JPG, PNG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {uploading ? 'Uploading and Encrypting...' : 'Drop files here or click to browse'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum file size: 50MB per file
                </p>
              </div>
              
              {!uploading && (
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Files
                </Button>
              )}
              
              {uploading && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-primary">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Your recently uploaded documents and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'patient_chart_001.pdf',
                size: '2.4 MB',
                status: 'PROCESSING',
                uploadedAt: '2 minutes ago'
              },
              {
                name: 'procedure_note_002.pdf',
                size: '1.8 MB',
                status: 'UPLOADED',
                uploadedAt: '5 minutes ago'
              },
              {
                name: 'lab_results_003.pdf',
                size: '892 KB',
                status: 'ASSIGNED',
                uploadedAt: '1 hour ago'
              }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{doc.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {doc.size} • Uploaded {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={
                      doc.status === 'PROCESSING' ? 'bg-warning/10 text-warning border-warning/20' :
                      doc.status === 'UPLOADED' ? 'bg-success/10 text-success border-success/20' :
                      'bg-primary/10 text-primary border-primary/20'
                    }
                  >
                    {doc.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Supported File Types:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• PDF documents (.pdf)</li>
                <li>• Word documents (.docx)</li>
                <li>• Images (.jpg, .jpeg, .png)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Security Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Client-side AES-GCM encryption</li>
                <li>• IPFS decentralized storage</li>
                <li>• HIPAA compliant processing</li>
                <li>• Audit trail logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};