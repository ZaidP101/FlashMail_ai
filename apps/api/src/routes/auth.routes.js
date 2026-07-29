import { Router } from 'express'
import { validate, requireAuth } from '../middleware/index.js'
import { SignUpSchema, LoginSchema } from '@flashmail/schemas'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

router.post('/signup', validate(SignUpSchema), authController.signup)
router.post('/login', validate(LoginSchema), authController.login)
router.get('/profile', requireAuth, authController.profile)

export default router
