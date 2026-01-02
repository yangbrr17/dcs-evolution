import React, { useState, useEffect, useCallback } from 'react';
import { TagData, Alarm } from '@/types/dcs';
import { createInitialTags, updateTagData, generateAlarm } from '@/services/mockDataService';
import ProcessImageBackground from './ProcessImageBackground';
import DraggableTag from './DraggableTag';
import TagDetailModal from './TagDetailModal';
import AlarmPanel from './AlarmPanel';
import MonitoringPanel from './MonitoringPanel';
import { Button } from '@/components/ui/button';
import { Settings, Play, Pause, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DCSInterface: React.FC = () => {
  const [tags, setTags] = useState<TagData[]>(createInitialTags);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [processImage, setProcessImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);

  // Real-time data update
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTags((prevTags) => {
        const newTags = prevTags.map((tag) => {
          const previousStatus = tag.status;
          const updatedTag = updateTagData(tag);
          
          // Check for new alarms
          const alarm = generateAlarm(updatedTag, previousStatus);
          if (alarm) {
            setAlarms((prev) => [alarm, ...prev].slice(0, 50));
            toast({
              title: alarm.type === 'alarm' ? '⚠️ 报警' : '⚡ 警告',
              description: alarm.message,
              variant: alarm.type === 'alarm' ? 'destructive' : 'default',
            });
          }
          
          return updatedTag;
        });
        return newTags;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, position } : tag))
    );
  }, []);

  const handleAcknowledgeAlarm = useCallback((alarmId: string) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, acknowledged: true, acknowledgedAt: new Date() }
          : alarm
      )
    );
  }, []);

  const handleImageUpload = (url: string) => {
    setProcessImage(url);
    toast({ title: '图片已上传', description: '您可以开始在图片上放置监测标签' });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="dcs-header flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">DCS 监控系统</h1>
          <span className="text-xs text-muted-foreground">FCC 装置</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'secondary' : 'default'}
            onClick={() => setIsRunning(!isRunning)}
            className="gap-1"
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRunning ? '暂停' : '运行'}
          </Button>
          <Button
            size="sm"
            variant={isEditMode ? 'default' : 'outline'}
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-1"
          >
            <Settings className="w-3 h-3" />
            {isEditMode ? '完成编辑' : '编辑模式'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Process Diagram Area */}
        <div className="flex-1 relative">
          <ProcessImageBackground
            imageUrl={processImage}
            onImageUpload={handleImageUpload}
            onImageRemove={() => setProcessImage(null)}
            isEditMode={isEditMode}
          >
            {tags.map((tag) => (
              <DraggableTag
                key={tag.id}
                tag={tag}
                isEditMode={isEditMode}
                onPositionChange={handlePositionChange}
                onClick={setSelectedTag}
              />
            ))}
          </ProcessImageBackground>

          {isEditMode && (
            <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 px-3 py-2 rounded-md border border-border">
              拖拽标签可调整位置 | 点击"更换图片"上传真实流程图
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-border flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MonitoringPanel tags={tags} onTagClick={setSelectedTag} />
          </div>
          <div className="h-64 border-t border-border">
            <AlarmPanel alarms={alarms} onAcknowledge={handleAcknowledgeAlarm} />
          </div>
        </div>
      </div>

      {/* Tag Detail Modal */}
      <TagDetailModal
        tag={selectedTag}
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
      />
    </div>
  );
};

export default DCSInterface;
