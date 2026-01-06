import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type OperationAction = 
  | 'login' 
  | 'logout' 
  | 'alarm_acknowledge' 
  | 'setpoint_change' 
  | 'shift_handover' 
  | 'mode_change'
  | 'tag_position_change'
  | 'image_upload'
  | 'image_remove';

export interface OperationLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: OperationAction;
  details: Record<string, unknown>;
  area_id: string | null;
  created_at: string;
}

export const logOperation = async (
  userId: string,
  userName: string,
  action: OperationAction,
  details: Record<string, unknown> = {},
  areaId?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('operation_logs')
      .insert([{
        user_id: userId,
        user_name: userName,
        action,
        details: details as unknown as Json,
        area_id: areaId || null,
      }]);

    if (error) {
      console.error('Failed to log operation:', error);
    }
  } catch (error) {
    console.error('Error logging operation:', error);
  }
};

export const fetchOperationLogs = async (
  limit: number = 50,
  userId?: string
): Promise<OperationLogEntry[]> => {
  try {
    let query = supabase
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching operation logs:', error);
      return [];
    }

    return (data || []) as OperationLogEntry[];
  } catch (error) {
    console.error('Error fetching operation logs:', error);
    return [];
  }
};

export const getActionLabel = (action: OperationAction): string => {
  const labels: Record<OperationAction, string> = {
    login: '登录系统',
    logout: '登出系统',
    alarm_acknowledge: '确认报警',
    setpoint_change: '修改设定值',
    shift_handover: '班次交接',
    mode_change: '模式切换',
    tag_position_change: '移动标签',
    image_upload: '上传工艺图',
    image_remove: '删除工艺图',
  };
  return labels[action] || action;
};
