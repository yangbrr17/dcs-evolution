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

  // Calculate the position along the curve for the label
  const getCurvePointAt = (x1: number, y1: number, x2: number, y2: number, t: number = 0.5) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: x1, y: y1 };
    
    const curveOffset = Math.min(distance * 0.15, 6);
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;
    
    // Quadratic bezier at t
    const px = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2;
    const py = (1-t)*(1-t)*y1 + 2*(1-t)*t*ctrlY + t*t*y2;
    
    return { x: px, y: py };
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
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path 
            d="M 0 1 L 7 4 L 0 7 L 2 4 Z" 
            fill="#9ca3af"
          />
        </marker>
        
        {/* Critical arrow marker - red, small triangle */}
        <marker
          id="arrow-critical"
          markerWidth="10"
          markerHeight="10"
          refX="7"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path 
            d="M 0 1 L 9 5 L 0 9 L 2.5 5 Z" 
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
        const labelPos = getCurvePointAt(x1, y1, x2, y2, 0.5);
        const contribution = link.contribution ?? 50;
        
        return (
          <g key={`${link.from}-${link.to}`}>
            {/* Arrow line */}
            <path
              d={pathD}
              fill="none"
              stroke={isCritical ? '#ef4444' : '#9ca3af'}
              strokeWidth={isCritical ? 3 : 2}
              strokeOpacity={1}
              strokeLinecap="round"
              markerEnd={`url(#arrow-${isCritical ? 'critical' : 'normal'})`}
              className={isCritical ? 'animate-pulse' : ''}
            />
            
            {/* Contribution label */}
            <g transform={`translate(${labelPos.x}%, ${labelPos.y}%)`}>
              <rect
                x="-22"
                y="-10"
                width="44"
                height="16"
                rx="3"
                fill={isCritical ? '#fef2f2' : '#f9fafb'}
                stroke={isCritical ? '#ef4444' : '#d1d5db'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="9"
                fontWeight="500"
                fill={isCritical ? '#dc2626' : '#6b7280'}
              >
                Contr: {contribution}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export default CausalityArrows;
