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
  Download,
  AlertCircle,
  Calendar,
  List
} from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface LedgerEntry {
  id: string;
  transactionId: string;
  description: string;
  debit: number;
  credit: number;
  entryDate: string;
  account: Account;
}

interface ExpenseBreakdown {
  name: string;
  amount: number;
}

// Chart Colors for Expense Breakdown
const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#64748b'];

export default function ProfitAndLossPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [period, setPeriod] = useState<string>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchLedgerData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      // Fetching raw ledger to allow dynamic client-side filtering matching the PHP legacy logic
      const res = await axios.get(`${API_URL}/api/v1/accounting/ledger/${user.branchId}`, axiosConfig);
      setLedger(res.data);
    } catch (err) {
      console.error("Failed to load ledger for reports", err);
      setError("Failed to fetch financial data. Ensure the ledger is connected.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, axiosConfig]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  // --- FILTER LOGIC ---
  const isDateInPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); 
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfAllTime = new Date('2020-01-01');

    switch (period) {
      case 'today': return d >= startOfToday;
      case 'yesterday': return d >= startOfYesterday && d < startOfToday;
      case 'this_week': return d >= startOfWeek;
      case 'this_month': return d >= startOfMonth;
      case 'last_month': return d >= startOfLastMonth && d < startOfMonth;
      case 'this_year': return d >= startOfYear;
      case 'all_time': return d >= startOfAllTime;
      case 'custom': 
        const cStart = new Date(customStartDate); cStart.setHours(0,0,0,0);
        const cEnd = new Date(customEndDate); cEnd.setHours(23,59,59,999);
        return d >= cStart && d <= cEnd;
      default: return true;
    }
  };

  // --- DYNAMIC P&L CALCULATION ---
  const { totalRevenue, totalExpense, netProfit, expenseBreakdown, recentTransactions } = useMemo(() => {
    const filtered = ledger.filter(entry => isDateInPeriod(entry.entryDate));
    
    let rev = 0;
    let exp = 0;
    const expMap = new Map<string, number>();

    filtered.forEach(entry => {
      const type = entry.account.type.toUpperCase();
      // Revenue is increased by Credits, decreased by Debits
      if (type === 'REVENUE') {
        rev += (entry.credit - entry.debit);
      }
      // Expenses are increased by Debits, decreased by Credits
      if (type === 'EXPENSE') {
        const netExp = entry.debit - entry.credit;
        exp += netExp;
        expMap.set(entry.account.name, (expMap.get(entry.account.name) || 0) + netExp);
      }
    });

    const breakdown = Array.from(expMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .filter(item => item.amount > 0) // Only show actual expenses
      .sort((a, b) => b.amount - a.amount);

    return {
      totalRevenue: rev,
      totalExpense: exp,
      netProfit: rev - exp,
      expenseBreakdown: breakdown,
      recentTransactions: filtered.slice(0, 15) // Top 15 recent for the preview table
    };
  }, [ledger, period, customStartDate, customEndDate]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
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

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12 animate-in fade-in duration-500 print:m-0 print:p-0 print:space-y-4">
      
      {/* EXECUTIVE BANNER (Hidden on Print) */}
      <div className="bg-zinc-950 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-800 print:hidden">
        <div className="absolute right-0 top-0 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[100px] -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <PieChart className="w-3.5 h-3.5 mr-2" />
            Corporate Finance
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Profit & Loss Statement
          </h2>
          <p className="text-zinc-400 mt-2 font-medium text-lg">
            Dynamic financial performance for <strong className="text-white">{user?.branchName}</strong>.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 z-10">
          <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center">
            <Printer className="w-4 h-4 mr-2 text-zinc-300" /> Print Report
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-extrabold shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
        <div className="flex items-center text-sm font-bold text-zinc-500 uppercase tracking-widest">
          <Calendar className="w-4 h-4 mr-2" /> Period Filter
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>

          {period === 'custom' && (
            <div className="flex gap-2 animate-in slide-in-from-left-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-emerald-500" />
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-emerald-500" />
            </div>
          )}
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center border-b-2 border-black pb-6 mb-8">
        <h1 className="text-3xl font-black uppercase tracking-widest">AntiqueBake ERP</h1>
        <h2 className="text-xl font-bold mt-2">Statement of Profit and Loss</h2>
        <p className="text-sm font-medium mt-1">Branch: {user?.branchName}</p>
        <p className="text-sm font-medium">Generated On: {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative print:border-black print:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 print:hidden"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 print:text-black">Gross Revenue</p>
            <h3 className="text-2xl font-black text-emerald-600 print:text-black">TZS {totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl print:hidden"><TrendingUp className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative print:border-black print:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 print:hidden"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 print:text-black">Total Expenses</p>
            <h3 className="text-2xl font-black text-red-600 print:text-black">TZS {totalExpense.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl print:hidden"><TrendingDown className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative print:border-black print:shadow-none">
          <div className={`absolute top-0 right-0 w-24 h-24 ${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-bl-full -z-10 print:hidden`}></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 print:text-black">Net Income</p>
            <h3 className={`text-2xl font-black ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} print:text-black`}>
              TZS {netProfit.toLocaleString()}
            </h3>
          </div>
          <div className={`p-3 ${netProfit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} rounded-xl print:hidden`}><DollarSign className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative print:border-black print:shadow-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 print:hidden"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 print:text-black">Profit Margin</p>
            <h3 className="text-2xl font-black text-zinc-900 print:text-black">{profitMargin}%</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl print:hidden"><PieChart className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMAL P&L STATEMENT TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:col-span-3">
          <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 print:bg-white print:border-black print:px-0">
            <h3 className="text-xl font-extrabold text-zinc-900 flex items-center print:text-2xl">
              <FileText className="w-5 h-5 mr-3 text-zinc-400 print:hidden" />
              Statement Details
            </h3>
          </div>
          <div className="p-8 print:p-0 print:mt-4">
            <table className="w-full text-left border-collapse">
              <tbody>
                {/* REVENUE SECTION */}
                <tr>
                  <td colSpan={2} className="py-3 font-extrabold text-lg text-emerald-700 border-b-2 border-emerald-100 print:text-black print:border-black">Revenue</td>
                </tr>
                <tr className="hover:bg-zinc-50 transition-colors group">
                  <td className="py-4 pl-4 font-bold text-zinc-700 print:pl-0">Gross Sales / Income</td>
                  <td className="py-4 pr-4 text-right font-black text-zinc-900 print:pr-0">TZS {totalRevenue.toLocaleString()}</td>
                </tr>
                <tr className="bg-emerald-50/50 print:bg-white">
                  <td className="py-4 pl-4 font-black text-zinc-900 print:pl-0">Total Revenue</td>
                  <td className="py-4 pr-4 text-right font-black text-emerald-700 text-lg border-t border-emerald-200 print:text-black print:border-black print:pr-0">TZS {totalRevenue.toLocaleString()}</td>
                </tr>

                <tr><td colSpan={2} className="py-6"></td></tr>

                {/* EXPENSES SECTION */}
                <tr>
                  <td colSpan={2} className="py-3 font-extrabold text-lg text-red-700 border-b-2 border-red-100 print:text-black print:border-black">Operating Expenses</td>
                </tr>
                {expenseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-400 font-medium italic">No expenses recorded for this period.</td>
                  </tr>
                ) : (
                  expenseBreakdown.map((expense, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors group border-b border-zinc-100 border-dashed print:border-gray-300">
                      <td className="py-3 pl-4 font-semibold text-zinc-600 print:pl-0">{expense.name}</td>
                      <td className="py-3 pr-4 text-right font-bold text-zinc-800 print:pr-0">TZS {expense.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-red-50/50 print:bg-white">
                  <td className="py-4 pl-4 font-black text-zinc-900 print:pl-0">Total Expenses</td>
                  <td className="py-4 pr-4 text-right font-black text-red-700 text-lg border-t border-red-200 print:text-black print:border-black print:pr-0">TZS {totalExpense.toLocaleString()}</td>
                </tr>

                <tr><td colSpan={2} className="py-8"></td></tr>

                {/* NET INCOME */}
                <tr className={`${netProfit >= 0 ? 'bg-zinc-900 text-white' : 'bg-red-900 text-white'} print:bg-white print:text-black`}>
                  <td className="py-5 pl-6 font-black text-xl tracking-tight rounded-l-xl print:rounded-none border-y-2 border-black print:pl-0">Net Income (Profit / Loss)</td>
                  <td className="py-5 pr-6 text-right font-black text-2xl tracking-tight rounded-r-xl print:rounded-none border-y-2 border-black print:pr-0">TZS {netProfit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            {/* Signature Blocks for Print */}
            <div className="hidden print:flex justify-between mt-24 px-10">
              <div className="text-center">
                <div className="w-48 border-b border-black mb-2"></div>
                <p className="font-bold text-sm">Prepared By</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-black mb-2"></div>
                <p className="font-bold text-sm">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* EXPENSE DISTRIBUTION CHART */}
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px] print:hidden">
          <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-xl font-extrabold text-zinc-900 flex items-center">
              <PieChart className="w-5 h-5 mr-3 text-blue-500" />
              Expense Distribution
            </h3>
          </div>
          <div className="flex-1 p-6">
            {expenseBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <PieChart className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">No expense data to visualize.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="amount"
                    stroke="none"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`TZS ${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={100}
                    content={(props) => {
                      const { payload } = props;
                      return (
                        <ul className="grid grid-cols-2 gap-2 mt-4">
                          {payload?.map((entry, index) => (
                            <li key={`item-${index}`} className="flex items-center text-xs font-bold text-zinc-600 truncate">
                              <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                              <span className="truncate" title={entry.value}>{entry.value}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* RECENT TRANSACTIONS LEDGER (Idea from reports.php) */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:hidden mt-8">
        <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-zinc-900 flex items-center">
            <List className="w-5 h-5 mr-3 text-zinc-400" />
            Recent Financial Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Account / Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    No transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((t, idx) => {
                  const isIncome = t.account.type === 'REVENUE';
                  const isExpense = t.account.type === 'EXPENSE';
                  const amount = isIncome ? t.credit : t.debit; // Simplified display logic
                  
                  return (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-900">{new Date(t.entryDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${isIncome ? 'bg-emerald-100 text-emerald-800' : isExpense ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-600'}`}>
                          {t.account.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-700">{t.account.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 truncate max-w-xs">{t.description}</td>
                      <td className={`px-6 py-4 text-right font-black ${isIncome ? 'text-emerald-600' : isExpense ? 'text-red-600' : 'text-zinc-600'}`}>
                        {isExpense ? '-' : ''}{amount > 0 ? amount.toLocaleString() : (t.credit || t.debit).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT CSS OVERRIDES */}
      <style type="text/css" media="print">
        {`
          @page { margin: 15mm; size: portrait; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, nav, aside, [data-testid="sidebar"] { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
        `}
      </style>

    </div>
  );
}