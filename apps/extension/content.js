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
    if (reply) {
      const clone = reply.cloneNode(true)
      clone.querySelectorAll('.gmail_signature, [data-smartmail="gmail_signature"]').forEach((el) => el.remove())
      return clone.innerText.trim()
    }
  }
  return ''
}

function getSignatureElement() {
  const composeBox = getComposeBox()
  if (!composeBox) return null
  return (
    composeBox.querySelector('.gmail_signature') ||
    composeBox.querySelector('[data-smartmail="gmail_signature"]') ||
    null
  )
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
  const bodySelectors = [
    'div[aria-label="Message Body"]',
    '.Am.aiL.editable',
    'div[role="textbox"][g_editable="true"]',
  ]
  for (const selector of bodySelectors) {
    const matches = document.querySelectorAll(selector)
    if (matches.length) {
      const visible = [...matches].filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      )
      const pool = visible.length ? visible : matches
      return pool[pool.length - 1]
    }
  }
  return null
}

function getSubjectBox() {
  const subjectSelectors = [
    'input[name="subjectbox"]',
    'input.aoT[name="subjectbox"]',
    'input[aria-label="Subject"]',
    'input[name="subject"]',
  ]
  for (const selector of subjectSelectors) {
    const match = document.querySelector(selector)
    if (match) return match
  }
  return null
}

function insertReply(reply) {
  const composeBox = getComposeBox()
  if (!composeBox) return false

  console.log(
    '[insert] compose box →',
    composeBox.className,
    '| aria-label:',
    composeBox.getAttribute('aria-label'),
    '| id:',
    composeBox.id,
  )

  const signature = getSignatureElement()
  const signatureHtml = signature ? signature.outerHTML : ''

  composeBox.innerText = ''
  composeBox.focus()

  const range = document.createRange()
  range.selectNodeContents(composeBox)
  range.collapse(false)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  document.execCommand('insertText', false, reply)

  if (signatureHtml) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = signatureHtml
    const restored = wrapper.firstChild
    if (restored) composeBox.appendChild(restored)
  }

  return true
}

function insertSubject(subject) {
  const subjectBox = getSubjectBox()
  if (!subjectBox || !subject) return false

  console.log(
    '[insert] subject box →',
    subjectBox.className,
    '| name:',
    subjectBox.name,
    '| id:',
    subjectBox.id,
  )

  subjectBox.focus()

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set
  setter.call(subjectBox, subject)
  subjectBox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: subject }))
  subjectBox.dispatchEvent(new Event('change', { bubbles: true }))

  if (subjectBox.value !== subject) {
    const range = document.createRange()
    range.selectNodeContents(subjectBox)
    range.collapse(false)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    document.execCommand('insertText', false, subject)
  }

  return subjectBox.value === subject
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
    const subjectOk = message.subject ? insertSubject(message.subject) : true
    const inserted = insertReply(message.reply)
    sendResponse({ ok: inserted, subjectOk })
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
