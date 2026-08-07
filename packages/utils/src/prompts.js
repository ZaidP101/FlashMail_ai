const REPLY_EXAMPLE = `Example

Email:
Can you attend tomorrow?

Notes:
yes

Output:
Hi,

Yes, I will be able to attend tomorrow.

Regards,
<name>`

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
  prompt += `${REPLY_EXAMPLE}\n\n`

  if (tone) {
    prompt += `Tone:\n${tone}\n\n`
  }

  prompt += `EMAIL RECEIVED:\n${emailContent}\n\n`
  prompt += `USER'S NOTES:\n${rawReply || '(no notes — write a brief professional reply)'}\n\n`

  prompt += 'Sign-off rules:\n'
  prompt += '- If the received email addresses the user by name (e.g. "Hi Zaid" or "Dear Zaid Patel"), sign off with that name.\n'
  if (senderName) {
    prompt += `- Otherwise, sign off with the supplied name: ${senderName}.\n`
  }
  prompt += '- Otherwise, sign off with just: Regards,\n'
  prompt += '- Do NOT invent a name that is not present in the email or supplied.\n\n'

  prompt += 'Output:\n'

  return prompt
}

export function buildComposePrompt(draft, tone, senderName) {
  let prompt = 'You are FlashMail AI.\n'
  prompt += '\nYou write professional emails on behalf of the user.\n'
  prompt += '\n=========================\nTASK\n=========================\n\n'
  prompt += 'Transform the user\'s rough draft into a complete, polished email.\n'
  prompt += 'Expand incomplete thoughts while preserving the user\'s intent.\n'
  prompt += 'Do not change the meaning.\n'
  prompt += '\n=========================\nRULES\n=========================\n\n'
  prompt += '- Write naturally.\n'
  prompt += '- Improve grammar.\n'
  prompt += '- Improve clarity.\n'
  prompt += '- Improve sentence flow.\n'
  prompt += '- Preserve names, dates and facts.\n'
  prompt += '- Do not invent information.\n'
  prompt += '- Keep the requested tone.\n'
  prompt += '- Output only the email.\n'
  prompt += '- Do not identify your changes.\n'
  prompt += '\n=========================\nTONE\n=========================\n\n'
  prompt += `${tone || 'Professional'}\n`
  prompt += '\n=========================\nUSER DRAFT\n=========================\n\n'
  prompt += `${draft}\n`
  prompt += '\n=========================\nOUTPUT\n=========================\n\n'
  prompt += 'Write the final email.\n'
  prompt += 'Start with a line exactly like: Subject: <subject text>\n'
  prompt += 'Then a blank line, then the email body.\n'

  if (senderName) {
    prompt += `\nSign off the email with:\nRegards,\n${senderName}\n`
  }

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