import { supabase } from '@/integrations/supabase/client';
import { ProcessArea } from '@/types/dcs';

export async function fetchProcessAreas(): Promise<ProcessArea[]> {
  const { data, error } = await supabase
    .from('process_areas')
    .select('*')
    .order('id');

  if (error) {
    console.error('Failed to fetch process areas:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url,
    tagIds: row.tag_ids || [],
  }));
}

export async function uploadProcessImage(
  areaId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${areaId}-${Date.now()}.${fileExt}`;
  const filePath = `areas/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('process-images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Failed to upload image:', uploadError);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('process-images')
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Update database
  const { error: updateError } = await supabase
    .from('process_areas')
    .update({ image_url: publicUrl })
    .eq('id', areaId);

  if (updateError) {
    console.error('Failed to update process area:', updateError);
    return null;
  }

  return publicUrl;
}

export async function removeProcessImage(areaId: string, currentUrl: string | null): Promise<boolean> {
  // Delete from storage if URL exists
  if (currentUrl) {
    try {
      // Extract file path from URL
      const urlParts = currentUrl.split('/process-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('process-images').remove([filePath]);
      }
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
    }
  }

  // Clear URL in database
  const { error } = await supabase
    .from('process_areas')
    .update({ image_url: null })
    .eq('id', areaId);

  if (error) {
    console.error('Failed to clear image URL:', error);
    return false;
  }

  return true;
}

export async function createProcessArea(area: Omit<ProcessArea, 'imageUrl'>): Promise<boolean> {
  const { error } = await supabase
    .from('process_areas')
    .insert({
      id: area.id,
      name: area.name,
      description: area.description,
      tag_ids: area.tagIds,
    });

  if (error) {
    console.error('Failed to create process area:', error);
    return false;
  }

  return true;
}
