import { supabase } from '@/integrations/supabase/client';
import { Alarm, AlarmPriority, AlarmCategory } from '@/types/dcs';

// Helper to map DB row to Alarm object
const mapRowToAlarm = (row: any): Alarm => ({
  id: row.id,
  tagId: row.tag_id,
  tagName: row.tag_name,
  message: row.message,
  type: row.type as 'warning' | 'alarm',
  timestamp: new Date(row.created_at),
  acknowledged: row.acknowledged,
  acknowledgedBy: row.acknowledged_by || undefined,
  acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
  priority: (row.priority || 3) as AlarmPriority,
  category: (row.category || 'process') as AlarmCategory,
  riskScore: row.risk_score || 50,
  responseDeadline: row.response_deadline ? new Date(row.response_deadline) : new Date(),
  escalated: row.escalated || false,
  rootCauseTagIds: row.root_cause_tag_ids || undefined,
});

// Save alarm to database (let DB generate UUID)
export const saveAlarm = async (alarm: Alarm): Promise<string | null> => {
  const { data, error } = await supabase.from('alarms').insert({
    tag_id: alarm.tagId,
    tag_name: alarm.tagName,
    message: alarm.message,
    type: alarm.type,
    created_at: alarm.timestamp.toISOString(),
    acknowledged: alarm.acknowledged,
    acknowledged_by: alarm.acknowledgedBy || null,
    acknowledged_at: alarm.acknowledgedAt?.toISOString() || null,
    priority: alarm.priority,
    category: alarm.category,
    risk_score: alarm.riskScore,
    response_deadline: alarm.responseDeadline.toISOString(),
    escalated: alarm.escalated,
    root_cause_tag_ids: alarm.rootCauseTagIds || null,
  }).select('id').single();

  if (error) {
    console.error('Failed to save alarm:', error);
    return null;
  }
  
  return data?.id || null;
};

// Fetch alarms from database
export const fetchAlarms = async (limit: number = 50): Promise<Alarm[]> => {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .order('priority', { ascending: true })
    .order('risk_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch alarms:', error);
    return [];
  }

  return (data || []).map(mapRowToAlarm);
};

// Acknowledge alarm in database (requires operator or admin role)
export const acknowledgeAlarm = async (
  alarmId: string,
  acknowledgedBy: string,
  userRole?: string
): Promise<void> => {
  // Defense in depth: validate role client-side (RLS enforces server-side)
  if (userRole && userRole !== 'admin' && userRole !== 'operator') {
    throw new Error('Unauthorized: Only operators and admins can acknowledge alarms');
  }

  const { error } = await supabase
    .from('alarms')
    .update({
      acknowledged: true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alarmId);

  if (error) {
    console.error('Failed to acknowledge alarm:', error);
    throw new Error('Failed to acknowledge alarm');
  }
};

// Subscribe to realtime alarm updates
export const subscribeToAlarms = (
  onNewAlarm: (alarm: Alarm) => void,
  onAlarmUpdate: (alarm: Alarm) => void
) => {
  const channel = supabase
    .channel('alarms-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alarms',
      },
      (payload) => {
        onNewAlarm(mapRowToAlarm(payload.new));
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'alarms',
      },
      (payload) => {
        onAlarmUpdate(mapRowToAlarm(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Update alarm risk score and escalation status
export const updateAlarmRisk = async (
  alarmId: string,
  riskScore: number,
  escalated: boolean,
  priority?: AlarmPriority
): Promise<void> => {
  const updateData: any = {
    risk_score: riskScore,
    escalated,
  };
  
  if (priority !== undefined) {
    updateData.priority = priority;
  }

  const { error } = await supabase
    .from('alarms')
    .update(updateData)
    .eq('id', alarmId);

  if (error) {
    console.error('Failed to update alarm risk:', error);
  }
};
