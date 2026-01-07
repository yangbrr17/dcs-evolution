import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Clock, ChevronDown, Shield, Eye, Settings } from 'lucide-react';
import { getCurrentShift, Shift, getShiftType } from '@/services/shiftService';
import { logOperation } from '@/services/operationLogService';
import { useNavigate } from 'react-router-dom';

interface UserMenuProps {
  onShiftHandover: () => void;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'bg-red-500' },
  operator: { label: '操作员', color: 'bg-blue-500' },
  viewer: { label: '观察者', color: 'bg-gray-500' },
};

const UserMenu: React.FC<UserMenuProps> = ({ onShiftHandover }) => {
  const { user, profile, role, signOut, canEdit } = useAuth();
  const navigate = useNavigate();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (user) {
      getCurrentShift(user.id).then(setCurrentShift);
    }
  }, [user]);

  const handleSignOut = async () => {
    if (user && profile) {
      await logOperation(user.id, profile.name, 'logout', {});
    }
    await signOut();
    navigate('/auth');
  };

  if (!user || !profile) return null;

  const roleInfo = role ? roleLabels[role] : roleLabels.viewer;
  const RoleIcon = role === 'admin' ? Shield : role === 'operator' ? Settings : Eye;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium">{profile.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <RoleIcon className="w-3 h-3" />
                {roleInfo.label}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{profile.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {profile.employee_id && `工号: ${profile.employee_id}`}
            </span>
            {profile.department && (
              <span className="text-xs font-normal text-muted-foreground">
                部门: {profile.department}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Role Badge */}
        <div className="px-2 py-1.5">
          <Badge className={`${roleInfo.color} text-white`}>
            <RoleIcon className="w-3 h-3 mr-1" />
            {roleInfo.label}
          </Badge>
        </div>
        
        {/* Current Shift Info */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {currentShift 
                ? `${currentShift.shift_type} · ${new Date(currentShift.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 开始`
                : `当前班次: ${getShiftType()}`
              }
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* User Management - Only for admins */}
        {role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/user-management')}>
            <Shield className="w-4 h-4 mr-2" />
            用户管理
          </DropdownMenuItem>
        )}
        
        {/* Shift Handover - Only for operators and admins */}
        {canEdit() && (
          <DropdownMenuItem onClick={onShiftHandover}>
            <Clock className="w-4 h-4 mr-2" />
            班次交接
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
          <LogOut className="w-4 h-4 mr-2" />
          登出系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
