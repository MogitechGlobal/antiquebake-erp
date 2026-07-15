"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Activity, 
  Printer, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Building, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  List
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- INTERFACES MATCHING LEGACY API ---
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

export default function CashFlowPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffList, setStaffList] = useState<{id: string, username: string}[]>([]);
  const [baseOpeningBalance, setBaseOpeningBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [period, setPeriod] = useState<string>("this_month");
  const [dept, setDept] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [staff, setStaff] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Fetch Data
  const fetchCashFlowData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      setError(null);
      // We pass 'source' in params. If the backend supports it, it will filter opening balance.
      // If not, we will apply local filtering to the transaction list.
      const res = await axios.get(`${API_URL}/api/v1/accounting/ledger/legacy-format`, {
        ...axiosConfig,
        params: { period, dept, staff, source, start: customStartDate, end: customEndDate }
      });
      setTransactions(res.data.transactions || []);
      setBaseOpeningBalance(res.data.opening_balance || 0);
      setStaffList(res.data.staff_list || []);
    } catch (err) {
      console.error("Failed to load cash flow data", err);
      setError("Failed to fetch financial data. Ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, period, dept, staff, source, customStartDate, customEndDate, axiosConfig]);

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

  // --- DYNAMIC CALCULATIONS ---
  const { 
    filteredTransactions, 
    periodIn, 
    periodOut, 
    closingBalance,
    chartData 
  } = useMemo(() => {
    // Apply local source filter if the API didn't handle it strictly
    const filtered = source ? transactions.filter(t => t.payment_source === source) : transactions;
    
    let cashIn = 0;
    let cashOut = 0;
    let running = baseOpeningBalance;
    
    const chartPoints: { date: string; balance: number }[] = [];
    
    // Initial chart point (Opening)
    chartPoints.push({ date: 'Opening', balance: running });

    filtered.forEach(t => {
      if (t.type === 'Income') {
        cashIn += t.amount;
        running += t.amount;
      } else {
        cashOut += t.amount;
        running -= t.amount;
      }
      
      const dateLabel = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      chartPoints.push({ date: dateLabel, balance: running });
    });

    return {
      filteredTransactions: filtered,
      periodIn: cashIn,
      periodOut: cashOut,
      closingBalance: running,
      chartData: chartPoints
    };
  }, [transactions, baseOpeningBalance, source]);

  // --- ACTIONS ---
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Ref #,Description,Category,Source,Money In,Money Out,Running Balance\n";
    
    let running = baseOpeningBalance;
    csvContent += `,,,OPENING BALANCE,,,,${baseOpeningBalance}\n`;
    
    filteredTransactions.forEach(t => {
      const inc = t.type === 'Income' ? t.amount : 0;
      const exp = t.type === 'Expense' ? t.amount : 0;
      running = running + inc - exp;
      
      const desc = `"${t.revenue_point} - ${t.description.replace(/"/g, '""')}"`;
      const row = [
        t.date.split('T')[0],
        t.reference,
        desc,
        t.category,
        t.payment_source,
        inc || '-',
        exp || '-',
        running
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cash_Flow_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Analyzing Cash Flows...</span>
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
            <Activity className="w-6 h-6 text-blue-600" /> Cash Flow Statement
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Analyze inflows, outflows, and liquidity over time.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <form className="flex flex-wrap gap-3 items-center" onSubmit={(e) => { e.preventDefault(); fetchCashFlowData(); }}>
          
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold py-2 px-3 text-zinc-700 min-w-[130px] outline-none focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom</option>
          </select>

          <select 
            value={dept} 
            onChange={(e) => setDept(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[150px] outline-none focus:border-blue-500"
          >
            <option value="">All Departments</option>
            <option value="Productions">Productions</option>
            <option value="Shop">Shop</option>
            <option value="Hotel">Hostel</option>
            <option value="General">General Operations</option>
          </select>

          <select 
            value={source} 
            onChange={(e) => setSource(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[130px] outline-none focus:border-blue-500"
          >
            <option value="">All Sources</option>
            <option value="Cash">Cash</option>
            <option value="Mpesa">M-Pesa</option>
            <option value="Card">Card</option>
            <option value="Tigo">Tigo</option>
            <option value="Airtel">Airtel</option>
            <option value="Bank">Bank</option>
          </select>

          <select 
            value={staff} 
            onChange={(e) => setStaff(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[130px] outline-none focus:border-blue-500"
          >
            <option value="">All Staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
          </select>

          {period === 'custom' && (
            <div className="flex gap-2 animate-in slide-in-from-left-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500" />
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500" />
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-blue-700 transition-colors">
               Filter
            </button>
            <button type="button" onClick={handleExportExcel} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-200 transition-colors">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
            </button>
            <button type="button" onClick={() => window.print()} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-black transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
          </div>
        </form>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center mb-6">
        <h3 className="text-2xl font-bold text-black uppercase tracking-widest">AntiqueBake ERP</h3>
        <h5 className="text-lg font-bold text-black mt-2">Statement of Cash Flow</h5>
        <p className="text-sm text-black mt-1">Period: {period.replace('_', ' ').toUpperCase()}</p>
        <hr className="my-4 border-black border-2" />
      </div>

      {/* KPI METRICS (Matching legacy logic exactly) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        <div className="bg-white border-l-4 border-zinc-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Opening Balance</p>
          <h3 className="text-2xl font-black text-zinc-600 print:text-black">{baseOpeningBalance.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Start of Period</p>
        </div>
        
        <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 print:text-black">Cash In</p>
          <h3 className="text-2xl font-black text-emerald-600 print:text-black">+{periodIn.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Total Receipts</p>
        </div>
        
        <div className="bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1 print:text-black">Cash Out</p>
          <h3 className="text-2xl font-black text-red-600 print:text-black">-{periodOut.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Total Disbursements</p>
        </div>
        
        <div className="bg-white border-l-4 border-blue-600 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 print:text-black">Closing Balance</p>
          <h3 className="text-2xl font-black text-blue-600 print:text-black">{closingBalance.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">End of Period</p>
        </div>

      </div>

      {/* CASH FLOW TREND CHART */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:hidden mt-6">
        <div className="px-8 py-5 border-b border-zinc-100 bg-white">
          <h3 className="text-lg font-bold text-zinc-900">Cash Position Trend</h3>
        </div>
        <div className="p-6 h-[300px]">
          {chartData.length <= 1 ? (
             <div className="flex h-full items-center justify-center text-sm text-zinc-400 font-medium">Insufficient data for trend analysis.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [`TZS ${Number(value || 0).toLocaleString()}`, 'Balance']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6 print:border-none print:shadow-none">
        <div className="bg-zinc-900 text-white font-bold py-3 px-6 print:bg-zinc-900 print:text-white print:border-b-2 print:border-black">
          Transaction History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200 print:bg-white print:text-black print:border-black">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ref #</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">In</th>
                <th className="px-4 py-3 text-right">Out</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 print:text-black">
              <tr className="bg-zinc-100 font-bold print:bg-white border-b-2 border-zinc-200 print:border-black">
                <td colSpan={6} className="px-4 py-3 text-right text-zinc-700">OPENING BALANCE:</td>
                <td className="px-4 py-3 text-right text-zinc-900">{baseOpeningBalance.toLocaleString()}</td>
              </tr>

              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">No cash flow activity found.</td></tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  // Determine running balance exactly as it was calculated in useMemo
                  const runningAtThisPoint = chartData[idx + 1]?.balance || 0; 
                  const isIncome = t.type === 'Income';

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 font-medium">
                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{t.reference || '-'}</td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <span className="font-bold text-zinc-900 block">{t.revenue_point}</span>
                        <span className="text-zinc-500 text-xs">{t.category} - {t.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-2 py-1 rounded text-[10px] font-bold">
                          {t.payment_source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600 print:text-black">
                        {isIncome ? t.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-red-600 print:text-black">
                        {!isIncome ? t.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-zinc-800">
                        {runningAtThisPoint.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}

              <tr className="bg-blue-50/50 font-extrabold print:bg-white print:border-t-2 print:border-black border-t border-blue-200">
                <td colSpan={6} className="px-4 py-4 text-right text-blue-900">CLOSING BALANCE:</td>
                <td className="px-4 py-4 text-right text-blue-700 text-base">{closingBalance.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden print:block mt-12 text-center">
        <hr className="border-black mb-2" />
        <p className="text-xs text-black">Statement of Cash Flow Generated by AntiqueBake ERP on {new Date().toLocaleString()}</p>
      </div>

      {/* PRINT CSS OVERRIDES */}
      <style type="text/css" media="print">
        {`
          @page { margin: 15mm; size: landscape; }
          html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, nav, aside, [data-testid="sidebar"] { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
        `}
      </style>
    </div>
  );
}