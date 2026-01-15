import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/contexts/AuthContext';

export interface UserWithRole {
  id: string;
  name: string;
  email?: string;
  employee_id: string | null;
  department: string | null;
  role: AppRole;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  employee_id?: string;
  department?: string;
  role?: AppRole;
}

export interface UpdateProfileData {
  name?: string;
  employee_id?: string;
  department?: string;
}

export const getAllUsersWithRoles = async (): Promise<UserWithRole[]> => {
  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  // Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    throw rolesError;
  }

  // Combine profiles with roles
  const usersWithRoles: UserWithRole[] = profiles.map(profile => {
    const userRole = roles.find(r => r.user_id === profile.id);
    return {
      id: profile.id,
      name: profile.name,
      employee_id: profile.employee_id,
      department: profile.department,
      role: (userRole?.role as AppRole) || 'viewer',
      created_at: profile.created_at,
    };
  });

  return usersWithRoles;
};

export const updateUserRole = async (userId: string, newRole: AppRole): Promise<void> => {
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserData): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-user-manager', {
    body: { action: 'createUser', data: userData }
  });

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-user-manager', {
    body: { action: 'deleteUser', data: { userId } }
  });

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-user-manager', {
    body: { action: 'updatePassword', data: { userId, newPassword } }
  });

  if (error) {
    console.error('Error resetting password:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

export const updateUserProfile = async (userId: string, profileData: UpdateProfileData): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-user-manager', {
    body: { action: 'updateProfile', data: { userId, ...profileData } }
  });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

export const roleOptions: { value: AppRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'operator', label: '操作员' },
  { value: 'viewer', label: '观察者' },
];

export const departmentOptions = [
  '工艺部',
  '仪表部',
  '电气部',
  '安环部',
  '机修部',
  '质检部',
  '生产部',
];
