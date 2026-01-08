import { BowTieConfig } from '@/types/dcs';

// Preset Bow-Tie configurations for each area
export const DEFAULT_BOWTIES: BowTieConfig[] = [
  // Reactor runaway bow-tie
  {
    id: 'bt-reactor-runaway',
    name: '反应器飞温事故',
    areaId: 'reactor',
    topEventId: 'te-reactor',
    events: [
      // Threats (left side)
      { id: 't1', type: 'threat', label: '进料流量过大', tagId: 'FI-101', position: { x: 8, y: 20 } },
      { id: 't2', type: 'threat', label: '催化剂活性过高', position: { x: 8, y: 40 } },
      { id: 't3', type: 'threat', label: '冷却系统故障', position: { x: 8, y: 60 } },
      { id: 't4', type: 'threat', label: '仪表失灵', tagId: 'TI-101', position: { x: 8, y: 80 } },
      // Prevention barriers
      { id: 'b1', type: 'barrier', label: '流量控制阀', position: { x: 28, y: 25 } },
      { id: 'b2', type: 'barrier', label: '温度联锁', position: { x: 28, y: 50 } },
      { id: 'b3', type: 'barrier', label: '压力保护', tagId: 'PI-101', position: { x: 28, y: 75 } },
      // Top event (center)
      { id: 'te-reactor', type: 'top_event', label: '反应器飞温', tagId: 'TI-101', position: { x: 50, y: 50 } },
      // Recovery measures
      { id: 'r1', type: 'recovery', label: '紧急停车', position: { x: 72, y: 30 } },
      { id: 'r2', type: 'recovery', label: '紧急卸压', position: { x: 72, y: 50 } },
      { id: 'r3', type: 'recovery', label: '事故喷淋', position: { x: 72, y: 70 } },
      // Consequences (right side)
      { id: 'c1', type: 'consequence', label: '设备损坏', position: { x: 92, y: 25 } },
      { id: 'c2', type: 'consequence', label: '人员伤亡', position: { x: 92, y: 50 } },
      { id: 'c3', type: 'consequence', label: '环境污染', position: { x: 92, y: 75 } },
    ],
    links: [
      { from: 't1', to: 'b1' }, { from: 't2', to: 'b2' }, { from: 't3', to: 'b2' }, { from: 't4', to: 'b3' },
      { from: 'b1', to: 'te-reactor' }, { from: 'b2', to: 'te-reactor' }, { from: 'b3', to: 'te-reactor' },
      { from: 'te-reactor', to: 'r1' }, { from: 'te-reactor', to: 'r2' }, { from: 'te-reactor', to: 'r3' },
      { from: 'r1', to: 'c1' }, { from: 'r2', to: 'c2' }, { from: 'r3', to: 'c3' },
    ]
  },
  // Regenerator fire bow-tie
  {
    id: 'bt-regenerator-fire',
    name: '再生器着火事故',
    areaId: 'regenerator',
    topEventId: 'te-regen',
    events: [
      // Threats
      { id: 't-r1', type: 'threat', label: '催化剂积碳过多', position: { x: 8, y: 20 } },
      { id: 't-r2', type: 'threat', label: '主风量过大', tagId: 'FI-201', position: { x: 8, y: 40 } },
      { id: 't-r3', type: 'threat', label: '温度控制失效', tagId: 'TI-201', position: { x: 8, y: 60 } },
      { id: 't-r4', type: 'threat', label: '压力异常', tagId: 'PI-201', position: { x: 8, y: 80 } },
      // Barriers
      { id: 'b-r1', type: 'barrier', label: '主风控制阀', position: { x: 28, y: 30 } },
      { id: 'b-r2', type: 'barrier', label: '温度报警', position: { x: 28, y: 55 } },
      { id: 'b-r3', type: 'barrier', label: '压力联锁', position: { x: 28, y: 80 } },
      // Top event
      { id: 'te-regen', type: 'top_event', label: '再生器超温', tagId: 'TI-201', position: { x: 50, y: 50 } },
      // Recovery
      { id: 'r-r1', type: 'recovery', label: '紧急切风', position: { x: 72, y: 35 } },
      { id: 'r-r2', type: 'recovery', label: '蒸汽灭火', position: { x: 72, y: 65 } },
      // Consequences
      { id: 'c-r1', type: 'consequence', label: '催化剂烧结', position: { x: 92, y: 25 } },
      { id: 'c-r2', type: 'consequence', label: '设备烧穿', position: { x: 92, y: 50 } },
      { id: 'c-r3', type: 'consequence', label: '火灾爆炸', position: { x: 92, y: 75 } },
    ],
    links: [
      { from: 't-r1', to: 'b-r1' }, { from: 't-r2', to: 'b-r1' }, { from: 't-r3', to: 'b-r2' }, { from: 't-r4', to: 'b-r3' },
      { from: 'b-r1', to: 'te-regen' }, { from: 'b-r2', to: 'te-regen' }, { from: 'b-r3', to: 'te-regen' },
      { from: 'te-regen', to: 'r-r1' }, { from: 'te-regen', to: 'r-r2' },
      { from: 'r-r1', to: 'c-r1' }, { from: 'r-r2', to: 'c-r2' }, { from: 'r-r2', to: 'c-r3' },
    ]
  },
  // Fractionator flood bow-tie
  {
    id: 'bt-fractionator-flood',
    name: '分馏塔液泛事故',
    areaId: 'fractionator',
    topEventId: 'te-frac',
    events: [
      // Threats
      { id: 't-f1', type: 'threat', label: '回流量过大', tagId: 'FI-301', position: { x: 8, y: 25 } },
      { id: 't-f2', type: 'threat', label: '塔顶温度过低', tagId: 'TI-301', position: { x: 8, y: 50 } },
      { id: 't-f3', type: 'threat', label: '进料过多', position: { x: 8, y: 75 } },
      // Barriers
      { id: 'b-f1', type: 'barrier', label: '回流控制阀', position: { x: 28, y: 35 } },
      { id: 'b-f2', type: 'barrier', label: '温度联锁', position: { x: 28, y: 65 } },
      // Top event
      { id: 'te-frac', type: 'top_event', label: '分馏塔液泛', tagId: 'LI-301', position: { x: 50, y: 50 } },
      // Recovery
      { id: 'r-f1', type: 'recovery', label: '紧急减进料', position: { x: 72, y: 35 } },
      { id: 'r-f2', type: 'recovery', label: '增加塔底抽出', position: { x: 72, y: 65 } },
      // Consequences
      { id: 'c-f1', type: 'consequence', label: '产品不合格', position: { x: 92, y: 30 } },
      { id: 'c-f2', type: 'consequence', label: '设备损坏', position: { x: 92, y: 55 } },
      { id: 'c-f3', type: 'consequence', label: '生产中断', position: { x: 92, y: 80 } },
    ],
    links: [
      { from: 't-f1', to: 'b-f1' }, { from: 't-f2', to: 'b-f2' }, { from: 't-f3', to: 'b-f1' },
      { from: 'b-f1', to: 'te-frac' }, { from: 'b-f2', to: 'te-frac' },
      { from: 'te-frac', to: 'r-f1' }, { from: 'te-frac', to: 'r-f2' },
      { from: 'r-f1', to: 'c-f1' }, { from: 'r-f2', to: 'c-f2' }, { from: 'r-f2', to: 'c-f3' },
    ]
  },
  // Overview - combined critical events
  {
    id: 'bt-overview',
    name: '装置综合事故',
    areaId: 'overview',
    topEventId: 'te-overview',
    events: [
      // Threats from each area
      { id: 't-o1', type: 'threat', label: '反应器异常', tagId: 'TI-101', position: { x: 8, y: 25 } },
      { id: 't-o2', type: 'threat', label: '再生器异常', tagId: 'TI-201', position: { x: 8, y: 50 } },
      { id: 't-o3', type: 'threat', label: '分馏塔异常', tagId: 'TI-301', position: { x: 8, y: 75 } },
      // Barriers
      { id: 'b-o1', type: 'barrier', label: 'DCS监控', position: { x: 28, y: 35 } },
      { id: 'b-o2', type: 'barrier', label: 'SIS联锁', position: { x: 28, y: 65 } },
      // Top event
      { id: 'te-overview', type: 'top_event', label: '装置重大事故', position: { x: 50, y: 50 } },
      // Recovery
      { id: 'r-o1', type: 'recovery', label: '全厂紧急停车', position: { x: 72, y: 40 } },
      { id: 'r-o2', type: 'recovery', label: '应急响应', position: { x: 72, y: 60 } },
      // Consequences
      { id: 'c-o1', type: 'consequence', label: '重大财产损失', position: { x: 92, y: 30 } },
      { id: 'c-o2', type: 'consequence', label: '人员伤亡', position: { x: 92, y: 55 } },
      { id: 'c-o3', type: 'consequence', label: '环境灾害', position: { x: 92, y: 80 } },
    ],
    links: [
      { from: 't-o1', to: 'b-o1' }, { from: 't-o2', to: 'b-o1' }, { from: 't-o3', to: 'b-o2' },
      { from: 'b-o1', to: 'te-overview' }, { from: 'b-o2', to: 'te-overview' },
      { from: 'te-overview', to: 'r-o1' }, { from: 'te-overview', to: 'r-o2' },
      { from: 'r-o1', to: 'c-o1' }, { from: 'r-o2', to: 'c-o2' }, { from: 'r-o2', to: 'c-o3' },
    ]
  }
];

// Get bow-ties for a specific area
export const getBowTiesForArea = (areaId: string): BowTieConfig[] => {
  return DEFAULT_BOWTIES.filter(bt => bt.areaId === areaId);
};

// Get a specific bow-tie by ID
export const getBowTieById = (id: string): BowTieConfig | undefined => {
  return DEFAULT_BOWTIES.find(bt => bt.id === id);
};
