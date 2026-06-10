import React from 'react';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Scale } from 'lucide-react';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Fresh details every time

export default async function CasePrintPage({ params }: PrintPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const caseData = await prisma.case.findUnique({
    where: { id, deletedAt: null },
    include: {
      client: true,
      hearings: {
        where: { deletedAt: null },
        orderBy: { hearingDate: 'asc' },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { paymentDate: 'asc' },
      },
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!caseData) {
    return notFound();
  }

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto font-serif">
      {/* Header Panel */}
      <div className="text-center space-y-2 pb-6 border-b-2 border-black">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide">
          Sahi Law Chamber
        </h1>
        <p className="text-sm font-semibold tracking-wider uppercase">
          Advocate Supreme Court of Pakistan
        </p>
        <p className="text-xs text-gray-505 font-medium">
          Chamber Suite #4, Supreme Court Bar Association, Islamabad
        </p>
        <p className="text-xs text-gray-505 font-semibold">
          Contact: {caseData.contactNumber}
        </p>
      </div>

      {/* Sheet Subheader */}
      <div className="flex justify-between items-center py-4 text-xs font-bold uppercase tracking-wider text-gray-600">
        <span>Case Brief Sheet</span>
        <span>Generated: {new Date().toLocaleDateString()}</span>
      </div>

      {/* Case Details Block */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 border-l-4 border-black mb-3">
            I. Case Identification
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2.5 font-bold w-1/4">Case Number:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.caseNumber}</td>
                <td className="py-2.5 font-bold w-1/4">Chamber File No:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.fileNo}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2.5 font-bold">Party Title (Suit):</td>
                <td className="py-2.5 font-semibold text-gray-800" colSpan={3}>{caseData.partyName}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2.5 font-bold">Forum (Court):</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.courtName} ({caseData.courtCategory})</td>
                <td className="py-2.5 font-bold">Referral:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.referral || 'Direct Client'}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold">Status:</td>
                <td className="py-2.5 font-bold text-gray-850 uppercase">{caseData.status}</td>
                <td className="py-2.5 font-bold">Priority:</td>
                <td className="py-2.5 font-bold text-gray-850 uppercase">{caseData.priority}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Client Profile Block */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 border-l-4 border-black mb-3">
            II. Client Profile
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2.5 font-bold w-1/4">Client Name:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.client.name}</td>
                <td className="py-2.5 font-bold w-1/4">CNIC Number:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.client.cnic}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2.5 font-bold">Phone Number:</td>
                <td className="py-2.5 font-semibold text-gray-800">{caseData.client.phone}</td>
                <td className="py-2.5 font-bold">Address:</td>
                <td className="py-2.5 font-semibold text-gray-800" colSpan={3}>{caseData.client.address}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Ledger Block */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 border-l-4 border-black mb-3">
            III. Financial Statement
          </h2>
          <div className="grid grid-cols-3 gap-4 border border-gray-200 rounded p-4 text-center mb-4 text-xs font-semibold">
            <div>
              <p className="text-gray-500 uppercase font-bold text-[10px]">Total Contract Fee</p>
              <p className="text-sm font-extrabold text-black mt-1">{formatCurrency(caseData.totalFee)}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase font-bold text-[10px]">Amount Received</p>
              <p className="text-sm font-extrabold text-black mt-1">{formatCurrency(caseData.paidFee)}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase font-bold text-[10px]">Outstanding Balance</p>
              <p className="text-sm font-extrabold text-black mt-1">{formatCurrency(caseData.remainingFee)}</p>
            </div>
          </div>

          {caseData.payments.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-600">
                    <th className="py-2 px-3">Receipt Date</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Transaction Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {caseData.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 text-gray-700">{formatDate(p.paymentDate).split(' at ')[0]}</td>
                      <td className="py-2 px-3 font-bold">{formatCurrency(p.amount)}</td>
                      <td className="py-2 px-3 text-gray-600 font-medium">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hearings Schedule Block */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 border-l-4 border-black mb-3">
            IV. Hearings & Events Schedule
          </h2>
          {caseData.hearings.length === 0 ? (
            <p className="text-xs text-gray-500 font-semibold italic">No hearing logs registered on file.</p>
          ) : (
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-600">
                    <th className="py-2 px-3 w-1/4">Hearing Date</th>
                    <th className="py-2 px-3 w-1/4">Next Hearing</th>
                    <th className="py-2 px-3">Court Remarks & Lawyer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {caseData.hearings.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-3 font-semibold">{formatDate(h.hearingDate)}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {h.nextHearingDate ? formatDate(h.nextHearingDate) : 'Adjourned Sine Die'}
                      </td>
                      <td className="py-2.5 px-3 space-y-1">
                        {h.courtRemarks && (
                          <p className="text-gray-800 font-medium"><span className="font-bold">Court:</span> {h.courtRemarks}</p>
                        )}
                        {h.lawyerNotes && (
                          <p className="text-gray-600 font-medium italic"><span className="font-bold not-italic">Notes:</span> {h.lawyerNotes}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Case Notes Block */}
        {caseData.notes && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 border-l-4 border-black mb-3">
              V. General Advocate Notes
            </h2>
            <p className="text-xs leading-relaxed text-gray-750 font-medium whitespace-pre-line p-3 border border-gray-250 rounded">
              {caseData.notes}
            </p>
          </div>
        )}
      </div>

      {/* Print Trigger */}
      <script
        dangerouslySetInnerHTML={{
          __html: 'window.onload = function() { window.print(); }',
        }}
      />
    </div>
  );
}
