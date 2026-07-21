import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Factory, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Clock,
  TrendingUp,
  Boxes
} from "lucide-react";

export default function ManufacturingPage() {
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
              Industrial Operations
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Automated Bakery <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Manufacturing Control.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Discover how Antique Oven Ltd manages high-capacity production lines, automated recipe scaling, and precise batch yield optimization in Morogoro, Tanzania.
            </p>
          </div>
        </section>

        {/* CORE CAPABILITIES SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Production Excellence</h2>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Precision Engineering on the Bakery Floor</h3>
              <div className="w-20 h-1 bg-bakery-gold mx-auto rounded-full mt-4 mb-6"></div>
              <p className="text-stone-500 font-medium text-base">
                Our manufacturing control subsystem bridges traditional master baking craftsmanship with state-of-the-art ERP automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Layers className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Automated Recipe Scaling</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Dynamic formulation adjustments based on daily demand forecasts, ensuring absolute consistency in ingredients, texture, and taste across all batches.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Yield & Waste Optimization</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Real-time tracking of raw material inputs against baked output volumes, minimizing wastage and maximizing flour processing efficiency.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Boxes className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Supply Chain Synchronization</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Direct integration with our procurement and LPO modules to trigger automated raw material replenishment when warehouse reserves hit critical thresholds.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* WORKFLOW HIGHLIGHT */}
        <section className="py-24 bg-stone-50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Factory className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">Operational Flow</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">From Raw Intake to Final Distribution</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  Every production cycle is monitored through centralized dashboards. Master bakers and floor supervisors coordinate batch queues seamlessly, ensuring fresh goods arrive at retail branches precisely on schedule.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-stone-700">
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Quality Assurance Checks at Every Phase</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Automated Batch Logging for Full Traceability</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Energy-Efficient Oven Temperature Management</li>
                </ul>
              </div>

              <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-bakery-gold/5 rounded-full blur-3xl"></div>
                <div className="space-y-4 relative z-10 text-stone-300">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Floor Telemetry</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">ACTIVE BATCHES</span>
                  </div>
                  <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Daily Production Capacity</span>
                      <span className="text-white font-bold">4.5 Tons / Day</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Quality Compliance Rate</span>
                      <span className="text-bakery-gold font-bold">99.4%</span>
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
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to manage factory production queues?</h2>
            <p className="text-stone-400 font-medium">Log into the secure staff portal to access manufacturing control panels.</p>
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