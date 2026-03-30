import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-12 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Maintenance Logger</h1>
      <p className="text-muted-foreground">Internal tool for logging and tracking property maintenance issues.</p>
      <div className="flex flex-col gap-3">
        <Link href="/maintenance/submit" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
          Submit a Maintenance Issue
        </Link>
        <Link href="/maintenance/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
          View Dashboard
        </Link>
      </div>
    </div>
  )
}
