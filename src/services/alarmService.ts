import { supabase } from '@/integrations/supabase/client';
import { Alarm } from '@/types/dcs';

// Save alarm to database
export const saveAlarm = async (alarm: Alarm): Promise<void> => {
  const { error } = await supabase.from('alarms').insert({
    id: alarm.id,
    tag_id: alarm.tagId,
    tag_name: alarm.tagName,
    message: alarm.message,
    type: alarm.type,
    created_at: alarm.timestamp.toISOString(),
    acknowledged: alarm.acknowledged,
    acknowledged_by: alarm.acknowledgedBy || null,
    acknowledged_at: alarm.acknowledgedAt?.toISOString() || null,
  });

  if (error) {
    console.error('Failed to save alarm:', error);
  }
};

// Fetch alarms from database
export const fetchAlarms = async (limit: number = 50): Promise<Alarm[]> => {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch alarms:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    tagId: row.tag_id,
    tagName: row.tag_name,
    message: row.message,
    type: row.type as 'warning' | 'alarm',
    timestamp: new Date(row.created_at),
    acknowledged: row.acknowledged,
    acknowledgedBy: row.acknowledged_by || undefined,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
  }));
};

// Acknowledge alarm in database
export const acknowledgeAlarm = async (
  alarmId: string,
  acknowledgedBy: string
): Promise<void> => {
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
        const row = payload.new as any;
        onNewAlarm({
          id: row.id,
          tagId: row.tag_id,
          tagName: row.tag_name,
          message: row.message,
          type: row.type as 'warning' | 'alarm',
          timestamp: new Date(row.created_at),
          acknowledged: row.acknowledged,
          acknowledgedBy: row.acknowledged_by || undefined,
          acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
        });
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
        const row = payload.new as any;
        onAlarmUpdate({
          id: row.id,
          tagId: row.tag_id,
          tagName: row.tag_name,
          message: row.message,
          type: row.type as 'warning' | 'alarm',
          timestamp: new Date(row.created_at),
          acknowledged: row.acknowledged,
          acknowledgedBy: row.acknowledged_by || undefined,
          acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
