// web/src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Building2, 
  MapPin, 
  Hash, 
  Loader2, 
  Plus, 
  Store,
  Users
} from "lucide-react";

interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string | null;
  isMain: boolean;
  _count?: {
    users: number;
  };
}

export default function BranchManagementPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [isMain, setIsMain] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configure Axios Authorization Header
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchBranches = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setError(null);
      
      // 1. Fetch the current user's branch to determine their Organization ID
      const userBranchRes = await axios.get(
        `${API_URL}/api/v1/branches/${user.branchId}`, 
        axiosConfig
      );
      const currentOrgId = userBranchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      // 2. Fetch all branches belonging to that Organization
      const branchesRes = await axios.get(
        `${API_URL}/api/v1/branches/organization/${currentOrgId}`,
        axiosConfig
      );
      
      setBranches(branchesRes.data);
    } catch (err: any) {
      setError("Failed to load network data. Ensure the API is running.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(
        `${API_URL}/api/v1/branches`,
        {
          organizationId,
          name,
          code,
          address,
          isMain,
        },
        axiosConfig
      );

      setSuccess(`Branch "${name}" successfully registered.`);
      setName("");
      setCode("");
      setAddress("");
      setIsMain(false);
      
      // Refresh the branch list
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create branch.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-bakery-gold" />
        <span className="font-medium text-lg">Synchronizing network data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Network Architecture</h2>
        <p className="text-zinc-500 mt-1 font-medium">
          Manage organizational branches, warehouses, and retail locations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Add New Branch Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden sticky top-6">
            <div className="bg-zinc-950 px-6 py-5 border-b border-zinc-800 flex items-center">
              <Plus className="w-5 h-5 text-bakery-gold mr-2" />
              <h3 className="text-lg font-bold text-white">Register New Location</h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCreateBranch} className="space-y-5">
                
                {error && (
                  <div className="p-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Location Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dar es Salaam Hub" 
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Branch Code</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. HUB-DAR-01" 
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <textarea 
                      required value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full street address..." rows={3}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all resize-none"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-3 p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                  <input 
                    type="checkbox" checked={isMain} onChange={(e) => setIsMain(e.target.checked)}
                    className="w-4 h-4 text-bakery-gold border-gray-300 rounded focus:ring-bakery-gold"
                  />
                  <span className="text-sm font-semibold text-zinc-700">Designate as Main Headquarters</span>
                </label>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 mt-2 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</> : "Deploy Branch"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Branches Grid */}
        <div className="lg:col-span-2 space-y-4">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col sm:flex-row sm:items-center justify-between group relative overflow-hidden">
              
              {/* Main HQ Indicator */}
              {branch.isMain && (
                <div className="absolute top-0 right-0 bg-bakery-gold text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl z-10">
                  Headquarters
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${branch.isMain ? 'bg-bakery-gold/20 text-bakery-brown' : 'bg-zinc-100 text-zinc-500'}`}>
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-zinc-900">{branch.name}</h4>
                  <div className="flex items-center text-sm font-medium text-zinc-500 mt-1 space-x-3">
                    <span className="flex items-center"><Hash className="w-3.5 h-3.5 mr-1" /> {branch.code}</span>
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {branch.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 sm:text-right flex items-center sm:block bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-zinc-100">
                <div className="flex items-center text-zinc-600 sm:justify-end">
                  <Users className="w-4 h-4 mr-1.5 text-zinc-400" />
                  <span className="font-bold">{branch._count?.users || 0}</span>
                  <span className="text-xs font-medium ml-1 text-zinc-400 uppercase tracking-wider">Staff</span>
                </div>
                <button className="ml-auto sm:ml-0 sm:mt-2 text-sm font-semibold text-bakery-brown hover:text-bakery-gold transition-colors">
                  Manage Facility &rarr;
                </button>
              </div>

            </div>
          ))}

          {branches.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
              <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-900">No Branches Found</h3>
              <p className="text-zinc-500 text-sm mt-1">Register a new branch using the form to establish your network.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}