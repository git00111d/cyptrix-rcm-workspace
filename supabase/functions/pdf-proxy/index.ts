import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const filePath = url.searchParams.get('file')
    
    if (!filePath) {
      return new Response('File path required', { status: 400, headers: corsHeaders })
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Authorization required', { status: 401, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user permissions (you can add role-based checks here)
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders })
    }

    // Create signed URL for the file
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600)

    if (signedError || !signedData) {
      console.error('Error creating signed URL:', signedError)
      return new Response('File not found', { status: 404, headers: corsHeaders })
    }

    // Fetch the file from storage
    const storageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1${signedData.signedUrl}`
    
    const rangeHeader = req.headers.get('range')
    const fetchHeaders: Record<string, string> = {
      'Accept': 'application/pdf',
    }
    
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader
    }

    const response = await fetch(storageUrl, {
      headers: fetchHeaders
    })

    if (!response.ok) {
      return new Response('Failed to fetch file', { status: response.status, headers: corsHeaders })
    }

    // Forward the response with proper headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Length': response.headers.get('Content-Length') || '',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    }

    // Handle range requests for PDF streaming
    if (response.status === 206) {
      responseHeaders['Content-Range'] = response.headers.get('Content-Range') || ''
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})