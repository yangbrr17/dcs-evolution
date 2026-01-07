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

  // 使用纯数值坐标计算曲线路径（配合 viewBox 0-100）
  const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
    
    const curveOffset = Math.min(distance * 0.2, 8);
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;
    
    return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
  };

  const getCurvePointAt = (x1: number, y1: number, x2: number, y2: number, t: number = 0.5) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: x1, y: y1 };
    
    const curveOffset = Math.min(distance * 0.2, 8);
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;
    
    const px = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2;
    const py = (1-t)*(1-t)*y1 + 2*(1-t)*t*ctrlY + t*t*y2;
    
    return { x: px, y: py };
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 50 }}
    >
      <defs>
        {/* 灰色小箭头（普通因果） */}
        <marker
          id="arrow-normal"
          markerWidth="1.2"
          markerHeight="1.2"
          refX="0.9"
          refY="0.6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0.15 L 1.05 0.6 L 0 1.05 L 0.3 0.6 Z" fill="#9ca3af" />
        </marker>
        
        {/* 红色小箭头（关键因果） */}
        <marker
          id="arrow-critical"
          markerWidth="1.5"
          markerHeight="1.5"
          refX="1.1"
          refY="0.75"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0.15 L 1.35 0.75 L 0 1.35 L 0.375 0.75 Z" fill="#ef4444" />
        </marker>
      </defs>
      
      {causalLinks.map((link) => {
        const fromTag = tags.find(t => t.id === link.from);
        const toTag = tags.find(t => t.id === link.to);
        
        if (!fromTag || !toTag) return null;
        
        const isCritical = isCriticalLink(link, tags);
        
        const x1 = fromTag.position.x;
        const y1 = fromTag.position.y;
        const x2 = toTag.position.x;
        const y2 = toTag.position.y;
        
        const pathD = getCurvedPath(x1, y1, x2, y2);
        const labelPos = getCurvePointAt(x1, y1, x2, y2, 0.5);
        const contribution = link.contribution ?? 50;
        
        return (
          <g key={`${link.from}-${link.to}`}>
            {/* 箭头曲线 */}
            <path
              d={pathD}
              fill="none"
              stroke={isCritical ? '#ef4444' : '#9ca3af'}
              strokeWidth={isCritical ? 0.5 : 0.35}
              strokeOpacity={1}
              strokeLinecap="round"
              markerEnd={`url(#arrow-${isCritical ? 'critical' : 'normal'})`}
              className={isCritical ? 'animate-pulse' : ''}
            />
            
            {/* 贡献度标签 */}
            <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
              <rect
                x="-3.5"
                y="-1.5"
                width="7"
                height="2.5"
                rx="0.5"
                fill={isCritical ? '#fef2f2' : '#f9fafb'}
                stroke={isCritical ? '#ef4444' : '#d1d5db'}
                strokeWidth="0.15"
              />
              <text
                x="0"
                y="0.5"
                textAnchor="middle"
                fontSize="1.4"
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
