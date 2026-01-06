import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Info, AlertCircle, Wrench, ClipboardCheck, FileText } from 'lucide-react';
import { ShiftEvent, getEventTypeLabel, getSeverityLabel } from '@/services/shiftEventService';

interface ShiftEventListProps {
  events: ShiftEvent[];
  maxHeight?: string;
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  general: <FileText className="h-3 w-3" />,
  emergency: <AlertTriangle className="h-3 w-3" />,
  maintenance: <Wrench className="h-3 w-3" />,
  inspection: <ClipboardCheck className="h-3 w-3" />,
  other: <Info className="h-3 w-3" />,
};

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  critical: 'bg-red-500/10 text-red-500 border-red-500/30',
};

const eventTypeColors: Record<string, string> = {
  general: 'bg-muted text-muted-foreground',
  emergency: 'bg-red-500/10 text-red-500',
  maintenance: 'bg-purple-500/10 text-purple-500',
  inspection: 'bg-green-500/10 text-green-500',
  other: 'bg-muted text-muted-foreground',
};

const ShiftEventList: React.FC<ShiftEventListProps> = ({ events, maxHeight = '200px' }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        暂无大事记
      </div>
    );
  }

  return (
    <ScrollArea className={`pr-2`} style={{ maxHeight }}>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-3 rounded-lg border ${
              event.severity === 'critical'
                ? 'border-red-500/30 bg-red-500/5'
                : event.severity === 'warning'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge
                  variant="secondary"
                  className={`text-xs px-1.5 py-0 h-5 ${eventTypeColors[event.event_type]}`}
                >
                  {eventTypeIcons[event.event_type]}
                  <span className="ml-1">{getEventTypeLabel(event.event_type)}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 h-5 ${severityColors[event.severity]}`}
                >
                  {getSeverityLabel(event.severity)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(event.created_at).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h4 className="text-sm font-medium mb-0.5">{event.title}</h4>

            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="text-xs text-muted-foreground mt-1">
              记录人: {event.operator_name}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ShiftEventList;
