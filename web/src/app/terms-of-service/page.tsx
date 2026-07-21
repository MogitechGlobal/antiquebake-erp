import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, FileText, ArrowRight } from "lucide-react";

export default function TermsOfServicePage() {
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
              Legal & Compliance
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Terms of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Service.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Please review these terms and conditions carefully before accessing or using the Antique Oven Ltd enterprise platform, smart POS network, or staff portal.
            </p>
          </div>
        </section>

        {/* TERMS CONTENT SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-6 space-y-12 text-stone-700 leading-relaxed font-medium">
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex items-center gap-4 text-sm">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 text-bakery-gold font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <p>
                <strong>Effective Date:</strong> July 2026. By accessing or using our systems, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must refrain from using our platforms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">1. Enterprise Platform Access</h2>
              <p>
                Access to the Antique Oven Ltd internal management portals, manufacturing control dashboards, and supply chain ERP is restricted to authorized employees, registered vendors, and corporate partners. Unauthorized access attempts are strictly prohibited and subject to legal prosecution.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">2. User Accounts & Responsibilities</h2>
              <p>
                Users assigned credentials (such as Store Managers, Administrators, or Staff) are responsible for maintaining the absolute confidentiality of their login details. Any actions performed under your account session remain your sole responsibility.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">3. Intellectual Property Rights</h2>
              <p>
                All proprietary software architecture, manufacturing formulas, brand logos, UI designs, and digital content associated with Antique Oven Ltd are the exclusive property of the company. Unauthorized reproduction, distribution, or reverse engineering is strictly forbidden.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">4. Limitation of Liability</h2>
              <p>
                Antique Oven Ltd shall not be held liable for indirect, incidental, or consequential damages arising out of system downtime, temporary POS synchronization delays, or unauthorized third-party interference beyond our reasonable administrative control.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">5. Governing Law</h2>
              <p>
                These Terms of Service are governed by and construed in accordance with the laws of the United Republic of Tanzania. Any legal disputes arising herefrom shall be subject to the exclusive jurisdiction of the courts in Morogoro.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">6. Contact Information</h2>
              <p>
                For any official inquiries regarding these Terms, please contact our administrative desk at <strong className="text-zinc-900">info@antiqueoven.co.tz</strong> or call <strong className="text-zinc-900">+255 767 885 555</strong>.
              </p>
            </div>

          </div>
        </section>

        {/* PORTAL ACCESS BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to access your account?</h2>
            <p className="text-stone-400 font-medium">Log into the secure staff dashboard to manage branch workflows.</p>
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