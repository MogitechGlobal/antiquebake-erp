"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send 
} from "lucide-react";

export default function ContactPage() {
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
              Get in Touch
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Contact <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Antique Oven Ltd.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Reach out to our corporate headquarters or distribution hubs in Morogoro, Tanzania for partnership inquiries, supply chain support, or customer service.
            </p>
          </div>
        </section>

        {/* CONTACT INFO & FORM SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Contact Information Sidebar */}
              <div className="lg:col-span-1 bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl text-stone-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-bakery-gold/5 rounded-full blur-2xl"></div>
                
                <div className="space-y-8 relative z-10">
                  <div>
                    <h3 className="text-xs font-bold text-bakery-gold uppercase tracking-[0.2em] mb-2">Headquarters</h3>
                    <h4 className="text-2xl font-black text-white tracking-tight">Morogoro, Tanzania</h4>
                  </div>

                  <ul className="space-y-6 text-sm font-medium">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-800">
                        <MapPin className="w-5 h-5 text-bakery-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Physical Address</p>
                        <p className="text-white mt-1">P.O. Box 6681<br />Morogoro, Tanzania</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-800">
                        <Phone className="w-5 h-5 text-bakery-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Phone Line</p>
                        <p className="text-white mt-1">+255 767 885 555</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-800">
                        <Mail className="w-5 h-5 text-bakery-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-white mt-1">info@antiqueoven.co.tz</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-800">
                        <Clock className="w-5 h-5 text-bakery-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Operating Hours</p>
                        <p className="text-white mt-1">Mon - Sat: 8:00 AM - 6:00 PM</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-8 mt-8 border-t border-zinc-800 text-xs text-stone-500 relative z-10">
                  <p>Secure Enterprise Communications Channel</p>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-2 bg-stone-50 p-10 rounded-3xl border border-stone-200 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Send a Message</h2>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Corporate Inquiry Form</h3>
                  <p className="text-stone-600 text-sm font-medium mt-1">Fill out the form below and our operations desk will respond promptly.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Jacobs Mogi" 
                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="e.g. jacobs@company.com" 
                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +255 700 000 000" 
                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Inquiry Subject</label>
                      <select className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-700 focus:ring-2 focus:ring-bakery-gold outline-none">
                        <option value="general">General Corporate Inquiry</option>
                        <option value="supply">Supply Chain & Procurement</option>
                        <option value="retail">Retail Partnership</option>
                        <option value="support">Staff Portal Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Message</label>
                    <textarea 
                      rows={5} 
                      required 
                      placeholder="Type your message here..." 
                      className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold outline-none resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-4 bg-zinc-900 hover:bg-black text-white text-sm font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center uppercase tracking-widest cursor-pointer"
                  >
                    Send Message <Send className="w-4 h-4 ml-2 text-bakery-gold" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />

    </div>
  );
}