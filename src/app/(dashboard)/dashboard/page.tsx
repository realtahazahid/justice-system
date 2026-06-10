import React from 'react';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import {
  FolderOpen,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Briefcase
} from 'lucide-react';

export const revalidate = 0; // Disable static caching so metrics are always fresh

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch metrics in parallel
  const [
    totalCases,
    activeCases,
    closedCases,
    upcomingHearingsCount,
    allCasesFees,
    upcomingHearings,
  ] = await Promise.all([
    prisma.case.count({ where: { deletedAt: null } }),
    prisma.case.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.case.count({ where: { status: 'CLOSED', deletedAt: null } }),
    prisma.hearing.count({
      where: {
        hearingDate: { gte: today },
        deletedAt: null,
        case: {
          deletedAt: null,
        },
      },
    }),
    prisma.case.aggregate({
      where: { deletedAt: null },
      _sum: {
        remainingFee: true,
      },
    }),
    prisma.hearing.findMany({
      where: {
        hearingDate: { gte: today },
        deletedAt: null,
        case: {
          deletedAt: null,
        },
      },
      include: {
        case: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { hearingDate: 'asc' },
      take: 5,
    }),
  ]);

  const pendingFees = Number(allCasesFees._sum.remainingFee || 0);

  // Helper formatting functions
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const metrics = [
    {
      name: 'Total Case Files',
      value: totalCases,
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-indigo-400',
    },
    {
      name: 'Active Cases',
      value: activeCases,
      icon: FolderOpen,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
    },
    {
      name: 'Closed Cases',
      value: closedCases,
      icon: FileText,
      color: 'from-slate-500 to-slate-700',
      textColor: 'text-slate-400',
    },
    {
      name: 'Upcoming Hearings',
      value: upcomingHearingsCount,
      icon: Calendar,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Advocate Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 font-medium">
            Supreme Court practice overview. Real-time statistics, case records, and schedules.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cases?new=true"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 hover:shadow-amber-500/15 transition-all cursor-pointer"
          >
            Create Case File
          </Link>
          <Link
            href="/clients?new=true"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Add Client
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div
            key={m.name}
            className="bg-slate-900 border border-slate-850 hover:border-slate-750 transition-all rounded-2xl p-5 relative overflow-hidden group shadow-lg"
          >
            <div className={`absolute -right-3 -top-3 w-16 h-16 bg-gradient-to-br ${m.color} opacity-5 group-hover:scale-125 transition-transform duration-500 rounded-full blur-sm`} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {m.name}
              </span>
              <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${m.textColor}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {m.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row: Ledger Summary & Upcoming Hearings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Ledger Summary card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[3rem] pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white tracking-wide">
                Fee Ledger Summary
              </h2>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Outstanding Accounts Receivable
            </p>
            <p className="text-3xl font-extrabold text-white tracking-tight leading-none mb-3">
              {formatCurrency(pendingFees)}
            </p>
            <p className="text-xs text-slate-400 font-medium mb-6">
              Remaining fee balances due across all active and closed legal cases.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-850">
            <Link
              href="/settings"
              className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Manage Financial Export</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Hearings panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Upcoming Hearing Schedule
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                The next 5 scheduled hearings across all active court categories.
              </p>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline"
            >
              View Calendar
            </Link>
          </div>

          {upcomingHearings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-slate-600 mb-2.5" />
              <p className="text-xs font-bold text-slate-400">
                No hearings scheduled
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                You currently have no upcoming court hearings on record.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {upcomingHearings.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition-all gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/cases/${h.case.id}`}
                          className="text-xs font-bold text-white hover:text-amber-400 hover:underline"
                        >
                          {h.case.caseNumber}
                        </Link>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-slate-400 border border-slate-700/50 uppercase">
                          {h.case.courtCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-bold mt-1">
                        {h.case.partyName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Court: {h.courtRemarks || h.case.courtName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs font-extrabold text-white">
                      {formatDate(h.hearingDate)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Client: {h.case.client.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
