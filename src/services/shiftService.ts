import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
export interface Shift {
  id: string;
  operator_id: string;
  operator_name: string;
  shift_type: string;
  start_time: string;
  end_time: string | null;
  handover_notes: string | null;
  alarm_summary: Record<string, unknown>;
  status: 'active' | 'completed';
  created_at: string;
}

export interface AlarmSummary {
  total: number;
  acknowledged: number;
  unacknowledged: number;
  byType: {
    alarm: number;
    warning: number;
  };
}

export const getShiftType = (): string => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 16) return '早班';
  if (hour >= 16 && hour < 24) return '中班';
  return '夜班';
};

export const startShift = async (
  operatorId: string,
  operatorName: string
): Promise<Shift | null> => {
  try {
    // First, end any active shifts for this operator
    await supabase
      .from('shifts')
      .update({ status: 'completed', end_time: new Date().toISOString() })
      .eq('operator_id', operatorId)
      .eq('status', 'active');

    // Create new shift
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        operator_id: operatorId,
        operator_name: operatorName,
        shift_type: getShiftType(),
        status: 'active',
        alarm_summary: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting shift:', error);
      return null;
    }

    return data as Shift;
  } catch (error) {
    console.error('Error starting shift:', error);
    return null;
  }
};

export const endShift = async (
  shiftId: string,
  handoverNotes: string,
  alarmSummary: AlarmSummary
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shifts')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        handover_notes: handoverNotes,
        alarm_summary: alarmSummary as unknown as Json,
      })
      .eq('id', shiftId);

    if (error) {
      console.error('Error ending shift:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending shift:', error);
    return false;
  }
};

export const getCurrentShift = async (
  operatorId: string
): Promise<Shift | null> => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('operator_id', operatorId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching current shift:', error);
      }
      return null;
    }

    return data as Shift;
  } catch (error) {
    console.error('Error fetching current shift:', error);
    return null;
  }
};

export const getRecentShifts = async (limit: number = 10): Promise<Shift[]> => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent shifts:', error);
      return [];
    }

    return (data || []) as Shift[];
  } catch (error) {
    console.error('Error fetching recent shifts:', error);
    return [];
  }
};
