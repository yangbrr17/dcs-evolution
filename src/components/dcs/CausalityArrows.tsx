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

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Normal arrow marker - semi-transparent */}
        <marker
          id="arrow-normal"
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon 
            points="0 0, 12 4, 0 8" 
            fill="rgba(239, 68, 68, 0.4)" 
          />
        </marker>
        
        {/* Critical arrow marker - highlighted */}
        <marker
          id="arrow-critical"
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon 
            points="0 0, 12 4, 0 8" 
            fill="rgba(239, 68, 68, 0.9)" 
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
        
        return (
          <line
            key={`${link.from}-${link.to}`}
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={isCritical ? 'rgba(239, 68, 68, 0.9)' : 'rgba(239, 68, 68, 0.4)'}
            strokeWidth={isCritical ? 4 : 3}
            strokeDasharray={isCritical ? '0' : '8,4'}
            markerEnd={`url(#arrow-${isCritical ? 'critical' : 'normal'})`}
            className={isCritical ? 'animate-pulse' : ''}
          />
        );
      })}
    </svg>
  );
};

export default CausalityArrows;
