import React, { useMemo } from 'react';
import { FaultTreeStructure, FaultTreeNode, TagData } from '@/types/dcs';

interface FaultTreeViewerProps {
  faultTree: FaultTreeStructure;
  tags: TagData[];
  onTagClick?: (tagId: string) => void;
  onHoveredTagChange?: (tagId: string | null) => void;
}

// Calculate node positions based on tree structure
const calculateNodePositions = (nodes: FaultTreeNode[], topEventId: string) => {
  const nodeMap = new Map<string, FaultTreeNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const positions = new Map<string, { x: number; y: number; level: number }>();
  const levelWidths = new Map<number, number>();
  
  // BFS to assign levels
  const queue: { id: string; level: number }[] = [{ id: topEventId, level: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    
    const node = nodeMap.get(id);
    if (!node) continue;
    
    const currentWidth = levelWidths.get(level) || 0;
    positions.set(id, { x: currentWidth, y: level, level });
    levelWidths.set(level, currentWidth + 1);
    
    if (node.children) {
      node.children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }
  }
  
  // Normalize positions
  const maxLevel = Math.max(...Array.from(levelWidths.keys()));
  const result = new Map<string, { x: number; y: number }>();
  
  positions.forEach((pos, id) => {
    const levelWidth = levelWidths.get(pos.level) || 1;
    const x = ((pos.x + 0.5) / levelWidth) * 100;
    const y = 10 + (pos.level / (maxLevel || 1)) * 75;
    result.set(id, { x, y });
  });
  
  return result;
};

// Gate shapes
const OrGate: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <path
    d={`M ${x - size} ${y + size} 
        Q ${x - size} ${y - size * 0.5}, ${x} ${y - size}
        Q ${x + size} ${y - size * 0.5}, ${x + size} ${y + size}
        Q ${x} ${y + size * 0.3}, ${x - size} ${y + size} Z`}
    fill="hsl(var(--primary))"
    stroke="hsl(var(--primary-foreground))"
    strokeWidth="1"
  />
);

const AndGate: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <path
    d={`M ${x - size} ${y + size} 
        L ${x - size} ${y - size * 0.3}
        Q ${x} ${y - size}, ${x + size} ${y - size * 0.3}
        L ${x + size} ${y + size}
        L ${x - size} ${y + size} Z`}
    fill="hsl(var(--secondary))"
    stroke="hsl(var(--secondary-foreground))"
    strokeWidth="1"
  />
);

const BasicEvent: React.FC<{ x: number; y: number; size: number; status: 'normal' | 'warning' | 'alarm' }> = ({ x, y, size, status }) => {
  const fillColor = status === 'alarm' 
    ? 'hsl(var(--destructive))' 
    : status === 'warning' 
      ? 'hsl(45 100% 50%)' 
      : 'hsl(var(--muted))';
  
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill={fillColor}
      stroke="hsl(var(--border))"
      strokeWidth="2"
    />
  );
};

export const FaultTreeViewer: React.FC<FaultTreeViewerProps> = ({
  faultTree,
  tags,
  onTagClick,
  onHoveredTagChange,
}) => {
  const tagMap = useMemo(() => {
    const map = new Map<string, TagData>();
    tags.forEach(t => map.set(t.id, t));
    return map;
  }, [tags]);
  
  const nodePositions = useMemo(() => 
    calculateNodePositions(faultTree.nodes, faultTree.topEventId),
    [faultTree]
  );
  
  const nodeMap = useMemo(() => {
    const map = new Map<string, FaultTreeNode>();
    faultTree.nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [faultTree]);
  
  const getNodeStatus = (node: FaultTreeNode): 'normal' | 'warning' | 'alarm' => {
    if (node.tagId) {
      const tag = tagMap.get(node.tagId);
      if (tag) return tag.status;
    }
    return 'normal';
  };
  
  const handleNodeClick = (node: FaultTreeNode) => {
    if (node.tagId && onTagClick) {
      onTagClick(node.tagId);
    }
  };
  
  const handleNodeHover = (node: FaultTreeNode | null) => {
    if (onHoveredTagChange) {
      onHoveredTagChange(node?.tagId || null);
    }
  };
  
  // Render connections
  const connections = useMemo(() => {
    const lines: JSX.Element[] = [];
    
    faultTree.nodes.forEach(node => {
      if (!node.children) return;
      
      const parentPos = nodePositions.get(node.id);
      if (!parentPos) return;
      
      node.children.forEach(childId => {
        const childPos = nodePositions.get(childId);
        if (!childPos) return;
        
        lines.push(
          <line
            key={`${node.id}-${childId}`}
            x1={`${parentPos.x}%`}
            y1={`${parentPos.y + 3}%`}
            x2={`${childPos.x}%`}
            y2={`${childPos.y - 3}%`}
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        );
      });
    });
    
    return lines;
  }, [faultTree, nodePositions]);
  
  return (
    <div className="w-full h-full bg-background/50 rounded-lg p-4">
      <div className="text-sm font-medium mb-2 text-foreground">{faultTree.name}</div>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Connections */}
        <g>{connections}</g>
        
        {/* Nodes */}
        {faultTree.nodes.map(node => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          
          const status = getNodeStatus(node);
          const isTopEvent = node.id === faultTree.topEventId;
          const size = isTopEvent ? 5 : 3.5;
          
          return (
            <g
              key={node.id}
              className={node.tagId ? 'cursor-pointer' : ''}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => handleNodeHover(node)}
              onMouseLeave={() => handleNodeHover(null)}
            >
              {node.type === 'or' && <OrGate x={pos.x} y={pos.y} size={size} />}
              {node.type === 'and' && <AndGate x={pos.x} y={pos.y} size={size} />}
              {node.type === 'basic_event' && <BasicEvent x={pos.x} y={pos.y} size={size} status={status} />}
              {node.type === 'undeveloped' && (
                <polygon
                  points={`${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`}
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
              )}
              
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + size + 2.5}
                textAnchor="middle"
                fontSize="2"
                fill="hsl(var(--foreground))"
                className="pointer-events-none"
              >
                {node.label}
              </text>
              
              {/* Tag ID indicator */}
              {node.tagId && (
                <text
                  x={pos.x}
                  y={pos.y + size + 4.5}
                  textAnchor="middle"
                  fontSize="1.5"
                  fill="hsl(var(--muted-foreground))"
                  className="pointer-events-none"
                >
                  {node.tagId}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FaultTreeViewer;
