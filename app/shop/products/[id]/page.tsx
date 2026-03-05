'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, MessageCircle, ShoppingCart, ArrowLeft, Heart, Share2, Star, Check, Truck, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  imageUrl?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderQuantity, setOrderQuantity] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.data);
      } else {
        toast.error('Product not found');
        router.push('/shop/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const message = encodeURIComponent(
      `Hi! I would like to order:\n\n` +
      `Product: ${product.name}\n` +
      `SKU: ${product.sku}\n` +
      `Quantity: ${orderQuantity} ${product.unit}\n` +
      `Unit Price: KES ${product.price.toLocaleString()}\n` +
      `Total: KES ${(product.price * orderQuantity).toLocaleString()}\n\n` +
      `Please confirm availability and provide delivery information.`
    );
    
    window.open(`https://wa.me/254700000000?text=${message}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} - KES ${product.price.toLocaleString()}`,
        url: window.location.href,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      });
    } else if (product) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isInStock = product.quantity > 0;
  const isLowStock = product.quantity <= product.reorderLevel && product.quantity > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header/Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-600" />
              <Link href="/shop" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Elegante Shop
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/shop/cart" className="relative p-2 text-gray-700 hover:text-green-600 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/shop" className="hover:text-green-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop/products" className="hover:text-green-600 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all mb-6 text-gray-700 hover:text-green-600"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative h-96 lg:h-[600px] bg-gradient-to-br from-gray-100 to-gray-200">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-32 h-32 text-gray-300" />
                </div>
              )}
              {isLowStock && (
                <div className="absolute top-6 right-6 bg-yellow-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  Low Stock
                </div>
              )}
              {!isInStock && (
                <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            {product.category && (
              <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                {product.category}
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* SKU */}
            <p className="text-gray-600">SKU: <span className="font-semibold">{product.sku}</span></p>

            {/* Price */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="text-sm text-gray-600 mb-1">Price per {product.unit}</div>
              <div className="text-5xl font-bold text-green-600">
                KES {product.price.toLocaleString()}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                isInStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isInStock ? <Check className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                {isInStock ? `${product.quantity} ${product.unit} Available` : 'Out of Stock'}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-xl mb-3 text-gray-900">Product Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'High-quality product available for immediate order. Contact us via WhatsApp for more details and to place your order.'}
              </p>
            </div>

            {/* Quantity Selector */}
            {isInStock && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Select Quantity</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.min(product.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                  <button
                    onClick={() => setOrderQuantity(Math.min(product.quantity, orderQuantity + 1))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                  <div className="ml-4">
                    <div className="text-sm text-gray-600">Total Price</div>
                    <div className="text-2xl font-bold text-green-600">
                      KES {(product.price * orderQuantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleWhatsAppOrder}
                disabled={!isInStock}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Order via WhatsApp
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShare}
                  className="py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button className="py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Save
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Fast Delivery</div>
                  <div className="text-xs text-gray-600">2-3 Days</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Secure Payment</div>
                  <div className="text-xs text-gray-600">100% Safe</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm">24/7 Support</div>
                  <div className="text-xs text-gray-600">Always Here</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Tabs */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-gray-900">Product Details</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-semibold">Product Code:</span> {product.sku}</li>
                <li><span className="font-semibold">Category:</span> {product.category || 'General'}</li>
                <li><span className="font-semibold">Unit:</span> {product.unit}</li>
                <li><span className="font-semibold">Stock Status:</span> {isInStock ? 'Available' : 'Out of Stock'}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4 text-gray-900">Why Order via WhatsApp?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Instant confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Direct communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Flexible payment options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Real-time order tracking</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-4 text-gray-900">Customer Service</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Easy returns within 7 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Quality guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Free delivery over KES 5,000</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Secure packaging</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
