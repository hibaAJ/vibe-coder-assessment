import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileText, Wrench, LayoutDashboard } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Property Management Portal</h1>
        <p className="text-muted-foreground">Internal tools for operations and finance teams</p>
      </div>

      <div className="grid gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Guest Refund Requests
            </CardTitle>
            <CardDescription>Submit a refund request for a guest booking</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/refund" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
              Open Refund Form
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Report Maintenance Issue
            </CardTitle>
            <CardDescription>
              Log a new property maintenance issue and get a ticket ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/maintenance/submit"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Submit Issue
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-green-500" />
              Maintenance Dashboard
            </CardTitle>
            <CardDescription>View, filter, and manage all maintenance issues</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/maintenance/dashboard"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              Open Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
