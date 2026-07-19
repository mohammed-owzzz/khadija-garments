import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    article: { type: String, trim: true },
    title: { type: String, trim: true },
    image: { type: String, trim: true },
    size: { type: String, trim: true },
    colour: { type: String, trim: true },
    colourHex: { type: String, trim: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    priceType: { type: String, enum: ['retail', 'wholesale'], default: 'retail' },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    address: {
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    // Wholesale orders ask the buyer whether they are a registered business
    // (GST billing) or an individual. Businesses must supply full GST details;
    // individuals fall back to the standard first-order-COD rule.
    customerType: {
      type: String,
      enum: ['individual', 'business'],
      default: 'individual',
    },
    // True when at least one line in the order is priced at the wholesale rate.
    isWholesale: {
      type: Boolean,
      default: false,
    },
    // GST / business billing details. Only populated for business orders.
    business: {
      name:          { type: String, trim: true, default: '' },
      gstin:         { type: String, trim: true, default: '' },
      line1:         { type: String, trim: true, default: '' },
      city:          { type: String, trim: true, default: '' },
      state:         { type: String, trim: true, default: '' },
      pincode:       { type: String, trim: true, default: '' },
      contactPerson: { type: String, trim: true, default: '' },
      phone:         { type: String, trim: true, default: '' },
      email:         { type: String, trim: true, default: '' },
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI'],
      default: 'UPI',
    },
    // UPI payment tracking. The customer pays to the store's UPI VPA outside the
    // app and submits the transaction reference (UTR). The admin verifies it
    // against their bank/UPI app and flips paymentStatus to 'paid'. Only paid
    // orders count toward dashboard revenue.
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentRef: {
      type: String,
      trim: true,
      default: '',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
    },
    // Refund tracking (manual UPI refunds). When a paid-online order is
    // cancelled, refundStatus is auto-set to 'pending' so the admin knows money
    // is owed back. The admin sends the refund from their own UPI/bank app and
    // then marks it 'refunded', optionally storing the refund transaction ref.
    // COD orders never need a refund because no money was collected up-front.
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'refunded'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundRef: {
      type: String,
      trim: true,
      default: '',
    },
    refundAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Placed', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    // Soft-delete flag: hidden orders disappear from the admin Orders tab but
    // stay in the database so revenue/analytics remain accurate.
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)