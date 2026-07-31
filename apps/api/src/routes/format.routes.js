import { Router } from 'express'
import { validate, requireAuth } from '../middleware/index.js'
import { createFormatSchema, updateFormatSchema } from '../validators/format.validators.js'
import * as formatController from '../controllers/format.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/', formatController.list)
router.post('/', validate(createFormatSchema), formatController.create)
router.get('/:id', formatController.getOne)
router.put('/:id', validate(updateFormatSchema), formatController.update)
router.delete('/:id', formatController.remove)

export default router
