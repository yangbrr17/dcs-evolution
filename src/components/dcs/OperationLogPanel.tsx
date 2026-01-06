import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Bell, 
  Settings, 
  RefreshCw,
  Move,
  Image,
  Trash
} from 'lucide-react';
import { fetchOperationLogs, OperationLogEntry, OperationAction, getActionLabel } from '@/services/operationLogService';

const actionIcons: Record<OperationAction, React.ReactNode> = {
  login: <LogIn className="w-3 h-3" />,
  logout: <LogOut className="w-3 h-3" />,
  alarm_acknowledge: <Bell className="w-3 h-3" />,
  setpoint_change: <Settings className="w-3 h-3" />,
  shift_handover: <RefreshCw className="w-3 h-3" />,
  mode_change: <Settings className="w-3 h-3" />,
  tag_position_change: <Move className="w-3 h-3" />,
  image_upload: <Image className="w-3 h-3" />,
  image_remove: <Trash className="w-3 h-3" />,
};

const actionColors: Record<OperationAction, string> = {
  login: 'bg-green-500',
  logout: 'bg-gray-500',
  alarm_acknowledge: 'bg-yellow-500',
  setpoint_change: 'bg-blue-500',
  shift_handover: 'bg-purple-500',
  mode_change: 'bg-indigo-500',
  tag_position_change: 'bg-cyan-500',
  image_upload: 'bg-teal-500',
  image_remove: 'bg-red-500',
};

const OperationLogPanel: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [logs, setLogs] = useState<OperationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      if (!user) return;
      
      setLoading(true);
      // Admins see all logs, others see only their own
      const userId = isAdmin() ? undefined : user.id;
      const fetchedLogs = await fetchOperationLogs(30, userId);
      setLogs(fetchedLogs);
      setLoading(false);
    };

    loadLogs();
    
    // Refresh logs every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatDetails = (action: OperationAction, details: Record<string, unknown>): string => {
    switch (action) {
      case 'alarm_acknowledge':
        return details.tagName ? `标签: ${details.tagName}` : '';
      case 'setpoint_change':
        return details.tagName 
          ? `${details.tagName}: ${details.oldValue} → ${details.newValue}` 
          : '';
      case 'shift_handover':
        return details.handoverNotes 
          ? `备注: ${String(details.handoverNotes).substring(0, 30)}...` 
          : '';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        加载操作日志...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <span>暂无操作记录</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Badge 
              className={`${actionColors[log.action as OperationAction] || 'bg-gray-500'} text-white p-1`}
            >
              {actionIcons[log.action as OperationAction] || <Settings className="w-3 h-3" />}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {getActionLabel(log.action as OperationAction)}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(log.created_at)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {log.user_name}
              </div>
              {formatDetails(log.action as OperationAction, log.details) && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {formatDetails(log.action as OperationAction, log.details)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default OperationLogPanel;
