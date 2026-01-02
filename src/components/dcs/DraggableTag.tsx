import React, { useState, useRef } from 'react';
import { TagData } from '@/types/dcs';
import { GripVertical, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface DraggableTagProps {
  tag: TagData;
  isEditMode: boolean;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onClick: (tag: TagData) => void;
}

const DraggableTag: React.FC<DraggableTagProps> = ({
  tag,
  isEditMode,
  onPositionChange,
  onClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    containerRef.current = tagRef.current?.parentElement as HTMLElement;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      
      const clampedX = Math.max(0, Math.min(95, x));
      const clampedY = Math.max(0, Math.min(95, y));
      
      onPositionChange(tag.id, { x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getStatusDotClass = () => {
    switch (tag.status) {
      case 'alarm':
        return 'bg-dcs-alarm animate-alarm-pulse';
      case 'warning':
        return 'bg-dcs-warning animate-warning-pulse';
      default:
        return 'bg-dcs-normal';
    }
  };

  const getStatusBorderClass = () => {
    switch (tag.status) {
      case 'alarm':
        return 'border-dcs-alarm/50';
      case 'warning':
        return 'border-dcs-warning/50';
      default:
        return 'border-border/50';
    }
  };

  const TagContent = (
    <div
      ref={tagRef}
      className={cn(
        'absolute flex items-center gap-1.5 px-2 py-1 rounded-full',
        'bg-card/80 backdrop-blur-sm border select-none',
        'transition-all duration-200',
        getStatusBorderClass(),
        isDragging && 'shadow-xl z-50 cursor-grabbing scale-110',
        isEditMode && !isDragging && 'cursor-grab hover:shadow-lg hover:scale-105',
        !isEditMode && 'cursor-pointer hover:shadow-md hover:bg-card'
      )}
      style={{
        left: `${tag.position.x}%`,
        top: `${tag.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={() => !isEditMode && !isDragging && onClick(tag)}
      onMouseDown={isEditMode ? handleMouseDown : undefined}
    >
      {/* Status Dot */}
      <div className={cn('w-2.5 h-2.5 rounded-full', getStatusDotClass())} />
      
      {/* Tag Name */}
      <span className="text-xs font-medium text-foreground whitespace-nowrap">
        {tag.name}
      </span>
      
      {/* Drag Handle in Edit Mode */}
      {isEditMode && (
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      )}
    </div>
  );

  // In edit mode, don't show hover card
  if (isEditMode) {
    return TagContent;
  }

  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>
        {TagContent}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-48 p-3 bg-card border-border"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{tag.name}</span>
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              tag.status === 'alarm' && 'bg-dcs-alarm/20 text-dcs-alarm',
              tag.status === 'warning' && 'bg-dcs-warning/20 text-dcs-warning',
              tag.status === 'normal' && 'bg-dcs-normal/20 text-dcs-normal'
            )}>
              {tag.status === 'normal' ? '正常' : tag.status === 'warning' ? '警告' : '报警'}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-muted-foreground">{tag.description}</p>
          
          {/* Values */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
            <div>
              <span className="text-xs text-muted-foreground">当前值</span>
              <p className="text-sm font-mono font-semibold text-foreground">
                {tag.currentValue.toFixed(1)} <span className="text-xs text-muted-foreground">{tag.unit}</span>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">设定值</span>
              <p className="text-sm font-mono text-dcs-setpoint">
                {tag.setpoint.toFixed(1)}
              </p>
            </div>
          </div>
          
          {/* Prediction */}
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-dcs-prediction" />
            <span className="text-muted-foreground">预测:</span>
            <span className="font-mono text-dcs-prediction">{tag.predictedValue.toFixed(1)}</span>
          </div>
          
          {/* Click hint */}
          <p className="text-xs text-muted-foreground/60 text-center pt-1 border-t border-border/30">
            点击查看详细趋势
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default DraggableTag;
