import React, { useState, useMemo } from 'react';
import { Alarm, AlarmPriority } from '@/types/dcs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, AlertTriangle, AlertCircle, Check, Clock, User, ExternalLink, 
  Zap, TrendingUp, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  groupAlarmsByPriority,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatRemainingTime,
} from '@/services/alarmPriorityService';

interface AlarmPanelProps {
  alarms: Alarm[];
  onAcknowledge: (alarmId: string, acknowledgedBy: string) => void;
  onAlarmClick?: (tagName: string) => void;
}

const PriorityIcon: React.FC<{ priority: AlarmPriority }> = ({ priority }) => {
  switch (priority) {
    case 1:
      return <Zap className="w-4 h-4 text-red-500 animate-pulse" />;
    case 2:
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 3:
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 4:
      return <Bell className="w-4 h-4 text-blue-400" />;
  }
};

const RiskScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-blue-400';
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-300", getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">{score}</span>
    </div>
  );
};

const AlarmPanel: React.FC<AlarmPanelProps> = ({ alarms, onAcknowledge, onAlarmClick }) => {
  const { profile, canAcknowledge } = useAuth();
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlarms = useMemo(() => 
    alarms.filter((a) => !a.acknowledged),
    [alarms]
  );
  
  const acknowledgedAlarms = useMemo(() => 
    alarms.filter((a) => a.acknowledged),
    [alarms]
  );

  const groupedAlarms = useMemo(() => 
    groupAlarmsByPriority(activeAlarms),
    [activeAlarms]
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const handleAcknowledgeClick = (e: React.MouseEvent, alarmId: string) => {
    e.stopPropagation();
    if (!canAcknowledge()) return;
    setSelectedAlarmId(alarmId);
    setAcknowledgeDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedAlarmId && profile) {
      onAcknowledge(selectedAlarmId, profile.name);
      setAcknowledgeDialogOpen(false);
      setSelectedAlarmId(null);
    }
  };

  const handleAlarmItemClick = (tagName: string) => {
    if (onAlarmClick) {
      onAlarmClick(tagName);
    }
  };

  const renderAlarmItem = (alarm: Alarm) => {
    const colors = PRIORITY_COLORS[alarm.priority];
    const isOverdue = alarm.responseDeadline && currentTime > alarm.responseDeadline;
    
    return (
      <div
        key={alarm.id}
        className={cn(
          'p-2 rounded-md border-l-4 bg-secondary/50 cursor-pointer hover:bg-secondary/80 transition-colors',
          colors.border,
          alarm.priority === 1 && 'animate-pulse-alarm',
          alarm.escalated && 'ring-1 ring-red-500/50'
        )}
        onClick={() => handleAlarmItemClick(alarm.tagName)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <PriorityIcon priority={alarm.priority} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                  {alarm.tagName}
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </p>
                {alarm.escalated && (
                  <span className="px-1 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">
                    已升级
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {alarm.message}
              </p>
              
              {/* Risk Score Bar */}
              <RiskScoreBar score={alarm.riskScore} />
              
              {/* Time and Response Deadline */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(alarm.timestamp)}
                </span>
                {alarm.responseDeadline && (
                  <span className={cn(
                    "flex items-center gap-1",
                    isOverdue ? "text-red-400" : "text-muted-foreground"
                  )}>
                    <Timer className="w-3 h-3" />
                    {formatRemainingTime(alarm.responseDeadline, currentTime)}
                  </span>
                )}
                {!alarm.escalated && alarm.riskScore > 70 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <TrendingUp className="w-3 h-3" />
                    风险上升
                  </span>
                )}
              </div>
            </div>
          </div>
          {canAcknowledge() && (
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-7 px-2 text-xs"
              onClick={(e) => handleAcknowledgeClick(e, alarm.id)}
            >
              <Check className="w-3 h-3 mr-1" />
              确认
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderPriorityGroup = (priority: AlarmPriority, alarmsInGroup: Alarm[]) => {
    if (alarmsInGroup.length === 0) return null;
    
    const colors = PRIORITY_COLORS[priority];
    const label = PRIORITY_LABELS[priority];
    
    return (
      <div key={priority} className="mb-3">
        <div className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-t-md text-xs font-medium",
          colors.bg,
          colors.text
        )}>
          <PriorityIcon priority={priority} />
          <span>{label}优先级</span>
          <span className="ml-auto px-1.5 py-0.5 bg-background/50 rounded text-[10px]">
            {alarmsInGroup.length}
          </span>
        </div>
        <div className="space-y-1.5 pt-1.5">
          {alarmsInGroup.map(renderAlarmItem)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Alarm List */}
        <ScrollArea className="flex-1 dcs-scrollbar">
          <div className="p-2 space-y-2">
            {alarms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无报警</p>
              </div>
            ) : (
              <>
                {/* Active Alarms by Priority */}
                {activeAlarms.length > 0 && (
                  <div>
                    {([1, 2, 3, 4] as AlarmPriority[]).map(p => 
                      renderPriorityGroup(p, groupedAlarms[p])
                    )}
                  </div>
                )}

                {/* Acknowledged Alarms */}
                {acknowledgedAlarms.length > 0 && (
                  <>
                    <div className="text-xs text-muted-foreground py-2 border-t border-border mt-2">
                      已确认 ({acknowledgedAlarms.length})
                    </div>
                    {acknowledgedAlarms.slice(0, 5).map((alarm) => (
                      <div
                        key={alarm.id}
                        className="p-2 rounded-md bg-secondary/30 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleAlarmItemClick(alarm.tagName)}
                      >
                        <div className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">
                              {alarm.tagName}: {alarm.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                              <span>{formatTime(alarm.timestamp)}</span>
                              {alarm.acknowledgedBy && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {alarm.acknowledgedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Acknowledge Dialog */}
      <Dialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认报警</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              您将以 <span className="font-medium text-foreground">{profile?.name}</span> 的身份确认此报警
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">{profile?.name}</div>
                  {profile?.employee_id && (
                    <div className="text-xs text-muted-foreground">工号: {profile.employee_id}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcknowledgeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              确认报警
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlarmPanel;