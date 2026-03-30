'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefundSuccessScreen } from './success-screen'
import type { RefundRequest } from '@/lib/supabase'

const REFUND_REASONS = [
  { value: 'cancellation', label: 'Booking Cancellation' },
  { value: 'service_issue', label: 'Service Issue' },
  { value: 'double_charge', label: 'Double Charge' },
  { value: 'property_condition', label: 'Property Condition' },
  { value: 'other', label: 'Other' },
]

const input =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400'

const errorInput = 'border-red-500 focus:border-red-500 focus:ring-red-200'

function isOver90DaysAgo(dateStr: string): boolean {
  const picked = new Date(dateStr + 'T00:00:00')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  return picked < cutoff
}

export function RefundForm() {
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [details, setDetails]       = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<RefundRequest | null>(null)

  const showWarning = bookingDate !== '' && isOver90DaysAgo(bookingDate)

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!fullName.trim())                        e.fullName = 'Full name is required'
    if (!email.trim())                           e.email = 'Email address is required'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!bookingRef.trim())                      e.bookingRef = 'Booking reference is required'
    if (!bookingDate)                            e.bookingDate = 'Please select a booking date'
    if (!refundReason)                           e.refundReason = 'Please select a reason'
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) e.file = 'File must be under 5MB'
    return e
  }

  async function handleSubmit() {
    setSubmitError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setIsSubmitting(true)

    try {
      let fileUrl: string | null = null

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('refund-receipts')
          .upload(path, selectedFile, { contentType: selectedFile.type })
        if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`)
        const { data: urlData } = supabase.storage.from('refund-receipts').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      const payload = {
        full_name:     fullName.trim(),
        email:         email.toLowerCase().trim(),
        booking_ref:   bookingRef.trim().toUpperCase(),
        booking_date:  bookingDate,
        refund_reason: refundReason,
        details:       details.trim() || null,
        file_url:      fileUrl,
      }

      const { error } = await supabase.from('refund_requests').insert(payload)
      if (error) throw new Error(error.message)

      const successData: RefundRequest = {
        id:         crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...payload,
      }

      setSubmittedData(successData)

      setTimeout(() => {
        toast.success('Email Confirmation Sent', {
          description: `A confirmation has been sent to ${email}`,
        })
      }, 800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setFullName(''); setEmail(''); setBookingRef(''); setBookingDate('')
    setRefundReason(''); setDetails(''); setSelectedFile(null)
    setErrors({}); setSubmitError(''); setSubmittedData(null)
  }

  if (submittedData) {
    return <RefundSuccessScreen data={submittedData} onReset={resetForm} />
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Guest Refund Request</CardTitle>
        <CardDescription>
          Complete the form below. We aim to respond within 3–5 business days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className={cn(input, errors.fullName && errorInput)}
          />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className={cn(input, errors.email && errorInput)}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        {/* Booking Reference */}
        <div className="space-y-1.5">
          <Label htmlFor="bookingRef">Booking Reference <span className="text-red-500">*</span></Label>
          <input
            id="bookingRef"
            type="text"
            value={bookingRef}
            onChange={e => setBookingRef(e.target.value)}
            placeholder="BK-123456"
            className={cn(input, errors.bookingRef && errorInput)}
          />
          {errors.bookingRef && <p className="text-sm text-red-500">{errors.bookingRef}</p>}
        </div>

        {/* Booking Date */}
        <div className="space-y-1.5">
          <Label htmlFor="bookingDate">Booking Date <span className="text-red-500">*</span></Label>
          <input
            id="bookingDate"
            type="date"
            value={bookingDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setBookingDate(e.target.value)}
            className={cn(input, errors.bookingDate && errorInput)}
          />
          {errors.bookingDate && <p className="text-sm text-red-500">{errors.bookingDate}</p>}
        </div>

        {/* 90-day warning */}
        {showWarning && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-950/30 dark:border-yellow-600">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Your booking is outside the standard refund window. Your request will be reviewed on a case-by-case basis.
            </p>
          </div>
        )}

        {/* Refund Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="refundReason">Refund Reason <span className="text-red-500">*</span></Label>
          <select
            id="refundReason"
            value={refundReason}
            onChange={e => setRefundReason(e.target.value)}
            className={cn(input, errors.refundReason && errorInput)}
          >
            <option value="" disabled>Select a reason</option>
            {REFUND_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.refundReason && <p className="text-sm text-red-500">{errors.refundReason}</p>}
        </div>

        {/* Additional Details */}
        <div className="space-y-1.5">
          <Label htmlFor="details">Additional Details</Label>
          <Textarea
            id="details"
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Please describe your situation in detail..."
            rows={4}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-1.5">
          <Label>Supporting Document (optional)</Label>
          <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-600 p-4">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-zinc-400 truncate max-w-[80%]">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <Upload className="h-6 w-6 text-gray-400" />
                <p className="text-sm text-gray-500 text-center">JPEG, PNG, WebP, PDF · Max 5MB</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) setSelectedFile(file)
                  }}
                  className="text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm file:font-medium file:cursor-pointer dark:file:bg-zinc-800 dark:file:text-zinc-200 cursor-pointer"
                />
              </div>
            )}
          </div>
          {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
        </div>

        {/* Submission error */}
        {submitError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        {/* Submit — plain button, no Base UI wrapper */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
        </button>

      </CardContent>
    </Card>
  )
}
