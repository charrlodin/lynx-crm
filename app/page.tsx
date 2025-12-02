"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight } from "lucide-react";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const dashboard = useInView(0.2);
  const pipeline = useInView(0.2);
  const cta = useInView(0.3);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Floating Glass Navbar */}
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-out ${
          scrolled ? "top-3 scale-[0.98]" : "top-6 scale-100"
        }`}
      >
        <div className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-white/20 dark:border-stone-800/50 rounded-2xl shadow-lg shadow-stone-900/5 dark:shadow-black/20 px-6 py-3 flex items-center gap-8 hover-glow transition-all duration-300">
          <Link
            href="/"
            className="font-serif text-xl font-semibold tracking-tight hover:opacity-70 transition-all duration-300"
          >
            LynxCRM
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-stone-500 dark:text-stone-400">
            <Link
              href="#dashboard"
              className="link-underline hover:text-stone-900 dark:hover:text-white transition-colors duration-300"
            >
              Dashboard
            </Link>
            <Link
              href="#pipeline"
              className="link-underline hover:text-stone-900 dark:hover:text-white transition-colors duration-300"
            >
              Pipeline
            </Link>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors duration-300">
                  Sign in
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="btn-shine bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-95 transition-all duration-200">
                  Get started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors duration-300"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{ elements: { avatarBox: "w-8 h-8" } }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="animate-in stagger-1 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-6">
            Customer Relationship Management
          </p>

          <h1 className="animate-in stagger-2 font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[0.95] mb-8">
            The CRM for
            <br />
            <span className="italic text-stone-400 dark:text-stone-600 inline-block hover:scale-105 transition-transform duration-500 cursor-default">
              minimalists.
            </span>
          </h1>

          <p className="animate-in stagger-3 text-lg md:text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Stop wrestling with bloated enterprise software. LynxCRM is
            opinionated, fast, and built for closing deals—not managing
            dashboards.
          </p>

          <div className="animate-in stagger-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-shine group w-full sm:w-auto px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-95 transition-all duration-200 shadow-lg shadow-stone-900/10 hover:shadow-xl hover:shadow-stone-900/20">
                  <span className="flex items-center justify-center gap-2">
                    Start for free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="btn-shine group w-full sm:w-auto px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-95 transition-all duration-200 shadow-lg shadow-stone-900/10 hover:shadow-xl hover:shadow-stone-900/20"
              >
                <span className="flex items-center justify-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </SignedIn>
            <Link
              href="#dashboard"
              className="w-full sm:w-auto px-6 py-3 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 rounded-xl font-medium hover:bg-white dark:hover:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 active:scale-95 transition-all duration-300"
            >
              See the product
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section
        ref={dashboard.ref}
        id="dashboard"
        className="px-6 pb-32"
      >
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              dashboard.isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
              Dashboard
            </p>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
              Metrics that matter
            </h2>
          </div>

          {/* Dashboard Preview - 3D Effect */}
          <div 
            className="relative group"
            style={{ perspective: "1500px" }}
          >
            {/* Ambient glow behind card */}
            <div 
              className={`absolute -inset-4 bg-gradient-to-r from-stone-200/50 via-stone-300/30 to-stone-200/50 dark:from-stone-700/20 dark:via-stone-600/10 dark:to-stone-700/20 rounded-3xl blur-2xl transition-all duration-1000 ${
                dashboard.isInView ? "opacity-60" : "opacity-0"
              }`}
              style={{ 
                animation: dashboard.isInView ? "pulse-glow 4s ease-in-out infinite" : "none"
              }}
            />
            
            <div
              className={`relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000 ${
                dashboard.isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ 
                transitionDelay: dashboard.isInView ? "200ms" : "0ms",
                transform: dashboard.isInView 
                  ? "rotateX(2deg) rotateY(-1deg) translateZ(0)" 
                  : "rotateX(8deg) rotateY(-4deg) translateZ(-50px)",
                transformStyle: "preserve-3d",
                animation: dashboard.isInView ? "float-3d 6s ease-in-out infinite" : "none",
                boxShadow: dashboard.isInView 
                  ? "0 25px 50px -12px rgba(0,0,0,0.15), 0 12px 24px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)"
                  : "none"
              }}
            >
            {/* Header */}
            <div className="px-8 py-6 border-b border-stone-200 dark:border-stone-800">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Overview</p>
              <h3 className="font-serif text-2xl">Dashboard</h3>
            </div>

            {/* Metrics */}
            <div className="px-8 py-8 border-b border-stone-200 dark:border-stone-800">
              <div className="grid grid-cols-5 gap-6">
                <div>
                  <p className="font-serif text-4xl tracking-tight mb-1">247</p>
                  <p className="text-sm text-stone-500">Total leads</p>
                </div>
                <div>
                  <p className="font-serif text-4xl tracking-tight mb-1">183</p>
                  <p className="text-sm text-stone-500">In pipeline</p>
                </div>
                <div>
                  <p className="font-serif text-4xl tracking-tight text-emerald-600 mb-1">42</p>
                  <p className="text-sm text-stone-500">Closed won</p>
                </div>
                <div>
                  <p className="font-serif text-4xl tracking-tight text-red-400 mb-1">22</p>
                  <p className="text-sm text-stone-500">Closed lost</p>
                </div>
                <div>
                  <p className="font-serif text-4xl tracking-tight mb-1">66%</p>
                  <p className="text-sm text-stone-500">Win rate</p>
                </div>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="p-8">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Pipeline</p>
              <div className="space-y-3">
                {[
                  { name: "New", count: 45, percent: 25, color: "bg-stone-900 dark:bg-stone-300" },
                  { name: "Qualified", count: 62, percent: 34, color: "bg-stone-900 dark:bg-stone-300" },
                  { name: "Proposal", count: 38, percent: 21, color: "bg-stone-900 dark:bg-stone-300" },
                  { name: "Negotiation", count: 38, percent: 21, color: "bg-stone-900 dark:bg-stone-300" },
                  { name: "Won", count: 42, percent: 23, color: "bg-emerald-500" },
                  { name: "Lost", count: 22, percent: 12, color: "bg-stone-300 dark:bg-stone-600" },
                ].map((stage) => (
                  <div key={stage.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm">{stage.name}</span>
                      <span className="font-serif text-sm">{stage.count}</span>
                    </div>
                    <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.color}`}
                        style={{ width: `${stage.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Preview Section */}
      <section ref={pipeline.ref} id="pipeline" className="px-6 py-24 bg-stone-50 dark:bg-stone-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`transition-all duration-700 ${
                pipeline.isInView
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
                Pipeline Management
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-6">
                Kanban that
                <br />
                <span className="italic text-stone-400 dark:text-stone-600">
                  just works.
                </span>
              </h2>
              <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-8">
                Drag leads between stages. See your entire pipeline at a glance. 
                No clutter, no confusion—just your sales process in motion.
              </p>
              <ul className="space-y-3 text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  Drag-and-drop between stages
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  Lead values and days in stage
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  Keyboard shortcuts (press N for new lead)
                </li>
              </ul>
            </div>

            {/* Pipeline Preview */}
            <div
              className={`bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xl transition-all duration-700 ${
                pipeline.isInView
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: pipeline.isInView ? "200ms" : "0ms" }}
            >
              <div className="flex gap-4">
                {[
                  { name: "Qualified", count: 8, leads: [
                    { name: "Acme Corp", company: "Technology", value: "$45,000", days: 3 },
                    { name: "GlobalTech", company: "Enterprise", value: "$120,000", days: 7 },
                  ]},
                  { name: "Proposal", count: 4, leads: [
                    { name: "StartupXYZ", company: "SaaS", value: "$18,000", days: 2 },
                    { name: "MegaCorp", company: "Finance", value: "$85,000", days: 5 },
                    { name: "DataFlow", company: "Analytics", value: "$32,000", days: 1 },
                  ]},
                  { name: "Negotiation", count: 3, leads: [
                    { name: "CloudFirst", company: "Infrastructure", value: "$67,000", days: 4 },
                  ]},
                ].map((col) => (
                  <div key={col.name} className="flex-1 min-w-[160px]">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-400" />
                        <span className="text-sm font-medium">{col.name}</span>
                      </div>
                      <span className="text-xs text-stone-400">{col.count}</span>
                    </div>
                    <div className="space-y-3">
                      {col.leads.map((lead) => (
                        <div
                          key={lead.name}
                          className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm">{lead.name}</h4>
                            <span className="text-xs font-medium text-stone-500">{lead.value}</span>
                          </div>
                          <p className="text-xs text-stone-400 mb-3">{lead.company}</p>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400">
                            {lead.days}d in stage
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
              Built for speed
            </p>
            <h2 className="font-serif text-4xl tracking-tight">
              Everything you need.
              <br />
              <span className="text-stone-400 dark:text-stone-600">Nothing you don&apos;t.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Command Palette",
                desc: "Press / to search leads, navigate, or take actions. Keyboard-first.",
                shortcut: "⌘K",
              },
              {
                title: "Tasks & Reminders",
                desc: "Add follow-up tasks to leads. See overdue items on your dashboard.",
                shortcut: null,
              },
              {
                title: "CSV Import",
                desc: "Bulk import leads with automatic column mapping. Up to 500 at once.",
                shortcut: null,
              },
              {
                title: "Pipeline Analytics",
                desc: "Track won/lost values, win rates, and leads over time.",
                shortcut: null,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium">{feature.title}</h3>
                  {feature.shortcut && (
                    <kbd className="text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded font-mono">
                      {feature.shortcut}
                    </kbd>
                  )}
                </div>
                <p className="text-sm text-stone-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={cta.ref} className="px-6 py-32">
        <div className="max-w-4xl mx-auto">
          <div
            className={`bg-stone-900 dark:bg-white rounded-2xl p-12 md:p-16 text-center transition-all duration-700 ${
              cta.isInView
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-6 text-white dark:text-stone-900">
              Ready to simplify?
            </h2>
            <p className="text-lg text-stone-400 dark:text-stone-600 mb-10 max-w-xl mx-auto">
              Join teams who&apos;ve traded complexity for clarity. Free to start,
              scales with you.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group px-8 py-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-xl font-medium text-lg hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all duration-200">
                  <span className="flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-xl font-medium text-lg hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all duration-200"
              >
                Open Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-stone-200/50 dark:border-stone-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-serif text-lg font-semibold hover:opacity-70 transition-opacity duration-300"
            >
              LynxCRM
            </Link>
            <span className="text-sm text-stone-400">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <Link
              href="/privacy"
              className="hover:text-stone-900 dark:hover:text-white transition-colors duration-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-stone-900 dark:hover:text-white transition-colors duration-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
