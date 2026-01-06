import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertTriangle, CheckCircle, FileText, BookOpen, Plus } from 'lucide-react';
import { Alarm } from '@/types/dcs';
import { getCurrentShift, endShift, startShift, AlarmSummary, Shift } from '@/services/shiftService';
import { logOperation } from '@/services/operationLogService';
import { getShiftEvents, addShiftEvent, ShiftEvent } from '@/services/shiftEventService';
import { useToast } from '@/hooks/use-toast';
import ShiftEventForm from './ShiftEventForm';
import ShiftEventList from './ShiftEventList';

interface ShiftHandoverProps {
  isOpen: boolean;
  onClose: () => void;
  alarms: Alarm[];
}

const ShiftHandover: React.FC<ShiftHandoverProps> = ({ isOpen, onClose, alarms }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [handoverNotes, setHandoverNotes] = useState('');
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shiftEvents, setShiftEvents] = useState<ShiftEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      getCurrentShift(user.id).then((shift) => {
        setCurrentShift(shift);
        if (shift) {
          getShiftEvents(shift.id).then(setShiftEvents);
        }
      });
    }
  }, [isOpen, user]);

  // Calculate alarm summary
  const alarmSummary: AlarmSummary = {
    total: alarms.length,
    acknowledged: alarms.filter(a => a.acknowledged).length,
    unacknowledged: alarms.filter(a => !a.acknowledged).length,
    byType: {
      alarm: alarms.filter(a => a.type === 'alarm').length,
      warning: alarms.filter(a => a.type === 'warning').length,
    },
  };

  const handleAddEvent = async (eventData: {
    event_type: string;
    title: string;
    description: string;
    severity: string;
  }) => {
    if (!user || !profile || !currentShift) return;

    setIsAddingEvent(true);
    try {
      const newEvent = await addShiftEvent({
        shift_id: currentShift.id,
        operator_id: user.id,
        operator_name: profile.name,
        event_type: eventData.event_type as ShiftEvent['event_type'],
        title: eventData.title,
        description: eventData.description || null,
        severity: eventData.severity as ShiftEvent['severity'],
      });

      if (newEvent) {
        setShiftEvents((prev) => [newEvent, ...prev]);
        setShowEventForm(false);
        toast({
          title: '大事记已添加',
          description: eventData.title,
        });
      }
    } catch (error) {
      toast({
        title: '添加失败',
        description: '添加大事记时发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleHandover = async () => {
    if (!user || !profile) return;

    setIsSubmitting(true);
    try {
      // End current shift if exists
      if (currentShift) {
        await endShift(currentShift.id, handoverNotes, alarmSummary);
      }

      // Start new shift
      const newShift = await startShift(user.id, profile.name);

      // Log the operation
      await logOperation(user.id, profile.name, 'shift_handover', {
        previousShiftId: currentShift?.id,
        newShiftId: newShift?.id,
        handoverNotes,
        alarmSummary,
        eventCount: shiftEvents.length,
      });

      toast({
        title: '班次交接完成',
        description: `已开始新班次，当前为${newShift?.shift_type || '未知班次'}`,
      });

      setHandoverNotes('');
      setShiftEvents([]);
      onClose();
    } catch (error) {
      toast({
        title: '交接失败',
        description: '班次交接过程中发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            班次交接
          </DialogTitle>
          <DialogDescription>
            完成当前班次并记录交接信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Shift Info */}
          {currentShift && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">当前班次</span>
                <Badge variant="outline">{currentShift.shift_type}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                开始时间: {new Date(currentShift.start_time).toLocaleString('zh-CN')}
              </div>
              <div className="text-xs text-muted-foreground">
                操作员: {currentShift.operator_name}
              </div>
            </div>
          )}

          <Separator />

          {/* Major Events Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                大事记
                {shiftEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {shiftEvents.length}
                  </Badge>
                )}
              </Label>
              {currentShift && !showEventForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEventForm(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  添加
                </Button>
              )}
            </div>

            {showEventForm && (
              <ShiftEventForm
                onSubmit={handleAddEvent}
                onCancel={() => setShowEventForm(false)}
                isSubmitting={isAddingEvent}
              />
            )}

            {!showEventForm && (
              <ShiftEventList events={shiftEvents} maxHeight="180px" />
            )}
          </div>

          <Separator />

          {/* Alarm Summary */}
          <div>
            <Label className="text-sm font-medium mb-2 block">本班次报警统计</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div>
                  <div className="text-lg font-bold text-red-500">{alarmSummary.byType.alarm}</div>
                  <div className="text-xs text-muted-foreground">报警</div>
                </div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-lg font-bold text-yellow-500">{alarmSummary.byType.warning}</div>
                  <div className="text-xs text-muted-foreground">警告</div>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-lg font-bold text-green-500">{alarmSummary.acknowledged}</div>
                  <div className="text-xs text-muted-foreground">已确认</div>
                </div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-lg font-bold text-orange-500">{alarmSummary.unacknowledged}</div>
                  <div className="text-xs text-muted-foreground">未确认</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Handover Notes */}
          <div>
            <Label htmlFor="handover-notes" className="text-sm font-medium mb-2 block">
              <FileText className="w-4 h-4 inline mr-1" />
              交接备注
            </Label>
            <Textarea
              id="handover-notes"
              placeholder="请输入需要交接的重要事项、注意事项、未完成工作等..."
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleHandover} disabled={isSubmitting}>
            {isSubmitting ? '处理中...' : '确认交接'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftHandover;
