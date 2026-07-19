import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendOtpEmail = async (toEmail, otp, type) => {
  const subject =
    type === 'register'
      ? 'Verify your Khadija Garments account'
      : 'Your Khadija Garments login OTP'
  const action = type === 'register' ? 'complete your registration' : 'log in'
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#C8A84B;margin-bottom:8px;">Khadija Garments</h2>
      <p style="color:#555;margin-bottom:24px;">Use the code below to ${action}. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1a1a1a;">${otp}</span>
      </div>
      <p style="color:#999;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
  await transporter.sendMail({
    from: `"Khadija Garments" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  })
}

// ── Order placed: notify admin ──────────────────────────────────────────────
export const sendOrderPlacedAdminEmail = async (order) => {
  const itemRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.size}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${i.lineTotal.toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#C8A84B;margin-bottom:4px;">New Order Received ^_^</h2>
      <p style="color:#888;font-size:13px;margin-bottom:24px;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>

      <h3 style="color:#1a1a1a;margin-bottom:8px;">Customer Details</h3>
      <p style="margin:2px 0;color:#555;"><strong>Name:</strong> ${order.customer.name}</p>
      <p style="margin:2px 0;color:#555;"><strong>Email:</strong> ${order.customer.email}</p>
      <p style="margin:2px 0;color:#555;"><strong>Phone:</strong> ${order.customer.phone}</p>
      <p style="margin:2px 0;color:#555;"><strong>Address:</strong> ${[order.address.line1, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')}</p>

      <h3 style="color:#1a1a1a;margin-top:24px;margin-bottom:8px;">Order Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Size</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:16px;text-align:right;">
        <p style="color:#555;margin:4px 0;">Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}</p>
        <p style="color:#555;margin:4px 0;">Shipping: ₹${order.shipping.toLocaleString('en-IN')}</p>
        <p style="font-size:18px;font-weight:bold;color:#C8A84B;margin-top:8px;">Total: ₹${order.total.toLocaleString('en-IN')}</p>
      </div>

      <p style="margin-top:24px;color:#888;font-size:12px;">Log in to the admin dashboard to manage this order.</p>
    </div>
  `

  await transporter.sendMail({
    from: `"Khadija Garments" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Order #${order._id.toString().slice(-8).toUpperCase()} from ${order.customer.name}`,
    html,
  })
}

// ── Order placed: notify customer ───────────────────────────────────────────
export const sendOrderPlacedCustomerEmail = async (order) => {
  const trackCode = order._id.toString().slice(-8).toUpperCase()
  const itemRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.size}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${i.lineTotal.toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#C8A84B;margin-bottom:4px;">Order Confirmed ^_^</h2>
      <p style="color:#888;font-size:13px;margin-bottom:8px;">Hi ${order.customer.name}, your order has been placed successfully!</p>
      <p style="color:#555;font-size:14px;margin-bottom:24px;">Your order tracking code: <strong style="color:#1a1a1a;font-size:18px;letter-spacing:2px;">${trackCode}</strong></p>

      <h3 style="color:#1a1a1a;margin-bottom:8px;">Order Summary</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;">Product</th>
            <th style="padding:8px 12px;text-align:center;">Size</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:16px;text-align:right;">
        <p style="color:#555;margin:4px 0;">Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}</p>
        <p style="color:#555;margin:4px 0;">Shipping: ₹${order.shipping.toLocaleString('en-IN')}</p>
        <p style="font-size:18px;font-weight:bold;color:#C8A84B;margin-top:8px;">Total: ₹${order.total.toLocaleString('en-IN')}</p>
      </div>

      <div style="margin-top:24px;background:#f9f5ec;border-radius:12px;padding:20px;">
        <p style="margin:0 0 8px 0;color:#1a1a1a;font-weight:bold;">Track your order</p>
        <p style="margin:0;color:#555;font-size:13px;">Visit our website and use tracking code <strong>${trackCode}</strong> in the "Track Your Order" section to see live status updates.</p>
      </div>

      <p style="margin-top:24px;color:#888;font-size:12px;">Payment Method: Cash on Delivery (COD). If you have questions, contact us at khadijagarments@gmail.com.</p>
    </div>
  `

  await transporter.sendMail({
    from: `"Khadija Garments" <${process.env.EMAIL_USER}>`,
    to: order.customer.email,
    subject: `Order Confirmed #${trackCode} — Khadija Garments`,
    html,
  })
}

// ── Status updated: notify customer ─────────────────────────────────────────
const STATUS_MESSAGES = {
  Placed:     { emoji: '>o<', line: 'Your order has been received and is being processed.' },
  Packed:     { emoji: '^_^', line: 'Great news! Your order has been packed and is ready to ship.' },
  Dispatched: { emoji: '>w<', line: 'Your order is on its way! Our delivery partner has picked it up.' },
  Delivered:  { emoji: '^o^', line: 'Your order has been delivered. We hope you love it!' },
  Cancelled:  { emoji: '>_<', line: 'Your order has been cancelled. If this was not you, please contact us.' },
}

export const sendOrderStatusEmail = async (order) => {
  const trackCode = order._id.toString().slice(-8).toUpperCase()
  const { emoji, line } = STATUS_MESSAGES[order.status] || { emoji: '^_^', line: 'Your order status has been updated.' }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
      <h2 style="color:#C8A84B;margin-bottom:4px;">Order Update ${emoji}</h2>
      <p style="color:#888;font-size:13px;margin-bottom:24px;">Order #${trackCode}</p>

      <div style="background:#f9f5ec;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="font-size:32px;margin:0 0 8px 0;">${emoji}</p>
        <p style="font-size:22px;font-weight:bold;color:#1a1a1a;margin:0 0 8px 0;">${order.status.toUpperCase()}</p>
        <p style="color:#555;font-size:14px;margin:0;">${line}</p>
      </div>

      <p style="color:#555;font-size:14px;">Hi ${order.customer.name},</p>
      <p style="color:#555;font-size:14px;">${line}</p>

      <div style="margin-top:24px;border:1px solid #eee;border-radius:8px;padding:16px;">
        <p style="margin:0 0 4px 0;color:#888;font-size:12px;">TRACKING CODE</p>
        <p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:3px;color:#1a1a1a;">${trackCode}</p>
      </div>

      <p style="margin-top:24px;color:#888;font-size:12px;">Track your order live on our website. If you have questions, contact us at khadijagarments@gmail.com.</p>
    </div>
  `

  await transporter.sendMail({
    from: `"Khadija Garments" <${process.env.EMAIL_USER}>`,
    to: order.customer.email,
    subject: `Order #${trackCode} is now ${order.status} — Khadija Garments`,
    html,
  })
}