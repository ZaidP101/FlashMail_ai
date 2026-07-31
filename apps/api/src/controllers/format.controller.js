import * as formatService from '../services/format.service.js'

export async function list(req, res, next) {
  try {
    const formats = await formatService.listFormats(req.accessToken)
    res.json({ formats })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req, res, next) {
  try {
    const format = await formatService.getFormat(req.accessToken, req.params.id)
    if (!format) return res.status(404).json({ error: 'Format not found' })
    res.json(format)
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const format = await formatService.createFormat(req.accessToken, req.validatedBody)
    res.status(201).json(format)
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const format = await formatService.updateFormat(req.accessToken, req.params.id, req.validatedBody)
    if (!format) return res.status(404).json({ error: 'Format not found' })
    res.json(format)
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    const deleted = await formatService.deleteFormat(req.accessToken, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Format not found' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
