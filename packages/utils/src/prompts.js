export function buildEmailPrompt(emailContent, tone, rawReply) {
  let prompt = `Generate a professional email reply for the following email:\n\n${emailContent}\n\n`

  if (tone) {
    prompt += `Use a ${tone.toLowerCase()} tone.\n\n`
  }

  if (rawReply) {
    prompt += `Here are some key points to include: ${rawReply}\n\n`
  }

  prompt += 'Generated Reply:'
  return prompt
}
