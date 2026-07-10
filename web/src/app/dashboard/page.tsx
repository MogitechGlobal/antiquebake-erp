// web/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { 
  TrendingUp, 
  PackageOpen, 
  AlertTriangle, 
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Factory,
  Package,
  ShoppingCart,
  FileText,
  ArrowRight,
  Clock,
  Receipt
} from "lucide-react";

interface Transaction {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  createdAt: string;
}

interface StockItem {
  id: string;
  quantity: number;
  item: {
    name: string;
    unit: string;
  };
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  targetQty: number;
  createdAt: string;
  recipe: {
    name: string;
    targetItem: {
      name: string;
    };
  };
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<ProductionOrder[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setIsLoading(true);
      
      // Dynamic URL evaluation matching local fallback or production environment variable
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const [posRes, stockRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/pos/transactions/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/stock/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/production/orders/${user.branchId}`, axiosConfig)
      ]);

      const today = new Date().toDateString();

      // 1. Calculate Today's Revenue & Recent Sales
      const todaySales = posRes.data.filter((tx: Transaction) => new Date(tx.createdAt).toDateString() === today);
      const revenue = todaySales.reduce((sum: number, tx: Transaction) => sum + tx.totalAmount, 0);
      
      setTodaysRevenue(revenue);
      setRecentSales(posRes.data.slice(0, 5)); // Grab 5 most recent transactions

      // 2. Determine Low Stock (Threshold <= 10)
      const lowStock = stockRes.data.filter((s: StockItem) => s.quantity <= 10);
      setLowStockItems(lowStock);

      // 3. Filter Production Orders
      const live = prodRes.data.filter((o: ProductionOrder) => o.status === 'PENDING' || o.status === 'IN_PROGRESS');
      const finished = prodRes.data.filter((o: ProductionOrder) => o.status === 'COMPLETED' && new Date(o.createdAt).toDateString() === today);
      
      setActiveOrders(live);
      setCompletedToday(finished.length);

    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Premium Quick Actions Ribbon
  const quickActions = [
    { name: "New POS Sale", icon: ShoppingCart, href: "/dashboard/pos", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { name: "Queue Batch", icon: Factory, href: "/dashboard/production", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { name: "Stock Intake", icon: Package, href: "/dashboard/procurement", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { name: "Issue Invoice", icon: FileText, href: "/dashboard/accounting/debtors", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  const kpis = [
    {
      title: "Today's Revenue",
      value: `TZS ${todaysRevenue.toLocaleString()}`,
      icon: Banknote,
      trend: "Live Updates",
      isPositive: true,
      color: "bg-emerald-500",
    },
    {
      title: "Completed Batches",
      value: completedToday.toString(),
      icon: TrendingUp,
      trend: "Today's Yield",
      isPositive: true,
      color: "bg-blue-500",
    },
    {
      title: "Active Work Orders",
      value: activeOrders.length.toString(),
      icon: PackageOpen,
      trend: `${activeOrders.filter(o => o.status === 'PENDING').length} pending`,
      isPositive: true,
      color: "bg-bakery-gold",
    },
    {
      title: "Low Stock Alerts",
      value: `${lowStockItems.length} Items`,
      icon: AlertTriangle,
      trend: lowStockItems.length > 0 ? "Action Required" : "Optimal Levels",
      isPositive: lowStockItems.length === 0,
      color: lowStockItems.length > 0 ? "bg-red-500" : "bg-emerald-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Compiling Command Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Premium Welcome Banner */}
      <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-bakery-gold/20 rounded-full blur-[100px] -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -z-10 transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.firstName}.
          </h2>
          <p className="text-zinc-400 mt-2 font-medium flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Live operations overview for {user?.branchName}
          </p>
        </div>
        <div className="mt-6 md:mt-0 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm shadow-sm z-10 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-bakery-gold" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Quick Actions Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link href={action.href} key={index} className="group block">
            <div className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 ease-in-out flex items-center space-x-4 hover:-translate-y-1`}>
              <div className={`p-3 rounded-xl ${action.bg} ${action.color} border ${action.border} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 group-hover:text-bakery-chocolate transition-colors">{action.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-${kpi.color.replace('bg-', '')}/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500 ease-out`}></div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{kpi.title}</p>
              <div className={`p-2.5 rounded-xl ${kpi.color} bg-opacity-10 text-${kpi.color.replace('bg-', '')}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            
            <div className="mt-6 flex items-end justify-between">
              <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{kpi.value}</h3>
              <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md bg-zinc-50 border border-zinc-100 ${kpi.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {kpi.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                {kpi.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Production Queue & Alerts Column (Takes up 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Live Production Queue */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <Factory className="w-5 h-5 mr-2 text-bakery-gold" /> Active Production
              </h3>
              <Link href="/dashboard/production" className="text-xs font-bold text-zinc-500 hover:text-bakery-gold flex items-center transition-colors">
                View Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto max-h-80">
              <div className="divide-y divide-zinc-100">
                {activeOrders.length === 0 ? (
                  <div className="p-10 text-center text-zinc-400">
                    <Factory className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm">No active production orders.</p>
                  </div>
                ) : (
                  activeOrders.map(order => (
                    <div key={order.id} className="p-5 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border shadow-sm ${order.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                          {order.targetQty}
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900 group-hover:text-bakery-gold transition-colors">{order.recipe.name}</h4>
                          <p className="text-xs font-medium text-zinc-500 mt-0.5">{order.orderNumber} • Target: {order.recipe.targetItem.name}</p>
                        </div>
                      </div>
                      {order.status === 'IN_PROGRESS' ? (
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 shadow-sm animate-pulse">Baking</span>
                      ) : (
                        <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold border border-zinc-200 shadow-sm">Queued</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Side Column: Alerts & Recent Sales */}
        <div className="flex flex-col gap-6">
          
          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Stock Alerts
              </h3>
              <Link href="/dashboard/inventory" className="text-xs font-bold text-zinc-500 hover:text-bakery-gold flex items-center transition-colors">
                Restock <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-64 space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-6">
                  <Package className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Stock levels optimal.</p>
                </div>
              ) : (
                lowStockItems.slice(0, 4).map(stock => (
                  <div key={stock.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${stock.quantity === 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div>
                      <p className={`text-sm font-bold ${stock.quantity === 0 ? 'text-red-900' : 'text-amber-900'}`}>{stock.item.name}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${stock.quantity === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                        {stock.quantity === 0 ? 'Out of stock' : `Only ${stock.quantity} ${stock.item.unit} left`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Sales Activity */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-emerald-500" /> Recent Sales
              </h3>
              <Link href="/dashboard/orders" className="text-xs font-bold text-zinc-500 hover:text-bakery-gold flex items-center transition-colors">
                View Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="p-1 flex-1 overflow-y-auto max-h-64">
              <div className="divide-y divide-zinc-50">
                {recentSales.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <p className="font-medium text-sm">No sales recorded yet.</p>
                  </div>
                ) : (
                  recentSales.map(sale => (
                    <div key={sale.id} className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{sale.receiptNumber}</p>
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        +TZS {sale.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}