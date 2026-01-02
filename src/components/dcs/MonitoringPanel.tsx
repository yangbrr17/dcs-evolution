import React from 'react';
import { TagData } from '@/types/dcs';
import { Activity, Thermometer, Gauge, Droplet, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MonitoringPanelProps {
  tags: TagData[];
  onTagClick: (tag: TagData) => void;
}

const getTagIcon = (tagName: string) => {
  if (tagName.startsWith('TI')) return Thermometer;
  if (tagName.startsWith('PI')) return Gauge;
  if (tagName.startsWith('FI')) return Activity;
  if (tagName.startsWith('LI')) return Droplet;
  return TrendingUp;
};

const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ tags, onTagClick }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'alarm':
        return 'border-l-status-alarm';
      case 'warning':
        return 'border-l-status-warning';
      default:
        return 'border-l-status-normal';
    }
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'alarm':
        return 'status-dot-alarm';
      case 'warning':
        return 'status-dot-warning';
      default:
        return 'status-dot-normal';
    }
  };

  // Group tags by type
  const groupedTags = tags.reduce((acc, tag) => {
    const prefix = tag.name.substring(0, 2);
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(tag);
    return acc;
  }, {} as Record<string, TagData[]>);

  const groupNames: Record<string, string> = {
    TI: '温度',
    PI: '压力',
    FI: '流量',
    LI: '液位',
  };

  return (
    <div className="dcs-panel h-full flex flex-col">
      {/* Header */}
      <div className="dcs-header flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="font-medium">监测点位</span>
        <span className="ml-auto text-xs text-muted-foreground">{tags.length} 点</span>
      </div>

      {/* Tag List */}
      <ScrollArea className="flex-1 dcs-scrollbar">
        <div className="p-2 space-y-3">
          {Object.entries(groupedTags).map(([prefix, groupTags]) => (
            <div key={prefix}>
              <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                {React.createElement(getTagIcon(prefix + '-'), { className: 'w-3 h-3' })}
                {groupNames[prefix] || prefix}
              </div>
              <div className="space-y-1">
                {groupTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={cn(
                      'p-2 bg-secondary/50 rounded-md border-l-4 cursor-pointer hover:bg-secondary/80 transition-colors',
                      getStatusClass(tag.status)
                    )}
                    onClick={() => onTagClick(tag)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('status-dot', getStatusDotClass(tag.status))} />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{tag.description}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="dcs-value text-base">
                        {tag.currentValue.toFixed(1)}
                        <span className="text-xs text-muted-foreground ml-1">{tag.unit}</span>
                      </span>
                      <div className="text-right text-xs">
                        <div className="text-muted-foreground">
                          SP: <span className="dcs-setpoint">{tag.setpoint.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MonitoringPanel;
