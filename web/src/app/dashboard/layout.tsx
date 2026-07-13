// web/src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  LayoutDashboard, 
  Factory, 
  PackageSearch, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Wheat,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Landmark,
  Truck,
  FileText
} from "lucide-react";

type SubItem = { name: string; href: string };
type NavItem = {
  name?: string;
  href?: string;
  icon?: any;
  header?: string;
  subItems?: SubItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // 1. Mark the component as mounted on the client[cite: 5]
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Security Gate: Only check auth AFTER mounting[cite: 5]
  useEffect(() => {
    if (isMounted && !token) {
      router.push("/login");
    }
  }, [isMounted, token, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // 3. Prevent rendering until the client has mounted and loaded the persisted token[cite: 5]
  if (!isMounted || !token || !user) return null;

  // Enterprise Menu Configuration integrated from PHP source[cite: 4]
  const navItems: NavItem[] = [
    { header: "COMMAND CENTER" },
    { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },

    { header: "COMMERCE & SALES" },
    { name: "Smart POS", href: "/dashboard/pos", icon: ShoppingCart },
    { name: "Order Fulfillment", href: "/dashboard/orders", icon: FileText },

    { header: "SUPPLY CHAIN" },
    { name: "Inventory Control", href: "/dashboard/inventory", icon: PackageSearch },
    { name: "Production & Recipes", href: "/dashboard/production", icon: Factory },
    { name: "Procurement (LPO)", href: "/dashboard/procurement", icon: Truck },

    { header: "FINANCIAL MANAGEMENT" },
    {
      name: "Corporate Finance",
      icon: Landmark,
      subItems: [
        { name: "General Ledger (GL)", href: "/dashboard/accounting/ledger" },
        { name: "Debtors", href: "/dashboard/accounting/debtors" },
        { name: "Revenue Analytics", href: "/dashboard/accounting/reports" }
      ]
    },

    { header: "HUMAN CAPITAL" },
    {
      name: "Workforce & Ops",
      icon: Users,
      subItems: [
        { name: "Staff Directory", href: "/dashboard/hr" },
        { name: "Attendance & Leave", href: "/dashboard/hr/attendance" },
        { name: "Payroll & Benefits", href: "/dashboard/hr/payroll" }
      ]
    },

    { header: "SYSTEM ADMINISTRATION" },
    { name: "Settings & Config", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      
      {/* Mobile Overlay Background[cite: 5] */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Off-canvas on mobile, fixed/static on desktop[cite: 5] */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
          <div className="flex items-center">
            <Wheat className="w-6 h-6 text-bakery-gold mr-3" />
            <span className="text-lg font-bold text-white tracking-widest uppercase">Antique<span className="text-bakery-gold">Bake</span></span>
          </div>
          {/* Mobile Close Button[cite: 5] */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {navItems.map((item, index) => {
            // Render Headers[cite: 4]
            if (item.header) {
              return (
                <div key={`header-${index}`} className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-6 mb-2 px-4">
                  {item.header}
                </div>
              );
            }

            // Render Dropdowns[cite: 4]
            if (item.subItems) {
              const isOpen = openDropdowns[item.name as string];
              const isChildActive = item.subItems.some(sub => pathname.startsWith(sub.href));
              
              return (
                <div key={item.name} className="space-y-1">
                  <button 
                    onClick={() => toggleDropdown(item.name as string)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                      isChildActive && !isOpen
                        ? "bg-bakery-gold/10 text-bakery-gold" 
                        : "hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon && <item.icon className={`w-5 h-5 mr-3 ${isChildActive ? 'text-bakery-gold' : 'text-zinc-400'}`} />}
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </button>
                  
                  {isOpen && (
                    <div className="pl-11 pr-2 space-y-1 mt-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link 
                            key={sub.name} 
                            href={sub.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                              isSubActive 
                                ? "bg-bakery-gold/20 text-bakery-gold font-bold border border-bakery-gold/30" 
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Render Standard Links[cite: 5]
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href as string}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? "bg-bakery-gold/20 text-bakery-gold border border-bakery-gold/30" 
                    : "hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.icon && <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-bakery-gold' : 'text-zinc-400'}`} />}
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area[cite: 5] */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar[cite: 5] */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 mr-4 text-zinc-500 hover:text-zinc-900 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-zinc-800 capitalize truncate">
              {pathname.split("/").pop() || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-sm font-bold text-zinc-900">{user.firstName} {user.lastName}</span>
              <span className="text-xs font-medium text-bakery-brown">{user.role} • {user.branchName}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-bakery-gold/20 border border-bakery-gold/40 flex items-center justify-center text-bakery-brown font-bold flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content[cite: 5] */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}