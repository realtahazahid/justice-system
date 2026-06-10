'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderOpen,
  Plus,
  Search,
  Scale,
  Briefcase,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  Trash2,
  DollarSign,
  User,
  Activity,
  UserCheck
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  cnic: string;
}

interface Case {
  id: string;
  courtCategory: string;
  courtName: string;
  caseNumber: string;
  fileNo: string;
  partyName: string;
  contactNumber: string;
  status: string;
  priority: string;
  totalFee: number;
  paidFee: number;
  remainingFee: number;
  createdAt: string;
  client: Client;
}

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Creation Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courtCategory, setCourtCategory] = useState('Civil Court');
  const [courtName, setCourtName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [referral, setReferral] = useState('');
  const [partyName, setPartyName] = useState('');
  const [clientId, setClientId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [priority, setPriority] = useState('MEDIUM');
  const [totalFee, setTotalFee] = useState(0);

  // Error & UI states
  const [errors, setErrors] = useState<any>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Load clients and cases
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (categoryFilter) params.set('courtCategory', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);

      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsFormOpen(true);
    }
    const queryQ = searchParams.get('q');
    if (queryQ !== null && queryQ !== searchQuery) {
      setSearchQuery(queryQ);
    }
  }, [searchParams]);

  // Set contact number automatically when client is selected
  const handleClientChange = (id: string) => {
    setClientId(id);
    const selected = clients.find(c => c.id === id);
    if (selected) {
      setContactNumber(selected.phone);
    }
  };

  const resetForm = () => {
    setCourtCategory('Civil Court');
    setCourtName('');
    setCaseNumber('');
    setFileNo('');
    setReferral('');
    setPartyName('');
    setClientId('');
    setContactNumber('');
    setNotes('');
    setStatus('ACTIVE');
    setPriority('MEDIUM');
    setTotalFee(0);
    setErrors({});
    setGeneralError(null);
    setIsFormOpen(false);
    if (searchParams.get('new') === 'true') {
      router.replace('/cases');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrors({});
    setGeneralError(null);

    const payload = {
      courtCategory,
      courtName,
      caseNumber,
      fileNo,
      referral: referral || null,
      partyName,
      clientId,
      contactNumber,
      notes: notes || null,
      status,
      priority,
      totalFee: Number(totalFee),
    };

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        resetForm();
        fetchCases();
      } else {
        if (data.error && typeof data.error === 'object') {
          setErrors(data.error);
        } else {
          setGeneralError(data.error || 'Failed to submit case file');
        }
      }
    } catch (err) {
      setGeneralError('Network error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, caseNo: string) => {
    if (!confirm(`Are you sure you want to delete Case File "${caseNo}"? This operation soft-deletes the record. Audit history is preserved.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCases(cases.filter(c => c.id !== id));
      } else {
        alert('Failed to delete case');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-450';
    }
  };

  const getStatusBadge = (stat: string) => {
    return stat === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-slate-750 text-slate-450 border-slate-700/50';
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <FolderOpen className="h-7 w-7 text-amber-500" />
            Case Files Directory
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Search active and closed legal records, set hearings, and review billing ledgers.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          New Case File
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Case wizard Form */}
        {isFormOpen && (
          <div className="lg:col-span-1 bg-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-white tracking-wide">
                Initialize Case File
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {generalError && (
              <div className="mb-5 p-3 text-rose-350 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Court Category
                </label>
                <select
                  value={courtCategory}
                  onChange={(e) => setCourtCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                >
                  <option value="Civil Court">Civil Court</option>
                  <option value="Tribunal Court">Tribunal Court</option>
                  <option value="High Court">High Court</option>
                  <option value="Supreme Court">Supreme Court</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Court Name
                </label>
                <input
                  type="text"
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="e.g. Supreme Court of Pakistan"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
                {errors.courtName && (
                  <p className="mt-1.5 text-[10px] text-rose-450 font-semibold">{errors.courtName[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Case Number
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. Civil Appeal No. 423 of 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
                {errors.caseNumber && (
                  <p className="mt-1.5 text-[10px] text-rose-450 font-semibold">{errors.caseNumber[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    File Number
                  </label>
                  <input
                    type="text"
                    required
                    value={fileNo}
                    onChange={(e) => setFileNo(e.target.value)}
                    placeholder="SC-924"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                  {errors.fileNo && (
                    <p className="mt-1.5 text-[10px] text-rose-450 font-semibold">{errors.fileNo[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Referral Source
                  </label>
                  <input
                    type="text"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Party Name (Title of Suit)
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="Ali Ahmad VS State"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
                {errors.partyName && (
                  <p className="mt-1.5 text-[10px] text-rose-455 font-semibold">{errors.partyName[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Chamber Client
                </label>
                {clients.length === 0 ? (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 mb-1.5 font-semibold">No clients registered</p>
                    <Link
                      href="/clients?new=true"
                      className="text-[10px] text-amber-500 hover:text-amber-400 font-bold"
                    >
                      + Create Client First
                    </Link>
                  </div>
                ) : (
                  <select
                    required
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  >
                    <option value="">-- Bind Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.cnic})</option>
                    ))}
                  </select>
                )}
                {errors.clientId && (
                  <p className="mt-1.5 text-[10px] text-rose-455 font-semibold">{errors.clientId[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
                {errors.contactNumber && (
                  <p className="mt-1.5 text-[10px] text-rose-460 font-semibold">{errors.contactNumber[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Chamber Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Case Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Total Case Fee (Rs.)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value))}
                  placeholder="Total Fee"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                />
                {errors.totalFee && (
                  <p className="mt-1.5 text-[10px] text-rose-460 font-semibold">{errors.totalFee[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Lawyer Brief Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter initial details..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Case'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Directory Listing */}
        <div className={`bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg ${isFormOpen ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Cases (Number, Client, Party, Court)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all text-xs font-semibold"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="">All Categories</option>
              <option value="Civil Court">Civil Court</option>
              <option value="Tribunal Court">Tribunal Court</option>
              <option value="High Court">High Court</option>
              <option value="Supreme Court">Supreme Court</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500 transition-all"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading cases index...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <FolderOpen className="h-12 w-12 text-slate-700 mb-3" />
              <p className="text-xs font-bold text-slate-400">No cases matched query</p>
              <p className="text-[10px] text-slate-500 mt-1">Try resetting search filters or register a new case file.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    <th className="pb-3 pl-2">Case Info / Client</th>
                    <th className="pb-3">Title of Suit (Party)</th>
                    <th className="pb-3">Category / Forum</th>
                    <th className="pb-3">Status / Priority</th>
                    <th className="pb-3">Remaining Balance</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {cases.map((c) => (
                    <tr key={c.id} className="text-xs hover:bg-slate-950/20 group">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-550 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                            {c.fileNo}
                          </span>
                          <Link
                            href={`/cases/${c.id}`}
                            className="font-extrabold text-white hover:text-amber-400 hover:underline text-sm truncate"
                          >
                            {c.caseNumber}
                          </Link>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                          Client: <span className="text-slate-400 font-bold">{c.client.name}</span>
                        </p>
                      </td>
                      <td className="py-4 font-bold text-slate-350 max-w-xs truncate" title={c.partyName}>
                        {c.partyName}
                      </td>
                      <td className="py-4">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded font-semibold text-slate-300 border border-slate-700/50 uppercase">
                          {c.courtCategory}
                        </span>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-1 max-w-[150px]" title={c.courtName}>
                          {c.courtName}
                        </p>
                      </td>
                      <td className="py-4 space-y-1">
                        <div className="flex gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border ${getStatusBadge(c.status)}`}>
                            {c.status}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border ${getPriorityBadge(c.priority)}`}>
                            {c.priority}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-extrabold text-slate-300">
                          Rs. {Number(c.remainingFee).toLocaleString('en-PK')}
                        </p>
                        <p className="text-[9px] text-slate-550 font-semibold">
                          Total: Rs. {Number(c.totalFee).toLocaleString('en-PK')}
                        </p>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/cases/${c.id}`}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Open Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id, c.caseNumber)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Soft Delete Case"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    }>
      <CasesContent />
    </Suspense>
  );
}
