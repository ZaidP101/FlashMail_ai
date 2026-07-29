const API_BASE = 'http://localhost:8080'

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
  select.style.marginRight = '8px'
  select.style.padding = '4px'

  const tones = ['Professional', 'Casual', 'Friendly', 'Rude', 'Funny']
  tones.forEach((tone) => {
    const option = document.createElement('option')
    option.value = tone.toLowerCase()
    option.textContent = tone
    select.appendChild(option)
  })

  return select
}

function createAIButton() {
  const button = document.createElement('div')
  button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3'
  button.style.marginRight = '8px'
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

function injectButton() {
  const existingButton = document.querySelector('.ai-reply-button')
  if (existingButton) existingButton.remove()

  const existingTone = document.querySelector('.tone-selector')
  if (existingTone) existingTone.remove()

  const toolbar = findComposeToolBar()
  if (!toolbar) return

  const toneSelector = createToneSelector()
  const button = createAIButton()
  button.classList.add('ai-reply-button')

  button.addEventListener('click', async () => {
    try {
      button.innerHTML = 'Generating...'
      button.disabled = true

      const emailContent = getEmailContent()
      const replyContent = getReplyContent()
      const tone = document.querySelector('.tone-selector').value

      const response = await fetch(`${API_BASE}/api/email/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent,
          tone,
          rawReply: replyContent,
        }),
      })

      if (!response.ok) throw new Error('API Request Failed')

      const data = await response.json()
      const generatedReply = data.reply || data

      const composeBox = document.querySelector('[role="textbox"][g_editable="true"]')
      if (composeBox) {
        composeBox.innerText = ''
        composeBox.focus()
        document.execCommand('insertText', false, generatedReply)
      }
    } catch (error) {
      console.error(error)
      alert('Failed to generate reply')
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

observer.observe(document.body, {
  childList: true,
  subtree: true,
})
