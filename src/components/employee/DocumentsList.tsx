import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Code, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { isSupabaseConfigured } from '@/lib/supabase'

interface Document {
  id: string
  provider_id: string
  filename: string
  file_path: string
  page_count: number
  file_size: number
  uploaded_at: string
  status: string
  provider_name?: string
}

export const DocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!supabaseConfigured) {
      // Load mock data if Supabase is not configured
      const mockDocuments: Document[] = [
        {
          id: '1',
          provider_id: 'provider1',
          filename: 'Patient_Record_001.pdf',
          file_path: 'mock/path',
          page_count: 15,
          file_size: 2500000,
          uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'UPLOADED',
          provider_name: 'Dr. Smith Medical Practice'
        },
        {
          id: '2',
          provider_id: 'provider2',
          filename: 'Surgery_Report_002.pdf',
          file_path: 'mock/path',
          page_count: 8,
          file_size: 1200000,
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ASSIGNED',
          provider_name: 'General Hospital'
        }
      ]
      setDocuments(mockDocuments)
      setIsLoading(false)
      return
    }

    fetchDocuments()
  }, [supabaseConfigured])

  const fetchDocuments = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client')
      
      // Fetch documents with provider profile information
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_provider_id_fkey (
            name
          )
        `)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        })
        return
      }

      const documentsWithProviderName = data?.map(doc => ({
        ...doc,
        provider_name: doc.profiles?.name || 'Unknown Provider'
      })) || []

      setDocuments(documentsWithProviderName)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: "Error",
        description: "Failed to connect to database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartCoding = (documentId: string) => {
    if (!supabaseConfigured) {
      toast({
        title: "Configuration Required",
        description: "Complete Supabase integration to access the coding workspace",
        variant: "destructive",
      })
      return
    }
    navigate(`/coding?docId=${documentId}`)
  }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Documents for Coding
        </h1>
        <p className="text-muted-foreground">
          View and code medical documents uploaded by providers.
        </p>
      </div>

      {!supabaseConfigured && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Demo Mode</p>
                <p className="text-sm text-muted-foreground">
                  Showing mock data. Complete Supabase integration to connect to real documents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>
            Click "Start Coding" to open a document in the coding workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents available for coding</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium">{doc.filename}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Provider: {doc.provider_name}</span>
                        <span>{doc.page_count} pages</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace(/_/g, ' ')}
                    </Badge>
                    <Button 
                      onClick={() => handleStartCoding(doc.id)}
                      className="flex items-center gap-2"
                    >
                      <Code className="h-4 w-4" />
                      Start Coding
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}