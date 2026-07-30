import { Router } from 'express'
import { validate } from '../middleware/index.js'
import { generateEmailSchema } from '../validators/email.validators.js'
import * as emailController from '../controllers/email.controller.js'

const router = Router()

router.post('/generate', validate(generateEmailSchema), emailController.generate)

export default router
