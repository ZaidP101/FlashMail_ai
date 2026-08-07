const TONES = [
  'Professional', 'Formal', 'Casual', 'Friendly', 'Polite',
  'Apologetic', 'Appreciative', 'Encouraging', 'Direct', 'Assertive',
  'Supportive', 'Empathetic', 'Sarcastic', 'Humorous',
]

function getEmailContent() {
  const selectors = ['.h7', '.a3s.aiL', '[role="presentation"]', '.gmail_quote']
  for (const selector of selectors) {
    const content = document.querySelector(selector)
    if (content) return content.innerText.trim()
  }
  return ''
}

function getReplyContent() {
  const selectors = ['.Am.aiL.editable']
  for (const selector of selectors) {
    const reply = document.querySelector(selector)
    if (reply) return reply.innerText.trim()
  }
  return ''
}

function createToneSelector() {
  const select = document.createElement('select')
  select.className = 'tone-selector'
  TONES.forEach((tone) => {
    const option = document.createElement('option')
    option.value = tone.toLowerCase()
    option.textContent = tone
    select.appendChild(option)
  })
  return select
}

function createAIButton() {
  const button = document.createElement('div')
  button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button'
  button.innerHTML = 'AI-Reply'
  button.setAttribute('role', 'button')
  button.setAttribute('data-tooltip', 'Generate AI Reply')
  return button
}

function findComposeToolBar() {
  const selectors = ['.aDh', '.btC', '[role="toolbar"]', '.gU.Up']
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector)
    if (toolbar) return toolbar
  }
  return null
}

function getComposeBox() {
  return document.querySelector('[role="textbox"][g_editable="true"]')
}

function getSubjectBox() {
  return (
    document.querySelector('input[name="subjectbox"]') ||
    document.querySelector('[aria-label="Subject"]') ||
    document.querySelector('input[name="subject"]')
  )
}

function insertReply(reply) {
  const composeBox = getComposeBox()
  if (!composeBox) return false
  composeBox.innerText = ''
  composeBox.focus()
  document.execCommand('insertText', false, reply)
  return true
}

function insertSubject(subject) {
  const subjectBox = getSubjectBox()
  if (!subjectBox || !subject) return false
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set
  setter.call(subjectBox, subject)
  subjectBox.dispatchEvent(new Event('input', { bubbles: true }))
  subjectBox.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function insertCompose(subject, reply) {
  insertSubject(subject)
  return insertReply(reply)
}

function sendToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message })
      } else {
        resolve(response)
      }
    })
  })
}

async function generateAndInsert(payload) {
  const result = await sendToBackground({ type: 'generate', payload })
  if (!result.ok) return result
  const inserted =
    payload.mode === 'compose'
      ? insertCompose(result.subject, result.reply)
      : insertReply(result.reply)
  return { ok: inserted, reply: result.reply }
}

async function sendReply() {
  const emailContent = getEmailContent()
  const replyContent = getReplyContent()
  const toneSelector = document.querySelector('.tone-selector')
  const tone = toneSelector ? toneSelector.value : ''

  const payload = { emailContent, rawReply: replyContent }
  if (tone) payload.tone = tone

  return generateAndInsert(payload)
}

async function sendCompose() {
  const draft = getReplyContent()
  const toneSelector = document.querySelector('.tone-selector')
  const tone = toneSelector ? toneSelector.value : ''

  const payload = { mode: 'compose', rawReply: draft }
  if (tone) payload.tone = tone

  return generateAndInsert(payload)
}

function getAccountEmail() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['email'], (result) => resolve(result.email || ''))
  })
}

async function polishReply() {
  const hasReceivedEmail = Boolean(getEmailContent())
  const replyContent = getReplyContent()
  const toneSelector = document.querySelector('.tone-selector')
  const tone = toneSelector ? toneSelector.value : ''
  const senderName = await getAccountEmail()

  if (!hasReceivedEmail) {
    const payload = { mode: 'compose', rawReply: replyContent }
    if (tone) payload.tone = tone
    if (senderName) payload.senderName = senderName
    return generateAndInsert(payload)
  }

  const payload = { emailContent: getEmailContent(), rawReply: replyContent }
  if (tone) payload.tone = tone
  if (senderName) payload.senderName = senderName

  return generateAndInsert(payload)
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'insert-reply') {
    const inserted = insertReply(message.reply)
    sendResponse({ ok: inserted })
    return
  }
  if (message.type === 'get-email-content') {
    sendResponse({ ok: true, content: getEmailContent() })
    return
  }
  if (message.type === 'polish-reply') {
    polishReply().then(sendResponse)
    return true
  }
})

async function injectButton() {
  const existingButton = document.querySelector('.ai-reply-button')
  if (existingButton) existingButton.remove()

  const existingTone = document.querySelector('.tone-selector')
  if (existingTone) existingTone.remove()

  const toolbar = findComposeToolBar()
  if (!toolbar) return

  const toneSelector = createToneSelector()
  const button = createAIButton()

  button.addEventListener('click', async () => {
    try {
      button.innerHTML = 'Generating...'
      button.disabled = true

      const emailContent = getEmailContent()
      const replyContent = getReplyContent()
      const tone = document.querySelector('.tone-selector').value
      const senderName = await getAccountEmail()

      const payload = !emailContent
        ? { mode: 'compose', rawReply: replyContent }
        : { emailContent, rawReply: replyContent }
      if (tone) payload.tone = tone
      if (senderName) payload.senderName = senderName

      const result = await generateAndInsert(payload)
      if (!result.ok) throw new Error(result.error || 'API request failed')
    } catch (error) {
      console.error(error)
      alert(`Failed to generate reply: ${error.message}`)
    } finally {
      button.innerHTML = 'AI-Reply'
      button.disabled = false
    }
  })

  toolbar.insertBefore(toneSelector, toolbar.firstChild)
  toolbar.insertBefore(button, toolbar.firstChild)
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes)
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]'))
    )
    if (hasComposeElements) {
      setTimeout(injectButton, 500)
    }
  }
})

observer.observe(document.body, { childList: true, subtree: true })
