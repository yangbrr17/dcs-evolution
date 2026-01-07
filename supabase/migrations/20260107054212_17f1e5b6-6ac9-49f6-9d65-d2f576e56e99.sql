-- 将王心怡升级为管理员
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'c6bf3f18-b58a-48a0-b2bb-3d09517217be';