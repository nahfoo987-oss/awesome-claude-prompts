import Link from 'next/link'

const INSTAGRAM_URL = 'https://instagram.com/ghostlablendz'

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase font-medium text-text-primary mb-1">
              Ghost LA Blendz
            </p>
            <p className="text-[11px] text-stone-400 tracking-wider">
              Los Angeles, California
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <Link
              href="/book"
              className="text-[10px] tracking-[0.18em] uppercase text-stone-500 hover:text-text-primary transition-colors"
            >
              Book
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.18em] uppercase text-stone-500 hover:text-text-primary transition-colors"
            >
              Instagram
            </a>
            <Link
              href="/admin"
              className="text-[10px] tracking-[0.18em] uppercase text-stone-400 hover:text-stone-600 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-[10px] text-stone-400 tracking-wider italic">
            Clean. Consistent. Precision.
          </p>
          <p className="text-[10px] text-stone-400">
            © {new Date().getFullYear()} Ghost LA Blendz
          </p>
        </div>
      </div>
    </footer>
  )
}
