import { FaultTreeConfig } from '@/types/dcs';
import { supabase } from '@/integrations/supabase/client';

// Default fault tree configurations with preset positions
export const DEFAULT_FAULT_TREES: FaultTreeConfig[] = [
  {
    id: 'ft-reactor',
    name: '反应器故障树',
    imageUrl: null,
    topEventTagId: 'TI-101',
    areaId: 'reactor',
    position: { x: 10, y: 60 }
  },
  {
    id: 'ft-regenerator',
    name: '再生器故障树',
    imageUrl: null,
    topEventTagId: 'TI-201',
    areaId: 'regenerator',
    position: { x: 10, y: 60 }
  },
  {
    id: 'ft-fractionator',
    name: '分馏塔故障树',
    imageUrl: null,
    topEventTagId: 'TI-301',
    areaId: 'fractionator',
    position: { x: 10, y: 60 }
  },
  {
    id: 'ft-overview',
    name: '总体故障树',
    imageUrl: null,
    areaId: 'overview',
    position: { x: 10, y: 60 }
  }
];

// Fetch fault trees for an area
export const fetchFaultTrees = async (areaId?: string): Promise<FaultTreeConfig[]> => {
  try {
    let query = supabase.from('fault_trees').select('*');
    if (areaId) {
      query = query.eq('area_id', areaId);
    }
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      // Return defaults for the area
      return DEFAULT_FAULT_TREES.filter(ft => !areaId || ft.areaId === areaId);
    }
    
    return data.map(row => ({
      id: row.id,
      name: row.name,
      imageUrl: row.image_url,
      topEventTagId: row.top_event_tag_id || undefined,
      areaId: row.area_id,
      position: (row.position as { x: number; y: number }) || { x: 10, y: 60 }
    }));
  } catch (error) {
    console.error('Error fetching fault trees:', error);
    return DEFAULT_FAULT_TREES.filter(ft => !areaId || ft.areaId === areaId);
  }
};

// Save or update a fault tree
export const saveFaultTree = async (faultTree: FaultTreeConfig): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('fault_trees')
      .upsert({
        id: faultTree.id,
        name: faultTree.name,
        image_url: faultTree.imageUrl,
        top_event_tag_id: faultTree.topEventTagId || null,
        area_id: faultTree.areaId,
        position: faultTree.position
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving fault tree:', error);
    return false;
  }
};

// Upload fault tree image
export const uploadFaultTreeImage = async (
  faultTreeId: string,
  file: File
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `fault-tree-${faultTreeId}-${Date.now()}.${fileExt}`;
    const filePath = `fault-trees/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('process-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('process-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading fault tree image:', error);
    return null;
  }
};

// Delete fault tree
export const deleteFaultTree = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('fault_trees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting fault tree:', error);
    return false;
  }
};
