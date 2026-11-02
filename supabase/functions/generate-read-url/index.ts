// Supabase Edge Function: generate-read-url
// Returns a short-lived signed URL for viewing a page stored in GCS.
// The bucket stays fully private — nothing is ever made public.

import { generateSignedUrl } from '../_shared/gcs.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { objectPath } = await req.json()

    if (!objectPath) {
      return new Response(JSON.stringify({ error: 'Missing objectPath' }), { status: 400 })
    }

    const bucket = Deno.env.get('GCS_BUCKET_NAME')
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'GCS_BUCKET_NAME not configured' }), {
        status: 500,
      })
    }

    const readUrl = await generateSignedUrl({
      bucket,
      objectPath,
      method: 'GET',
      expiresInSeconds: 300,
    })

    return new Response(JSON.stringify({ readUrl }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})
