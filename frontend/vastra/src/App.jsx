import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import GroupCart from './pages/GroupCart'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { CartProvider } from './context/CartContext'
import { GroupCartProvider } from './context/GroupCartContext'
import { CatalogProvider } from './context/CatalogContext'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CatalogProvider>
          <GroupCartProvider>
            <div className="min-h-screen bg-white text-black font-sans">
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-10">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/group-cart" element={<GroupCart />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
            </div>
          </GroupCartProvider>
        </CatalogProvider>
      </CartProvider>
    </AuthProvider>
  )
}