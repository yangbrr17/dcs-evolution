import React, { useState, useRef, useEffect } from 'react';
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
  onHover?: (tagId: string | null) => void;
  isHighlighted?: boolean;
}

const DraggableTag: React.FC<DraggableTagProps> = ({
  tag,
  isEditMode,
  onPositionChange,
  onClick,
  onHover,
  isHighlighted,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || !tagRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const container = tagRef.current.parentElement as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const tagRect = tagRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse to tag center
    const tagCenterX = tagRect.left + tagRect.width / 2;
    const tagCenterY = tagRect.top + tagRect.height / 2;
    offsetRef.current = {
      x: e.clientX - tagCenterX,
      y: e.clientY - tagCenterY,
    };
    
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      
      // Apply offset so tag doesn't jump to cursor
      const x = ((moveEvent.clientX - offsetRef.current.x - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - offsetRef.current.y - rect.top) / rect.height) * 100;
      
      const clampedX = Math.max(2, Math.min(98, x));
      const clampedY = Math.max(2, Math.min(98, y));
      
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
        return 'status-dot-alarm';
      case 'warning':
        return 'status-dot-warning';
      default:
        return 'status-dot-normal';
    }
  };

  const getStatusBorderClass = () => {
    switch (tag.status) {
      case 'alarm':
        return 'border-[hsl(var(--status-alarm)/0.5)]';
      case 'warning':
        return 'border-[hsl(var(--status-warning)/0.5)]';
      default:
        return 'border-border/50';
    }
  };

  const handleMouseEnter = () => {
    if (tag.status === 'alarm' && onHover) {
      onHover(tag.id);
    }
    
    // 打开 HoverCard 并设置 3秒后自动关闭
    setIsHoverCardOpen(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverCardOpen(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
    
    // 清理定时器并关闭 HoverCard
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHoverCardOpen(false);
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
        !isEditMode && 'cursor-pointer hover:shadow-md hover:bg-card',
        isHighlighted && 'ring-2 ring-red-500/60 shadow-lg'
      )}
      style={{
        left: `${tag.position.x}%`,
        top: `${tag.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={() => !isEditMode && !isDragging && onClick(tag)}
      onMouseDown={isEditMode ? handleMouseDown : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status Dot */}
      <div className={cn('status-dot', getStatusDotClass())} />
      
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
    <HoverCard open={isHoverCardOpen} onOpenChange={setIsHoverCardOpen}>
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
              tag.status === 'alarm' && 'bg-[hsl(var(--status-alarm)/0.2)] text-[hsl(var(--status-alarm))]',
              tag.status === 'warning' && 'bg-[hsl(var(--status-warning)/0.2)] text-[hsl(var(--status-warning))]',
              tag.status === 'normal' && 'bg-[hsl(var(--status-normal)/0.2)] text-[hsl(var(--status-normal))]'
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
              <p className="text-sm font-mono dcs-setpoint">
                {tag.setpoint.toFixed(1)}
              </p>
            </div>
          </div>
          
          {/* Prediction */}
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 dcs-prediction" />
            <span className="text-muted-foreground">预测:</span>
            <span className="font-mono dcs-prediction">{tag.predictedValue.toFixed(1)}</span>
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
