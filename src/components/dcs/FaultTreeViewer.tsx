import React, { useState, useRef } from 'react';
import { FaultTreeConfig } from '@/types/dcs';
import { Button } from '@/components/ui/button';
import { Upload, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';

interface FaultTreeViewerProps {
  faultTree: FaultTreeConfig;
  isEditMode: boolean;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const FaultTreeViewer: React.FC<FaultTreeViewerProps> = ({
  faultTree,
  isEditMode,
  onImageUpload,
  onImageRemove,
  onPositionChange,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!faultTree.imageUrl) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-muted/20 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        {isEditMode && faultTree.imageUrl && (
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onImageRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Image viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {faultTree.imageUrl ? (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
          >
            <img
              src={faultTree.imageUrl}
              alt={faultTree.name}
              className="max-h-full max-w-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <p className="text-sm">暂无故障树图片</p>
            {isEditMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  上传故障树图片
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="p-2 border-t border-border bg-card/50 flex justify-between items-center text-xs text-muted-foreground">
        <span>{faultTree.name}</span>
        <span>缩放: {Math.round(zoom * 100)}%</span>
      </div>

      {/* Hidden file input for edit mode with existing image */}
      {isEditMode && faultTree.imageUrl && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-12 left-2 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            更换图片
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};

export default FaultTreeViewer;
