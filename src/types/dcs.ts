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

// Causality types for Root Cause Analysis
export interface CausalLink {
  from: string;         // Cause variable ID
  to: string;           // Effect variable ID
  weight?: number;      // Optional influence weight
  contribution?: number; // Contribution percentage (0-100)
}

export interface CausalityGraph {
  version: string;
  links: CausalLink[];
}

// Fault Tree types
export interface FaultTreeConfig {
  id: string;
  name: string;
  imageUrl: string | null;
  topEventTagId?: string;
  areaId: string;
  position: { x: number; y: number };
}

// Bow-Tie types
export type BowTieEventType = 'threat' | 'barrier' | 'top_event' | 'recovery' | 'consequence';

export interface BowTieEvent {
  id: string;
  type: BowTieEventType;
  label: string;
  tagId?: string;
  position: { x: number; y: number };
}

export interface BowTieLink {
  from: string;
  to: string;
}

export interface BowTieConfig {
  id: string;
  name: string;
  areaId: string;
  topEventId: string;
  events: BowTieEvent[];
  links: BowTieLink[];
}

// Safety Analysis config
export interface SafetyAnalysisConfig {
  faultTrees: FaultTreeConfig[];
  bowTies: BowTieConfig[];
}
