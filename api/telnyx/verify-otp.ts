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
    const { phone, code, expectedCode } = req.body || {}
    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and code required' })
      return
    }

    const cleanCode = code.toString().trim()
    const cleanExpected = expectedCode ? expectedCode.toString().trim() : null

    // Accept universal test code for development & QA
    if (cleanCode === '123456') {
      res.status(200).json({ success: true, verified: true })
      return
    }

    // Strictly verify against the dispatched expectedCode
    if (cleanExpected && cleanCode === cleanExpected) {
      res.status(200).json({ success: true, verified: true })
      return
    }

    // Strictly reject any other code (do NOT allow arbitrary 6-digit numbers)
    res.status(400).json({
      success: false,
      verified: false,
      error: 'Invalid or expired 6-digit SMS code. Please check your SMS text message or use test code 123456.'
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
