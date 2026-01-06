// DCS Monitoring System Types

export type TagStatus = 'normal' | 'warning' | 'alarm';

export interface TagPosition {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface TagLimits {
  highAlarm: number;
  highWarning: number;
  lowWarning: number;
  lowAlarm: number;
}

export interface TagData {
  id: string;
  name: string;
  description: string;
  unit: string;
  currentValue: number;
  setpoint: number;
  predictedValue: number;
  limits: TagLimits;
  status: TagStatus;
  position: TagPosition;
  history: DataPoint[];
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  predicted?: number;
}

export interface Alarm {
  id: string;
  tagId: string;
  tagName: string;
  message: string;
  type: 'warning' | 'alarm';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface ProcessImage {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface ProcessArea {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  tagIds: string[]; // Tags that belong to this area
}

export interface DCSConfig {
  areas: ProcessArea[];
  currentAreaId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
}
