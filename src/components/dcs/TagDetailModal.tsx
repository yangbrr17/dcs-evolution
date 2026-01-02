import React from 'react';
import { TagData, DataPoint } from '@/types/dcs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagDetailModalProps {
  tag: TagData | null;
  open: boolean;
  onClose: () => void;
}

// Generate future prediction data points
const generateFuturePredictions = (tag: TagData, points: number = 5): DataPoint[] => {
  const predictions: DataPoint[] = [];
  const now = new Date();
  const lastValue = tag.currentValue;
  const trend = tag.predictedValue - lastValue;
  
  for (let i = 1; i <= points; i++) {
    const timestamp = new Date(now.getTime() + i * 60000); // Future 1-5 minutes
    // Simulate prediction trending towards setpoint with some noise
    const trendFactor = trend * (1 - i * 0.15);
    const predicted = lastValue + trendFactor + (Math.random() - 0.5) * 2;
    predictions.push({ 
      timestamp, 
      value: undefined as any, // No actual value for future
      predicted: Number(predicted.toFixed(1))
    });
  }
  
  return predictions;
};

const TagDetailModal: React.FC<TagDetailModalProps> = ({ tag, open, onClose }) => {
  if (!tag) return null;

  // Generate future predictions
  const futurePredictions = generateFuturePredictions(tag, 5);
  
  // Combine history with future predictions
  const historyData = tag.history.map((point, index) => ({
    time: point.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    value: point.value,
    predicted: point.predicted,
    isFuture: false,
    index,
  }));
  
  const futureData = futurePredictions.map((point, index) => ({
    time: point.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    value: null as number | null, // No actual value for future
    predicted: point.predicted,
    futurePredicted: point.predicted, // Separate line for future
    isFuture: true,
    index: historyData.length + index,
  }));

  const chartData = [...historyData, ...futureData];
  
  // Check if prediction exceeds alarm limits
  const predictionExceedsAlarm = futurePredictions.some(
    p => p.predicted !== undefined && (p.predicted >= tag.limits.highAlarm || p.predicted <= tag.limits.lowAlarm)
  );
  const predictionExceedsWarning = futurePredictions.some(
    p => p.predicted !== undefined && (p.predicted >= tag.limits.highWarning || p.predicted <= tag.limits.lowWarning)
  );

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

  // Find the index where future data starts
  const futureStartIndex = historyData.length;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn('flex items-center gap-2', getStatusColor())}>
              {getStatusIcon()}
            </span>
            <span>{tag.name}</span>
            <span className="text-muted-foreground font-normal">- {tag.description}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {tag.name} 详细监控数据和趋势图
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prediction Alert */}
          {(predictionExceedsAlarm || predictionExceedsWarning) && (
            <div className={cn(
              'p-3 rounded-md border-l-4 flex items-center gap-2',
              predictionExceedsAlarm 
                ? 'bg-status-alarm/10 border-l-status-alarm' 
                : 'bg-status-warning/10 border-l-status-warning'
            )}>
              {predictionExceedsAlarm ? (
                <AlertCircle className="w-4 h-4 text-status-alarm" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-status-warning" />
              )}
              <span className={predictionExceedsAlarm ? 'text-status-alarm' : 'text-status-warning'}>
                预测值将在5分钟内{predictionExceedsAlarm ? '超出报警限' : '超出警告限'}！
              </span>
            </div>
          )}

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
              <p className="text-xs text-muted-foreground mb-1">预测值 (5min)</p>
              <p className={cn(
                'text-xl font-mono font-semibold',
                predictionExceedsAlarm ? 'text-status-alarm animate-pulse-alarm' :
                predictionExceedsWarning ? 'text-status-warning animate-pulse-warning' :
                'dcs-prediction'
              )}>
                {tag.predictedValue.toFixed(1)}
              </p>
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

          {/* Trend Chart with Future Prediction */}
          <div className="dcs-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">趋势图 (历史30分钟 + 未来5分钟预测)</p>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-dcs-prediction animate-pulse" />
                <span className="text-muted-foreground">预测区间</span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  {/* Future prediction area highlight */}
                  <ReferenceArea
                    x1={chartData[futureStartIndex]?.time}
                    x2={chartData[chartData.length - 1]?.time}
                    fill="hsl(var(--dcs-prediction))"
                    fillOpacity={0.08}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    interval="preserveStartEnd"
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
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined) return ['-', name];
                      return [value?.toFixed?.(1) || value, name];
                    }}
                  />
                  {/* Reference lines for limits */}
                  <ReferenceLine
                    y={tag.limits.highAlarm}
                    stroke="hsl(var(--status-alarm))"
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                    label={{ value: '高高', position: 'right', fontSize: 10, fill: 'hsl(var(--status-alarm))' }}
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
                    label={{ value: 'SP', position: 'right', fontSize: 10, fill: 'hsl(var(--dcs-setpoint))' }}
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
                    strokeOpacity={0.6}
                    label={{ value: '低低', position: 'right', fontSize: 10, fill: 'hsl(var(--status-alarm))' }}
                  />
                  {/* Actual value line (historical only) */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--dcs-value))"
                    strokeWidth={2}
                    dot={false}
                    name="实际值"
                    connectNulls={false}
                  />
                  {/* Historical predicted value line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--dcs-prediction))"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    name="历史预测"
                    connectNulls={false}
                  />
                  {/* Future prediction line */}
                  <Line
                    type="monotone"
                    dataKey="futurePredicted"
                    stroke="hsl(var(--dcs-prediction))"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ r: 3, fill: 'hsl(var(--dcs-prediction))' }}
                    name="未来预测"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-dcs-value" />
                <span className="text-muted-foreground">实际值</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-dcs-prediction" style={{ borderBottom: '2px dashed' }} />
                <span className="text-muted-foreground">历史预测</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-dcs-prediction opacity-80" />
                <div className="w-1 h-1 rounded-full bg-dcs-prediction" />
                <span className="text-muted-foreground">未来预测</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-dcs-setpoint" />
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
