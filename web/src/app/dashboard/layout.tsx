"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/authStore";
import {
  LayoutDashboard,
  Factory,
  PackageSearch,
  ShoppingCart,
  Users,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Landmark,
  Truck,
  FileText,
  UserCircle,
  Lock
} from "lucide-react";

// --- 1. DEFINE ROLE-BASED ACCESS GROUPS ---
const ADMINS = ["Super Admin", "Admin"];
const MANAGERS = [...ADMINS, "Branch Manager", "Accountant"];
const POS_STAFF = [...MANAGERS, "Cashier", "Sales Personel"];
const INVENTORY_STAFF = [...MANAGERS, "Inventory Manager", "Inventory Clerk"];
const KITCHEN_STAFF = [
  ...MANAGERS, 
  "Baker", 
  "Baker - Oven Handler", 
  "Baker/Mixer Machine Handler", 
  "Cook - Frier Machiner Handler", 
  "Team Builder - Position Replacer"
];

// Public Attendant is restricted from most modules
const ALL_STAFF = [...POS_STAFF, ...INVENTORY_STAFF, ...KITCHEN_STAFF, "Public Attendant"];

type SubItem = { name: string; href: string; allowedRoles?: string[] };
type NavItem = {
  name?: string;
  href?: string;
  icon?: any;
  header?: string;
  subItems?: SubItem[];
  allowedRoles?: string[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);

  // Enterprise Menu Configuration with RBAC Permissions assigned to specific roles
  const navItems: NavItem[] = [
    // Restrict the Executive Dashboard to Managers and Admins only
    { header: "COMMAND CENTER", allowedRoles: MANAGERS },
    { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: MANAGERS },

    { header: "COMMERCE & SALES", allowedRoles: POS_STAFF },
    { name: "Smart POS", href: "/dashboard/pos", icon: ShoppingCart, allowedRoles: POS_STAFF },
    { name: "Order Fulfillment", href: "/dashboard/orders", icon: FileText, allowedRoles: MANAGERS },

    { header: "SUPPLY CHAIN", allowedRoles: [...INVENTORY_STAFF, ...KITCHEN_STAFF] },
    { name: "Inventory Control", href: "/dashboard/inventory", icon: PackageSearch, allowedRoles: INVENTORY_STAFF },
    { name: "Production & Recipes", href: "/dashboard/production", icon: Factory, allowedRoles: ["Inventory Manager", ...KITCHEN_STAFF] },
    { name: "Procurement (LPO)", href: "/dashboard/procurement", icon: Truck, allowedRoles: INVENTORY_STAFF },

    { header: "FINANCIAL MANAGEMENT", allowedRoles: MANAGERS },
    {
      name: "Corporate Finance",
      icon: Landmark,
      allowedRoles: MANAGERS,
      subItems: [
        { name: "General Ledger (GL)", href: "/dashboard/accounting/ledger", allowedRoles: MANAGERS },
        { name: "Chart of Accounts", href: "/dashboard/accounting/chart", allowedRoles: MANAGERS },
        { name: "Revenue Analytics", href: "/dashboard/accounting/reports", allowedRoles: MANAGERS },
        { name: "Cash Flow", href: "/dashboard/accounting/cashflow", allowedRoles: MANAGERS },
        { name: "Tax Report", href: "/dashboard/accounting/tax", allowedRoles: MANAGERS },
        { name: "Payment Records", href: "/dashboard/accounting/payments", allowedRoles: MANAGERS },
        { name: "Debtors", href: "/dashboard/accounting/debtors", allowedRoles: MANAGERS },
        { name: "Creditors", href: "/dashboard/accounting/creditors", allowedRoles: MANAGERS }
      ]
    },

    { header: "HUMAN CAPITAL", allowedRoles: MANAGERS },
    {
      name: "Workforce & Ops",
      icon: Users,
      allowedRoles: MANAGERS,
      subItems: [
        { name: "Staff Directory", href: "/dashboard/hr", allowedRoles: MANAGERS },
        { name: "Attendance & Leave", href: "/dashboard/hr/attendance", allowedRoles: MANAGERS },
        { name: "Payroll & Benefits", href: "/dashboard/hr/payroll", allowedRoles: MANAGERS }
      ]
    },

    { header: "SYSTEM ADMINISTRATION", allowedRoles: ADMINS },
    { name: "Settings & Config", href: "/dashboard/settings", icon: Settings, allowedRoles: ADMINS },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2. ROUTE & AUTHENTICATION GUARD ---
  useEffect(() => {
    if (isMounted && !token) {
      router.push("/login");
      return;
    }

    if (isMounted && user?.role) {
      let requiredRoles: string[] | undefined = [];
      let isProtectedPath = false;

      // Scan configuration to find the current route's permission requirements
      for (const item of navItems) {
        if (item.href === pathname) {
          requiredRoles = item.allowedRoles;
          isProtectedPath = true;
          break;
        }
        if (item.subItems) {
          const sub = item.subItems.find(s => s.href === pathname);
          if (sub) {
            requiredRoles = sub.allowedRoles || item.allowedRoles;
            isProtectedPath = true;
            break;
          }
        }
      }

      // If route is restricted and user role is not allowed, boot them to the profile settings
      if (isProtectedPath && requiredRoles && !requiredRoles.includes(user.role)) {
        router.push("/dashboard/profile");
      }
    }
  }, [isMounted, token, router, pathname, user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (!isMounted || !token || !user) return null;

  // --- 3. FILTER SIDEBAR NAVIGATION ---
  const authorizedNavItems = navItems.reduce<NavItem[]>((acc, item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(user.role)) {
      return acc;
    }

    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(sub => !sub.allowedRoles || sub.allowedRoles.includes(user.role));
      if (filteredSubItems.length > 0) {
        acc.push({ ...item, subItems: filteredSubItems });
      }
    } else {
      acc.push(item);
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex">

      {/* Mobile Overlay Background */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Off-canvas on mobile, fixed/static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
          
          <Link href="/dashboard/profile" className="flex items-center space-x-3">
            <div className="relative w-8 h-8 flex-shrink-0 bg-bakery-gold/20 rounded p-1">
              <Image 
                src="/web-app-manifest-512x512.png" 
                alt="Antique Oven Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="text-lg font-black text-white tracking-widest uppercase">Antique<span className="text-bakery-gold">Oven</span></span>
          </Link>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {authorizedNavItems.map((item, index) => {
            if (item.header) {
              return (
                <div key={`header-${index}`} className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-6 mb-2 px-4">
                  {item.header}
                </div>
              );
            }

            if (item.subItems) {
              const isOpen = openDropdowns[item.name as string];
              const isChildActive = item.subItems.some(sub => pathname.startsWith(sub.href));

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleDropdown(item.name as string)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${isChildActive && !isOpen
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
                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${isSubActive
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

            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href as string}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${isActive
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
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

          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 hover:bg-stone-50 p-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <div className="hidden sm:flex flex-col text-right mr-1">
                <span className="text-sm font-bold text-zinc-900">{user.firstName} {user.lastName}</span>
                <span className="text-xs font-medium text-bakery-brown">{user.role} • {user.branchName}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-bakery-gold/20 border border-bakery-gold/40 flex items-center justify-center text-bakery-brown font-bold flex-shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                
                <div className="px-4 py-3 border-b border-stone-100 sm:hidden">
                  <p className="text-sm font-bold text-zinc-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs font-medium text-bakery-brown truncate">{user.role}</p>
                </div>

                <div className="px-2 space-y-1 mt-2">
                  <Link 
                    href="/dashboard/profile" 
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-bakery-brown rounded-lg transition-colors"
                  >
                    <UserCircle className="w-4 h-4 mr-3 text-stone-400" />
                    Account Settings
                  </Link>
                  <Link 
                    href="/dashboard/profile/security" 
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-bakery-brown rounded-lg transition-colors"
                  >
                    <Lock className="w-4 h-4 mr-3 text-stone-400" />
                    Change Password
                  </Link>
                </div>
                
                <div className="px-2 mt-2 pt-2 border-t border-stone-100">
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}