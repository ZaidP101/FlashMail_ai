import { Router } from 'express'
import { validate } from '../middleware/index.js'
import { EmailReqSchema } from '@flashmail/schemas'
import * as emailController from '../controllers/email.controller.js'

const router = Router()

router.post('/generate', validate(EmailReqSchema), emailController.generate)

export default router
