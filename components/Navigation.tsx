/**
 * DDream Navigation Component
 * Following Burnt Labs patterns
 */

"use client";

import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { truncateAddress } from "@/lib/contracts";
import { useState } from "react";

export function Navigation() {
  const { data: account } = useAbstraxionAccount();
  const [showModal, setShowModal] = useModal();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Games" },
    { href: "/staking", label: "Staking" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const copyAddress = async () => {
    if (account?.bech32Address) {
      await navigator.clipboard.writeText(account.bech32Address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl">🎮</span>
                <span className="ml-2 text-xl font-bold text-gray-800">DDream</span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-purple-100 text-purple-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop Wallet Connection */}
            <div className="hidden md:flex items-center space-x-3">
              {!account?.bech32Address ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    title={account.bech32Address}
                  >
                    <span>{truncateAddress(account.bech32Address)}</span>
                    <span className="text-xs">
                      {copied ? '✓' : '📋'}
                    </span>
                  </button>
                  {copied && (
                    <span className="text-xs text-green-600 font-medium">Copied!</span>
                  )}
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.href)
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="px-2 pb-3 border-t border-gray-200">
              {!account?.bech32Address ? (
                <button
                  onClick={() => {
                    setShowModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 px-3 py-2">
                    {truncateAddress(account.bech32Address)}
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}