# Panel de Administrador - Frontend

Este es el frontend del sistema de gestión de preguntas y respuestas con sidebar de navegación.

## Características

- 🏠 **Panel de Administrador**: Gestión completa de preguntas y respuestas
- ⭐ **Calificaciones**: Sistema de gestión de calificaciones (en desarrollo)
- 📱 **Responsive**: Funciona en desktop y móvil
- 🎨 **Diseño elegante**: Interfaz moderna con gradientes y animaciones

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
REACT_APP_API_URL=http://localhost:4000
```

**Nota**: El backend debe estar corriendo en el puerto 4000. El backend usa Supabase como base de datos y está configurado en `../ChatBot/questionsApi.js`.

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