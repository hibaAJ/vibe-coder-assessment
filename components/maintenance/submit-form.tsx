'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, X, CheckCircle2, Copy } from 'lucide-react'
import Link from 'next/link'
import { maintenanceSchema, type MaintenanceFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import { generateTicketId, cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const PROPERTIES = [
  'Sunset Villa',
  'Ocean Breeze Apt',
  'Mountain Lodge',
  'City Loft',
  'Riverside Cottage',
]

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC / Air Conditioning' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'structural', label: 'Structural' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]

const URGENCY_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    description: 'Can wait a few days',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Needs attention this week',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Urgent — affects guests now',
    color: 'text-red-600 dark:text-red-400',
  },
]

export function MaintenanceSubmitForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  })

  const urgency = watch('urgency')

  const copyTicket = () => {
    if (!ticketId) return
    navigator.clipboard.writeText(ticketId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsSubmitting(true)
    try {
      let photoUrl: string | null = null

      if (data.photo && selectedPhoto) {
        const ext = selectedPhoto.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('maintenance-photos')
          .upload(path, selectedPhoto, { contentType: selectedPhoto.type })

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }

      const ticket = generateTicketId()

      const { error } = await supabase.from('maintenance_issues').insert({
        ticket_id: ticket,
        property: data.property,
        category: data.category,
        urgency: data.urgency,
        description: data.description.trim(),
        photo_url: photoUrl,
        status: 'open',
      })

      if (error) throw new Error(error.message)

      setTicketId(ticket)
      reset()
      setSelectedPhoto(null)
      toast.success('Issue logged successfully')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      toast.error('Submission Failed', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (ticketId) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="py-10 flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Issue Logged</h2>
            <p className="text-muted-foreground mt-1">Your maintenance ticket has been created</p>
          </div>
          <div className="w-full bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Ticket ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-widest">{ticketId}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTicket}>
                <Copy className={cn('h-4 w-4', copied && 'text-green-500')} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Save this ID for tracking purposes</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setTicketId(null)}>
              Log Another Issue
            </Button>
            <Link
              href="/maintenance/dashboard"
              className={cn(buttonVariants({ variant: 'default' }), 'flex-1')}
            >
              View Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Log Maintenance Issue</CardTitle>
        <CardDescription>
          Report a property maintenance problem for the team to address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Property */}
          <div className="space-y-1.5">
            <Label>
              Property <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(val) => {
                if (val !== null) {
                  setValue('property', val as MaintenanceFormData['property'], {
                    shouldValidate: true,
                  })
                }
              }}
            >
              <SelectTrigger aria-invalid={!!errors.property} className="w-full">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property && (
              <p className="text-sm text-destructive">{errors.property.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              Issue Category <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(val) => {
                if (val !== null) {
                  setValue('category', val as MaintenanceFormData['category'], {
                    shouldValidate: true,
                  })
                }
              }}
            >
              <SelectTrigger aria-invalid={!!errors.category} className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>
              Urgency <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              onValueChange={(val) => {
                if (val !== null) {
                  setValue('urgency', val as MaintenanceFormData['urgency'], {
                    shouldValidate: true,
                  })
                }
              }}
              className="grid grid-cols-3 gap-3"
            >
              {URGENCY_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem
                    value={opt.value}
                    id={`urgency-${opt.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`urgency-${opt.value}`}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                      urgency === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className={cn('text-sm font-semibold', opt.color)}>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-0.5">
                      {opt.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.urgency && (
              <p className="text-sm text-destructive">{errors.urgency.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail — location within property, when it started, any relevant context..."
              rows={4}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <Label>Photo (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {selectedPhoto ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate max-w-[80%]">
                    {selectedPhoto.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      setSelectedPhoto(null)
                      setValue('photo', undefined)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Click to upload a photo
                    <br />
                    <span className="text-xs">JPEG, PNG, WebP · Max 10MB</span>
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedPhoto(file)
                        setValue('photo', file, { shouldValidate: true })
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {errors.photo && (
              <p className="text-sm text-destructive">{errors.photo.message as string}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Log Issue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
