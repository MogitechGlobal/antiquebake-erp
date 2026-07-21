"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  ArrowLeft,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from "lucide-react";

// Strict validation schema for password changes
const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export default function SecurityPage() {
  const { token } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SecurityFormValues) => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      // We only send the required fields to the backend, ignoring confirmPassword
      await axios.put(
        `${API_URL}/api/v1/profile/password`, 
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage("Your password has been successfully updated.");
      reset(); // Clear the form fields after successful update
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Failed to update password. Please verify your current password and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link 
          href="/dashboard/profile" 
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-bakery-brown transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Security Settings</h1>
          <p className="text-stone-500 text-sm mt-1">
            Update your account password and manage your security credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Corporate Security Guidelines */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl text-stone-300 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-bakery-gold/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                <ShieldCheck className="w-5 h-5 text-bakery-gold" />
              </div>
              <h3 className="text-lg font-bold text-white">Password Policy</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                As per Antique Oven Ltd corporate security guidelines, your password must meet the following criteria:
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Minimum of 8 characters in length.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Should not match your recent previous passwords.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Never share your password with other staff members.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Password Change Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-bakery-gold" />
                Change Password
              </h2>
            </div>
            
            <div className="p-6">
              
              {/* Feedback Alerts */}
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
                
                {/* Current Password */}
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                    <input 
                      type="password"
                      {...register("currentPassword")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-stone-50 border ${errors.currentPassword ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                      placeholder="Enter current password"
                    />
                  </div>
                  {errors.currentPassword && <p className="text-xs text-red-500 font-medium">{errors.currentPassword.message}</p>}
                </div>

                <div className="border-t border-stone-100 py-2"></div>

                {/* New Password */}
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                    <input 
                      type="password"
                      {...register("newPassword")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-stone-50 border ${errors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                      placeholder="Create a new password"
                    />
                  </div>
                  {errors.newPassword && <p className="text-xs text-red-500 font-medium">{errors.newPassword.message}</p>}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2 max-w-md">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                    <input 
                      type="password"
                      {...register("confirmPassword")}
                      className={`w-full pl-10 pr-4 py-2.5 bg-stone-50 border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-stone-200 focus:ring-bakery-gold'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all`}
                      placeholder="Type your new password again"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-stone-100 flex justify-start">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-8 py-3 bg-zinc-900 hover:bg-black disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg transition-all uppercase tracking-widest"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 text-bakery-gold" />
                        Update Password
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