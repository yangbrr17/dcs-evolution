import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProcessImageBackgroundProps {
  imageUrl: string | null;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  children: React.ReactNode;
  isEditMode: boolean;
}

const ProcessImageBackground: React.FC<ProcessImageBackgroundProps> = ({
  imageUrl,
  onImageUpload,
  onImageRemove,
  children,
  isEditMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'process-image-container relative w-full h-full',
        isDragOver && 'ring-2 ring-primary ring-inset'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Background Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Process Diagram"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ backgroundColor: 'hsl(var(--background))' }}
        />
      ) : (
        /* Empty state - show upload prompt ABOVE the tag overlay */
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-20 pointer-events-none">
          <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg mb-2">暂无流程图</p>
          <p className="text-sm mb-4">上传您的工厂/装置照片作为背景</p>
          <Button
            variant="outline"
            onClick={handleButtonClick}
            className="gap-2 pointer-events-auto"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </Button>
        </div>
      )}

      {/* Image controls in edit mode */}
      {isEditMode && imageUrl && (
        <div className="absolute top-2 right-2 flex gap-2 z-30">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleButtonClick}
            className="gap-1 text-xs"
          >
            <Upload className="w-3 h-3" />
            更换图片
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onImageRemove}
            className="gap-1 text-xs"
          >
            <X className="w-3 h-3" />
            移除
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          // Reset input value so same file can be selected again
          e.target.value = '';
        }}
      />

      {/* Tag overlay - lower z-index than upload controls */}
      <div className="absolute inset-0 z-10">
        {children}
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-40">
          <div className="bg-card border border-primary rounded-lg px-6 py-4 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-foreground">释放以上传图片</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessImageBackground;
