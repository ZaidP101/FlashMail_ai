import * as authService from '../services/supabase-auth.service.js'

export async function signup(req, res, next) {
  try {
    const { email, password, name } = req.validatedBody
    const result = await authService.signup(email, password, name)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedBody
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}

export async function profile(req, res, next) {
  try {
    const user = await authService.getProfile(req.accessToken)
    res.json(user)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
