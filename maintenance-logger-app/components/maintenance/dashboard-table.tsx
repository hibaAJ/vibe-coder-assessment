'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Download, RefreshCw, Filter } from 'lucide-react'
import { supabase, type MaintenanceIssue } from '@/lib/supabase'
import { exportToCSV, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 20

const PROPERTIES = [
  'All Properties',
  'Sunset Villa',
  'Ocean Breeze Apt',
  'Mountain Lodge',
  'City Loft',
  'Riverside Cottage',
]

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export function MaintenanceDashboard() {
  const [issues, setIssues] = useState<MaintenanceIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('All Properties')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('maintenance_issues')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (propertyFilter !== 'All Properties') {
        query = query.eq('property', propertyFilter)
      }
      if (urgencyFilter !== 'all') {
        query = query.eq('urgency', urgencyFilter)
      }

      const { data, error, count } = await query

      if (error) throw new Error(error.message)
      setIssues((data as MaintenanceIssue[]) ?? [])
      setTotal(count ?? 0)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load issues'
      toast.error('Load Failed', { description: msg })
    } finally {
      setLoading(false)
    }
  }, [page, propertyFilter, urgencyFilter])

  useEffect(() => {
    setPage(0)
  }, [propertyFilter, urgencyFilter])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('maintenance_issues')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw new Error(error.message)

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id
            ? {
                ...issue,
                status: newStatus as MaintenanceIssue['status'],
                last_updated_at: new Date().toISOString(),
              }
            : issue
        )
      )
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      toast.error('Update Failed', { description: msg })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleExport = () => {
    const exportData = issues.map((issue) => ({
      ticket_id: issue.ticket_id,
      property: issue.property,
      category: issue.category,
      urgency: issue.urgency,
      description: issue.description,
      status: issue.status,
      created_at: formatDate(issue.created_at),
      last_updated_at: formatDate(issue.last_updated_at),
    }))
    exportToCSV(exportData, `maintenance-issues-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    toast.success('CSV exported successfully')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} total issue{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchIssues} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={issues.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Property</label>
              <Select value={propertyFilter} onValueChange={(val) => { if (val !== null) setPropertyFilter(val) }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTIES.map((p) => (
                    <SelectItem key={p} value={p} className="text-sm">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Urgency</label>
              <Select value={urgencyFilter} onValueChange={(val) => { if (val !== null) setUrgencyFilter(val) }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Urgencies</SelectItem>
                  <SelectItem value="low" className="text-sm">Low</SelectItem>
                  <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                  <SelectItem value="high" className="text-sm">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <p className="text-sm">No issues found</p>
              {(propertyFilter !== 'All Properties' || urgencyFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPropertyFilter('All Properties')
                    setUrgencyFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Ticket #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[90px]">Urgency</TableHead>
                    <TableHead className="whitespace-nowrap">Date Submitted</TableHead>
                    <TableHead className="whitespace-nowrap">Last Updated</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium">{issue.ticket_id}</span>
                      </TableCell>
                      <TableCell className="text-sm">{issue.property}</TableCell>
                      <TableCell className="text-sm capitalize">{issue.category}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${URGENCY_COLORS[issue.urgency]}`}
                        >
                          {issue.urgency}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(issue.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(issue.last_updated_at)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={issue.status}
                          onValueChange={(val) => { if (val !== null) updateStatus(issue.id, val) }}
                          disabled={updatingId === issue.id}
                        >
                          <SelectTrigger className="h-7 text-xs w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open" className="text-xs">Open</SelectItem>
                            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                            <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
