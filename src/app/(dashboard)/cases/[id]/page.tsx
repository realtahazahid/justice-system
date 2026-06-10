'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Scale,
  Calendar,
  CreditCard,
  Paperclip,
  History,
  Printer,
  Plus,
  Loader2,
  Trash2,
  Download,
  AlertTriangle,
  ExternalLink,
  Edit,
  DollarSign,
  Briefcase,
  Upload,
  CheckCircle,
  Clock,
  Clock3,
  User as UserIcon
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  cnic: string;
  address: string;
}

interface Hearing {
  id: string;
  hearingDate: string;
  nextHearingDate: string | null;
  courtRemarks: string | null;
  lawyerNotes: string | null;
  eventType: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
}

interface Document {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface CaseHistory {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface CaseDetails {
  id: string;
  courtCategory: string;
  courtName: string;
  caseNumber: string;
  fileNo: string;
  referral: string | null;
  partyName: string;
  clientId: string;
  contactNumber: string;
  notes: string | null;
  status: string;
  priority: string;
  totalFee: number;
  paidFee: number;
  remainingFee: number;
  createdAt: string;
  client: Client;
  hearings: Hearing[];
  payments: Payment[];
  documents: Document[];
  histories: CaseHistory[];
}

export default function CaseDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'hearings' | 'ledger' | 'docs' | 'history'>('details');

  // Inline edit states for case fields
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCourtName, setEditCourtName] = useState('');
  const [editCaseNumber, setEditCaseNumber] = useState('');
  const [editFileNo, setEditFileNo] = useState('');
  const [editReferral, setEditReferral] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editTotalFee, setEditTotalFee] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  
  // Submit loading states
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Form states
  // 1. Hearing Form
  const [hearingDate, setHearingDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [eventType, setEventType] = useState('HEARING');
  const [courtRemarks, setCourtRemarks] = useState('');
  const [lawyerNotes, setLawyerNotes] = useState('');
  const [hearingLoading, setHearingLoading] = useState(false);

  // 2. Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // 3. Document Upload Form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('ORDER');
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
        // Pre-fill edits
        setEditStatus(data.status);
        setEditPriority(data.priority);
        setEditCourtName(data.courtName);
        setEditCaseNumber(data.caseNumber);
        setEditFileNo(data.fileNo);
        setEditReferral(data.referral || '');
        setEditPartyName(data.partyName);
        setEditContactNumber(data.contactNumber);
        setEditTotalFee(Number(data.totalFee));
        setEditNotes(data.notes || '');
      } else {
        router.push('/cases');
      }
    } catch (err) {
      console.error(err);
      router.push('/cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCaseDetails();
  }, [id]);

  if (loading || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-950 text-slate-100">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Decrypting legal case file...
        </span>
      </div>
    );
  }

  // Handle Updates
  const handleCaseUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtCategory: caseData.courtCategory,
          courtName: editCourtName,
          caseNumber: editCaseNumber,
          fileNo: editFileNo,
          referral: editReferral || null,
          partyName: editPartyName,
          clientId: caseData.clientId,
          contactNumber: editContactNumber,
          notes: editNotes || null,
          status: editStatus,
          priority: editPriority,
          totalFee: Number(editTotalFee),
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchCaseDetails();
      } else {
        alert('Failed to update case file details');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Add Hearing
  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hearingDate) return;
    setHearingLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}/hearings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hearingDate,
          nextHearingDate: nextHearingDate || null,
          courtRemarks: courtRemarks || null,
          lawyerNotes: lawyerNotes || null,
          eventType,
        }),
      });

      if (res.ok) {
        // Clear fields
        setHearingDate('');
        setNextHearingDate('');
        setEventType('HEARING');
        setCourtRemarks('');
        setLawyerNotes('');
        fetchCaseDetails();
      } else {
        alert('Failed to schedule hearing');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHearingLoading(false);
    }
  };

  // Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    setPayLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          notes: payNotes || null,
        }),
      });

      if (res.ok) {
        setPayAmount('');
        setPayNotes('');
        fetchCaseDetails();
      } else {
        alert('Failed to process payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPayLoading(false);
    }
  };

  // Add PDF Document
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', docType);

    try {
      const res = await fetch(`/api/cases/${id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadFile(null);
        setDocType('ORDER');
        fetchCaseDetails();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to upload document');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete file "${docName}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCaseDetails();
      } else {
        alert('Failed to delete document');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val);
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

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-850 p-4 rounded-xl">
        <Link
          href="/cases"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Index
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/cases/${id}/print`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all"
          >
            <Printer className="h-4 w-4" />
            Print Summary
          </Link>
        </div>
      </div>

      {/* Case Header Details Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border border-slate-850 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[3rem] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                File: {caseData.fileNo}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-850 rounded font-semibold text-slate-400 border border-slate-750 uppercase">
                {caseData.courtCategory}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1.5">
              {caseData.caseNumber}
            </h1>
            <p className="text-sm font-bold text-amber-500 tracking-wide">
              {caseData.partyName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-extrabold tracking-wider ${caseData.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {caseData.status}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-extrabold tracking-wider ${getPriorityBadge(caseData.priority)}`}>
              PRIORITY: {caseData.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-850 overflow-x-auto gap-1">
        {[
          { id: 'details', name: 'General Case Brief', icon: Scale },
          { id: 'hearings', name: 'Hearings Schedule', icon: Calendar },
          { id: 'ledger', name: 'Financial Ledger', icon: CreditCard },
          { id: 'docs', name: 'PDF Document Vault', icon: Paperclip },
          { id: 'history', name: 'Audit History Logs', icon: History },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Viewports */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg">
        {/* Tab 1: General Details */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h2 className="text-base font-bold text-white tracking-wide">
                Case Information & Client Registry
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                {isEditing ? 'Cancel Edit' : 'Edit Brief'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleCaseUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Case Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editCaseNumber}
                      onChange={(e) => setEditCaseNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      File Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editFileNo}
                      onChange={(e) => setEditFileNo(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Referral Source
                    </label>
                    <input
                      type="text"
                      value={editReferral}
                      onChange={(e) => setEditReferral(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Title of Suit (Party Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={editPartyName}
                      onChange={(e) => setEditPartyName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Court Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editCourtName}
                      onChange={(e) => setEditCourtName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Case Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
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
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Total Case Fee (Rs.)
                    </label>
                    <input
                      type="number"
                      required
                      value={editTotalFee}
                      onChange={(e) => setEditTotalFee(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editContactNumber}
                      onChange={(e) => setEditContactNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Lawyer Brief Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    {updateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Case parameters */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Court Category</p>
                      <p className="text-xs font-bold text-white mt-1">{caseData.courtCategory}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Forum (Court Name)</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 truncate" title={caseData.courtName}>{caseData.courtName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chamber File Number</p>
                      <p className="text-xs font-bold text-slate-200 mt-1">{caseData.fileNo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Referral Reference</p>
                      <p className="text-xs font-bold text-slate-200 mt-1">{caseData.referral || 'None'}</p>
                    </div>
                  </div>

                  {/* Notes brief */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Advocate Case Notes</h3>
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 min-h-[100px] text-slate-300 text-xs leading-relaxed font-medium whitespace-pre-line">
                      {caseData.notes || 'No case brief recorded.'}
                    </div>
                  </div>
                </div>

                {/* Client brief */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                      <UserIcon className="h-4 w-4 text-amber-500" />
                      Client Profile
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">Client Name</p>
                        <p className="font-extrabold text-white mt-0.5">{caseData.client.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">CNIC / ID Number</p>
                        <p className="font-bold text-slate-300 mt-0.5">{caseData.client.cnic}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">Contact info</p>
                        <p className="font-bold text-slate-350 mt-0.5">{caseData.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">Registered Address</p>
                        <p className="text-slate-400 mt-0.5 leading-relaxed font-medium">{caseData.client.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Hearings schedule */}
        {activeTab === 'hearings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule wizard */}
            <div className="lg:col-span-1 bg-slate-950/40 border border-slate-850 rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
                <Plus className="h-4 w-4 text-amber-500" />
                Schedule Hearing/Event
              </h3>
              <form onSubmit={handleAddHearing} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Hearing Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Next Hearing Date (Tentative)
                  </label>
                  <input
                    type="datetime-local"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  >
                    <option value="HEARING">HEARING</option>
                    <option value="MEETING">MEETING</option>
                    <option value="FILING">FILING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Court Remarks
                  </label>
                  <input
                    type="text"
                    value={courtRemarks}
                    onChange={(e) => setCourtRemarks(e.target.value)}
                    placeholder="e.g. Adjourned till next date"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Advocate Private Notes
                  </label>
                  <textarea
                    value={lawyerNotes}
                    onChange={(e) => setLawyerNotes(e.target.value)}
                    placeholder="Prepare evidence briefs, compile documents..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={hearingLoading}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {hearingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Event'}
                </button>
              </form>
            </div>

            {/* Hearings List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Hearings</h3>
              {caseData.hearings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-850 rounded-xl">
                  <Calendar className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No hearings scheduled</p>
                  <p className="text-[10px] text-slate-500 mt-1">Schedule hearings using the wizard panel.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseData.hearings.map((h) => (
                    <div
                      key={h.id}
                      className="p-5 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition-all relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-bl bg-amber-500/10 border-l border-b border-amber-500/20 text-amber-400">
                        {h.eventType}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3.5">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Hearing Date</p>
                          <p className="text-xs font-extrabold text-white mt-0.5">{formatDate(h.hearingDate)}</p>
                        </div>
                        {h.nextHearingDate && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Next Hearing Date</p>
                            <p className="text-xs font-extrabold text-amber-400 mt-0.5">{formatDate(h.nextHearingDate)}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">Court Remarks</p>
                          <p className="text-slate-350 font-bold mt-1 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                            {h.courtRemarks || 'No remarks recorded.'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550">Lawyer Notes</p>
                          <p className="text-slate-350 font-bold mt-1 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                            {h.lawyerNotes || 'No private notes.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Ledger */}
        {activeTab === 'ledger' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Add form */}
            <div className="lg:col-span-1 bg-slate-950/40 border border-slate-850 rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
                <Plus className="h-4 w-4 text-amber-500" />
                Add Fee Payment
              </h3>
              <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount paid"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Receipt / Payment Notes
                  </label>
                  <textarea
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Cash payment, online transfer reference..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Process Payment'}
                </button>
              </form>
            </div>

            {/* Ledger Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balances panel */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950 border border-slate-850 rounded-xl p-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Fee</p>
                  <p className="text-base md:text-xl font-extrabold text-white mt-1">
                    {formatCurrency(Number(caseData.totalFee))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550 text-emerald-450">Paid Amount</p>
                  <p className="text-base md:text-xl font-extrabold text-emerald-400 mt-1">
                    {formatCurrency(Number(caseData.paidFee))}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-550 text-amber-500">Outstanding Balance</p>
                  <p className="text-base md:text-xl font-extrabold text-amber-500 mt-1">
                    {formatCurrency(Number(caseData.remainingFee))}
                  </p>
                </div>
              </div>

              {/* Payments History List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Receipt Ledger</h3>
                {caseData.payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-850 rounded-xl">
                    <CreditCard className="h-10 w-10 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No payments recorded</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-850 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-850 text-[9px] uppercase font-bold tracking-wider text-slate-500">
                          <th className="py-2.5 px-4">Receipt Date</th>
                          <th className="py-2.5 px-4">Amount</th>
                          <th className="py-2.5 px-4">Ledger Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 bg-slate-950/20">
                        {caseData.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-950/30">
                            <td className="py-3 px-4 font-bold text-slate-400">
                              {formatDate(p.paymentDate).split(' at ')[0]}
                            </td>
                            <td className="py-3 px-4 font-extrabold text-white text-sm">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-medium">
                              {p.notes || '-'}
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
        )}

        {/* Tab 4: PDF Documents */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Upload panel */}
            <div className="lg:col-span-1 bg-slate-950/40 border border-slate-850 rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
                <Upload className="h-4 w-4 text-amber-500" />
                Upload PDF File
              </h3>
              <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select PDF Document (Max 5MB)
                  </label>
                  <input
                    type="file"
                    required
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 focus:outline-none focus:border-amber-500 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-2.5 file:py-1 file:mr-3 file:text-xs file:font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Classification
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="ORDER">COURT ORDER</option>
                    <option value="JUDGMENT">JUDGMENT</option>
                    <option value="PETITION">PETITION</option>
                    <option value="EVIDENCE">EVIDENCE / PROOF</option>
                    <option value="OTHER">OTHER RECORD</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Secure Upload'}
                </button>
              </form>
            </div>

            {/* Document Vault List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">PDF Records Vault</h3>
              {caseData.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-850 rounded-xl">
                  <Paperclip className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No documents uploaded</p>
                  <p className="text-[10px] text-slate-500 mt-1">Upload PDF briefs, petitions, and orders.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-all gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 uppercase text-slate-400 inline-block mb-1">
                            {doc.type}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate max-w-sm" title={doc.name}>
                            {doc.name}
                          </h4>
                          <p className="text-[10px] text-slate-550 font-bold mt-0.5">
                            Size: {(doc.size / 1024).toFixed(1)} KB &bull; Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`/api/documents/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-all"
                          title="Open PDF"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.name)}
                          className="p-2 text-slate-450 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete PDF"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Case History Logs */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Case Audit Trail Timeline</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                Immutable, timestamped record of all modifications. Records cannot be altered.
              </p>
            </div>

            <div className="relative border-l border-slate-850 pl-6 space-y-6 ml-2">
              {caseData.histories.map((h, i) => (
                <div key={h.id} className="relative group">
                  {/* Circle Indicator */}
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border bg-slate-900 border-amber-500/55 group-hover:scale-110 transition-all flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </span>

                  <div>
                    <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-extrabold text-slate-450 border border-slate-850/80 uppercase inline-block mb-1.5">
                      {h.action}
                    </span>
                    <p className="text-xs font-bold text-white leading-relaxed">
                      {h.description}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      {formatDate(h.createdAt)} &bull; Action by: <span className="text-slate-400 font-bold">{h.user?.name || h.user?.email || 'System'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
