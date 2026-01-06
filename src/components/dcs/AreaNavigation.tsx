import React from 'react';
import { ProcessArea } from '@/types/dcs';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AreaNavigationProps {
  areas: ProcessArea[];
  currentAreaId: string;
  onAreaChange: (areaId: string) => void;
}

const AreaNavigation: React.FC<AreaNavigationProps> = ({
  areas,
  currentAreaId,
  onAreaChange,
}) => {
  const currentIndex = areas.findIndex((a) => a.id === currentAreaId);
  const currentArea = areas[currentIndex];

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : areas.length - 1;
    onAreaChange(areas[prevIndex].id);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < areas.length - 1 ? currentIndex + 1 : 0;
    onAreaChange(areas[nextIndex].id);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Arrow Navigation */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        className="h-8 w-8"
        title="上一区域"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Area Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => onAreaChange(area.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              'hover:bg-background/50',
              currentAreaId === area.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
            title={area.description}
          >
            {area.id === 'overview' && <Layers className="h-3 w-3 inline mr-1" />}
            {area.name}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="h-8 w-8"
        title="下一区域"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Current Area Info */}
      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
        {currentArea?.description}
      </span>
    </div>
  );
};

export default AreaNavigation;
