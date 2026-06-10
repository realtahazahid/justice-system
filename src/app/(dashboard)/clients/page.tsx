'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Trash2,
  Edit,
  Loader2,
  X,
  UserCheck,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  cnic: string;
  address: string;
  createdAt: string;
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  
  // Error states
  const [errors, setErrors] = useState<any>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Load clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    if (searchParams.get('new') === 'true') {
      setIsFormOpen(true);
    }
  }, [searchParams]);

  // Clean form
  const resetForm = () => {
    setName('');
    setPhone('');
    setCnic('');
    setAddress('');
    setErrors({});
    setEditingId(null);
    setGeneralError(null);
    setIsFormOpen(false);
    // Remove query params
    if (searchParams.get('new') === 'true') {
      router.replace('/clients');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setName(client.name);
    setPhone(client.phone);
    setCnic(client.cnic);
    setAddress(client.address);
    setIsFormOpen(true);
    setGeneralError(null);
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete client "${clientName}"? This will also soft-delete all cases registered under this client.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id));
      } else {
        alert('Failed to delete client');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrors({});
    setGeneralError(null);

    // Simple client side checks before fetching
    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      setErrors({ cnic: ['CNIC must match format XXXXX-XXXXXXX-X (e.g. 35201-1234567-1)'] });
      setSubmitLoading(false);
      return;
    }

    const payload = { name, phone, cnic, address };

    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        resetForm();
        fetchClients();
      } else {
        if (data.error && typeof data.error === 'object') {
          setErrors(data.error);
        } else {
          setGeneralError(data.error || 'Failed to submit client');
        }
      }
    } catch (err) {
      setGeneralError('Network error. Please try again.');
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter list
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cnic.includes(searchQuery) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-500" />
            Clients Directory
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Search, edit, and register chamber client records.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          New Client Record
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form panel - slide-over styled */}
        {isFormOpen && (
          <div className="lg:col-span-1 bg-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white tracking-wide">
                {editingId ? 'Edit Client Details' : 'Register New Client'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {generalError && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Full Client Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Ali Sahi"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-semibold"
                />
                {errors.name && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-semibold">{errors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-semibold"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-semibold">{errors.phone[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  CNIC Number (13-digit format)
                </label>
                <input
                  type="text"
                  required
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="35201-1234567-1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-semibold"
                />
                {errors.cnic && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-semibold">{errors.cnic[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Residential / Business Address
                </label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Chamber Suite #4, Supreme Court Bar Association, Islamabad"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                />
                {errors.address && (
                  <p className="mt-1.5 text-[10px] text-rose-400 font-semibold">{errors.address[0]}</p>
                )}
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
                    'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Directory List panel */}
        <div className={`bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-lg ${isFormOpen ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="relative mb-5 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by name, CNIC, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all text-xs font-semibold"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading client records...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <Users className="h-12 w-12 text-slate-700 mb-3" />
              <p className="text-xs font-bold text-slate-400">No client records found</p>
              <p className="text-[10px] text-slate-500 mt-1">Try matching different query criteria or create a new client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    <th className="pb-3 pl-2">Name / CNIC</th>
                    <th className="pb-3">Contact info</th>
                    <th className="pb-3">Residential Address</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="text-xs hover:bg-slate-950/20 group">
                      <td className="py-4 pl-2">
                        <p className="font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5 uppercase">
                          CNIC: {client.cnic}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-550" />
                          {client.phone}
                        </p>
                      </td>
                      <td className="py-4 max-w-xs truncate text-slate-400 font-medium" title={client.address}>
                        {client.address}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete Record"
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
