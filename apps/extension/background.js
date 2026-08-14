const DEFAULT_API_URL = 'http://localhost:8081'

function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiUrl'], (result) => {
      resolve(result.apiUrl || DEFAULT_API_URL)
    })
  })
}

function getTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'expiresAt', 'email'], (result) => {
      resolve(result)
    })
  })
}

function setTokens(tokens) {
  return new Promise((resolve) => {
    chrome.storage.local.set(tokens, resolve)
  })
}

function clearTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['accessToken', 'refreshToken', 'expiresAt', 'email'], resolve)
  })
}

async function refreshAccessToken() {
  const { refreshToken } = await getTokens()
  if (!refreshToken) return null

  const apiUrl = await getApiUrl()
  const response = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    await clearTokens()
    return null
  }

  const data = await response.json()
  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    email: data.email,
  })
  return data.accessToken
}

async function getValidAccessToken() {
  const { accessToken, refreshToken, expiresAt } = await getTokens()

  if (!accessToken) return null

  const now = Math.floor(Date.now() / 1000)
  if (refreshToken && expiresAt && now >= expiresAt - 60) {
    return refreshAccessToken()
  }

  return accessToken
}

async function apiFetch(path, options = {}, retry = true) {
  let accessToken = await getValidAccessToken()

  const apiUrl = await getApiUrl()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  let response = await fetch(`${apiUrl}${path}`, { ...options, headers })

  if (response.status === 401 && retry) {
    accessToken = await refreshAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      response = await fetch(`${apiUrl}${path}`, { ...options, headers })
    }
  }

  return response
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((error) => {
    sendResponse({ ok: false, error: error.message })
  })
  return true
})

async function handleMessage(message) {
  switch (message.type) {
    case 'login': {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: message.email, password: message.password }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return { ok: false, error: err.error || 'Login failed' }
      }
      const data = await response.json()
      await setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        email: data.email,
      })
      return { ok: true, email: data.email }
    }

    case 'logout': {
      await clearTokens()
      return { ok: true }
    }

    case 'auth-status': {
      const token = await getValidAccessToken()
      const { email } = await getTokens()
      return { ok: true, authenticated: !!token, email }
    }

    case 'get-formats': {
      const response = await apiFetch('/api/formats')
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return { ok: false, error: err.error || 'Failed to load formats' }
      }
      const data = await response.json()
      return { ok: true, formats: data.formats || [] }
    }

    case 'generate': {
      const response = await apiFetch('/api/email/generate', {
        method: 'POST',
        body: JSON.stringify(message.payload),
      })
      const text = await response.text()
      if (!response.ok) {
        let errMsg = text
        let details = null
        try {
          const parsed = JSON.parse(text)
          errMsg = parsed.error || text
          details = parsed.details || null
        } catch { /* keep raw text */ }
        console.error('[generate] failed', { status: response.status, error: errMsg, details })
        return { ok: false, error: errMsg, details }
      }
      let reply = text
      let subject = ''
      try {
        const parsed = JSON.parse(text)
        reply = parsed.reply ?? reply
        subject = parsed.subject ?? subject
      } catch { /* response was plain text */ }
      return { ok: true, reply, subject }
    }

    default:
      return { ok: false, error: `Unknown message type: ${message.type}` }
  }
}
