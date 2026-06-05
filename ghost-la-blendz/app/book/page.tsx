import Navigation from '@/components/Navigation'
import BookingForm from '@/components/BookingForm'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Book — Ghost LA Blendz',
  description: 'Book your appointment with Ghost LA Blendz. Any cut $30.',
}

export default function BookPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-3">
              Book
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-text-primary mb-2">
              Schedule Your Appointment
            </h1>
            <p className="text-sm text-stone-500 mt-3">
              Any Cut · $30 · Los Angeles
            </p>
          </div>

          <BookingForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
