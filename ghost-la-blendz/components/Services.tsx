import Link from 'next/link'

const INCLUDES = [
  'Fades',
  'Tapers',
  'Lineups',
  'Beard Touchups',
  'Basic Designs',
]

export default function Services() {
  return (
    <section id="services" className="py-24 md:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-stone-400 mb-3">
              Services
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-text-primary mb-2">
              Any Cut
            </h2>
            <p className="font-serif text-5xl md:text-6xl text-text-primary mb-10">
              $30
            </p>

            <p className="text-sm text-stone-500 leading-relaxed mb-10 max-w-sm">
              One price. No hidden fees. Walk in knowing exactly what you'll pay.
              Every client gets the same level of focus and precision.
            </p>

            <Link
              href="/book"
              className="inline-flex items-center px-7 py-3.5 bg-text-primary text-background text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-stone-800 transition-colors"
            >
              Book Now
            </Link>
          </div>

          {/* Right */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-6">
              Includes
            </p>
            <ul className="space-y-0">
              {INCLUDES.map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center justify-between py-4 ${
                    i < INCLUDES.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-text-primary tracking-wide">
                    {item}
                  </span>
                  <span className="text-[10px] text-stone-400 tracking-wider">Included</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-5 bg-white border border-border rounded-sm">
              <p className="text-[9px] tracking-[0.25em] uppercase text-stone-400 mb-2">
                Location
              </p>
              <p className="text-sm font-medium text-text-primary">Los Angeles, California</p>
              <p className="text-xs text-stone-500 mt-1">
                Address provided upon booking confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
