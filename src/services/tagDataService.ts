import { supabase } from "@/integrations/supabase/client";
import { DataPoint } from "@/types/dcs";

export interface HistoryRecord {
  tagId: string;
  timestamp: Date;
  value: number;
}

interface RawDataPoint {
  timestamp: string;
  value: number;
}

/**
 * Parse CSV content to history records
 * Expected format: tagId,timestamp,value
 */
export const parseHistoryCSV = (csvContent: string): HistoryRecord[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV文件格式错误：至少需要包含表头和一行数据');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const tagIdIndex = header.indexOf('tagid');
  const timestampIndex = header.indexOf('timestamp');
  const valueIndex = header.indexOf('value');

  if (tagIdIndex === -1 || timestampIndex === -1 || valueIndex === -1) {
    throw new Error('CSV文件缺少必需的列：tagId, timestamp, value');
  }

  const records: HistoryRecord[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    
    try {
      const tagId = values[tagIdIndex];
      const timestamp = new Date(values[timestampIndex]);
      const value = parseFloat(values[valueIndex]);

      if (!tagId) {
        errors.push(`第${i + 1}行：tagId为空`);
        continue;
      }
      if (isNaN(timestamp.getTime())) {
        errors.push(`第${i + 1}行：时间戳格式无效`);
        continue;
      }
      if (isNaN(value)) {
        errors.push(`第${i + 1}行：数值无效`);
        continue;
      }

      records.push({ tagId, timestamp, value });
    } catch (e) {
      errors.push(`第${i + 1}行：解析错误`);
    }
  }

  if (errors.length > 0 && records.length === 0) {
    throw new Error(`解析失败：\n${errors.slice(0, 5).join('\n')}`);
  }

  return records;
};

/**
 * Import history records to database
 */
export const importTagHistory = async (records: HistoryRecord[]): Promise<{
  inserted: number;
  errors: number;
}> => {
  // Batch insert in chunks to avoid timeout
  const chunkSize = 500;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('tag_history')
      .upsert(
        chunk.map(r => ({
          tag_id: r.tagId,
          timestamp: r.timestamp.toISOString(),
          value: r.value
        })),
        { onConflict: 'tag_id,timestamp' }
      );

    if (error) {
      console.error('Import chunk error:', error);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }

  return { inserted, errors };
};

/**
 * Load history data for a specific tag from database
 */
export const loadTagHistory = async (
  tagId: string,
  limit: number = 30
): Promise<DataPoint[]> => {
  const { data, error } = await supabase
    .from('tag_history')
    .select('timestamp, value')
    .eq('tag_id', tagId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Load history error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Reverse to get chronological order and generate predictions
  const chronological = data.reverse() as RawDataPoint[];
  return generatePredictions(chronological);
};

/**
 * Check if there's any real history data in database
 */
export const hasRealHistoryData = async (): Promise<boolean> => {
  const { count, error } = await supabase
    .from('tag_history')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Check history error:', error);
    return false;
  }

  return (count ?? 0) > 0;
};

/**
 * Get statistics about imported data
 */
export const getHistoryStats = async (): Promise<{
  totalRecords: number;
  uniqueTags: string[];
  timeRange: { start: Date | null; end: Date | null };
}> => {
  // Get count
  const { count } = await supabase
    .from('tag_history')
    .select('*', { count: 'exact', head: true });

  // Get unique tags
  const { data: tagData } = await supabase
    .from('tag_history')
    .select('tag_id')
    .limit(1000);

  const uniqueTags = [...new Set(tagData?.map(d => d.tag_id) || [])];

  // Get time range
  const { data: minData } = await supabase
    .from('tag_history')
    .select('timestamp')
    .order('timestamp', { ascending: true })
    .limit(1);

  const { data: maxData } = await supabase
    .from('tag_history')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1);

  return {
    totalRecords: count ?? 0,
    uniqueTags,
    timeRange: {
      start: minData?.[0] ? new Date(minData[0].timestamp) : null,
      end: maxData?.[0] ? new Date(maxData[0].timestamp) : null
    }
  };
};

/**
 * Clear all history data (admin only)
 */
export const clearTagHistory = async (): Promise<void> => {
  const { error } = await supabase
    .from('tag_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    throw error;
  }
};

/**
 * Generate prediction values based on moving average
 */
const generatePredictions = (history: RawDataPoint[]): DataPoint[] => {
  return history.map((point, index) => {
    // Use moving average of last 5 points as "prediction"
    const lookback = Math.min(index, 5);
    const slice = history.slice(Math.max(0, index - lookback), index + 1);
    const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;

    // Add slight noise to simulate prediction variance
    const variance = Math.abs(point.value) * 0.005; // 0.5% variance
    const noise = (Math.random() - 0.5) * variance;
    const predicted = avg + noise;

    return {
      timestamp: new Date(point.timestamp),
      value: point.value,
      predicted: Number(predicted.toFixed(2))
    };
  });
};

/**
 * Generate future predictions based on current trend
 * This is used for the prediction display in TagDetailModal
 */
export const generateFuturePredictions = (
  currentValue: number,
  predictedValue: number,
  points: number = 5
): DataPoint[] => {
  const trend = predictedValue - currentValue;
  const predictions: DataPoint[] = [];
  const now = new Date();

  for (let i = 1; i <= points; i++) {
    const futureTime = new Date(now.getTime() + i * 60000); // 1 minute intervals
    const variance = Math.abs(currentValue) * 0.01;
    const noise = (Math.random() - 0.5) * variance;
    const predictedVal = currentValue + (trend * i * 0.5) + noise;

    predictions.push({
      timestamp: futureTime,
      value: predictedVal, // For future, value = predicted (they're the same)
      predicted: Number(predictedVal.toFixed(2))
    });
  }

  return predictions;
};
