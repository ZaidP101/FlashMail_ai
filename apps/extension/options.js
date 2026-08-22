const apiUrlInput = document.getElementById('apiUrl')
const authTokenInput = document.getElementById('authToken')
const statusDiv = document.getElementById('status')
const saveBtn = document.getElementById('save')

chrome.storage.sync.get(['apiUrl', 'authToken'], (result) => {
  if (result.apiUrl) apiUrlInput.value = result.apiUrl
  if (result.authToken) authTokenInput.value = result.authToken
})

saveBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.trim() || 'https://api.zaidp101.tech'
  const authToken = authTokenInput.value.trim()

  chrome.storage.sync.set({ apiUrl, authToken }, () => {
    statusDiv.textContent = 'Settings saved!'
    statusDiv.style.color = '#22c55e'
    setTimeout(() => { statusDiv.textContent = '' }, 2000)
  })
})
