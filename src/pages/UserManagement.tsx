import React, { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Settings, Eye, Users, Save } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAllUsersWithRoles, 
  updateUserRole, 
  roleOptions,
  UserWithRole 
} from '@/services/userManagementService';

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  operator: <Settings className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500',
  operator: 'bg-blue-500',
  viewer: 'bg-gray-500',
};

const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, AppRole>>({});
  const [saving, setSaving] = useState(false);

  const isCurrentUser = (userId: string) => currentUser?.id === userId;

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      toast.error('您没有权限访问此页面');
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const data = await getAllUsersWithRoles();
        setUsers(data);
      } catch (error) {
        toast.error('加载用户列表失败');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading, isAdmin, navigate]);

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    const originalRole = users.find(u => u.id === userId)?.role;
    if (originalRole === newRole) {
      // Remove from pending if reverting to original
      const { [userId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } else {
      setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
    }
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('没有待保存的更改');
      return;
    }

    setSaving(true);
    try {
      for (const [userId, newRole] of Object.entries(pendingChanges)) {
        await updateUserRole(userId, newRole);
      }
      
      // Update local state
      setUsers(prev => prev.map(user => ({
        ...user,
        role: pendingChanges[user.id] || user.role,
      })));
      setPendingChanges({});
      toast.success('角色更新成功');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentRole = (user: UserWithRole): AppRole => {
    return pendingChanges[user.id] || user.role;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              用户权限管理
            </h1>
            <p className="text-muted-foreground text-sm">管理系统用户的角色和权限</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {users.length} 位用户</CardDescription>
              </div>
              {Object.keys(pendingChanges).length > 0 && (
                <Button onClick={handleSaveChanges} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : `保存更改 (${Object.keys(pendingChanges).length})`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>工号</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>当前角色</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const currentRole = getCurrentRole(user);
                  const hasChange = pendingChanges[user.id] !== undefined;
                  
                  return (
                    <TableRow key={user.id} className={hasChange ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.employee_id || '-'}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[currentRole]} text-white`}>
                          {roleIcons[currentRole]}
                          <span className="ml-1">
                            {roleOptions.find(r => r.value === currentRole)?.label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isCurrentUser(user.id) ? (
                          <span className="text-xs text-muted-foreground">当前用户</span>
                        ) : (
                          <Select
                            value={currentRole}
                            onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {roleIcons[option.value]}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">角色权限说明</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 text-white"><Shield className="w-3 h-3 mr-1" />管理员</Badge>
              <span>所有操作权限，包括用户管理、删除大事记、查看所有操作日志</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white"><Settings className="w-3 h-3 mr-1" />操作员</Badge>
              <span>编辑数据、确认报警、添加大事记、班次交接</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-500 text-white"><Eye className="w-3 h-3 mr-1" />观察者</Badge>
              <span>仅查看权限，不能修改任何数据</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
