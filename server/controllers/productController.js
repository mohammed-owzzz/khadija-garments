import Product from '../models/Product.js'

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ article: 1 })
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug')
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(200).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { article, title, category, wholesalePrice, retailPrice } = req.body
    if (!article || !title || !category || wholesalePrice == null || retailPrice == null) {
      return res.status(400).json({ message: 'Article, title, category, wholesale price and retail price are required' })
    }

    const existing = await Product.findOne({ article: article.trim() })
    if (existing) {
      return res.status(400).json({ message: 'A product with this article number already exists' })
    }

    const product = await Product.create(req.body)
    const populated = await product.populate('category', 'name slug')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug')

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(200).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(200).json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' })
  }
}