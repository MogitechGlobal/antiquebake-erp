"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Store, ArrowRight, Bell, Sparkles } from "lucide-react";

export default function ShopComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-bakery-gold selection:text-white">
      
      <Header />

      <main className="flex-1 flex flex-col justify-center">
        
        {/* COMING SOON HERO */}
        <section className="relative py-32 overflow-hidden bg-zinc-950 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-90"></div>
          <div className="absolute -right-40 -top-40 w-[35rem] h-[35rem] bg-bakery-gold/10 rounded-full blur-[120px]"></div>
          <div className="absolute -left-40 -bottom-40 w-[30rem] h-[30rem] bg-amber-600/10 rounded-full blur-[120px]"></div>

          <div className="relative max-w-4xl mx-auto px-6 z-10 space-y-8">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-stone-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-bakery-gold mr-2 animate-pulse" />
              Digital Retail Experience
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
              Online Store <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Coming Soon.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-xl mx-auto text-base md:text-lg leading-relaxed">
              We are preparing our digital storefront to bring artisanal pastries, fresh breads, and specialty confectionery directly from our baking floors to your doorstep across Tanzania.
            </p>

            {/* Notification Subscription Box */}
            <div className="pt-6 max-w-md mx-auto">
              <form 
                onSubmit={(e) => { e.preventDefault(); alert("Thank you! You have been added to our launch notification list."); }}
                className="flex flex-col sm:flex-row gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md"
              >
                <input 
                  type="email" 
                  required 
                  placeholder="Enter your email address..." 
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-stone-500 text-sm focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-xs font-extrabold rounded-xl transition-all uppercase tracking-widest flex items-center justify-center cursor-pointer"
                >
                  Notify Me <Bell className="w-3.5 h-3.5 ml-2" />
                </button>
              </form>
            </div>

            <div className="pt-10 flex flex-wrap justify-center gap-4">
              <Link 
                href="/" 
                className="inline-flex items-center px-8 py-3.5 bg-zinc-900 hover:bg-black text-white text-xs font-extrabold rounded-xl border border-zinc-800 transition-all uppercase tracking-widest shadow-lg"
              >
                Return to Homepage
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center px-8 py-3.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-extrabold rounded-xl transition-all uppercase tracking-widest"
              >
                Wholesale Inquiries
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