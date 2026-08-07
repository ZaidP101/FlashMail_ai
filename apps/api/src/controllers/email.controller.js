import { generateReply, generateWithFormat, generateCompose } from '../services/ai.service.js'

function extractToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}

export async function generate(req, res, next) {
  try {
    const { emailContent, tone, rawReply, formatId, customInputs, senderName, mode } = req.validatedBody

    if (formatId) {
      const accessToken = extractToken(req)
      if (!accessToken) return res.status(401).json({ error: 'Missing or invalid token' })
      const reply = await generateWithFormat(
        { formatId, customInputs, tone, emailContent, rawReply, senderName },
        accessToken,
      )
      return res.json({ reply })
    }

    if (mode === 'compose') {
      const result = await generateCompose(rawReply || emailContent, tone, senderName)
      return res.json(result)
    }

    const reply = await generateReply(emailContent, tone, rawReply, senderName)
    res.json({ reply })
  } catch (err) {
    if (err.message === 'Format not found') {
      return res.status(404).json({ error: err.message })
    }
    next(err)
  }
}
