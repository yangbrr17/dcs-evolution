import { TagData, DataPoint, TagStatus, Alarm, ProcessArea } from '@/types/dcs';

// Generate random value within range
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Calculate status based on value and limits
const calculateStatus = (value: number, limits: TagData['limits']): TagStatus => {
  if (value >= limits.highAlarm || value <= limits.lowAlarm) {
    return 'alarm';
  }
  if (value >= limits.highWarning || value <= limits.lowWarning) {
    return 'warning';
  }
  return 'normal';
};

// Generate historical data points
const generateHistory = (baseValue: number, points: number = 30): DataPoint[] => {
  const history: DataPoint[] = [];
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
    const value = baseValue + randomInRange(-5, 5);
    const predicted = value + randomInRange(-2, 2);
    history.push({ timestamp, value, predicted });
  }
  
  return history;
};

// Initial mock tags for FCC unit - all tags across all areas
export const createInitialTags = (): TagData[] => [
  // 反应器区域
  {
    id: 'TI-101',
    name: 'TI-101',
    description: '反应器温度',
    unit: '°C',
    currentValue: 520,
    setpoint: 525,
    predictedValue: 522,
    limits: { highAlarm: 550, highWarning: 540, lowWarning: 500, lowAlarm: 490 },
    status: 'normal',
    position: { x: 35, y: 30 },
    history: generateHistory(520),
  },
  {
    id: 'PI-201',
    name: 'PI-201',
    description: '反应器压力',
    unit: 'kPa',
    currentValue: 180,
    setpoint: 175,
    predictedValue: 182,
    limits: { highAlarm: 220, highWarning: 200, lowWarning: 150, lowAlarm: 130 },
    status: 'normal',
    position: { x: 35, y: 50 },
    history: generateHistory(180),
  },
  {
    id: 'TI-103',
    name: 'TI-103',
    description: '提升管出口温度',
    unit: '°C',
    currentValue: 505,
    setpoint: 510,
    predictedValue: 508,
    limits: { highAlarm: 540, highWarning: 530, lowWarning: 480, lowAlarm: 470 },
    status: 'normal',
    position: { x: 55, y: 40 },
    history: generateHistory(505),
  },
  {
    id: 'FI-301',
    name: 'FI-301',
    description: '原料流量',
    unit: 't/h',
    currentValue: 85,
    setpoint: 90,
    predictedValue: 87,
    limits: { highAlarm: 110, highWarning: 100, lowWarning: 70, lowAlarm: 60 },
    status: 'normal',
    position: { x: 15, y: 65 },
    history: generateHistory(85),
  },
  // 再生器区域
  {
    id: 'TI-102',
    name: 'TI-102',
    description: '再生器温度',
    unit: '°C',
    currentValue: 680,
    setpoint: 670,
    predictedValue: 685,
    limits: { highAlarm: 720, highWarning: 700, lowWarning: 650, lowAlarm: 630 },
    status: 'normal',
    position: { x: 40, y: 25 },
    history: generateHistory(680),
  },
  {
    id: 'PI-202',
    name: 'PI-202',
    description: '再生器压力',
    unit: 'kPa',
    currentValue: 165,
    setpoint: 160,
    predictedValue: 168,
    limits: { highAlarm: 200, highWarning: 185, lowWarning: 140, lowAlarm: 120 },
    status: 'normal',
    position: { x: 40, y: 50 },
    history: generateHistory(165),
  },
  {
    id: 'AI-501',
    name: 'AI-501',
    description: '烟气CO含量',
    unit: 'ppm',
    currentValue: 120,
    setpoint: 100,
    predictedValue: 125,
    limits: { highAlarm: 200, highWarning: 150, lowWarning: 20, lowAlarm: 10 },
    status: 'normal',
    position: { x: 65, y: 35 },
    history: generateHistory(120),
  },
  // 分馏塔区域
  {
    id: 'LI-401',
    name: 'LI-401',
    description: '分馏塔液位',
    unit: '%',
    currentValue: 52,
    setpoint: 50,
    predictedValue: 53,
    limits: { highAlarm: 80, highWarning: 70, lowWarning: 30, lowAlarm: 20 },
    status: 'normal',
    position: { x: 30, y: 40 },
    history: generateHistory(52),
  },
  {
    id: 'TI-104',
    name: 'TI-104',
    description: '塔顶温度',
    unit: '°C',
    currentValue: 115,
    setpoint: 120,
    predictedValue: 117,
    limits: { highAlarm: 150, highWarning: 140, lowWarning: 100, lowAlarm: 90 },
    status: 'normal',
    position: { x: 30, y: 20 },
    history: generateHistory(115),
  },
  {
    id: 'TI-105',
    name: 'TI-105',
    description: '塔底温度',
    unit: '°C',
    currentValue: 345,
    setpoint: 350,
    predictedValue: 348,
    limits: { highAlarm: 380, highWarning: 370, lowWarning: 320, lowAlarm: 300 },
    status: 'normal',
    position: { x: 30, y: 70 },
    history: generateHistory(345),
  },
  {
    id: 'FI-302',
    name: 'FI-302',
    description: '回流流量',
    unit: 't/h',
    currentValue: 42,
    setpoint: 45,
    predictedValue: 43,
    limits: { highAlarm: 60, highWarning: 55, lowWarning: 35, lowAlarm: 30 },
    status: 'normal',
    position: { x: 55, y: 30 },
    history: generateHistory(42),
  },
];

// Process areas configuration
export const createProcessAreas = (): ProcessArea[] => [
  {
    id: 'overview',
    name: '系统总览',
    description: 'FCC装置全流程监控',
    imageUrl: null,
    tagIds: ['TI-101', 'TI-102', 'PI-201', 'FI-301', 'LI-401', 'TI-103'], // Key tags from all areas
  },
  {
    id: 'reactor',
    name: '反应器',
    description: '催化裂化反应区',
    imageUrl: null,
    tagIds: ['TI-101', 'PI-201', 'TI-103', 'FI-301'],
  },
  {
    id: 'regenerator',
    name: '再生器',
    description: '催化剂再生区',
    imageUrl: null,
    tagIds: ['TI-102', 'PI-202', 'AI-501'],
  },
  {
    id: 'fractionator',
    name: '分馏塔',
    description: '产品分馏系统',
    imageUrl: null,
    tagIds: ['LI-401', 'TI-104', 'TI-105', 'FI-302'],
  },
];

// Update tag with simulated real-time data
export const updateTagData = (tag: TagData): TagData => {
  // Simulate value changes (small random walk)
  const change = randomInRange(-2, 2);
  const newValue = Math.max(
    tag.limits.lowAlarm - 10,
    Math.min(tag.limits.highAlarm + 10, tag.currentValue + change)
  );
  
  // Calculate predicted value (trending towards setpoint with noise)
  const trendToSetpoint = (tag.setpoint - newValue) * 0.1;
  const predictedValue = newValue + trendToSetpoint + randomInRange(-1, 1);
  
  // Update history
  const newHistory = [...tag.history.slice(-29), {
    timestamp: new Date(),
    value: newValue,
    predicted: predictedValue,
  }];
  
  // Calculate new status
  const status = calculateStatus(newValue, tag.limits);
  
  return {
    ...tag,
    currentValue: Number(newValue.toFixed(1)),
    predictedValue: Number(predictedValue.toFixed(1)),
    status,
    history: newHistory,
  };
};

// Generate alarm from tag status change
export const generateAlarm = (tag: TagData, previousStatus: TagStatus): Alarm | null => {
  if (tag.status === previousStatus || tag.status === 'normal') {
    return null;
  }
  
  const isHigh = tag.currentValue > tag.setpoint;
  const limitType = isHigh ? 'High' : 'Low';
  
  return {
    id: `alarm-${Date.now()}-${tag.id}`,
    tagId: tag.id,
    tagName: tag.name,
    message: `${tag.description} ${limitType} ${tag.status === 'alarm' ? 'Alarm' : 'Warning'}: ${tag.currentValue}${tag.unit}`,
    type: tag.status === 'alarm' ? 'alarm' : 'warning',
    timestamp: new Date(),
    acknowledged: false,
  };
};
