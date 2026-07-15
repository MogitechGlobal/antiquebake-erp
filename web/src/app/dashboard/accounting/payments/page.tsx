// web/src/app/dashboard/accounting/payments/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Building, 
  Printer, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  CreditCard,
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

interface SummaryData {
  payment_source: string;
  total: number;
  txn_count: number;
}

// Chart Colors matching the legacy script roughly
const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#ec4899', '#64748b'];

export default function PaymentMethodsPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffList, setStaffList] = useState<{id: string, username: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [period, setPeriod] = useState<string>("this_month");
  const [dept, setDept] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Fetch Data
  const fetchPaymentData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      setError(null);
      // We are fetching all transactions and doing local filtering like the legacy script[cite: 11]
      const res = await axios.get(`${API_URL}/api/v1/accounting/ledger/legacy-format`, {
        ...axiosConfig,
        params: { period, dept, staff: staffFilter, start: customStartDate, end: customEndDate }
      });
      setTransactions(res.data.transactions || []);
      setStaffList(res.data.staff_list || []);
    } catch (err) {
      console.error("Failed to load payment data", err);
      setError("Failed to fetch financial data. Ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, period, dept, staffFilter, customStartDate, customEndDate, axiosConfig]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // --- DYNAMIC CALCULATIONS (Mirroring payment_methods.php) ---
  const { 
    filteredTransactions,
    summaryData,
    totalReceived,
    methodTotals 
  } = useMemo(() => {
    // Only process Income (Receipts) for Payment Method tracking[cite: 11]
    const incomeTxns = transactions.filter(t => t.type === 'Income');
    
    let total = 0;
    const methodMap = new Map<string, { total: number; count: number }>();
    const methodTotalsObj: Record<string, number> = {
      'Cash': 0, 'Mpesa': 0, 'Tigo': 0, 'Airtel': 0, 'Bank': 0, 'Card': 0
    };

    incomeTxns.forEach(t => {
      total += t.amount;
      
      const source = t.payment_source || 'Unknown';
      const existing = methodMap.get(source) || { total: 0, count: 0 };
      
      methodMap.set(source, {
        total: existing.total + t.amount,
        count: existing.count + 1
      });

      if (methodTotalsObj[source] !== undefined) {
        methodTotalsObj[source] += t.amount;
      } else {
        methodTotalsObj[source] = t.amount;
      }
    });

    // Format summary data for table and chart[cite: 11]
    const summary: SummaryData[] = Array.from(methodMap.entries())
      .map(([payment_source, data]) => ({
        payment_source,
        total: data.total,
        txn_count: data.count
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending[cite: 11]

    return {
      filteredTransactions: incomeTxns,
      summaryData: summary,
      totalReceived: total,
      methodTotals: methodTotalsObj
    };
  }, [transactions]);

  // Aggregated totals matching legacy KPI cards[cite: 11]
  const totalMobile = (methodTotals['Mpesa'] || 0) + (methodTotals['Tigo'] || 0) + (methodTotals['Airtel'] || 0);
  const totalBankCard = (methodTotals['Bank'] || 0) + (methodTotals['Card'] || 0);
  const totalCash = methodTotals['Cash'] || 0;

  // --- ACTIONS ---
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Ref #,Description,Category,Method,Amount\n";
    
    filteredTransactions.forEach(t => {
      const desc = `"${t.description.replace(/"/g, '""')}"`;
      const csvRow = [
        t.date.split('T')[0],
        t.reference || '-',
        desc,
        t.revenue_point,
        t.payment_source,
        t.amount.toFixed(2)
      ].join(",");
      csvContent += csvRow + "\n";
    });

    // Summary logic exported[cite: 11]
    csvContent += `\n,,,TOTALS,,${totalReceived.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Compiling Payment Data...</span>
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

  // Helper for transaction row badges[cite: 11]
  const getBadgeColor = (source: string) => {
    switch (source) {
      case 'Cash': return 'bg-emerald-100 text-emerald-800';
      case 'Mpesa':
      case 'Tigo':
      case 'Airtel': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="max-w-[90rem] mx-auto space-y-6 relative pb-12 animate-in fade-in duration-500 print:m-0 print:p-0 print:max-w-full">
      
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div>
          <h4 className="text-2xl fw-bold text-zinc-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" /> Payment Methods Report
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Reconciliation Period: <span className="font-bold text-blue-600">{period.replace('_', ' ').toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* FILTER BAR[cite: 11] */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <form className="flex flex-wrap gap-3 items-center" onSubmit={(e) => { e.preventDefault(); fetchPaymentData(); }}>
          
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
            value={staffFilter} 
            onChange={(e) => setStaffFilter(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[150px] outline-none focus:border-blue-500"
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

      {/* PRINT-ONLY HEADER[cite: 11] */}
      <div className="hidden print:block text-center mb-6">
        <h3 className="text-2xl font-bold text-black uppercase tracking-widest">AntiqueBake ERP</h3>
        <h5 className="text-lg font-bold text-black mt-2">Payment Methods Report</h5>
        <p className="text-sm text-black mt-1">Period: {period.replace('_', ' ').toUpperCase()}</p>
        <hr className="my-4 border-black border-2" />
      </div>

      {/* KPI METRICS[cite: 11] */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Total Cash Collected</p>
          <h3 className="text-2xl font-black text-emerald-600 print:text-black">{totalCash.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Physical Vault</p>
        </div>
        
        <div className="bg-white border-l-4 border-amber-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Total Mobile Money</p>
          <h3 className="text-2xl font-black text-amber-500 print:text-black">{totalMobile.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">M-Pesa, Tigo, Airtel</p>
        </div>
        
        <div className="bg-white border-l-4 border-blue-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Bank / Card</p>
          <h3 className="text-2xl font-black text-blue-600 print:text-black">{totalBankCard.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Direct Transfers & POS</p>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-4 shadow-sm text-center flex flex-col justify-center print:bg-white print:border-2 print:border-black print:text-black">
          <h2 className="text-3xl font-black text-white print:text-black">{totalReceived.toLocaleString()}</h2>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1 print:text-black">Total Receipts</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Chart & Summary Table[cite: 11] */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          
          {/* Chart */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="px-6 py-4 border-b border-zinc-100 bg-white">
              <h3 className="text-sm font-bold text-zinc-900">Collection Mix</h3>
            </div>
            <div className="flex-1 p-4">
              {summaryData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400 font-medium">No collection data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={summaryData}
                      cx="50%" cy="45%" innerRadius={60} outerRadius={90}
                      paddingAngle={2} dataKey="total" nameKey="payment_source" stroke="none"
                    >
                      {summaryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`TZS ${Number(value || 0).toLocaleString()}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary Table[cite: 11] */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-white">
              <h3 className="text-sm font-bold text-zinc-900">Summary Table</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="px-6 py-2">Method</th>
                    <th className="px-6 py-2 text-right">Txns</th>
                    <th className="px-6 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {summaryData.map((row, idx) => {
                    const percentage = totalReceived > 0 ? (row.total / totalReceived) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="px-6 py-3">
                          <div className="font-bold text-zinc-800 mb-1">{row.payment_source}</div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-500 font-medium">{row.txn_count}</td>
                        <td className="px-6 py-3 text-right font-bold text-zinc-900">{row.total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Detailed Transactions[cite: 11] */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden print:col-span-3 print:border-none print:shadow-none">
          <div className="bg-zinc-900 text-white font-bold py-3 px-6 print:bg-zinc-900 print:text-white print:border-b-2 print:border-black flex items-center">
            <List className="w-5 h-5 mr-2" /> Transaction History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200 print:bg-white print:text-black print:border-black">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Ref #</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 print:text-black">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">No receipts found for this period.</td></tr>
                ) : (
                  filteredTransactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 font-medium">
                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{t.reference || '-'}</td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 print:border-black print:bg-white">
                          {t.revenue_point}
                        </span>
                        <span className="text-zinc-700">{t.category} - {t.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${getBadgeColor(t.payment_source)} print:text-black print:bg-white print:border print:border-black`}>
                          {t.payment_source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-zinc-900 print:text-black">
                        {t.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 italic text-xs">
                        {t.staff_name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div className="hidden print:block mt-12 text-center">
        <hr className="border-black mb-2" />
        <p className="text-xs text-black">Payment Report Generated by AntiqueBake ERP on {new Date().toLocaleString()}</p>
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