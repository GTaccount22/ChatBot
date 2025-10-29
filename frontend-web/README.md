# Panel de Administrador - Frontend

Este es el frontend del sistema de gestión de preguntas y respuestas con sidebar de navegación.

## Características

- 🏠 **Panel de Administrador**: Gestión completa de preguntas y respuestas
- ⭐ **Calificaciones**: Sistema de gestión de calificaciones (en desarrollo)
- 📱 **Responsive**: Funciona en desktop y móvil
- 🎨 **Diseño elegante**: Interfaz moderna con gradientes y animaciones

## Configuración

### Variables de Entorno

#### Desarrollo Local

Crea un archivo `.env` en la raíz del proyecto con:

```env
REACT_APP_API_URL=http://localhost:4000
```

**Nota**: El backend debe estar corriendo en el puerto 4000. El backend usa Supabase como base de datos y está configurado en `../ChatBot/questionsApi.js`.

#### Producción (Render)

Para desplegar en Render, configura la variable de entorno en tu servicio de frontend:

1. **En Render Dashboard**:
   - Ve a tu servicio de frontend
   - Settings → Environment Variables
   - Agrega: `REACT_APP_API_URL` = `https://tu-backend.onrender.com`
   - ⚠️ **IMPORTANTE**: Asegúrate de usar la URL completa del backend (sin trailing slash)

2. **Ejemplo de valores**:
   ```
   REACT_APP_API_URL=https://mi-backend.onrender.com
   ```

3. **Verificación**:
   - Al iniciar la aplicación, verás en la consola del navegador:
     ```
     🔗 API_URL configurada: https://mi-backend.onrender.com
     🔗 Modo: PRODUCCIÓN (Render)
     ```

**⚠️ Importante**: 
- La URL debe ser la del backend en Render, NO la del frontend
- No debe terminar con `/`
- Todas las peticiones se hacen relativas al `baseURL` configurado en `src/services/api.js`
- Axios automáticamente combina `baseURL + ruta relativa` = URL completa

#### Verificación en Producción

Después de configurar la variable de entorno en Render y hacer redeploy:

1. **Abre tu aplicación** en el navegador (ej: `https://chatbot-4gaq.onrender.com`)

2. **Abre la consola del navegador** (F12 → Console)

3. **Verifica los logs al iniciar**:
   ```
   🔗 API_URL configurada: https://tu-backend.onrender.com
   🔗 REACT_APP_API_URL: https://tu-backend.onrender.com
   🔗 Modo: PRODUCCIÓN (Render)
   ```

4. **Verifica los requests** cuando se cargan los datos:
   ```
   🌐 Request: GET https://tu-backend.onrender.com/api/categories
      baseURL: https://tu-backend.onrender.com
      url relativa: /api/categories
   ✅ Response: GET /api/categories { status: 200, isArray: true, dataLength: 5 }
   ```

5. **Si ves errores**, verifica:
   - ¿La URL apunta correctamente al backend? (debe ser diferente del frontend)
   - ¿El backend está corriendo en Render?
   - ¿El endpoint `/api/categories` existe en tu backend?
   - ¿Hay problemas de CORS? (debe estar configurado en el backend)

#### Cómo funciona internamente

```javascript
// En src/services/api.js
const API_URL = "https://tu-backend.onrender.com";
const api = axios.create({ baseURL: API_URL });

// En src/services/categoryService.js
export const getCategories = async () => {
  // Esta ruta relativa se combina con baseURL
  const res = await api.get('/api/categories');
  // Axios internamente hace: API_URL + '/api/categories'
  // Resultado: https://tu-backend.onrender.com/api/categories
};
```

### Instalación

```bash
npm install
```

### Ejecución

```bash
npm start
```

## Modo Demo

Si el backend no está disponible, la aplicación funcionará en modo demo con datos de ejemplo. Se mostrará un banner amarillo indicando que está en modo demo.

## Estructura del Proyecto

```
src/
├── App.js                 # Componente principal con sidebar
├── services/
│   └── questionService.js # Servicio para API de preguntas
└── ...
```

## API Endpoints

El frontend se conecta al backend en `../ChatBot/questionsApi.js` con los siguientes endpoints:

- `GET /api/questions` - Obtener todas las preguntas
- `POST /api/questions` - Crear nueva pregunta
- `PUT /api/questions/:id` - Actualizar pregunta
- `DELETE /api/questions/:id` - Eliminar pregunta

### Base de Datos

El backend usa **Supabase** con la tabla `questions` que contiene:
- `id` (serial primary key)
- `category` (text)
- `question` (text)
- `answer` (text)

## Tecnologías Utilizadas

- React 19
- Material-UI (MUI)
- Axios para peticiones HTTP
- CSS-in-JS con Emotion