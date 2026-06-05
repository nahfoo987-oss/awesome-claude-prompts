'use client'

import { useState } from 'react'
import Image from 'next/image'

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&q=85&auto=format&fit=crop',
    alt: 'Clean fade — Ghost LA Blendz',
  },
  {
    src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=700&q=85&auto=format&fit=crop',
    alt: 'Taper with lineup — Ghost LA Blendz',
  },
  {
    src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=700&q=85&auto=format&fit=crop',
    alt: 'Precision blend — Ghost LA Blendz',
  },
  {
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=700&q=85&auto=format&fit=crop',
    alt: 'Beard taper — Ghost LA Blendz',
  },
]

export default function Portfolio() {
  const [lightbox, setLightbox] = useState<number | null>(null)

  return (
    <section id="work" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <p className="text-[9px] tracking-[0.3em] uppercase text-stone-400 mb-3">
            Portfolio
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-text-primary">
            Latest Work
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {PHOTOS.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="group relative w-full aspect-[4/3] overflow-hidden bg-stone-100 rounded-sm focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2"
              aria-label={`View photo: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/60 hover:text-white text-2xl font-light w-10 h-10 flex items-center justify-center"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            ×
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white w-10 h-10 flex items-center justify-center text-2xl"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + PHOTOS.length) % PHOTOS.length) }}
            aria-label="Previous"
          >
            ‹
          </button>

          <div
            className="relative max-w-3xl w-full aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={PHOTOS[lightbox].src.replace('w=700', 'w=1200')}
              alt={PHOTOS[lightbox].alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white w-10 h-10 flex items-center justify-center text-2xl"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % PHOTOS.length) }}
            aria-label="Next"
          >
            ›
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {PHOTOS.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightbox(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === lightbox ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
