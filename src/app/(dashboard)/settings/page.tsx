'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  Database,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Server,
  User,
  CheckCircle,
  Lock,
  KeyRound,
  Users,
  Award,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ReferralReport {
  referral: string;
  count: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Referral states
  const [referrals, setReferrals] = useState<ReferralReport[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      setReferralsLoading(true);
      const res = await fetch('/api/reports/referrals');
      if (res.ok) {
        const data = await res.json();
        setReferrals(data);
      }
    } catch (err) {
      console.error('Failed to fetch referrals report:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleJsonBackup = async () => {
    setDownloadingJson(true);
    try {
      window.open('/api/backup/database', '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDownloadingJson(false), 2000);
    }
  };

  const handleCsvExport = async () => {
    setDownloadingCsv(true);
    try {
      window.open('/api/backup/excel', '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDownloadingCsv(false), 2000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordSuccess('Account password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('An unexpected network error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="h-7 w-7 text-amber-500" />
          Settings & Backups
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          Manage system configurations, security details, and extract chamber database backup copies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Backup & Reports */}
        <div className="md:col-span-2 space-y-6">
          {/* Database Backups Panel */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-5">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              Backup & Data Export Center
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed font-medium">
              Chamber data integrity is critical. Export your data records at regular intervals. Backup files contain complete snapshots of case metadata, client profiles, payment receipts, scheduling, and binary PDF uploads.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Database Dump Card */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-1">
                    Complete DB Backup
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase">
                    Format: JSON
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mb-5">
                    Generates a complete JSON payload containing all users, cases, billing ledgers, scheduling events, and files (base64 encoded).
                  </p>
                </div>
                <button
                  onClick={handleJsonBackup}
                  disabled={downloadingJson}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 text-amber-500" />
                  {downloadingJson ? 'Generating backup...' : 'Download Backup'}
                </button>
              </div>

              {/* CSV Case Index Card */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-1">
                    Excel Case Export
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase">
                    Format: CSV Spreadsheet
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium mb-5">
                    Exports active and closed case files index with clients, categories, fees summary, and remarks into an Excel-ready CSV sheet.
                  </p>
                </div>
                <button
                  onClick={handleCsvExport}
                  disabled={downloadingCsv}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  {downloadingCsv ? 'Generating sheet...' : 'Export to Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Referral Analytics Panel */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Referral Network Analytics
              </h2>
              <button
                onClick={fetchReferrals}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider cursor-pointer"
              >
                Refresh Report
              </button>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed font-medium">
              Tracks the history of case referrers. Below is the active roster showing how many case briefs have been referred to your chamber by each person.
            </p>

            {referralsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 text-amber-500 animate-spin mr-2" />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Analyzing referrals...</span>
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-4 bg-slate-950/40 border border-slate-850 border-dashed rounded-xl text-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">No referrals recorded</span>
                <p className="text-[10px] text-slate-600 mt-1">Cases with a value in the 'Referral' field will automatically populate here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {referrals.map((item, index) => (
                  <div
                    key={item.referral}
                    className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition-all gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white truncate max-w-[150px]" title={item.referral}>
                          {item.referral}
                        </p>
                        <p className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">Chamber Referrer</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-lg text-center shrink-0">
                      {item.count} {item.count === 1 ? 'Case' : 'Cases'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database Security Info */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Server className="h-5 w-5 text-amber-500" />
              Database Protection & Integrity Rules
            </h2>
            <div className="space-y-3.5 text-xs text-slate-350 leading-relaxed font-medium">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">PostgreSQL Constraints:</strong> Accidental deletions of cases with history logs are blocked. PostgreSQL constraints (`onDelete: Restrict`) prevent hard removal of files linked to hearings or payment ledgers.
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Soft-Delete Enforcement:</strong> The application uses soft-delete rules (`deletedAt DateTime?`) to hide files from queries while keeping database values intact for archival audits.
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Neon Serverless Storage:</strong> Storing PDFs as database byte arrays (`Bytes` type) ensures that files are protected from Vercel serverless containers' ephemeral restarts, maintaining zero file desynchronization.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Account & Password Settings */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Details */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 mb-5">
              <User className="h-5 w-5 text-amber-500" />
              Chamber Account
            </h2>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-505 block uppercase tracking-wider mb-0.5">Advocate Name</span>
                <span className="text-white text-sm font-extrabold">{session?.user?.name || 'Supreme Court Advocate'}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-505 block uppercase tracking-wider mb-0.5">Authorized Email (Fixed)</span>
                <span className="text-slate-300 truncate block">{session?.user?.email || 'admin@sahilaw.com'}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-505 block uppercase tracking-wider mb-0.5">Security Role</span>
                <span className="text-amber-500 font-extrabold">{(session?.user as any)?.role || 'ADMIN'}</span>
              </div>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Update Password
            </h2>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Maintain chamber security by updating password hashes regularly.
            </p>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-xl leading-relaxed">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[11px] font-bold rounded-xl leading-relaxed">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Authorized Advocate Email
                </label>
                <input
                  type="email"
                  disabled
                  value={session?.user?.email || 'admin@sahilaw.com'}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed select-none truncate font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:shadow-amber-500/15 transition-all cursor-pointer"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>

          {/* Security Notice Card */}
          <div className="bg-slate-900 border border-rose-500/10 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
              <ShieldAlert className="h-4 w-4" />
              Security Notice
            </div>
            <p className="leading-relaxed font-medium">
              Access to this console is strictly monitored. Database backups contain private, confidential legal records. Store generated copies on secure, offline disks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
