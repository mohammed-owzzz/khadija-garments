// NoSQL-injection guard (Express 5 compatible).
// Strips any object keys that start with "$" or contain ".", which are the
// characters MongoDB uses for query operators and dotted paths. Mutates data
// in place so it works with Express 5, where req.query cannot be reassigned.

const isForbiddenKey = (key) => key.startsWith('$') || key.includes('.')

const scrub = (obj) => {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    obj.forEach(scrub)
    return
  }
  for (const key of Object.keys(obj)) {
    if (isForbiddenKey(key)) {
      delete obj[key]
      continue
    }
    scrub(obj[key])
  }
}

export const sanitizeRequest = (req, _res, next) => {
  scrub(req.body)
  scrub(req.params)
  try {
    scrub(req.query) // mutate in place; Express 5 forbids reassigning req.query
  } catch {
    // ignore if the runtime forbids mutation
  }
  next()
}