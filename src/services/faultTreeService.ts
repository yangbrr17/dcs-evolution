// Fault Tree Service - 基于因果链的故障树配置
// 故障树使用有向图表示变量之间的贡献关系，与报警因果链相似

import { FaultTreeStructure } from '@/types/dcs';

// 默认故障树配置 - 每个区域的关键故障场景
const DEFAULT_FAULT_TREES: FaultTreeStructure[] = [
  // 反应器飞温故障树
  {
    id: 'ft-reactor-runaway',
    name: '反应器飞温',
    areaId: 'reactor',
    topEventTagId: 'TI-101', // 顶事件：反应器温度
    links: [
      { from: 'FI-101', to: 'TI-101', contribution: 65, description: '进料流量影响反应温度' },
      { from: 'PI-101', to: 'TI-101', contribution: 35, description: '压力影响反应温度' },
      { from: 'TI-101', to: 'TI-102', contribution: 80, description: '反应器温度影响提升管出口温度' },
      { from: 'TI-102', to: 'TI-103', contribution: 70, description: '提升管温度影响沉降器温度' },
      { from: 'FI-101', to: 'PI-101', contribution: 45, description: '进料流量影响反应器压力' },
      { from: 'LI-101', to: 'TI-101', contribution: 25, description: '液位影响反应温度' },
    ],
  },
  
  // 再生器超温故障树
  {
    id: 'ft-regenerator-overtemp',
    name: '再生器超温',
    areaId: 'regenerator',
    topEventTagId: 'TI-201', // 顶事件：密相温度
    links: [
      { from: 'FI-201', to: 'TI-201', contribution: 75, description: '主风流量影响密相温度' },
      { from: 'AI-201', to: 'TI-201', contribution: 40, description: 'CO含量影响燃烧温度' },
      { from: 'TI-201', to: 'TI-202', contribution: 85, description: '密相温度影响稀相温度' },
      { from: 'FI-201', to: 'AI-201', contribution: 50, description: '主风流量影响CO含量' },
      { from: 'TI-201', to: 'AI-202', contribution: 60, description: '密相温度影响O2含量' },
      { from: 'AI-201', to: 'AI-202', contribution: 90, description: 'CO与O2相关' },
      { from: 'FI-201', to: 'PI-201', contribution: 55, description: '主风流量影响压力' },
    ],
  },
  
  // 烟气O2异常故障树 (AI-202)
  {
    id: 'ft-flue-gas-o2',
    name: '烟气O2异常',
    areaId: 'regenerator',
    topEventTagId: 'AI-202', // 顶事件：烟气O2含量
    links: [
      { from: 'AI-201', to: 'AI-202', contribution: 90, description: 'CO燃烧消耗O2' },
      { from: 'TI-201', to: 'AI-202', contribution: 60, description: '温度影响燃烧效率' },
      { from: 'FI-201', to: 'AI-201', contribution: 50, description: '主风流量决定CO生成' },
      { from: 'TI-201', to: 'AI-201', contribution: 45, description: '温度影响CO生成' },
      { from: 'FI-201', to: 'TI-201', contribution: 75, description: '主风流量影响燃烧温度' },
    ],
  },
  
  // 分馏塔异常故障树
  {
    id: 'ft-fractionator-upset',
    name: '分馏塔温度异常',
    areaId: 'fractionator',
    topEventTagId: 'TI-301', // 顶事件：塔顶温度
    links: [
      { from: 'FI-301', to: 'TI-301', contribution: 55, description: '回流流量影响塔顶温度' },
      { from: 'TI-302', to: 'TI-301', contribution: 70, description: '塔中温度影响塔顶温度' },
      { from: 'TI-303', to: 'TI-302', contribution: 75, description: '塔底温度影响塔中温度' },
      { from: 'LI-301', to: 'TI-303', contribution: 40, description: '液位影响塔底温度' },
      { from: 'FI-302', to: 'TI-303', contribution: 35, description: '柴油出流量影响塔底温度' },
      { from: 'TI-301', to: 'PI-301', contribution: 60, description: '塔顶温度影响塔顶压力' },
    ],
  },
  
  // 系统总览 - 综合故障树
  {
    id: 'ft-overview-integrated',
    name: '装置综合安全',
    areaId: 'overview',
    topEventTagId: 'TI-101', // 顶事件：反应器温度（核心变量）
    links: [
      // 反应区
      { from: 'FI-101', to: 'TI-101', contribution: 65, description: '进料流量→反应温度' },
      { from: 'PI-101', to: 'TI-101', contribution: 35, description: '反应压力→反应温度' },
      // 再生区影响反应区
      { from: 'TI-201', to: 'TI-101', contribution: 30, description: '再生温度→反应温度(催化剂循环)' },
      // 再生区
      { from: 'FI-201', to: 'TI-201', contribution: 75, description: '主风流量→再生温度' },
      { from: 'AI-201', to: 'AI-202', contribution: 90, description: 'CO含量→O2含量' },
      // 分馏区
      { from: 'TI-101', to: 'TI-303', contribution: 50, description: '反应温度→塔底温度' },
      { from: 'TI-303', to: 'TI-301', contribution: 65, description: '塔底温度→塔顶温度' },
    ],
  },
];

let currentFaultTrees: FaultTreeStructure[] = [...DEFAULT_FAULT_TREES];

// 获取指定区域的故障树配置
export function getFaultTreesForArea(areaId: string): FaultTreeStructure[] {
  return currentFaultTrees.filter(ft => ft.areaId === areaId);
}

// 获取所有故障树
export function getAllFaultTrees(): FaultTreeStructure[] {
  return currentFaultTrees;
}

// 根据ID获取故障树
export function getFaultTreeById(id: string): FaultTreeStructure | undefined {
  return currentFaultTrees.find(ft => ft.id === id);
}

// 获取故障树中涉及的所有tagId
export function getFaultTreeTagIds(faultTree: FaultTreeStructure): string[] {
  const tagIds = new Set<string>();
  tagIds.add(faultTree.topEventTagId);
  faultTree.links.forEach(link => {
    tagIds.add(link.from);
    tagIds.add(link.to);
  });
  return Array.from(tagIds);
}

// 重置为默认配置
export function resetFaultTrees(): void {
  currentFaultTrees = [...DEFAULT_FAULT_TREES];
}

export { DEFAULT_FAULT_TREES };
