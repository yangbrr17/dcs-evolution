import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/contexts/AuthContext';

export interface UserWithRole {
  id: string;
  name: string;
  employee_id: string | null;
  department: string | null;
  role: AppRole;
  created_at: string;
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

export const roleOptions: { value: AppRole; label: string }[] = [
  { value: 'admin', label: '管理员' },
  { value: 'operator', label: '操作员' },
  { value: 'viewer', label: '观察者' },
];
