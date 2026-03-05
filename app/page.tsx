'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Settings, Package, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      // If logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // Show options for shop or login
      setTimeout(() => setShowOptions(true), 500);
    }
  }, [router]);

  if (!showOptions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Package className="w-12 h-12 text-green-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Elegante
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Welcome! Choose how you'd like to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shop Portal */}
          <Link
            href="/shop"
            className="group bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-12 text-white">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <h2 className="text-3xl font-bold mb-2">Shop Now</h2>
              <p className="text-green-100">Browse products and order via WhatsApp</p>
            </div>
            <div className="p-8">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Browse our product catalog</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Order directly via WhatsApp</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Fast & convenient checkout</span>
                </li>
              </ul>
              <div className="flex items-center justify-end text-green-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                <span>Visit Shop</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Admin Dashboard */}
          <Link
            href="/login"
            className="group bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-white">
              <Settings className="w-16 h-16 mb-4" />
              <h2 className="text-3xl font-bold mb-2">Admin Portal</h2>
              <p className="text-blue-100">Manage your business operations</p>
            </div>
            <div className="p-8">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Inventory management</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Financial reports</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Customer management</span>
                </li>
              </ul>
              <div className="flex items-center justify-end text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                <span>Staff Login</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Elegante. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
