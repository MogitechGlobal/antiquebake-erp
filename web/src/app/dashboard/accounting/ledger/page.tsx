// web/src/app/dashboard/accounting/ledger/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  BookOpen, 
  Plus, 
  Search, 
  FileText,
  Landmark,
  Loader2,
  X,
  Calculator,
  ArrowRightLeft
} from "lucide-react";

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

export default function LedgerDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms
  const [accountForm, setAccountForm] = useState({ code: "", name: "", type: "ASSET" });
  const [journalForm, setJournalForm] = useState({ description: "" });
  const [journalLines, setJournalLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" }
  ]);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchLedgerData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [ledgerRes, accountsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/accounting/ledger/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/accounting/accounts/${currentOrgId}`, axiosConfig)
      ]);
      
      setLedger(ledgerRes.data);
      setAccounts(accountsRes.data);
    } catch (err) {
      console.error("Failed to load accounting data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  // Handle Chart of Accounts Creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/accounting/account`, { ...accountForm, organizationId }, axiosConfig);
      setAccountForm({ code: "", name: "", type: "ASSET" });
      fetchLedgerData();
      setIsAccountModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Journal Posting
  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId) return;
    
    const validLines = journalLines
      .filter(line => line.accountId)
      .map(line => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }));

    if (validLines.length < 2) {
      alert("A journal entry requires at least two lines.");
      return;
    }

    const totalDebit = validLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = validLines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Imbalance: Debits (TZS ${totalDebit}) must equal Credits (TZS ${totalCredit}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/accounting/journal`, { 
        branchId: user.branchId,
        description: journalForm.description,
        entries: validLines 
      }, axiosConfig);
      
      setJournalForm({ description: "" });
      setJournalLines([{ accountId: "", debit: "", credit: "" }, { accountId: "", debit: "", credit: "" }]);
      fetchLedgerData();
      setIsJournalModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post journal entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLedger = ledger.filter(entry => 
    entry.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDebits = ledger.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = ledger.reduce((sum, entry) => sum + entry.credit, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Financial Ledgers...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">General Ledger</h2>
          <p className="text-zinc-500 mt-1 font-medium">Double-entry accounting records for {user?.branchName}.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsAccountModalOpen(true)} className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center">
            <Landmark className="w-4 h-4 mr-2" /> Add COA
          </button>
          <button onClick={() => setIsJournalModalOpen(true)} className="bg-zinc-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2" /> Post Journal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-zinc-100 text-zinc-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Ledger Entries</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{ledger.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Plus className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Total Debits</p>
            <h3 className="text-xl font-extrabold text-zinc-900">TZS {totalDebits.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Plus className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Total Credits</p>
            <h3 className="text-xl font-extrabold text-zinc-900">TZS {totalCredits.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Calculator className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Active Accounts</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{accounts.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search journals or accounts..." 
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
                <th className="px-6 py-4">Date & Ref</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{new Date(entry.entryDate).toLocaleDateString()}</p>
                      <p className="text-xs font-medium text-zinc-500 mt-0.5">{entry.transactionId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-700">{entry.account.code} - {entry.account.name}</p>
                      <p className="text-xs text-zinc-500">{entry.account.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-700">
                      {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-amber-700">
                      {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: POST JOURNAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsJournalModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Post Journal Entry</h3>
              <button onClick={() => setIsJournalModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="journal-form" onSubmit={handlePostJournal}>
                <div className="space-y-1.5 mb-6">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Journal Description / Narration</label>
                  <input type="text" required value={journalForm.description} onChange={e => setJournalForm({description: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm" placeholder="e.g. Paid utility bill via bank" />
                </div>
                
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900">Lines</h4>
                    <button type="button" onClick={() => setJournalLines([...journalLines, { accountId: "", debit: "", credit: "" }])} className="text-xs font-bold text-blue-600">+ Add Line</button>
                  </div>
                  {journalLines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-start bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      <div className="flex-1">
                        <select required value={line.accountId} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].accountId = e.target.value; setJournalLines(newLines);
                        }} className="w-full px-2 py-1.5 border border-zinc-300 rounded text-sm">
                          <option value="">Select account...</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </div>
                      <input type="number" step="0.01" min="0" placeholder="Debit" value={line.debit} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].debit = e.target.value; newLines[index].credit = ""; setJournalLines(newLines);
                      }} className="w-24 px-2 py-1.5 border border-zinc-300 rounded text-sm disabled:bg-zinc-100" disabled={!!line.credit} />
                      <input type="number" step="0.01" min="0" placeholder="Credit" value={line.credit} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].credit = e.target.value; newLines[index].debit = ""; setJournalLines(newLines);
                      }} className="w-24 px-2 py-1.5 border border-zinc-300 rounded text-sm disabled:bg-zinc-100" disabled={!!line.debit} />
                      <button type="button" onClick={() => setJournalLines(journalLines.filter((_, i) => i !== index))} className="p-1.5 text-zinc-400 hover:text-red-500 mt-0.5"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="journal-form" disabled={isSubmitting} className="w-full py-3 text-sm font-bold bg-zinc-900 hover:bg-black text-white rounded-xl">Post Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAccountModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Add Chart of Account</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="account-form" onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Account Code</label>
                  <input type="text" required value={accountForm.code} onChange={e => setAccountForm({...accountForm, code: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm" placeholder="e.g. 1000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Account Name</label>
                  <input type="text" required value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm" placeholder="e.g. Cash in Bank" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Account Type</label>
                  <select required value={accountForm.type} onChange={e => setAccountForm({...accountForm, type: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm">
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200">
              <button type="submit" form="account-form" disabled={isSubmitting} className="w-full py-3 text-sm font-bold bg-zinc-900 text-white rounded-xl">Save Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}