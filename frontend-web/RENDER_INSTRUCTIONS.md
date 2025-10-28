# Instrucciones para Desplegar en Render

## Configuración en Render

### Build Command:
```bash
npm run build
```

### Start Command:
```bash
npm run serve
```

### Environment Variables (Si las necesitas):
- `REACT_APP_API_URL` = `https://exilic-unconditionally-channing.ngrok-free.dev`

## Comandos necesarios en el repositorio

Ya están instalados:
- ✅ `react-scripts@5.0.1`
- ✅ `serve@14.2.5`
- ✅ `package-lock.json` actualizado

## Para actualizar en Render

1. Push los cambios:
```bash
git add .
git commit -m "Add serve for Render deployment"
git push origin main
```

2. En el dashboard de Render:
   - Ve a tu servicio
   - Usa los comandos de arriba
   - Deploy automático

## Notas Importantes

- El build creará una carpeta `build/` con los archivos estáticos
- `serve` sirve esos archivos estáticos en el puerto 3000
- Socket.IO se conectará a ngrok automáticamente
- Las variables de entorno se configuran en el dashboard de Render

