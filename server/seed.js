import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import Category from './models/Category.js'
import Product from './models/Product.js'
import {
  rayonSwatches,
  slubLycraSwatches,
  lycraSwatches,
  ribSwatches,
  rayon22Swatches,
  chikanMangoSwatches,
  chikanShiningSwatches,
  denimSwatches,
  rayon17Swatches,
  marioNameSwatches,
} from './data/swatches.js'

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const categoryNames = ['Palazzo', 'Pants', 'Leggings', 'Patiala', 'Co-ord Sets', 'T-Shirts', 'Denim']

const products = [
  { article: '0101', title: 'Rayon Regular Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Regular Fit · Elastic Waist', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 115, retailPrice: 155, swatches: rayonSwatches, badge: 'NEW' },
  { article: '0102', title: 'Rayon Plain Regular Pant', category: 'Pants', fabric: '100% Rayon', fit: 'Regular Fit · Elastic Waist · With Pocket', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 120, retailPrice: 160, swatches: rayonSwatches },
  { article: '0103', title: 'Rayon Plain 14Kg Palazzo', category: 'Palazzo', fabric: '100% Rayon · 14Kg Weight', fit: 'Wide Leg · Elastic & Drawstring Waist', sizes: ['L', 'XL', '2XL'], wholesalePrice: 150, retailPrice: 205, swatches: rayonSwatches },
  { article: '0104', title: 'Rayon Plain 14Kg Palazzo', category: 'Palazzo', fabric: '100% Rayon · 14Kg Weight', fit: 'Wide Leg · Elastic & Drawstring Waist', sizes: ['3XL'], wholesalePrice: 160, retailPrice: 215, swatches: rayonSwatches },
  { article: '0106', title: 'Plain Lycra Kurti Pant', category: 'Pants', fabric: 'Lycra · 4 Way Stretch', fit: 'Slim Fit · Button Hem · Elastic Waist', sizes: ['L', 'XL', '2XL'], wholesalePrice: 235, retailPrice: 315, swatches: lycraSwatches },
  { article: '0108', title: 'Slub Lycra Potli Pant', category: 'Pants', fabric: '100% Slub Lycra', fit: 'Slim Fit · Elastic Waist · With Pockets · Potli Hem', sizes: ['L', 'XL', '2XL'], wholesalePrice: 160, retailPrice: 215, swatches: slubLycraSwatches },
  { article: '0112', title: 'Rayon Regular Foil Print Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Regular Fit · Elastic Waist', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 160, retailPrice: 215, swatches: rayonSwatches },
  { article: '0113', title: 'Rayon Plain 14Kg Patiala', category: 'Patiala', fabric: '100% Rayon · 14Kg Weight', fit: 'Patiala Cut · Drawstring Waist · Tassel Hem', sizes: ['Free Size'], wholesalePrice: 250, retailPrice: 340, swatches: rayonSwatches },
  { article: '0114', title: 'Rayon Plain Big Bottom Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · With Pocket', sizes: ['L', 'XL', '2XL'], wholesalePrice: 270, retailPrice: 365, swatches: rayonSwatches },
  { article: '0115', title: 'Rayon Plain Big Bottom Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · With Pocket', sizes: ['3XL'], wholesalePrice: 285, retailPrice: 385, swatches: rayonSwatches },
  { article: '0116', title: 'Rayon Printed Big Bottom Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · Diamond Motif', sizes: ['L', 'XL', '2XL'], wholesalePrice: 295, retailPrice: 400, swatches: rayonSwatches },
  { article: '0117', title: 'Rayon Printed Big Bottom Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · Foil Motif', sizes: ['3XL'], wholesalePrice: 310, retailPrice: 420, swatches: rayonSwatches },
  { article: '0119', title: 'Rayon 22Kg Pant', category: 'Pants', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · 2 Pockets · Lace', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 190, retailPrice: 255, swatches: rayon22Swatches },
  { article: '0120', title: 'Rayon Chikan Palazzo Mango Print', category: 'Palazzo', fabric: '100% Rayon', fit: 'Chikankari · Mango Print · Lace Border · Wide Leg', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 200, retailPrice: 270, swatches: chikanMangoSwatches },
  { article: '0121', title: 'Ankle Length Rib Leggings', category: 'Leggings', fabric: 'Ribbed Cotton Blend · 2 Way Stretch', fit: 'Ankle Length · Elastic Waist · Slim Fit · Side Pocket', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 135, retailPrice: 180, swatches: ribSwatches },
  { article: '0122', title: 'Mario Cotset Pouch Pack', category: 'Co-ord Sets', fabric: 'Cotton Blend · 2 Way Stretch', fit: 'T-Shirt + Palazzo · Regular Fit · Drawstring · With Pocket', sizes: ['L', 'XL', '2XL'], wholesalePrice: 250, retailPrice: 340, swatches: marioNameSwatches },
  { article: '0127', title: 'Mario T-Shirt', category: 'T-Shirts', fabric: 'Cotton Blend · 2 Way Stretch', fit: 'Round Neck · Short Sleeve · Sticker Print · Regular Fit', sizes: ['L'], wholesalePrice: 95, retailPrice: 130, swatches: marioNameSwatches },
  { article: '0128', title: 'Rayon Chikan Palazzo Shining', category: 'Palazzo', fabric: '100% Rayon · Shining Finish', fit: 'Chikankari · Schiffli Lace · Wide Leg · Elastic Waist', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 210, retailPrice: 285, swatches: chikanShiningSwatches },
  { article: '0130', title: 'Rayon 14Kg Printed Palazzo', category: 'Palazzo', fabric: '100% Rayon · 14Kg Weight', fit: 'Ethnic Print · Lace Border · Wide Leg · Single Pocket', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 205, retailPrice: 275, swatches: rayonSwatches },
  { article: '0132', title: 'Mario Top Gym Wear', category: 'Co-ord Sets', fabric: 'Cotton Blend · 2 Way Stretch', fit: 'Printed Top + Palazzo · Slim Fit · Sleeveless · With Pocket', sizes: ['M', 'L', 'XL', '2XL'], wholesalePrice: 250, retailPrice: 340, swatches: marioNameSwatches },
  { article: '0133', title: 'Denim Ladies Trouser', category: 'Denim', fabric: '100% Denim', fit: 'Wide Leg · Drawstring Waist · With Pocket · Stone Washed', sizes: ['L', 'XL', '2XL'], wholesalePrice: 230, retailPrice: 310, swatches: denimSwatches },
  { article: '0134', title: 'Ladies Denim Cargo', category: 'Denim', fabric: '100% Denim', fit: 'Wide Leg · Drawstring Waist · With Pocket · Stone Washed', sizes: ['L', 'XL', '2XL'], wholesalePrice: 250, retailPrice: 340, swatches: denimSwatches },
  { article: '0135', title: 'Rayon 17Kg Palazzo', category: 'Palazzo', fabric: '100% Rayon', fit: 'Wide Leg · Drawstring Waist · With Pocket', sizes: ['L', 'XL', '2XL', '3XL'], wholesalePrice: 180, retailPrice: 245, swatches: rayon17Swatches },
]

const seed = async () => {
  // Safety guard: never let this destructive reseed (deleteMany) run in
  // production unless explicitly authorised, so it cannot wipe live data.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.error('Refusing to run destructive seed in production. Set ALLOW_SEED=true to override.')
    process.exit(1)
  }

  try {
    await connectDB()
    await Product.deleteMany({})
    await Category.deleteMany({})

    const categoryMap = {}
    for (const name of categoryNames) {
      const cat = await Category.create({ name, slug: slugify(name) })
      categoryMap[name] = cat._id
    }

    const docs = products.map((p) => ({
      article: p.article,
      title: p.title,
      description: `${p.title} — ${p.fabric}. ${p.fit}.`,
      fabric: p.fabric,
      fit: p.fit,
      category: categoryMap[p.category],
      sizes: p.sizes,
      wholesalePrice: p.wholesalePrice,
      retailPrice: p.retailPrice,
      moq: 100,
      swatches: p.swatches,
      badge: p.badge || '',
      stock: 100,
      isActive: true,
    }))

    await Product.insertMany(docs)

    console.log(`Seeded ${docs.length} products across ${categoryNames.length} categories`)
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
}

seed()