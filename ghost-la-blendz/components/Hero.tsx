import Image from 'next/image'
import Link from 'next/link'

const INSTAGRAM_URL = 'https://instagram.com/ghostlablendz'

export default function Hero() {
  return (
    <section className="min-h-screen pt-16 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="order-2 lg:order-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-6">
              Los Angeles
            </p>

            <h1 className="font-serif text-[clamp(4rem,10vw,7rem)] leading-[0.92] tracking-tight text-text-primary mb-8">
              Ghost LA<br />Blendz
            </h1>

            <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-12">
              Any Cut&nbsp;&nbsp;·&nbsp;&nbsp;$30
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center px-7 py-3.5 bg-text-primary text-background text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors"
              >
                Book Appointment
              </Link>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-7 py-3.5 border border-border text-[10px] tracking-[0.2em] uppercase font-medium text-stone-600 hover:border-stone-400 hover:text-text-primary transition-colors"
              >
                Instagram
              </a>
            </div>

            <p className="mt-12 text-[11px] tracking-[0.15em] uppercase text-stone-400 font-light italic">
              Clean.&nbsp; Consistent.&nbsp; Precision.
            </p>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden bg-stone-100">
              <Image
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=900&q=85&auto=format&fit=crop"
                alt="Ghost LA Blendz — Premium Fade"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center pb-8">
        <div className="flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-8 bg-text-primary" />
          <span className="text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        </div>
      </div>
    </section>
  )
}
