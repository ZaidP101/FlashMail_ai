export function buildEmailPrompt(emailContent, tone, rawReply) {
  let prompt = 'Generate a professional email reply using the provided context and raw reply.'

  if (tone) {
    prompt += ` Use a ${tone} tone.`
  }

  prompt += `\n\nOriginal Email:\n${emailContent}`

  prompt += `\n\nRaw Reply:\n${rawReply || ''}`

  prompt += '\n\nInstructions:\n'
  prompt += '- Use the Raw Reply to generate a polished and professional response.\n'
  prompt += '- Do not include any explanations or commentary, only the improved reply.\n'

  return prompt
}
