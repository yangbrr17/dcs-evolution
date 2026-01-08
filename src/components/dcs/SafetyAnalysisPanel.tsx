import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, GitBranch, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaultTreeViewer } from './FaultTreeViewer';
import { BowTieViewer } from './BowTieViewer';
import { getFaultTreesForArea } from '@/services/faultTreeService';
import { getBowTiesForArea } from '@/services/bowTieService';
import { TagData, BowTieEvent } from '@/types/dcs';

interface SafetyAnalysisPanelProps {
  areaId: string;
  tags: TagData[];
  onTagClick?: (tagId: string) => void;
  onHoveredAlarmTagChange?: (tagId: string | null) => void;
}

export const SafetyAnalysisPanel: React.FC<SafetyAnalysisPanelProps> = ({
  areaId,
  tags,
  onTagClick,
  onHoveredAlarmTagChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('fault-tree');
  
  const faultTrees = useMemo(() => getFaultTreesForArea(areaId), [areaId]);
  const bowTies = useMemo(() => getBowTiesForArea(areaId), [areaId]);
  
  const [selectedFaultTreeIdx, setSelectedFaultTreeIdx] = useState(0);
  const [selectedBowTieIdx, setSelectedBowTieIdx] = useState(0);
  
  // Reset selection when area changes
  React.useEffect(() => {
    setSelectedFaultTreeIdx(0);
    setSelectedBowTieIdx(0);
  }, [areaId]);
  
  const currentFaultTree = faultTrees[selectedFaultTreeIdx];
  const currentBowTie = bowTies[selectedBowTieIdx];
  
  const handleBowTieEventClick = (event: BowTieEvent) => {
    if (event.tagId && onTagClick) {
      onTagClick(event.tagId);
    }
  };
  
  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border transition-all duration-300 z-20 ${
        isExpanded ? 'h-[40%]' : 'h-10'
      }`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 h-10 cursor-pointer hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 text-primary" />
          <span>安全分析</span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground">
              (故障树: {faultTrees.length}, Bow-Tie: {bowTies.length})
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(100%-2.5rem)] p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="fault-tree" className="gap-1">
                <GitBranch className="h-3 w-3" />
                故障树
              </TabsTrigger>
              <TabsTrigger value="bow-tie" className="gap-1">
                <Shield className="h-3 w-3" />
                Bow-Tie
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="fault-tree" className="flex-1 mt-2">
              {faultTrees.length > 0 ? (
                <div className="h-full flex flex-col">
                  {faultTrees.length > 1 && (
                    <div className="flex gap-2 mb-2">
                      {faultTrees.map((ft, idx) => (
                        <Button
                          key={ft.id}
                          variant={selectedFaultTreeIdx === idx ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedFaultTreeIdx(idx)}
                        >
                          {ft.name}
                        </Button>
                      ))}
                    </div>
                  )}
                  {currentFaultTree && (
                    <div className="flex-1">
                      <FaultTreeViewer
                        faultTree={currentFaultTree}
                        tags={tags}
                        onTagClick={onTagClick}
                        onHoveredTagChange={onHoveredAlarmTagChange}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  该区域暂无故障树配置
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bow-tie" className="flex-1 mt-2">
              {bowTies.length > 0 ? (
                <div className="h-full flex flex-col">
                  {bowTies.length > 1 && (
                    <div className="flex gap-2 mb-2">
                      {bowTies.map((bt, idx) => (
                        <Button
                          key={bt.id}
                          variant={selectedBowTieIdx === idx ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedBowTieIdx(idx)}
                        >
                          {bt.name}
                        </Button>
                      ))}
                    </div>
                  )}
                  {currentBowTie && (
                    <div className="flex-1">
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
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  该区域暂无Bow-Tie配置
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SafetyAnalysisPanel;
