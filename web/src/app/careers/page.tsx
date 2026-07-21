"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Send,
  Users,
  Award
} from "lucide-react";

export default function CareersPage() {
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
              Join Our Team
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Careers & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Internships.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Build your professional future with Antique Oven Ltd. We offer dynamic career paths across industrial baking manufacturing, supply chain management, and retail distribution.
            </p>
          </div>
        </section>

        {/* WHY WORK WITH US */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Our Culture</h2>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Why Build Your Career With Us?</h3>
              <div className="w-20 h-1 bg-bakery-gold mx-auto rounded-full mt-4 mb-6"></div>
              <p className="text-stone-500 font-medium text-base">
                We foster an environment of continuous learning, technical mastery, and operational excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Award className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Professional Growth</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Continuous training programs in modern ERP systems, industrial manufacturing, and quality assurance frameworks.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Collaborative Teams</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Work alongside master bakers, supply chain experts, and financial analysts in a high-performing corporate ecosystem.
                </p>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 space-y-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                  <Briefcase className="w-6 h-6 text-bakery-gold" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900">Career Advancement</h4>
                <p className="text-stone-600 text-sm font-medium leading-relaxed">
                  Clear promotion pathways across our growing network of manufacturing hubs and multi-branch retail stores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OPEN POSITIONS */}
        <section className="py-24 bg-stone-50 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="mb-12">
              <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Current Openings</h2>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Available Positions & Internships</h3>
            </div>

            <div className="space-y-6">
              
              {/* Job Card 1 */}
              <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-bakery-gold/50 transition-all">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-bakery-gold/10 text-bakery-brown text-xs font-bold rounded">Full-Time</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><MapPin className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Morogoro HQ</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><Clock className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Posted 3 days ago</span>
                  </div>
                  <h4 className="text-2xl font-bold text-zinc-900">Senior Master Baker / Production Supervisor</h4>
                  <p className="text-stone-600 text-sm font-medium max-w-3xl">
                    Oversee high-capacity baking floor operations, manage automated recipe scheduling, and ensure strict compliance with quality and hygiene protocols.
                  </p>
                </div>
                <button 
                  onClick={() => alert("Please send your CV and cover letter to hr@antiqueoven.co.tz")} 
                  className="px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Apply Now
                </button>
              </div>

              {/* Job Card 2 */}
              <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-bakery-gold/50 transition-all">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-700 text-xs font-bold rounded">Full-Time</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><MapPin className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Morogoro / Regional</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><Clock className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Posted 1 week ago</span>
                  </div>
                  <h4 className="text-2xl font-bold text-zinc-900">Supply Chain & Procurement Officer</h4>
                  <p className="text-stone-600 text-sm font-medium max-w-3xl">
                    Manage vendor directories, process automated Purchase Orders (LPOs), and coordinate Goods Received Notes (GRNs) across branches.
                  </p>
                </div>
                <button 
                  onClick={() => alert("Please send your CV and cover letter to hr@antiqueoven.co.tz")} 
                  className="px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Apply Now
                </button>
              </div>

              {/* Job Card 3 */}
              <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-bakery-gold/50 transition-all">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 text-xs font-bold rounded">Internship</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><MapPin className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Morogoro HQ</span>
                    <span className="flex items-center text-xs text-stone-500 font-medium"><Clock className="w-3.5 h-3.5 mr-1 text-bakery-brown" /> Open Rolling</span>
                  </div>
                  <h4 className="text-2xl font-bold text-zinc-900">Finance & Accounting Intern</h4>
                  <p className="text-stone-600 text-sm font-medium max-w-3xl">
                    Support the finance department in double-entry ledger auditing, accounts payable tracking, and daily transaction reconciliations.
                  </p>
                </div>
                <button 
                  onClick={() => alert("Please send your CV and cover letter to hr@antiqueoven.co.tz")} 
                  className="px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Apply Now
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* GENERAL APPLICATION BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Don't see your role listed?</h2>
            <p className="text-stone-400 font-medium">We are always looking for talented professionals. Send your speculative application directly to our HR desk.</p>
            <div className="pt-4">
              <a 
                href="mailto:hr@antiqueoven.co.tz" 
                className="inline-flex items-center px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-sm font-extrabold rounded-lg shadow-xl shadow-bakery-gold/20 transition-all uppercase tracking-widest"
              >
                Email HR Department
                <Send className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

    </div>
  );
}