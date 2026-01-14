import React, { useMemo, useState } from 'react';
import { BowTieConfig, BowTieEvent, TagData } from '@/types/dcs';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BowTieViewerProps {
  bowTie: BowTieConfig;
  tags: TagData[];
  onEventClick?: (event: BowTieEvent) => void;
  onHoveredTagChange?: (tagId: string | null) => void;
}

const getEventColors = (type: BowTieEvent['type'], status: 'normal' | 'warning' | 'alarm') => {
  // Status overrides for alarm/warning states
  if (status === 'alarm') {
    return {
      bg: 'hsl(var(--destructive))',
      border: 'hsl(var(--destructive))',
      glow: 'hsl(var(--destructive) / 0.4)',
      text: 'hsl(var(--destructive-foreground))',
    };
  }
  if (status === 'warning') {
    return {
      bg: 'hsl(45 100% 50%)',
      border: 'hsl(45 100% 40%)',
      glow: 'hsl(45 100% 50% / 0.4)',
      text: 'hsl(0 0% 10%)',
    };
  }
  
  // Default colors by type
  switch (type) {
    case 'threat':
      return {
        bg: 'hsl(210 80% 55%)',
        border: 'hsl(210 80% 40%)',
        glow: 'hsl(210 80% 55% / 0.3)',
        text: 'hsl(0 0% 100%)',
      };
    case 'barrier':
      return {
        bg: 'hsl(160 60% 45%)',
        border: 'hsl(160 60% 35%)',
        glow: 'hsl(160 60% 45% / 0.3)',
        text: 'hsl(0 0% 100%)',
      };
    case 'top_event':
      return {
        bg: 'hsl(350 80% 50%)',
        border: 'hsl(350 80% 40%)',
        glow: 'hsl(350 80% 50% / 0.5)',
        text: 'hsl(0 0% 100%)',
      };
    case 'recovery':
      return {
        bg: 'hsl(45 85% 55%)',
        border: 'hsl(45 85% 45%)',
        glow: 'hsl(45 85% 55% / 0.3)',
        text: 'hsl(0 0% 10%)',
      };
    case 'consequence':
      return {
        bg: 'hsl(280 60% 55%)',
        border: 'hsl(280 60% 45%)',
        glow: 'hsl(280 60% 55% / 0.3)',
        text: 'hsl(0 0% 100%)',
      };
    default:
      return {
        bg: 'hsl(var(--muted))',
        border: 'hsl(var(--border))',
        glow: 'transparent',
        text: 'hsl(var(--muted-foreground))',
      };
  }
};

const EventNode: React.FC<{
  event: BowTieEvent;
  status: 'normal' | 'warning' | 'alarm';
  isHovered: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({ event, status, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
  const colors = getEventColors(event.type, status);
  const isTopEvent = event.type === 'top_event';
  
  // Define sizes based on event type
  const baseSize = isTopEvent ? 10 : 6;
  const scale = isHovered ? 1.15 : 1;
  const size = baseSize * scale;
  
  const renderShape = () => {
    switch (event.type) {
      case 'threat':
        // Diamond shape with gradient
        return (
          <>
            <defs>
              <linearGradient id={`grad-${event.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.bg} />
                <stop offset="100%" stopColor={colors.border} />
              </linearGradient>
              <filter id={`glow-${event.id}`}>
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <polygon
              points={`${event.position.x},${event.position.y - size} 
                       ${event.position.x + size},${event.position.y} 
                       ${event.position.x},${event.position.y + size} 
                       ${event.position.x - size},${event.position.y}`}
              fill={`url(#grad-${event.id})`}
              stroke={colors.border}
              strokeWidth="0.4"
              filter={isHovered || status !== 'normal' ? `url(#glow-${event.id})` : undefined}
              style={{ transition: 'all 0.2s ease' }}
            />
          </>
        );
        
      case 'barrier':
        // Vertical rectangle (shield-like)
        return (
          <>
            <defs>
              <linearGradient id={`grad-${event.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.bg} />
                <stop offset="100%" stopColor={colors.border} />
              </linearGradient>
            </defs>
            <rect
              x={event.position.x - size * 0.5}
              y={event.position.y - size * 1.2}
              width={size}
              height={size * 2.4}
              fill={`url(#grad-${event.id})`}
              stroke={colors.border}
              strokeWidth="0.4"
              rx="1.5"
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Shield icon */}
            <path
              d={`M${event.position.x - size * 0.25},${event.position.y - size * 0.4} 
                  L${event.position.x},${event.position.y - size * 0.7} 
                  L${event.position.x + size * 0.25},${event.position.y - size * 0.4} 
                  L${event.position.x + size * 0.25},${event.position.y + size * 0.2} 
                  Q${event.position.x},${event.position.y + size * 0.6} ${event.position.x - size * 0.25},${event.position.y + size * 0.2} Z`}
              fill="none"
              stroke={colors.text}
              strokeWidth="0.3"
              opacity="0.6"
            />
          </>
        );
        
      case 'top_event':
        // Prominent hexagon with glow effect
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          hexPoints.push(
            `${event.position.x + size * Math.cos(angle)},${event.position.y + size * Math.sin(angle)}`
          );
        }
        return (
          <>
            <defs>
              <radialGradient id={`grad-${event.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={colors.bg} />
                <stop offset="100%" stopColor={colors.border} />
              </radialGradient>
              <filter id={`glow-${event.id}`}>
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Outer glow ring */}
            {(status !== 'normal' || isHovered) && (
              <polygon
                points={hexPoints.map((p, i) => {
                  const angle = (Math.PI / 3) * i - Math.PI / 2;
                  return `${event.position.x + (size + 2) * Math.cos(angle)},${event.position.y + (size + 2) * Math.sin(angle)}`;
                }).join(' ')}
                fill="none"
                stroke={colors.glow}
                strokeWidth="1"
                className={status !== 'normal' ? 'animate-pulse' : ''}
              />
            )}
            <polygon
              points={hexPoints.join(' ')}
              fill={`url(#grad-${event.id})`}
              stroke={colors.border}
              strokeWidth="0.5"
              filter={`url(#glow-${event.id})`}
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Warning icon inside */}
            <text
              x={event.position.x}
              y={event.position.y + 1.2}
              textAnchor="middle"
              fontSize="5"
              fill={colors.text}
              fontWeight="bold"
            >
              !
            </text>
          </>
        );
        
      case 'recovery':
        // Rounded rectangle with arrow
        return (
          <>
            <defs>
              <linearGradient id={`grad-${event.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.border} />
                <stop offset="100%" stopColor={colors.bg} />
              </linearGradient>
            </defs>
            <rect
              x={event.position.x - size * 1.3}
              y={event.position.y - size * 0.6}
              width={size * 2.6}
              height={size * 1.2}
              fill={`url(#grad-${event.id})`}
              stroke={colors.border}
              strokeWidth="0.4"
              rx="2"
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Arrow icon */}
            <path
              d={`M${event.position.x + size * 0.6},${event.position.y} 
                  L${event.position.x + size},${event.position.y} 
                  M${event.position.x + size * 0.7},${event.position.y - size * 0.25} 
                  L${event.position.x + size},${event.position.y} 
                  L${event.position.x + size * 0.7},${event.position.y + size * 0.25}`}
              fill="none"
              stroke={colors.text}
              strokeWidth="0.4"
              opacity="0.7"
            />
          </>
        );
        
      case 'consequence':
        // Triangle pointing down
        return (
          <>
            <defs>
              <linearGradient id={`grad-${event.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor={colors.bg} />
                <stop offset="100%" stopColor={colors.border} />
              </linearGradient>
            </defs>
            <polygon
              points={`${event.position.x},${event.position.y - size * 0.8} 
                       ${event.position.x + size * 1.1},${event.position.y + size * 0.7} 
                       ${event.position.x - size * 1.1},${event.position.y + size * 0.7}`}
              fill={`url(#grad-${event.id})`}
              stroke={colors.border}
              strokeWidth="0.4"
              style={{ transition: 'all 0.2s ease' }}
            />
          </>
        );
        
      default:
        return (
          <circle
            cx={event.position.x}
            cy={event.position.y}
            r={size}
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth="0.3"
          />
        );
    }
  };
  
  return (
    <g
      className={`${event.tagId ? 'cursor-pointer' : ''} transition-all duration-200`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ opacity: isHovered ? 1 : 0.95 }}
    >
      {renderShape()}
      
      {/* Label */}
      <text
        x={event.position.x}
        y={event.position.y + (isTopEvent ? size + 4 : size + 3)}
        textAnchor="middle"
        fontSize={isTopEvent ? "2.8" : "2.2"}
        fontWeight={isTopEvent ? "600" : "500"}
        fill="hsl(var(--foreground))"
        className="pointer-events-none"
        style={{ textShadow: '0 1px 2px hsl(var(--background))' }}
      >
        {event.label}
      </text>
      
      {/* Tag indicator */}
      {event.tagId && (
        <text
          x={event.position.x}
          y={event.position.y + (isTopEvent ? size + 6.5 : size + 5.2)}
          textAnchor="middle"
          fontSize="1.6"
          fill="hsl(var(--primary))"
          className="pointer-events-none"
          fontWeight="500"
        >
          📍{event.tagId}
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
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
    setHoveredEventId(event?.id || null);
    if (onHoveredTagChange) {
      onHoveredTagChange(event?.tagId || null);
    }
  };
  
  // Pan/Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = Math.max(30, Math.min(200, viewBox.width * zoomFactor));
    const newHeight = Math.max(30, Math.min(200, viewBox.height * zoomFactor));
    
    const widthDiff = newWidth - viewBox.width;
    const heightDiff = newHeight - viewBox.height;
    
    setViewBox({
      x: viewBox.x - widthDiff / 2,
      y: viewBox.y - heightDiff / 2,
      width: newWidth,
      height: newHeight,
    });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * (viewBox.width / 400);
    const dy = (e.clientY - dragStart.y) * (viewBox.height / 300);
    setViewBox({
      ...viewBox,
      x: viewBox.x - dx,
      y: viewBox.y - dy,
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => setIsDragging(false);
  
  const resetView = () => setViewBox({ x: 0, y: 0, width: 100, height: 100 });
  const zoomIn = () => {
    const newWidth = Math.max(30, viewBox.width * 0.85);
    const newHeight = Math.max(30, viewBox.height * 0.85);
    setViewBox({
      x: viewBox.x + (viewBox.width - newWidth) / 2,
      y: viewBox.y + (viewBox.height - newHeight) / 2,
      width: newWidth,
      height: newHeight,
    });
  };
  const zoomOut = () => {
    const newWidth = Math.min(200, viewBox.width * 1.15);
    const newHeight = Math.min(200, viewBox.height * 1.15);
    setViewBox({
      x: viewBox.x - (newWidth - viewBox.width) / 2,
      y: viewBox.y - (newHeight - viewBox.height) / 2,
      width: newWidth,
      height: newHeight,
    });
  };
  
  // Render links with curved paths and arrows
  const links = useMemo(() => {
    return bowTie.links.map((link, idx) => {
      const fromEvent = eventMap.get(link.from);
      const toEvent = eventMap.get(link.to);
      
      if (!fromEvent || !toEvent) return null;
      
      const fromStatus = getEventStatus(fromEvent);
      const toStatus = getEventStatus(toEvent);
      const hasAlert = fromStatus !== 'normal' || toStatus !== 'normal';
      const isConnectedToHovered = hoveredEventId === link.from || hoveredEventId === link.to;
      
      // Calculate control point for curve
      const midX = (fromEvent.position.x + toEvent.position.x) / 2;
      const midY = (fromEvent.position.y + toEvent.position.y) / 2;
      const dy = toEvent.position.y - fromEvent.position.y;
      const curveOffset = Math.abs(dy) > 10 ? dy * 0.15 : 0;
      
      const pathD = `M ${fromEvent.position.x} ${fromEvent.position.y} 
                     Q ${midX} ${midY + curveOffset} ${toEvent.position.x} ${toEvent.position.y}`;
      
      return (
        <g key={`${link.from}-${link.to}-${idx}`}>
          {/* Glow effect for alert/hover */}
          {(hasAlert || isConnectedToHovered) && (
            <path
              d={pathD}
              fill="none"
              stroke={hasAlert ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
              strokeWidth="1.5"
              opacity="0.3"
              style={{ filter: 'blur(1px)' }}
            />
          )}
          <path
            d={pathD}
            fill="none"
            stroke={
              isConnectedToHovered 
                ? 'hsl(var(--primary))' 
                : hasAlert 
                  ? 'hsl(var(--destructive))' 
                  : 'hsl(var(--muted-foreground) / 0.5)'
            }
            strokeWidth={isConnectedToHovered ? "0.6" : hasAlert ? "0.5" : "0.3"}
            strokeDasharray={hasAlert || isConnectedToHovered ? "none" : "1,1"}
            opacity={isConnectedToHovered ? 1 : hasAlert ? 0.9 : 0.6}
            markerEnd="url(#arrowhead)"
            style={{ transition: 'all 0.2s ease' }}
          />
        </g>
      );
    });
  }, [bowTie, eventMap, tagMap, hoveredEventId]);
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-background to-muted/30 rounded-lg border border-border/50 overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <div className="px-2 py-1 bg-card/80 backdrop-blur-sm rounded-md border border-border/50 shadow-sm">
          <span className="text-sm font-medium text-foreground">{bowTie.name}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-md border border-border/50 p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn}>
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut}>
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetView}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
      
      {/* SVG Canvas */}
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
        <defs>
          {/* Arrow marker */}
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
              fill="hsl(var(--muted-foreground))"
              opacity="0.7"
            />
          </marker>
          
          {/* Background pattern */}
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="0.3" cy="0.3" r="0.15" fill="hsl(var(--border) / 0.3)" />
          </pattern>
        </defs>
        
        {/* Background pattern */}
        <rect x={viewBox.x - 50} y={viewBox.y - 50} width={viewBox.width + 100} height={viewBox.height + 100} fill="url(#grid)" />
        
        {/* Flow direction indicators */}
        <text x="20" y="12" fontSize="2" fill="hsl(var(--muted-foreground))" fontWeight="500">
          ← 威胁
        </text>
        <text x="80" y="12" fontSize="2" fill="hsl(var(--muted-foreground))" fontWeight="500" textAnchor="end">
          后果 →
        </text>
        
        {/* Center divider line */}
        <line
          x1="50" y1="15" x2="50" y2="95"
          stroke="hsl(var(--border))"
          strokeWidth="0.2"
          strokeDasharray="2,2"
          opacity="0.5"
        />
        
        {/* Links */}
        <g>{links}</g>
        
        {/* Events */}
        {bowTie.events.map(event => (
          <EventNode
            key={event.id}
            event={event}
            status={getEventStatus(event)}
            isHovered={hoveredEventId === event.id}
            onClick={() => handleEventClick(event)}
            onMouseEnter={() => handleEventHover(event)}
            onMouseLeave={() => handleEventHover(null)}
          />
        ))}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-2 bg-card/80 backdrop-blur-sm rounded-md border border-border/50 p-1.5 px-2 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rotate-45 bg-[hsl(210_80%_55%)]" />
          <span className="text-[10px] text-muted-foreground">威胁</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-3 rounded-sm bg-[hsl(160_60%_45%)]" />
          <span className="text-[10px] text-muted-foreground">屏障</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[hsl(350_80%_50%)] clip-hexagon" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
          <span className="text-[10px] text-muted-foreground">顶事件</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm bg-[hsl(45_85%_55%)]" />
          <span className="text-[10px] text-muted-foreground">恢复</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[hsl(280_60%_55%)]" />
          <span className="text-[10px] text-muted-foreground">后果</span>
        </div>
      </div>
      
      {/* Hint */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 text-[10px] text-muted-foreground/60">
        <Move className="h-3 w-3" />
        拖拽平移 | 滚轮缩放
      </div>
    </div>
  );
};

export default BowTieViewer;
