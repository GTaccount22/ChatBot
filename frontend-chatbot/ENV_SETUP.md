# Configuración de Variables de Entorno

Para configurar las variables de entorno de Supabase, crea un archivo `.env` en la raíz del proyecto `frontend-chatbot` con el siguiente contenido:

```
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_service_role_aqui
```

## Cómo obtener estas credenciales:

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. En el panel lateral, ve a "Settings" > "API"
3. Copia:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

## Importante:
- El archivo `.env` debe estar en la raíz del proyecto `frontend-chatbot`
- No subas el archivo `.env` a Git (ya está en .gitignore)
- Las variables deben empezar con `EXPO_PUBLIC_` para ser accesibles en el cliente
