import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  ArrowRight, 
  Factory, 
  LineChart, 
  Store,
  ShieldCheck,
  TrendingUp,
  Box
} from "lucide-react";

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-bakery-gold selection:text-white">
      
      <Header />

      <main className="flex-1">
        {/* PREMIUM HERO SECTION */}
        <section className="relative pt-32 pb-40 overflow-hidden bg-zinc-950">
          {/* Corporate Background Accents */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-90"></div>
          <div className="absolute -right-40 -top-40 w-[40rem] h-[40rem] bg-bakery-gold/10 rounded-full blur-[120px]"></div>
          <div className="absolute -left-40 -bottom-40 w-[30rem] h-[30rem] bg-blue-900/20 rounded-full blur-[120px]"></div>

          <div className="relative max-w-7xl mx-auto px-6 z-10 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[10px] font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Live Production Network Active
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] max-w-5xl mb-6">
              Precision Baking. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Enterprise Scale.
              </span>
            </h1>
            
            <p className="text-lg text-stone-400 font-medium max-w-2xl mb-10 leading-relaxed">
              Welcome to the Antique Oven Ltd central command. Our integrated ecosystem unifies high-capacity manufacturing, precise financial controls, and dynamic retail distribution.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-sm font-extrabold rounded-lg shadow-xl shadow-bakery-gold/20 transition-all flex items-center group uppercase tracking-widest"
              >
                Access System
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
            
          </div>
        </section>

        {/* CORPORATE INFRASTRUCTURE SECTION */}
        <section id="infrastructure" className="py-24 bg-white relative border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-3">Core Modules</h2>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">Enterprise Infrastructure</h3>
              <div className="w-20 h-1 bg-bakery-gold mx-auto rounded-full mb-6"></div>
              <p className="text-stone-500 font-medium text-base leading-relaxed">
                Powered by a custom-engineered ERP architecture, Antique Oven Ltd maintains absolute operational superiority across all departments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:shadow-xl hover:border-bakery-gold/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-zinc-200">
                  <Factory className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">Manufacturing Control</h3>
                <p className="text-stone-500 leading-relaxed font-medium text-sm">
                  Centralized queue management, recipe parsing, and automated yield tracking for high-capacity baking floors.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:shadow-xl hover:border-bakery-gold/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-zinc-200">
                  <Store className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">Smart POS Network</h3>
                <p className="text-stone-500 leading-relaxed font-medium text-sm">
                  Cloud-synced point of sale terminals operating across all branches, ensuring real-time revenue updates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:shadow-xl hover:border-bakery-gold/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-zinc-200">
                  <LineChart className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">Financial Ledgers</h3>
                <p className="text-stone-500 leading-relaxed font-medium text-sm">
                  Double-entry accounting protocols, automated P&L generation, and rigorous debt recovery oversight.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:shadow-xl hover:border-bakery-gold/50 transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-zinc-200">
                  <Box className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">Supply Chain</h3>
                <p className="text-stone-500 leading-relaxed font-medium text-sm">
                  Automated LPO generation, vendor management, and direct goods received (GRN) inventory synchronization.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />

    </div>
  );
}