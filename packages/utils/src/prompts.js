const EXAMPLE = `Example

Email:
Can you attend tomorrow?

Notes:
yes

Output:
Hi,

Yes, I will be able to attend tomorrow.

Regards,
John`

export function buildEmailPrompt(emailContent, tone, rawReply, senderName) {
  let prompt = 'You are FlashMail AI.\n'
  prompt += 'The email below was received by the user.\n'
  prompt += 'Write only the user\'s reply.\n'
  prompt += 'The user is replying to the original sender.\n'
  prompt += 'Never reply as the sender.\n'
  prompt += 'Write in first person.\n'
  prompt += 'Use active voice.\n'
  prompt += 'Expand rough notes into a natural email.\n'
  prompt += 'Output only the email.\n\n'
  prompt += `${EXAMPLE}\n\n`

  if (tone) {
    prompt += `Tone:\n${tone}\n\n`
  }

  prompt += `EMAIL RECEIVED:\n${emailContent}\n\n`
  prompt += `USER'S NOTES:\n${rawReply || '(no notes — write a brief professional reply)'}\n\n`

  prompt += senderName
    ? `Sign off with:\nRegards,\n${senderName}\n`
    : 'Sign off with:\nRegards,\n'

  return prompt
}

export function buildFormatPrompt({ mode, content, customInputs, tone, emailContent, rawReply, senderName }) {
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
    prompt += '\n\nThis email was RECEIVED by the user. Write the user\'s reply BACK to the sender. Never reply as the sender.\n'
    prompt += `\nOriginal Email:\n${emailContent}`
  }

  if (rawReply) {
    prompt += `\n\nUser's notes (rough intent to expand into a clear, professional reply):\n${rawReply}`
  }

  prompt += '\n\nInstructions:\n'
  prompt += '- Follow the saved format instructions exactly.\n'
  prompt += '- Write from the user\'s perspective, using I, we, or the appropriate first-person form (a team or organisation may use "we").\n'
  prompt += '- Incorporate the custom inputs into the email.\n'
  prompt += `- Produce only the ${mode === 'email' ? 'email' : 'reply'} text.\n`
  if (mode === 'reply') {
    prompt += '- Reply to the sender directly and resolve their points; do NOT echo the original email back.\n'
  }
  prompt += '- Do not include any explanations or commentary.\n'

  if (senderName) {
    prompt += `- Sign off with: Regards,\n${senderName}\n`
  }

  return prompt
}
