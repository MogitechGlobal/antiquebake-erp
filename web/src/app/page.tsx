// web/src/app/page.tsx
import Link from "next/link";
import { 
  Wheat, 
  ArrowRight, 
  Factory, 
  LineChart, 
  ShieldCheck, 
  Store,
  ChevronRight,
  Globe
} from "lucide-react";

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-bakery-gold selection:text-white">
      
      {/* EXECUTIVE NAVIGATION */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-stone-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 bg-zinc-900 rounded-xl shadow-md">
              <Wheat className="w-6 h-6 text-bakery-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-widest uppercase text-zinc-900 leading-none">
                Antique Oven <span className="text-bakery-brown">Ltd</span>
              </span>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">
                Enterprise Operations
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-stone-600 tracking-wide uppercase">
              <a href="#about" className="hover:text-bakery-brown transition-colors">About Us</a>
              <a href="#infrastructure" className="hover:text-bakery-brown transition-colors">Infrastructure</a>
            </div>
            <Link 
              href="/login" 
              className="group flex items-center justify-center px-7 py-3 bg-zinc-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg shadow-zinc-900/20 transition-all active:scale-95 border border-zinc-800"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-bakery-gold" />
              Staff Secure Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* PREMIUM HERO SECTION */}
      <main className="flex-1">
        <section className="relative pt-28 pb-36 overflow-hidden bg-zinc-950">
          {/* Executive Background Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black"></div>
          <div className="absolute -left-40 -bottom-40 w-[30rem] h-[30rem] bg-bakery-gold/5 rounded-full blur-[120px]"></div>

          <div className="relative max-w-7xl mx-auto px-6 z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-stone-300 text-xs font-bold uppercase tracking-widest mb-10 backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-bakery-gold animate-pulse mr-2.5 shadow-[0_0_10px_rgba(212,175,55,0.8)]"></span>
              Live Production Network
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mb-8">
              Intelligent Bakery <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-bakery-wheat">
                Manufacturing.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-stone-400 font-medium max-w-3xl mb-12 leading-relaxed">
              Antique Oven Ltd represents the pinnacle of modern food manufacturing. Our executive command center integrates high-capacity bakery production with precision financial ledgers and real-time retail distribution.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-base font-extrabold rounded-xl shadow-xl shadow-bakery-gold/20 transition-all flex items-center group uppercase tracking-wide"
              >
                Access Command Center
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* CORPORATE INFRASTRUCTURE SECTION */}
        <section id="infrastructure" className="py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-sm font-bold text-bakery-brown uppercase tracking-widest mb-3">Core Modules</h2>
              <h3 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-6">Enterprise Infrastructure</h3>
              <p className="text-stone-500 font-medium text-lg leading-relaxed">
                Powered by a custom-engineered ERP ecosystem, Antique Oven Ltd maintains absolute operational superiority, from raw material procurement to final point-of-sale.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="p-10 rounded-[2rem] bg-stone-50 border border-stone-200 hover:shadow-2xl hover:border-bakery-gold/40 transition-all duration-300 group">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-md">
                  <Factory className="w-7 h-7 text-bakery-gold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Manufacturing Control</h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Centralized queue management, intelligent recipe parsing, and automated yield tracking to streamline high-capacity baking floors.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-10 rounded-[2rem] bg-stone-50 border border-stone-200 hover:shadow-2xl hover:border-bakery-gold/40 transition-all duration-300 group">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-md">
                  <Store className="w-7 h-7 text-bakery-gold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Smart POS Network</h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Cloud-synced point of sale terminals operating across all retail branches, ensuring real-time stock deductions and instant revenue updates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-10 rounded-[2rem] bg-stone-50 border border-stone-200 hover:shadow-2xl hover:border-bakery-gold/40 transition-all duration-300 group">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-md">
                  <LineChart className="w-7 h-7 text-bakery-gold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Financial Ledgers</h3>
                <p className="text-stone-600 leading-relaxed font-medium">
                  Strict double-entry accounting protocols, automated Profit & Loss generation, and rigorous debt recovery oversight.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* EXECUTIVE FOOTER */}
      <footer className="bg-zinc-950 pt-20 pb-10 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <Wheat className="w-8 h-8 text-bakery-gold" />
                <span className="text-2xl font-extrabold tracking-wider uppercase text-white">
                  Antique Oven <span className="text-bakery-brown">Ltd</span>
                </span>
              </div>
              <p className="text-stone-500 text-sm font-medium">Excellence in Enterprise Baking.</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-stone-400 hover:text-bakery-gold text-sm font-bold flex items-center transition-colors uppercase tracking-wider">
                Corporate Login <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="border-t border-zinc-800/80 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-stone-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} Antique Oven Ltd. All rights reserved.
            </p>
            
            {/* CLICKABLE MOGITECH GLOBAL CREDIT */}
            <a 
              href="https://www.mogitechglobal.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center bg-zinc-900/50 px-5 py-2.5 rounded-full border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all duration-300 group cursor-pointer shadow-lg"
              title="Visit Mogitech Global Ltd"
            >
              <Globe className="w-4 h-4 mr-2 text-stone-500 group-hover:text-emerald-500 transition-colors" />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest group-hover:text-stone-300 transition-colors">Powered By</span>
              <div className="w-px h-4 bg-zinc-700 mx-3"></div>
              <span className="text-sm font-extrabold text-white tracking-tight">
                Mogitech Global <span className="text-emerald-500 group-hover:text-emerald-400 transition-colors">Ltd</span>
              </span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}