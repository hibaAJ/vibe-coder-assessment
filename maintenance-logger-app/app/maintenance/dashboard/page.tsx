import { MaintenanceDashboard } from '@/components/maintenance/dashboard-table'

export const metadata = {
  title: 'Maintenance Dashboard | Property Management Portal',
}

export default function MaintenanceDashboardPage() {
  return (
    <div className="py-4">
      <MaintenanceDashboard />
    </div>
  )
}
