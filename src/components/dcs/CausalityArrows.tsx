import React, { useMemo } from 'react';
import { TagData } from '@/types/dcs';
import { findCausalChain, isCriticalLink } from '@/services/causalityService';

interface CausalityArrowsProps {
  hoveredAlarmTagId: string | null;
  tags: TagData[];
}

const CausalityArrows: React.FC<CausalityArrowsProps> = ({ 
  hoveredAlarmTagId, 
  tags 
}) => {
  const causalLinks = useMemo(() => {
    if (!hoveredAlarmTagId) return [];
    return findCausalChain(hoveredAlarmTagId);
  }, [hoveredAlarmTagId]);

  if (!hoveredAlarmTagId || causalLinks.length === 0) {
    return null;
  }

  // Calculate curved path between two points with offset for arrow
  const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    // Calculate control point for quadratic bezier curve
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Calculate perpendicular offset for curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Avoid division by zero
    if (distance === 0) return `M ${x1}% ${y1}% L ${x2}% ${y2}%`;
    
    // Curve intensity based on distance (more curve for longer lines)
    const curveOffset = Math.min(distance * 0.15, 6);
    
    // Perpendicular direction (rotate 90 degrees)
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Control point
    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;
    
    return `M ${x1}% ${y1}% Q ${ctrlX}% ${ctrlY}% ${x2}% ${y2}%`;
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Normal arrow marker - gray, small triangle */}
        <marker
          id="arrow-normal"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path 
            d="M 0 0 L 4 2 L 0 4 L 1 2 Z" 
            fill="#9ca3af"
          />
        </marker>
        
        {/* Critical arrow marker - red, small triangle */}
        <marker
          id="arrow-critical"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path 
            d="M 0 0 L 4 2 L 0 4 L 1 2 Z" 
            fill="#ef4444"
          />
        </marker>
      </defs>
      
      {causalLinks.map((link) => {
        const fromTag = tags.find(t => t.id === link.from);
        const toTag = tags.find(t => t.id === link.to);
        
        if (!fromTag || !toTag) return null;
        
        const isCritical = isCriticalLink(link, tags);
        
        // Calculate positions (tags use percentage-based positioning)
        const x1 = fromTag.position.x;
        const y1 = fromTag.position.y;
        const x2 = toTag.position.x;
        const y2 = toTag.position.y;
        
        const pathD = getCurvedPath(x1, y1, x2, y2);
        
        return (
          <path
            key={`${link.from}-${link.to}`}
            d={pathD}
            fill="none"
            stroke={isCritical ? '#ef4444' : '#9ca3af'}
            strokeWidth={isCritical ? 2.5 : 1.8}
            strokeOpacity={isCritical ? 0.9 : 0.85}
            strokeLinecap="round"
            markerEnd={`url(#arrow-${isCritical ? 'critical' : 'normal'})`}
            className={isCritical ? 'animate-pulse' : ''}
          />
        );
      })}
    </svg>
  );
};

export default CausalityArrows;
