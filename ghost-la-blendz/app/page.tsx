import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Portfolio from '@/components/Portfolio'
import Services from '@/components/Services'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Portfolio />
        <Services />

        {/* CTA strip */}
        <section className="py-20 md:py-28 border-t border-border bg-text-primary">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-4">
              Los Angeles
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-background mb-3">
              Any Cut
            </h2>
            <p className="font-serif text-5xl md:text-7xl text-stone-600 mb-10">
              $30
            </p>
            <Link
              href="/book"
              className="inline-flex items-center px-8 py-4 bg-background text-text-primary text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-stone-100 transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
