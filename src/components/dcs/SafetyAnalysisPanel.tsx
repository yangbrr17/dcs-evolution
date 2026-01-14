import React, { useState, useMemo, useEffect } from 'react';
import { GitBranch, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaultTreeViewer } from './FaultTreeViewer';
import { BowTieViewer } from './BowTieViewer';
import { getFaultTreesForArea, findFaultTreeByTagId } from '@/services/faultTreeService';
import { getBowTiesForArea } from '@/services/bowTieService';
import { TagData, BowTieEvent } from '@/types/dcs';

interface SafetyAnalysisPanelProps {
  areaId: string;
  tags: TagData[];
  onTagClick?: (tagId: string) => void;
  onHoveredAlarmTagChange?: (tagId: string | null) => void;
  
  // External control
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  activeTab?: 'fault-tree' | 'bow-tie';
  onActiveTabChange?: (tab: string) => void;
  targetTagId?: string | null;
}

export const SafetyAnalysisPanel: React.FC<SafetyAnalysisPanelProps> = ({
  areaId,
  tags,
  onTagClick,
  onHoveredAlarmTagChange,
  isExpanded: externalExpanded,
  onExpandedChange,
  activeTab: externalActiveTab,
  onActiveTabChange,
  targetTagId,
}) => {
  // Use internal state if not controlled externally
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState('fault-tree');
  
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  
  const setIsExpanded = (value: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(value);
    } else {
      setInternalExpanded(value);
    }
  };
  
  const setActiveTab = (value: string) => {
    if (onActiveTabChange) {
      onActiveTabChange(value);
    } else {
      setInternalActiveTab(value);
    }
  };
  
  const faultTrees = useMemo(() => getFaultTreesForArea(areaId), [areaId]);
  const bowTies = useMemo(() => getBowTiesForArea(areaId), [areaId]);
  
  const [selectedFaultTreeIdx, setSelectedFaultTreeIdx] = useState(0);
  const [selectedBowTieIdx, setSelectedBowTieIdx] = useState(0);
  
  // Reset selection when area changes
  useEffect(() => {
    setSelectedFaultTreeIdx(0);
    setSelectedBowTieIdx(0);
  }, [areaId]);
  
  // When targetTagId changes, find and select the corresponding fault tree
  useEffect(() => {
    if (targetTagId && faultTrees.length > 0) {
      const matchingTree = findFaultTreeByTagId(targetTagId, areaId);
      if (matchingTree) {
        const idx = faultTrees.findIndex(ft => ft.id === matchingTree.id);
        if (idx !== -1) {
          setSelectedFaultTreeIdx(idx);
        }
      }
    }
  }, [targetTagId, areaId, faultTrees]);
  
  const currentFaultTree = faultTrees[selectedFaultTreeIdx];
  const currentBowTie = bowTies[selectedBowTieIdx];
  
  const handleBowTieEventClick = (event: BowTieEvent) => {
    if (event.tagId && onTagClick) {
      onTagClick(event.tagId);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-primary" />
          <span>安全分析</span>
        </div>
        <span className="text-xs text-muted-foreground">
          故障树: {faultTrees.length} | Bow-Tie: {bowTies.length}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-fit shrink-0">
            <TabsTrigger value="fault-tree" className="gap-1 text-xs">
              <GitBranch className="h-3 w-3" />
              故障树
            </TabsTrigger>
            <TabsTrigger value="bow-tie" className="gap-1 text-xs">
              <Shield className="h-3 w-3" />
              Bow-Tie
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fault-tree" className="flex-1 mt-2 overflow-hidden">
            {faultTrees.length > 0 ? (
              <div className="h-full flex flex-col">
                {faultTrees.length > 1 && (
                  <div className="flex gap-1 mb-2 flex-wrap shrink-0">
                    {faultTrees.map((ft, idx) => (
                      <Button
                        key={ft.id}
                        variant={selectedFaultTreeIdx === idx ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setSelectedFaultTreeIdx(idx)}
                      >
                        {ft.name}
                      </Button>
                    ))}
                  </div>
                )}
                {currentFaultTree && (
                  <div className="flex-1 overflow-hidden">
                    <FaultTreeViewer
                      faultTree={currentFaultTree}
                      tags={tags}
                      onTagClick={onTagClick}
                      onHoveredTagChange={onHoveredAlarmTagChange}
                      highlightTagId={targetTagId}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                该区域暂无故障树配置
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bow-tie" className="flex-1 mt-2 overflow-hidden">
            {bowTies.length > 0 ? (
              <div className="h-full flex flex-col">
                {bowTies.length > 1 && (
                  <div className="flex gap-1 mb-2 flex-wrap shrink-0">
                    {bowTies.map((bt, idx) => (
                      <Button
                        key={bt.id}
                        variant={selectedBowTieIdx === idx ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setSelectedBowTieIdx(idx)}
                      >
                        {bt.name}
                      </Button>
                    ))}
                  </div>
                )}
                {currentBowTie && (
                  <div className="flex-1 overflow-hidden">
                    <BowTieViewer
                      bowTie={currentBowTie}
                      tags={tags}
                      onEventClick={handleBowTieEventClick}
                      onHoveredTagChange={onHoveredAlarmTagChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                该区域暂无Bow-Tie配置
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SafetyAnalysisPanel;