"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import {
  BookOpen,
  PlusCircle,
  Filter,
  Printer,
  FileSpreadsheet,
  Paperclip,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  UploadCloud,
  CheckCircle2
} from "lucide-react";

// --- INTERFACES MATCHING PHP STRUCTURE ---
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
  receipt_path?: string | null;
  staff_name?: string;
  created_by?: string;
}

interface DeptStat {
  revenue_point: string;
  income: number;
  expense: number;
}

export default function LedgerDashboardPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Cloudinary Configuration from .env
  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = "erp_receipts"; // You MUST create this "Unsigned" preset in Cloudinary settings

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffList, setStaffList] = useState<{ id: string, username: string }[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<string[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [accountsList, setAccountsList] = useState<{ id: string, code: string, name: string, type: string }[]>([]);

  // UI & Filter State
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<string>("this_month");
  const [dept, setDept] = useState<string>("");
  const [staff, setStaff] = useState<string>("");
  const [customStart, setCustomStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    id: "",
    type: "Expense" as 'Income' | 'Expense',
    revenue_point: "",
    payment_source: "Cash",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    reference: "",
    description: "",
    existing_receipt: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Simulated data fetch based on PHP backend structure requirements
  const fetchLedgerData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch ledger data and accounts concurrently
      const [ledgerRes, accountsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/accounting/ledger/legacy-format`, {
          ...axiosConfig,
          params: { period, dept, staff, start: customStart, end: customEnd }
        }).catch(() => ({
          data: {
            transactions: [],
            opening_balance: 0,
            staff_list: [],
          }
        })),
        axios.get(`${API_URL}/api/v1/accounting/accounts`, axiosConfig).catch(() => ({
          data: { accounts: [] }
        }))
      ]);

      setTransactions(ledgerRes.data.transactions || []);
      setOpeningBalance(ledgerRes.data.opening_balance || 0);
      setStaffList(ledgerRes.data.staff_list || []);
      setAccountsList(accountsRes.data.accounts || []);

    } catch (err) {
      console.error("Failed to fetch ledger or accounts", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, dept, staff, customStart, customEnd, API_URL, axiosConfig]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  // --- CALCULATION ENGINE ---
  const liquidity = transactions.reduce((acc, curr) => {
    const amt = curr.type === 'Income' ? curr.amount : -curr.amount;
    acc[curr.payment_source] = (acc[curr.payment_source] || 0) + amt;
    return acc;
  }, {} as Record<string, number>);

  const cashInVault = (liquidity['Cash'] || 0);
  const mobileMoney = (liquidity['Mpesa'] || 0) + (liquidity['Tigo'] || 0) + (liquidity['Airtel'] || 0);
  const bankCard = (liquidity['Bank'] || 0) + (liquidity['Card'] || 0);

  const deptStats: DeptStat[] = transactions.reduce((acc, curr) => {
    const existing = acc.find(d => d.revenue_point === curr.revenue_point);
    if (existing) {
      if (curr.type === 'Income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({
        revenue_point: curr.revenue_point,
        income: curr.type === 'Income' ? curr.amount : 0,
        expense: curr.type === 'Expense' ? curr.amount : 0
      });
    }
    return acc;
  }, [] as DeptStat[]);

  // --- IMAGE UPLOAD TO CLOUDINARY ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (JPG, PNG, etc).");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME) {
      alert("Cloudinary configuration missing in .env");
      return;
    }

    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'erp_receipts'); // Optional folder organization

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      // Store the returned secure URL
      setUploadedImageUrl(response.data.secure_url);

    } catch (error) {
      console.error("Error uploading to Cloudinary", error);
      alert("Failed to upload image to Cloudinary. Please try again.");
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ACTIONS ---
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Include the Cloudinary URL in the payload as receipt_path
      const finalReceiptPath = uploadedImageUrl || formData.existing_receipt;

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        receipt_path: finalReceiptPath
      };

      if (isEditMode) {
        await axios.patch(`${API_URL}/api/v1/accounting/ledger/legacy-format/${formData.id}`, payload, axiosConfig);
      } else {
        await axios.post(`${API_URL}/api/v1/accounting/ledger/legacy-format`, payload, axiosConfig);
      }

      fetchLedgerData();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await axios.delete(`${API_URL}/api/v1/accounting/ledger/legacy-format/${id}`, axiosConfig);
      fetchLedgerData();
    } catch (err) {
      alert("Failed to delete transaction.");
    }
  };

  const openEditModal = (t: Transaction) => {
    setFormData({
      id: t.id,
      type: t.type,
      revenue_point: t.revenue_point,
      payment_source: t.payment_source,
      date: t.date.split('T')[0],
      amount: t.amount.toString(),
      category: t.category,
      reference: t.reference || "",
      description: t.description,
      existing_receipt: t.receipt_path || ""
    });
    setUploadedImageUrl(t.receipt_path || null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setUploadedImageUrl(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSync = async () => {
    if (!confirm('Run system synchronization for POS & Bookings?')) return;
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/v1/accounting/sync`, {}, axiosConfig);
      fetchLedgerData();
    } catch (err) {
      alert("Sync failed.");
    }
  };

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Dept,Ref #,Category,Description,Source,Income,Expense,Balance\n";

    let currentBal = openingBalance;
    csvContent += `,,,OPENING BALANCE,,,,${openingBalance}\n`;

    transactions.forEach(t => {
      const inc = t.type === 'Income' ? t.amount : 0;
      const exp = t.type === 'Expense' ? t.amount : 0;
      currentBal = currentBal + inc - exp;

      const row = [
        t.date.split('T')[0],
        t.revenue_point,
        t.reference,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.payment_source,
        inc || '-',
        exp || '-',
        currentBal
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `General_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER HELPERS ---
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Cash': return 'bg-zinc-500 text-white';
      case 'Bank':
      case 'Card': return 'bg-zinc-900 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  let runningBalance = openingBalance;

  return (
    <div className="max-w-[90rem] mx-auto space-y-6 relative pb-12 print:m-0 print:p-0 print:max-w-full">

      {/* PRINT HEADER */}
      <div className="hidden print:block text-center mb-6">
        <h3 className="text-2xl font-bold text-black">WinNet ERP</h3>
        <h5 className="text-lg font-semibold text-black">General Ledger Report</h5>
        <p className="text-sm text-black">Period: {customStart} to {customEnd}</p>
        <hr className="my-4 border-black border-2" />
      </div>

      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div>
          <h4 className="text-2xl fw-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> General Ledger
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">Master Financial Record</p>
        </div>
        <button onClick={handleSync} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center text-sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync System
        </button>
      </div>

      {/* LIQUIDITY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm border-0">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">CASH IN VAULT</p>
          <h3 className="text-2xl font-bold mt-2">{cashInVault.toLocaleString()} <span className="text-sm font-medium">TZS</span></h3>
        </div>
        <div className="bg-emerald-600 text-white p-5 rounded-xl shadow-sm border-0">
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">MOBILE MONEY</p>
          <h3 className="text-2xl font-bold mt-2">{mobileMoney.toLocaleString()} <span className="text-sm font-medium">TZS</span></h3>
        </div>
        <div className="bg-zinc-900 text-white p-5 rounded-xl shadow-sm border-0">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">BANK / CARD</p>
          <h3 className="text-2xl font-bold mt-2">{bankCard.toLocaleString()} <span className="text-sm font-medium">TZS</span></h3>
        </div>
        <div
          onClick={openAddModal}
          className="bg-zinc-50 border-2 border-blue-600 border-dashed rounded-xl shadow-sm cursor-pointer hover:bg-blue-50 transition-colors flex flex-col items-center justify-center p-5 group"
        >
          <PlusCircle className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-blue-600">Add Entry</span>
        </div>
      </div>

      {/* FILTER Shop */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm print:hidden">
        <form className="flex flex-wrap gap-3 items-center" onSubmit={(e) => { e.preventDefault(); fetchLedgerData(); }}>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold py-2 px-3 text-zinc-700 min-w-[140px] outline-none focus:border-blue-500">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom</option>
          </select>

          <select value={dept} onChange={(e) => setDept(e.target.value)} className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[160px] outline-none focus:border-blue-500">
            <option value="">All Departments</option>
            <option value="Productions">Productions</option>
            <option value="Shop">Shop</option>
            <option value="Hotel">Hostel</option>
            <option value="General">General Operations</option>
          </select>

          <select value={staff} onChange={(e) => setStaff(e.target.value)} className="form-select bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium py-2 px-3 text-zinc-700 min-w-[140px] outline-none focus:border-blue-500">
            <option value="">All Staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
          </select>

          {period === 'custom' && (
            <div className="flex gap-2 animate-in slide-in-from-left-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm py-2 px-3" />
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-zinc-800 transition-colors">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
            <button type="button" onClick={handleExportExcel} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-200 transition-colors">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
            </button>
            <button type="button" onClick={() => window.print()} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-zinc-200 transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Print
            </button>
          </div>
        </form>
      </div>

      {/* DEPARTMENT STATS */}
      {deptStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 print:hidden">
          {deptStats.map((row) => {
            const net = row.income - row.expense;
            const badgeColor = row.revenue_point === 'Productions' ? 'bg-cyan-100 text-cyan-800' : 'bg-zinc-200 text-zinc-800';

            return (
              <div key={row.revenue_point} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-3">
                <div className="mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{row.revenue_point}</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-emerald-600"><span>In:</span> <strong className="text-sm">{row.income.toLocaleString()}</strong></div>
                  <div className="flex justify-between text-red-600"><span>Out:</span> <strong className="text-sm">{row.expense.toLocaleString()}</strong></div>
                  <div className={`flex justify-between pt-1 mt-1 border-t border-zinc-100 font-bold ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    <span>Net:</span> <span className="text-sm">{net.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRANSACTION TABLE */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="bg-zinc-900 text-white font-bold py-3 px-6 print:bg-zinc-900 print:text-white print:border-b-2 print:border-black">
          Detailed Transaction Log
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold print:bg-white print:text-black">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Income</th>
                <th className="px-4 py-3 text-right">Expense</th>
                <th className="px-4 py-3 text-right font-extrabold">Balance</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 print:text-black">
              <tr className="bg-zinc-50 font-bold print:bg-white">
                <td colSpan={5} className="px-4 py-3 text-zinc-700">OPENING BALANCE</td>
                <td className="px-4 py-3 text-right">{openingBalance.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>

              {transactions.length === 0 && openingBalance === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-400">No transactions found for this period.</td></tr>
              ) : (
                transactions.map((t) => {
                  const inc = t.type === 'Income' ? t.amount : 0;
                  const out = t.type === 'Expense' ? t.amount : 0;
                  runningBalance = runningBalance + inc - out;

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 min-w-[250px]">
                        <div className="font-bold text-zinc-900">
                          {t.category}
                          <span className="text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded ml-2 font-semibold">
                            {t.revenue_point}
                          </span>
                        </div>
                        <div className="text-zinc-500 text-xs truncate max-w-[300px]" title={t.description}>{t.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getSourceBadge(t.payment_source)}`}>
                          {t.payment_source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">{inc > 0 ? inc.toLocaleString() : '-'}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">{out > 0 ? out.toLocaleString() : '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-800">{runningBalance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400 italic text-xs">{t.staff_name || '-'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                        {t.receipt_path && (
                          <a href={t.receipt_path} target="_blank" rel="noreferrer" className="inline-flex p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1">
                            <Paperclip className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => openEditModal(t)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              <tr className="bg-zinc-100 font-extrabold print:bg-white print:border-t-2 print:border-black">
                <td colSpan={5} className="px-4 py-4 text-right text-zinc-700">CLOSING BALANCE</td>
                <td className="px-4 py-4 text-right text-blue-700 border-t-2 border-zinc-300 text-base">{runningBalance.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden print:block mt-12 text-center">
        <hr className="border-black mb-2" />
        <p className="text-xs text-black">General Ledger Generated by WinNet ERP on {new Date().toLocaleString()}</p>
      </div>

      {/* ADD / EDIT TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className={`px-6 py-5 border-b border-zinc-200 flex items-center justify-between ${isEditMode ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-white'}`}>
              <div>
                <h3 className="text-lg font-bold flex items-center">
                  {isEditMode ? <Pencil className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                  {isEditMode ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
              <form id="ledger-form" onSubmit={handleSaveTransaction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Type</label>
                    <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500">
                      <option value="Expense">▼ Expense</option>
                      <option value="Income">▲ Income</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Department</label>
                    <select required value={formData.revenue_point} onChange={e => setFormData({ ...formData, revenue_point: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500">
                      <option value="" disabled>Select...</option>
                      <option value="Productions">Operations</option>
                      <option value="Shop">Shop</option>
                      <option value="Hotel">Hostel</option>
                      <option value="General">General Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Source</label>
                    <select required value={formData.payment_source} onChange={e => setFormData({ ...formData, payment_source: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500">
                      <option value="Cash">Cash</option>
                      <option value="Mpesa">M-Pesa</option>
                      <option value="Tigo">Tigo</option>
                      <option value="Airtel">Airtel</option>
                      <option value="Bank">Bank</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">TZS</span>
                      <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-12 pr-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">Account / Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Select Account...</option>
                      {accountsList.map(acc => (
                        <option key={acc.id} value={acc.name}>
                          {acc.code} - {acc.name} ({acc.type})
                        </option>
                      ))}
                      <option value="POS Sale">POS Sale (System)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-700">Reference (e.g., Receipt #)</label>
                    <input type="text" value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-700">Description</label>
                    <textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Cloudinary Image Upload Section */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-700">{isEditMode && uploadedImageUrl ? 'Current Receipt' : 'Attach File (Images Only)'}</label>

                    {uploadedImageUrl ? (
                      <div className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className="flex items-center text-sm font-medium text-emerald-600">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Receipt Uploaded
                        </div>
                        <div className="flex gap-2">
                          <a href={uploadedImageUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View</a>
                          <button type="button" onClick={removeUploadedImage} className="text-xs font-bold text-red-600 hover:underline">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer disabled:opacity-50"
                        />
                        {isUploadingImage && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-xs font-bold text-blue-600">
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading to CDN...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </form>
            </div>
            <div className="p-5 border-t border-zinc-200 bg-white flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="ledger-form" disabled={isSubmitting || isUploadingImage} className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all flex items-center ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-900 hover:bg-black'} disabled:opacity-70`}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}