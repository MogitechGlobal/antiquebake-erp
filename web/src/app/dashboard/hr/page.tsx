// web/src/app/dashboard/hr/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Shield, 
  Store,
  Loader2,
  X,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  email: string;
  isActive: boolean;
  role: Role;
  branch: Branch;
  staff: {
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

export default function HRDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Data State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    roleId: "",
    branchId: "",
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchHRData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setIsLoading(true);
      
      // 1. Get Organization ID
      const branchRes = await axios.get(`http://localhost:3001/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      // 2. Fetch Staff, Branches, and Roles concurrently
      const [staffRes, branchesRes, rolesRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/v1/staff/organization/${currentOrgId}`, axiosConfig),
        axios.get(`http://localhost:3001/api/v1/branches/organization/${currentOrgId}`, axiosConfig),
        axios.get(`http://localhost:3001/api/v1/roles`, axiosConfig).catch(() => ({ data: [] })) // Fallback if roles API is missing
      ]);
      
      setStaffList(staffRes.data);
      setBranches(branchesRes.data);
      setRoles(rolesRes.data);
      
    } catch (err) {
      console.error("Failed to load HR data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token]);

  useEffect(() => {
    fetchHRData();
  }, [fetchHRData]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post("http://localhost:3001/api/v1/staff", formData, axiosConfig);
      
      setSuccess(`${formData.firstName} ${formData.lastName} has been successfully provisioned.`);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "", roleId: "", branchId: "" });
      
      // Refresh the table
      fetchHRData();
      
      // Close modal after short delay
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create employee record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter staff based on search query
  const filteredStaff = staffList.filter(member => 
    `${member.staff.firstName} ${member.staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Loading Roster...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Human Resources</h2>
          <p className="text-zinc-500 mt-1 font-medium">
            Manage staff credentials, role assignments, and branch deployments.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-bakery-brown hover:bg-bakery-chocolate text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-bakery-brown/20 transition-all active:scale-95 flex items-center justify-center"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Provision Staff
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Total Workforce</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{staffList.length} Personnel</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">Active Accounts</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">{staffList.filter(s => s.isActive).length} Active</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Shield className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-bold text-zinc-500 uppercase">System Admins</p>
            <h3 className="text-2xl font-extrabold text-zinc-900">
              {staffList.filter(s => s.role.name.includes('Admin')).length} Accounts
            </h3>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
            />
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Role & Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No personnel found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-bakery-gold/20 text-bakery-brown flex items-center justify-center font-bold border border-bakery-gold/30">
                          {member.staff.firstName[0]}{member.staff.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{member.staff.firstName} {member.staff.lastName}</p>
                          <p className="text-xs font-medium text-zinc-500">ID: {member.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-zinc-600">
                          <Mail className="w-3.5 h-3.5 mr-2 text-zinc-400" /> {member.email}
                        </div>
                        <div className="flex items-center text-sm text-zinc-600">
                          <Phone className="w-3.5 h-3.5 mr-2 text-zinc-400" /> {member.staff.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm font-bold text-zinc-700">
                          <Shield className="w-3.5 h-3.5 mr-2 text-bakery-gold" /> {member.role.name}
                        </div>
                        <div className="flex items-center text-sm font-medium text-zinc-500">
                          <Store className="w-3.5 h-3.5 mr-2 text-zinc-400" /> {member.branch.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        member.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-bakery-brown transition-colors rounded-lg hover:bg-zinc-100">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modal for Adding Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Provision New Staff</h3>
                <p className="text-sm font-medium text-zinc-500">Generate credentials for a new employee.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="staff-form" onSubmit={handleCreateStaff} className="space-y-5">
                
                {error && <div className="p-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                {success && <div className="p-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">First Name</label>
                    <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Last Name</label>
                    <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Initial Password</label>
                  <input type="password" required minLength={8} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">System Role</label>
                  <select required value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all">
                    <option value="">Select a role...</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Assigned Branch</label>
                  <select required value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold focus:border-bakery-gold transition-all">
                    <option value="">Select a branch...</option>
                    {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button 
                type="submit" 
                form="staff-form"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</> : "Generate Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}