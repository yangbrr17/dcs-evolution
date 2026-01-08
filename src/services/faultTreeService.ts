import { FaultTreeStructure } from '@/types/dcs';

// Preset fault tree structures with DCS variables
export const DEFAULT_FAULT_TREES: FaultTreeStructure[] = [
  // Reactor runaway fault tree
  {
    id: 'ft-reactor-runaway',
    name: '反应器飞温故障树',
    areaId: 'reactor',
    topEventId: 'top-1',
    nodes: [
      { id: 'top-1', type: 'or', label: '反应器飞温', tagId: 'TI-101', children: ['g1', 'g2'] },
      { id: 'g1', type: 'and', label: '进料异常导致飞温', children: ['e1', 'e2'] },
      { id: 'g2', type: 'or', label: '热量移除不足', children: ['e3', 'e4', 'e5'] },
      { id: 'e1', type: 'basic_event', label: '原料油流量过大', tagId: 'FI-101' },
      { id: 'e2', type: 'basic_event', label: '反应器压力异常', tagId: 'PI-101' },
      { id: 'e3', type: 'basic_event', label: '提升管温度过高', tagId: 'TI-102' },
      { id: 'e4', type: 'basic_event', label: '沉降器温度异常', tagId: 'TI-103' },
      { id: 'e5', type: 'basic_event', label: '液位控制失效', tagId: 'LI-101' },
    ]
  },
  // Regenerator overtemp fault tree
  {
    id: 'ft-regenerator-overtemp',
    name: '再生器超温故障树',
    areaId: 'regenerator',
    topEventId: 'top-regen',
    nodes: [
      { id: 'top-regen', type: 'or', label: '再生器超温', tagId: 'TI-201', children: ['g-r1', 'g-r2'] },
      { id: 'g-r1', type: 'and', label: '燃烧失控', children: ['e-r1', 'e-r2'] },
      { id: 'g-r2', type: 'or', label: '冷却不足', children: ['e-r3', 'e-r4'] },
      { id: 'e-r1', type: 'basic_event', label: '密相温度过高', tagId: 'TI-201' },
      { id: 'e-r2', type: 'basic_event', label: '主风流量异常', tagId: 'FI-201' },
      { id: 'e-r3', type: 'basic_event', label: '稀相温度过高', tagId: 'TI-202' },
      { id: 'e-r4', type: 'basic_event', label: '压力异常', tagId: 'PI-201' },
    ]
  },
  // Fractionator fault tree
  {
    id: 'ft-fractionator',
    name: '分馏塔异常故障树',
    areaId: 'fractionator',
    topEventId: 'top-frac',
    nodes: [
      { id: 'top-frac', type: 'or', label: '分馏塔异常', tagId: 'TI-301', children: ['g-f1', 'g-f2'] },
      { id: 'g-f1', type: 'and', label: '温度分布异常', children: ['e-f1', 'e-f2', 'e-f3'] },
      { id: 'g-f2', type: 'or', label: '物料平衡失调', children: ['e-f4', 'e-f5'] },
      { id: 'e-f1', type: 'basic_event', label: '塔顶温度异常', tagId: 'TI-301' },
      { id: 'e-f2', type: 'basic_event', label: '塔中温度异常', tagId: 'TI-302' },
      { id: 'e-f3', type: 'basic_event', label: '塔底温度异常', tagId: 'TI-303' },
      { id: 'e-f4', type: 'basic_event', label: '回流流量不足', tagId: 'FI-301' },
      { id: 'e-f5', type: 'basic_event', label: '液位异常', tagId: 'LI-301' },
    ]
  },
  // Overview - combined critical events
  {
    id: 'ft-overview',
    name: '系统关键故障树',
    areaId: 'overview',
    topEventId: 'top-sys',
    nodes: [
      { id: 'top-sys', type: 'or', label: '系统重大事故', children: ['g-sys1', 'g-sys2', 'g-sys3'] },
      { id: 'g-sys1', type: 'basic_event', label: '反应器飞温', tagId: 'TI-101' },
      { id: 'g-sys2', type: 'basic_event', label: '再生器超温', tagId: 'TI-201' },
      { id: 'g-sys3', type: 'basic_event', label: '分馏塔异常', tagId: 'TI-301' },
    ]
  }
];

// Get fault trees for a specific area
export const getFaultTreesForArea = (areaId: string): FaultTreeStructure[] => {
  return DEFAULT_FAULT_TREES.filter(ft => ft.areaId === areaId);
};

// Get a specific fault tree by ID
export const getFaultTreeById = (id: string): FaultTreeStructure | undefined => {
  return DEFAULT_FAULT_TREES.find(ft => ft.id === id);
};
