import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verify a JWT from the Authorization header and attach the user to req.user
export const protect = async (req, res, next) => {
  try {
    let token
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer ')) token = header.split(' ')[1]

    if (!token)
      return res.status(401).json({ message: 'Not authorized - no token provided' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user)
      return res.status(401).json({ message: 'Not authorized - account no longer exists' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Not authorized - invalid or expired token' })
  }
}

// Require the authenticated user to be an admin. Always use AFTER protect.
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next()
  return res.status(403).json({ message: 'Access denied - admin privileges required' })
}