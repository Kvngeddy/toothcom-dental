// Supabase Edge Function shared module: email-service.ts
// Sends transactional emails via Gmail SMTP using an App Password.
// Place at: supabase/functions/_shared/email-service.ts
// Import from any function with: import { sendInviteEmail } from '../_shared/email-service.ts'
//
// Required secrets (set with `supabase secrets set KEY=value`):
//   GMAIL_USER           the Gmail address you're sending from
//   GMAIL_APP_PASSWORD   a 16-char App Password (NOT your normal Gmail password —
//                         requires 2-Step Verification on the account, generated at
//                         myaccount.google.com -> Security -> App Passwords)
//   CLINIC_NAME           optional, defaults to "Toothcom Dental Clinics"

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const CLINIC_NAME = Deno.env.get('CLINIC_NAME') ?? 'Toothcom Dental Clinics'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  front_desk: 'Front Desk',
}

function assertConfigured() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      'Email service is not configured: GMAIL_USER and/or GMAIL_APP_PASSWORD secrets are missing.'
    )
  }
}

function buildInviteHtml(fullName: string, roleLabel: string, inviteLink: string) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #c2410c; margin-bottom: 4px;">${CLINIC_NAME}</h2>
      <p>Hi ${fullName},</p>
      <p>You've been invited to join the <strong>${CLINIC_NAME}</strong> staff portal as a <strong>${roleLabel}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteLink}"
           style="display:inline-block;background:#ea580c;color:#ffffff;padding:10px 22px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Accept invite &amp; set your password
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteLink}" style="color:#ea580c;">${inviteLink}</a>
      </p>
      <p style="font-size:13px;color:#6b7280;">
        This link will expire after a period of time. If you weren't expecting this invite,
        you can safely ignore this email.
      </p>
    </div>
  `.trim()
}

export interface SendInviteEmailParams {
  to: string
  fullName: string
  role: string
  inviteLink: string
}

export async function sendInviteEmail({ to, fullName, role, inviteLink }: SendInviteEmailParams) {
  assertConfigured()

  const roleLabel = ROLE_LABELS[role] ?? role
  const smtp = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: GMAIL_USER,
        password: GMAIL_APP_PASSWORD,
      },
    },
  })

  try {
    await smtp.send({
      from: `${CLINIC_NAME} <${GMAIL_USER}>`,
      to,
      subject: `You're invited to join ${CLINIC_NAME}`,
      html: buildInviteHtml(fullName, roleLabel, inviteLink),
    })
  } finally {
    // Always close the connection, even if send() throws.
    await smtp.close()
  }
}