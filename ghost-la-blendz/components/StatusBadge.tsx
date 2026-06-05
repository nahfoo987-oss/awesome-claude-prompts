import { STATUS_CONFIG } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'
import { cn } from '@/lib/utils'

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border tracking-wide',
        config.color
      )}
    >
      {config.label}
    </span>
  )
}
