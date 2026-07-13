// web/src/app/dashboard/hr/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  KeyRound,
  ShieldAlert
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description?: string;
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
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

// Fallback roles injected directly from the database schema to ensure the dropdown NEVER fails
const FALLBACK_ROLES: Role[] = [
  { id: "9a5a9c24-ae0b-485c-82cc-e8ae187cdba8", name: "Super Admin" },
  { id: "a1b2c3d4-7777-485c-82cc-e8ae187cdba7", name: "Admin" },
  { id: "f2e1a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b", name: "Branch Manager" },
  { id: "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f", name: "Cashier" },
  { id: "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b", name: "Inventory Clerk" },
  { id: "b1b2c3d4-1111-485c-82cc-e8ae187cdba1", name: "Baker - Oven Handler" },
  { id: "b1b2c3d4-2222-485c-82cc-e8ae187cdba2", name: "Baker/Mixer Machine Handler" },
  { id: "b1b2c3d4-3333-485c-82cc-e8ae187cdba3", name: "Cook - Frier Machiner Handler" },
  { id: "b1b2c3d4-4444-485c-82cc-e8ae187cdba4", name: "Team Builder - Position Replacer" },
  { id: "b1b2c3d4-5555-485c-82cc-e8ae187cdba5", name: "Sales Personel" },
  { id: "b1b2c3d4-6666-485c-82cc-e8ae187cdba6", name: "Public Attendant" }
];

export default function HRDashboardPage() {
  const { user, token } = useAuthStore();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Data State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const [editFormData, setEditFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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

      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [staffRes, branchesRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/staff/organization/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/branches/organization/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/roles`, axiosConfig).catch(() => ({ data: FALLBACK_ROLES }))
      ]);

      setStaffList(staffRes.data);
      setBranches(branchesRes.data);
      setRoles(Array.isArray(rolesRes.data) && rolesRes.data.length > 0 ? rolesRes.data : FALLBACK_ROLES);

    } catch (err) {
      console.error("Failed to load HR data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchHRData();
  }, [fetchHRData]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`${API_URL}/api/v1/staff`, formData, axiosConfig);
      setSuccess(`${formData.firstName} ${formData.lastName} has been successfully provisioned.`);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "", roleId: "", branchId: "" });
      fetchHRData();
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

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Destructure to separate 'id' and 'email' from the allowed update fields
      const { id, email, ...validUpdatePayload } = editFormData;

      // Send only the valid fields to the backend
      await axios.patch(`${API_URL}/api/v1/staff/${id}`, validUpdatePayload, axiosConfig);
      
      setSuccess(`${editFormData.firstName}'s profile has been updated.`);
      fetchHRData();
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      // Check if it's an array of validation errors and format it nicely
      const errorMessage = Array.isArray(err.response?.data?.message) 
        ? err.response.data.message.join(", ") 
        : (err.response?.data?.message || "Failed to update employee record.");
        
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    setActiveDropdown(null);
    try {
      // Toggle the isActive status
      await axios.patch(`${API_URL}/api/v1/staff/${staffId}`, { isActive: !currentStatus }, axiosConfig);
      fetchHRData();
    } catch (err: any) {
      console.error("Failed to change account status", err);
      alert("Error: Could not change account status.");
    }
  };

  const handleResetPassword = (staffId: string) => {
    setActiveDropdown(null);
    // Placeholder for password reset logic (e.g., sending a reset email or showing a new password prompt)
    alert(`Initiating password reset protocol for user ID: ${staffId}`);
  };

  const openEditModal = (member: StaffMember) => {
    setActiveDropdown(null);
    setEditFormData({
      id: member.id, // Ensure this maps to the correct ID expected by your backend update route
      firstName: member.staff.firstName,
      lastName: member.staff.lastName,
      email: member.email,
      phone: member.staff.phone || "",
      roleId: member.role.id,
      branchId: member.branch.id,
    });
    setIsEditModalOpen(true);
  };

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
    <div className="max-w-7xl mx-auto space-y-8 relative pb-20">

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

        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse min-h-[300px]">
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${member.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {member.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                        className="p-2 text-zinc-400 hover:text-bakery-brown transition-colors rounded-lg hover:bg-zinc-200"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {/* Security Action Menu Dropdown */}
                      {activeDropdown === member.id && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-8 top-10 mt-1 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="py-1">
                            <button 
                              onClick={() => openEditModal(member)}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-3 text-zinc-400" /> Edit Profile & Role
                            </button>
                            <button 
                              onClick={() => handleResetPassword(member.id)}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center transition-colors"
                            >
                              <KeyRound className="w-4 h-4 mr-3 text-zinc-400" /> Reset Credentials
                            </button>
                            <div className="h-px bg-zinc-100 my-1 mx-2"></div>
                            {member.isActive ? (
                              <button 
                                onClick={() => handleToggleStatus(member.id, member.isActive)}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center transition-colors"
                              >
                                <UserX className="w-4 h-4 mr-3 text-red-500" /> Suspend Account
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleStatus(member.id, member.isActive)}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center transition-colors"
                              >
                                <UserCheck className="w-4 h-4 mr-3 text-emerald-500" /> Activate Account
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modal for Provisioning New Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Onboard New Staff</h3>
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
                    <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Last Name</label>
                    <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Initial Password</label>
                  <input type="password" required minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">System Role</label>
                  <select required value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all">
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Assigned Branch</label>
                  <select required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all">
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

      {/* Slide-over Modal for Updating Existing Staff */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Edit Staff Profile</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="edit-staff-form" onSubmit={handleUpdateStaff} className="space-y-5">
                {error && <div className="p-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center"><ShieldAlert className="w-4 h-4 mr-2"/> {error}</div>}
                {success && <div className="p-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">First Name</label>
                    <input type="text" required value={editFormData.firstName} onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Last Name</label>
                    <input type="text" required value={editFormData.lastName} onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full px-3 py-2.5 bg-zinc-100 border border-zinc-300 rounded-xl text-sm text-zinc-500 cursor-not-allowed" readOnly title="Email cannot be changed directly." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">System Role</label>
                  <select required value={editFormData.roleId} onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all">
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Assigned Branch</label>
                  <select required value={editFormData.branchId} onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all">
                    <option value="">Select a branch...</option>
                    {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button
                type="submit"
                form="edit-staff-form"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</> : "Save Profile Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}