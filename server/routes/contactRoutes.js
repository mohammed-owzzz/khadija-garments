import express from 'express'
import nodemailer from 'nodemailer'

const router = express.Router()

router.post('/', async (req, res) => {
  const { name, email, message } = req.body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'Name, email and message are required' })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from:     `"Khadija Garments Website" <${process.env.MAIL_USER}>`,
      to:       process.env.MAIL_USER,
      replyTo:  email,
      subject:  `New message from ${name} via Khadija Garments`,
      text:     `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;padding:24px">
          <h2 style="color:#c9a84c;margin-bottom:4px">New Contact Message</h2>
          <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
          <p style="margin:6px 0"><strong>From:</strong> ${name}</p>
          <p style="margin:6px 0"><strong>Reply to:</strong> <a href="mailto:${email}" style="color:#c9a84c">${email}</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
          <p style="white-space:pre-line;line-height:1.6">${message}</p>
        </div>
      `,
    })

    res.status(200).json({ message: 'Message sent successfully' })
  } catch (err) {
    console.error('Mail error:', err)
    res.status(500).json({ message: 'Failed to send message. Please try again.' })
  }
})

export default router