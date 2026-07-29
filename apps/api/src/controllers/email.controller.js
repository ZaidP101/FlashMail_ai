import { generateReply } from '../services/huggingface.service.js'

export async function generate(req, res, next) {
  try {
    const { emailContent, tone, rawReply } = req.validatedBody
    const reply = await generateReply(emailContent, tone, rawReply)
    res.json({ reply })
  } catch (err) {
    next(err)
  }
}
