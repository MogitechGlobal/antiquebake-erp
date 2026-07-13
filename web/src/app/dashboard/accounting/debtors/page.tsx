// web/src/app/dashboard/accounting/debtors/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Users, 
  Plus, 
  Search, 
  FileText,
  CreditCard,
  Loader2,
  X,
  AlertTriangle,
  Banknote,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle2,
  Printer,
  Trash2,
  Edit,
  Eye
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNum: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  receiptNum: string;
  amount: number;
  method?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  invoices: Invoice[];
  payments: Payment[];
}

interface StockItem {
  id: string;
  item: { id: string; name: string; category: string; price: number };
}

export default function DebtorsDashboardPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [activeCustomerForInvoice, setActiveCustomerForInvoice] = useState<Customer | null>(null);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<Customer | null>(null);
  const [viewRecord, setViewRecord] = useState<{ type: 'INVOICE'|'PAYMENT', data: any, customer: Customer } | null>(null);
  
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "BANK" });
  
  const [invoiceLines, setInvoiceLines] = useState([{ itemId: "", name: "", quantity: 1, price: 0 }]);
  
  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'PROFORMA' | 'TAX_INVOICE' | 'RECEIPT' | null>(null);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Implemented silent loading to prevent UI unmounts during background syncs
  const fetchData = useCallback(async (silent = false) => {
    if (!user?.branchId || !token) {
      if (!silent) setIsLoading(false);
      return;
    }
    try {
      if (!silent) setIsLoading(true);
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [custRes, stockRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/debtors/customers/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/stock/${user.branchId}`, axiosConfig)
      ]);
      
      setCustomers(custRes.data);
      const finishedGoods = stockRes.data.filter((s: StockItem) => s.item.category.replace('_', ' ').toUpperCase() === 'FINISHED GOOD');
      setStock(finishedGoods);
    } catch (err) {
      console.error("Failed to load debtors data", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, axiosConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- CRUD ACTIONS ---
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    
    const payload = { name: customerForm.name, phone: customerForm.phone, organizationId };
    
    try {
      if (editingCustomerId) {
        await axios.patch(`${API_URL}/api/v1/debtors/customer/${editingCustomerId}`, payload, axiosConfig);
      } else {
        await axios.post(`${API_URL}/api/v1/debtors/customer`, payload, axiosConfig);
      }
      setCustomerForm({ name: "", phone: "" });
      setEditingCustomerId(null);
      setIsCustomerModalOpen(false);
      fetchData(true);
    } catch (err: any) {
      alert("Failed to save corporate client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if(!confirm("Delete this customer? All invoices and payments will be permanently removed.")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/debtors/customer/${id}`, axiosConfig);
      fetchData(true);
    } catch(err) { alert("Failed to delete customer."); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if(!confirm("Cancel and delete this invoice?")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/debtors/invoice/${id}`, axiosConfig);
      fetchData(true);
    } catch(err) { alert("Failed to delete invoice."); }
  };

  const handleDeletePayment = async (id: string) => {
    if(!confirm("Delete this payment record? You will need to manually adjust invoice balances if required.")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/debtors/payment/${id}`, axiosConfig);
      fetchData(true);
    } catch(err) { alert("Failed to delete payment."); }
  };

  const openEditCustomer = (c: Customer) => {
    setCustomerForm({ name: c.name, phone: c.phone || "" });
    setEditingCustomerId(c.id);
    setIsCustomerModalOpen(true);
  };

  const openSettleModal = (customerObj: Customer, balance: number) => {
    setActiveCustomerForPayment(customerObj);
    setPaymentForm({ amount: balance.toString(), method: "BANK" });
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId || !activeCustomerForInvoice) return;
    
    const validLines = invoiceLines.filter(line => line.itemId && line.quantity > 0 && line.price >= 0);
    if(validLines.length === 0) return alert("Please add at least one valid item.");

    const itemsPayload = validLines.map(line => ({
      itemId: line.itemId,
      quantity: Number(line.quantity),
      price: Number(line.price)
    }));

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/debtors/invoice`, { 
        customerId: activeCustomerForInvoice.id,
        branchId: user.branchId,
        items: itemsPayload
      }, axiosConfig);
      
      setPrintData({ customer: activeCustomerForInvoice, invoice: res.data, items: validLines, total: validLines.reduce((sum, i) => sum + (i.price * i.quantity), 0) });
      setPrintType('TAX_INVOICE');
      setTimeout(() => window.print(), 500);

      setInvoiceLines([{ itemId: "", name: "", quantity: 1, price: 0 }]);
      setActiveCustomerForInvoice(null);
      fetchData(true);
    } catch (err: any) { alert("Failed to issue invoice."); } finally { setIsSubmitting(false); }
  };

  const handlePrintProforma = () => {
    if (!activeCustomerForInvoice) return;
    const validLines = invoiceLines.filter(line => line.itemId && line.quantity > 0 && line.price >= 0);
    if(validLines.length === 0) return alert("Please add at least one valid item.");

    setPrintData({ customer: activeCustomerForInvoice, items: validLines, total: validLines.reduce((sum, i) => sum + (i.price * i.quantity), 0) });
    setPrintType('PROFORMA');
    setTimeout(() => window.print(), 500);
  };

  const handlePrintViewRecord = () => {
    if (!viewRecord) return;
    
    if (viewRecord.type === 'INVOICE') {
      setPrintData({
        customer: viewRecord.customer,
        invoice: viewRecord.data,
        items: [{ name: "Consolidated Billed Items", quantity: 1, price: viewRecord.data.amount }],
        total: viewRecord.data.amount
      });
      setPrintType('TAX_INVOICE');
    } else {
      setPrintData({
        customer: viewRecord.customer,
        payment: viewRecord.data
      });
      setPrintType('RECEIPT');
    }
    setTimeout(() => window.print(), 500);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId || !activeCustomerForPayment) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/debtors/payment`, { 
        customerId: activeCustomerForPayment.id,
        branchId: user.branchId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method
      }, axiosConfig);
      
      setPrintData({ customer: activeCustomerForPayment, payment: res.data });
      setPrintType('RECEIPT');
      setTimeout(() => window.print(), 500);

      setPaymentForm({ amount: "", method: "BANK" });
      setActiveCustomerForPayment(null);
      fetchData(true);
    } catch (err: any) { alert("Failed to record payment."); } finally { setIsSubmitting(false); }
  };

  // --- DATA AGGREGATION ---
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone && c.phone.includes(searchQuery))
  );

  const pendingInvoices = customers.flatMap(c => 
    c.invoices.filter(inv => inv.balance > 0).map(inv => ({ ...inv, customer: c }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const settlementHistory = customers.flatMap(c => 
    c.payments.map(pay => ({ ...pay, customer: c, type: 'PAYMENT' }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

  const totalOutstanding = pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalPaid = customers.reduce((sum, c) => sum + c.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const openInvoicesCount = pendingInvoices.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Accounts Receivable...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12 animate-in fade-in duration-500 print:m-0 print:p-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight flex items-center">
            <Briefcase className="w-8 h-8 mr-3 text-blue-600" />
            Debtors & Companies
          </h2>
          <p className="text-zinc-500 mt-1 font-medium">Manage Corporate Clients, Invoices, and Debt Recovery.</p>
        </div>
        <button onClick={() => { setCustomerForm({ name: "", phone: "" }); setEditingCustomerId(null); setIsCustomerModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Add Company
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-red-600 p-6 rounded-2xl shadow-lg shadow-red-600/20 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><AlertTriangle className="w-32 h-32" /></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-red-200 uppercase tracking-widest mb-1">Total Outstanding Debt</p>
            <h3 className="text-4xl font-black tracking-tight">TZS {totalOutstanding.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Banknote className="w-32 h-32" /></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-emerald-200 uppercase tracking-widest mb-1">Total Amount Paid</p>
            <h3 className="text-4xl font-black tracking-tight">TZS {totalPaid.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm text-zinc-900 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><FileText className="w-32 h-32" /></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Open Invoices</p>
            <h3 className="text-4xl font-black tracking-tight">{openInvoicesCount}</h3>
          </div>
        </div>
      </div>

      {/* PENDING INVOICES TABLE */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-red-50/50 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          <h3 className="text-lg font-extrabold text-red-700">Pending Invoices (Outstanding)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Invoice / Details</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Billed Date</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pendingInvoices.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-500 font-medium">No outstanding invoices. Excellent!</td></tr>
              ) : (
                pendingInvoices.map((inv) => {
                  const daysAgo = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  const badgeClass = daysAgo > 30 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200';
                  
                  return (
                    <tr key={inv.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900">{inv.invoiceNum}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Original: TZS {inv.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-700">{inv.customer.name}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-800">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</div>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>{daysAgo} days ago</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-red-600 text-lg">{inv.balance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                        <button onClick={() => setViewRecord({ type: 'INVOICE', data: inv, customer: inv.customer })} className="inline-flex items-center px-3 py-2 bg-white text-zinc-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl border border-zinc-200 transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openSettleModal(inv.customer, inv.balance)} className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Settle</button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteInvoice(inv.id)} className="inline-flex items-center px-3 py-2 bg-white text-zinc-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl border border-zinc-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTLEMENT HISTORY TABLE */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-emerald-50/50 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-emerald-600" />
          <h3 className="text-lg font-extrabold text-emerald-700">Settlement History (Last 20)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Receipt Num</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Settled Date</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {settlementHistory.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-medium">No settlement history found.</td></tr>
              ) : (
                settlementHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4"><div className="font-bold text-zinc-900">{h.receiptNum}</div></td>
                    <td className="px-6 py-4 font-bold text-zinc-700">{h.customer.name}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-800">{new Date(h.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">{h.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center space-x-2 flex justify-center">
                      <button onClick={() => setViewRecord({ type: 'PAYMENT', data: h, customer: h.customer })} className="inline-flex items-center px-3 py-2 bg-white text-zinc-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl border border-zinc-200 transition-colors"><Eye className="w-4 h-4" /></button>
                      {isAdmin && (
                        <button onClick={() => handleDeletePayment(h.id)} className="inline-flex items-center px-3 py-2 bg-white text-zinc-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl border border-zinc-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTERED COMPANIES & FINANCIALS */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-5 border-b border-zinc-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-extrabold text-zinc-900">Registered Companies & Financials</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-right text-red-600">Outstanding</th>
                <th className="px-6 py-4 text-right text-emerald-600">Total Paid</th>
                <th className="px-6 py-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-500">No companies found.</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const outstanding = c.invoices.reduce((sum, inv) => sum + inv.balance, 0);
                  const paid = c.payments.reduce((sum, p) => sum + p.amount, 0);
                  
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-zinc-900">{c.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-zinc-600">{c.phone || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        {outstanding > 0 ? <span className="font-black text-red-600">TZS {outstanding.toLocaleString()}</span> : <span className="text-zinc-400 font-bold">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-emerald-600">TZS {paid.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button onClick={() => { setActiveCustomerForInvoice(c); setInvoiceLines([{ itemId: "", name: "", quantity: 1, price: 0 }]); }} className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Create Invoice"><Plus className="w-5 h-5" /></button>
                        <button onClick={() => openEditCustomer(c)} className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Company"><Edit className="w-5 h-5" /></button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteCustomer(c.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Company"><Trash2 className="w-5 h-5" /></button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VIEW RECORD MODAL --- */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewRecord(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{viewRecord.type === 'INVOICE' ? 'Invoice Summary' : 'Receipt Summary'}</h3>
              <button onClick={() => setViewRecord(null)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{viewRecord.type === 'INVOICE' ? 'Billed Amount' : 'Amount Received'}</p>
                <h2 className="text-3xl font-black text-zinc-900 mt-1">TZS {viewRecord.data.amount.toLocaleString()}</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span className="text-zinc-500 font-bold">Client:</span> <span className="font-extrabold text-zinc-900">{viewRecord.customer.name}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span className="text-zinc-500 font-bold">Ref No:</span> <span className="font-bold text-zinc-800">{viewRecord.data.invoiceNum || viewRecord.data.receiptNum}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span className="text-zinc-500 font-bold">Date:</span> <span className="font-bold text-zinc-800">{new Date(viewRecord.data.createdAt).toLocaleDateString('en-GB')}</span></div>
                {viewRecord.type === 'INVOICE' && <div className="flex justify-between border-b border-zinc-100 pb-2"><span className="text-zinc-500 font-bold">Balance:</span> <span className="font-black text-red-600">TZS {viewRecord.data.balance.toLocaleString()}</span></div>}
              </div>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex gap-3">
              <button onClick={() => setViewRecord(null)} className="flex-1 py-3.5 text-sm font-extrabold bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-xl transition-all">Close</button>
              <button onClick={handlePrintViewRecord} className="flex-1 py-3.5 text-sm font-extrabold bg-zinc-900 text-white hover:bg-black rounded-xl transition-all flex items-center justify-center">
                <Printer className="w-4 h-4 mr-2" /> Print/Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT COMPANY MODAL --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b border-zinc-200 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold">{editingCustomerId ? 'Edit Client' : 'New Corporate Client'}</h3>
              </div>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 text-blue-200 hover:text-white bg-blue-700/50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <form id="customer-form" onSubmit={handleSaveCustomer} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Company Name</label>
                  <input type="text" required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Phone Number</label>
                  <input type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="customer-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-extrabold bg-blue-600 text-white rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Save Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INVOICE GENERATOR MODAL --- */}
      {activeCustomerForInvoice && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCustomerForInvoice(null)} />
          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold">Generate Invoice</h3>
                <p className="text-sm font-medium text-zinc-400">Client: {activeCustomerForInvoice.name}</p>
              </div>
              <button onClick={() => setActiveCustomerForInvoice(null)} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                      <th className="px-4 py-3">Finished Good / Item</th>
                      <th className="px-4 py-3 w-32 text-center">Qty</th>
                      <th className="px-4 py-3 w-40 text-right">Unit Price</th>
                      <th className="px-4 py-3 w-40 text-right">Line Total</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {invoiceLines.map((line, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <select 
                            required 
                            value={line.itemId} 
                            onChange={e => {
                              const selected = stock.find(s => s.item.id === e.target.value);
                              const newLines = [...invoiceLines];
                              newLines[index] = { 
                                ...line, 
                                itemId: e.target.value, 
                                name: selected?.item.name || "", 
                                price: selected?.item.price || 0 
                              };
                              setInvoiceLines(newLines);
                            }} 
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold bg-white"
                          >
                            <option value="">Select Item...</option>
                            {stock.map(s => <option key={s.item.id} value={s.item.id}>{s.item.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="number" min="1" value={line.quantity} onChange={e => {
                            const newLines = [...invoiceLines];
                            newLines[index].quantity = Number(e.target.value);
                            setInvoiceLines(newLines);
                          }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold text-center" />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" value={line.price} onChange={e => {
                            const newLines = [...invoiceLines];
                            newLines[index].price = Number(e.target.value);
                            setInvoiceLines(newLines);
                          }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold text-right" />
                        </td>
                        <td className="p-2 text-right font-black text-zinc-900 bg-zinc-50">
                          {(line.quantity * line.price).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => setInvoiceLines(invoiceLines.filter((_, i) => i !== index))} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center">
                  <button type="button" onClick={() => setInvoiceLines([...invoiceLines, { itemId: "", name: "", quantity: 1, price: 0 }])} className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">+ Add Line Item</button>
                  <h3 className="text-xl font-black text-zinc-900">Total: TZS {invoiceLines.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</h3>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-200 bg-white grid grid-cols-2 gap-4">
              <button onClick={handlePrintProforma} type="button" className="w-full py-4 text-sm font-extrabold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300 rounded-xl transition-all flex items-center justify-center">
                <Printer className="w-4 h-4 mr-2" /> Print Proforma
              </button>
              <button onClick={handleIssueInvoice} disabled={isSubmitting} type="button" className="w-full py-4 text-sm font-extrabold bg-zinc-900 text-white hover:bg-black rounded-xl shadow-lg transition-all flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Generate Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIVE PAYMENT MODAL --- */}
      {activeCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCustomerForPayment(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-emerald-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Receive Payment</h3>
              <button onClick={() => setActiveCustomerForPayment(null)} className="text-emerald-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form id="payment-form" onSubmit={handleRecordPayment} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount Received (TZS)</label>
                  <input type="number" required min="1" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full px-4 py-4 bg-zinc-50 border border-zinc-300 rounded-2xl text-2xl font-black text-emerald-700 outline-none" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Payment Method</label>
                  <select required value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold">
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="MOBILE">Mobile Money</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50">
              <button type="submit" form="payment-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-extrabold bg-emerald-600 text-white rounded-xl shadow-lg transition-all flex items-center justify-center">
                <Banknote className="w-5 h-5 mr-2" /> Save & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SMART PRINT ENGINE --- */}
      {printType && printData && (
        <div className="hidden print:block font-sans text-black max-w-[210mm] mx-auto p-8 relative">
          
          {/* PAID WATERMARK */}
          {printType === 'TAX_INVOICE' && printData.invoice?.status === 'PAID' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
              <div className="text-[150px] font-black text-emerald-600 border-[12px] border-emerald-600 rounded-[3rem] px-12 py-4 transform -rotate-45">
                PAID
              </div>
            </div>
          )}

          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-8 relative z-10">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase text-zinc-900">AntiqueBake</h1>
              <p className="text-sm font-medium text-zinc-600 mt-2 leading-relaxed">
                P.O. Box 1234, Ruiru, Kiambu<br/>
                Tel: +254 700 000 000<br/>
                Email: info@antiquebake.co.ke
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light tracking-widest text-zinc-800 mb-2">
                {printType === 'PROFORMA' ? 'PROFORMA' : printType === 'TAX_INVOICE' ? 'TAX INVOICE' : 'PAYMENT RECEIPT'}
              </h2>
              <div className="bg-zinc-100 p-3 rounded-lg inline-block text-left mt-2">
                {printType === 'RECEIPT' ? (
                  <>
                    <p className="text-sm"><strong className="font-bold">Receipt No:</strong> {printData.payment.receiptNum}</p>
                    <p className="text-sm mt-1"><strong className="font-bold">Date:</strong> {new Date(printData.payment.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm mt-1"><strong className="font-bold">Method:</strong> {printData.payment.method}</p>
                  </>
                ) : (
                  <>
                    {printType === 'TAX_INVOICE' && <p className="text-sm"><strong className="font-bold">Invoice No:</strong> {printData.invoice?.invoiceNum}</p>}
                    <p className="text-sm mt-1"><strong className="font-bold">Date Issued:</strong> {new Date().toLocaleDateString()}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 mb-8 w-1/2 relative z-10">
            <h6 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Billed To:</h6>
            <h4 className="text-xl font-black text-zinc-900 mb-1">{printData.customer.name}</h4>
            <p className="text-sm text-zinc-600">{printData.customer.phone}</p>
          </div>

          <div className="relative z-10">
            {printType === 'RECEIPT' ? (
              <div className="text-center py-20 border-y border-dashed border-zinc-300 mb-12">
                <p className="text-xl font-medium text-zinc-600">Amount Received</p>
                <h1 className="text-5xl font-black text-zinc-900 mt-2">TZS {printData.payment.amount.toLocaleString()}</h1>
                <p className="text-sm font-bold text-zinc-500 mt-4 uppercase tracking-widest">Thank you for your payment!</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse mb-8">
                  <thead>
                    <tr className="bg-zinc-900 text-white text-sm uppercase tracking-wider">
                      <th className="px-4 py-3 font-bold">Description</th>
                      <th className="px-4 py-3 font-bold text-center">Qty</th>
                      <th className="px-4 py-3 font-bold text-right">Unit Price</th>
                      <th className="px-4 py-3 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {printData.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-4 font-bold text-zinc-800">{item.name}</td>
                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                        <td className="px-4 py-4 text-right">{(item.price).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-black text-zinc-900">{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mb-16">
                  <table className="w-64 text-right text-sm">
                    <tbody>
                      <tr>
                        <td className="py-2 text-zinc-500 font-bold uppercase tracking-wider">Subtotal:</td>
                        <td className="py-2 font-bold text-zinc-900">TZS {printData.total?.toLocaleString()}</td>
                      </tr>
                      <tr className="border-t-2 border-zinc-900">
                        <td className="py-3 text-zinc-900 font-black text-lg">TOTAL DUE:</td>
                        <td className="py-3 font-black text-lg text-zinc-900">TZS {printData.total?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-zinc-200 pt-12 mt-12 relative z-10">
            <div className="text-xs text-zinc-500 max-w-sm">
              <strong className="font-bold text-zinc-700">Terms & Conditions:</strong><br/>
              1. {printType === 'PROFORMA' ? 'Quotation valid for 14 days.' : 'Payment due upon receipt.'}<br/>
              2. All rates are inclusive of applicable taxes unless stated otherwise.
            </div>
            <div className="flex gap-16 text-center">
              <div><div className="w-40 border-t border-zinc-900 pt-2 text-xs font-bold uppercase text-zinc-600">Authorized Signature</div></div>
              <div><div className="w-40 border-t border-zinc-900 pt-2 text-xs font-bold uppercase text-zinc-600">Client Signature</div></div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT CSS OVERRIDES */}
      <style type="text/css" media="print">
        {`
          @page { margin: 0; size: auto; }
          html, body { background: white !important; }
          header, nav, aside, [data-testid="sidebar"] { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `}
      </style>
    </div>
  );
}