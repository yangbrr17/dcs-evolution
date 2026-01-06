import React, { useState } from 'react';
import { Alarm } from '@/types/dcs';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, AlertTriangle, AlertCircle, Check, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AlarmPanelProps {
  alarms: Alarm[];
  onAcknowledge: (alarmId: string, acknowledgedBy: string) => void;
}

const AlarmPanel: React.FC<AlarmPanelProps> = ({ alarms, onAcknowledge }) => {
  const { profile, canAcknowledge } = useAuth();
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);

  const activeAlarms = alarms.filter((a) => !a.acknowledged);
  const acknowledgedAlarms = alarms.filter((a) => a.acknowledged);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const handleAcknowledgeClick = (alarmId: string) => {
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
                {/* Active Alarms */}
                {activeAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={cn(
                      'p-2 rounded-md border-l-4 bg-secondary/50',
                      alarm.type === 'alarm' 
                        ? 'border-l-status-alarm animate-pulse-alarm' 
                        : 'border-l-status-warning animate-pulse-warning'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {alarm.type === 'alarm' ? (
                          <AlertCircle className="w-4 h-4 text-status-alarm shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {alarm.tagName}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alarm.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(alarm.timestamp)}
                          </div>
                        </div>
                      </div>
                      {canAcknowledge() && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-7 px-2 text-xs"
                          onClick={() => handleAcknowledgeClick(alarm.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          确认
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Acknowledged Alarms */}
                {acknowledgedAlarms.length > 0 && (
                  <>
                    <div className="text-xs text-muted-foreground py-2 border-t border-border mt-2">
                      已确认 ({acknowledgedAlarms.length})
                    </div>
                    {acknowledgedAlarms.slice(0, 5).map((alarm) => (
                      <div
                        key={alarm.id}
                        className="p-2 rounded-md bg-secondary/30 opacity-60"
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
