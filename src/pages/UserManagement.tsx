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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Settings, Eye, Users, Save, Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAllUsersWithRoles, 
  updateUserRole, 
  createUser,
  deleteUser,
  resetUserPassword,
  updateUserProfile,
  roleOptions,
  departmentOptions,
  UserWithRole,
  CreateUserData,
  UpdateProfileData
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

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    username: '',
    password: '',
    name: '',
    employee_id: '',
    department: '',
    role: 'viewer'
  });

  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editData, setEditData] = useState<UpdateProfileData>({});

  // Password reset dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);

  const isCurrentUser = (userId: string) => currentUser?.id === userId;

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

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      toast.error('您没有权限访问此页面');
      navigate('/');
      return;
    }

    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading, isAdmin, navigate]);

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    const originalRole = users.find(u => u.id === userId)?.role;
    if (originalRole === newRole) {
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

  // Create user handlers
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast.error('请填写必填项：用户名、密码、姓名');
      return;
    }

    // Validate username format (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(newUser.username)) {
      toast.error('用户名只能包含字母、数字和下划线');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('密码至少需要6位字符');
      return;
    }

    setCreateLoading(true);
    try {
      await createUser(newUser);
      toast.success('用户创建成功');
      setCreateDialogOpen(false);
      setNewUser({
        username: '',
        password: '',
        name: '',
        employee_id: '',
        department: '',
        role: 'viewer'
      });
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '创建用户失败');
    } finally {
      setCreateLoading(false);
    }
  };

  // Edit user handlers
  const openEditDialog = (user: UserWithRole) => {
    setEditingUser(user);
    setEditData({
      name: user.name,
      employee_id: user.employee_id || '',
      department: user.department || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingUser) return;

    if (!editData.name?.trim()) {
      toast.error('姓名不能为空');
      return;
    }

    setEditLoading(true);
    try {
      await updateUserProfile(editingUser.id, editData);
      toast.success('用户信息更新成功');
      setEditDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  // Password reset handlers
  const openPasswordDialog = (userId: string) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!passwordUserId) return;

    if (newPassword.length < 6) {
      toast.error('密码至少需要6位字符');
      return;
    }

    setPasswordLoading(true);
    try {
      await resetUserPassword(passwordUserId, newPassword);
      toast.success('密码重置成功');
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || '密码重置失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete user handlers
  const openDeleteDialog = (user: UserWithRole) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      await deleteUser(deletingUser.id);
      toast.success('用户已删除');
      setDeleteDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加用户
          </Button>
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
                  <TableHead>角色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const currentRole = getCurrentRole(user);
                  const hasChange = pendingChanges[user.id] !== undefined;
                  const isCurrent = isCurrentUser(user.id);
                  
                  return (
                    <TableRow key={user.id} className={hasChange ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.employee_id || '-'}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        {isCurrent ? (
                          <Badge className={`${roleColors[currentRole]} text-white`}>
                            {roleIcons[currentRole]}
                            <span className="ml-1">
                              {roleOptions.find(r => r.value === currentRole)?.label}
                            </span>
                          </Badge>
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
                      <TableCell className="text-right">
                        {isCurrent ? (
                          <span className="text-xs text-muted-foreground">当前用户</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              title="编辑信息"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPasswordDialog(user.id)}
                              title="重置密码"
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(user)}
                              className="text-destructive hover:text-destructive"
                              title="删除用户"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加新用户</DialogTitle>
            <DialogDescription>
              创建一个新的系统用户账户
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名 * （字母、数字、下划线）</Label>
              <Input
                id="username"
                type="text"
                placeholder="例如：ybr21"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码 * （至少6位）</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                placeholder="用户姓名"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employee_id">工号</Label>
              <Input
                id="employee_id"
                placeholder="员工工号"
                value={newUser.employee_id}
                onChange={(e) => setNewUser(prev => ({ ...prev, employee_id: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">部门</Label>
              <Select
                value={newUser.department}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as AppRole }))}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUser} disabled={createLoading}>
              {createLoading ? '创建中...' : '创建用户'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
            <DialogDescription>
              修改用户 {editingUser?.name} 的基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input
                id="edit-name"
                value={editData.name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-employee_id">工号</Label>
              <Input
                id="edit-employee_id"
                value={editData.employee_id || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, employee_id: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">部门</Label>
              <Select
                value={editData.department || ''}
                onValueChange={(value) => setEditData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateProfile} disabled={editLoading}>
              {editLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">新密码 （至少6位）</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleResetPassword} disabled={passwordLoading}>
              {passwordLoading ? '重置中...' : '重置密码'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用户 <strong>{deletingUser?.name}</strong> 吗？此操作不可撤销，该用户的所有数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
