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

// Fault Tree types - 基于有向图的因果链结构
export interface FaultTreeLink {
  from: string;         // 源变量tagId
  to: string;           // 目标变量tagId
  contribution: number; // 贡献度 0-100
  description?: string; // 关系描述
}

export interface FaultTreeStructure {
  id: string;
  name: string;
  areaId: string;
  topEventTagId: string;   // 顶事件对应的tagId
  links: FaultTreeLink[];  // 因果链接列表
}

// Bow-Tie types - Industrial style matching reference diagram
export type BowTieEventType = 
  | 'hazard'            // 顶部危害框（黄黑条纹）
  | 'threat'            // 左侧威胁来源（蓝色边框）
  | 'preventive_action' // 预防措施（白色卡片）
  | 'barrier'           // 屏障（3D圆柱）
  | 'top_event'         // 中心起始事件（橙色圆形）
  | 'mitigating_action' // 缓解措施（白色卡片）
  | 'consequence';      // 右侧后果（红色边框）

export interface BowTieEvent {
  id: string;
  type: BowTieEventType;
  label: string;
  description?: string;  // 详细描述
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
  faultTrees: FaultTreeStructure[];
  bowTies: BowTieConfig[];
}
