// web/src/app/dashboard/accounting/debtors/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  TrendingDown,
  AlertTriangle,
  Banknote
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
  amount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  invoices: Invoice[];
  payments: Payment[];
}

export default function DebtorsDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [activeCustomerForInvoice, setActiveCustomerForInvoice] = useState<string | null>(null);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<string | null>(null);
  
  // Forms
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [invoiceForm, setInvoiceForm] = useState({ amount: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "CASH" });

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchDebtorsData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const res = await axios.get(`${API_URL}/api/v1/debtors/customers/${currentOrgId}`, axiosConfig);
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to load debtors data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchDebtorsData();
  }, [fetchDebtorsData]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/debtors/customer`, { ...customerForm, organizationId }, axiosConfig);
      setCustomerForm({ name: "", phone: "" });
      fetchDebtorsData();
      setIsCustomerModalOpen(false);
    } catch (err: any) {
      alert("Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId || !activeCustomerForInvoice) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/debtors/invoice`, { 
        customerId: activeCustomerForInvoice,
        branchId: user.branchId,
        amount: Number(invoiceForm.amount)
      }, axiosConfig);
      setInvoiceForm({ amount: "" });
      fetchDebtorsData();
      setActiveCustomerForInvoice(null);
    } catch (err: any) {
      alert("Failed to issue invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId || !activeCustomerForPayment) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/debtors/payment`, { 
        customerId: activeCustomerForPayment,
        branchId: user.branchId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method
      }, axiosConfig);
      setPaymentForm({ amount: "", method: "CASH" });
      fetchDebtorsData();
      setActiveCustomerForPayment(null);
    } catch (err: any) {
      alert("Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const totalOutstanding = customers.reduce((sum, customer) => {
    const balance = customer.invoices.reduce((invSum, inv) => invSum + inv.balance, 0);
    return sum + balance;
  }, 0);

  const totalCustomersWithDebt = customers.filter(c => c.invoices.reduce((sum, inv) => sum + inv.balance, 0) > 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Accounts Receivable...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Accounts Receivable</h2>
          <p className="text-zinc-500 mt-1 font-medium">Manage credit clients, invoices, and debt recovery.</p>
        </div>
        <button onClick={() => setIsCustomerModalOpen(true)} className="bg-bakery-brown hover:bg-bakery-chocolate text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Add Client
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Total Outstanding</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">TZS {totalOutstanding.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Debtors</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{totalCustomersWithDebt} Clients</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">All-Time Recovered</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">
              TZS {customers.reduce((sum, c) => sum + c.payments.reduce((ps, p) => ps + p.amount, 0), 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Total Billed</th>
                <th className="px-6 py-4">Outstanding Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    No clients found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const billed = customer.invoices.reduce((sum, inv) => sum + inv.amount, 0);
                  const balance = customer.invoices.reduce((sum, inv) => sum + inv.balance, 0);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900">{customer.name}</p>
                        <p className="text-xs text-zinc-500">{customer.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-700">
                        TZS {billed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-extrabold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          TZS {balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setActiveCustomerForInvoice(customer.id)} className="inline-flex items-center px-3 py-1.5 bg-white text-zinc-700 hover:bg-zinc-100 font-semibold text-xs rounded-lg transition-colors border border-zinc-200">
                          <FileText className="w-3.5 h-3.5 mr-1.5" /> Invoice
                        </button>
                        <button onClick={() => setActiveCustomerForPayment(customer.id)} className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors border border-emerald-200">
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Receive Payment
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD CLIENT */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Add Credit Client</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="customer-form" onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Client Name</label>
                  <input type="text" required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm" placeholder="e.g. John Doe Wholesale" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Phone Number</label>
                  <input type="text" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200">
              <button type="submit" form="customer-form" disabled={isSubmitting} className="w-full py-3 text-sm font-bold bg-bakery-brown text-white rounded-xl">Save Client</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE INVOICE */}
      {activeCustomerForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCustomerForInvoice(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Issue Invoice</h3>
              <button onClick={() => setActiveCustomerForInvoice(null)} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form id="invoice-form" onSubmit={handleIssueInvoice} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Invoice Amount (TZS)</label>
                  <input type="number" required min="1" value={invoiceForm.amount} onChange={e => setInvoiceForm({amount: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900" placeholder="0" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50">
              <button type="submit" form="invoice-form" disabled={isSubmitting} className="w-full py-2.5 text-sm font-bold bg-zinc-900 text-white rounded-xl">Generate Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {activeCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveCustomerForPayment(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Receive Payment</h3>
              <button onClick={() => setActiveCustomerForPayment(null)} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form id="payment-form" onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Payment Amount (TZS)</label>
                  <input type="number" required min="1" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-lg font-bold text-emerald-700" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Payment Method</label>
                  <select required value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm">
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="MOBILE">Mobile Money</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50">
              <button type="submit" form="payment-form" disabled={isSubmitting} className="w-full py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center">
                <Banknote className="w-4 h-4 mr-2" /> Record Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}