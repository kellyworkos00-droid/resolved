'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide header on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white/75 dark:bg-gray-900/75 backdrop-blur border-b border-white/70 dark:border-gray-800/70 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10">
              <Image
                src="/images/elegant-logo.jpg"
                alt="Elegant Steel Logo"
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-gray-900 dark:text-white">Elegant Steel</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">ERP Suite</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/reconcile" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 transition-colors">
              Reconcile
            </Link>
            <Link href="/dashboard/pos" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 transition-colors">
              POS
            </Link>
          </nav>

          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-white/80 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 bg-white/50 dark:bg-gray-800/50 rounded-lg mt-2">
            <Link href="/dashboard" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/reconcile" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors">
              Reconcile
            </Link>
            <Link href="/dashboard/pos" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors">
              POS
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
