"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  BookOpen, 
  PlusCircle, 
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Search
} from "lucide-react";

// --- INTERFACES MATCHING PRISMA SCHEMA ---
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  organizationId: string;
}

export default function ChartOfAccountsPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // UI & Modal State
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    id: "",
    code: "",
    name: "",
    type: "ASSET" as Account['type'],
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // --- DATA FETCHING ---
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming a standard REST endpoint for the Account model
      const res = await axios.get(`${API_URL}/api/v1/accounting/accounts`, axiosConfig);
      setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
      // Fallback for UI testing if endpoint doesn't exist yet
      setAccounts([
        { id: "1", code: "1000", name: "Cash in Vault", type: "ASSET", organizationId: "org_1" },
        { id: "2", code: "4000", name: "Sales Revenue", type: "REVENUE", organizationId: "org_1" },
        { id: "3", code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", organizationId: "org_1" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, axiosConfig]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // --- ACTIONS ---
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = { 
        code: formData.code,
        name: formData.name,
        type: formData.type
      };
      
      if (isEditMode) {
        await axios.patch(`${API_URL}/api/v1/accounting/accounts/${formData.id}`, payload, axiosConfig);
      } else {
        await axios.post(`${API_URL}/api/v1/accounting/accounts`, payload, axiosConfig);
      }
      
      fetchAccounts();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? It may affect historical ledger entries.')) return;
    try {
      await axios.delete(`${API_URL}/api/v1/accounting/accounts/${id}`, axiosConfig);
      fetchAccounts();
    } catch (err) {
      alert("Failed to delete account.");
    }
  };

  const openEditModal = (acc: Account) => {
    setFormData({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Filter accounts based on search
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.code.includes(searchTerm)
  );

  // --- RENDER HELPERS ---
  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'ASSET': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LIABILITY': return 'bg-red-100 text-red-800 border-red-200';
      case 'EQUITY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REVENUE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EXPENSE': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  return (
    <div className="max-w-[90rem] mx-auto space-y-6 relative pb-12">
      
      {/* HEADER ROW */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h4 className="text-2xl fw-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Chart of Accounts
          </h4>
          <p className="text-sm text-zinc-500 font-medium mt-1">Manage foundational financial categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAccounts} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center text-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center text-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> New Account
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-sm flex items-center gap-2">
        <Search className="w-5 h-5 text-zinc-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by account name or code..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-1 px-2 text-zinc-700 placeholder-zinc-400"
        />
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-zinc-900 text-white font-bold py-3 px-6">
          Account Directory
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-3 w-32">Code</th>
                <th className="px-6 py-3">Account Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400">No accounts found.</td></tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-600">{acc.code}</td>
                    <td className="px-6 py-4 font-bold text-zinc-900">{acc.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getTypeBadge(acc.type)}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => openEditModal(acc)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(acc.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className={`px-6 py-5 border-b border-zinc-200 flex items-center justify-between ${isEditMode ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-white'}`}>
              <div>
                <h3 className="text-lg font-bold flex items-center">
                  {isEditMode ? <Pencil className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                  {isEditMode ? 'Edit Account' : 'New Account'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
              <form id="account-form" onSubmit={handleSaveAccount} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Account Code</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., 1000"
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                  />
                  <p className="text-[10px] text-zinc-500">A unique numerical identifier for this account.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Account Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Cash in Vault"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                  />
                </div>
                  
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Account Type</label>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as Account['type']})} 
                    className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  >
                    <option value="ASSET">Asset (e.g., Cash, Inventory)</option>
                    <option value="LIABILITY">Liability (e.g., Loans, Payables)</option>
                    <option value="EQUITY">Equity (e.g., Retained Earnings)</option>
                    <option value="REVENUE">Revenue (e.g., Sales, Interest)</option>
                    <option value="EXPENSE">Expense (e.g., Rent, Utilities)</option>
                  </select>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-zinc-200 bg-white flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="account-form" disabled={isSubmitting} className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all flex items-center ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-900 hover:bg-black'} disabled:opacity-70`}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}