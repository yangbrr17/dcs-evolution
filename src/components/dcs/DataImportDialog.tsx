import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { parseHistoryCSV, importTagHistory, getHistoryStats, clearTagHistory } from '@/services/tagDataService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface ImportStats {
  totalRecords: number;
  uniqueTags: string[];
  timeRange: { start: Date | null; end: Date | null };
}

export const DataImportDialog = ({ open, onClose, onImportComplete }: DataImportDialogProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: number } | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);

  // Load stats when dialog opens
  const loadStats = useCallback(async () => {
    try {
      const data = await getHistoryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Load stats on open
  useState(() => {
    if (open) {
      loadStats();
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('请上传CSV格式文件');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      const records = parseHistoryCSV(content);

      if (records.length === 0) {
        toast.error('文件中没有有效数据');
        return;
      }

      toast.info(`正在导入 ${records.length} 条记录...`);

      const result = await importTagHistory(records);
      setImportResult(result);

      if (result.errors === 0) {
        toast.success(`成功导入 ${result.inserted} 条记录`);
      } else {
        toast.warning(`导入完成：${result.inserted} 条成功，${result.errors} 条失败`);
      }

      // Refresh stats
      await loadStats();
      onImportComplete?.();

    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `tagId,timestamp,value
TI-101,2026-01-15T10:00:00Z,520.5
TI-101,2026-01-15T10:01:00Z,521.2
TI-101,2026-01-15T10:02:00Z,519.8
PI-102,2026-01-15T10:00:00Z,185.3
PI-102,2026-01-15T10:01:00Z,186.1`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (!confirm('确定要清除所有历史数据吗？此操作不可恢复。')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearTagHistory();
      toast.success('历史数据已清除');
      setStats(null);
      setImportResult(null);
      await loadStats();
      onImportComplete?.();
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('清除失败');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            导入历史数据
          </DialogTitle>
          <DialogDescription>
            上传CSV文件导入真实的标签历史数据，系统将自动生成预测值
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
              ${isImporting ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            
            {isImporting ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">正在导入...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">拖放CSV文件到此处</p>
                <p className="text-xs text-muted-foreground">或点击选择文件</p>
              </div>
            )}
          </div>

          {/* Format hint */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">CSV格式要求：</p>
            <code className="text-xs font-mono">tagId,timestamp,value</code>
          </div>

          {/* Import result */}
          {importResult && (
            <div className={`rounded-lg p-3 flex items-start gap-2 ${
              importResult.errors === 0 
                ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
            }`}>
              {importResult.errors === 0 ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">
                <p>导入完成</p>
                <p className="text-xs opacity-80">
                  成功: {importResult.inserted} 条
                  {importResult.errors > 0 && ` | 失败: ${importResult.errors} 条`}
                </p>
              </div>
            </div>
          )}

          {/* Current stats */}
          {stats && stats.totalRecords > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">已导入数据统计</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>• 总记录数：{stats.totalRecords.toLocaleString()} 条</p>
                <p>• 标签数量：{stats.uniqueTags.length} 个</p>
                {stats.timeRange.start && stats.timeRange.end && (
                  <p>• 时间范围：{format(stats.timeRange.start, 'yyyy-MM-dd HH:mm', { locale: zhCN })} ~ {format(stats.timeRange.end, 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-1" />
              下载模板
            </Button>

            <div className="flex gap-2">
              {stats && stats.totalRecords > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearData}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  清除数据
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onClose}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
