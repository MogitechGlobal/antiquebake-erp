import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Store, 
  Smartphone, 
  Wifi, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  RefreshCw,
  BarChart3
} from "lucide-react";

export default function SmartPosPage() {
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
              Retail Distribution Ecosystem
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Cloud-Synced <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Smart POS Network.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Powering retail branches across Tanzania with lightning-fast checkouts, real-time multi-branch stock synchronization, and centralized financial accounting.
            </p>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Retail Superiority</h2>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Engineered for High-Volume Bakery Sales</h3>
              <div className="w-20 h-1 bg-bakery-gold mx-auto rounded-full mt-4 mb-6"></div>
              <p className="text-stone-500 font-medium text-base">
                Our custom POS platform eliminates manual reconciliation errors and guarantees instantaneous updates from storefront counters to the central warehouse.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <RefreshCw className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Real-Time Stock Sync</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Every pastry or loaf sold at any branch terminal instantly deducts from localized store inventory, maintaining absolute ledger accuracy.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Wifi className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Offline Resilience</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Uninterrupted checkout operations even during temporary network interruptions, featuring automatic cloud reconciliation upon reconnection.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Instant Revenue Tracking</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Branch managers and administrators gain instant visibility into daily gross sales, cash flow trends, and peak hour performance metrics.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ARCHITECTURE HIGHLIGHT */}
        <section className="py-24 bg-stone-50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Store className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">Unified Commerce</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Seamless Integration with Central ERP</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  The POS network does not operate in a silo. It feeds directly into Antique Oven Ltd's manufacturing production queues and supply chain replenishment engines, ensuring high-demand items are restocked before shelves run empty.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-stone-700">
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Automated Low-Stock Alerting for Master Bakers</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Secure Mobile Money & Card Payment Gateways</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Centralized Cashier Shift Reconciliations</li>
                </ul>
              </div>

              <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-bakery-gold/5 rounded-full blur-3xl"></div>
                <div className="space-y-4 relative z-10 text-stone-300">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Network Status</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">ALL HUBS ONLINE</span>
                  </div>
                  <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Active Terminals</span>
                      <span className="text-white font-bold">Fully Synchronized</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Latency to Cloud Ledger</span>
                      <span className="text-bakery-gold font-bold">&lt; 45ms</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PORTAL ACCESS BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to access branch point-of-sale?</h2>
            <p className="text-stone-400 font-medium">Log into the secure staff dashboard to manage terminal operations and shift logs.</p>
            <div className="pt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-sm font-extrabold rounded-lg shadow-xl shadow-bakery-gold/20 transition-all uppercase tracking-widest"
              >
                Access Portal Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />

    </div>
  );
}