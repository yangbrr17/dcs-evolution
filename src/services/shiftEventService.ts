import { supabase } from '@/integrations/supabase/client';

export interface ShiftEvent {
  id: string;
  shift_id: string;
  operator_id: string;
  operator_name: string;
  event_type: 'general' | 'emergency' | 'maintenance' | 'inspection' | 'other';
  title: string;
  description: string | null;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export type CreateShiftEventInput = Omit<ShiftEvent, 'id' | 'created_at'>;

const eventTypeLabels: Record<string, string> = {
  general: '一般事项',
  emergency: '紧急情况',
  maintenance: '维护保养',
  inspection: '巡检记录',
  other: '其他',
};

const severityLabels: Record<string, string> = {
  info: '普通',
  warning: '注意',
  critical: '重要',
};

export const getEventTypeLabel = (type: string): string => eventTypeLabels[type] || type;
export const getSeverityLabel = (severity: string): string => severityLabels[severity] || severity;

export const addShiftEvent = async (event: CreateShiftEventInput): Promise<ShiftEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('shift_events')
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error('Error adding shift event:', error);
      return null;
    }

    return data as ShiftEvent;
  } catch (error) {
    console.error('Error adding shift event:', error);
    return null;
  }
};

export const getShiftEvents = async (shiftId: string): Promise<ShiftEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('shift_events')
      .select('*')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shift events:', error);
      return [];
    }

    return (data || []) as ShiftEvent[];
  } catch (error) {
    console.error('Error fetching shift events:', error);
    return [];
  }
};

export const updateShiftEvent = async (
  eventId: string,
  updates: Partial<Pick<ShiftEvent, 'title' | 'description' | 'event_type' | 'severity'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shift_events')
      .update(updates)
      .eq('id', eventId);

    if (error) {
      console.error('Error updating shift event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating shift event:', error);
    return false;
  }
};

export const deleteShiftEvent = async (eventId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shift_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting shift event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting shift event:', error);
    return false;
  }
};
