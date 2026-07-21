"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";

// Strict validation schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      // Dynamic URL evaluation matching local fallback or production environment variable
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, values);
      
      const { access_token, user } = response.data;
      
      setAuth(access_token, user);
      localStorage.setItem("erp_token", access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during secure login.");
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-stone-50">
      
      {/* LEFT PANEL: Premium Branding (Hidden on smaller screens) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-bakery-chocolate via-[#4A2500] to-bakery-brown p-12 text-bakery-cream relative overflow-hidden">
        {/* Subtle background pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bakery-gold via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center space-x-3">
          <div className="relative w-16 h-12 flex-shrink-0 p-1 bg-bakery-gold/20 rounded-lg backdrop-blur-sm">
            <Image 
              src="/web-app-manifest-512x512.png" 
              alt="Antique Oven Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-bold tracking-wider uppercase text-bakery-gold">
            Antique Oven Ltd
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-white">
            Intelligent Bakery <br />
            <span className="text-bakery-gold">Manufacturing.</span>
          </h1>
          <p className="text-lg text-bakery-wheat/80 font-medium">
            Enterprise ERP, automated inventory, and real-time smart point of sale platform.
          </p>
        </div>

        <div className="relative z-10 text-sm text-bakery-wheat/60">
          &copy; {new Date().getFullYear()} Antique Oven Ltd. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Login Form (Full width on mobile, half on desktop) */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative">
        
        {/* Back to Home Button */}
        <div className="absolute top-6 left-6 sm:left-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-bakery-brown transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 mt-8 sm:mt-0">
          
          <div className="space-y-3 text-center lg:text-left">
            {/* Mobile Logo */}
            <div className="flex lg:hidden justify-center mb-6">
              <div className="relative w-20 h-14">
                <Image 
                  src="/web-app-manifest-512x512.png" 
                  alt="Antique Oven Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Welcome back</h2>
            <p className="text-stone-500 font-medium text-sm">
              Enter your credentials to access the production network.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {error && (
                <div className="p-4 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-stone-700 font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-stone-400" />
                          </div>
                          <Input 
                            placeholder="admin@antiqueoven.co.tz" 
                            className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus-visible:ring-bakery-gold focus-visible:border-bakery-gold transition-all" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-stone-700 font-semibold">Password</FormLabel>
                        <a href="#" className="text-sm font-medium text-bakery-brown hover:text-bakery-gold transition-colors">
                          Forgot password?
                        </a>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-stone-400" />
                          </div>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus-visible:ring-bakery-gold focus-visible:border-bakery-gold transition-all" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-lg shadow-bakery-brown/20 transition-all active:scale-[0.98] cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Secure Login"
                )}
              </Button>
            </form>
          </Form>
          
        </div>
      </div>
    </div>
  );
}