"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Menu, X, Phone, Mail, MapPin, ShieldCheck, Sun, Moon } from "lucide-react";

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering the toggle after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-sm transition-colors duration-300">

            {/* Top Bar - Corporate Info */}
            <div className="hidden w-full bg-zinc-950 py-2 text-[11px] text-stone-300 md:block border-b border-bakery-gold/20">
                <div className="container mx-auto flex max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6 font-medium">
                        <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-bakery-gold" /> P.O. Box 6681, Morogoro, Tanzania
                        </span>
                        <span className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-bakery-gold" /> info@antiqueoven.co.tz
                        </span>
                    </div>
                    <div className="flex items-center gap-6 font-medium">
                        <span className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-bakery-gold" /> +255 767 885 555
                        </span>
                        <span className="w-px h-3 bg-stone-700"></span>
                        <span className="text-bakery-gold tracking-widest uppercase font-bold">
                            Enterprise Operations
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

                {/* Brand Identity */}
                <Link href="/" className="flex items-center space-x-3">
                    <div className="relative w-14 h-10 flex-shrink-0">
                        <Image
                            src="/web-app-manifest-512x512.png"
                            alt="Antique Oven Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="flex flex-col hidden sm:flex">
                        <span className="text-xl font-black tracking-widest uppercase text-zinc-900 dark:text-white leading-none">
                            Antique Oven
                        </span>
                        <span className="text-[9px] font-bold text-bakery-brown uppercase tracking-[0.2em] mt-1">
                            The Bakery Master
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden items-center gap-8 md:flex text-xs font-bold text-stone-600 dark:text-stone-300 tracking-widest uppercase">
                    <Link href="/" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">Home</Link>
                    <Link href="/about" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">About</Link>
                    <Link href="/shop" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">Shop</Link>
                    <Link href="/infrastructure" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">Infrastructure</Link>
                    <Link href="/knowledge-centre" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">Knowledge Center</Link>
                    <Link href="/contact" className="hover:text-bakery-brown dark:hover:text-bakery-gold transition-colors">Contact</Link>
                </nav>

                {/* CTA & Theme Toggle */}
                <div className="flex items-center gap-4">
                    
                    {/* Theme Toggle Button */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-lg bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:text-bakery-gold transition-all"
                            aria-label="Toggle Dark Mode"
                        >
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    )}

                    <Link
                        href="/login"
                        className="hidden md:flex items-center justify-center px-6 py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 dark:text-zinc-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-zinc-900/20 transition-all active:scale-95 border border-zinc-800 dark:border-white"
                    >
                        <ShieldCheck className="w-4 h-4 mr-2 text-bakery-gold dark:text-bakery-brown" />
                        Portal Login
                    </Link>
                    
                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden text-zinc-900 dark:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 md:hidden">
                    <nav className="flex flex-col gap-4">
                        <Link href="/" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">Home</Link>
                        <Link href="/about" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">About</Link>
                        <Link href="/shop" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">Shop</Link>
                        <Link href="/infrastructure" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">Infrastructure</Link>
                        <Link href="/knowledge-centre" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">Knowledge Center</Link>
                        <Link href="/contact" className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-stone-200">Contact</Link>
                        <Link href="/login" className="mt-4 flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-white px-4 py-3 text-center text-sm font-bold uppercase tracking-widest text-white dark:text-zinc-900">
                            <ShieldCheck className="w-4 h-4 mr-2 text-bakery-gold dark:text-bakery-brown" /> Portal Login
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}