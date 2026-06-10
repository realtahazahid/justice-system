import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must match format 12345-1234567-1'),
  address: z.string().min(1, 'Address is required'),
});

export const CaseSchema = z.object({
  courtCategory: z.enum(['Civil Court', 'Tribunal Court', 'High Court', 'Supreme Court'], {
    message: 'Invalid court category',
  }),
  courtName: z.string().min(1, 'Court name is required'),
  caseNumber: z.string().min(1, 'Case number is required'),
  fileNo: z.string().min(1, 'File number is required'),
  referral: z.string().optional().nullable(),
  partyName: z.string().min(1, 'Party name is required'),
  clientId: z.string().uuid('Invalid client identifier'),
  contactNumber: z.string().min(10, 'Contact number must be valid'),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'CLOSED'], {
    message: 'Status must be ACTIVE or CLOSED',
  }),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'], {
    message: 'Priority must be HIGH, MEDIUM, or LOW',
  }),
  totalFee: z.coerce.number().min(0, 'Total fee must be a positive number'),
});

export const HearingSchema = z.object({
  hearingDate: z.coerce.date(),
  nextHearingDate: z.coerce.date().optional().nullable(),
  courtRemarks: z.string().optional().nullable(),
  lawyerNotes: z.string().optional().nullable(),
  eventType: z.enum(['HEARING', 'MEETING', 'FILING'], {
    message: 'Event type must be HEARING, MEETING, or FILING',
  }),
});

export const PaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  notes: z.string().optional().nullable(),
});
