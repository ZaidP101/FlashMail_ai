import { Router } from 'express'
import { validate, requireAuth } from '../middleware/index.js'
import { signUpSchema, loginSchema, refreshSchema } from '../validators/auth.validators.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

router.post('/signup', validate(signUpSchema), authController.signup)
router.post('/login', validate(loginSchema), authController.login)
router.post('/refresh', validate(refreshSchema), authController.refresh)
router.get('/profile', requireAuth, authController.profile)

export default router
