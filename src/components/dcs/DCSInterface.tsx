import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TagData, Alarm, ProcessArea } from '@/types/dcs';
import { createInitialTags, updateTagData, generateAlarm } from '@/services/mockDataService';
import { saveAlarm, fetchAlarms, acknowledgeAlarm, subscribeToAlarms } from '@/services/alarmService';
import { logOperation } from '@/services/operationLogService';
import { startShift } from '@/services/shiftService';
import { fetchProcessAreas, uploadProcessImage, removeProcessImage } from '@/services/processAreaService';
import { useAuth } from '@/contexts/AuthContext';
import ProcessImageBackground from './ProcessImageBackground';
import DraggableTag from './DraggableTag';
import TagDetailModal from './TagDetailModal';
import AlarmPanel from './AlarmPanel';
import MonitoringPanel from './MonitoringPanel';
import AreaNavigation from './AreaNavigation';
import UserMenu from './UserMenu';
import ShiftHandover from './ShiftHandover';
import OperationLogPanel from './OperationLogPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Play, Pause, Bell, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DCSInterface: React.FC = () => {
  const { user, profile, role, canEdit } = useAuth();
  const [allTags, setAllTags] = useState<TagData[]>(createInitialTags);
  const [areas, setAreas] = useState<ProcessArea[]>([]);
  const [currentAreaId, setCurrentAreaId] = useState<string>('overview');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [showShiftHandover, setShowShiftHandover] = useState(false);

  // Get current area
  const currentArea = useMemo(() => 
    areas.find((a) => a.id === currentAreaId) || areas[0],
    [areas, currentAreaId]
  );

  // Filter tags for current area
  const currentTags = useMemo(() => {
    if (!currentArea) return [];
    return allTags.filter((tag) => currentArea.tagIds.includes(tag.id));
  }, [allTags, currentArea]);

  // Start shift on login
  useEffect(() => {
    if (user && profile) {
      // Log login and start shift
      logOperation(user.id, profile.name, 'login', {});
      startShift(user.id, profile.name);
    }
  }, [user, profile]);

  // Load process areas from database on mount
  useEffect(() => {
    const loadAreas = async () => {
      const dbAreas = await fetchProcessAreas();
      if (dbAreas.length > 0) {
        setAreas(dbAreas);
        setCurrentAreaId(dbAreas[0].id);
      }
    };
    loadAreas();
  }, []);

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

  // Ref to collect alarms during tag updates
  const pendingAlarmsRef = useRef<Alarm[]>([]);

  // Real-time data update
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      pendingAlarmsRef.current = [];
      
      setAllTags((prevTags) => {
        return prevTags.map((tag) => {
          const previousStatus = tag.status;
          const updatedTag = updateTagData(tag);
          
          // Check for new alarms
          const alarm = generateAlarm(updatedTag, previousStatus);
          if (alarm) {
            pendingAlarmsRef.current.push(alarm);
          }
          
          return updatedTag;
        });
      });

      // Process alarms after state update (use setTimeout to ensure state is updated)
      setTimeout(async () => {
        const alarmsToProcess = [...pendingAlarmsRef.current];
        for (const alarm of alarmsToProcess) {
          try {
            const dbId = await saveAlarm(alarm);
            if (dbId) {
              const dbAlarm = { ...alarm, id: dbId };
              setAlarms((prev) => {
                if (prev.some((a) => a.id === dbId)) return prev;
                return [dbAlarm, ...prev].slice(0, 50);
              });
            }
            toast({
              title: alarm.type === 'alarm' ? '⚠️ 报警' : '⚡ 警告',
              description: alarm.message,
              variant: alarm.type === 'alarm' ? 'destructive' : 'default',
            });
          } catch (error) {
            console.error('Failed to save alarm:', error);
          }
        }
      }, 0);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setAllTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, position } : tag))
    );
    
    // Log the operation
    if (user && profile) {
      const tag = allTags.find(t => t.id === id);
      logOperation(user.id, profile.name, 'tag_position_change', {
        tagId: id,
        tagName: tag?.name,
        newPosition: position,
      }, currentAreaId);
    }
  }, [user, profile, allTags, currentAreaId]);

  const handleAcknowledgeAlarm = useCallback(async (alarmId: string, acknowledgedBy: string) => {
    // Update in database (pass role for defense-in-depth validation)
    await acknowledgeAlarm(alarmId, acknowledgedBy, role ?? undefined);
    
    // Optimistic UI update
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === alarmId
          ? { ...alarm, acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy }
          : alarm
      )
    );

    // Log the operation
    if (user && profile) {
      const alarm = alarms.find(a => a.id === alarmId);
      logOperation(user.id, profile.name, 'alarm_acknowledge', {
        alarmId,
        tagName: alarm?.tagName,
        message: alarm?.message,
        acknowledgedBy,
      }, currentAreaId);
    }
  }, [user, profile, role, alarms, currentAreaId]);

  const handleImageUpload = useCallback(async (file: File) => {
    const url = await uploadProcessImage(currentAreaId, file);
    if (url) {
      setAreas((prev) =>
        prev.map((area) =>
          area.id === currentAreaId ? { ...area, imageUrl: url } : area
        )
      );
      toast({ title: '图片已上传', description: `已为"${currentArea.name}"设置流程图` });
      
      // Log the operation
      if (user && profile) {
        logOperation(user.id, profile.name, 'image_upload', {
          areaId: currentAreaId,
          areaName: currentArea.name,
        }, currentAreaId);
      }
    } else {
      toast({ title: '上传失败', description: '请检查您是否有管理员权限', variant: 'destructive' });
    }
  }, [currentAreaId, currentArea, user, profile]);

  const handleImageRemove = useCallback(async () => {
    const success = await removeProcessImage(currentAreaId, currentArea.imageUrl);
    if (success) {
      setAreas((prev) =>
        prev.map((area) =>
          area.id === currentAreaId ? { ...area, imageUrl: null } : area
        )
      );
      toast({ title: '图片已移除' });
      
      // Log the operation
      if (user && profile) {
        logOperation(user.id, profile.name, 'image_remove', {
          areaId: currentAreaId,
          areaName: currentArea.name,
        }, currentAreaId);
      }
    } else {
      toast({ title: '移除失败', description: '请检查您是否有管理员权限', variant: 'destructive' });
    }
  }, [currentAreaId, currentArea, user, profile]);

  const handleModeChange = (running: boolean) => {
    setIsRunning(running);
    
    // Log the operation
    if (user && profile) {
      logOperation(user.id, profile.name, 'mode_change', {
        mode: running ? 'running' : 'paused',
      }, currentAreaId);
    }
  };

  const activeAlarms = alarms.filter(a => !a.acknowledged);

  // Show loading state if areas not yet loaded
  if (!currentArea) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

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
            onClick={() => handleModeChange(!isRunning)}
            className="gap-1"
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRunning ? '暂停' : '运行'}
          </Button>
          
          {/* Edit Mode - Only for operators and admins */}
          {canEdit() && (
            <Button
              size="sm"
              variant={isEditMode ? 'default' : 'outline'}
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-1"
            >
              <Settings className="w-3 h-3" />
              {isEditMode ? '完成编辑' : '编辑模式'}
            </Button>
          )}
          
          {/* User Menu */}
          <UserMenu onShiftHandover={() => setShowShiftHandover(true)} />
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
        <div className="w-80 border-l border-border flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MonitoringPanel tags={currentTags} onTagClick={setSelectedTag} />
          </div>
          
          {/* Tabs for Alarms and Operation Logs */}
          <div className="h-80 border-t border-border">
            <Tabs defaultValue="alarms" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="alarms" className="gap-1 text-xs">
                  <Bell className="w-3 h-3" />
                  报警
                  {activeAlarms.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-status-alarm/20 text-status-alarm rounded">
                      {activeAlarms.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  操作日志
                </TabsTrigger>
              </TabsList>
              <TabsContent value="alarms" className="flex-1 m-0 overflow-hidden">
                <AlarmPanel 
                  alarms={alarms} 
                  onAcknowledge={handleAcknowledgeAlarm}
                />
              </TabsContent>
              <TabsContent value="logs" className="flex-1 m-0 overflow-hidden p-2">
                <OperationLogPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Tag Detail Modal */}
      <TagDetailModal
        tag={selectedTag}
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
      />

      {/* Shift Handover Modal */}
      <ShiftHandover
        isOpen={showShiftHandover}
        onClose={() => setShowShiftHandover(false)}
        alarms={alarms}
      />
    </div>
  );
};

export default DCSInterface;
