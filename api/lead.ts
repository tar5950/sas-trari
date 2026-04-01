import type { VercelRequest, VercelResponse } from '@vercel/node'

const BREVO_KEY = process.env.BREVO_API_KEY || ''
const NOTIFY_EMAIL = 'najemtarik93@gmail.com'
const FROM_EMAIL = 'samirra@ecriture59.fr'
const FROM_NAME = 'SAS — Méthode 15 Clés'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const lead = req.body
  if (!lead?.email) return res.status(400).json({ error: 'Missing email' })

  const levelLabel = lead.level === 'A' ? '🎯 PRIORITAIRE' : lead.level === 'B' ? '💡 Intermédiaire' : '🌱 Exploratoire'
  const personaLabel = lead.persona === 'parent' ? '👨‍👩‍👧 Parent' : '👩‍🏫 Pro'

  const html = `
<div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff">
  <div style="background:#1a2744;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">
    <h1 style="color:#c9a84c;font-size:20px;margin:0">Nouveau lead SAS</h1>
    <p style="color:#fff;margin:6px 0 0;font-size:14px">${new Date().toLocaleString('fr-FR')}</p>
  </div>
  
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Prénom</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;font-weight:700;color:#1a2744">${lead.prenom || '—'}</td></tr>
    ${lead.enfant ? `<tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Enfant</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#1a2744">${lead.enfant}</td></tr>` : ''}
    <tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Email</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#1a2744"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Profil</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#1a2744">${personaLabel}</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Niveau</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;font-weight:700;color:#1a2744">${levelLabel}</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#6b7280;font-size:13px">Score</td>
        <td style="padding:10px;border-bottom:1px solid #e5e0d5;color:#1a2744">${lead.score}/100</td></tr>
    <tr><td style="padding:10px;color:#6b7280;font-size:13px">Pain principal</td>
        <td style="padding:10px;color:#1a2744">${lead.pain || '—'}</td></tr>
  </table>

  ${lead.level === 'A' ? `
  <div style="background:#fdf6e3;border:2px solid #c9a84c;border-radius:10px;padding:14px;margin-top:16px">
    <p style="margin:0;font-weight:700;color:#1a2744">⚡ Lead prioritaire — relancer dans les 24h</p>
    <p style="margin:6px 0 0;font-size:13px;color:#6b7280">Ce prospect correspond exactement au profil idéal.</p>
  </div>` : ''}

  <div style="margin-top:20px;text-align:center">
    <a href="https://sas.trari-pedagogie.com/admin" style="display:inline-block;background:#1a2744;color:#c9a84c;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Voir le tableau de bord SAS →
    </a>
  </div>
</div>
`

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: NOTIFY_EMAIL }],
        subject: `${levelLabel} — ${lead.prenom || 'Nouveau lead'} (${personaLabel}) — SAS`,
        htmlContent: html,
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return res.status(500).json({ error: 'Brevo failed', detail: err })
    }

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
