import Link from "next/link";
import { SignInButton, SignedOut, SignedIn } from "@clerk/nextjs";

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
            <div className="mx-auto max-w-7xl text-center">

                {/* Headline */}
                <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter text-stone-900 dark:text-white mb-8 animate-fade-in-up">
                    The CRM for <br className="hidden md:block" />
                    <span className="italic text-stone-400 dark:text-stone-500">minimalists.</span>
                </h1>

                {/* Subheadline */}
                <p className="mx-auto max-w-2xl text-xl md:text-2xl text-stone-500 dark:text-stone-400 mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    Stop wrestling with bloated enterprise software. <br className="hidden md:block" />
                    LynxCRM is opinionated, fast, and built for closing.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-full font-medium text-base hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl">
                                Start for free
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto px-6 py-3 bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-full font-medium text-base hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
                        >
                            Go to Dashboard
                        </Link>
                    </SignedIn>

                    <Link
                        href="#features"
                        className="w-full sm:w-auto px-6 py-3 bg-transparent text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 rounded-full font-medium text-base hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
                    >
                        See the workflow
                    </Link>
                </div>

                {/* Visual - Abstract Single Card */}
                <div className="mt-24 relative mx-auto max-w-lg animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                    {/* The Card */}
                    <div className="relative z-10 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-800 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out cursor-default">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-serif text-2xl font-medium text-stone-900 dark:text-white">Acme Corp</h3>
                                <p className="text-sm text-stone-500">Enterprise License</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                Won
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-4xl font-medium text-stone-900 dark:text-white tracking-tight">
                                $24,000
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white dark:border-stone-900"></div>
                                <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-white dark:border-stone-900"></div>
                            </div>
                        </div>
                    </div>

                    {/* Background Blur Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-stone-200 dark:bg-stone-800 blur-3xl opacity-50 -z-10 rounded-full"></div>
                </div>
            </div>
        </section>
    );
}
