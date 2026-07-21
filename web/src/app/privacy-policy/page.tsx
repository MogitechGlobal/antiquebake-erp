import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Lock, FileText, ArrowRight } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              Privacy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Policy.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              At Antique Oven Ltd, we are committed to safeguarding your privacy and protecting your personal and corporate data in compliance with regulatory standards.
            </p>
          </div>
        </section>

        {/* POLICY CONTENT SECTION */}
        <section className="py-24 bg-white relative">
          <div className="max-w-4xl mx-auto px-6 space-y-12 text-stone-700 leading-relaxed font-medium">
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex items-center gap-4 text-sm">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 text-bakery-gold font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p>
                <strong>Effective Date:</strong> July 2026. This Privacy Policy outlines how Antique Oven Ltd collects, uses, and secures information across our enterprise ERP, smart POS terminals, and digital platforms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">1. Information We Collect</h2>
              <p>
                We may collect personal and corporate identification information, including but not limited to names, business email addresses, phone numbers, physical addresses (such as Morogoro headquarters or branch delivery locations), and transaction history processed via our smart POS or supply chain modules.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">2. How We Use Your Information</h2>
              <p>
                The information collected is strictly utilized for core operational purposes, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-stone-600">
                <li>Processing local purchase orders (LPOs), vendor contracts, and goods received notes (GRNs).</li>
                <li>Synchronizing multi-branch retail inventory and executing point-of-sale transactions.</li>
                <li>Maintaining double-entry accounting ledgers and fulfilling statutory tax and reporting requirements.</li>
                <li>Communicating critical corporate announcements, customer service updates, and supply chain notices.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">3. Data Security & Protection</h2>
              <p>
                We implement robust administrative, technical, and physical security measures—including role-based access controls (RBAC) and encrypted database storage—to protect your information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">4. Third-Party Disclosures</h2>
              <p>
                Antique Oven Ltd does not sell, trade, or rent personal data to third parties. Information is only shared with authorized financial institutions or regulatory authorities when strictly necessary for transaction processing or legal compliance.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">5. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding this Privacy Policy or our data handling practices, please reach out to our corporate desk at <strong className="text-zinc-900">info@antiqueoven.co.tz</strong> or call us at <strong className="text-zinc-900">+255 767 885 555</strong>.
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