// web/src/app/dashboard/accounting/reports/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Building,
  Loader2,
  PieChart,
  ArrowRight,
  Download
} from "lucide-react";

interface ExpenseBreakdown {
  name: string;
  amount: number;
}

interface FinancialReport {
  totalRevenue: number;
  totalExpense: number;
  totalAssets: number;
  totalLiabilities: number;
  netProfit: number;
  expenseBreakdown: ExpenseBreakdown[];
}

export default function FinancialReportsPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchReportData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/accounting/reports/${user.branchId}`, axiosConfig);
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load financial report", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Generating Financial Reports...</span>
      </div>
    );
  }

  const profitMargin = report.totalRevenue > 0 
    ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Revenue Analytics</h2>
          <p className="text-zinc-500 mt-1 font-medium">Profit & Loss and Balance Sheet summary for {user?.branchName}.</p>
        </div>
        <button className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center">
          <Download className="w-4 h-4 mr-2" /> Export PDF
        </button>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Gross Revenue</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900">TZS {report.totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Expenses</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900">TZS {report.totalExpense.toLocaleString()}</h3>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Net Profit</p>
            <div className="p-2 bg-white/10 text-bakery-gold rounded-lg"><Wallet className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-white relative z-10">
            TZS {report.netProfit.toLocaleString()}
          </h3>
          <p className="text-xs font-medium text-zinc-400 mt-2 relative z-10">
            <span className={report.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
              {profitMargin}% Margin
            </span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Assets</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-zinc-900">TZS {report.totalAssets.toLocaleString()}</h3>
          <p className="text-xs font-medium text-zinc-500 mt-2">
            Liabilities: TZS {report.totalLiabilities.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profit & Loss Statement */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-bakery-gold" /> Statement of Profit & Loss
            </h3>
          </div>
          <div className="p-6">
            
            {/* Revenue Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-2 mb-3">Revenue</h4>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-zinc-700">Operating Revenue / Sales</span>
                <span className="font-bold text-zinc-900">TZS {report.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-zinc-100 bg-zinc-50/50 px-3 rounded-lg">
                <span className="font-bold text-zinc-900">Total Gross Revenue</span>
                <span className="font-extrabold text-emerald-600">TZS {report.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Expense Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-2 mb-3">Operating Expenses</h4>
              <div className="space-y-1">
                {report.expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-2">No operating expenses recorded.</p>
                ) : (
                  report.expenseBreakdown.map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <span className="font-medium text-zinc-700">{expense.name}</span>
                      <span className="font-bold text-zinc-900">TZS {expense.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between items-center py-3 mt-3 border-t border-zinc-100 bg-zinc-50/50 px-3 rounded-lg">
                <span className="font-bold text-zinc-900">Total Expenses</span>
                <span className="font-extrabold text-red-600">TZS {report.totalExpense.toLocaleString()}</span>
              </div>
            </div>

            {/* Net Income Section */}
            <div className="border-t-2 border-zinc-800 pt-4 mt-2">
              <div className="flex justify-between items-center bg-zinc-900 text-white p-4 rounded-xl">
                <span className="text-lg font-bold">Net Income</span>
                <span className="text-xl font-extrabold">TZS {report.netProfit.toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Visual Expense Breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-bakery-gold" /> Expense Distribution
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {report.expenseBreakdown.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                <PieChart className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">No expense data available.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {report.expenseBreakdown.sort((a,b) => b.amount - a.amount).map((expense, idx) => {
                  const percentage = ((expense.amount / report.totalExpense) * 100).toFixed(1);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-zinc-700">{expense.name}</span>
                        <span className="text-xs font-bold text-zinc-500">{percentage}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2.5">
                        <div 
                          className="bg-bakery-gold h-2.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-zinc-100">
              <button className="w-full py-2.5 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors flex items-center justify-center">
                View Detailed Ledger <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}