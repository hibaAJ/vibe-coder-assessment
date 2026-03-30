import { MaintenanceSubmitForm } from '@/components/maintenance/submit-form'

export const metadata = {
  title: 'Log Maintenance Issue | Property Management Portal',
}

export default function MaintenanceSubmitPage() {
  return (
    <div className="py-4">
      <MaintenanceSubmitForm />
    </div>
  )
}
