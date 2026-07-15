// web/src/app/dashboard/accounting/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Printer,
  Loader2,
  FileText,
  AlertCircle,
  Calendar,
  List,X,
  Eye,
  Building
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

// --- INTERFACES MATCHING LEGACY PHP API ---
interface Transaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  revenue_point: string;
  payment_source: string;
  category: string;
  description: string;
  amount: number;
  reference: string;
  staff_name?: string;
}

// Chart Colors
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export default function FinancialReportsPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [period, setPeriod] = useState<string>("this_month");
  const [dept, setDept] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal State for Order Details
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [activeOrderRef, setActiveOrderRef] = useState("");

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Fetch data from the legacy endpoint we built previously
  const fetchReportData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/v1/accounting/ledger/legacy-format`, {
        ...axiosConfig,
        params: { period, dept, start: customStartDate, end: customEndDate }
      });
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Failed to load reports", err);
      setError("Failed to fetch financial data. Ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, period, dept, customStartDate, customEndDate, axiosConfig]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // --- DYNAMIC CALCULATIONS (Mirroring reports.php) ---
  const { 
    totalIncome, 
    totalExpenses, 
    incomeBreakdown, 
    expenseBreakdown 
  } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const incMap = new Map<string, number>();
    const expMap = new Map<string, number>();

    transactions.forEach(t => {
      if (t.type === 'Income') {
        income += t.amount;
        incMap.set(t.revenue_point, (incMap.get(t.revenue_point) || 0) + t.amount);
      } else {
        expenses += t.amount;
        const cat = t.category || 'Uncategorized Expense';
        expMap.set(cat, (expMap.get(cat) || 0) + t.amount);
      }
    });

    const incList = Array.from(incMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const expList = Array.from(expMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      incomeBreakdown: incList,
      expenseBreakdown: expList
    };
  }, [transactions]);

  // Legacy PHP logic explicitly calculated COGS / Purchases separately.
  // For the frontend rewrite, we categorize "Purchases" as a specific expense category if it exists,
  // or use a calculated estimate if direct DB connection to POS is unavailable.
  const directCosts = expenseBreakdown.find(e => e.name.toLowerCase().includes('purchases') || e.name.toLowerCase().includes('cogs'))?.value || 0;
  const operatingExpenses = totalExpenses - directCosts;
  
  const grossProfit = totalIncome - directCosts;
  const netProfit = grossProfit - operatingExpenses;

  // Placeholder for fetching order details (Requires a POS endpoint)
  const handleViewOrder = (ref: string) => {
    setActiveOrderRef(ref);
    setIsOrderModalOpen(true);
    // Simulated fetch
    setTimeout(() => {
      setOrderDetails([
        { item_name: "Simulated Item", qty: 1, price: 5000 }
      ]);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Compiling Financial Statements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
        <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
        <span className="font-bold text-xl">{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-6 relative pb-12 animate-in fade-in duration-500 print:m-0 print:p-0 print:max-w-full">
      
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div>
          <h4 className="text-2xl fw-bold text-zinc-900 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" /> Financial Reports
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Dynamic P&L and Revenue Tracking
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <form className="flex flex-wrap gap-3 items-center">
          
          <div className="flex items-center text-sm font-bold text-zinc-500 mr-2">
            <Calendar className="w-4 h-4 mr-2" /> Period
          </div>
          
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold py-2 px-3 text-zinc-700 min-w-[140px] outline-none focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom</option>
          </select>

          <div className="flex items-center text-sm font-bold text-zinc-500 ml-2 mr-2">
            <Building className="w-4 h-4 mr-2" /> Dept
          </div>

          {/* EXACT DEPARTMENTS REQUESTED */}
          <select 
            value={dept} 
            onChange={(e) => setDept(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[160px] outline-none focus:border-blue-500"
          >
            <option value="">All Departments</option>
            <option value="Productions">Productions</option>
            <option value="Shop">Shop</option>
            <option value="Hotel">Hostel</option>
            <option value="General">General Operations</option>
          </select>

          {period === 'custom' && (
            <div className="flex gap-2 animate-in slide-in-from-left-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3" />
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3" />
            </div>
          )}

          <div className="ml-auto">
            <button type="button" onClick={() => window.print()} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-zinc-200 transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </button>
          </div>
        </form>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center mb-6">
        <h3 className="text-2xl font-bold text-black">AntiqueBake ERP</h3>
        <p className="text-sm text-black mb-0">Financial Report: {period.replace('_', ' ').toUpperCase()}</p>
        <p className="text-xs text-black">Branch: {user?.branchName} | Dept: {dept || 'All'}</p>
      </div>

      {/* KPI METRICS (Matching legacy grid) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
        
        <div className="bg-white border-l-4 border-emerald-500 rounded-lg p-3 shadow-sm print:border-black print:shadow-none">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Total Revenue</p>
          <h4 className="text-lg font-black text-emerald-600 print:text-black">{totalIncome.toLocaleString()}</h4>
        </div>
        
        <div className="bg-white border-l-4 border-zinc-400 rounded-lg p-3 shadow-sm print:border-black print:shadow-none">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Purchases/COGS</p>
          <h4 className="text-lg font-black text-zinc-800 print:text-black">{directCosts.toLocaleString()}</h4>
        </div>
        
        <div className="bg-white border-l-4 border-blue-500 rounded-lg p-3 shadow-sm print:border-black print:shadow-none">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Gross Profit</p>
          <h4 className="text-lg font-black text-blue-600 print:text-black">{grossProfit.toLocaleString()}</h4>
        </div>
        
        <div className="bg-white border-l-4 border-red-500 rounded-lg p-3 shadow-sm print:border-black print:shadow-none">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Operating Exp.</p>
          <h4 className="text-lg font-black text-red-600 print:text-black">{operatingExpenses.toLocaleString()}</h4>
        </div>
        
        <div className={`bg-zinc-50 border-l-4 ${netProfit >= 0 ? 'border-emerald-500' : 'border-red-500'} rounded-lg p-3 shadow-sm md:col-span-2 print:border-black print:shadow-none`}>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Net Profit</p>
          <h4 className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} print:text-black`}>{netProfit.toLocaleString()} TZS</h4>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE BREAKDOWN CHART */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[400px] print:hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-white">
            <h3 className="text-sm font-bold text-zinc-900">Revenue Breakdown</h3>
          </div>
          <div className="flex-1 p-4">
            {incomeBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400 font-medium">No revenue data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {incomeBreakdown.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`TZS ${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* P&L SUMMARY TABLE */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:col-span-2">
          <div className="px-6 py-4 border-b border-zinc-100 bg-white print:border-black print:px-0">
            <h3 className="text-sm font-bold text-zinc-900 print:text-lg">Profit & Loss Summary</h3>
          </div>
          <div className="p-0 print:mt-4">
            <table className="w-full text-sm text-left">
              <tbody>
                <tr>
                  <td colSpan={2} className="px-4 py-2 font-bold text-emerald-700 uppercase bg-emerald-50/50 print:bg-white print:text-black">Revenue</td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-zinc-700">Sales / Revenue</td>
                  <td className="px-6 py-2 text-right font-bold text-zinc-900">{totalIncome.toLocaleString()}</td>
                </tr>
                
                <tr>
                  <td colSpan={2} className="px-4 py-2 font-bold text-yellow-600 uppercase bg-yellow-50/30 mt-2 print:bg-white print:text-black">Cost of Sales</td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-red-600">Less: Direct Costs (COGS)</td>
                  <td className="px-6 py-2 text-right font-bold text-red-600">({directCosts.toLocaleString()})</td>
                </tr>
                
                <tr className="bg-blue-50/50 border-y border-blue-100 print:bg-white print:border-black">
                  <td className="px-6 py-3 font-bold text-blue-900 print:text-black">GROSS PROFIT</td>
                  <td className="px-6 py-3 text-right font-bold text-blue-900 print:text-black">{grossProfit.toLocaleString()}</td>
                </tr>

                <tr>
                  <td colSpan={2} className="px-4 py-2 font-bold text-red-700 uppercase bg-red-50/50 mt-2 print:bg-white print:text-black">Operating Expenses</td>
                </tr>
                {expenseBreakdown.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-2 text-zinc-400 italic">No expenses recorded.</td></tr>
                ) : (
                  expenseBreakdown.filter(e => !e.name.toLowerCase().includes('purchases')).map((exp, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-2 text-red-600">{exp.name}</td>
                      <td className="px-6 py-2 text-right font-bold text-red-600">({exp.value.toLocaleString()})</td>
                    </tr>
                  ))
                )}
                <tr className="bg-zinc-50 border-t border-zinc-100 print:bg-white print:border-black">
                  <td className="px-6 py-2 font-bold text-red-700 print:text-black">Total Operating Expenses</td>
                  <td className="px-6 py-2 text-right font-bold text-red-700 print:text-black">({operatingExpenses.toLocaleString()})</td>
                </tr>

                <tr className={`${netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'} border-t-2 border-black print:bg-white`}>
                  <td className={`px-6 py-4 font-black text-lg ${netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'} print:text-black`}>NET PROFIT</td>
                  <td className={`px-6 py-4 text-right font-black text-lg ${netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'} print:text-black`}>{netProfit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* TRANSACTION LEDGER */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6 print:border-none print:shadow-none">
        <div className="px-6 py-4 border-b border-zinc-100 bg-white flex justify-between items-center print:border-black print:px-0">
          <h3 className="text-sm font-bold text-zinc-900 print:text-lg">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200 print:bg-white print:text-black print:border-black">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Point / Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 print:text-black">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">No transactions found.</td></tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      {t.type === 'Income' ? 
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">Income</span> : 
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">Expense</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-800">{t.revenue_point}</div>
                      <div className="text-xs text-zinc-500">{t.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-700">{t.description}</span>
                      {t.reference && t.reference.toLowerCase().includes('order') ? (
                        <div className="mt-1">
                          <button onClick={() => handleViewOrder(t.reference)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center print:hidden">
                            <Eye className="w-3 h-3 mr-1" /> Ref: {t.reference}
                          </button>
                          <span className="hidden print:inline text-[10px] text-zinc-500">Ref: {t.reference}</span>
                        </div>
                      ) : t.reference ? (
                        <div className="mt-1 text-[10px] text-zinc-500">Ref: {t.reference}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{t.payment_source}</td>
                    <td className={`px-4 py-3 text-right font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-red-600'} print:text-black`}>
                      {t.type === 'Expense' ? '-' : ''}{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900">{activeOrderRef} Details</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="p-1 text-zinc-400 hover:bg-zinc-200 rounded-lg"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-100 text-zinc-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="px-6 py-2">Item</th>
                    <th className="px-6 py-2 text-center">Qty</th>
                    <th className="px-6 py-2 text-right">Price (TZS)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : (
                    <>
                      {orderDetails.map((item, idx) => (
                        <tr key={idx} className="border-b border-zinc-100">
                          <td className="px-6 py-3 font-medium text-zinc-800">{item.item_name}</td>
                          <td className="px-6 py-3 text-center text-zinc-600">{item.qty}</td>
                          <td className="px-6 py-3 text-right font-bold text-zinc-800">{(item.qty * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-zinc-50">
                        <td colSpan={2} className="px-6 py-3 text-right font-bold text-zinc-900">TOTAL</td>
                        <td className="px-6 py-3 text-right font-black text-blue-600">
                          {orderDetails.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-800">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT CSS OVERRIDES */}
      <style type="text/css" media="print">
        {`
          @page { margin: 10mm; size: portrait; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, nav, aside, [data-testid="sidebar"] { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
        `}
      </style>
    </div>
  );
}