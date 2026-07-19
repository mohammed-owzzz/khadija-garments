import Category from '../models/Category.js'

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 })
    res.status(200).json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const slug = slugify(name)

    const existing = await Category.findOne({ slug })
    if (existing) {
      return res.status(400).json({ message: 'This category already exists' })
    }

    const category = await Category.create({ name: name.trim(), slug })
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category' })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.status(200).json({ message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category' })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { returnDocument: 'after', runValidators: true } // ← fix here
    )
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' })
  }
}