// web/src/app/dashboard/accounting/ledger/page.tsx
"use client";

// FIXED: Added 'React' to the import statement
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Landmark,
  Loader2,
  X,
  Calculator,
  ArrowRightLeft,
  Calendar,
  Filter,
  Wallet,
  Building,
  TrendingDown,
  TrendingUp,
  ListTree
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
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI & Filter State
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'COA'>('LEDGER');
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<string>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Modal State
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms
  const [accountForm, setAccountForm] = useState({ code: "", name: "", type: "ASSET" });
  const [journalForm, setJournalForm] = useState({ description: "", entryDate: new Date().toISOString().split('T')[0] });
  const [journalLines, setJournalLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" }
  ]);

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

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
  }, [user?.branchId, token, API_URL, axiosConfig]);

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
        entryDate: new Date(journalForm.entryDate).toISOString(), 
        entries: validLines 
      }, axiosConfig);
      
      setJournalForm({ description: "", entryDate: new Date().toISOString().split('T')[0] });
      setJournalLines([{ accountId: "", debit: "", credit: "" }, { accountId: "", debit: "", credit: "" }]);
      fetchLedgerData();
      setIsJournalModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post journal entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTER LOGIC ---
  const isDateInPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); 
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

    switch (period) {
      case 'today': return d >= startOfToday;
      case 'yesterday': return d >= startOfYesterday && d < startOfToday;
      case 'this_week': return d >= startOfWeek;
      case 'this_month': return d >= startOfMonth;
      case 'last_month': return d >= startOfLastMonth && d < startOfMonth;
      case 'this_year': return d >= startOfYear;
      case 'last_year': return d >= startOfLastYear && d < startOfYear;
      case 'custom': 
        const cStart = new Date(customStartDate); cStart.setHours(0,0,0,0);
        const cEnd = new Date(customEndDate); cEnd.setHours(23,59,59,999);
        return d >= cStart && d <= cEnd;
      default: return true;
    }
  };

  const filteredLedger = ledger.filter(entry => {
    const matchesDate = isDateInPeriod(entry.entryDate);
    const matchesSearch = 
      entry.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    acc.code.includes(searchQuery)
  );

  const totalDebits = filteredLedger.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = filteredLedger.reduce((sum, entry) => sum + entry.credit, 0);

  // Group ledger by Transaction ID for structured view
  const groupedLedger = filteredLedger.reduce((acc, curr) => {
    if (!acc[curr.transactionId]) acc[curr.transactionId] = [];
    acc[curr.transactionId].push(curr);
    return acc;
  }, {} as Record<string, LedgerEntry[]>);

  const getAccountBadge = (type: string) => {
    switch(type.toUpperCase()) {
      case 'ASSET': return 'bg-success text-white';
      case 'LIABILITY': return 'bg-danger text-white';
      case 'EQUITY': return 'bg-primary text-white';
      case 'REVENUE': return 'bg-info text-dark';
      case 'EXPENSE': return 'bg-warning text-dark';
      default: return 'bg-secondary text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Financial Ledgers...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12 animate-in fade-in duration-500">
      
      {/* EXECUTIVE BANNER */}
      <div className="bg-zinc-950 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between border border-zinc-800">
        <div className="absolute right-0 top-0 w-[30rem] h-[30rem] bg-bakery-gold/10 rounded-full blur-[100px] -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-bakery-gold text-xs font-bold uppercase tracking-widest mb-4">
            <BookOpen className="w-3.5 h-3.5 mr-2" />
            Master Financial Record
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            General Ledger & COA
          </h2>
          <p className="text-zinc-400 mt-2 font-medium text-lg">
            Double-entry accounting protocols for <strong className="text-white">{user?.branchName}</strong>.
          </p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 z-10">
          <button onClick={() => setIsAccountModalOpen(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center">
            <Landmark className="w-4 h-4 mr-2 text-bakery-gold" /> Add COA
          </button>
          <button onClick={() => setIsJournalModalOpen(true)} className="bg-bakery-gold hover:bg-yellow-500 text-zinc-950 px-6 py-3 rounded-xl font-extrabold shadow-xl shadow-bakery-gold/20 transition-all flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Post Journal Entry
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Debits</p>
            <h3 className="text-2xl font-black text-zinc-900">TZS {totalDebits.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Credits</p>
            <h3 className="text-2xl font-black text-zinc-900">TZS {totalCredits.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Net Movement</p>
            <h3 className="text-2xl font-black text-emerald-600">TZS {Math.abs(totalDebits - totalCredits).toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10"></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Active Accounts</p>
            <h3 className="text-2xl font-black text-zinc-900">{accounts.length} COA</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Building className="w-6 h-6" /></div>
        </div>
      </div>

      {/* FILTER & TAB BAR */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between z-20 relative">
        
        {/* TABS */}
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('LEDGER')} 
            className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'LEDGER' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            General Ledger
          </button>
          <button 
            onClick={() => setActiveTab('COA')} 
            className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'COA' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Chart of Accounts
          </button>
        </div>

        {/* FILTERS (Only show if Ledger is active) */}
        {activeTab === 'LEDGER' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-bakery-gold appearance-none">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {period === 'custom' && (
              <div className="flex gap-2 animate-in slide-in-from-left-2">
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-bakery-gold" />
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-bakery-gold" />
              </div>
            )}
          </div>
        )}

        {/* COA Search */}
        {activeTab === 'COA' && (
           <div className="relative w-full lg:w-96">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
             <input type="text" placeholder="Search accounts by code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
           </div>
        )}
      </div>

      {/* TAB CONTENT: GENERAL LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Date & Ref</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Account Affected</th>
                  <th className="px-6 py-4 text-right">Debit (TZS)</th>
                  <th className="px-6 py-4 text-right">Credit (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Object.keys(groupedLedger).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                      <p className="font-bold">No transactions found for this period.</p>
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedLedger).map(([txId, lines]) => (
                    <React.Fragment key={txId}>
                      {lines.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                          {idx === 0 && (
                            <td className="px-6 py-4 align-top" rowSpan={lines.length}>
                              <p className="font-bold text-zinc-900">{new Date(entry.entryDate).toLocaleDateString('en-GB')}</p>
                              <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 inline-block">{entry.transactionId}</p>
                            </td>
                          )}
                          {idx === 0 && (
                            <td className="px-6 py-4 align-top text-sm font-semibold text-zinc-700" rowSpan={lines.length}>
                              {entry.description}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-2 uppercase tracking-widest ${getAccountBadge(entry.account.type)}`}>
                                {entry.account.type}
                              </span>
                              <p className="font-bold text-zinc-800">{entry.account.code} - {entry.account.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-blue-600">
                            {entry.debit > 0 ? entry.debit.toLocaleString() : ''}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-amber-600">
                            {entry.credit > 0 ? entry.credit.toLocaleString() : ''}
                          </td>
                        </tr>
                      ))}
                      {/* Divider between transaction blocks */}
                      <tr className="border-t-2 border-zinc-100"><td colSpan={5} className="p-0"></td></tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHART OF ACCOUNTS */}
      {activeTab === 'COA' && (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Account Code</th>
                  <th className="px-6 py-4">Account Name</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <ListTree className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                      <p className="font-bold">No accounts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900">{acc.code}</td>
                      <td className="px-6 py-4 font-bold text-zinc-800">{acc.name}</td>
                      <td className="px-6 py-4">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${getAccountBadge(acc.type)}`}>
                           {acc.type}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: POST JOURNAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsJournalModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">Post Journal Entry</h3>
                <p className="text-sm font-medium text-zinc-500">Record a manual double-entry transaction.</p>
              </div>
              <button onClick={() => setIsJournalModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <form id="journal-form" onSubmit={handlePostJournal}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Entry Date</label>
                    <input type="date" required value={journalForm.entryDate} onChange={e => setJournalForm({...journalForm, entryDate: e.target.value})} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Description / Narration</label>
                    <input type="text" required value={journalForm.description} onChange={e => setJournalForm({...journalForm, description: e.target.value})} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" placeholder="e.g. Paid utility bill" />
                  </div>
                </div>
                
                <div className="space-y-3 border-t border-zinc-100 pt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-zinc-900">Ledger Lines</h4>
                    <button type="button" onClick={() => setJournalLines([...journalLines, { accountId: "", debit: "", credit: "" }])} className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">+ Add Line</button>
                  </div>
                  {journalLines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-start bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                      <div className="flex-1">
                        <select required value={line.accountId} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].accountId = e.target.value; setJournalLines(newLines);
                        }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold bg-zinc-50">
                          <option value="">Select account...</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </div>
                      <input type="number" step="0.01" min="0" placeholder="Debit" value={line.debit} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].debit = e.target.value; newLines[index].credit = ""; setJournalLines(newLines);
                      }} className="w-28 px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold placeholder:font-medium disabled:bg-zinc-100 disabled:opacity-50" disabled={!!line.credit} />
                      <input type="number" step="0.01" min="0" placeholder="Credit" value={line.credit} onChange={e => {
                          const newLines = [...journalLines]; newLines[index].credit = e.target.value; newLines[index].debit = ""; setJournalLines(newLines);
                      }} className="w-28 px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold placeholder:font-medium disabled:bg-zinc-100 disabled:opacity-50" disabled={!!line.debit} />
                      <button type="button" onClick={() => setJournalLines(journalLines.filter((_, i) => i !== index))} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="journal-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-extrabold bg-zinc-900 hover:bg-black text-white rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Execute Journal Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAccountModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900">Add Chart of Account</h3>
                <p className="text-sm font-medium text-zinc-500">Define a new ledger account.</p>
              </div>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <form id="account-form" onSubmit={handleCreateAccount} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Account Code</label>
                  <input type="text" required value={accountForm.code} onChange={e => setAccountForm({...accountForm, code: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" placeholder="e.g. 1000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Account Name</label>
                  <input type="text" required value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold" placeholder="e.g. Cash in Bank" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Account Classification</label>
                  <select required value={accountForm.type} onChange={e => setAccountForm({...accountForm, type: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold">
                    <option value="ASSET">Asset (Cash, Receivables)</option>
                    <option value="LIABILITY">Liability (Payables, Debt)</option>
                    <option value="EQUITY">Equity (Capital, Retained Earnings)</option>
                    <option value="REVENUE">Revenue (Sales, Income)</option>
                    <option value="EXPENSE">Expense (COGS, Operating Expenses)</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="account-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-extrabold bg-zinc-900 text-white rounded-xl shadow-lg transition-all active:scale-[0.98]">
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}