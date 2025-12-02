"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", label: "Overview", shortcut: "G D" },
  { href: "/pipeline", label: "Pipeline", shortcut: "G P" },
  { href: "/leads", label: "Leads", shortcut: "G L" },
  { href: "/tasks", label: "Tasks", shortcut: "G T" },
  { href: "/lists", label: "Lists", shortcut: "G O" },
  { href: "/import", label: "Import", shortcut: "G I" },
  { href: "/settings", label: "Settings", shortcut: "G S" },
];

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export default function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link
          href="/dashboard"
          className="font-serif text-lg tracking-tight hover:opacity-60 transition-opacity"
        >
          Lynx<span className="text-stone-400">CRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? "text-stone-900 dark:text-white font-medium"
                      : "text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Keyboard hint */}
      <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800">
        <button
          onClick={onOpenCommandPalette}
          className="w-full text-left text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 mb-3 transition-colors"
        >
          Press <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[10px] font-mono">/</kbd> to search
        </button>
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-7 h-7",
              },
            }}
          />
          <span className="text-xs text-stone-500">Account</span>
        </div>
      </div>
    </aside>
  );
}
