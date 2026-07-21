import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight, Globe, MapPin, Phone, Mail } from "lucide-react";
import { FaFacebook, FaXTwitter, FaLinkedin, FaInstagram } from "react-icons/fa6";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-slate-300 border-t border-zinc-900">
      <div className="container mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="relative w-16 h-12 flex-shrink-0 grayscale brightness-200 opacity-80">
                <Image 
                  src="/web-app-manifest-512x512.png" 
                  alt="Antique Oven Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-widest uppercase text-white leading-none">
                  Antique Oven
                </span>
                <span className="text-[9px] font-bold text-bakery-gold uppercase tracking-[0.2em] mt-1">
                  The Bakery Master
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              Excellence in Enterprise Baking. Unifying high-capacity manufacturing, precise financial controls, and dynamic retail distribution across Tanzania.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-stone-500 hover:text-bakery-gold transition-colors"><FaLinkedin className="w-5 h-5" /></a>
              <a href="#" className="text-stone-500 hover:text-bakery-gold transition-colors"><FaXTwitter className="w-5 h-5" /></a>
              <a href="#" className="text-stone-500 hover:text-bakery-gold transition-colors"><FaFacebook className="w-5 h-5" /></a>
              <a href="#" className="text-stone-500 hover:text-bakery-gold transition-colors"><FaInstagram className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-white">Company</h3>
            <ul className="flex flex-col gap-4 text-sm text-stone-400">
              <li><Link href="about" className="hover:text-bakery-gold transition-colors">About Us</Link></li>
              <li><Link href="infrastructure" className="hover:text-bakery-gold transition-colors">Infrastructure</Link></li>
              <li><Link href="careers" className="hover:text-bakery-gold transition-colors">Careers</Link></li>
              <li><Link href="contact" className="hover:text-bakery-gold transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Portals & Services */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-white">Operations</h3>
            <ul className="flex flex-col gap-4 text-sm text-stone-400">
              <li>
                <Link href="/login" className="group flex items-center gap-2 hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3 text-bakery-gold transition-transform group-hover:translate-x-1" /> Staff Portal Login
                </Link>
              </li>
              <li>
                <Link href="manufacturing" className="group flex items-center gap-2 hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3 text-bakery-gold transition-transform group-hover:translate-x-1" /> Manufacturing Control
                </Link>
              </li>
              <li>
                <Link href="supply-chain" className="group flex items-center gap-2 hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3 text-bakery-gold transition-transform group-hover:translate-x-1" /> Supply Chain (LPO)
                </Link>
              </li>
              <li>
                <Link href="smart-pos" className="group flex items-center gap-2 hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3 text-bakery-gold transition-transform group-hover:translate-x-1" /> Smart POS Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-white">Headquarters</h3>
            <ul className="flex flex-col gap-4 text-sm text-stone-400">
              <li className="flex items-start gap-3">
                 <MapPin className="w-4 h-4 text-bakery-gold flex-shrink-0 mt-0.5" />
                 <span>P.O. Box 6681<br/>Morogoro, Tanzania</span>
              </li>
              <li className="flex items-center gap-3">
                 <Mail className="w-4 h-4 text-bakery-gold flex-shrink-0" />
                 <span className="text-white hover:text-bakery-gold transition-colors">info@antiqueoven.co.tz</span>
              </li>
              <li className="flex items-center gap-3">
                 <Phone className="w-4 h-4 text-bakery-gold flex-shrink-0" />
                 <span className="text-white">+255 767 885 555</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-white/5 bg-[#0a0a0c] py-6">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-xs md:flex-row md:items-start">
          
          <div className="flex flex-col items-center gap-2 md:items-start text-stone-500 font-medium">
            <p>&copy; {currentYear} Antique Oven Ltd. All rights reserved.</p>
            <div className="flex items-center gap-2 mt-1">
              <span>Powered by</span>
              <a 
                href="https://www.mogitechglobal.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center"
              >
                <Globe className="w-3 h-3 mr-1" /> Mogitech Global Ltd
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 font-medium text-stone-500">
            <Link href="/privacy-policy" className="hover:text-bakery-gold transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-bakery-gold transition-colors">Terms of Service</Link>
          </div>

        </div>
      </div>
    </footer>
  );
}