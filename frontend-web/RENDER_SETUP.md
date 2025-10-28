# Configuración Correcta para Render

## Settings en Render Dashboard:

### Root Directory:
```
frontend-web
```

### Build Command:
```bash
npm run build
```

### Start Command:
```bash
npm run serve
```

### Environment Variables:
```
REACT_APP_API_URL=https://exilic-unconditionally-channing.ngrok-free.dev
```

## Importante

- ✅ El Root Directory debe ser `frontend-web` (no dejar vacío)
- ✅ Render ejecutará automáticamente `npm install` antes del build
- ✅ El build se hace dentro de `frontend-web/`
- ✅ `serve` servirá la carpeta `build/` generada

## Si Render dice "No build command specified"

1. En el dashboard de Render, ve a Settings
2. Busca "Build Command" y pon: `npm run build`
3. Busca "Start Command" y pon: `npm run serve`
4. Busca "Root Directory" y pon: `frontend-web`
5. Guarda y vuelve a hacer Deploy

