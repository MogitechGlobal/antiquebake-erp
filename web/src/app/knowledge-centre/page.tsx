import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  BookOpen, 
  FileText, 
  Download, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  Lightbulb 
} from "lucide-react";

export default function KnowledgeCentrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-bakery-gold selection:text-white">
      
      <Header />

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-28 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-90"></div>
          <div className="absolute -left-40 -top-40 w-[35rem] h-[35rem] bg-bakery-gold/10 rounded-full blur-[120px]"></div>
          
          <div className="relative max-w-7xl mx-auto px-6 z-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-bakery-gold animate-pulse mr-2"></span>
              Corporate Resources & Guides
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Knowledge <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bakery-gold via-yellow-400 to-amber-200">
                Centre.
              </span>
            </h1>
            
            <p className="text-stone-400 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Access operational handbooks, safety protocols, recipe scaling frameworks, and training documentation for Antique Oven Ltd staff and partners.
            </p>
          </div>
        </section>

        {/* RESOURCES GRID */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
              <div>
                <h2 className="text-xs font-bold text-bakery-brown uppercase tracking-[0.2em] mb-2">Documentation Library</h2>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Featured Publications & Manuals</h3>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Search resources..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Resource Card 1 */}
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:shadow-xl hover:border-bakery-gold/40 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-bakery-gold" />
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-bakery-gold/10 text-bakery-brown text-xs font-bold rounded">Standard Operating Procedure</span>
                  <h4 className="text-xl font-bold text-zinc-900 group-hover:text-bakery-brown transition-colors">Bakery Floor Safety & Hygiene Manual 2026</h4>
                  <p className="text-stone-600 text-sm font-medium leading-relaxed">
                    Comprehensive guidelines on sanitation, high-temperature equipment handling, and personal protective gear across all branches.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-400 uppercase">PDF • 4.2 MB</span>
                  <button className="flex items-center text-xs font-bold text-zinc-900 hover:text-bakery-brown transition-colors uppercase tracking-wider">
                    Download <Download className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>

              {/* Resource Card 2 */}
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:shadow-xl hover:border-bakery-gold/40 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                    <GraduationCap className="w-6 h-6 text-bakery-gold" />
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-blue-500/10 text-blue-700 text-xs font-bold rounded">Staff Training Guide</span>
                  <h4 className="text-xl font-bold text-zinc-900 group-hover:text-bakery-brown transition-colors">POS Terminal Operation & Inventory Sync</h4>
                  <p className="text-stone-600 text-sm font-medium leading-relaxed">
                    Step-by-step training material for cashiers and store keepers managing real-time stock deductions and sales receipts.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-400 uppercase">PDF • 2.8 MB</span>
                  <button className="flex items-center text-xs font-bold text-zinc-900 hover:text-bakery-brown transition-colors uppercase tracking-wider">
                    Download <Download className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>

              {/* Resource Card 3 */}
              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 hover:shadow-xl hover:border-bakery-gold/40 transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
                    <Lightbulb className="w-6 h-6 text-bakery-gold" />
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-xs font-bold rounded">Manufacturing Whitepaper</span>
                  <h4 className="text-xl font-bold text-zinc-900 group-hover:text-bakery-brown transition-colors">Recipe Scaling & Yield Optimization</h4>
                  <p className="text-stone-600 text-sm font-medium leading-relaxed">
                    Advanced analytical frameworks for master bakers to minimize raw material wastage during high-volume production cycles.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-400 uppercase">PDF • 5.1 MB</span>
                  <button className="flex items-center text-xs font-bold text-zinc-900 hover:text-bakery-brown transition-colors uppercase tracking-wider">
                    Download <Download className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* PORTAL ACCESS BANNER */}
        <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Need internal corporate records?</h2>
            <p className="text-stone-400 font-medium">Log into the secure staff portal to access internal memos and secure ledgers.</p>
            <div className="pt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center px-8 py-4 bg-bakery-gold hover:bg-yellow-500 text-zinc-950 text-sm font-extrabold rounded-lg shadow-xl shadow-bakery-gold/20 transition-all uppercase tracking-widest"
              >
                Access Staff Portal
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