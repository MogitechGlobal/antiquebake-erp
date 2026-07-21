import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Building2, 
  Target, 
  Eye, 
  Award, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  Users
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-bakery-gold selection:text-white">
      
      <Header />

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-28 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-90"></div>
          <div className="absolute -right-40 -top-40 w-[35rem] h-[35rem] bg-bakery-gold/10 rounded-full blur-[120px]"></div>
          
          <div className="relative max-w-7xl mx-auto px-6 z-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-bakery-gold animate-pulse mr-2"></span>
              Corporate Profile & Heritage
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              About Antique Oven <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Ltd.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Representing the pinnacle of modern food manufacturing and artisanal baking expertise across Tanzania.
            </p>
          </div>
        </section>

        {/* CORPORATE OVERVIEW */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">The Bakery Master</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Excellence in Enterprise Baking Since Inception</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  Antique Oven Ltd has grown into a premier food manufacturing and distribution enterprise. Based in Morogoro, Tanzania, our operations seamlessly bridge traditional baking craftsmanship with cutting-edge ERP systems, rigorous financial protocols, and high-capacity automated production lines.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                    <p className="text-3xl font-black text-zinc-900">100%</p>
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">Quality Commitment</p>
                  </div>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                    <p className="text-3xl font-black text-bakery-brown">Multi-Branch</p>
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">Retail Distribution</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-10 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-bakery-gold/5 rounded-full blur-3xl"></div>
                <div className="space-y-6 relative z-10 text-stone-300">
                  <h4 className="text-xl font-bold text-white tracking-tight">Our Core Standards</h4>
                  <ul className="space-y-4 text-sm font-medium">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-bakery-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span>Rigorous food safety protocols and hygiene standards across all manufacturing phases.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-bakery-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span>Real-time supply chain integration through custom-built automated procurement systems.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-bakery-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span>Continuous workforce training to maintain mastery over industrial baking technology.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="py-24 bg-stone-50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                <div className="w-12 h-12 bg-bakery-gold/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Our Mission</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  To deliver exceptional, high-quality bakery products to every household and establishment across East Africa while maintaining operational leadership through state-of-the-art enterprise manufacturing systems.
                </p>
              </div>

              <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                <div className="w-12 h-12 bg-bakery-gold/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-bakery-brown" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Our Vision</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  To set the absolute benchmark for corporate food manufacturing in Tanzania, combining artisanal excellence with transparent financial management, robust supply chains, and sustainable regional growth.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* PORTAL ACCESS BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Explore Our Infrastructure</h2>
            <p className="text-stone-400 font-medium">Learn more about the technical architecture and software systems powering our operations.</p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link 
                href="/infrastructure" 
                className="inline-flex items-center px-8 py-4 bg-zinc-900 hover:bg-black text-white text-sm font-extrabold rounded-lg border border-zinc-800 transition-all uppercase tracking-widest shadow-lg"
              >
                View Infrastructure
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-sm font-extrabold rounded-lg shadow-xl shadow-bakery-gold/20 transition-all uppercase tracking-widest"
              >
                Staff Portal Login
                <ShieldCheck className="w-4 h-4 ml-2 text-zinc-950" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />

    </div>
  );
}