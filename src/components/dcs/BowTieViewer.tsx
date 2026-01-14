import React, { useState, useMemo, useCallback } from 'react';
import { BowTieConfig, BowTieEvent, TagData, TagStatus } from '@/types/dcs';

interface BowTieViewerProps {
  bowTie: BowTieConfig;
  tags: TagData[];
  onEventClick?: (event: BowTieEvent) => void;
  onHoveredTagChange?: (tagId: string | null) => void;
}

// SVG Definitions for patterns and gradients
const SvgDefs: React.FC = () => (
  <defs>
    {/* Hazard yellow-black stripes pattern */}
    <pattern id="hazard-stripes" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
      <rect width="6" height="12" fill="#FFD60A" />
      <rect x="6" width="6" height="12" fill="#1a1a1a" />
    </pattern>
    
    {/* Top event orange gradient */}
    <radialGradient id="top-event-gradient" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stopColor="#FF8C42" />
      <stop offset="50%" stopColor="#E85D04" />
      <stop offset="100%" stopColor="#DC2F02" />
    </radialGradient>
    
    {/* Barrier cylinder gradient */}
    <linearGradient id="barrier-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#4a4a4a" />
      <stop offset="30%" stopColor="#6a6a6a" />
      <stop offset="50%" stopColor="#7a7a7a" />
      <stop offset="70%" stopColor="#6a6a6a" />
      <stop offset="100%" stopColor="#3a3a3a" />
    </linearGradient>
    
    {/* Barrier top ellipse gradient */}
    <radialGradient id="barrier-top-gradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#8a8a8a" />
      <stop offset="100%" stopColor="#5a5a5a" />
    </radialGradient>
    
    {/* Threat box gradient */}
    <linearGradient id="threat-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#E3F2FD" />
      <stop offset="100%" stopColor="#BBDEFB" />
    </linearGradient>
    
    {/* Consequence box gradient */}
    <linearGradient id="consequence-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFEBEE" />
      <stop offset="100%" stopColor="#FFCDD2" />
    </linearGradient>
    
    {/* Action card gradient */}
    <linearGradient id="action-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FAFAFA" />
      <stop offset="100%" stopColor="#F5F5F5" />
    </linearGradient>
    
    {/* Glow filters */}
    <filter id="glow-warning" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feFlood floodColor="#F59E0B" floodOpacity="0.6" />
      <feComposite in2="blur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <filter id="glow-alarm" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feFlood floodColor="#EF4444" floodOpacity="0.7" />
      <feComposite in2="blur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    {/* Drop shadow */}
    <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
    </filter>
    
    {/* Arrow marker */}
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#9CA3AF" />
    </marker>
  </defs>
);

// Hazard box component (yellow-black stripes)
const HazardBox: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, isHovered, onClick, onHover }) => {
  const width = 140;
  const height = 50;
  const padding = 6;
  
  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer striped border */}
      <rect
        width={width}
        height={height}
        fill="url(#hazard-stripes)"
        rx={4}
        filter={isHovered ? "url(#drop-shadow)" : undefined}
      />
      {/* Inner white background */}
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        fill="white"
        rx={2}
      />
      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 - 4}
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="11"
        fontWeight="600"
      >
        {event.label}
      </text>
      {event.description && (
        <text
          x={width / 2}
          y={height / 2 + 10}
          textAnchor="middle"
          fill="#666"
          fontSize="8"
        >
          {event.description}
        </text>
      )}
    </g>
  );
};

// Top Event (initiating event) - orange circle with label
const TopEventCircle: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  status: TagStatus;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, status, isHovered, onClick, onHover }) => {
  const radius = 40;
  
  const getFilter = () => {
    if (status === 'alarm') return 'url(#glow-alarm)';
    if (status === 'warning') return 'url(#glow-warning)';
    return isHovered ? 'url(#drop-shadow)' : undefined;
  };
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Main circle */}
      <circle
        r={radius}
        fill="url(#top-event-gradient)"
        stroke={status === 'alarm' ? '#DC2626' : status === 'warning' ? '#F59E0B' : '#C2410C'}
        strokeWidth={status !== 'normal' ? 3 : 2}
        filter={getFilter()}
      />
      
      {/* Label box above */}
      <rect
        x={-55}
        y={-radius - 35}
        width={110}
        height={28}
        fill="white"
        stroke="#9CA3AF"
        strokeWidth={1}
        rx={3}
        filter="url(#drop-shadow)"
      />
      <text
        x={0}
        y={-radius - 17}
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="10"
        fontWeight="600"
      >
        {event.label}
      </text>
      
      {/* Event number in circle */}
      <text
        y={5}
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="bold"
      >
        起始事件
      </text>
    </g>
  );
};

// Barrier component - 3D cylinder
const BarrierCylinder: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  status: TagStatus;
  isHovered: boolean;
  isLeft: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, status, isHovered, isLeft, onClick, onHover }) => {
  const width = 24;
  const height = 60;
  const ellipseRy = 8;
  
  const getFilter = () => {
    if (status === 'alarm') return 'url(#glow-alarm)';
    if (status === 'warning') return 'url(#glow-warning)';
    return isHovered ? 'url(#drop-shadow)' : undefined;
  };
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
      filter={getFilter()}
    >
      {/* Cylinder body */}
      <rect
        x={-width / 2}
        y={-height / 2 + ellipseRy}
        width={width}
        height={height - ellipseRy * 2}
        fill="url(#barrier-gradient)"
      />
      
      {/* Bottom ellipse */}
      <ellipse
        cx={0}
        cy={height / 2 - ellipseRy}
        rx={width / 2}
        ry={ellipseRy}
        fill="#3a3a3a"
      />
      
      {/* Top ellipse */}
      <ellipse
        cx={0}
        cy={-height / 2 + ellipseRy}
        rx={width / 2}
        ry={ellipseRy}
        fill="url(#barrier-top-gradient)"
        stroke="#5a5a5a"
        strokeWidth={1}
      />
      
      {/* Connection points */}
      <circle cx={isLeft ? -width / 2 - 4 : width / 2 + 4} cy={0} r={3} fill="white" stroke="#9CA3AF" strokeWidth={1} />
      <circle cx={isLeft ? width / 2 + 4 : -width / 2 - 4} cy={0} r={3} fill="white" stroke="#9CA3AF" strokeWidth={1} />
      
      {/* Label below */}
      <text
        x={0}
        y={height / 2 + 14}
        textAnchor="middle"
        fill="#374151"
        fontSize="9"
        fontWeight="500"
      >
        {event.label}
      </text>
    </g>
  );
};

// Threat box - blue border with left accent
const ThreatBox: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  status: TagStatus;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, status, isHovered, onClick, onHover }) => {
  const width = 100;
  const height = 48;
  const accentWidth = 5;
  
  const getFilter = () => {
    if (status === 'alarm') return 'url(#glow-alarm)';
    if (status === 'warning') return 'url(#glow-warning)';
    return isHovered ? 'url(#drop-shadow)' : undefined;
  };
  
  const getBorderColor = () => {
    if (status === 'alarm') return '#DC2626';
    if (status === 'warning') return '#F59E0B';
    return '#1E88E5';
  };
  
  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
      filter={getFilter()}
    >
      {/* Main box */}
      <rect
        width={width}
        height={height}
        fill="url(#threat-gradient)"
        stroke={getBorderColor()}
        strokeWidth={1.5}
        rx={4}
      />
      
      {/* Left accent bar */}
      <rect
        x={0}
        y={0}
        width={accentWidth}
        height={height}
        fill="#1565C0"
        rx={4}
      />
      <rect
        x={accentWidth}
        y={0}
        width={2}
        height={height}
        fill="#1565C0"
      />
      
      {/* Label */}
      <text
        x={width / 2 + accentWidth / 2}
        y={height / 2 - 4}
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="10"
        fontWeight="500"
      >
        {event.label}
      </text>
      
      {/* Tag indicator */}
      {event.tagId && (
        <text
          x={width / 2 + accentWidth / 2}
          y={height / 2 + 10}
          textAnchor="middle"
          fill="#666"
          fontSize="8"
        >
          [{event.tagId}]
        </text>
      )}
    </g>
  );
};

// Consequence box - red border with right accent
const ConsequenceBox: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, isHovered, onClick, onHover }) => {
  const width = 100;
  const height = 48;
  const accentWidth = 5;
  
  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
      filter={isHovered ? 'url(#drop-shadow)' : undefined}
    >
      {/* Main box */}
      <rect
        width={width}
        height={height}
        fill="url(#consequence-gradient)"
        stroke="#EF5350"
        strokeWidth={1.5}
        rx={4}
      />
      
      {/* Right accent bar */}
      <rect
        x={width - accentWidth}
        y={0}
        width={accentWidth}
        height={height}
        fill="#C62828"
        rx={4}
      />
      <rect
        x={width - accentWidth - 2}
        y={0}
        width={2}
        height={height}
        fill="#C62828"
      />
      
      {/* Label */}
      <text
        x={width / 2 - accentWidth / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="10"
        fontWeight="500"
      >
        {event.label}
      </text>
    </g>
  );
};

// Action card - white rounded rectangle
const ActionCard: React.FC<{
  event: BowTieEvent;
  x: number;
  y: number;
  isPreventive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ event, x, y, isPreventive, isHovered, onClick, onHover }) => {
  const width = 85;
  const height = 40;
  
  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: 'pointer' }}
      filter={isHovered ? 'url(#drop-shadow)' : undefined}
    >
      {/* Card background */}
      <rect
        width={width}
        height={height}
        fill="url(#action-gradient)"
        stroke="#D1D5DB"
        strokeWidth={1}
        rx={6}
      />
      
      {/* Color indicator dot */}
      <circle
        cx={12}
        cy={height / 2}
        r={4}
        fill={isPreventive ? '#22C55E' : '#3B82F6'}
      />
      
      {/* Label */}
      <text
        x={width / 2 + 6}
        y={height / 2 + 4}
        textAnchor="middle"
        fill="#374151"
        fontSize="9"
        fontWeight="500"
      >
        {event.label}
      </text>
    </g>
  );
};

// Main BowTieViewer component
export const BowTieViewer: React.FC<BowTieViewerProps> = ({
  bowTie,
  tags,
  onEventClick,
  onHoveredTagChange,
}) => {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Create tag lookup map
  const tagMap = useMemo(() => {
    const map = new Map<string, TagData>();
    tags.forEach(tag => map.set(tag.id, tag));
    return map;
  }, [tags]);

  // Get event status from associated tag
  const getEventStatus = useCallback((event: BowTieEvent): TagStatus => {
    if (!event.tagId) return 'normal';
    const tag = tagMap.get(event.tagId);
    return tag?.status || 'normal';
  }, [tagMap]);

  // Event handlers
  const handleEventClick = useCallback((event: BowTieEvent) => {
    onEventClick?.(event);
  }, [onEventClick]);

  const handleEventHover = useCallback((event: BowTieEvent, hovered: boolean) => {
    setHoveredEventId(hovered ? event.id : null);
    if (event.tagId) {
      onHoveredTagChange?.(hovered ? event.tagId : null);
    }
  }, [onHoveredTagChange]);

  // Pan/zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => ({
      ...prev,
      width: Math.min(Math.max(prev.width * scale, 400), 1600),
      height: Math.min(Math.max(prev.height * scale, 250), 1000),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * (viewBox.width / 800);
    const dy = (e.clientY - dragStart.y) * (viewBox.height / 500);
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, width: 800, height: 500 });
  }, []);

  // Render links between events
  const renderLinks = useMemo(() => {
    const eventMap = new Map<string, BowTieEvent>();
    bowTie.events.forEach(e => eventMap.set(e.id, e));
    
    return bowTie.links.map((link, index) => {
      const fromEvent = eventMap.get(link.from);
      const toEvent = eventMap.get(link.to);
      if (!fromEvent || !toEvent) return null;
      
      const x1 = (fromEvent.position.x / 100) * 800;
      const y1 = (fromEvent.position.y / 100) * 500;
      const x2 = (toEvent.position.x / 100) * 800;
      const y2 = (toEvent.position.y / 100) * 500;
      
      // Create smooth bezier curve
      const midX = (x1 + x2) / 2;
      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      
      const isHighlighted = hoveredEventId === link.from || hoveredEventId === link.to;
      
      return (
        <path
          key={`link-${index}`}
          d={path}
          fill="none"
          stroke={isHighlighted ? '#6B7280' : '#D1D5DB'}
          strokeWidth={isHighlighted ? 2 : 1.5}
          strokeLinecap="round"
          opacity={isHighlighted ? 1 : 0.7}
        />
      );
    });
  }, [bowTie, hoveredEventId]);

  // Render events
  const renderEvents = useMemo(() => {
    return bowTie.events.map(event => {
      const x = (event.position.x / 100) * 800;
      const y = (event.position.y / 100) * 500;
      const status = getEventStatus(event);
      const isHovered = hoveredEventId === event.id;
      
      const commonProps = {
        event,
        x,
        y,
        isHovered,
        onClick: () => handleEventClick(event),
        onHover: (hovered: boolean) => handleEventHover(event, hovered),
      };
      
      switch (event.type) {
        case 'hazard':
          return <HazardBox key={event.id} {...commonProps} />;
        case 'top_event':
          return <TopEventCircle key={event.id} {...commonProps} status={status} />;
        case 'barrier':
          const isLeft = event.position.x < 50;
          return <BarrierCylinder key={event.id} {...commonProps} status={status} isLeft={isLeft} />;
        case 'threat':
          return <ThreatBox key={event.id} {...commonProps} status={status} />;
        case 'consequence':
          return <ConsequenceBox key={event.id} {...commonProps} />;
        case 'preventive_action':
          return <ActionCard key={event.id} {...commonProps} isPreventive={true} />;
        case 'mitigating_action':
          return <ActionCard key={event.id} {...commonProps} isPreventive={false} />;
        default:
          return null;
      }
    });
  }, [bowTie.events, hoveredEventId, getEventStatus, handleEventClick, handleEventHover]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
          <h3 className="text-sm font-semibold text-slate-700">{bowTie.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewBox(prev => ({ ...prev, width: prev.width * 0.9, height: prev.height * 0.9 }))}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs"
          >
            放大
          </button>
          <button
            onClick={() => setViewBox(prev => ({ ...prev, width: prev.width * 1.1, height: prev.height * 1.1 }))}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs"
          >
            缩小
          </button>
          <button
            onClick={resetView}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs"
          >
            重置
          </button>
        </div>
      </div>
      
      {/* SVG Canvas */}
      <div className="flex-1 relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        >
          <SvgDefs />
          
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-200" y="-100" width="1200" height="700" fill="url(#grid)" />
          
          {/* Flow direction indicators */}
          <text x="100" y="480" fill="#94A3B8" fontSize="12" fontWeight="500">威胁</text>
          <text x="380" y="480" fill="#94A3B8" fontSize="12" fontWeight="500">预防</text>
          <text x="580" y="480" fill="#94A3B8" fontSize="12" fontWeight="500">缓解</text>
          <text x="700" y="480" fill="#94A3B8" fontSize="12" fontWeight="500">后果</text>
          
          {/* Central flow arrow */}
          <path
            d="M 80 450 L 720 450"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="2"
            strokeDasharray="8,4"
            markerEnd="url(#arrow)"
          />
          
          {/* Links */}
          <g>{renderLinks}</g>
          
          {/* Events */}
          <g>{renderEvents}</g>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 bg-white/80 backdrop-blur border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded" style={{ background: 'linear-gradient(45deg, #FFD60A 50%, #1a1a1a 50%)' }} />
          <span className="text-xs text-slate-600">危害</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50" />
          <span className="text-xs text-slate-600">威胁</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
          <span className="text-xs text-slate-600">起始事件</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-4 rounded bg-gradient-to-b from-gray-400 to-gray-600" />
          <span className="text-xs text-slate-600">屏障</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-gray-300 bg-gray-50" />
          <span className="text-xs text-slate-600">措施</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-red-400 bg-red-50" />
          <span className="text-xs text-slate-600">后果</span>
        </div>
      </div>
    </div>
  );
};

export default BowTieViewer;
