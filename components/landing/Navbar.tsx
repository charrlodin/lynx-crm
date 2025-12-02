"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50 py-4"
                    : "bg-transparent py-6"
                }`}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-12 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-white hover:opacity-80 transition-opacity">
                    LynxCRM
                </Link>

                {/* Navigation Links - Minimal */}
                <div className="hidden md:flex items-center gap-10 text-sm font-medium text-stone-500 dark:text-stone-400">
                    <Link href="#features" className="hover:text-stone-900 dark:hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="/docs" className="hover:text-stone-900 dark:hover:text-white transition-colors">
                        Docs
                    </Link>
                </div>

                {/* Auth Buttons - Clean */}
                <div className="flex items-center gap-6">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignInButton mode="modal">
                            <button className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors shadow-sm">
                                Get Started
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors mr-4"
                        >
                            Dashboard
                        </Link>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8"
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </nav>
    );
}
