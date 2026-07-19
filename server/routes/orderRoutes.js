import express from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  updateOrderPayment,
  updateOrderRefund,
  getCheckoutStatus,
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createOrder)
router.get('/', protect, admin, getOrders)
router.get('/track/:code',     trackOrder)      // public track-by-code — must be BEFORE /:id
router.get('/checkout-status', protect, getCheckoutStatus)  // storefront gating: order cap + COD eligibility
router.get('/:id', protect, getOrderById)
router.put('/:id/status', protect, admin, updateOrderStatus)
router.delete('/:id', protect, admin, deleteOrder)
router.put('/:id/payment', protect, admin, updateOrderPayment)  // admin marks UPI payment received/pending
router.put('/:id/refund', protect, admin, updateOrderRefund)  // admin marks a cancelled online order as refunded
router.put('/cancel/:code', protect, cancelOrder)  // customer cancels their own order by tracking code

export default router