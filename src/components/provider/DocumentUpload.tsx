import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, Clock, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export const DocumentUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const { user } = useAuth()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    if (!user) return
    
    setUploading(true)
    
    for (const file of files) {
      try {
        // Validate file type
        if (file.type !== 'application/pdf') {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a PDF file`,
            variant: "destructive",
          })
          continue
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        // Get PDF page count (simplified - you'd use a PDF library in production)
        const pageCount = Math.floor(Math.random() * 50) + 1 // Mock page count

        // Save document metadata to database
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            provider_id: user.userId,
            filename: file.name,
            file_path: filePath,
            page_count: pageCount,
            file_size: file.size,
            status: 'UPLOADED'
          })

        if (dbError) {
          throw dbError
        }

        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded successfully`,
        })

        // Refresh uploaded files list
        fetchUploadedFiles()

      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }
    
    setUploading(false)
  }

  const fetchUploadedFiles = async () => {
    if (!user) return

    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('provider_id', user.userId)
      .order('uploaded_at', { ascending: false })

    if (data) {
      setUploadedFiles(data)
    }
  }

  React.useEffect(() => {
    fetchUploadedFiles()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED': return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800'
      case 'CODING_IN_PROGRESS': return 'bg-orange-100 text-orange-800'
      case 'CODING_COMPLETE': return 'bg-green-100 text-green-800'
      case 'UNDER_AUDIT': return 'bg-purple-100 text-purple-800'
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Document Upload
        </h1>
        <p className="text-muted-foreground">
          Upload medical documents for coding and processing.
        </p>
      </div>

      {/* Security Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-primary">Secure Upload</p>
              <p className="text-sm text-muted-foreground">
                All documents are encrypted during transmission and storage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop PDF files or click to select
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Uploading and encrypting documents...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium">Drop PDF files here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                  Select Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Documents</CardTitle>
          <CardDescription>
            Track the status of your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.page_count} pages • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(file.status)}>
                    {file.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}