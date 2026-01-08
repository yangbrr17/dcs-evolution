import React, { useMemo } from 'react';
import { BowTieConfig, BowTieEvent, TagData, TagStatus } from '@/types/dcs';
import { cn } from '@/lib/utils';

interface BowTieViewerProps {
  bowTie: BowTieConfig;
  tags: TagData[];
  onEventClick?: (event: BowTieEvent) => void;
  onTopEventHover?: (tagId: string | null) => void;
}

const BowTieViewer: React.FC<BowTieViewerProps> = ({
  bowTie,
  tags,
  onEventClick,
  onTopEventHover,
}) => {
  // Get status for events with linked tags
  const eventStatuses = useMemo(() => {
    const statuses: Record<string, TagStatus> = {};
    bowTie.events.forEach(event => {
      if (event.tagId) {
        const tag = tags.find(t => t.id === event.tagId);
        statuses[event.id] = tag?.status || 'normal';
      }
    });
    return statuses;
  }, [bowTie.events, tags]);

  // Event type colors
  const getEventColor = (event: BowTieEvent): string => {
    const status = eventStatuses[event.id];
    if (status === 'alarm') return 'fill-status-alarm stroke-status-alarm';
    if (status === 'warning') return 'fill-status-warning stroke-status-warning';

    switch (event.type) {
      case 'threat':
        return 'fill-orange-500/20 stroke-orange-500';
      case 'barrier':
        return 'fill-blue-500/20 stroke-blue-500';
      case 'top_event':
        return 'fill-red-500/20 stroke-red-500';
      case 'recovery':
        return 'fill-green-500/20 stroke-green-500';
      case 'consequence':
        return 'fill-purple-500/20 stroke-purple-500';
      default:
        return 'fill-muted stroke-muted-foreground';
    }
  };

  const getEventShape = (event: BowTieEvent) => {
    const x = event.position.x;
    const y = event.position.y;
    const width = 12;
    const height = 8;

    switch (event.type) {
      case 'threat':
        // Hexagon pointing right
        return `M${x - width/2},${y} L${x - width/4},${y - height/2} L${x + width/4},${y - height/2} L${x + width/2},${y} L${x + width/4},${y + height/2} L${x - width/4},${y + height/2} Z`;
      case 'barrier':
        // Rectangle with rounded ends (vertical barrier)
        return `M${x - 1.5},${y - height/2} L${x + 1.5},${y - height/2} L${x + 1.5},${y + height/2} L${x - 1.5},${y + height/2} Z`;
      case 'top_event':
        // Circle (rendered separately)
        return '';
      case 'recovery':
        // Rectangle
        return `M${x - width/3},${y - height/2} L${x + width/3},${y - height/2} L${x + width/3},${y + height/2} L${x - width/3},${y + height/2} Z`;
      case 'consequence':
        // Diamond
        return `M${x},${y - height/2} L${x + width/3},${y} L${x},${y + height/2} L${x - width/3},${y} Z`;
      default:
        return '';
    }
  };

  // Render links between events
  const renderLinks = () => {
    return bowTie.links.map((link, index) => {
      const fromEvent = bowTie.events.find(e => e.id === link.from);
      const toEvent = bowTie.events.find(e => e.id === link.to);
      if (!fromEvent || !toEvent) return null;

      const fromX = fromEvent.position.x;
      const fromY = fromEvent.position.y;
      const toX = toEvent.position.x;
      const toY = toEvent.position.y;

      // Calculate control points for curved lines
      const midX = (fromX + toX) / 2;
      
      return (
        <path
          key={`link-${index}`}
          d={`M${fromX + 6},${fromY} Q${midX},${fromY} ${midX},${(fromY + toY) / 2} T${toX - 6},${toY}`}
          className="stroke-muted-foreground/50 fill-none"
          strokeWidth="0.3"
          strokeDasharray="1,0.5"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="relative h-full w-full bg-card/50 rounded-lg overflow-hidden">
      {/* Title */}
      <div className="absolute top-2 left-2 z-10">
        <h3 className="text-sm font-medium text-foreground">{bowTie.name}</h3>
      </div>

      {/* Legend */}
      <div className="absolute top-2 right-2 z-10 flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500/20 border border-orange-500 rounded-sm" />
          <span className="text-muted-foreground">威胁</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-3 bg-blue-500 rounded-sm" />
          <span className="text-muted-foreground">屏障</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded-full" />
          <span className="text-muted-foreground">顶事件</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded-sm" />
          <span className="text-muted-foreground">恢复</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500/20 border border-purple-500 rotate-45" />
          <span className="text-muted-foreground">后果</span>
        </div>
      </div>

      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 4 2, 0 4"
              className="fill-muted-foreground/50"
            />
          </marker>
        </defs>

        {/* Links */}
        {renderLinks()}

        {/* Events */}
        {bowTie.events.map(event => {
          const status = eventStatuses[event.id];
          const isAlarming = status === 'alarm' || status === 'warning';

          return (
            <g
              key={event.id}
              className={cn(
                'cursor-pointer transition-opacity hover:opacity-80',
                isAlarming && 'animate-pulse'
              )}
              onClick={() => onEventClick?.(event)}
              onMouseEnter={() => {
                if (event.type === 'top_event' && event.tagId) {
                  onTopEventHover?.(event.tagId);
                }
              }}
              onMouseLeave={() => {
                if (event.type === 'top_event') {
                  onTopEventHover?.(null);
                }
              }}
            >
              {event.type === 'top_event' ? (
                <circle
                  cx={event.position.x}
                  cy={event.position.y}
                  r="5"
                  className={cn(getEventColor(event), 'stroke-2')}
                />
              ) : event.type === 'barrier' ? (
                <rect
                  x={event.position.x - 1.5}
                  y={event.position.y - 4}
                  width="3"
                  height="8"
                  rx="0.5"
                  className={cn(getEventColor(event), 'stroke-1')}
                />
              ) : (
                <path
                  d={getEventShape(event)}
                  className={cn(getEventColor(event), 'stroke-1')}
                />
              )}
              
              {/* Label */}
              <text
                x={event.position.x}
                y={event.type === 'barrier' ? event.position.y + 7 : event.position.y + 8}
                textAnchor="middle"
                className="fill-foreground text-[2px] font-medium"
              >
                {event.label}
              </text>

              {/* Tag indicator */}
              {event.tagId && (
                <circle
                  cx={event.position.x + 5}
                  cy={event.position.y - 4}
                  r="1"
                  className={cn(
                    status === 'alarm' ? 'fill-status-alarm' :
                    status === 'warning' ? 'fill-status-warning' :
                    'fill-status-normal'
                  )}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BowTieViewer;
