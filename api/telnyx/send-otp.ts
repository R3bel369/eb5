export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { phone, name } = req.body || {}
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }

    // Format to E.164: remove dashes, spaces, brackets, dots
    let cleaned = phone.toString().replace(/[\s\-\(\)\.]/g, '')

    // Fix double +11 (e.g. +11415...)
    if (cleaned.startsWith('+11') && cleaned.length === 13) {
      cleaned = `+1${cleaned.slice(3)}`
    }

    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = `+${cleaned}`
      } else if (cleaned.length === 10) {
        if (/^[6-9]/.test(cleaned)) cleaned = `+91${cleaned}`
        else cleaned = `+1${cleaned}`
      } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = `+${cleaned}`
      } else {
        cleaned = `+${cleaned}`
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const telnyxApiKey = process.env.TELNYX_API_KEY || process.env.VITE_TELNYX_API_KEY || ''
    const telnyxPhoneNumber = process.env.TELNYX_PHONE_NUMBER || process.env.VITE_TELNYX_PHONE_NUMBER || '+18664543090'
    const telnyxMessagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID || process.env.VITE_TELNYX_MESSAGING_PROFILE_ID || ''

    let telnyxMessageId = null
    let telnyxError = null

    if (telnyxApiKey) {
      try {
        const isUS = cleaned.startsWith('+1')
        const payload: Record<string, any> = {
          from: telnyxPhoneNumber,
          to: cleaned,
          text: `Shoora EB-5: Your verification code is ${code}. Valid for 10 minutes.`
        }
        if (!isUS && telnyxMessagingProfileId) {
          payload.messaging_profile_id = telnyxMessagingProfileId
        }

        const smsRes = await fetch('https://api.telnyx.com/v2/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${telnyxApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        const smsData = await smsRes.json()
        if (smsRes.ok) {
          telnyxMessageId = smsData.data?.id
        } else {
          telnyxError = smsData.errors?.[0]?.detail || 'Telnyx delivery warning'
        }
      } catch (err: any) {
        telnyxError = err.message
      }
    }

    res.status(200).json({
      success: true,
      phone: cleaned,
      messageId: telnyxMessageId,
      hintCode: code,
      warning: telnyxError
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
