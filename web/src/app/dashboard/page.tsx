// web/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { 
  TrendingUp, 
  PackageOpen, 
  AlertTriangle, 
  Banknote,
  Loader2,
  Factory,
  Package,
  ShoppingCart,
  FileText,
  ArrowRight,
  Clock,
  Calendar,
  Users, 
  Receipt,
  Activity,
  Briefcase
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Transaction {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  createdAt: string;
  staffId: string;
  staff?: {
    staff: {
      firstName: string;
      lastName: string;
    }
  }
}

interface Invoice {
  id: string;
  invoiceNum: string;
  amount: number;
  createdAt: string;
  customer: {
    name: string;
  };
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

interface StaffMember {
  id: string;
  staff: {
    firstName: string;
    lastName: string;
  };
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  
  // Raw Data State
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allOrders, setAllOrders] = useState<ProductionOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [uniqueStaff, setUniqueStaff] = useState<{id: string, name: string}[]>([]);

  // Filter State
  const [period, setPeriod] = useState<string>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState<string>("ALL");

  const axiosConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;

      const [posRes, stockRes, prodRes, staffRes, custRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/pos/transactions/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/stock/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/production/orders/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/staff/organization/${currentOrgId}`, axiosConfig).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/v1/debtors/customers/${currentOrgId}`, axiosConfig).catch(() => ({ data: [] }))
      ]);

      setAllTransactions(posRes.data);
      setAllOrders(prodRes.data);

      // Extract all invoices from the customers payload
      const extractedInvoices = custRes.data?.flatMap((c: any) => 
        c.invoices.map((inv: any) => ({
          ...inv,
          customer: { name: c.name }
        }))
      ) || [];
      setAllInvoices(extractedInvoices);

      if (staffRes.data && Array.isArray(staffRes.data)) {
        const staffMapping = staffRes.data.map((member: StaffMember) => ({
          id: member.id,
          name: `${member.staff.firstName} ${member.staff.lastName}`
        }));
        staffMapping.sort((a, b) => a.name.localeCompare(b.name));
        setUniqueStaff(staffMapping);
      }

      const lowStock = stockRes.data.filter((s: StockItem) => s.quantity <= 10);
      setLowStockItems(lowStock);

    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, axiosConfig]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- ADVANCED FILTER LOGIC ---
  const isDateInPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); 
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

    switch (period) {
      case 'today': return d >= startOfToday;
      case 'yesterday': return d >= startOfYesterday && d < startOfToday;
      case 'this_week': return d >= startOfWeek;
      case 'this_month': return d >= startOfMonth;
      case 'last_month': return d >= startOfLastMonth && d < startOfMonth;
      case 'this_year': return d >= startOfYear;
      case 'last_year': return d >= startOfLastYear && d < startOfYear;
      case 'custom': 
        const cStart = new Date(customStartDate); cStart.setHours(0,0,0,0);
        const cEnd = new Date(customEndDate); cEnd.setHours(23,59,59,999);
        return d >= cStart && d <= cEnd;
      default: return true;
    }
  };

  // Apply Filters to POS Transactions & Invoices
  const filteredTransactions = allTransactions.filter(tx => 
    isDateInPeriod(tx.createdAt) && (selectedStaff === "ALL" || tx.staffId === selectedStaff)
  );
  
  // Note: Invoices are organization/branch level and bypass staff filters
  const filteredInvoices = allInvoices.filter(inv => isDateInPeriod(inv.createdAt));

  // Merge Data Streams
  const combinedSales = useMemo(() => {
    const pos = filteredTransactions.map(tx => ({
      id: tx.id,
      reference: tx.receiptNumber,
      amount: tx.totalAmount,
      date: tx.createdAt,
      type: 'POS',
      details: tx.staff?.staff ? `${tx.staff.staff.firstName}` : 'POS Sale'
    }));

    const invoices = filteredInvoices.map(inv => ({
      id: inv.id,
      reference: inv.invoiceNum || `INV-${inv.id.substring(0,6)}`,
      amount: inv.amount,
      date: inv.createdAt,
      type: 'INVOICE',
      details: inv.customer.name
    }));

    return [...pos, ...invoices];
  }, [filteredTransactions, filteredInvoices]);

  const filteredRevenue = combinedSales.reduce((sum, sale) => sum + sale.amount, 0);
  
  const recentFilteredSales = combinedSales
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const completedBatchesPeriod = allOrders.filter(o => 
    o.status === 'COMPLETED' && isDateInPeriod(o.createdAt)
  ).length;

  const activeLiveOrders = allOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');

  // --- CHART DATA AGGREGATION ---
  const revenueChartData = useMemo(() => {
    const chartMap = new Map<string, number>();
    const sortedSales = [...combinedSales].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedSales.forEach(sale => {
      const dateStr = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartMap.set(dateStr, (chartMap.get(dateStr) || 0) + sale.amount);
    });

    return Array.from(chartMap.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [combinedSales]);

  // Quick Actions Configuration
  const quickActions = [
    { name: "New POS Sale", icon: ShoppingCart, href: "/dashboard/pos", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { name: "Queue Batch", icon: Factory, href: "/dashboard/production", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Stock Intake", icon: Package, href: "/dashboard/procurement", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { name: "Issue Invoice", icon: FileText, href: "/dashboard/accounting/debtors", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Initializing Command Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[90rem] mx-auto pb-12">
      
      {/* EXECUTIVE WELCOME BANNER */}
      <div className="bg-zinc-950 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-800">
        <div className="absolute right-0 top-0 w-[30rem] h-[30rem] bg-bakery-gold/10 rounded-full blur-[100px] -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-bakery-gold text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Live Operations Active
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Executive Overview
          </h2>
          <p className="text-zinc-400 mt-2 font-medium text-lg">
            Welcome back, {user?.firstName}. Managing <strong className="text-white">{user?.branchName}</strong>.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl z-10 flex flex-col items-end">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">System Time</span>
          <div className="flex items-center font-bold text-white text-lg">
            <Clock className="w-5 h-5 mr-2 text-bakery-gold" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ADVANCED FILTERING TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between z-20 relative">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-wrap">
          
          {/* Time Period Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
              <Calendar className="w-3 h-3 inline mr-1" /> Time Period
            </label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Group */}
          {period === 'custom' && (
            <div className="flex gap-2 animate-in slide-in-from-left-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-bakery-gold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-bakery-gold"
                />
              </div>
            </div>
          )}

          {/* Staff Member Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
              <Users className="w-3 h-3 inline mr-1" /> Staff Member
            </label>
            <select 
              value={selectedStaff} 
              onChange={(e) => setSelectedStaff(e.target.value)} 
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
            >
              <option value="ALL">All Staff (Overall)</option>
              {uniqueStaff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue KPI */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-emerald-500/10 rounded-bl-full -z-10"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gross Revenue</p>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Banknote className="w-5 h-5" /></div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">TZS {filteredRevenue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Batches KPI */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-blue-500/10 rounded-bl-full -z-10"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Period Batches</p>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{completedBatchesPeriod} Yields</h3>
          </div>
        </div>

        {/* Active Orders KPI */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-amber-500/10 rounded-bl-full -z-10"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span> Live Floor Queue
            </p>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><PackageOpen className="w-5 h-5" /></div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{activeLiveOrders.length} Active</h3>
          </div>
        </div>

        {/* Low Stock KPI */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white to-red-500/10 rounded-bl-full -z-10"></div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Stock Alerts</p>
            <div className={`p-2.5 rounded-xl ${lowStockItems.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{lowStockItems.length} Warnings</h3>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link href={action.href} key={index} className="group block">
            <div className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-xl hover:border-bakery-gold/40 transition-all duration-300 ease-in-out flex items-center space-x-4`}>
              <div className={`p-3 rounded-xl ${action.bg} ${action.color} border ${action.border} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-zinc-900 group-hover:text-bakery-gold transition-colors">{action.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* REVENUE TREND GRAPH */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-xl font-extrabold text-zinc-900 flex items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            Unified Revenue Trend
          </h3>
        </div>
        <div className="p-6 h-[380px] w-full bg-white">
          {revenueChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold text-sm">No revenue data for the selected period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} 
                  tickFormatter={(val) => `TZS ${(val/1000)}k`} 
                  dx={-10} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(value: any) => [`TZS ${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Production Queue Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col overflow-hidden h-full">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white">
              <h3 className="text-xl font-extrabold text-zinc-900 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-bakery-gold/10 flex items-center justify-center mr-3">
                  <Factory className="w-5 h-5 text-bakery-gold" />
                </div>
                Live Production Floor
              </h3>
              <Link href="/dashboard/production" className="text-sm font-bold text-zinc-500 hover:text-bakery-gold flex items-center transition-colors px-4 py-2 rounded-lg hover:bg-zinc-50">
                View Schedule <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[28rem] p-2 bg-zinc-50/50">
              <div className="space-y-2">
                {activeLiveOrders.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <Factory className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-base">No active production orders on the floor.</p>
                  </div>
                ) : (
                  activeLiveOrders.map(order => (
                    <div key={order.id} className="p-5 bg-white rounded-2xl border border-zinc-100 hover:border-bakery-gold/40 hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center space-x-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 shadow-sm ${order.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                          {order.targetQty}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-zinc-900 text-lg group-hover:text-bakery-gold transition-colors">{order.recipe.name}</h4>
                          <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-wider">{order.orderNumber} • Target: {order.recipe.targetItem.name}</p>
                        </div>
                      </div>
                      {order.status === 'IN_PROGRESS' ? (
                        <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-black border border-amber-200 shadow-sm animate-pulse uppercase tracking-widest">Baking Now</span>
                      ) : (
                        <span className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black border border-zinc-200 shadow-sm uppercase tracking-widest">Queued</span>
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
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-extrabold text-zinc-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                Stock Alerts
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-64 space-y-2 bg-zinc-50/50">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-8">
                  <Package className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-bold">Stock levels optimal.</p>
                </div>
              ) : (
                lowStockItems.slice(0, 4).map(stock => (
                  <div key={stock.id} className={`flex items-center justify-between p-4 rounded-xl border-l-4 shadow-sm bg-white ${stock.quantity === 0 ? 'border-l-red-500 border-y-zinc-100 border-r-zinc-100' : 'border-l-amber-500 border-y-zinc-100 border-r-zinc-100'}`}>
                    <div>
                      <p className={`text-sm font-extrabold ${stock.quantity === 0 ? 'text-zinc-900' : 'text-zinc-900'}`}>{stock.item.name}</p>
                      <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${stock.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {stock.quantity === 0 ? 'Zero Stock Remaining' : `Only ${stock.quantity} ${stock.item.unit} left`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unified Recent Sales Activity */}
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-extrabold text-zinc-900 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                </div>
                Recent Sales
              </h3>
            </div>
            <div className="p-2 flex-1 overflow-y-auto max-h-[300px] bg-zinc-50/50">
              <div className="space-y-2">
                {recentFilteredSales.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <p className="font-bold text-sm">No sales in selected period.</p>
                  </div>
                ) : (
                  recentFilteredSales.map(sale => (
                    <div key={sale.id} className="p-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-emerald-200 transition-colors flex items-center justify-between">
                      <div className="flex items-center">
                        {sale.type === 'INVOICE' ? (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3" title="Corporate Invoice">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3" title="POS Sale">
                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-zinc-900 text-sm leading-tight">{sale.reference}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            {sale.type === 'INVOICE' ? 'Billed to ' : 'Sold by '}{sale.details}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-sm px-2.5 py-1 rounded-lg border ${sale.type === 'INVOICE' ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                          +TZS {sale.amount.toLocaleString()}
                        </span>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">
                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
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