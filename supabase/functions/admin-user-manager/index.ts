import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert username to internal email format
const usernameToEmail = (username: string): string => {
  return `${username.toLowerCase().trim()}@internal.local`;
};

interface CreateUserData {
  username: string;
  password: string;
  name: string;
  employee_id?: string;
  department?: string;
  role?: 'admin' | 'operator' | 'viewer';
}

interface UpdatePasswordData {
  userId: string;
  newPassword: string;
}

interface UpdateProfileData {
  userId: string;
  name?: string;
  employee_id?: string;
  department?: string;
}

interface DeleteUserData {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse request body
    const { action, data } = await req.json();
    console.log('Action:', action);

    // Special recovery action - no auth required (for emergency recovery only)
    if (action === 'recoveryResetPassword') {
      const { userName, newPassword, newUsername } = data as { userName: string; newPassword: string; newUsername?: string };
      
      // Find user by name in profiles
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('name', userName)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: `User "${userName}" not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the user's actual email from auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      console.log('Auth user info:', authUser?.user?.email);

      // Build update object
      const updateData: { password: string; email?: string } = { password: newPassword };
      
      // If newUsername provided, also update email to the internal format
      if (newUsername) {
        updateData.email = usernameToEmail(newUsername);
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        updateData
      );

      if (updateError) {
        console.error('Recovery reset password error:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: `Password reset for user "${userName}"`, oldEmail: authUser?.user?.email, newEmail: updateData.email }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For all other actions, require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callingUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      console.error('Role check failed:', roleError, roleData);
      return new Response(
        JSON.stringify({ error: 'Only administrators can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'createUser': {
        const userData = data as CreateUserData;
        
        // Convert username to internal email
        const email = usernameToEmail(userData.username);
        
        // Create user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: userData.password,
          email_confirm: true, // Skip email verification
          user_metadata: {
            name: userData.name,
            username: userData.username.toLowerCase().trim(),
            employee_id: userData.employee_id || null,
            department: userData.department || null,
          },
        });

        if (createError) {
          console.error('Create user error:', createError);
          // Handle duplicate username error
          const errorMessage = createError.message.includes('already been registered')
            ? '该用户名已被使用'
            : createError.message;
          return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If a non-default role was specified, update it
        if (userData.role && userData.role !== 'viewer' && newUser.user) {
          const { error: roleUpdateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: userData.role })
            .eq('user_id', newUser.user.id);

          if (roleUpdateError) {
            console.error('Role update error:', roleUpdateError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'deleteUser': {
        const deleteData = data as DeleteUserData;

        // Prevent self-deletion
        if (deleteData.userId === callingUser.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete your own account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete user (cascade will handle profile and roles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          deleteData.userId
        );

        if (deleteError) {
          console.error('Delete user error:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'updatePassword': {
        const passwordData = data as UpdatePasswordData;

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          passwordData.userId,
          { password: passwordData.newPassword }
        );

        if (updateError) {
          console.error('Update password error:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'updateProfile': {
        const profileData = data as UpdateProfileData;

        const updateFields: Record<string, string | null> = {};
        if (profileData.name !== undefined) updateFields.name = profileData.name;
        if (profileData.employee_id !== undefined) updateFields.employee_id = profileData.employee_id || null;
        if (profileData.department !== undefined) updateFields.department = profileData.department || null;

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateFields)
          .eq('id', profileData.userId);

        if (updateError) {
          console.error('Update profile error:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
