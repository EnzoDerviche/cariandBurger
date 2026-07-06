-- Crear usuario en Supabase Dashboard > Authentication > Users > Add user
-- Luego ejecutar (reemplazar el email):

-- UPDATE profiles
-- SET role = 'super_admin', organization_id = NULL
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
