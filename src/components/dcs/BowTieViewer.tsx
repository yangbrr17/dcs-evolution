import React, { useMemo } from 'react';
import { BowTieConfig, BowTieEvent, TagData } from '@/types/dcs';

interface BowTieViewerProps {
  bowTie: BowTieConfig;
  tags: TagData[];
  onEventClick?: (event: BowTieEvent) => void;
  onHoveredTagChange?: (tagId: string | null) => void;
}

const getEventColor = (type: BowTieEvent['type'], status: 'normal' | 'warning' | 'alarm') => {
  if (status === 'alarm') return 'hsl(var(--destructive))';
  if (status === 'warning') return 'hsl(45 100% 50%)';
  
  switch (type) {
    case 'threat': return 'hsl(200 80% 50%)';
    case 'barrier': return 'hsl(150 60% 45%)';
    case 'top_event': return 'hsl(var(--destructive))';
    case 'recovery': return 'hsl(45 80% 50%)';
    case 'consequence': return 'hsl(280 60% 50%)';
    default: return 'hsl(var(--muted))';
  }
};

const EventNode: React.FC<{
  event: BowTieEvent;
  status: 'normal' | 'warning' | 'alarm';
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({ event, status, onClick, onMouseEnter, onMouseLeave }) => {
  const color = getEventColor(event.type, status);
  const isTopEvent = event.type === 'top_event';
  const size = isTopEvent ? 8 : 5;
  
  return (
    <g
      className={event.tagId ? 'cursor-pointer' : ''}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {event.type === 'threat' && (
        <polygon
          points={`${event.position.x - size},${event.position.y} 
                   ${event.position.x},${event.position.y - size * 0.7} 
                   ${event.position.x + size},${event.position.y} 
                   ${event.position.x},${event.position.y + size * 0.7}`}
          fill={color}
          stroke="hsl(var(--border))"
          strokeWidth="0.3"
        />
      )}
      
      {event.type === 'barrier' && (
        <rect
          x={event.position.x - size * 0.4}
          y={event.position.y - size}
          width={size * 0.8}
          height={size * 2}
          fill={color}
          stroke="hsl(var(--border))"
          strokeWidth="0.3"
          rx="0.5"
        />
      )}
      
      {event.type === 'top_event' && (
        <>
          <circle
            cx={event.position.x}
            cy={event.position.y}
            r={size}
            fill={color}
            stroke="hsl(var(--background))"
            strokeWidth="0.5"
          />
          {status !== 'normal' && (
            <circle
              cx={event.position.x}
              cy={event.position.y}
              r={size + 1.5}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity="0.5"
              className="animate-pulse"
            />
          )}
        </>
      )}
      
      {event.type === 'recovery' && (
        <rect
          x={event.position.x - size}
          y={event.position.y - size * 0.5}
          width={size * 2}
          height={size}
          fill={color}
          stroke="hsl(var(--border))"
          strokeWidth="0.3"
          rx="1"
        />
      )}
      
      {event.type === 'consequence' && (
        <polygon
          points={`${event.position.x},${event.position.y - size * 0.8} 
                   ${event.position.x + size},${event.position.y + size * 0.5} 
                   ${event.position.x - size},${event.position.y + size * 0.5}`}
          fill={color}
          stroke="hsl(var(--border))"
          strokeWidth="0.3"
        />
      )}
      
      {/* Label */}
      <text
        x={event.position.x}
        y={event.position.y + (isTopEvent ? size + 3 : size + 2)}
        textAnchor="middle"
        fontSize={isTopEvent ? "2.5" : "2"}
        fill="hsl(var(--foreground))"
        className="pointer-events-none"
      >
        {event.label}
      </text>
      
      {/* Tag indicator */}
      {event.tagId && (
        <text
          x={event.position.x}
          y={event.position.y + (isTopEvent ? size + 5.5 : size + 4)}
          textAnchor="middle"
          fontSize="1.5"
          fill="hsl(var(--muted-foreground))"
          className="pointer-events-none"
        >
          {event.tagId}
        </text>
      )}
    </g>
  );
};

export const BowTieViewer: React.FC<BowTieViewerProps> = ({
  bowTie,
  tags,
  onEventClick,
  onHoveredTagChange,
}) => {
  const tagMap = useMemo(() => {
    const map = new Map<string, TagData>();
    tags.forEach(t => map.set(t.id, t));
    return map;
  }, [tags]);
  
  const eventMap = useMemo(() => {
    const map = new Map<string, BowTieEvent>();
    bowTie.events.forEach(e => map.set(e.id, e));
    return map;
  }, [bowTie]);
  
  const getEventStatus = (event: BowTieEvent): 'normal' | 'warning' | 'alarm' => {
    if (event.tagId) {
      const tag = tagMap.get(event.tagId);
      if (tag) return tag.status;
    }
    return 'normal';
  };
  
  const handleEventClick = (event: BowTieEvent) => {
    if (event.tagId && onEventClick) {
      onEventClick(event);
    }
  };
  
  const handleEventHover = (event: BowTieEvent | null) => {
    if (onHoveredTagChange) {
      onHoveredTagChange(event?.tagId || null);
    }
  };
  
  // Render links
  const links = useMemo(() => {
    return bowTie.links.map((link, idx) => {
      const fromEvent = eventMap.get(link.from);
      const toEvent = eventMap.get(link.to);
      
      if (!fromEvent || !toEvent) return null;
      
      const fromStatus = getEventStatus(fromEvent);
      const toStatus = getEventStatus(toEvent);
      const hasAlert = fromStatus !== 'normal' || toStatus !== 'normal';
      
      return (
        <line
          key={`${link.from}-${link.to}-${idx}`}
          x1={`${fromEvent.position.x}%`}
          y1={`${fromEvent.position.y}%`}
          x2={`${toEvent.position.x}%`}
          y2={`${toEvent.position.y}%`}
          stroke={hasAlert ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}
          strokeWidth={hasAlert ? "0.5" : "0.3"}
          strokeDasharray={hasAlert ? "none" : "1,0.5"}
          opacity={hasAlert ? 1 : 0.6}
        />
      );
    });
  }, [bowTie, eventMap, tagMap]);
  
  return (
    <div className="w-full h-full bg-background/50 rounded-lg p-4">
      <div className="text-sm font-medium mb-2 text-foreground">{bowTie.name}</div>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Links */}
        <g>{links}</g>
        
        {/* Events */}
        {bowTie.events.map(event => (
          <EventNode
            key={event.id}
            event={event}
            status={getEventStatus(event)}
            onClick={() => handleEventClick(event)}
            onMouseEnter={() => handleEventHover(event)}
            onMouseLeave={() => handleEventHover(null)}
          />
        ))}
        
        {/* Legend */}
        <g transform="translate(2, 92)">
          <text fontSize="1.5" fill="hsl(var(--muted-foreground))">
            ◇威胁 ▮屏障 ●顶事件 ▬恢复 △后果
          </text>
        </g>
      </svg>
    </div>
  );
};

export default BowTieViewer;
