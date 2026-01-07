// Causality Service for Root Cause Analysis
// Manages causal relationships between process variables

import { CausalLink, CausalityGraph, TagData } from '@/types/dcs';

const STORAGE_KEY = 'dcs_causality_graph';

// Default causality configuration based on FCC process knowledge
const DEFAULT_CAUSALITY: CausalityGraph = {
  version: '1.0.0',
  links: [
    // Reactor area causal chain
    { from: 'FI-101', to: 'TI-101', contribution: 65 },   // Feed flow → Reactor temp
    { from: 'TI-101', to: 'TI-102', contribution: 80 },   // Reactor temp → Riser outlet temp
    { from: 'TI-102', to: 'TI-103', contribution: 70 },   // Riser outlet → Settler temp
    { from: 'FI-101', to: 'PI-101', contribution: 45 },   // Feed flow → Reactor pressure
    { from: 'TI-101', to: 'PI-101', contribution: 55 },   // Reactor temp → Reactor pressure
    
    // Regenerator area causal chain
    { from: 'FI-201', to: 'TI-201', contribution: 75 },   // Main air flow → Dense phase temp
    { from: 'TI-201', to: 'TI-202', contribution: 85 },   // Dense phase → Dilute phase temp
    { from: 'FI-201', to: 'AI-201', contribution: 40 },   // Main air flow → Flue gas CO
    { from: 'TI-201', to: 'AI-201', contribution: 60 },   // Dense phase temp → Flue gas CO
    { from: 'AI-201', to: 'AI-202', contribution: 90 },   // CO content → O2 content
    
    // Fractionator area causal chain
    { from: 'TI-101', to: 'TI-303', contribution: 50 },   // Reactor temp → Tower bottom temp
    { from: 'TI-303', to: 'TI-302', contribution: 75 },   // Tower bottom → Tower middle temp
    { from: 'TI-302', to: 'TI-301', contribution: 70 },   // Tower middle → Tower top temp
    { from: 'FI-301', to: 'TI-301', contribution: 35 },   // Top reflux → Tower top temp
    { from: 'TI-301', to: 'PI-301', contribution: 60 },   // Tower top temp → Tower top pressure
    
    // Cross-area causal chain
    { from: 'TI-201', to: 'TI-101', contribution: 30 },   // Regenerator temp → Reactor temp (catalyst circulation)
  ]
};

let currentGraph: CausalityGraph = { ...DEFAULT_CAUSALITY };

// Load from localStorage on init
function loadFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      currentGraph = JSON.parse(stored);
    }
  } catch {
    currentGraph = { ...DEFAULT_CAUSALITY };
  }
}

// Initialize
loadFromStorage();

export function getCausalityGraph(): CausalityGraph {
  return currentGraph;
}

export function importCausalityGraph(config: CausalityGraph): void {
  currentGraph = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function exportCausalityGraph(): CausalityGraph {
  return { ...currentGraph };
}

export function resetCausalityGraph(): void {
  currentGraph = { ...DEFAULT_CAUSALITY };
  localStorage.removeItem(STORAGE_KEY);
}

// Find all causal links leading to a target variable (recursive)
export function findCausalChain(
  targetId: string,
  visited = new Set<string>()
): CausalLink[] {
  if (visited.has(targetId)) return []; // Prevent cycles
  visited.add(targetId);
  
  const directCauses = currentGraph.links.filter(link => link.to === targetId);
  const allLinks: CausalLink[] = [...directCauses];
  
  // Recursively find upstream causes
  for (const link of directCauses) {
    const upstreamLinks = findCausalChain(link.from, visited);
    allLinks.push(...upstreamLinks);
  }
  
  return allLinks;
}

// Check if a causal link is "critical" (cause variable is also in abnormal state)
export function isCriticalLink(link: CausalLink, tags: TagData[]): boolean {
  const causeTag = tags.find(t => t.id === link.from);
  return causeTag?.status === 'alarm' || causeTag?.status === 'warning';
}
