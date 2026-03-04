'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Loader2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load remembered email if exists
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Store token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Remember email if checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden light">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className={`max-w-6xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Left Side - Logo & Brand */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8 text-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <Image
                  src="/images/elegant-logo.jpg"
                  alt="Kelly OS Logo"
                  width={200}
                  height={200}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-white drop-shadow-2xl">
                Kelly OS
              </h1>
              <p className="text-2xl text-blue-200 font-semibold">
                Enterprise Resource Planning
              </p>
              <div className="flex items-center justify-center gap-3 text-blue-100">
                <Shield className="w-6 h-6" />
                <span className="text-lg">Trusted by Leading Enterprises</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-white font-semibold">Secure</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-white font-semibold">Fast</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-white font-semibold">Reliable</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-white font-semibold">Modern</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/50">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-block mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25"></div>
                  <div className="relative bg-white rounded-2xl p-3 shadow-lg">
                    <Image
                      src="/images/elegant-logo.jpg"
                      alt="Kelly OS Logo"
                      width={80}
                      height={80}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Kelly OS
                </h1>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600 text-lg">Sign in to continue to your account</p>
              </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-5 py-4 rounded-xl text-base flex items-start gap-3 animate-shake">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Login Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label htmlFor="email" className="block text-base font-semibold text-gray-800">
                Email Address
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Mail className="h-6 w-6" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-base font-medium placeholder-gray-500"
                  placeholder="your.email@company.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="password" className="block text-base font-semibold text-gray-800">
                Password
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Lock className="h-6 w-6" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-14 pr-14 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-base font-medium placeholder-gray-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-3 text-base text-gray-700 group-hover:text-gray-900 transition-colors">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 mb-8 flex items-center">
            <div className="flex-1 border-t-2 border-gray-300"></div>
            <span className="px-4 text-sm text-gray-600 font-bold uppercase tracking-wider">Secure Access</span>
            <div className="flex-1 border-t-2 border-gray-300"></div>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-700 text-center flex items-center justify-center gap-2 font-semibold">
                <Lock className="w-5 h-5 text-blue-600" />
                256-bit Enterprise Encryption
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-gray-700 text-center flex items-center justify-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                All Systems Operational
              </p>
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <Link href="/PRIVACY_POLICY.md" className="hover:text-blue-600 transition-colors font-medium">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/TERMS_OF_SERVICE.md" className="hover:text-blue-600 transition-colors font-medium">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* Premium Footer with Sliding Logos */}
      <footer className="relative z-10 bg-white/10 backdrop-blur-xl border-t border-white/20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Trusted By Section */}
          <div className="text-center mb-6">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
              Trusted By & Integrated With
            </p>
          </div>

          {/* Sliding Logo Carousel */}
          <div className="relative overflow-hidden">
            <div className="flex items-center justify-center gap-12 animate-slide">
              {/* Kelly OS Logo */}
              <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-110 transition-transform duration-300">
                <div className="w-32 h-20 flex items-center justify-center">
                  <Image
                    src="/images/elegant-logo.jpg"
                    alt="Kelly OS"
                    width={80}
                    height={80}
                    className="rounded-lg object-contain"
                  />
                </div>
                <p className="text-center text-xs font-bold text-gray-700 mt-2">Kelly OS</p>
              </div>

              {/* M-Pesa Logo */}
              <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-110 transition-transform duration-300">
                <div className="w-32 h-20 flex items-center justify-center">
                  <div className="text-4xl font-bold text-green-600">M-PESA</div>
                </div>
                <p className="text-center text-xs font-bold text-gray-700 mt-2">Payment Partner</p>
              </div>

              {/* Equity Bank Logo */}
              <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-110 transition-transform duration-300">
                <div className="w-32 h-20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-700">EQUITY</div>
                    <div className="text-sm font-semibold text-gray-700">BANK</div>
                  </div>
                </div>
                <p className="text-center text-xs font-bold text-gray-700 mt-2">Banking Partner</p>
              </div>

              {/* Odoo Logo */}
              <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-110 transition-transform duration-300">
                <div className="w-32 h-20 flex items-center justify-center">
                  <div className="text-4xl font-bold text-purple-700">odoo</div>
                </div>
                <p className="text-center text-xs font-bold text-gray-700 mt-2">ERP Integration</p>
              </div>

              {/* WhatsApp Business */}
              <div className="flex-shrink-0 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/50 hover:scale-110 transition-transform duration-300">
                <div className="w-32 h-20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">WhatsApp</div>
                    <div className="text-sm font-semibold text-gray-700">Business</div>
                  </div>
                </div>
                <p className="text-center text-xs font-bold text-gray-700 mt-2">@kellyos</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>© 2026 Kelly OS - Enterprise ERP Solution. All rights reserved.</span>
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-slide {
          animation: slide 20s linear infinite;
        }
        .animate-slide:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
