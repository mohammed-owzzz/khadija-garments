import mongoose from 'mongoose'

const swatchSchema = new mongoose.Schema(
  {
    swatchNo: { type: String, trim: true },
    name: { type: String, trim: true },
    hex: { type: String, trim: true },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    article: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fabric: {
      type: String,
      trim: true,
    },
    fit: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    wholesalePrice: {
      type: Number,
      required: true,
    },
    retailPrice: {
      type: Number,
      required: true,
    },
    moq: {
      type: Number,
      default: 100,
    },
    image: {
      type: String,
      trim: true,
    },
    swatches: {
      type: [swatchSchema],
      default: [],
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    stock: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)