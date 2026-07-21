"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  UserCircle, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Lock, 
  Phone,
  Briefcase,
  AlertCircle
} from "lucide-react";

// Validation schema for profile updates
const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  email: z.string().email("A valid email address is required."),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Populate form with current user data on mount
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const response = await axios.put(`${API_URL}/api/v1/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the global store and local storage with the new user object
      setAuth(token as string, response.data);
      setSuccessMessage("Profile updated successfully.");
      
    } catch (error: any) {
      console.error("Failed to update profile", error);
      setErrorMessage(error.response?.data?.message || "An error occurred while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Account Settings</h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage your personal information, corporate contact details, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Profile Overview */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-bakery-gold/20 border-4 border-white shadow-md flex items-center justify-center mb-4 text-3xl font-black text-bakery-brown tracking-widest">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{user.firstName} {user.lastName}</h2>
            <p className="text-stone-500 text-sm font-medium mb-4">{user.email}</p>
            
            <div className="w-full flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-center gap-2 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                <ShieldCheck className="w-4 h-4 text-bakery-gold" />
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">{user.role}</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                <Building2 className="w-4 h-4 text-bakery-gold" />
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">{user.branchName}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Security</h3>
            </div>
            <div className="p-2">
              <Link 
                href="/dashboard/profile/security"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 text-zinc-700 hover:text-bakery-brown transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-100 text-stone-500 rounded-lg group-hover:bg-bakery-gold/20 group-hover:text-bakery-brown transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Change Password</p>
                    <p className="text-xs text-stone-500">Update your account security key</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-bakery-gold" />
                Personal Information
              </h2>
            </div>
            
            <div className="p-6">
              {successMessage && (
                <div className="mb-6 p-4 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center animate-in fade-in">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 text-sm font-bold text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center animate-in fade-in">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">First Name</label>
                    <input 
                      {...register("firstName")}
                      className={`w-full px-4 py-2.5 bg-stone-50 border ${errors.firstName ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Last Name</label>
                    <input 
                      {...register("lastName")}
                      className={`w-full px-4 py-2.5 bg-stone-50 border ${errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-stone-400" />
                      </div>
                      <input 
                        {...register("email")}
                        className={`w-full pl-10 pr-4 py-2.5 bg-stone-50 border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                        placeholder="admin@antiqueoven.co.tz"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-stone-400" />
                      </div>
                      <input 
                        {...register("phone")}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-gold transition-all"
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Corporate Assignment (Read-Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">System Role</label>
                      <div className="flex items-center w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed">
                        <Briefcase className="w-4 h-4 mr-2 text-stone-400" />
                        {user.role}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Assigned Branch</label>
                      <div className="flex items-center w-full px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed">
                        <Building2 className="w-4 h-4 mr-2 text-stone-400" />
                        {user.branchName}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-3 font-medium">
                    * To modify your corporate role or branch assignment, please contact the System Administrator or HR Department.
                  </p>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-6 py-2.5 bg-zinc-900 hover:bg-black disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg transition-all uppercase tracking-widest"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Updates...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 text-bakery-gold" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}