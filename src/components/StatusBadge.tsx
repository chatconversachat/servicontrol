import { Badge } from '@/components/ui/badge';
import { getStatusLabel, getStatusClass } from '@/lib/data';
import { ServiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(getStatusClass(status), 'font-medium', className)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
