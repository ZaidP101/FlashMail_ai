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

export function buildFormatPrompt({ mode, content, customInputs, tone, emailContent, rawReply }) {
  let prompt = 'You are an expert email writer. Generate the final email content based on the saved format, the custom inputs, and the requested tone.'

  prompt += `\n\nFormat mode: ${mode === 'email' ? 'write a new email' : 'write a reply to the original email'}`

  prompt += '\n\nSaved format instructions:\n'
  prompt += content

  prompt += '\n\nCustom inputs (use these details to fill in the email):\n'
  prompt += customInputs || '(none provided)'

  if (tone) {
    prompt += `\n\nTone: ${tone}`
  }

  if (mode === 'reply' && emailContent) {
    prompt += `\n\nOriginal Email:\n${emailContent}`
  }

  if (rawReply) {
    prompt += `\n\nRaw Reply:\n${rawReply}`
  }

  prompt += '\n\nInstructions:\n'
  prompt += '- Follow the saved format instructions exactly.\n'
  prompt += '- Incorporate the custom inputs into the email.\n'
  prompt += `- Produce only the ${mode === 'email' ? 'email' : 'reply'} text.\n`
  prompt += '- Do not include any explanations or commentary.\n'

  return prompt
}
