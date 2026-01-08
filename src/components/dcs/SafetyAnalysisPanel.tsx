import React, { useState, useEffect, useCallback } from 'react';
import { FaultTreeConfig, BowTieConfig, TagData, BowTieEvent } from '@/types/dcs';
import { fetchFaultTrees, saveFaultTree, uploadFaultTreeImage } from '@/services/faultTreeService';
import { fetchBowTies } from '@/services/bowTieService';
import FaultTreeViewer from './FaultTreeViewer';
import BowTieViewer from './BowTieViewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronUp, ChevronDown, TreeDeciduous, Triangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SafetyAnalysisPanelProps {
  areaId: string;
  tags: TagData[];
  isEditMode: boolean;
  onTagClick?: (tagId: string) => void;
  onHoveredAlarmTagChange?: (tagId: string | null) => void;
}

const SafetyAnalysisPanel: React.FC<SafetyAnalysisPanelProps> = ({
  areaId,
  tags,
  isEditMode,
  onTagClick,
  onHoveredAlarmTagChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [faultTrees, setFaultTrees] = useState<FaultTreeConfig[]>([]);
  const [bowTies, setBowTies] = useState<BowTieConfig[]>([]);
  const [selectedFaultTreeId, setSelectedFaultTreeId] = useState<string>('');
  const [selectedBowTieId, setSelectedBowTieId] = useState<string>('');

  // Load fault trees and bow ties for current area
  useEffect(() => {
    const loadData = async () => {
      const [ftData, btData] = await Promise.all([
        fetchFaultTrees(areaId),
        fetchBowTies(areaId)
      ]);
      
      setFaultTrees(ftData);
      setBowTies(btData);
      
      // Select first items by default
      if (ftData.length > 0) setSelectedFaultTreeId(ftData[0].id);
      if (btData.length > 0) setSelectedBowTieId(btData[0].id);
    };
    loadData();
  }, [areaId]);

  const selectedFaultTree = faultTrees.find(ft => ft.id === selectedFaultTreeId);
  const selectedBowTie = bowTies.find(bt => bt.id === selectedBowTieId);

  const handleFaultTreeImageUpload = useCallback(async (file: File) => {
    if (!selectedFaultTree) return;
    
    const imageUrl = await uploadFaultTreeImage(selectedFaultTree.id, file);
    if (imageUrl) {
      const updatedFT = { ...selectedFaultTree, imageUrl };
      await saveFaultTree(updatedFT);
      setFaultTrees(prev => prev.map(ft => 
        ft.id === selectedFaultTree.id ? updatedFT : ft
      ));
      toast({ title: '故障树图片已上传' });
    } else {
      toast({ title: '上传失败', variant: 'destructive' });
    }
  }, [selectedFaultTree]);

  const handleFaultTreeImageRemove = useCallback(async () => {
    if (!selectedFaultTree) return;
    
    const updatedFT = { ...selectedFaultTree, imageUrl: null };
    await saveFaultTree(updatedFT);
    setFaultTrees(prev => prev.map(ft => 
      ft.id === selectedFaultTree.id ? updatedFT : ft
    ));
    toast({ title: '故障树图片已移除' });
  }, [selectedFaultTree]);

  const handleBowTieEventClick = useCallback((event: BowTieEvent) => {
    if (event.tagId) {
      onTagClick?.(event.tagId);
    }
  }, [onTagClick]);

  return (
    <div className={`border-t border-border bg-card transition-all duration-300 ${isExpanded ? 'h-72' : 'h-10'}`}>
      {/* Header / Toggle */}
      <div
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Triangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-foreground">安全分析</span>
          <span className="text-xs text-muted-foreground">(Fault Tree & Bow-Tie)</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(100%-40px)] px-4 pb-4">
          <Tabs defaultValue="fault-tree" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="fault-tree" className="text-xs gap-1">
                <TreeDeciduous className="h-3 w-3" />
                Fault Tree
              </TabsTrigger>
              <TabsTrigger value="bow-tie" className="text-xs gap-1">
                <Triangle className="h-3 w-3" />
                Bow-Tie
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="fault-tree" className="flex-1 mt-2 flex flex-col gap-2">
              {/* Fault tree selector */}
              <div className="flex items-center gap-2">
                <Select value={selectedFaultTreeId} onValueChange={setSelectedFaultTreeId}>
                  <SelectTrigger className="h-8 text-xs w-48">
                    <SelectValue placeholder="选择故障树" />
                  </SelectTrigger>
                  <SelectContent>
                    {faultTrees.map(ft => (
                      <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Fault tree viewer */}
              <div className="flex-1">
                {selectedFaultTree ? (
                  <FaultTreeViewer
                    faultTree={selectedFaultTree}
                    isEditMode={isEditMode}
                    onImageUpload={handleFaultTreeImageUpload}
                    onImageRemove={handleFaultTreeImageRemove}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    请选择一个故障树
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="bow-tie" className="flex-1 mt-2 flex flex-col gap-2">
              {/* Bow-tie selector */}
              <div className="flex items-center gap-2">
                <Select value={selectedBowTieId} onValueChange={setSelectedBowTieId}>
                  <SelectTrigger className="h-8 text-xs w-48">
                    <SelectValue placeholder="选择Bow-Tie图" />
                  </SelectTrigger>
                  <SelectContent>
                    {bowTies.map(bt => (
                      <SelectItem key={bt.id} value={bt.id}>{bt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bow-tie viewer */}
              <div className="flex-1">
                {selectedBowTie ? (
                  <BowTieViewer
                    bowTie={selectedBowTie}
                    tags={tags}
                    onEventClick={handleBowTieEventClick}
                    onTopEventHover={onHoveredAlarmTagChange}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    请选择一个Bow-Tie图
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SafetyAnalysisPanel;
