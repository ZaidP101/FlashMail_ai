export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const flattened = result.error.flatten()
      console.warn('[validation]', req.method, req.path, flattened)
      return _res.status(400).json({
        error: 'Validation failed',
        details: flattened.fieldErrors,
      })
    }
    req.validatedBody = result.data
    next()
  }
}
