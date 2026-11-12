import pro1 from '../assets/products/pro1.jpg'
import pro2 from '../assets/products/pro2.jpg'
import pro3 from '../assets/products/pro3.jpg'
import pro4 from '../assets/products/pro4.jpg'
import catShirt from '../assets/products/download (5).jpg'
import pinkSet from '../assets/products/download (6).jpg'
import yellowHat from '../assets/products/download (7).jpg'
import appleVest from '../assets/products/Mã áo siêu cute cho các công chúa_ Size M, L, XL ạ.jpg'
import retroShirt from '../assets/products/Retro Cartoon Shirts _ ERMANARIC.jpg'
import kyotoJersey from '../assets/products/Unisex Summer Plus-Size Mesh V-Neck Jersey T-Shirt With Retro Kyoto Japan Scenery And Cherry Blossom.jpg'
import undercoverShirt from '../assets/products/Undercover.jpg'

export const products = [
  { id: 'shoreline-knit-polo', name: 'Shoreline knit polo', category: 'Tops', section: 'Women', price: 2790, image: pro1, imageAlt: 'Blue and pink shoreline knit polo shirt', imagePosition: 'center', badge: 'Bestseller', sizes: 'S–XL' },
  { id: 'cocoa-ruched-dress', name: 'Cocoa ruched dress', category: 'Dresses', section: 'Women', price: 1890, image: pro3, imageAlt: 'Cocoa brown ruched long-sleeve dress', imagePosition: 'center', badge: 'New', sizes: 'S–XL' },
  { id: 'blue-meadow-blouse', name: 'Blue meadow blouse', category: 'Tops', section: 'Women', price: 2490, image: pro4, imageAlt: 'White blouse with blue floral print', imagePosition: 'center', sizes: 'S–XL' },
  { id: 'starlight-patchwork-shirt', name: 'Starlight patchwork shirt', category: 'Shirts', section: 'Men', price: 2290, image: pro2, imageAlt: 'Pink plaid shirt with cat patchwork', imagePosition: 'center', badge: 'New', sizes: 'S–XXL' },
  { id: 'retro-sunshine-shirt', name: 'Retro sunshine shirt', category: 'Shirts', section: 'Men', price: 2190, image: retroShirt, imageAlt: 'Cream shirt with playful retro illustrations', imagePosition: 'center', sizes: 'S–XXL' },
  { id: 'cat-collar-shirt', name: 'Cat collar shirt', category: 'Shirts', section: 'Kids', price: 1990, image: catShirt, imageAlt: 'Cream striped shirt with cat appliques', imagePosition: 'center', badge: 'New', sizes: 'S–XL' },
  { id: 'pink-prep-layered-set', name: 'Pink prep layered set', category: 'Outerwear', section: 'Women', price: 3290, image: pinkSet, imageAlt: 'Pink checked jacket and layered outfit', imagePosition: 'center', sizes: 'S–XL' },
  { id: 'cloud-garden-knit-vest', name: 'Cloud garden knit vest', category: 'Knitwear', section: 'Kids', price: 1690, image: appleVest, imageAlt: 'Light blue embroidered cloud and garden knit vest', imagePosition: 'center', sizes: 'S–L' },
  { id: 'sunbeam-earmuff-hat', name: 'Sunbeam earmuff hat', category: 'Accessories', section: 'Accessories', price: 990, image: yellowHat, imageAlt: 'Yellow striped knit hat with earmuffs', imagePosition: 'center', badge: 'Limited', sizes: 'One size' },
  { id: 'kyoto-mesh-jersey', name: 'Kyoto mesh jersey', category: 'Shirts', section: 'Men', price: 1000, image: kyotoJersey, imageAlt: 'Blue and white mesh jersey with a Kyoto Japan scenery print', imagePosition: 'center', badge: 'New', sizes: 'S–XXL' },
  { id: 'undercover-floral-shirt', name: 'Undercover floral shirt', category: 'Shirts', section: 'Men', price: 1000, image: undercoverShirt, imageAlt: 'Dark shirt with a bold red and cream floral print', imagePosition: 'center', badge: 'New', sizes: 'S–XXL' },
]

export const sections = [
  { name: 'Men', tone: '#E5DAF8' },
  { name: 'Women', tone: '#FFD6D9' },
  { name: 'Kids', tone: '#FFE7A3' },
  { name: 'Accessories', tone: '#FBE1D6' },
]

export const categories = ['All pieces', 'New arrivals', 'Shirts', 'Tops', 'Dresses', 'Knitwear', 'Outerwear', 'Accessories']
