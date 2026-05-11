import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blush py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <p className="font-serif text-lg text-plum mb-2">Jenny&apos;s Sugar Shack</p>
          <p className="text-sm text-plum/40 max-w-xs leading-relaxed">Handcrafted sweets made to order. Pickup available — local delivery on select dates.</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="section-label mb-1">Get in touch</p>
          <a href="mailto:hello@jennysugarshack.com" className="text-sm text-plum/60 hover:text-plum transition-colors">hello@jennysugarshack.com</a>
          <a href="https://instagram.com/jennysugarshack" target="_blank" rel="noopener noreferrer" className="text-sm text-plum/60 hover:text-pink-600 transition-colors">@jennysugarshack on Instagram</a>
          <a href="https://facebook.com/jennysugarshack" target="_blank" rel="noopener noreferrer" className="text-sm text-plum/60 hover:text-sky-500 transition-colors">Facebook Page</a>
        </div>
        <div className="flex flex-col gap-2">
          <p className="section-label mb-1">Quick links</p>
          {[{href:"#menu",label:"Menu"},{href:"#about",label:"About"},{href:"#gallery",label:"Gallery"},{href:"/order",label:"Custom Orders"}].map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-plum/60 hover:text-plum transition-colors">{l.label}</Link>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-blush">
        <p className="text-xs text-plum/30">© {new Date().getFullYear()} Jenny&apos;s Sugar Shack. All rights reserved.</p>
      </div>
    </footer>
  );
}
