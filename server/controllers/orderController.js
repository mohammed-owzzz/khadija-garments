import Order from '../models/Order.js'
import Product from '../models/Product.js'
import {
  sendOrderPlacedAdminEmail,
  sendOrderPlacedCustomerEmail,
  sendOrderStatusEmail,
} from '../utils/sendEmail.js'

// Manual-fulfilment cap: while this many orders are still "in progress" (not
// delivered, not cancelled), the store stops accepting brand-new orders so the
// team can pack and ship everything by hand without falling behind.
const ACTIVE_ORDER_LIMIT = 10

// Count orders still being worked on (Placed / Packed / Dispatched). Delivered,
// cancelled and hidden orders do NOT count against the cap.
const countActiveOrders = () =>
  Order.countDocuments({
    status: { $nin: ['Delivered', 'Cancelled'] },
    hidden: { $ne: true },
  })

// A customer unlocks Cash on Delivery only after at least one PAST order that
// was paid online (UPI) and verified as paid by the admin.
const hasPaidOnlineOrder = async (userId) => {
  if (!userId) return false
  const count = await Order.countDocuments({
    user: userId,
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
  })
  return count > 0
}

export const createOrder = async (req, res) => {
  try {
    // Manual-fulfilment cap: refuse new orders while too many are in progress.
    const activeCount = await countActiveOrders()
    if (activeCount >= ACTIVE_ORDER_LIMIT) {
      return res.status(409).json({
        message: "We're currently not accepting new orders. Please check back soon!",
      })
    }

    const { customer, address, items, paymentRef, paymentMethod, customerType, business } = req.body

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ message: 'Customer name, email and phone are required' })
    }
    if (!address?.line1 || !address?.city || !address?.pincode) {
      return res.status(400).json({ message: 'Address line, city and pincode are required' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' })
    }

    const orderItems = []
    for (const item of items) {
      const product = await Product.findById(item.id)
      if (!product || product.isActive === false) {
        return res.status(400).json({ message: `Product no longer available: ${item.title}` })
      }
      const quantity = Number(item.quantity)
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${product.title}` })
      }
      const isWholesale = quantity >= product.moq
      const unitPrice   = isWholesale ? product.wholesalePrice : product.retailPrice
      orderItems.push({
        product:    product._id,
        article:    product.article,
        title:      product.title,
        image:      product.image,
        size:       item.size,
        colour:     item.colour     || '',
        colourHex:  item.colourHex  || '',
        quantity,
        unitPrice,
        priceType:  isWholesale ? 'wholesale' : 'retail',
        lineTotal:  unitPrice * quantity,
      })
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0)
    // Shipping is not charged up-front. Delivery within Mumbai is free; for
    // other locations the transport cost is settled separately on delivery.
    const shipping = 0
    const total    = subtotal

    // A wholesale order is one where at least one line is billed at the bulk
    // (wholesale) rate. Wholesale buyers are asked at checkout whether they are
    // a registered business (GST) or an individual.
    const isWholesaleOrder = orderItems.some((i) => i.priceType === 'wholesale')
    // Only wholesale orders may be flagged as a business; retail always stays
    // individual so the standard first-order-COD rules apply.
    const type = isWholesaleOrder && customerType === 'business' ? 'business' : 'individual'

    // Businesses must supply complete, valid GST billing details.
    let businessDetails
    if (type === 'business') {
      const b       = business || {}
      const name    = (b.name    || '').toString().trim()
      const gstin   = (b.gstin   || '').toString().trim().toUpperCase()
      const line1   = (b.line1   || '').toString().trim()
      const city    = (b.city    || '').toString().trim()
      const state   = (b.state   || '').toString().trim()
      const pincode = (b.pincode || '').toString().trim()
      if (!name || !gstin || !line1 || !city || !state || !pincode) {
        return res.status(400).json({ message: 'Business name, GSTIN and full business address are required for GST billing' })
      }
      // Standard 15-character GSTIN format (state code + PAN + entity + Z + check).
      const gstinRe = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/
      if (!gstinRe.test(gstin)) {
        return res.status(400).json({ message: 'Please enter a valid 15-character GSTIN' })
      }
      businessDetails = {
        name, gstin, line1, city, state, pincode,
        contactPerson: (b.contactPerson || '').toString().trim(),
        phone:         (b.phone         || '').toString().trim(),
        email:         (b.email         || '').toString().trim(),
      }
    }

    // Resolve the payment method. UPI (online) is always available. COD is
    // unlocked for GST businesses on wholesale orders (no first-order rule);
    // everyone else must have completed at least one verified online payment.
    const method = paymentMethod === 'COD' ? 'COD' : 'UPI'
    if (method === 'COD') {
      if (type !== 'business') {
        const eligible = await hasPaidOnlineOrder(req.user?._id)
        if (!eligible) {
          return res.status(403).json({
            message: 'Cash on Delivery unlocks after your first successful online payment.',
          })
        }
      }
    } else {
      // UPI orders must carry the transaction reference (UTR) for verification.
      const ref = (paymentRef || '').toString().trim()
      if (ref.length < 6) {
        return res.status(400).json({ message: 'Please enter the UPI reference / UTR after paying' })
      }
    }

    const order = await Order.create({
      user:          req.user?._id || null,
      customer,
      address,
      customerType:  type,
      isWholesale:   isWholesaleOrder,
      business:      businessDetails,
      items:         orderItems,
      subtotal,
      shipping,
      total,
      paymentMethod: method,
      paymentStatus: 'pending',
      paymentRef:    method === 'UPI' ? (paymentRef || '').toString().trim() : '',
      status:        'Placed',
    })

    // Fire-and-forget emails (don't block the response)
    Promise.allSettled([
      sendOrderPlacedAdminEmail(order),
      sendOrderPlacedCustomerEmail(order),
    ]).catch(() => {}) // silently ignore email failures

    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order' })
  }
}

// Checkout gating for the logged-in customer. Tells the storefront whether the
// store is still accepting orders (manual-fulfilment cap) and whether this
// customer is allowed to use Cash on Delivery.
export const getCheckoutStatus = async (req, res) => {
  try {
    const activeCount = await countActiveOrders()
    const codEligible = await hasPaidOnlineOrder(req.user?._id)
    res.status(200).json({
      accepting:   activeCount < ACTIVE_ORDER_LIMIT,
      activeCount,
      limit:       ACTIVE_ORDER_LIMIT,
      codEligible,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to load checkout status' })
  }
}

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.status(200).json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    // Ownership check: only the customer who placed the order (or an admin)
    // may view it. Stops anyone reading others' orders/PII by guessing IDs.
    const isOwner = order.user && String(order.user) === String(req.user?._id)
    if (!req.user?.isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this order' })
    }
    res.status(200).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order' })
  }
}

// Track order by short code (last 8 chars of ObjectId)
export const trackOrder = async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase().trim()
    if (!code || code.length < 6) {
      return res.status(400).json({ message: 'Invalid tracking code' })
    }
    // Find orders whose _id ends with the code (case-insensitive)
    const orders = await Order.find({})
    const order = orders.find(
      (o) => o._id.toString().slice(-8).toUpperCase() === code
    )
    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check your tracking code.' })
    }
    // Return only safe public fields
    res.status(200).json({
      trackCode:   order._id.toString().slice(-8).toUpperCase(),
      status:      order.status,
      customer:    { name: order.customer.name },
      items:       order.items.map((i) => ({ title: i.title, quantity: i.quantity, size: i.size })),
      total:       order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      refundStatus:  order.refundStatus,
      refundAmount:  order.refundAmount,
      createdAt:   order.createdAt,
      updatedAt:   order.updatedAt,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to track order' })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['Placed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    // When an order that was already paid online gets cancelled, the customer
    // is owed a refund. Auto-flag it as pending so the admin can't forget to
    // send the money back. (COD / unpaid orders never need a refund.)
    if (
      order.status === 'Cancelled' &&
      order.paymentStatus === 'paid' &&
      order.refundStatus === 'none'
    ) {
      order.refundStatus = 'pending'
      order.refundAmount = order.paidAmount || order.total
      await order.save()
    }
    // Send status update email (fire-and-forget)
    sendOrderStatusEmail(order).catch(() => {})
    res.status(200).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' })
  }
}

// Soft-delete an order (admin only). The document is KEPT so revenue is
// unaffected; it is merely flagged hidden so it drops out of the Orders tab.
// Only delivered or cancelled orders may be removed.
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Only delivered or cancelled orders can be deleted' })
    }
    order.hidden = true
    await order.save()
    res.status(200).json({ message: 'Order removed', _id: order._id })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order' })
  }
}

// Cancel an order by its public tracking code (customer-facing). Only the
// customer who placed the order (or an admin) may cancel it, and only while it
// is still Placed (i.e. not yet packed). Cancelled orders are excluded from revenue.
export const cancelOrder = async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase().trim()
    if (!code || code.length < 6) {
      return res.status(400).json({ message: 'Invalid tracking code' })
    }
    const orders = await Order.find({})
    const order = orders.find(
      (o) => o._id.toString().slice(-8).toUpperCase() === code
    )
    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check your tracking code.' })
    }
    // Ownership: only the order's customer (or an admin) may cancel it.
    const isOwner = order.user && String(order.user) === String(req.user?._id)
    if (!req.user?.isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You can only cancel your own orders' })
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'This order has already been cancelled' })
    }
    // Orders can only be cancelled while still 'Placed'. Once packed (or later)
    // the order is already in fulfilment and can no longer be cancelled.
    if (order.status !== 'Placed') {
      return res.status(400).json({ message: `This order has already been ${order.status.toLowerCase()} and can no longer be cancelled` })
    }
    order.status = 'Cancelled'
    // If the order was already paid online, mark that a refund is owed so the
    // admin sees it in the refunds queue and can send the money back manually.
    if (order.paymentStatus === 'paid' && order.refundStatus === 'none') {
      order.refundStatus = 'pending'
      order.refundAmount = order.paidAmount || order.total
    }
    await order.save()
    sendOrderStatusEmail(order).catch(() => {})
    res.status(200).json({ trackCode: code, status: order.status, refundStatus: order.refundStatus })
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order' })
  }
}

// Mark an order's UPI payment as received / not received (admin only). The admin
// verifies the transfer against their bank/UPI app, then flips the flag. Only
// PAID orders count toward dashboard revenue.
export const updateOrderPayment = async (req, res) => {
  try {
    const { paid, paymentRef } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (paid) {
      order.paymentStatus = 'paid'
      order.paidAmount    = order.total
      order.paidAt        = new Date()
      if (paymentRef !== undefined) order.paymentRef = (paymentRef || '').toString().trim()
    } else {
      order.paymentStatus = 'pending'
      order.paidAmount    = 0
      order.paidAt        = null
    }
    await order.save()
    res.status(200).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment status' })
  }
}

// Mark a cancelled online order as refunded / not-yet-refunded (admin only).
// Refunds are performed manually by the admin from their own UPI/bank app; this
// endpoint only records that it was done (and optionally the refund UTR) so the
// dashboard's "Refunds Pending" queue stays accurate.
export const updateOrderRefund = async (req, res) => {
  try {
    const { refunded, refundRef } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Only orders that were paid online can be refunded' })
    }
    if (order.status !== 'Cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be refunded' })
    }
    if (refunded) {
      order.refundStatus = 'refunded'
      order.refundAmount = order.refundAmount || order.paidAmount || order.total
      order.refundAt     = new Date()
      if (refundRef !== undefined) order.refundRef = (refundRef || '').toString().trim()
    } else {
      order.refundStatus = 'pending'
      order.refundAt     = null
      order.refundRef    = ''
    }
    await order.save()
    res.status(200).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update refund status' })
  }
}