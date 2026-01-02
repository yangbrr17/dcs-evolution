import React, { useState, useRef } from 'react';
import { TagData } from '@/types/dcs';
import { GripVertical, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    setIsDragging(true);
    containerRef.current = tagRef.current?.parentElement as HTMLElement;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      
      // Clamp values between 0 and 100
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

  const getStatusClass = () => {
    switch (tag.status) {
      case 'alarm':
        return 'dcs-tag-alarm';
      case 'warning':
        return 'dcs-tag-warning';
      default:
        return 'dcs-tag-normal';
    }
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

  return (
    <div
      ref={tagRef}
      className={cn(
        'dcs-tag absolute min-w-[140px] select-none transition-shadow',
        getStatusClass(),
        isDragging && 'shadow-xl z-50 cursor-grabbing',
        isEditMode && !isDragging && 'cursor-grab hover:shadow-lg',
        !isEditMode && 'cursor-pointer hover:shadow-md'
      )}
      style={{
        left: `${tag.position.x}%`,
        top: `${tag.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={() => !isEditMode && onClick(tag)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <div className={cn('status-dot', getStatusDotClass())} />
          <span className="text-xs font-medium text-foreground">{tag.name}</span>
        </div>
        {isEditMode && (
          <div
            className="drag-handle p-0.5"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2 py-1.5 space-y-0.5">
        {/* Current Value */}
        <div className="flex items-baseline justify-between">
          <span className="dcs-value text-lg">
            {tag.currentValue.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">{tag.unit}</span>
        </div>

        {/* Setpoint */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">SP:</span>
          <span className="dcs-setpoint">{tag.setpoint.toFixed(1)}</span>
        </div>

        {/* Predicted Value */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>预测:</span>
          </div>
          <span className="dcs-prediction">{tag.predictedValue.toFixed(1)}</span>
        </div>
      </div>

      {/* Description tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {tag.description}
      </div>
    </div>
  );
};

export default DraggableTag;
