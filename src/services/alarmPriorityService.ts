import { Alarm, AlarmPriority, AlarmCategory, TagData } from '@/types/dcs';

// Equipment criticality mapping (based on safety impact)
const EQUIPMENT_CRITICALITY: Record<string, number> = {
  // 反应器区域 - 最高关键性
  'TI-101': 0.95,  // 反应器温度
  'PI-101': 0.90,  // 反应器压力
  'TI-102': 0.85,  // 提升管出口温度
  'TI-103': 0.80,  // 沉降器温度
  'LI-101': 0.75,  // 反应器液位
  'FI-101': 0.70,  // 原料油流量
  
  // 再生器区域 - 高关键性
  'TI-201': 0.90,  // 再生器密相温度
  'TI-202': 0.85,  // 再生器稀相温度
  'PI-201': 0.80,  // 再生器压力
  'AI-201': 0.75,  // 烟气CO含量
  'AI-202': 0.70,  // 烟气O2含量
  'FI-201': 0.65,  // 主风流量
  
  // 分馏塔区域 - 中等关键性
  'TI-301': 0.60,  // 塔顶温度
  'TI-302': 0.55,  // 塔中温度
  'TI-303': 0.50,  // 塔底温度
  'PI-301': 0.55,  // 分馏塔顶压力
  'LI-301': 0.50,  // 分馏塔液位
  'FI-301': 0.45,  // 塔顶回流流量
  'FI-302': 0.40,  // 柴油出装置流量
};

// Response time limits in minutes for each priority level
export const RESPONSE_TIME_LIMITS: Record<AlarmPriority, number> = {
  1: 1,    // 紧急：1分钟
  2: 5,    // 高：5分钟
  3: 15,   // 中：15分钟
  4: 60,   // 低：60分钟
};

// Priority labels
export const PRIORITY_LABELS: Record<AlarmPriority, string> = {
  1: '紧急',
  2: '高',
  3: '中',
  4: '低',
};

// Priority colors (Tailwind classes)
export const PRIORITY_COLORS: Record<AlarmPriority, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' },
  2: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' },
  3: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500' },
  4: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-400' },
};

interface PriorityFactors {
  deviationSeverity: number;      // 偏差严重程度 0-1
  changeRate: number;             // 变化速率 0-1
  equipmentCriticality: number;   // 设备关键性 0-1
  timeUnacknowledged: number;     // 未确认时间（分钟）
}

// Calculate deviation severity from tag data
const calculateDeviationSeverity = (tag: TagData): number => {
  const value = tag.currentValue;
  const { highAlarm, highWarning, lowWarning, lowAlarm } = tag.limits;
  
  // Calculate how far into the alarm/warning zone
  if (value >= highAlarm) {
    const overAmount = value - highAlarm;
    const range = (highAlarm - highWarning) || 1;
    return Math.min(0.8 + (overAmount / range) * 0.2, 1);
  }
  if (value <= lowAlarm) {
    const underAmount = lowAlarm - value;
    const range = (lowWarning - lowAlarm) || 1;
    return Math.min(0.8 + (underAmount / range) * 0.2, 1);
  }
  if (value >= highWarning) {
    const ratio = (value - highWarning) / (highAlarm - highWarning);
    return 0.4 + ratio * 0.4;
  }
  if (value <= lowWarning) {
    const ratio = (lowWarning - value) / (lowWarning - lowAlarm);
    return 0.4 + ratio * 0.4;
  }
  return 0;
};

// Calculate change rate from history
const calculateChangeRate = (tag: TagData): number => {
  if (tag.history.length < 3) return 0;
  
  const recent = tag.history.slice(-5);
  if (recent.length < 2) return 0;
  
  const values = recent.map(p => p.value);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  
  // Normalize change rate based on limit range
  const limitRange = tag.limits.highAlarm - tag.limits.lowAlarm;
  const changePercent = Math.abs(lastValue - firstValue) / limitRange;
  
  return Math.min(changePercent * 5, 1); // Scale up for sensitivity
};

// Determine category based on tag ID
export const determineCategory = (tagId: string): AlarmCategory => {
  const prefix = tagId.split('-')[0];
  
  switch (prefix) {
    case 'TI': // Temperature - often safety related
    case 'PI': // Pressure - safety critical
      return 'safety';
    case 'FI': // Flow
    case 'LI': // Level
      return 'equipment';
    case 'AI': // Analyzer
      return 'process';
    default:
      return 'process';
  }
};

// Calculate priority based on multiple factors
export const calculatePriority = (tag: TagData, isAlarmType: boolean): AlarmPriority => {
  const factors: PriorityFactors = {
    deviationSeverity: calculateDeviationSeverity(tag),
    changeRate: calculateChangeRate(tag),
    equipmentCriticality: EQUIPMENT_CRITICALITY[tag.id] || 0.5,
    timeUnacknowledged: 0, // Initial calculation, no time elapsed
  };
  
  // Weighted score calculation
  const score = 
    factors.deviationSeverity * 0.35 +
    factors.changeRate * 0.20 +
    factors.equipmentCriticality * 0.35 +
    Math.min(factors.timeUnacknowledged / 30, 1) * 0.10;
  
  // Alarm type increases priority
  const adjustedScore = isAlarmType ? score + 0.1 : score;
  
  if (adjustedScore > 0.75) return 1;  // 紧急
  if (adjustedScore > 0.55) return 2;  // 高
  if (adjustedScore > 0.35) return 3;  // 中
  return 4;                             // 低
};

// Calculate dynamic risk score (0-100)
export const calculateRiskScore = (alarm: Alarm, currentTime: Date = new Date()): number => {
  // Base score from priority (higher priority = higher base)
  const baseScore = (5 - alarm.priority) * 18; // 1=72, 2=54, 3=36, 4=18
  
  // Time-based increase
  const timeElapsed = (currentTime.getTime() - alarm.timestamp.getTime()) / 60000; // minutes
  const timeBonus = Math.min(timeElapsed * 1.5, 25); // +1.5 per minute, max 25
  
  // Alarm type bonus
  const typeBonus = alarm.type === 'alarm' ? 10 : 0;
  
  // Escalation bonus
  const escalationBonus = alarm.escalated ? 8 : 0;
  
  return Math.min(Math.round(baseScore + timeBonus + typeBonus + escalationBonus), 100);
};

// Calculate response deadline
export const calculateResponseDeadline = (alarm: Alarm): Date => {
  const deadline = new Date(alarm.timestamp);
  deadline.setMinutes(deadline.getMinutes() + RESPONSE_TIME_LIMITS[alarm.priority]);
  return deadline;
};

// Check if alarm should be escalated
export const checkEscalation = (alarm: Alarm, currentTime: Date = new Date()): boolean => {
  if (alarm.acknowledged || alarm.escalated) return false;
  
  const deadline = alarm.responseDeadline || calculateResponseDeadline(alarm);
  return currentTime > deadline;
};

// Get escalated priority (increase by 1 level, min 1)
export const getEscalatedPriority = (currentPriority: AlarmPriority): AlarmPriority => {
  return Math.max(1, currentPriority - 1) as AlarmPriority;
};

// Sort alarms by priority, risk score, and time
export const sortAlarms = (alarms: Alarm[]): Alarm[] => {
  return [...alarms].sort((a, b) => {
    // 1. Priority (lower number = higher priority)
    if (a.priority !== b.priority) return a.priority - b.priority;
    
    // 2. Risk score (higher = more urgent)
    if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
    
    // 3. Time (older = more urgent)
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
};

// Group alarms by priority
export const groupAlarmsByPriority = (alarms: Alarm[]): Record<AlarmPriority, Alarm[]> => {
  const groups: Record<AlarmPriority, Alarm[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };
  
  alarms.forEach(alarm => {
    groups[alarm.priority].push(alarm);
  });
  
  // Sort within each group
  Object.keys(groups).forEach(key => {
    const priority = Number(key) as AlarmPriority;
    groups[priority].sort((a, b) => {
      if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  });
  
  return groups;
};

// Format remaining time until deadline
export const formatRemainingTime = (deadline: Date, currentTime: Date = new Date()): string => {
  const remaining = deadline.getTime() - currentTime.getTime();
  
  if (remaining <= 0) return '已超时';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}秒`;
};
