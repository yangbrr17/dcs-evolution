// Tag Position Persistence Service (localStorage-based)

import { TagPosition } from '@/types/dcs';

const STORAGE_KEY = 'dcs_tag_positions';

interface StoredPositions {
  [tagId: string]: {
    [areaId: string]: TagPosition;
  };
}

export function getStoredPositions(): StoredPositions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getTagPosition(tagId: string, areaId: string): TagPosition | null {
  const positions = getStoredPositions();
  return positions[tagId]?.[areaId] ?? null;
}

export function saveTagPosition(tagId: string, areaId: string, position: TagPosition): void {
  const positions = getStoredPositions();
  if (!positions[tagId]) {
    positions[tagId] = {};
  }
  positions[tagId][areaId] = position;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function applyStoredPositions<T extends { id: string; position: TagPosition }>(
  tags: T[],
  areaId: string
): T[] {
  const positions = getStoredPositions();
  return tags.map(tag => {
    const stored = positions[tag.id]?.[areaId];
    return stored ? { ...tag, position: stored } : tag;
  });
}
