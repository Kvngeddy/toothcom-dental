// Minimal Google Cloud Storage V4 signed URL generator for Deno (Supabase Edge Functions).
// Avoids pulling in the full @google-cloud/storage Node SDK, which doesn't run well on Deno.
//
// Requires the secret GCS_SERVICE_ACCOUNT_KEY to contain the full JSON key file contents
// for a service account with `roles/storage.objectAdmin` on the target bucket.

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

function getServiceAccount(): ServiceAccountKey {
  const raw = Deno.env.get('GCS_SERVICE_ACCOUNT_KEY')
  if (!raw) throw new Error('GCS_SERVICE_ACCOUNT_KEY secret is not set')
  return JSON.parse(raw)
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return toHex(digest)
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function signString(privateKeyPem: string, stringToSign: string): Promise<string> {
  const key = await importPrivateKey(privateKeyPem)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(stringToSign)
  )
  return toHex(signature)
}

function formatDate(date: Date) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { dateStamp: iso.slice(0, 8), amzDate: iso.slice(0, 15) + 'Z' }
}

/**
 * Generates a V4 signed URL for a GCS object.
 * method: 'GET' for reads, 'PUT' for uploads.
 */
export async function generateSignedUrl(params: {
  bucket: string
  objectPath: string
  method: 'GET' | 'PUT'
  expiresInSeconds?: number
  contentType?: string
}): Promise<string> {
  const { bucket, objectPath, method, expiresInSeconds = 600, contentType } = params
  const sa = getServiceAccount()
  const now = new Date()
  const { dateStamp, amzDate } = formatDate(now)

  const host = 'storage.googleapis.com'
  const canonicalUri = `/${bucket}/${encodeURIComponent(objectPath).replace(/%2F/g, '/')}`

  const credentialScope = `${dateStamp}/auto/storage/goog4_request`
  const credential = `${sa.client_email}/${credentialScope}`

  const headers: Record<string, string> = { host }
  if (method === 'PUT' && contentType) headers['content-type'] = contentType

  const signedHeaderKeys = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('')
  const signedHeaders = signedHeaderKeys.join(';')

  const queryParams: Record<string, string> = {
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': amzDate,
    'X-Goog-Expires': String(expiresInSeconds),
    'X-Goog-SignedHeaders': signedHeaders,
  }
  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join('&')

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'GOOG4-RSA-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  const signature = await signString(sa.private_key, stringToSign)

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Goog-Signature=${signature}`
}
