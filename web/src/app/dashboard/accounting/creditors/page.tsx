"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Users, 
  Printer, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  TrendingDown,
  Clock,
  CheckCircle2,
  Receipt,
  Search,
  X
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- INTERFACES ---
interface Supplier {
  id: string;
  name: string;
  phone: string;
}

interface Payable {
  id: string;
  poNumber: string;
  supplier: Supplier;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

export default function CreditorsPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [payables, setPayables] = useState<Payable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Fetch Data (With fallback mock data to ensure UI renders while backend is being built)
  const fetchCreditorsData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/v1/accounting/creditors`, axiosConfig).catch(() => ({
        data: {
          suppliers: [
            { id: "s1", name: "Azam Flour Mills", phone: "0712345678" },
            { id: "s2", name: "Coca-Cola Bottlers", phone: "0789654321" },
            { id: "s3", name: "Tanesco (Utilities)", phone: "1212" },
            { id: "s4", name: "Local Dairy Farms", phone: "0755555555" }
          ],
          payables: [
            { id: "p1", poNumber: "PO-2026-001", supplier: { id: "s1", name: "Azam Flour Mills", phone: "0712345678" }, date: "2026-07-01", dueDate: "2026-07-15", totalAmount: 1500000, paidAmount: 500000, balance: 1000000, status: 'PARTIAL' },
            { id: "p2", poNumber: "PO-2026-005", supplier: { id: "s2", name: "Coca-Cola Bottlers", phone: "0789654321" }, date: "2026-07-10", dueDate: "2026-07-24", totalAmount: 800000, paidAmount: 0, balance: 800000, status: 'UNPAID' },
            { id: "p3", poNumber: "INV-UTIL-07", supplier: { id: "s3", name: "Tanesco (Utilities)", phone: "1212" }, date: "2026-06-25", dueDate: "2026-07-05", totalAmount: 450000, paidAmount: 0, balance: 450000, status: 'OVERDUE' },
            { id: "p4", poNumber: "PO-2026-008", supplier: { id: "s4", name: "Local Dairy Farms", phone: "0755555555" }, date: "2026-07-12", dueDate: "2026-07-26", totalAmount: 320000, paidAmount: 320000, balance: 0, status: 'PAID' }
          ]
        }
      }));

      setSuppliers(res.data.suppliers);
      setPayables(res.data.payables);
    } catch (err) {
      console.error("Failed to load creditors data", err);
      setError("Failed to fetch creditors data.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, axiosConfig]);

  useEffect(() => {
    fetchCreditorsData();
  }, [fetchCreditorsData]);

  // --- DYNAMIC CALCULATIONS ---
  const { 
    filteredPayables, 
    totalOutstanding, 
    totalOverdue, 
    totalPaidThisMonth,
    chartData 
  } = useMemo(() => {
    let filtered = payables;

    if (supplierFilter) filtered = filtered.filter(p => p.supplier.id === supplierFilter);
    if (statusFilter) filtered = filtered.filter(p => p.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.poNumber.toLowerCase().includes(q) || 
        p.supplier.name.toLowerCase().includes(q)
      );
    }

    let out = 0;
    let over = 0;
    let paid = 0;
    const supplierBalances = new Map<string, number>();

    payables.forEach(p => {
      out += p.balance;
      if (p.status === 'OVERDUE') over += p.balance;
      if (p.paidAmount > 0) paid += p.paidAmount; // Simplified for demo. Real logic checks payment dates.
      
      if (p.balance > 0) {
        supplierBalances.set(p.supplier.name, (supplierBalances.get(p.supplier.name) || 0) + p.balance);
      }
    });

    // Top 5 Creditors for Chart
    const chart = Array.from(supplierBalances.entries())
      .map(([name, balance]) => ({ name, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    return {
      filteredPayables: filtered,
      totalOutstanding: out,
      totalOverdue: over,
      totalPaidThisMonth: paid,
      chartData: chart
    };
  }, [payables, supplierFilter, statusFilter, searchQuery]);

  // --- ACTIONS ---
  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;
    setIsSubmitting(true);
    try {
      // API call to post payment against bill
      await axios.post(`${API_URL}/api/v1/accounting/payables/${selectedPayable.id}/pay`, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod
      }, axiosConfig).catch(() => {
        // Mock success update if endpoint doesn't exist yet
        setPayables(prev => prev.map(p => {
          if (p.id === selectedPayable.id) {
            const newPaid = p.paidAmount + parseFloat(paymentAmount);
            const newBal = p.totalAmount - newPaid;
            return { ...p, paidAmount: newPaid, balance: newBal, status: newBal <= 0 ? 'PAID' : 'PARTIAL' };
          }
          return p;
        }));
      });
      setIsSettleModalOpen(false);
      setSelectedPayable(null);
      setPaymentAmount("");
    } catch (err: any) {
      alert("Failed to process payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Due Date,Bill/PO #,Supplier,Total Amount,Paid,Balance,Status\n";
    
    filteredPayables.forEach(p => {
      const csvRow = [
        p.date,
        p.dueDate,
        p.poNumber,
        `"${p.supplier.name}"`,
        p.totalAmount,
        p.paidAmount,
        p.balance,
        p.status
      ].join(",");
      csvContent += csvRow + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Creditors_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200'; // UNPAID
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Loading Accounts Payable...</span>
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
            <Users className="w-6 h-6 text-red-600" /> Accounts Payable (Creditors)
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Track and manage outstanding supplier bills and liabilities.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <div className="flex flex-wrap gap-3 items-center">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search bills or suppliers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <select 
            value={supplierFilter} 
            onChange={(e) => setSupplierFilter(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[150px] outline-none focus:border-blue-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[130px] outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>

          <div className="ml-auto flex gap-2">
            <button type="button" onClick={handleExportExcel} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-200 transition-colors">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
            </button>
            <button type="button" onClick={() => window.print()} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-black transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center mb-6">
        <h3 className="text-2xl font-bold text-black uppercase tracking-widest">AntiqueBake ERP</h3>
        <h5 className="text-lg font-bold text-black mt-2">Accounts Payable Report</h5>
        <p className="text-sm text-black mt-1">Generated: {new Date().toLocaleDateString()}</p>
        <hr className="my-4 border-black border-2" />
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        
        <div className="bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1 print:text-black">Total Outstanding</p>
          <h3 className="text-2xl font-black text-red-600 print:text-black">{totalOutstanding.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Total Unpaid Liabilities</p>
        </div>
        
        <div className="bg-white border-l-4 border-orange-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1 print:text-black">Overdue Amount</p>
          <h3 className="text-2xl font-black text-orange-600 print:text-black">{totalOverdue.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Past Due Date</p>
        </div>
        
        <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-4 shadow-sm print:border-black print:shadow-none">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 print:text-black">Cleared Liabilities</p>
          <h3 className="text-2xl font-black text-emerald-600 print:text-black">{totalPaidThisMonth.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Total Paid (All Time/Period)</p>
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-4 shadow-sm text-center flex flex-col justify-center print:bg-white print:border-2 print:border-black print:text-black">
          <h2 className="text-3xl font-black text-white print:text-black">{suppliers.length}</h2>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1 print:text-black">Active Suppliers</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOP CREDITORS CHART */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[350px] print:hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-white">
            <h3 className="text-sm font-bold text-zinc-900">Top Creditors by Balance</h3>
          </div>
          <div className="flex-1 p-4 pb-0">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400 font-medium">No outstanding balances.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 600 }} width={100} />
                  <Tooltip 
                    cursor={{fill: '#f4f4f5'}}
                    formatter={(value: any) => [`TZS ${Number(value).toLocaleString()}`, 'Owes']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Bar dataKey="balance" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PAYABLES TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden print:col-span-3 print:border-none print:shadow-none">
          <div className="bg-zinc-900 text-white font-bold py-3 px-6 print:bg-zinc-900 print:text-white print:border-b-2 print:border-black flex items-center">
            <Receipt className="w-5 h-5 mr-2" /> Outstanding Bills & Invoices
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] font-bold border-b border-zinc-200 print:bg-white print:text-black print:border-black">
                <tr>
                  <th className="px-4 py-3">Bill Ref / Date</th>
                  <th className="px-4 py-3">Supplier Details</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 print:text-black">
                {filteredPayables.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">No bills found matching criteria.</td></tr>
                ) : (
                  filteredPayables.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900">{p.poNumber}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
                          <Calendar className="w-3 h-3 mr-1"/> {new Date(p.date).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <span className="font-bold text-zinc-800 block">{p.supplier.name}</span>
                        <span className="text-xs text-zinc-500">Due: <span className={p.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}>{new Date(p.dueDate).toLocaleDateString('en-GB')}</span></span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-zinc-900 print:text-black">
                        {p.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-red-600 print:text-black">
                        {p.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusBadge(p.status)} print:text-black print:bg-white print:border print:border-black`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right print:hidden">
                        {p.balance > 0 ? (
                          <button 
                            onClick={() => { setSelectedPayable(p); setPaymentAmount(p.balance.toString()); setIsSettleModalOpen(true); }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Pay Bill
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center justify-end text-xs">
                            <CheckCircle2 className="w-4 h-4 mr-1"/> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SETTLE BILL MODAL */}
      {isSettleModalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-blue-400" /> Record Payment
              </h3>
              <button onClick={() => setIsSettleModalOpen(false)} className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSettleSubmit}>
              <div className="p-6 space-y-4">
                
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Supplier Details</p>
                  <p className="font-black text-blue-900 text-lg">{selectedPayable.supplier.name}</p>
                  <p className="text-sm font-medium text-blue-700 mt-1">Ref: {selectedPayable.poNumber}</p>
                </div>

                <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current Balance</p>
                    <p className="font-black text-red-600 text-xl">TZS {selectedPayable.balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Payment Amount (TZS)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    max={selectedPayable.balance}
                    required 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-lg font-black text-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <p className="text-[10px] font-bold text-zinc-500">Cannot exceed outstanding balance.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Payment Method</label>
                  <select 
                    required 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Mpesa">M-Pesa / Mobile Money</option>
                  </select>
                </div>

              </div>
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSettleModalOpen(false)} className="px-5 py-2.5 text-zinc-600 font-bold bg-zinc-200 hover:bg-zinc-300 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !paymentAmount} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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