const MAX_FORMAT_WORDS = 500
const TONES = [
  'Professional', 'Formal', 'Casual', 'Friendly', 'Polite',
  'Apologetic', 'Appreciative', 'Encouraging', 'Direct', 'Assertive',
  'Supportive', 'Empathetic', 'Sarcastic', 'Humorous',
]

const $ = (id) => document.getElementById(id)

function showView(viewId) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== viewId)
  })
}

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function sendMessage(message) {
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

function sendToContentScript(message) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) {
        resolve({ ok: false, error: 'No active tab' })
        return
      }
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message })
        } else {
          resolve(response)
        }
      })
    })
  })
}

function populateTones(select, selected) {
  select.innerHTML = ''
  for (const tone of TONES) {
    const option = document.createElement('option')
    option.value = tone
    option.textContent = tone
    if (tone === selected) option.selected = true
    select.appendChild(option)
  }
}

function renderFormats(formats) {
  const list = $('formats-list')
  list.innerHTML = ''
  $('formats-count').textContent = String(formats.length)
  $('formats-empty').classList.toggle('hidden', formats.length > 0)

  formats.forEach((format) => {
    const card = document.createElement('div')
    card.className = 'format-card'

    const name = document.createElement('span')
    name.className = 'format-name'
    name.textContent = format.name

    const badge = document.createElement('span')
    badge.className = 'mode-badge'
    badge.textContent = format.mode

    card.appendChild(name)
    card.appendChild(badge)
    card.addEventListener('click', () => openCompose(format))
    list.appendChild(card)
  })
}

let selectedFormat = null
let lastSubject = ''

function openCompose(format) {
  selectedFormat = format
  lastSubject = ''
  $('compose-format-name').textContent = format.name
  $('compose-mode-badge').textContent = format.mode
  populateTones($('tone-select'), format.tone)
  $('custom-inputs').value = ''
  updateWordCounter()
  $('compose-error').classList.add('hidden')
  $('result-status').classList.add('hidden')
  $('result-section').classList.add('hidden')
  $('formats-section').classList.add('hidden')
  $('compose-section').classList.remove('hidden')
}

function updateWordCounter() {
  const value = $('custom-inputs').value
  const count = countWords(value)
  const counter = $('custom-word-count')
  counter.textContent = `${count} / ${MAX_FORMAT_WORDS} words`
  counter.classList.toggle('counter-over', count > MAX_FORMAT_WORDS)
  $('generate-button').disabled = count > MAX_FORMAT_WORDS || !selectedFormat
}

async function loadFormats() {
  const result = await sendMessage({ type: 'get-formats' })
  if (!result.ok) {
    renderFormats([])
    return
  }
  renderFormats(result.formats || [])
}

async function handleGenerate() {
  const payload = {}
  if (selectedFormat) {
    payload.formatId = selectedFormat.id
  }
  const tone = $('tone-select').value
  if (tone) payload.tone = tone
  const customInputs = $('custom-inputs').value.trim()
  if (customInputs) payload.customInputs = customInputs

  const stored = await chrome.storage.local.get(['email'])
  if (stored.email) payload.senderName = stored.email

  if (selectedFormat?.mode === 'reply') {
    const email = await sendToContentScript({ type: 'get-email-content' })
    if (email.ok && email.content) payload.emailContent = email.content
  }

  $('generate-button').disabled = true
  $('generate-button').textContent = 'Generating…'
  $('compose-error').classList.add('hidden')

  const result = await sendMessage({ type: 'generate', payload })

  if (!result.ok) {
    console.error('[generate] failed', { error: result.error, details: result.details })
    $('compose-error').textContent = result.error || 'Generation failed'
    $('compose-error').classList.remove('hidden')
    $('generate-button').textContent = 'Generate'
    $('generate-button').disabled = false
    return
  }

  lastSubject = result.subject || ''
  $('result-text').value = result.reply
  $('compose-section').classList.add('hidden')
  $('result-section').classList.remove('hidden')

  const status = $('result-status')
  status.textContent = 'Generated. Click "Insert into Gmail" to inject into the compose box.'
  status.classList.remove('error')
  status.classList.remove('hidden')
}

async function handleInsert() {
  const reply = $('result-text').value
  if (!reply) return

  const result = await sendToContentScript({
    type: 'insert-reply',
    reply,
    subject: lastSubject,
  })

  const status = $('result-status')
  if (result.ok) {
    status.textContent = 'Inserted into the Gmail compose box.'
    status.classList.remove('error')
  } else {
    status.textContent =
      'Could not insert: open Gmail in this tab and start composing, then try again.'
    status.classList.add('error')
  }
  status.classList.remove('hidden')
}

async function handleLogin(event) {
  event.preventDefault()
  const email = $('login-email').value.trim()
  const password = $('login-password').value

  $('login-submit').disabled = true
  $('login-submit').textContent = 'Signing in…'
  $('login-error').classList.add('hidden')

  const result = await sendMessage({ type: 'login', email, password })

  if (!result.ok) {
    $('login-error').textContent = result.error || 'Login failed'
    $('login-error').classList.remove('hidden')
    $('login-submit').textContent = 'Sign in'
    $('login-submit').disabled = false
    return
  }

  $('account-email').textContent = result.email || email
  await loadFormats()
  showView('view-main')
}

async function handleSignup(event) {
  event.preventDefault()
  const name = $('signup-name').value.trim()
  const email = $('signup-email').value.trim()
  const password = $('signup-password').value

  $('signup-submit').disabled = true
  $('signup-submit').textContent = 'Creating account…'
  $('signup-error').classList.add('hidden')

  const result = await sendMessage({ type: 'signup', email, password, name })

  if (!result.ok) {
    $('signup-error').textContent = result.error || 'Sign up failed'
    $('signup-error').classList.remove('hidden')
    $('signup-submit').textContent = 'Sign up'
    $('signup-submit').disabled = false
    return
  }

  showSignupSuccess()
}

function showSignup() {
  $('login-error').classList.add('hidden')
  $('signup-error').classList.add('hidden')
  showView('view-signup')
}

function showSignupSuccess() {
  showView('view-login')
  $('login-error').textContent =
    'Account created — check your email to confirm, then sign in.'
  $('login-error').classList.remove('error')
  $('login-error').classList.add('muted')
  $('login-error').classList.remove('hidden')
}

async function handleSignOut() {
  await sendMessage({ type: 'logout' })
  $('login-email').value = ''
  $('login-password').value = ''
  showView('view-login')
}

async function handlePolish() {
  const status = $('polish-status')
  $('polish-button').disabled = true
  $('polish-button').textContent = 'Polishing…'
  status.classList.add('hidden')

  const result = await sendToContentScript({ type: 'polish-reply' })

  if (result.ok) {
    status.textContent = 'Polished reply inserted into the Gmail compose box.'
    status.classList.remove('error')
  } else {
    status.textContent = 'Could not polish: open Gmail in this tab and start composing, then try again.'
    status.classList.add('error')
  }
  status.classList.remove('hidden')
  $('polish-button').textContent = 'Polish my draft'
  $('polish-button').disabled = false
}

function wireEvents() {
  $('login-form').addEventListener('submit', handleLogin)
  $('signup-form').addEventListener('submit', handleSignup)
  $('go-signup').addEventListener('click', showSignup)
  $('go-login').addEventListener('click', () => showView('view-login'))
  $('sign-out').addEventListener('click', handleSignOut)
  $('polish-button').addEventListener('click', handlePolish)
  $('custom-inputs').addEventListener('input', updateWordCounter)
  $('generate-button').addEventListener('click', handleGenerate)
  $('insert-button').addEventListener('click', handleInsert)
  $('copy-button').addEventListener('click', () => {
    navigator.clipboard.writeText($('result-text').value)
    const status = $('result-status')
    status.textContent = 'Copied to clipboard.'
    status.classList.remove('error')
    status.classList.remove('hidden')
  })
  $('regenerate-button').addEventListener('click', () => {
    $('result-section').classList.add('hidden')
    $('compose-section').classList.remove('hidden')
  })
  $('back-to-formats').addEventListener('click', () => {
    $('compose-section').classList.add('hidden')
    $('formats-section').classList.remove('hidden')
    selectedFormat = null
  })
  $('back-to-compose').addEventListener('click', () => {
    $('result-section').classList.add('hidden')
    $('compose-section').classList.remove('hidden')
  })
}

async function init() {
  wireEvents()
  showView('view-loading')

  const status = await sendMessage({ type: 'auth-status' })

  if (status.ok && status.authenticated) {
    $('account-email').textContent = status.email || ''
    await loadFormats()
    showView('view-main')
  } else {
    showView('view-login')
  }
}

init()
