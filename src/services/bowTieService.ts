import { BowTieConfig, BowTieEvent, BowTieLink } from '@/types/dcs';
import { supabase } from '@/integrations/supabase/client';

// Default Bow-Tie configuration for FCC reactor runaway scenario
export const DEFAULT_BOWTIE: BowTieConfig = {
  id: 'bt-reactor-runaway',
  name: '反应器飞温事故',
  areaId: 'reactor',
  topEventId: 'te-1',
  events: [
    // Threats (left side)
    { id: 't1', type: 'threat', label: '进料流量过大', tagId: 'FI-101', position: { x: 5, y: 20 } },
    { id: 't2', type: 'threat', label: '催化剂活性异常', position: { x: 5, y: 40 } },
    { id: 't3', type: 'threat', label: '再生器温度过高', tagId: 'TI-201', position: { x: 5, y: 60 } },
    { id: 't4', type: 'threat', label: '冷却系统故障', position: { x: 5, y: 80 } },
    // Prevention barriers
    { id: 'b1', type: 'barrier', label: '流量控制阀', position: { x: 25, y: 30 } },
    { id: 'b2', type: 'barrier', label: '催化剂循环控制', position: { x: 25, y: 50 } },
    { id: 'b3', type: 'barrier', label: '温度联锁保护', position: { x: 25, y: 70 } },
    // Top event (center)
    { id: 'te-1', type: 'top_event', label: '反应器飞温', tagId: 'TI-101', position: { x: 50, y: 50 } },
    // Recovery measures
    { id: 'r1', type: 'recovery', label: '紧急停车系统', position: { x: 75, y: 30 } },
    { id: 'r2', type: 'recovery', label: '消防系统', position: { x: 75, y: 50 } },
    { id: 'r3', type: 'recovery', label: '应急响应程序', position: { x: 75, y: 70 } },
    // Consequences (right side)
    { id: 'c1', type: 'consequence', label: '设备损坏', position: { x: 95, y: 20 } },
    { id: 'c2', type: 'consequence', label: '人员伤害', position: { x: 95, y: 40 } },
    { id: 'c3', type: 'consequence', label: '环境污染', position: { x: 95, y: 60 } },
    { id: 'c4', type: 'consequence', label: '生产损失', position: { x: 95, y: 80 } },
  ],
  links: [
    // Threats to barriers
    { from: 't1', to: 'b1' },
    { from: 't2', to: 'b2' },
    { from: 't3', to: 'b2' },
    { from: 't3', to: 'b3' },
    { from: 't4', to: 'b3' },
    // Barriers to top event
    { from: 'b1', to: 'te-1' },
    { from: 'b2', to: 'te-1' },
    { from: 'b3', to: 'te-1' },
    // Top event to recovery
    { from: 'te-1', to: 'r1' },
    { from: 'te-1', to: 'r2' },
    { from: 'te-1', to: 'r3' },
    // Recovery to consequences
    { from: 'r1', to: 'c1' },
    { from: 'r1', to: 'c2' },
    { from: 'r2', to: 'c3' },
    { from: 'r3', to: 'c4' },
  ]
};

// Additional default for regenerator
export const DEFAULT_BOWTIES: BowTieConfig[] = [
  DEFAULT_BOWTIE,
  {
    id: 'bt-regenerator-fire',
    name: '再生器烧焦事故',
    areaId: 'regenerator',
    topEventId: 'te-regen',
    events: [
      { id: 't-r1', type: 'threat', label: '催化剂积碳过多', position: { x: 5, y: 30 } },
      { id: 't-r2', type: 'threat', label: '空气分布不均', position: { x: 5, y: 50 } },
      { id: 't-r3', type: 'threat', label: '烧焦温度失控', tagId: 'TI-201', position: { x: 5, y: 70 } },
      { id: 'b-r1', type: 'barrier', label: '温度监控系统', position: { x: 25, y: 40 } },
      { id: 'b-r2', type: 'barrier', label: '空气流量控制', position: { x: 25, y: 60 } },
      { id: 'te-regen', type: 'top_event', label: '再生器超温', tagId: 'TI-201', position: { x: 50, y: 50 } },
      { id: 'r-r1', type: 'recovery', label: '紧急降温程序', position: { x: 75, y: 40 } },
      { id: 'r-r2', type: 'recovery', label: '催化剂排放', position: { x: 75, y: 60 } },
      { id: 'c-r1', type: 'consequence', label: '催化剂失活', position: { x: 95, y: 35 } },
      { id: 'c-r2', type: 'consequence', label: '设备腐蚀', position: { x: 95, y: 55 } },
      { id: 'c-r3', type: 'consequence', label: '停工损失', position: { x: 95, y: 75 } },
    ],
    links: [
      { from: 't-r1', to: 'b-r1' },
      { from: 't-r2', to: 'b-r2' },
      { from: 't-r3', to: 'b-r1' },
      { from: 'b-r1', to: 'te-regen' },
      { from: 'b-r2', to: 'te-regen' },
      { from: 'te-regen', to: 'r-r1' },
      { from: 'te-regen', to: 'r-r2' },
      { from: 'r-r1', to: 'c-r1' },
      { from: 'r-r2', to: 'c-r2' },
      { from: 'r-r2', to: 'c-r3' },
    ]
  }
];

// Fetch bow ties for an area
export const fetchBowTies = async (areaId?: string): Promise<BowTieConfig[]> => {
  try {
    let query = supabase.from('bow_ties').select('*');
    if (areaId) {
      query = query.eq('area_id', areaId);
    }
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      // Return defaults for the area
      return DEFAULT_BOWTIES.filter(bt => !areaId || bt.areaId === areaId);
    }
    
    return data.map(row => {
      const config = row.config as { topEventId?: string; events?: BowTieEvent[]; links?: BowTieLink[] } || {};
      return {
        id: row.id,
        name: row.name,
        areaId: row.area_id,
        topEventId: config.topEventId || '',
        events: config.events || [],
        links: config.links || []
      };
    });
  } catch (error) {
    console.error('Error fetching bow ties:', error);
    return DEFAULT_BOWTIES.filter(bt => !areaId || bt.areaId === areaId);
  }
};

// Save or update a bow tie
export const saveBowTie = async (bowTie: BowTieConfig): Promise<boolean> => {
  try {
    // Check if exists first
    const { data: existing } = await supabase
      .from('bow_ties')
      .select('id')
      .eq('id', bowTie.id)
      .maybeSingle();
    
    const configJson = JSON.parse(JSON.stringify({
      topEventId: bowTie.topEventId,
      events: bowTie.events,
      links: bowTie.links
    }));

    if (existing) {
      const { error } = await supabase
        .from('bow_ties')
        .update({
          name: bowTie.name,
          area_id: bowTie.areaId,
          config: configJson
        })
        .eq('id', bowTie.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('bow_ties')
        .insert({
          id: bowTie.id,
          name: bowTie.name,
          area_id: bowTie.areaId,
          config: configJson
        });
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving bow tie:', error);
    return false;
  }
};

// Delete bow tie
export const deleteBowTie = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bow_ties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting bow tie:', error);
    return false;
  }
};

// Export bow tie config as JSON
export const exportBowTieConfig = (bowTie: BowTieConfig): string => {
  return JSON.stringify(bowTie, null, 2);
};

// Import bow tie config from JSON
export const importBowTieConfig = (json: string): BowTieConfig | null => {
  try {
    const config = JSON.parse(json);
    // Validate required fields
    if (!config.id || !config.name || !config.areaId || !config.events || !config.links) {
      throw new Error('Invalid bow tie configuration');
    }
    return config as BowTieConfig;
  } catch (error) {
    console.error('Error importing bow tie config:', error);
    return null;
  }
};
