import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Factory, 
  Store, 
  LineChart, 
  Box, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Network, 
  Database,
  Building2
} from "lucide-react";

export default function InfrastructurePage() {
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
              Enterprise Architecture
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Core Technical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Infrastructure.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Explore the robust hardware, cloud systems, and software subsystems that power Antique Oven Ltd from manufacturing floors to retail points of sale.
            </p>
          </div>
        </section>

        {/* DETAILED PILLARS SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 space-y-24">
            
            {/* Pillar 1: Manufacturing & Production Control */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Factory className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">Subsystem 01</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">High-Capacity Manufacturing Control</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  Our bakery floors are governed by automated queue scheduling and precise recipe parsing protocols. From raw material intake to final batch cooling, every stage is tracked in real-time to guarantee consistent product standards.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-stone-700">
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Automated Recipe Scaling & Batch Management</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Real-time Yield Tracking & Waste Reduction</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Automated Purchase Orders (LPO) & Stock Replenishment</li>
                </ul>
              </div>
              <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-bakery-gold/5 rounded-full blur-3xl"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Floor Status</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">OPTIMIZED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                      <p className="text-xs text-stone-400 font-medium">Daily Flour Processing</p>
                      <p className="text-xl font-black text-white mt-1">4.5 Tons</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                      <p className="text-xs text-stone-400 font-medium">Batch Success Rate</p>
                      <p className="text-xl font-black text-bakery-gold mt-1">99.4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Smart POS Network */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-stone-50 p-8 rounded-3xl border border-stone-200 shadow-inner">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Retail Distribution Sync</span>
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded text-xs font-bold">CLOUD LINKED</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Morogoro Main Branch POS</p>
                        <p className="text-xs text-stone-400">Status: Live Terminal</p>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Regional Distribution Hub</p>
                        <p className="text-xs text-stone-400">Status: Synchronized</p>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <Store className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">Subsystem 02</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Cloud-Synced Retail POS Network</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  Our retail points of sale are deployed across strategic branches. Every transaction instantly triggers localized inventory deductions, ensuring stock accuracy and eliminating discrepancy gaps between warehouse and storefront.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-stone-700">
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Instant Multi-Branch Inventory Deductions</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Secure Mobile Money & Card Integration</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Offline Resilience with Auto-Sync Recovery</li>
                </ul>
              </div>
            </div>

            {/* Pillar 3: Financial Ledgers & Security */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
                  <LineChart className="w-7 h-7 text-bakery-gold" />
                </div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em]">Subsystem 03</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Rigorous Financial Ledgers</h3>
                <p className="text-stone-600 font-medium leading-relaxed">
                  Accounting at Antique Oven Ltd follows strict corporate protocols. Automated double-entry ledgers track every asset, liability, and revenue stream, generating clean tax liability and Profit & Loss reports on demand.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-stone-700">
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Automated VAT & Tourism Levy Calculations</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Accounts Payable (Creditors) & Aging Reports</li>
                  <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-bakery-gold mr-3"></span> Role-Based Access Control (RBAC) Security</li>
                </ul>
              </div>
              <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute left-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Ledger Integrity</span>
                    <span className="px-2.5 py-1 bg-bakery-gold/10 text-bakery-gold border border-bakery-gold/20 rounded text-xs font-bold">SECURE</span>
                  </div>
                  <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Double-Entry Verification</span>
                      <span className="text-emerald-400 font-bold">PASSED</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Audit Trail Logging</span>
                      <span className="text-white font-bold">ACTIVE (256-bit)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to access the operational core?</h2>
            <p className="text-stone-400 font-medium">Log into the secure staff portal to manage daily branch workflows.</p>
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