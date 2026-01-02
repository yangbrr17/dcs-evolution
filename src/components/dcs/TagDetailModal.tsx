import React from 'react';
import { TagData } from '@/types/dcs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TagDetailModalProps {
  tag: TagData | null;
  open: boolean;
  onClose: () => void;
}

const TagDetailModal: React.FC<TagDetailModalProps> = ({ tag, open, onClose }) => {
  if (!tag) return null;

  const chartData = tag.history.map((point, index) => ({
    time: point.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    value: point.value,
    predicted: point.predicted,
    index,
  }));

  const getStatusColor = () => {
    switch (tag.status) {
      case 'alarm':
        return 'text-status-alarm';
      case 'warning':
        return 'text-status-warning';
      default:
        return 'text-status-normal';
    }
  };

  const getStatusIcon = () => {
    switch (tag.status) {
      case 'alarm':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className={cn('flex items-center gap-2', getStatusColor())}>
                {getStatusIcon()}
              </span>
              <span>{tag.name}</span>
              <span className="text-muted-foreground font-normal">- {tag.description}</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Values Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="dcs-panel p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">当前值</p>
              <p className="dcs-value text-xl">{tag.currentValue.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">{tag.unit}</p>
            </div>
            <div className="dcs-panel p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">设定值</p>
              <p className="dcs-setpoint text-xl">{tag.setpoint.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">{tag.unit}</p>
            </div>
            <div className="dcs-panel p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">预测值</p>
              <p className="dcs-prediction text-xl">{tag.predictedValue.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">{tag.unit}</p>
            </div>
            <div className="dcs-panel p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">偏差</p>
              <p className={cn(
                'text-xl font-mono font-semibold',
                Math.abs(tag.currentValue - tag.setpoint) > 5 ? 'text-status-warning' : 'text-foreground'
              )}>
                {(tag.currentValue - tag.setpoint).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">{tag.unit}</p>
            </div>
          </div>

          {/* Limits Display */}
          <div className="dcs-panel p-3">
            <p className="text-xs text-muted-foreground mb-2">报警限</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm font-mono">
              <div>
                <p className="text-status-alarm">{tag.limits.highAlarm}</p>
                <p className="text-xs text-muted-foreground">高高</p>
              </div>
              <div>
                <p className="text-status-warning">{tag.limits.highWarning}</p>
                <p className="text-xs text-muted-foreground">高</p>
              </div>
              <div>
                <p className="text-status-warning">{tag.limits.lowWarning}</p>
                <p className="text-xs text-muted-foreground">低</p>
              </div>
              <div>
                <p className="text-status-alarm">{tag.limits.lowAlarm}</p>
                <p className="text-xs text-muted-foreground">低低</p>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="dcs-panel p-3">
            <p className="text-xs text-muted-foreground mb-2">趋势图 (过去30分钟)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    domain={[
                      tag.limits.lowAlarm - 10,
                      tag.limits.highAlarm + 10,
                    ]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.375rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  {/* Reference lines for limits */}
                  <ReferenceLine
                    y={tag.limits.highAlarm}
                    stroke="hsl(var(--status-alarm))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    y={tag.limits.highWarning}
                    stroke="hsl(var(--status-warning))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    y={tag.setpoint}
                    stroke="hsl(var(--dcs-setpoint))"
                    strokeDasharray="5 5"
                  />
                  <ReferenceLine
                    y={tag.limits.lowWarning}
                    stroke="hsl(var(--status-warning))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    y={tag.limits.lowAlarm}
                    stroke="hsl(var(--status-alarm))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                  {/* Actual value line */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--dcs-value))"
                    strokeWidth={2}
                    dot={false}
                    name="实际值"
                  />
                  {/* Predicted value line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--dcs-prediction))"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    name="预测值"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5" style={{ backgroundColor: 'hsl(var(--dcs-value))' }} />
                <span className="text-muted-foreground">实际值</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5" style={{ backgroundColor: 'hsl(var(--dcs-prediction))', borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">预测值</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5" style={{ backgroundColor: 'hsl(var(--dcs-setpoint))' }} />
                <span className="text-muted-foreground">设定值</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagDetailModal;
