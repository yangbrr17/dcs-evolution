import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface ShiftEventFormProps {
  onSubmit: (event: {
    event_type: string;
    title: string;
    description: string;
    severity: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const eventTypes = [
  { value: 'general', label: '一般事项' },
  { value: 'emergency', label: '紧急情况' },
  { value: 'maintenance', label: '维护保养' },
  { value: 'inspection', label: '巡检记录' },
  { value: 'other', label: '其他' },
];

const severityOptions = [
  { value: 'info', label: '普通', color: 'text-blue-500' },
  { value: 'warning', label: '注意', color: 'text-yellow-500' },
  { value: 'critical', label: '重要', color: 'text-red-500' },
];

const ShiftEventForm: React.FC<ShiftEventFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [eventType, setEventType] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      event_type: eventType,
      title: title.trim(),
      description: description.trim(),
      severity,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">添加大事记</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="event-type" className="text-xs text-muted-foreground">
            事件类型
          </Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger id="event-type" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="severity" className="text-xs text-muted-foreground">
            重要程度
          </Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger id="severity" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title" className="text-xs text-muted-foreground">
          事件标题
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="简要描述事件..."
          className="h-8 text-sm"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-xs text-muted-foreground">
          详细描述 (可选)
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="补充详细信息..."
          rows={2}
          className="text-sm resize-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting}>
          <Plus className="h-3 w-3 mr-1" />
          {isSubmitting ? '添加中...' : '添加'}
        </Button>
      </div>
    </form>
  );
};

export default ShiftEventForm;
