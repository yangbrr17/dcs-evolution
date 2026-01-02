import { TagData, DataPoint, TagStatus, Alarm } from '@/types/dcs';

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

// Initial mock tags for FCC unit
export const createInitialTags = (): TagData[] => [
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
    position: { x: 25, y: 30 },
    history: generateHistory(520),
  },
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
    position: { x: 60, y: 25 },
    history: generateHistory(680),
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
    position: { x: 30, y: 50 },
    history: generateHistory(180),
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
    position: { x: 75, y: 55 },
    history: generateHistory(52),
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
    position: { x: 45, y: 40 },
    history: generateHistory(505),
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
