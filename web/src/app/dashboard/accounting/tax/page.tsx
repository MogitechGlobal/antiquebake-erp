// web/src/app/dashboard/accounting/tax/page.tsx
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
  Landmark,
  FileCheck
} from "lucide-react";

// --- CONFIGURATION ---
const TAX_RATE_VAT = 0.18; // 18% VAT[cite: 10]
const TAX_RATE_LEVY = 0.02; // 2% Tourism Levy[cite: 10]

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
}

interface TaxData {
  date: string;
  ref: string;
  desc: string;
  source: string;
  gross: number;
  net: number;
  vat: number;
  levy: number;
}

export default function TaxLiabilityPage() {
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

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Fetch Data
  const fetchTaxData = useCallback(async () => {
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
      console.error("Failed to load tax data", err);
      setError("Failed to fetch financial data. Ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, period, dept, customStartDate, customEndDate, axiosConfig]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  // --- TAX CALCULATIONS (Mirroring tax_reports.php) ---
  const { 
    taxData, 
    totalGross, 
    totalNet, 
    totalVat, 
    totalLevy 
  } = useMemo(() => {
    const data: TaxData[] = [];
    let grossAcc = 0;
    let netAcc = 0;
    let vatAcc = 0;
    let levyAcc = 0;

    // Filter only Income transactions[cite: 10]
    const incomeTransactions = transactions.filter(t => t.type === 'Income');

    incomeTransactions.forEach(t => {
      const gross = t.amount;
      const point = t.revenue_point;
      
      let net = 0, vat = 0, levy = 0;

      // Logic: Accommodation (Hotel) has VAT + Levy[cite: 10]
      if (point === 'Hotel' || point === 'Accommodation') {
        net = gross / (1 + TAX_RATE_VAT + TAX_RATE_LEVY); 
        vat = net * TAX_RATE_VAT;
        levy = net * TAX_RATE_LEVY;
      } else {
        // General Goods (Shop, Productions): Just VAT[cite: 10]
        net = gross / (1 + TAX_RATE_VAT);
        vat = net * TAX_RATE_VAT;
        levy = 0;
      }

      grossAcc += gross;
      netAcc += net;
      vatAcc += vat;
      levyAcc += levy;

      data.push({
        date: t.date,
        ref: t.reference || '-',
        desc: t.description,
        source: point,
        gross: gross,
        net: net,
        vat: vat,
        levy: levy
      });
    });

    return {
      taxData: data,
      totalGross: grossAcc,
      totalNet: netAcc,
      totalVat: vatAcc,
      totalLevy: levyAcc
    };
  }, [transactions]);

  // --- ACTIONS ---
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Ref #,Description,Revenue Source,Gross Amount,Net Amount,VAT (18%),Levy (2%)\n";
    
    taxData.forEach(row => {
      const desc = `"${row.desc.replace(/"/g, '""')}"`;
      const csvRow = [
        row.date.split('T')[0],
        row.ref,
        desc,
        row.source,
        row.gross.toFixed(2),
        row.net.toFixed(2),
        row.vat.toFixed(2),
        row.levy.toFixed(2)
      ].join(",");
      csvContent += csvRow + "\n";
    });

    // Footer Totals[cite: 10]
    csvContent += `,,,TOTALS,${totalGross.toFixed(2)},${totalNet.toFixed(2)},${totalVat.toFixed(2)},${totalLevy.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tax_Liability_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Calculating Tax Liabilities...</span>
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
            <Landmark className="w-6 h-6 text-blue-600" /> Tax Liability Report
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            VAT & Tourism Levy Analysis[cite: 10]
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <form className="flex flex-wrap gap-3 items-center" onSubmit={(e) => { e.preventDefault(); fetchTaxData(); }}>
          
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
            <option value="">All Revenue Points</option>
            <option value="Productions">Productions</option>
            <option value="Shop">Shop</option>
            <option value="Hotel">Hostel</option>
            <option value="General">General Operations</option>
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
        <h5 className="text-lg font-bold text-black mt-2">Tax Liability Report</h5>
        <p className="text-sm text-black mt-1">Period: {period.replace('_', ' ').toUpperCase()}</p>
        <hr className="my-4 border-black border-2" />
      </div>

      {/* KPI METRICS[cite: 10] */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        <div className="bg-white border-l-4 border-zinc-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 print:text-black">Gross Revenue</p>
          <h3 className="text-2xl font-black text-zinc-900 print:text-black">{totalGross.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Tax Inclusive</p>
        </div>
        
        <div className="bg-white border-l-4 border-blue-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 print:text-black">Net Revenue</p>
          <h3 className="text-2xl font-black text-blue-600 print:text-black">{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Before Tax</p>
        </div>
        
        <div className="bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1 print:text-black">VAT (18%)</p>
          <h3 className="text-2xl font-black text-red-600 print:text-black">{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Payable to TRA</p>
        </div>
        
        <div className="bg-white border-l-4 border-amber-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 print:text-black">Tourism Levy (2%)</p>
          <h3 className="text-2xl font-black text-amber-600 print:text-black">{totalLevy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Accommodation Only</p>
        </div>

      </div>

      {/* TAX BREAKDOWN TABLE[cite: 10] */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-6 print:border-none print:shadow-none">
        <div className="bg-zinc-900 text-white font-bold py-3 px-6 print:bg-zinc-900 print:text-white print:border-b-2 print:border-black flex items-center">
          <FileCheck className="w-5 h-5 mr-2" /> Tax Breakdown by Transaction
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200 print:bg-white print:text-black print:border-black">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Ref #</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right text-blue-600">Net</th>
                <th className="px-4 py-3 text-right text-red-600">VAT (18%)</th>
                <th className="px-4 py-3 text-right text-amber-600">Levy (2%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 print:text-black">
              {taxData.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">No income records found for this period.</td></tr>
              ) : (
                taxData.map((t, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600 font-medium">
                      {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{t.ref}</td>
                    <td className="px-4 py-3 text-zinc-700 min-w-[200px]">{t.desc}</td>
                    <td className="px-4 py-3">
                      <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-2 py-1 rounded text-[10px] font-bold">
                        {t.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-zinc-900 print:text-black">
                      {t.gross.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600 print:text-black">
                      {t.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 print:text-black">
                      {t.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600 print:text-black">
                      {t.levy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-zinc-900 text-white font-extrabold print:bg-white print:text-black print:border-t-2 print:border-black">
              <tr>
                <td colSpan={4} className="px-4 py-4 text-right">TOTALS</td>
                <td className="px-4 py-4 text-right text-base">{totalGross.toLocaleString()}</td>
                <td className="px-4 py-4 text-right text-base">{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-4 text-right text-base text-red-400 print:text-black">{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-4 text-right text-base text-amber-400 print:text-black">{totalLevy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="hidden print:block mt-12 text-center">
        <hr className="border-black mb-2" />
        <p className="text-xs text-black">Tax Report Generated by AntiqueBake ERP on {new Date().toLocaleString()}</p>
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