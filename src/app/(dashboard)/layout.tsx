'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  Settings,
  LogOut,
  Search,
  Plus,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Scale className="h-12 w-12 text-amber-500 animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Loading Advocate Dashboard...
        </span>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cases?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Case Files', href: '/cases', icon: FolderOpen },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Settings & Backups', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800">
          <Scale className="h-7 w-7 text-amber-500" />
          <span className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            Sahi Law Chamber
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/40">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {session?.user?.name || 'Advocate'}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {(session?.user as any)?.role || 'Lawyer'}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (backdrop & navigation) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800 z-10 animate-slide-in">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-amber-500" />
                <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                  Sahi Law Chamber
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/40">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {session?.user?.name || 'Advocate'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium truncate uppercase">
                    {(session?.user as any)?.role || 'Lawyer'}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-850 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="hidden sm:block max-w-md w-full relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Cases (Number, Client, Party, Court)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-xs font-medium"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Create Button */}
            <Link
              href="/cases?new=true"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 hover:shadow-amber-500/15 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden xs:inline">New Case File</span>
            </Link>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
