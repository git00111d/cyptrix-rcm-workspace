import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // Get request body
    let requestData
    try {
      requestData = await req.json()
    } catch {
      return new Response('Invalid JSON body', { status: 400, headers: corsHeaders })
    }
    
    const { filePath } = requestData
    
    if (!filePath) {
      console.error('No file path provided')
      return new Response(JSON.stringify({ error: 'File path required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(JSON.stringify({ error: 'Authorization required' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing PDF request for file: ${filePath}`)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`User verified: ${user.id}`)

    // Try to download the file directly
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return new Response(JSON.stringify({ error: 'File not found or access denied' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`File downloaded successfully, size: ${fileData.size} bytes`)

    // Verify it's a PDF
    const arrayBuffer = await fileData.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer.slice(0, 4))
    const pdfSignature = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
    
    if (pdfSignature !== '%PDF') {
      console.error('File is not a valid PDF')
      return new Response(JSON.stringify({ error: 'Invalid PDF file' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle range requests for PDF streaming
    const range = req.headers.get('range')
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : arrayBuffer.byteLength - 1
      const chunksize = (end - start) + 1
      const chunk = arrayBuffer.slice(start, end + 1)

      return new Response(chunk, {
        status: 206,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
          'Content-Length': chunksize.toString(),
          'Cache-Control': 'private, max-age=60'
        }
      })
    }

    // Return the full PDF data
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Length': arrayBuffer.byteLength.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=60', // Short cache for security
    }

    console.log('Returning PDF data successfully')

    return new Response(arrayBuffer, {
      status: 200,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})