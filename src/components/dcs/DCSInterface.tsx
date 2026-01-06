import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TagData, Alarm, ProcessArea } from '@/types/dcs';
import { createInitialTags, updateTagData, generateAlarm, createProcessAreas } from '@/services/mockDataService';
import { saveAlarm, fetchAlarms, acknowledgeAlarm, subscribeToAlarms } from '@/services/alarmService';
import ProcessImageBackground from './ProcessImageBackground';
import DraggableTag from './DraggableTag';
import TagDetailModal from './TagDetailModal';
import AlarmPanel from './AlarmPanel';
import MonitoringPanel from './MonitoringPanel';
import AreaNavigation from './AreaNavigation';
import { Button } from '@/components/ui/button';
import { Settings, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DCSInterface: React.FC = () => {
  const [allTags, setAllTags] = useState<TagData[]>(createInitialTags);
  const [areas, setAreas] = useState<ProcessArea[]>(createProcessAreas);
  const [currentAreaId, setCurrentAreaId] = useState<string>('overview');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);

  // Get current area
  const currentArea = useMemo(() => 
    areas.find((a) => a.id === currentAreaId) || areas[0],
    [areas, currentAreaId]
  );

  // Filter tags for current area
  const currentTags = useMemo(() => 
    allTags.filter((tag) => currentArea.tagIds.includes(tag.id)),
    [allTags, currentArea]
  );

  // Load alarms from database on mount
  useEffect(() => {
    const loadAlarms = async () => {
      const dbAlarms = await fetchAlarms(50);
      setAlarms(dbAlarms);
    };
    loadAlarms();
  }, []);

  // Subscribe to realtime alarm updates
  useEffect(() => {
    const unsubscribe = subscribeToAlarms(
      (newAlarm) => {
        setAlarms((prev) => {
          // Avoid duplicates
          if (prev.some((a) => a.id === newAlarm.id)) return prev;
          return [newAlarm, ...prev].slice(0, 50);
        });
      },
      (updatedAlarm) => {
        setAlarms((prev) =>
          prev.map((a) => (a.id === updatedAlarm.id ? updatedAlarm : a))
        );
      }
    );

    return unsubscribe;
  }, []);

  // Real-time data update
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setAllTags((prevTags) => {
        const newTags = prevTags.map((tag) => {
          const previousStatus = tag.status;
          const updatedTag = updateTagData(tag);
          
          // Check for new alarms
          const alarm = generateAlarm(updatedTag, previousStatus);
          if (alarm) {
            // Save to database and update local state with DB-generated ID
            saveAlarm(alarm).then((dbId) => {
              if (dbId) {
                const dbAlarm = { ...alarm, id: dbId };
                setAlarms((prev) => {
                  // Avoid duplicates
                  if (prev.some((a) => a.id === dbId)) return prev;
                  return [dbAlarm, ...prev].slice(0, 50);
                });
              }
            });
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
    setAllTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, position } : tag))
    );
  }, []);

  const handleAcknowledgeAlarm = useCallback(async (alarmId: string, acknowledgedBy: string) => {
    // Update in database
    await acknowledgeAlarm(alarmId, acknowledgedBy);
    
    // Optimistic UI update
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy }
          : alarm
      )
    );
  }, []);

  const handleImageUpload = (url: string) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === currentAreaId ? { ...area, imageUrl: url } : area
      )
    );
    toast({ title: '图片已上传', description: `已为"${currentArea.name}"设置流程图` });
  };

  const handleImageRemove = () => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === currentAreaId ? { ...area, imageUrl: null } : area
      )
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="dcs-header flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">DCS 监控系统</h1>
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

      {/* Area Navigation */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <AreaNavigation
          areas={areas}
          currentAreaId={currentAreaId}
          onAreaChange={setCurrentAreaId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Process Diagram Area */}
        <div className="flex-1 relative">
          <ProcessImageBackground
            imageUrl={currentArea.imageUrl}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            isEditMode={isEditMode}
          >
            {currentTags.map((tag) => (
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
              拖拽标签可调整位置 | 点击"更换图片"上传"{currentArea.name}"的流程图
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-border flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MonitoringPanel tags={currentTags} onTagClick={setSelectedTag} />
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
