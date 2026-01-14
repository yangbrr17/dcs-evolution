import { BowTieConfig } from '@/types/dcs';

// Preset Bow-Tie configurations for each area - Industrial style
export const DEFAULT_BOWTIES: BowTieConfig[] = [
  // Reactor runaway bow-tie
  {
    id: 'bt-reactor-runaway',
    name: '反应器飞温事故',
    areaId: 'reactor',
    topEventId: 'te-reactor',
    events: [
      // Hazard (top center) - 黄黑条纹警告框
      { id: 'hazard', type: 'hazard', label: '高温高压反应', description: '催化裂化反应系统', position: { x: 50, y: 5 } },
      
      // Threats (left side) - 蓝色边框
      { id: 't1', type: 'threat', label: '进料流量过大', description: '原料油流量超过设计值', tagId: 'FI-101', position: { x: 5, y: 25 } },
      { id: 't2', type: 'threat', label: '催化剂活性过高', description: '新鲜剂加入过快', position: { x: 5, y: 45 } },
      { id: 't3', type: 'threat', label: '冷却系统故障', description: '冷却水供应中断', position: { x: 5, y: 65 } },
      { id: 't4', type: 'threat', label: '仪表失灵', description: '温度测量偏差大', tagId: 'TI-101', position: { x: 5, y: 85 } },
      
      // Preventive actions - 白色卡片
      { id: 'pa1', type: 'preventive_action', label: '流量控制程序', description: '进料流量自动控制', position: { x: 20, y: 25 } },
      { id: 'pa2', type: 'preventive_action', label: '催化剂管理', description: '按规程添加新鲜剂', position: { x: 20, y: 45 } },
      { id: 'pa3', type: 'preventive_action', label: '冷却水巡检', description: '每班检查冷却系统', position: { x: 20, y: 65 } },
      { id: 'pa4', type: 'preventive_action', label: '仪表校验', description: '定期校验关键仪表', position: { x: 20, y: 85 } },
      
      // Left barriers - 3D圆柱
      { id: 'b1', type: 'barrier', label: '流量联锁', position: { x: 35, y: 35 } },
      { id: 'b2', type: 'barrier', label: '温度联锁', tagId: 'TI-101', position: { x: 35, y: 65 } },
      
      // Top event (center) - 橙色圆形
      { id: 'te-reactor', type: 'top_event', label: '反应器飞温', description: '温度失控超过安全限值', tagId: 'TI-101', position: { x: 50, y: 50 } },
      
      // Right barriers - 3D圆柱
      { id: 'b3', type: 'barrier', label: '紧急停车', position: { x: 65, y: 35 } },
      { id: 'b4', type: 'barrier', label: '安全阀', tagId: 'PI-101', position: { x: 65, y: 65 } },
      
      // Mitigating actions - 白色卡片
      { id: 'ma1', type: 'mitigating_action', label: '切断进料', description: '关闭原料油进料阀', position: { x: 80, y: 25 } },
      { id: 'ma2', type: 'mitigating_action', label: '紧急卸压', description: '开启紧急放空系统', position: { x: 80, y: 45 } },
      { id: 'ma3', type: 'mitigating_action', label: '事故喷淋', description: '启动消防水系统', position: { x: 80, y: 65 } },
      { id: 'ma4', type: 'mitigating_action', label: '人员疏散', description: '按预案撤离现场', position: { x: 80, y: 85 } },
      
      // Consequences (right side) - 红色边框
      { id: 'c1', type: 'consequence', label: '设备损坏', description: '反应器及管道损坏', position: { x: 95, y: 30 }, probability: 2.5e-4, severity: 'high', financialImpact: '500-2000万' },
      { id: 'c2', type: 'consequence', label: '人员伤亡', description: '现场人员受伤或死亡', position: { x: 95, y: 55 }, probability: 1.0e-5, severity: 'catastrophic', financialImpact: '不可估量' },
      { id: 'c3', type: 'consequence', label: '环境污染', description: '油气泄漏造成污染', position: { x: 95, y: 80 }, probability: 5.0e-5, severity: 'medium', financialImpact: '100-500万' },
    ],
    links: [
      // Hazard to top event
      { from: 'hazard', to: 'te-reactor' },
      // Threats to preventive actions
      { from: 't1', to: 'pa1' }, { from: 't2', to: 'pa2' }, { from: 't3', to: 'pa3' }, { from: 't4', to: 'pa4' },
      // Preventive actions to barriers
      { from: 'pa1', to: 'b1' }, { from: 'pa2', to: 'b1' }, { from: 'pa3', to: 'b2' }, { from: 'pa4', to: 'b2' },
      // Barriers to top event
      { from: 'b1', to: 'te-reactor' }, { from: 'b2', to: 'te-reactor' },
      // Top event to right barriers
      { from: 'te-reactor', to: 'b3' }, { from: 'te-reactor', to: 'b4' },
      // Right barriers to mitigating actions
      { from: 'b3', to: 'ma1' }, { from: 'b3', to: 'ma2' }, { from: 'b4', to: 'ma3' }, { from: 'b4', to: 'ma4' },
      // Mitigating actions to consequences
      { from: 'ma1', to: 'c1' }, { from: 'ma2', to: 'c1' }, { from: 'ma3', to: 'c2' }, { from: 'ma4', to: 'c3' },
    ]
  },
  // Regenerator fire bow-tie
  {
    id: 'bt-regenerator-fire',
    name: '再生器着火事故',
    areaId: 'regenerator',
    topEventId: 'te-regen',
    events: [
      // Hazard
      { id: 'hazard-r', type: 'hazard', label: '催化剂再生', description: '高温燃烧再生系统', position: { x: 50, y: 5 } },
      
      // Threats
      { id: 't-r1', type: 'threat', label: '催化剂积碳过多', description: '再生周期过长', position: { x: 5, y: 30 } },
      { id: 't-r2', type: 'threat', label: '主风量过大', description: '风量控制失效', tagId: 'FI-201', position: { x: 5, y: 55 } },
      { id: 't-r3', type: 'threat', label: '温度控制失效', description: '温度测点故障', tagId: 'TI-201', position: { x: 5, y: 80 } },
      
      // Preventive actions
      { id: 'pa-r1', type: 'preventive_action', label: '积碳监测', description: '定期检测催化剂', position: { x: 20, y: 30 } },
      { id: 'pa-r2', type: 'preventive_action', label: '风量控制', description: '主风量程序控制', position: { x: 20, y: 55 } },
      { id: 'pa-r3', type: 'preventive_action', label: '温度校验', description: '多点温度监测', position: { x: 20, y: 80 } },
      
      // Left barriers
      { id: 'b-r1', type: 'barrier', label: '主风联锁', position: { x: 35, y: 42 } },
      { id: 'b-r2', type: 'barrier', label: '温度联锁', position: { x: 35, y: 68 } },
      
      // Top event
      { id: 'te-regen', type: 'top_event', label: '再生器超温', description: '再生器温度失控', tagId: 'TI-201', position: { x: 50, y: 50 } },
      
      // Right barriers
      { id: 'b-r3', type: 'barrier', label: '紧急切风', position: { x: 65, y: 42 } },
      { id: 'b-r4', type: 'barrier', label: '蒸汽灭火', position: { x: 65, y: 68 } },
      
      // Mitigating actions
      { id: 'ma-r1', type: 'mitigating_action', label: '停止再生', description: '切断主风供应', position: { x: 80, y: 30 } },
      { id: 'ma-r2', type: 'mitigating_action', label: '蒸汽吹扫', description: '注入消防蒸汽', position: { x: 80, y: 55 } },
      { id: 'ma-r3', type: 'mitigating_action', label: '人员撤离', description: '启动应急预案', position: { x: 80, y: 80 } },
      
      // Consequences
      { id: 'c-r1', type: 'consequence', label: '催化剂烧结', description: '催化剂永久失活', position: { x: 95, y: 30 }, probability: 3.0e-4, severity: 'medium', financialImpact: '200-800万' },
      { id: 'c-r2', type: 'consequence', label: '设备烧穿', description: '再生器壳体损坏', position: { x: 95, y: 55 }, probability: 8.0e-5, severity: 'high', financialImpact: '1000-3000万' },
      { id: 'c-r3', type: 'consequence', label: '火灾爆炸', description: '造成重大事故', position: { x: 95, y: 80 }, probability: 2.0e-5, severity: 'catastrophic', financialImpact: '5000万+' },
    ],
    links: [
      { from: 'hazard-r', to: 'te-regen' },
      { from: 't-r1', to: 'pa-r1' }, { from: 't-r2', to: 'pa-r2' }, { from: 't-r3', to: 'pa-r3' },
      { from: 'pa-r1', to: 'b-r1' }, { from: 'pa-r2', to: 'b-r1' }, { from: 'pa-r3', to: 'b-r2' },
      { from: 'b-r1', to: 'te-regen' }, { from: 'b-r2', to: 'te-regen' },
      { from: 'te-regen', to: 'b-r3' }, { from: 'te-regen', to: 'b-r4' },
      { from: 'b-r3', to: 'ma-r1' }, { from: 'b-r4', to: 'ma-r2' }, { from: 'b-r4', to: 'ma-r3' },
      { from: 'ma-r1', to: 'c-r1' }, { from: 'ma-r2', to: 'c-r2' }, { from: 'ma-r3', to: 'c-r3' },
    ]
  },
  // Fractionator flood bow-tie
  {
    id: 'bt-fractionator-flood',
    name: '分馏塔液泛事故',
    areaId: 'fractionator',
    topEventId: 'te-frac',
    events: [
      // Hazard
      { id: 'hazard-f', type: 'hazard', label: '分馏操作', description: '油气分离精馏系统', position: { x: 50, y: 5 } },
      
      // Threats
      { id: 't-f1', type: 'threat', label: '回流量过大', description: '回流阀开度过大', tagId: 'FI-301', position: { x: 5, y: 30 } },
      { id: 't-f2', type: 'threat', label: '塔顶温度过低', description: '冷却过度', tagId: 'TI-301', position: { x: 5, y: 55 } },
      { id: 't-f3', type: 'threat', label: '进料过多', description: '进料量超设计', position: { x: 5, y: 80 } },
      
      // Preventive actions
      { id: 'pa-f1', type: 'preventive_action', label: '回流控制', description: '自动调节回流量', position: { x: 20, y: 30 } },
      { id: 'pa-f2', type: 'preventive_action', label: '温度监控', description: '塔顶温度控制', position: { x: 20, y: 55 } },
      { id: 'pa-f3', type: 'preventive_action', label: '进料平衡', description: '与上游协调进料', position: { x: 20, y: 80 } },
      
      // Left barriers
      { id: 'b-f1', type: 'barrier', label: '液位联锁', position: { x: 35, y: 42 } },
      { id: 'b-f2', type: 'barrier', label: '压差报警', position: { x: 35, y: 68 } },
      
      // Top event
      { id: 'te-frac', type: 'top_event', label: '分馏塔液泛', description: '塔内液体淹没塔盘', tagId: 'LI-301', position: { x: 50, y: 50 } },
      
      // Right barriers
      { id: 'b-f3', type: 'barrier', label: '减进料', position: { x: 65, y: 42 } },
      { id: 'b-f4', type: 'barrier', label: '增抽出', position: { x: 65, y: 68 } },
      
      // Mitigating actions
      { id: 'ma-f1', type: 'mitigating_action', label: '紧急减负', description: '降低处理量', position: { x: 80, y: 30 } },
      { id: 'ma-f2', type: 'mitigating_action', label: '增加抽出', description: '加大塔底出料', position: { x: 80, y: 55 } },
      { id: 'ma-f3', type: 'mitigating_action', label: '暂停进料', description: '切断上游来料', position: { x: 80, y: 80 } },
      
      // Consequences
      { id: 'c-f1', type: 'consequence', label: '产品不合格', description: '分离效率下降', position: { x: 95, y: 30 }, probability: 5.0e-3, severity: 'low', financialImpact: '50-200万' },
      { id: 'c-f2', type: 'consequence', label: '设备损坏', description: '塔盘冲坏变形', position: { x: 95, y: 55 }, probability: 1.0e-4, severity: 'medium', financialImpact: '200-500万' },
      { id: 'c-f3', type: 'consequence', label: '生产中断', description: '装置被迫停工', position: { x: 95, y: 80 }, probability: 2.0e-4, severity: 'medium', financialImpact: '300-800万' },
    ],
    links: [
      { from: 'hazard-f', to: 'te-frac' },
      { from: 't-f1', to: 'pa-f1' }, { from: 't-f2', to: 'pa-f2' }, { from: 't-f3', to: 'pa-f3' },
      { from: 'pa-f1', to: 'b-f1' }, { from: 'pa-f2', to: 'b-f2' }, { from: 'pa-f3', to: 'b-f1' },
      { from: 'b-f1', to: 'te-frac' }, { from: 'b-f2', to: 'te-frac' },
      { from: 'te-frac', to: 'b-f3' }, { from: 'te-frac', to: 'b-f4' },
      { from: 'b-f3', to: 'ma-f1' }, { from: 'b-f4', to: 'ma-f2' }, { from: 'b-f4', to: 'ma-f3' },
      { from: 'ma-f1', to: 'c-f1' }, { from: 'ma-f2', to: 'c-f2' }, { from: 'ma-f3', to: 'c-f3' },
    ]
  },
  // Overview - combined critical events
  {
    id: 'bt-overview',
    name: '装置综合事故',
    areaId: 'overview',
    topEventId: 'te-overview',
    events: [
      // Hazard
      { id: 'hazard-o', type: 'hazard', label: '催化裂化装置', description: '全装置安全风险', position: { x: 50, y: 5 } },
      
      // Threats
      { id: 't-o1', type: 'threat', label: '反应器异常', description: '反应系统失控', tagId: 'TI-101', position: { x: 5, y: 30 } },
      { id: 't-o2', type: 'threat', label: '再生器异常', description: '再生系统失控', tagId: 'TI-201', position: { x: 5, y: 55 } },
      { id: 't-o3', type: 'threat', label: '分馏塔异常', description: '分馏系统失控', tagId: 'TI-301', position: { x: 5, y: 80 } },
      
      // Preventive actions
      { id: 'pa-o1', type: 'preventive_action', label: '反应监控', description: '关键参数监控', position: { x: 20, y: 30 } },
      { id: 'pa-o2', type: 'preventive_action', label: '再生监控', description: '烧焦温度控制', position: { x: 20, y: 55 } },
      { id: 'pa-o3', type: 'preventive_action', label: '分馏监控', description: '液位压力监控', position: { x: 20, y: 80 } },
      
      // Left barriers
      { id: 'b-o1', type: 'barrier', label: 'DCS监控', position: { x: 35, y: 42 } },
      { id: 'b-o2', type: 'barrier', label: 'SIS联锁', position: { x: 35, y: 68 } },
      
      // Top event
      { id: 'te-overview', type: 'top_event', label: '装置重大事故', description: '多系统联动失控', position: { x: 50, y: 50 } },
      
      // Right barriers
      { id: 'b-o3', type: 'barrier', label: '全厂ESD', position: { x: 65, y: 42 } },
      { id: 'b-o4', type: 'barrier', label: '消防系统', position: { x: 65, y: 68 } },
      
      // Mitigating actions
      { id: 'ma-o1', type: 'mitigating_action', label: '紧急停车', description: '启动全厂ESD', position: { x: 80, y: 30 } },
      { id: 'ma-o2', type: 'mitigating_action', label: '应急响应', description: '启动应急预案', position: { x: 80, y: 55 } },
      { id: 'ma-o3', type: 'mitigating_action', label: '人员疏散', description: '全厂人员撤离', position: { x: 80, y: 80 } },
      
      // Consequences
      { id: 'c-o1', type: 'consequence', label: '重大财产损失', description: '装置严重损毁', position: { x: 95, y: 30 }, probability: 1.0e-5, severity: 'catastrophic', financialImpact: '1亿+' },
      { id: 'c-o2', type: 'consequence', label: '人员伤亡', description: '可能有人员死亡', position: { x: 95, y: 55 }, probability: 5.0e-6, severity: 'catastrophic', financialImpact: '不可估量' },
      { id: 'c-o3', type: 'consequence', label: '环境灾害', description: '大范围环境污染', position: { x: 95, y: 80 }, probability: 8.0e-6, severity: 'catastrophic', financialImpact: '5000万+' },
    ],
    links: [
      { from: 'hazard-o', to: 'te-overview' },
      { from: 't-o1', to: 'pa-o1' }, { from: 't-o2', to: 'pa-o2' }, { from: 't-o3', to: 'pa-o3' },
      { from: 'pa-o1', to: 'b-o1' }, { from: 'pa-o2', to: 'b-o2' }, { from: 'pa-o3', to: 'b-o2' },
      { from: 'b-o1', to: 'te-overview' }, { from: 'b-o2', to: 'te-overview' },
      { from: 'te-overview', to: 'b-o3' }, { from: 'te-overview', to: 'b-o4' },
      { from: 'b-o3', to: 'ma-o1' }, { from: 'b-o4', to: 'ma-o2' }, { from: 'b-o4', to: 'ma-o3' },
      { from: 'ma-o1', to: 'c-o1' }, { from: 'ma-o2', to: 'c-o2' }, { from: 'ma-o3', to: 'c-o3' },
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
