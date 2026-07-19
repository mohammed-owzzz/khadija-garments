import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
  email:       { type: String, required: true },
  phone:       { type: String, default: '' },
  emailOtp:    { type: String, required: true },
  phoneOtp:    { type: String, default: '' },
  pendingUser: { type: Object, default: null },
  userId:      { type: String, default: null },
  type:        { type: String, enum: ['register', 'login'], required: true },
  expiresAt:   { type: Date,   required: true },
})

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)