'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const INSTAGRAM_URL = 'https://instagram.com/ghostlablendz'

export default function Navigation() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'WORK', href: '/#work' },
    { label: 'SERVICES', href: '/#services' },
    { label: 'BOOK', href: '/book' },
    { label: 'INSTAGRAM', href: INSTAGRAM_URL, external: true },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-text-primary hover:opacity-60 transition-opacity"
        >
          Ghost LA Blendz
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.18em] font-medium uppercase text-stone-500 hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[10px] tracking-[0.18em] font-medium uppercase transition-colors ${
                  link.label === 'BOOK'
                    ? 'text-text-primary border-b border-text-primary pb-px hover:opacity-60'
                    : 'text-stone-500 hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-current transition-all duration-200 ${open ? 'rotate-45 translate-y-[6px]' : ''}`}
          />
          <span
            className={`block w-5 h-px bg-current transition-all duration-200 ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-5 h-px bg-current transition-all duration-200 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="bg-background border-t border-border px-6 py-4 flex flex-col gap-5">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="text-[10px] tracking-[0.2em] font-medium uppercase text-stone-500"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[10px] tracking-[0.2em] font-medium uppercase text-text-primary"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
