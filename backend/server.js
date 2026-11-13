import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDirectory = dirname(fileURLToPath(import.meta.url))
const dataFile = resolve(process.env.GROUP_CART_DATA_FILE || `${backendDirectory}/data/groups.json`)
const ordersFile = resolve(process.env.ORDER_DATA_FILE || `${backendDirectory}/data/orders.json`)
const productsFile = resolve(process.env.PRODUCT_DATA_FILE || `${backendDirectory}/data/products.json`)
const port = Number(process.env.PORT || 5000)
const orderCatalog = new Map([
  ['shoreline-knit-polo', { name: 'Shoreline knit polo', category: 'Tops', section: 'Women', price: 2790, sizes: ['S', 'M', 'L', 'XL'], image: '' }],
  ['cocoa-ruched-dress', { name: 'Cocoa ruched dress', category: 'Dresses', section: 'Women', price: 1890, sizes: ['S', 'M', 'L', 'XL'], image: '' }],
  ['blue-meadow-blouse', { name: 'Blue meadow blouse', category: 'Tops', section: 'Women', price: 2490, sizes: ['S', 'M', 'L', 'XL'], image: '' }],
  ['starlight-patchwork-shirt', { name: 'Starlight patchwork shirt', category: 'Shirts', section: 'Men', price: 2290, sizes: ['S', 'M', 'L', 'XL', 'XXL'], image: '' }],
  ['retro-sunshine-shirt', { name: 'Retro sunshine shirt', category: 'Shirts', section: 'Men', price: 2190, sizes: ['S', 'M', 'L', 'XL', 'XXL'], image: '' }],
  ['cat-collar-shirt', { name: 'Cat collar shirt', category: 'Shirts', section: 'Kids', price: 1990, sizes: ['S', 'M', 'L', 'XL'], image: '' }],
  ['pink-prep-layered-set', { name: 'Pink prep layered set', category: 'Outerwear', section: 'Women', price: 3290, sizes: ['S', 'M', 'L', 'XL'], image: '' }],
  ['cloud-garden-knit-vest', { name: 'Cloud garden knit vest', category: 'Knitwear', section: 'Kids', price: 1690, sizes: ['S', 'M', 'L'], image: '' }],
  ['sunbeam-earmuff-hat', { name: 'Sunbeam earmuff hat', category: 'Accessories', section: 'Accessories', price: 990, sizes: [''], image: '' }],
  ['kyoto-mesh-jersey', { name: 'Kyoto mesh jersey', category: 'Shirts', section: 'Men', price: 1000, sizes: ['S', 'M', 'L', 'XL', 'XXL'], image: '' }],
  ['undercover-floral-shirt', { name: 'Undercover floral shirt', category: 'Shirts', section: 'Men', price: 1000, sizes: ['S', 'M', 'L', 'XL', 'XXL'], image: '' }],
])
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

let store = { groups: [] }
let writeQueue = Promise.resolve()
let orders = []
let orderWriteQueue = Promise.resolve()
let addedProducts = []
let removedProductIds = []
let productWriteQueue = Promise.resolve()

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function cleanText(value, label, maxLength, { required = false } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, `${label} must be text`)
  const cleaned = value.trim()
  if (required && !cleaned) throw new HttpError(400, `${label} is required`)
  if (cleaned.length > maxLength) throw new HttpError(400, `${label} must be ${maxLength} characters or fewer`)
  return cleaned
}

function getGroup(code) {
  const normalized = cleanText(code, 'Invite code', 32, { required: true }).toUpperCase()
  const group = store.groups.find((item) => item.inviteCode === normalized)
  if (!group) throw new HttpError(404, 'No group found for that invite code')
  return group
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 32_000) throw new HttpError(413, 'Request body is too large')
  }
  try {
    const parsed = body ? JSON.parse(body) : {}
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HttpError(400, 'Request body must be a JSON object')
    }
    return parsed
  } catch {
    throw new HttpError(400, 'Request body must be a valid JSON object')
  }
}

function send(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (allowedOrigins.has(origin) || allowedOrigins.has('*')) return true

  try {
    const hostname = new URL(origin).hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true
    if (hostname.endsWith('.vercel.app')) return true
  } catch {
    return false
  }

  return false
}

async function persistStore() {
  const contents = JSON.stringify(store, null, 2)
  const temporaryFile = `${dataFile}.tmp`
  writeQueue = writeQueue.catch(() => undefined)
    .then(async () => {
      await mkdir(dirname(dataFile), { recursive: true })
      await writeFile(temporaryFile, contents, 'utf8')
      await rename(temporaryFile, dataFile)
    })
  await writeQueue
}

async function persistOrders() {
  const contents = JSON.stringify(orders, null, 2)
  const temporaryFile = `${ordersFile}.tmp`
  orderWriteQueue = orderWriteQueue.catch(() => undefined)
    .then(async () => {
      await mkdir(dirname(ordersFile), { recursive: true })
      await writeFile(temporaryFile, contents, 'utf8')
      await rename(temporaryFile, ordersFile)
    })
  await orderWriteQueue
}

async function persistProducts() {
  const contents = JSON.stringify({ addedProducts, removedProductIds }, null, 2)
  const temporaryFile = `${productsFile}.tmp`
  productWriteQueue = productWriteQueue.catch(() => undefined)
    .then(async () => {
      await mkdir(dirname(productsFile), { recursive: true })
      await writeFile(temporaryFile, contents, 'utf8')
      await rename(temporaryFile, productsFile)
    })
  await productWriteQueue
}

function adminTokenFor(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function isAdminRequest(request) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new HttpError(503, 'Admin authentication is not configured')

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return false
  const expected = createHmac('sha256', secret).update(encoded).digest()
  let actual
  try {
    actual = Buffer.from(signature, 'base64url')
  } catch {
    return false
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    return payload.role === 'admin' && payload.expiresAt > Date.now()
  } catch {
    return false
  }
}

function requireAdmin(request) {
  if (!isAdminRequest(request)) throw new HttpError(401, 'Admin session is missing or expired')
}

function cleanOrder(body) {
  if (!body.customer || typeof body.customer !== 'object' || Array.isArray(body.customer)) {
    throw new HttpError(400, 'Customer details are required')
  }
  if (!body.address || typeof body.address !== 'object' || Array.isArray(body.address)) {
    throw new HttpError(400, 'Delivery address is required')
  }
  if (body.paymentMethod !== 'cod') {
    throw new HttpError(400, 'Only cash on delivery is currently available')
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    throw new HttpError(400, 'The order must contain between 1 and 50 items')
  }

  const customer = {
    name: cleanText(body.customer.name, 'Name', 80, { required: true }),
    email: cleanText(body.customer.email, 'Email', 160, { required: true }),
    phone: cleanText(body.customer.phone, 'Phone number', 10, { required: true }),
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new HttpError(400, 'Enter a valid email address')
  }
  if (!/^[6-9]\d{9}$/.test(customer.phone)) {
    throw new HttpError(400, 'Enter a valid 10-digit Indian mobile number')
  }

  const address = {
    line1: cleanText(body.address.line1, 'Address', 160, { required: true }),
    line2: cleanText(body.address.line2 || '', 'Address line 2', 160),
    city: cleanText(body.address.city, 'City', 80, { required: true }),
    state: cleanText(body.address.state, 'State', 80, { required: true }),
    postalCode: cleanText(body.address.postalCode, 'PIN code', 6, { required: true }),
    instructions: cleanText(body.address.instructions || '', 'Delivery instructions', 200),
  }
  if (!/^\d{6}$/.test(address.postalCode)) throw new HttpError(400, 'Enter a valid 6-digit PIN code')

  const items = body.items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpError(400, 'Order item is invalid')
    }
    const id = cleanText(item.id, 'Product id', 100, { required: true })
    const product = orderCatalog.get(id)
    if (!product) throw new HttpError(400, `Product ${id} is not available for checkout`)
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new HttpError(400, 'Each item quantity must be between 1 and 20')
    }
    const size = cleanText(item.size || '', 'Size', 10)
    if (!product.sizes.includes(size)) throw new HttpError(400, `The selected size is not available for ${product.name}`)
    return { id, name: product.name, price: product.price, quantity: item.quantity, size }
  })

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const createdAt = new Date().toISOString()
  return {
    id: randomUUID(),
    createdAt,
    status: 'pending',
    statusUpdatedAt: createdAt,
    paymentMethod: 'cod',
    paymentStatus: 'due',
    customer,
    address,
    items,
    subtotal: total,
    total,
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function orderMessage(order) {
  const lines = order.items.map((item) =>
    `- ${item.name}${item.size ? ` (size ${item.size})` : ''} x ${item.quantity}: ${formatCurrency(item.price * item.quantity)}`,
  )
  return [
    `Hi ${order.customer.name},`,
    '',
    `Your Vastra order ${order.id} is confirmed.`,
    ...lines,
    '',
    `Total due on delivery: ${formatCurrency(order.total)}`,
    'Payment method: Cash on delivery',
    '',
    'Thank you for shopping with Vastra.',
  ].join('\n')
}

function notificationSettings(channel) {
  if (channel === 'email') {
    const { RESEND_API_KEY: apiKey, RESEND_FROM_EMAIL: from } = process.env
    return apiKey && from ? { apiKey, from } : null
  }
  const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken, TWILIO_FROM_NUMBER: from } = process.env
  return accountSid && authToken && from ? { accountSid, authToken, from } : null
}

async function sendOrderEmail(order, message) {
  const settings = notificationSettings('email')
  if (!settings) return { status: 'not_configured' }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: settings.from,
      to: [order.customer.email],
      subject: `Vastra order ${order.id} confirmed`,
      text: message,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    console.warn(`Order email failed for ${order.id}: Resend returned HTTP ${response.status}`)
    return { status: 'failed' }
  }
  return { status: 'sent' }
}

async function sendOrderSms(order, message) {
  const settings = notificationSettings('sms')
  if (!settings) return { status: 'not_configured' }

  const form = new URLSearchParams({
    To: `+91${order.customer.phone}`,
    From: settings.from,
    Body: message,
  })
  const authorization = Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString('base64')
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(settings.accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    },
  )
  if (!response.ok) {
    console.warn(`Order SMS failed for ${order.id}: Twilio returned HTTP ${response.status}`)
    return { status: 'failed' }
  }
  return { status: 'sent' }
}

async function sendOrderNotifications(order) {
  const message = orderMessage(order)
  const [email, sms] = await Promise.allSettled([
    sendOrderEmail(order, message),
    sendOrderSms(order, message),
  ])
  if (email.status === 'rejected') console.warn(`Order email request failed for ${order.id}`)
  if (sms.status === 'rejected') console.warn(`Order SMS request failed for ${order.id}`)
  return {
    email: email.status === 'fulfilled' ? email.value.status : 'failed',
    sms: sms.status === 'fulfilled' ? sms.value.status : 'failed',
  }
}

function makeInviteCode() {
  let code
  do {
    code = randomBytes(9).toString('base64url').slice(0, 12).toUpperCase()
  } while (store.groups.some((group) => group.inviteCode === code))
  return code
}

function cleanProduct(product) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) {
    throw new HttpError(400, 'Product details are required')
  }

  const price = Number(product.price)
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'Product price is invalid')

  return {
    id: cleanText(product.id, 'Product id', 100, { required: true }),
    name: cleanText(product.name, 'Product name', 160, { required: true }),
    category: cleanText(product.category || '', 'Category', 80),
    section: cleanText(product.section || '', 'Section', 80),
    price,
    image: cleanText(product.image || '', 'Product image', 500),
    imageAlt: cleanText(product.imageAlt || '', 'Image description', 240),
    imagePosition: cleanText(product.imagePosition || 'center', 'Image position', 80),
    badge: cleanText(product.badge || '', 'Badge', 80),
    sizes: cleanText(product.sizes || '', 'Sizes', 80),
  }
}

function productForAdmin(id, product) {
  return {
    id,
    name: product.name,
    category: product.category || '',
    section: product.section || '',
    price: product.price,
    sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
    image: product.image || '',
    imageAlt: product.imageAlt || product.name,
    imagePosition: product.imagePosition || 'center',
    badge: product.badge || '',
  }
}

function publicProducts() {
  return {
    removedIds: removedProductIds,
    addedProducts: addedProducts.filter((product) => !removedProductIds.includes(product.id)),
  }
}

function parseProductSizes(sizes) {
  const rawSizes = String(sizes).trim()
  if (rawSizes.toLowerCase() === 'one size') return ['']
  if (rawSizes.includes(',')) return rawSizes.split(',').map((size) => size.trim()).filter(Boolean)

  const range = rawSizes.toUpperCase().replace(/[–—−]/g, '-').split('-').map((size) => size.trim())
  if (range) {
    const scale = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const start = scale.indexOf(range[0])
    const end = scale.indexOf(range[1])
    if (range.length === 2 && start !== -1 && end >= start) return scale.slice(start, end + 1)
  }
  return rawSizes ? [rawSizes] : []
}

async function loadProducts() {
  try {
    const parsed = JSON.parse(await readFile(productsFile, 'utf8'))
    if (!parsed || !Array.isArray(parsed.addedProducts) || !Array.isArray(parsed.removedProductIds)) {
      throw new Error('Product data has an invalid format')
    }
    addedProducts = parsed.addedProducts
    removedProductIds = parsed.removedProductIds
    for (const product of addedProducts) {
      orderCatalog.set(product.id, { ...product, sizes: parseProductSizes(product.sizes) })
    }
    for (const id of removedProductIds) orderCatalog.delete(id)
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
}

async function handle(request, response) {
  const origin = request.headers.origin
  if (origin && !isAllowedOrigin(origin)) {
    throw new HttpError(403, `Origin ${origin} is not allowed. Add it to CORS_ORIGINS and restart the API.`)
  }
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/api' || url.pathname === '/api/health')) {
    send(response, 200, { status: 'ok', service: 'Vastra API' })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/login') {
    const body = await readJson(request)
    const email = cleanText(body.email, 'Email', 160, { required: true }).toLowerCase()
    const password = cleanText(body.password, 'Password', 200, { required: true })
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const configuredPassword = process.env.ADMIN_PASSWORD
    const secret = process.env.ADMIN_SESSION_SECRET
    if (!configuredEmail || !configuredPassword || !secret) {
      throw new HttpError(503, 'Admin login is not configured on the server')
    }
    if (configuredPassword.length < 12 || secret.length < 32) {
      throw new HttpError(503, 'Admin password must be at least 12 characters and session secret at least 32 characters')
    }
    const emailMatches = Buffer.from(email).length === Buffer.from(configuredEmail).length
      && timingSafeEqual(Buffer.from(email), Buffer.from(configuredEmail))
    const passwordMatches = Buffer.from(password).length === Buffer.from(configuredPassword).length
      && timingSafeEqual(Buffer.from(password), Buffer.from(configuredPassword))
    if (!emailMatches || !passwordMatches) throw new HttpError(401, 'Email or password is incorrect')

    send(response, 200, {
      token: adminTokenFor({ role: 'admin', expiresAt: Date.now() + 8 * 60 * 60 * 1000 }, secret),
      expiresIn: 8 * 60 * 60,
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/catalog') {
    send(response, 200, publicProducts())
    return
  }

  if (url.pathname.startsWith('/api/admin/')) {
    requireAdmin(request)

    if (request.method === 'GET' && url.pathname === '/api/admin/products') {
      const base = [...orderCatalog.entries()]
        .filter(([id]) => !addedProducts.some((product) => product.id === id))
        .map(([id, product]) => productForAdmin(id, product))
      send(response, 200, { products: [...base, ...addedProducts] })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/products') {
      const body = await readJson(request)
      const name = cleanText(body.name, 'Product name', 160, { required: true })
      const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const id = `${slug || 'product'}-${randomBytes(3).toString('hex')}`
      const product = cleanProduct({ ...body, id, name })
      if (!product.category || !product.section || !product.sizes) {
        throw new HttpError(400, 'Category, collection, and available sizes are required')
      }
      if (product.image) {
        let imageUrl
        try {
          imageUrl = new URL(product.image)
        } catch {
          throw new HttpError(400, 'Product image must be a valid HTTP or HTTPS URL')
        }
        if (!['http:', 'https:'].includes(imageUrl.protocol) || imageUrl.username || imageUrl.password) {
          throw new HttpError(400, 'Product image must be a valid HTTP or HTTPS URL')
        }
      }
      if (product.price <= 0 || product.price > 1_000_000) {
        throw new HttpError(400, 'Product price must be greater than 0 and no more than 1000000')
      }
      product.sizes = product.sizes.split(',').map((size) => size.trim()).filter(Boolean).join(', ')
      if (!product.sizes) throw new HttpError(400, 'At least one available size is required')

      addedProducts.unshift(product)
      orderCatalog.set(id, { ...product, sizes: parseProductSizes(product.sizes) })
      await persistProducts()
      send(response, 201, { product })
      return
    }

    const productRoute = url.pathname.match(/^\/api\/admin\/products\/([^/]+)$/)
    if (request.method === 'DELETE' && productRoute) {
      const id = decodeURIComponent(productRoute[1])
      if (!orderCatalog.has(id)) throw new HttpError(404, 'Product not found')
      if (!removedProductIds.includes(id)) removedProductIds.push(id)
      orderCatalog.delete(id)
      addedProducts = addedProducts.filter((product) => product.id !== id)
      await persistProducts()
      send(response, 200, { status: 'deleted', id })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/orders') {
      send(response, 200, { orders })
      return
    }

    const orderRoute = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/(status|payment)$/)
    if (request.method === 'PATCH' && orderRoute) {
      const orderId = decodeURIComponent(orderRoute[1])
      const order = orders.find((item) => item.id === orderId)
      if (!order) throw new HttpError(404, 'Order not found')
      const body = await readJson(request)

      if (orderRoute[2] === 'status') {
        const status = cleanText(body.status, 'Order status', 20, { required: true })
        if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
          throw new HttpError(400, 'Order status must be pending, processing, shipped, delivered, or cancelled')
        }
        order.status = status
        order.statusUpdatedAt = new Date().toISOString()
      } else {
        const paymentStatus = cleanText(body.paymentStatus, 'Payment status', 20, { required: true })
        if (!['due', 'paid'].includes(paymentStatus)) {
          throw new HttpError(400, 'Payment status must be due or paid')
        }
        order.paymentStatus = paymentStatus
        order.paymentUpdatedAt = new Date().toISOString()
      }

      await persistOrders()
      send(response, 200, { order })
      return
    }

    throw new HttpError(404, 'Admin route not found')
  }

  if (request.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readJson(request)
    const order = cleanOrder(body)
    orders.unshift(order)
    await persistOrders()
    const notifications = await sendOrderNotifications(order)
    send(response, 201, {
      order: {
        id: order.id,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        total: order.total,
        customer: order.customer,
      },
      notifications,
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/orders/track') {
    const body = await readJson(request)
    const id = cleanText(body.id, 'Order number', 36, { required: true }).toLowerCase()
    const phone = cleanText(body.phone, 'Phone number', 10, { required: true })
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new HttpError(400, 'Enter a valid 10-digit Indian mobile number')
    }

    const order = orders.find(
      (item) => item.id.toLowerCase() === id && item.customer.phone === phone,
    )
    if (!order) throw new HttpError(404, "We couldn't find an order matching those details.")

    send(response, 200, {
      order: {
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        statusUpdatedAt: order.statusUpdatedAt || order.createdAt,
        paymentMethod: order.paymentMethod,
        total: order.total,
        items: order.items,
      },
    })
    return
  }

  const orderStatusRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/status$/)
  if (request.method === 'PATCH' && orderStatusRoute) {
    const adminToken = process.env.ORDER_STATUS_ADMIN_TOKEN
    if (!adminToken) throw new HttpError(503, 'Order status updates are not configured')

    const providedToken = request.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
    const expected = Buffer.from(adminToken)
    const provided = Buffer.from(providedToken)
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new HttpError(401, 'Order status update is not authorized')
    }

    const orderId = decodeURIComponent(orderStatusRoute[1])
    const order = orders.find((item) => item.id === orderId)
    if (!order) throw new HttpError(404, 'Order not found')

    const body = await readJson(request)
    const status = cleanText(body.status, 'Order status', 20, { required: true })
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      throw new HttpError(400, 'Order status must be pending, processing, shipped, delivered, or cancelled')
    }

    order.status = status
    order.statusUpdatedAt = new Date().toISOString()
    await persistOrders()
    send(response, 200, { order: { id: order.id, status: order.status, statusUpdatedAt: order.statusUpdatedAt } })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/groups') {
    const body = await readJson(request)
    const group = {
      id: randomUUID(),
      name: cleanText(body.name || 'Friends group', 'Group name', 60, { required: true }),
      inviteCode: makeInviteCode(),
      createdAt: new Date().toISOString(),
      members: [{
        id: randomUUID(),
        name: cleanText(body.memberName, 'Your name', 40, { required: true }),
      }],
      items: [],
    }
    store.groups.push(group)
    await persistStore()
    send(response, 201, { group })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/groups/join') {
    const body = await readJson(request)
    const group = getGroup(body.inviteCode)
    group.members.push({
      id: randomUUID(),
      name: cleanText(body.memberName, 'Your name', 40, { required: true }),
    })
    await persistStore()
    send(response, 200, { group })
    return
  }

  const groupRoute = url.pathname.match(/^\/api\/groups\/([^/]+)(?:\/items(?:\/([^/]+))?)?$/)
  if (!groupRoute) throw new HttpError(404, 'Route not found')
  const group = getGroup(decodeURIComponent(groupRoute[1]))
  const itemId = groupRoute[2] ? decodeURIComponent(groupRoute[2]) : null

  if (request.method === 'GET' && !itemId && !url.pathname.endsWith('/items')) {
    send(response, 200, { group })
    return
  }

  if (request.method === 'POST' && url.pathname.endsWith('/items')) {
    const body = await readJson(request)
    const status = body.status || 'like'
    if (!['like', 'bought'].includes(status)) throw new HttpError(400, 'Status must be like or bought')
    const item = {
      ...cleanProduct(body.product),
      entryId: randomUUID(),
      sharedBy: cleanText(body.sharedBy || 'You', 'Your name', 40, { required: true }),
      status,
      note: cleanText(body.note || '', 'Note', 180),
      sharedAt: new Date().toISOString(),
    }
    group.items.unshift(item)
    await persistStore()
    send(response, 201, { item })
    return
  }

  if (itemId && request.method === 'PATCH') {
    const body = await readJson(request)
    if (!['like', 'bought'].includes(body.status)) throw new HttpError(400, 'Status must be like or bought')
    const item = group.items.find((candidate) => candidate.entryId === itemId)
    if (!item) throw new HttpError(404, 'Group cart item not found')
    item.status = body.status
    await persistStore()
    send(response, 200, { item })
    return
  }

  if (itemId && request.method === 'DELETE') {
    const originalLength = group.items.length
    group.items = group.items.filter((item) => item.entryId !== itemId)
    if (group.items.length === originalLength) throw new HttpError(404, 'Group cart item not found')
    await persistStore()
    send(response, 200, { status: 'deleted' })
    return
  }

  throw new HttpError(404, 'Route not found')
}

async function loadStore() {
  try {
    const parsed = JSON.parse(await readFile(dataFile, 'utf8'))
    if (!parsed || !Array.isArray(parsed.groups)) throw new Error('Group data has an invalid format')
    store = parsed
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
}

async function loadOrders() {
  try {
    const parsed = JSON.parse(await readFile(ordersFile, 'utf8'))
    if (!Array.isArray(parsed)) throw new Error('Order data has an invalid format')
    orders = parsed
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
}

await loadStore()
await loadOrders()
await loadProducts()
createServer((request, response) => {
  handle(request, response).catch((error) => {
    const status = error instanceof HttpError ? error.status : 500
    if (status === 500) console.error(error)
    if (!response.headersSent) send(response, status, { error: status === 500 ? 'Internal server error' : error.message })
    else response.end()
  })
}).listen(port, () => {
  console.log(`Vastra Group Cart API listening on port ${port}`)
})
