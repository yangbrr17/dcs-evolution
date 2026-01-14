import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { FaultTreeStructure, FaultTreeLink, TagData } from '@/types/dcs';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface FaultTreeViewerProps {
  faultTree: FaultTreeStructure;
  tags: TagData[];
  onTagClick?: (tagId: string) => void;
  onHoveredTagChange?: (tagId: string | null) => void;
  highlightTagId?: string | null;
}

// 计算节点位置 - 基于图的层级布局
const calculateNodePositions = (
  links: FaultTreeLink[],
  topEventTagId: string
): Map<string, { x: number; y: number; level: number }> => {
  // 收集所有节点
  const allNodes = new Set<string>();
  allNodes.add(topEventTagId);
  links.forEach(link => {
    allNodes.add(link.from);
    allNodes.add(link.to);
  });
  
  // 构建入边和出边图
  const inEdges = new Map<string, string[]>();
  const outEdges = new Map<string, string[]>();
  
  allNodes.forEach(node => {
    inEdges.set(node, []);
    outEdges.set(node, []);
  });
  
  links.forEach(link => {
    outEdges.get(link.from)?.push(link.to);
    inEdges.get(link.to)?.push(link.from);
  });
  
  // 使用BFS从顶事件反向计算层级
  const levels = new Map<string, number>();
  const queue: { id: string; level: number }[] = [{ id: topEventTagId, level: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    
    if (visited.has(id)) {
      // 如果已访问，更新为更小的层级（更接近顶事件）
      const existingLevel = levels.get(id) ?? level;
      levels.set(id, Math.min(existingLevel, level));
      continue;
    }
    
    visited.add(id);
    levels.set(id, level);
    
    // 找到所有指向当前节点的源节点
    const sources = inEdges.get(id) || [];
    sources.forEach(sourceId => {
      if (!visited.has(sourceId)) {
        queue.push({ id: sourceId, level: level + 1 });
      }
    });
  }
  
  // 处理未被访问的节点（可能是独立的或指向其他节点的）
  allNodes.forEach(node => {
    if (!levels.has(node)) {
      levels.set(node, 3); // 放在底层
    }
  });
  
  // 按层级分组
  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, node) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)?.push(node);
  });
  
  // 计算最终位置
  const maxLevel = Math.max(...Array.from(levels.values()));
  const positions = new Map<string, { x: number; y: number; level: number }>();
  
  levelGroups.forEach((nodes, level) => {
    const count = nodes.length;
    nodes.forEach((node, idx) => {
      // 水平位置：均匀分布
      const x = count === 1 ? 50 : 15 + (idx / (count - 1)) * 70;
      // 垂直位置：顶事件在上，底层在下
      const y = 12 + (level / Math.max(maxLevel, 1)) * 70;
      positions.set(node, { x, y, level });
    });
  });
  
  return positions;
};

// 获取曲线路径
const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
  
  const curveOffset = Math.min(distance * 0.15, 6);
  const perpX = -dy / distance;
  const perpY = dx / distance;
  const ctrlX = midX + perpX * curveOffset;
  const ctrlY = midY + perpY * curveOffset;
  
  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
};

// 计算曲线上的点
const getCurvePointAt = (x1: number, y1: number, x2: number, y2: number, t: number = 0.5) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: x1, y: y1 };
  
  const curveOffset = Math.min(distance * 0.15, 6);
  const perpX = -dy / distance;
  const perpY = dx / distance;
  const ctrlX = midX + perpX * curveOffset;
  const ctrlY = midY + perpY * curveOffset;
  
  const px = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2;
  const py = (1-t)*(1-t)*y1 + 2*(1-t)*t*ctrlY + t*t*y2;
  
  return { x: px, y: py };
};

export const FaultTreeViewer: React.FC<FaultTreeViewerProps> = ({
  faultTree,
  tags,
  onTagClick,
  onHoveredTagChange,
  highlightTagId,
}) => {
  // Pan and zoom state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, viewBoxX: 0, viewBoxY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Reset viewBox when fault tree changes
  useEffect(() => {
    setViewBox({ x: 0, y: 0, width: 100, height: 100 });
  }, [faultTree.id]);
  
  // 创建tagId到tag的映射
  const tagMap = useMemo(() => {
    const map = new Map<string, TagData>();
    tags.forEach(t => map.set(t.id, t));
    return map;
  }, [tags]);
  
  // 计算节点位置
  const nodePositions = useMemo(() => 
    calculateNodePositions(faultTree.links, faultTree.topEventTagId),
    [faultTree]
  );
  
  // 获取节点状态
  const getNodeStatus = (tagId: string): 'normal' | 'warning' | 'alarm' => {
    const tag = tagMap.get(tagId);
    return tag?.status || 'normal';
  };
  
  // 获取节点颜色
  const getNodeColor = (tagId: string, isTopEvent: boolean, isHighlighted: boolean): string => {
    const status = getNodeStatus(tagId);
    if (status === 'alarm') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    if (isHighlighted) return 'hsl(var(--primary))';
    if (isTopEvent) return 'hsl(var(--primary))';
    return 'hsl(var(--muted))';
  };
  
  // 获取节点边框颜色
  const getNodeStroke = (tagId: string, isHighlighted: boolean): string => {
    const status = getNodeStatus(tagId);
    if (status === 'alarm') return '#dc2626';
    if (status === 'warning') return '#d97706';
    if (isHighlighted) return 'hsl(var(--primary))';
    return 'hsl(var(--border))';
  };
  
  // 获取所有节点
  const allNodeIds = useMemo(() => {
    const nodes = new Set<string>();
    nodes.add(faultTree.topEventTagId);
    faultTree.links.forEach(link => {
      nodes.add(link.from);
      nodes.add(link.to);
    });
    return Array.from(nodes);
  }, [faultTree]);
  
  const handleNodeClick = (tagId: string) => {
    if (onTagClick && tagMap.has(tagId)) {
      onTagClick(tagId);
    }
  };
  
  const handleNodeHover = (tagId: string | null) => {
    if (onHoveredTagChange) {
      onHoveredTagChange(tagId);
    }
  };
  
  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    if ((e.target as Element).closest('g[data-node]')) return; // Don't start drag on nodes
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      viewBoxX: viewBox.x,
      viewBoxY: viewBox.y,
    });
  }, [viewBox.x, viewBox.y]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Calculate how much the mouse moved in SVG coordinates
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    
    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;
    
    setViewBox(prev => ({
      ...prev,
      x: dragStart.viewBoxX - dx,
      y: dragStart.viewBoxY - dy,
    }));
  }, [isDragging, dragStart, viewBox.width, viewBox.height]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const minSize = 30;
    const maxSize = 200;
    
    setViewBox(prev => {
      const newWidth = Math.max(minSize, Math.min(maxSize, prev.width * zoomFactor));
      const newHeight = Math.max(minSize, Math.min(maxSize, prev.height * zoomFactor));
      
      // Zoom towards center
      const widthDiff = newWidth - prev.width;
      const heightDiff = newHeight - prev.height;
      
      return {
        x: prev.x - widthDiff / 2,
        y: prev.y - heightDiff / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  }, []);
  
  // Zoom controls
  const handleZoomIn = () => {
    setViewBox(prev => {
      const newWidth = Math.max(30, prev.width * 0.8);
      const newHeight = Math.max(30, prev.height * 0.8);
      const widthDiff = newWidth - prev.width;
      const heightDiff = newHeight - prev.height;
      return {
        x: prev.x - widthDiff / 2,
        y: prev.y - heightDiff / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  };
  
  const handleZoomOut = () => {
    setViewBox(prev => {
      const newWidth = Math.min(200, prev.width * 1.25);
      const newHeight = Math.min(200, prev.height * 1.25);
      const widthDiff = newWidth - prev.width;
      const heightDiff = newHeight - prev.height;
      return {
        x: prev.x - widthDiff / 2,
        y: prev.y - heightDiff / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  };
  
  const handleReset = () => {
    setViewBox({ x: 0, y: 0, width: 100, height: 100 });
  };
  
  return (
    <div className="w-full h-full bg-background/50 rounded-lg p-2 relative">
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="放大">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="缩小">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleReset} title="重置视图">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Drag hint */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
        <Move className="h-3 w-3" />
        <span>拖拽平移 | 滚轮缩放</span>
      </div>
      
      <div className="text-sm font-medium mb-1 text-foreground flex items-center gap-2">
        {faultTree.name}
        <span className="text-xs text-muted-foreground">
          (顶事件: {faultTree.topEventTagId})
        </span>
      </div>
      
      <svg 
        ref={svgRef}
        width="100%" 
        height="calc(100% - 24px)" 
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <defs>
          {/* 普通箭头 */}
          <marker
            id="ft-arrow-normal"
            markerWidth="2.5"
            markerHeight="1.5"
            refX="2.2"
            refY="0.75"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0.15 L 2.5 0.75 L 0 1.35 L 0.4 0.75 Z" fill="#9ca3af" />
          </marker>
          
          {/* 高贡献箭头 */}
          <marker
            id="ft-arrow-critical"
            markerWidth="3"
            markerHeight="1.8"
            refX="2.7"
            refY="0.9"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0.15 L 3 0.9 L 0 1.65 L 0.5 0.9 Z" fill="#ef4444" />
          </marker>
          
          {/* 高亮箭头 */}
          <marker
            id="ft-arrow-highlight"
            markerWidth="3"
            markerHeight="1.8"
            refX="2.7"
            refY="0.9"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0.15 L 3 0.9 L 0 1.65 L 0.5 0.9 Z" fill="hsl(var(--primary))" />
          </marker>
        </defs>
        
        {/* 绘制连接线 */}
        {faultTree.links.map((link, idx) => {
          const fromPos = nodePositions.get(link.from);
          const toPos = nodePositions.get(link.to);
          
          if (!fromPos || !toPos) return null;
          
          const pathD = getCurvedPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
          const labelPos = getCurvePointAt(fromPos.x, fromPos.y, toPos.x, toPos.y, 0.5);
          const isHighContribution = link.contribution >= 50;
          const isHighlighted = highlightTagId && (link.from === highlightTagId || link.to === highlightTagId);
          
          return (
            <g key={`link-${idx}`}>
              {/* 连接线 */}
              <path
                d={pathD}
                fill="none"
                stroke={isHighlighted ? 'hsl(var(--primary))' : isHighContribution ? '#ef4444' : '#9ca3af'}
                strokeWidth={isHighlighted ? 0.6 : isHighContribution ? 0.5 : 0.35}
                strokeOpacity={0.8}
                strokeLinecap="round"
                strokeDasharray={isHighlighted ? 'none' : '1.5 0.8'}
                markerEnd={`url(#ft-arrow-${isHighlighted ? 'highlight' : isHighContribution ? 'critical' : 'normal'})`}
                className={isHighContribution ? 'animate-pulse' : ''}
              />
              
              {/* 贡献度标签 */}
              <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
                <rect
                  x="-4"
                  y="-1.8"
                  width="8"
                  height="3"
                  rx="0.5"
                  fill={isHighlighted ? 'hsl(var(--primary) / 0.1)' : isHighContribution ? '#fef2f2' : '#f9fafb'}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : isHighContribution ? '#fca5a5' : '#e5e7eb'}
                  strokeWidth="0.15"
                />
                <text
                  x="0"
                  y="0.5"
                  textAnchor="middle"
                  fontSize="1.6"
                  fontWeight="500"
                  fill={isHighlighted ? 'hsl(var(--primary))' : isHighContribution ? '#dc2626' : '#6b7280'}
                >
                  {link.contribution}%
                </text>
              </g>
            </g>
          );
        })}
        
        {/* 绘制节点 */}
        {allNodeIds.map(tagId => {
          const pos = nodePositions.get(tagId);
          if (!pos) return null;
          
          const isTopEvent = tagId === faultTree.topEventTagId;
          const isHighlighted = highlightTagId === tagId;
          const tag = tagMap.get(tagId);
          const status = getNodeStatus(tagId);
          const nodeSize = isTopEvent ? 6 : 4.5;
          
          return (
            <g
              key={tagId}
              data-node
              className="cursor-pointer"
              onClick={() => handleNodeClick(tagId)}
              onMouseEnter={() => handleNodeHover(tagId)}
              onMouseLeave={() => handleNodeHover(null)}
            >
              {/* 高亮光晕 */}
              {isHighlighted && (
                <rect
                  x={pos.x - nodeSize - 1}
                  y={pos.y - nodeSize * 0.6 - 1}
                  width={nodeSize * 2 + 2}
                  height={nodeSize * 1.2 + 2}
                  rx="1.5"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.4"
                  className="animate-pulse"
                />
              )}
              
              {/* 节点背景 - 圆角矩形 */}
              <rect
                x={pos.x - nodeSize}
                y={pos.y - nodeSize * 0.6}
                width={nodeSize * 2}
                height={nodeSize * 1.2}
                rx="1"
                fill={getNodeColor(tagId, isTopEvent, isHighlighted)}
                stroke={getNodeStroke(tagId, isHighlighted)}
                strokeWidth={isHighlighted ? 0.6 : isTopEvent ? 0.5 : 0.3}
                className={status !== 'normal' || isHighlighted ? 'animate-pulse' : ''}
              />
              
              {/* 位号 */}
              <text
                x={pos.x}
                y={pos.y + 0.5}
                textAnchor="middle"
                fontSize={isTopEvent ? 2.2 : 1.8}
                fontWeight="600"
                fill={status !== 'normal' || isHighlighted ? '#ffffff' : 'hsl(var(--foreground))'}
              >
                {tagId}
              </text>
              
              {/* 当前值（如果有tag数据） */}
              {tag && (
                <text
                  x={pos.x}
                  y={pos.y + nodeSize * 0.6 + 2.5}
                  textAnchor="middle"
                  fontSize="1.4"
                  fill="hsl(var(--muted-foreground))"
                >
                  {tag.currentValue.toFixed(1)}{tag.unit}
                </text>
              )}
              
              {/* 顶事件标识 */}
              {isTopEvent && (
                <text
                  x={pos.x}
                  y={pos.y - nodeSize * 0.6 - 1.5}
                  textAnchor="middle"
                  fontSize="1.5"
                  fontWeight="500"
                  fill="hsl(var(--primary))"
                >
                  ▼ 顶事件
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