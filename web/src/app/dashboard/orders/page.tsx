// web/src/app/dashboard/orders/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  FileText, 
  Search, 
  TrendingUp, 
  Receipt, 
  CreditCard,
  Loader2,
  Eye,
  X,
  Banknote,
  Smartphone,
  CalendarDays,
  Filter,
  Ban,
  Printer,
  CheckCircle2,
  XCircle,
  Download,
  ShieldAlert
} from "lucide-react";

interface SalesItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  item: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface Transaction {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string; // COMPLETED, CANCELLED
  createdAt: string;
  staff: {
    staff: {
      firstName: string;
      lastName: string;
    };
  };
  items: SalesItem[];
}

export default function OrdersDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Transaction | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
  
  // Check if user is Admin, Super Admin, or has a role with the name "Admin, Super Admin"
  const isSuperAdmin = user?.role === 'Admin, Super Admin' || (user as any)?.role?.name === 'Admin, Super Admin';

  const fetchTransactions = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`http://localhost:3001/api/v1/pos/transactions/${user.branchId}`, axiosConfig);
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // --- ACTIONS ---
  const handleVoidTransaction = async (id: string, receiptNumber: string) => {
    if (!confirm(`Are you sure you want to VOID receipt ${receiptNumber}? This will revert the stock and mark it as Cancelled in the ledger.`)) return;
    
    setIsProcessing(true);
    try {
      await axios.patch(`http://localhost:3001/api/v1/pos/transaction/${id}/status`, { status: 'CANCELLED' }, axiosConfig);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to void transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Receipt No', 'Date', 'Cashier', 'Method', 'Status', 'Total Amount (TZS)'];
    const csvData = filteredTransactions.map(t => [
        t.receiptNumber,
        new Date(t.createdAt).toLocaleString(),
        `${t.staff?.staff?.firstName} ${t.staff?.staff?.lastName}`,
        t.paymentMethod,
        t.status,
        t.totalAmount
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- FILTERING LOGIC ---
  const filterByDate = (dateStr: string, filter: string) => {
    if (filter === 'ALL') return true;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (filter === 'TODAY') {
       return date >= today;
    } else if (filter === 'YESTERDAY') {
       const yesterday = new Date(today);
       yesterday.setDate(yesterday.getDate() - 1);
       return date >= yesterday && date < today;
    } else if (filter === 'WEEK') {
       const weekAgo = new Date(today);
       weekAgo.setDate(weekAgo.getDate() - 7);
       return date >= weekAgo;
    } else if (filter === 'MONTH') {
       return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }
    return true;
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.staff?.staff?.firstName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = filterByDate(t.createdAt, dateFilter);
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPayment = paymentFilter === "ALL" || t.paymentMethod === paymentFilter;

    return matchesSearch && matchesDate && matchesStatus && matchesPayment;
  });

  // --- ANALYTICS CALCULATIONS ---
  const completedTx = transactions.filter(t => t.status === 'COMPLETED');
  const voidedTx = transactions.filter(t => t.status === 'CANCELLED');
  
  const today = new Date(); today.setHours(0,0,0,0);
  const todaysRevenue = completedTx.filter(t => new Date(t.createdAt) >= today).reduce((sum, t) => sum + t.totalAmount, 0);
  
  const totalRevenue = completedTx.reduce((sum, t) => sum + t.totalAmount, 0);
  const voidedRevenue = voidedTx.reduce((sum, t) => sum + t.totalAmount, 0);
  const averageOrderValue = completedTx.length > 0 ? (totalRevenue / completedTx.length) : 0;

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'CASH': return <Banknote className="w-4 h-4 mr-1.5 text-emerald-600" />;
      case 'CARD': return <CreditCard className="w-4 h-4 mr-1.5 text-blue-600" />;
      case 'MOBILE': return <Smartphone className="w-4 h-4 mr-1.5 text-purple-600" />;
      default: return <FileText className="w-4 h-4 mr-1.5 text-zinc-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Loading Sales Data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12 print:m-0 print:p-0">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center">
            Sales Master Log
            {isSuperAdmin && <span className="ml-3 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center"><ShieldAlert className="w-3.5 h-3.5 mr-1" /> Super Admin Access</span>}
          </h2>
          <p className="text-zinc-500 mt-1 font-medium">Track revenue, view historical receipts, and analyze order fulfillment at {user?.branchName}.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">TZS {todaysRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-blue-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Transactions</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{completedTx.length} Orders</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Receipt className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Average Order Val</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">TZS {Math.round(averageOrderValue).toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CreditCard className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Voided Value</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">TZS {voidedRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Ban className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm print:hidden">
        <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by receipt or cashier..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all"
              />
            </div>
            
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-bakery-gold appearance-none">
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-bakery-gold appearance-none">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Voided / Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-bakery-gold appearance-none">
                <option value="ALL">All Payments</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE">Mobile Money</option>
              </select>
            </div>
          </div>

          <button onClick={exportToCSV} className="w-full lg:w-auto btn btn-outline-success text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-100 flex items-center justify-center transition-colors">
             <Download className="w-4 h-4 mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Receipt Details</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Cashier</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isVoid = tx.status === 'CANCELLED';
                  return (
                    <tr key={tx.id} className={`hover:bg-zinc-50 transition-colors ${isVoid ? 'bg-red-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <p className={`font-bold ${isVoid ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>{tx.receiptNumber}</p>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">{tx.items.length} Items</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium text-zinc-600">
                          <CalendarDays className="w-4 h-4 mr-2 text-zinc-400" />
                          {new Date(tx.createdAt).toLocaleDateString()}
                          <span className="ml-2 text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
                          {tx.staff?.staff?.firstName} {tx.staff?.staff?.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
                          {getPaymentIcon(tx.paymentMethod)}
                          {tx.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isVoid ? (
                           <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                             <XCircle className="w-3 h-3 mr-1" /> Voided
                           </span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-base font-extrabold ${isVoid ? 'text-zinc-400' : 'text-zinc-900'}`}>
                          TZS {tx.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedOrder(tx)}
                            className="inline-flex items-center px-3 py-1.5 bg-white text-zinc-600 hover:bg-zinc-100 font-semibold text-xs rounded-lg transition-colors border border-zinc-200 shadow-sm"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* ONLY RENDER VOID BUTTON IF USER IS SUPER ADMIN */}
                          {!isVoid && isSuperAdmin && (
                            <button 
                              onClick={() => handleVoidTransaction(tx.id, tx.receiptNumber)}
                              disabled={isProcessing}
                              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs rounded-lg transition-colors border border-red-200 shadow-sm disabled:opacity-50"
                              title="Void Transaction (Super Admin Only)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RECEIPT MODAL (View Mode) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-100 flex items-center shadow-sm transition-colors">
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                </button>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors p-1 rounded-full hover:bg-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-extrabold text-zinc-900 uppercase tracking-widest mb-1">AntiqueBake</h4>
                <p className="text-sm font-medium text-zinc-500">{user?.branchName}</p>
                <div className="mt-4 inline-block bg-zinc-100 px-3 py-1 rounded-md text-xs font-bold text-zinc-600 border border-zinc-200">
                  {selectedOrder.receiptNumber}
                </div>
                {selectedOrder.status === 'CANCELLED' && (
                  <div className="mt-2 text-red-600 font-extrabold text-sm uppercase tracking-widest border-2 border-red-600 inline-block px-2 py-0.5 rounded transform -rotate-12">VOIDED</div>
                )}
              </div>

              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-200 pb-2">
                <span>Item</span>
                <span>Total</span>
              </div>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className={`font-bold ${selectedOrder.status === 'CANCELLED' ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>{item.item.name}</p>
                      <p className="text-xs text-zinc-500">{item.quantity} {item.item.unit} x TZS {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-zinc-900">TZS {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-zinc-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-zinc-500">Payment Method</span>
                  <span className="font-bold text-zinc-900">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-zinc-500">Cashier</span>
                  <span className="font-bold text-zinc-900">{selectedOrder.staff?.staff?.firstName} {selectedOrder.staff?.staff?.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="font-bold text-zinc-500">Date</span>
                   <span className="font-bold text-zinc-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 mt-2 border-t border-zinc-100">
                  <span className="font-extrabold text-zinc-900">Total Paid</span>
                  <span className="font-extrabold text-zinc-900">TZS {selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE RECEIPT (Hidden on screen, visible on print) --- */}
      {selectedOrder && (
        <>
          <style type="text/css" media="print">
            {`
              @page { margin: 0; size: auto; }
              html, body { background: white !important; height: 100% !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
              body * { visibility: hidden; }
              header, nav, aside, [data-testid="sidebar"], [data-testid="header"] { display: none !important; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                max-width: 80mm; 
                margin: 0; 
                padding: 10px;
              }
            `}
          </style>

          <div id="printable-receipt" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-4 font-mono text-sm max-w-[80mm] mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold uppercase">AntiqueBake</h2>
              <p className="text-xs">Branch: {user?.branchName}</p>
              <p className="text-xs">P.O. Box 1234, Local City</p>
              <p className="text-xs">Tel: +255 700 000 000</p>
            </div>

            <div className="border-y border-dashed border-black py-2 mb-4 text-xs">
              <p>Receipt: {selectedOrder.receiptNumber}</p>
              <p>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p>Cashier: {selectedOrder.staff?.staff?.firstName} {selectedOrder.staff?.staff?.lastName}</p>
              {selectedOrder.status === 'CANCELLED' && <p className="font-bold mt-1">*** VOIDED TRANSACTION ***</p>}
            </div>

            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-right pb-1">Qty</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1 pr-2">{item.item.name}</td>
                    <td className="py-1 text-right">{item.quantity}</td>
                    <td className="py-1 text-right">{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-black pt-2 mb-4">
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>TZS {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Paid via {selectedOrder.paymentMethod}</span>
                <span>TZS {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-xs mt-8 font-bold">
              <p>*** THANK YOU ***</p>
              <p>PLEASE COME AGAIN</p>
              <p className="mt-4">------------------------</p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}