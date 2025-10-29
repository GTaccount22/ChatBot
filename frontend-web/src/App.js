import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import GradeIcon from "@mui/icons-material/Grade";
import HomeIcon from "@mui/icons-material/Home";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  Drawer,
  Fade,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  Slide,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { COLOR_PALETTES, COMMON_STYLES, SELECT_MENU_PROPS } from "./constants/styles";
import { createCategory, deleteCategory, getCategories } from "./services/categoryService";
import { createQuestion, deleteQuestion, getQuestions, toggleQuestionState, updateQuestion } from "./services/questionService";
import { getRatings } from "./services/ratingService";

// Función helper para Google Analytics
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Hook personalizado para animar elementos al hacer scroll
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Abrir en desktop, cerrar en móvil
  const [activeTab, setActiveTab] = useState('home');
  
  // Admin panel state
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questionStates, setQuestionStates] = useState({});
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });
  
  // Estados para Socket.IO
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Ratings state
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterModalidad, setSelectedFilterModalidad] = useState("");

  const colors = isDarkMode ? COLOR_PALETTES.dark : COLOR_PALETTES.light;

  // Función para probar si ngrok está disponible
  const testNgrokConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://exilic-unconditionally-channing.ngrok-free.dev/api/usuarios-por-dia', {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    loadQuestions();
    loadRatings(true); // Cargar calificaciones solo una vez al inicio
    loadCategories(); // Cargar categorías al inicio
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Inicializar estados de preguntas cuando se cargan - SIMPLIFICADO
  useEffect(() => {
    if (questions.length > 0) {
      const initialStates = {};
      questions.forEach(q => {
        initialStates[q.id] = q.is_active !== undefined ? q.is_active : true;
      });
      setQuestionStates(initialStates);
    }
  }, [questions]);

  const loadQuestions = async () => {
    try {
      const data = await getQuestions();
      console.log('📋 Data recibida en loadQuestions:', data);
      console.log('📋 Type:', typeof data);
      console.log('📋 Is array?', Array.isArray(data));
      // Asegurar que siempre sea un array
      const questionsArray = Array.isArray(data) ? data : [];
      console.log('📋 Estableciendo questions:', questionsArray.length, 'preguntas');
      setQuestions(questionsArray);
      // Las categorías se cargan por separado con loadCategories()
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      // En caso de error, establecer un array vacío como fallback
      setQuestions([]);
    }
  };

  // Función helper para obtener el nombre de la categoría
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name_category : 'Sin categoría';
  };

  const loadRatings = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await getRatings();
      console.log('⭐ Data recibida en loadRatings:', data);
      console.log('⭐ Type:', typeof data);
      console.log('⭐ Is array?', Array.isArray(data));
      // Asegurar que siempre sea un array
      const ratingsArray = Array.isArray(data) ? data : [];
      console.log('⭐ Estableciendo ratings:', ratingsArray.length, 'calificaciones');
      setRatings(ratingsArray);
    } catch (error) {
      console.error('❌ Error loading ratings:', error);
      // En caso de error, establecer un array vacío como fallback
      setRatings([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Funciones para gestionar categorías
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      console.log('🗂️ Data recibida en loadCategories:', data);
      console.log('🗂️ Type:', typeof data);
      console.log('🗂️ Is array?', Array.isArray(data));
      // Asegurar que siempre sea un array
      const categoriesArray = Array.isArray(data) ? data : [];
      console.log('🗂️ Estableciendo categories:', categoriesArray.length, 'categorías');
      setCategories(categoriesArray);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // En caso de error, establecer un array vacío como fallback
      setCategories([]);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await createCategory({ name_category: newCategory.trim() });
      trackEvent('create_category', { category_name: newCategory.trim() });
      setNewCategory("");
      await loadCategories(); // Recargar categorías
      await loadQuestions(); // Recargar preguntas para actualizar el dropdown
      alert(`Categoría "${newCategory.trim()}" creada exitosamente!`);
    } catch (error) {
      console.error('Error creating category:', error);
      
      // Si la categoría ya existe, mostrar mensaje específico
      if (error.response?.status === 500 && error.response?.data?.details?.includes('duplicate key')) {
        alert(`La categoría "${newCategory.trim()}" ya existe.`);
      } else {
        alert('Error al crear la categoría. Intenta con otro nombre.');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      trackEvent('delete_category', { category_id: categoryId });
      await loadCategories();
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Inicializar Socket.IO con detección automática de ngrok
  useEffect(() => {
    let mounted = true;
    let currentSocket = null;
    
    const initializeSocket = async () => {
      try {
        // URL de producción para Socket.IO (usa la misma que API_URL)
        const API_URL = process.env.REACT_APP_API_URL || "https://exilic-unconditionally-channing.ngrok-free.dev";
        const socketUrl = API_URL;
        
        console.log(`🔄 Conectando Socket.IO a: ${socketUrl}`);
        
        currentSocket = io(socketUrl, {
          transports: ["polling", "websocket"],
          timeout: 15000,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          upgrade: true,
          rememberUpgrade: true,
          forceNew: true,
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        if (!mounted) return;
        
        setSocket(currentSocket);

        // Eventos de conexión
        currentSocket.on('connect', () => {
          console.log('✅ Conectado a Socket.IO');
          if (mounted) setSocketConnected(true);
        });

        currentSocket.on('disconnect', () => {
          console.log('❌ Desconectado de Socket.IO');
          if (mounted) setSocketConnected(false);
        });

        currentSocket.on('connect_error', (error) => {
          console.error('❌ Error de conexión Socket.IO:', error);
          if (mounted) setSocketConnected(false);
        });

        // Eventos del servidor
        currentSocket.on('actualizar_calificaciones', (data) => {
          console.log('⭐ Nueva calificación recibida por Socket.IO:', data);
          if (mounted) {
            loadRatings(false); // Recargar sin mostrar loading para que sea instantáneo
            console.log('✅ Ratings actualizadas en tiempo real');
          }
        });
        
        // Evento genérico para cualquier actualización
        currentSocket.on('update', () => {
          console.log('📊 Actualización general recibida');
          if (mounted) {
            loadRatings(false);
          }
        });
        
        // Escuchar cualquier evento para debugging
        currentSocket.onAny((eventName, ...args) => {
          console.log(`📡 Evento Socket.IO recibido: ${eventName}`, args);
        });

      } catch (error) {
        console.error('Error inicializando Socket.IO:', error);
        if (mounted) setSocketConnected(false);
      }
    };

    initializeSocket();

    // Cleanup
    return () => {
      mounted = false;
      if (currentSocket) {
        console.log('🔌 Cerrando conexión Socket.IO');
        currentSocket.close();
      }
    };
  }, []); // Solo ejecutar una vez al montar

  const handleSubmit = async () => {
    const catToSend = category === "__new__" ? newCategory : category;

    if (!catToSend || !questionText || !answer) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Encontrar el ID de la categoría
    let categoryId;
    if (category === "__new__") {
      // Si es una nueva categoría, crear primero la categoría
      try {
        const newCategoryData = await createCategory({ name_category: newCategory.trim() });
        categoryId = newCategoryData.id;
      } catch (error) {
        console.error('Error creating category:', error);
        
        // Si la categoría ya existe, informar y no continuar
        if (error.response?.status === 500 && error.response?.data?.details?.includes('duplicate key')) {
          alert(`La categoría "${newCategory.trim()}" ya existe. Por favor selecciona una categoría existente o usa un nombre diferente.`);
          // Limpiar campos automáticamente
          setCategory("");
          setNewCategory("");
          setQuestionText("");
          setAnswer("");
          return;
        } else {
          alert('Error al crear la categoría. Intenta con otro nombre.');
          // Limpiar campos automáticamente
          setCategory("");
          setNewCategory("");
          setQuestionText("");
          setAnswer("");
          return;
        }
      }
    } else {
      // Buscar el ID de la categoría existente
      const foundCategory = categories.find(cat => cat.name_category === catToSend);
      if (!foundCategory) {
        alert('Categoría no encontrada');
        // Limpiar campos automáticamente
        setCategory("");
        setNewCategory("");
        setQuestionText("");
        setAnswer("");
        return;
      }
      categoryId = foundCategory.id;
    }

    if (editingId) {
      await updateQuestion(editingId, { category_id: categoryId, question: questionText, answer });
      setEditingId(null);
      // Track evento de actualización
      trackEvent('update_question', {
        question_id: editingId,
        category: catToSend
      });
    } else {
      await createQuestion({ category_id: categoryId, question: questionText, answer });
      // Track evento de creación
      trackEvent('create_question', {
        category: catToSend
      });
    }

    setCategory("");
    setNewCategory("");
    setQuestionText("");
    setAnswer("");
    loadQuestions();
    loadCategories(); // Recargar categorías por si se creó una nueva
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    // Buscar la categoría por ID en la lista de categorías
    const foundCategory = categories.find(cat => cat.id === q.category_id);
    if (foundCategory) {
      setCategory(foundCategory.name_category);
      setNewCategory("");
    } else {
      setCategory("__new__");
      setNewCategory("Sin categoría");
    }
    setQuestionText(q.question);
    setAnswer(q.answer);
  };

  const handleDelete = async (id) => {
    await deleteQuestion(id);
    trackEvent('delete_question', { question_id: id });
    loadQuestions();
    setDeleteDialogOpen(false);
    
    // Limpiar el formulario si se estaba editando la pregunta eliminada
    if (editingId === id) {
      console.log('Limpiando formulario después de eliminar pregunta:', id);
      setEditingId(null);
      setCategory("");
      setNewCategory("");
      setQuestionText("");
      setAnswer("");
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleQuestionState = async (questionId) => {
    try {
      const updatedQuestion = await toggleQuestionState(questionId);
      const isActive = updatedQuestion.is_active;
      trackEvent('toggle_question_state', { 
        question_id: questionId, 
        new_state: isActive ? 'active' : 'inactive' 
      });
      setQuestionStates(prev => ({
        ...prev,
        [questionId]: updatedQuestion.is_active
      }));
    } catch (error) {
      console.error('Error toggling question state:', error);
      alert('Error al cambiar el estado de la pregunta');
    }
  };

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const drawerWidth = isMobile ? 280 : 280;

  const menuItems = [
    { id: 'home', label: 'Gestor de Preguntas y Respuestas', icon: <HomeIcon /> },
    { id: 'ratings', label: 'Gestor de Calificaciones', icon: <GradeIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminPanel 
          questions={questions}
          categories={categories}
          category={category}
          setCategory={setCategory}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          questionText={questionText}
          setQuestionText={setQuestionText}
          answer={answer}
          setAnswer={setAnswer}
          editingId={editingId}
          setEditingId={setEditingId}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          deleteId={deleteId}
          setDeleteId={setDeleteId}
          selectedFilterCategory={selectedFilterCategory}
          setSelectedFilterCategory={setSelectedFilterCategory}
          handleSubmit={handleSubmit}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          confirmDelete={confirmDelete}
          loadQuestions={loadQuestions}
          handleCreateCategory={handleCreateCategory}
          handleDeleteCategory={handleDeleteCategory}
          categoryManagementOpen={categoryManagementOpen}
          setCategoryManagementOpen={setCategoryManagementOpen}
          colors={colors}
          questionStates={questionStates}
          handleToggleQuestionState={handleToggleQuestionState}
          capitalizeFirstLetter={capitalizeFirstLetter}
          getCategoryName={getCategoryName}
        />;
      case 'ratings':
        return <RatingsTab 
          ratings={ratings}
          loading={loading}
          selectedFilterModalidad={selectedFilterModalidad}
          setSelectedFilterModalidad={setSelectedFilterModalidad}
          colors={colors}
          loadRatings={loadRatings}
        />;
      default:
        return <AdminPanel 
          questions={questions}
          category={category}
          setCategory={setCategory}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          questionText={questionText}
          setQuestionText={setQuestionText}
          answer={answer}
          setAnswer={setAnswer}
          editingId={editingId}
          setEditingId={setEditingId}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          deleteId={deleteId}
          setDeleteId={setDeleteId}
          selectedFilterCategory={selectedFilterCategory}
          setSelectedFilterCategory={setSelectedFilterCategory}
          handleSubmit={handleSubmit}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          confirmDelete={confirmDelete}
          loadQuestions={loadQuestions}
          handleCreateCategory={handleCreateCategory}
          handleDeleteCategory={handleDeleteCategory}
          categoryManagementOpen={categoryManagementOpen}
          setCategoryManagementOpen={setCategoryManagementOpen}
          colors={colors}
          questionStates={questionStates}
          handleToggleQuestionState={handleToggleQuestionState}
          capitalizeFirstLetter={capitalizeFirstLetter}
          getCategoryName={getCategoryName}
        />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: colors.cardBackground,
            borderRight: `1px solid ${colors.borderColor}`,
            boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, textAlign: 'center', borderBottom: `1px solid ${colors.borderColor}` }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.textPrimary,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              letterSpacing: '0.05em',
              fontFamily: "'Playfair Display', serif"
            }}
          >
            Panel de Administrador
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.textSecondary,
              mt: 1,
              fontSize: { xs: '0.8rem', md: '0.9rem' }
            }}
          >
            Sistema de Gestión
          </Typography>
        </Box>
        
        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  setActiveTab(item.id);
                  trackEvent('switch_tab', { tab: item.id });
                  if (isMobile) setSidebarOpen(false);
                }}
                selected={activeTab === item.id}
                sx={{
                  borderRadius: 2,
                  backgroundColor: activeTab === item.id ? `${colors.buttonColor}20` : 'transparent',
                  border: activeTab === item.id ? `1px solid ${colors.buttonColor}` : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: `${colors.buttonColor}10`,
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: `${colors.buttonColor}20`,
                    '&:hover': {
                      backgroundColor: `${colors.buttonColor}30`,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === item.id ? colors.buttonColor : colors.textSecondary, minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: activeTab === item.id ? colors.textPrimary : colors.textSecondary,
                      fontWeight: activeTab === item.id ? 600 : 400,
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* Toggle de modo oscuro/claro */}
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${colors.borderColor}`,
          mt: 'auto'
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={(e) => {
                  const newMode = e.target.checked;
                  setIsDarkMode(newMode);
                  trackEvent('toggle_dark_mode', { mode: newMode ? 'dark' : 'light' });
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.buttonColor,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.buttonColor,
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isDarkMode ? (
                  <DarkModeIcon sx={{ fontSize: 18, color: colors.textPrimary }} />
                ) : (
                  <LightModeIcon sx={{ fontSize: 18, color: colors.textPrimary }} />
                )}
                <Typography sx={{ 
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </Typography>
              </Box>
            }
            sx={{ 
              m: 0,
              width: '100%',
              justifyContent: 'center'
            }}
          />
        </Box>
        
        {/* Indicador de conexión Socket.IO */}
        <Box sx={{ p: 2, borderTop: `1px solid ${colors.borderColor}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: socketConnected ? '#4CAF50' : '#F44336',
                animation: socketConnected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            />
            <Typography sx={{ 
              color: colors.textSecondary,
              fontSize: '0.8rem',
              fontWeight: 500
            }}>
              Sincronización: {socketConnected ? 'Conectado' : 'Desconectado'}
            </Typography>
          </Box>
        </Box>
        
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
      sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: colors.background,
        }}
      >
        {/* Botón hamburguesa para móvil */}
        {isMobile && !sidebarOpen && (
          <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0,
            zIndex: 1300,
            backgroundColor: colors.cardBackground,
            borderBottom: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            p: 1
          }}>
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{
                color: colors.textPrimary,
                p: 1,
                '&:hover': {
                  backgroundColor: `${colors.buttonColor}20`,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon sx={{ fontSize: 28 }} />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                color: colors.textPrimary, 
                fontWeight: 600,
                ml: 1,
                fontSize: '1.1rem'
              }}
            >
              Panel Admin
            </Typography>
            <Box sx={{ 
              ml: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: socketConnected ? '#4CAF50' : '#F44336',
                animation: socketConnected ? 'pulse 2s infinite' : 'none'
              }} />
              <Typography sx={{ 
                color: colors.textSecondary,
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                {socketConnected ? 'Conectado' : 'Desconectado'}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Container maxWidth="xl" sx={{ 
          py: { xs: 2, md: 4 }, 
          px: { xs: 1, sm: 2, md: 4 },
          pt: { xs: isMobile && !sidebarOpen ? 8 : 2, md: 4 }
        }}>
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
}

// Admin Panel Component
function AdminPanel({
  questions,
  categories,
  category,
  setCategory,
  newCategory,
  setNewCategory,
  questionText,
  setQuestionText,
  answer,
  setAnswer,
  editingId,
  setEditingId,
  deleteDialogOpen,
  setDeleteDialogOpen,
  deleteId,
  setDeleteId,
  selectedFilterCategory,
  setSelectedFilterCategory,
  handleSubmit,
  handleEdit,
  handleDelete,
  confirmDelete,
  loadQuestions,
  handleCreateCategory,
  handleDeleteCategory,
  categoryManagementOpen,
  setCategoryManagementOpen,
  colors,
  questionStates,
  handleToggleQuestionState,
  capitalizeFirstLetter,
  getCategoryName
}) {
  // Estado para paginación de preguntas
  const [questionsPage, setQuestionsPage] = useState(1);
  const questionsPerPage = 8;

  // Filtrar preguntas por categoría seleccionada
  const filteredQuestions = selectedFilterCategory && selectedFilterCategory !== "todas"
    ? questions.filter(q => getCategoryName(q.category_id) === selectedFilterCategory)
    : questions;

  // Resetear página cuando cambie el filtro de categoría
  useEffect(() => {
    setQuestionsPage(1);
  }, [selectedFilterCategory]);

  // Calcular páginas para preguntas
  const totalQuestionsPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  
  // Obtener preguntas de la página actual
  const startIndex = (questionsPage - 1) * questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + questionsPerPage);
  
  // Cambiar de página
  const handleQuestionsPageChange = (event, value) => {
    setQuestionsPage(value);
  };

  return (
    <>
        {/* Título principal elegante */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 300,
                background: "linear-gradient(45deg, #ffffff 20%, #e2e8f0 50%, #cbd5e1 80%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                mb: 2,
               fontSize: { xs: "2.5rem", sm: "3.5rem", md: "5.5rem" },
                letterSpacing: "0.05em",
                fontFamily: "'Playfair Display', serif"
              }}
            >
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: colors.textPrimary,
                fontWeight: 200,
                fontSize: { xs: "1rem", sm: "1.2rem", md: "1.4rem" },
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
                textAlign: "center"
              }}
            >
            Preguntas y Respuestas
            </Typography>
            <Box
              sx={{
                width: 100,
                height: 2,
                background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
                mx: "auto",
                mt: 3,
                borderRadius: 1
              }}
            />
          </Box>
        </Fade>

        {/* Panel de ingreso con diseño 3D y altura controlada */}
        <Slide direction="up" in timeout={1400}>
          <Card
            sx={{
              mb: { xs: 3, md: 4 },
              maxHeight: { xs: "auto", md: "auto" },
              background: colors.cardBackground,
              ...COMMON_STYLES.card,
              overflow: "visible"
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, md: 3 }, 
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "visible" 
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <AddIcon sx={{ color: colors.textPrimary, fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.textPrimary
                  }}
                >
                  Crear Nueva Pregunta
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 2, md: 2 }}
                flexWrap="wrap"
                alignItems="flex-start"
                sx={{ flex: 1 }}
              >
                <FormControl sx={{ minWidth: { xs: "100%", md: 200 }, flex: 1 }}>
                  <InputLabel sx={{ color: colors.textPrimary }}>Categoría</InputLabel>
                  <Select
                    value={category}
                    label="Categoría"
                    onChange={(e) => setCategory(e.target.value)}
                    MenuProps={{
                      ...SELECT_MENU_PROPS,
                      PaperProps: {
                        ...SELECT_MENU_PROPS.PaperProps,
                        sx: {
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                          maxHeight: 200,
                          overflow: 'auto',
                          "& .MuiMenuItem-root": {
                            color: colors.textPrimary,
                            backgroundColor: colors.inputBackground,
                            "&:hover": {
                              backgroundColor: colors.chipBackground
                            },
                            "&.Mui-selected": {
                              backgroundColor: colors.chipBackground,
                              "&:hover": {
                                backgroundColor: colors.chipBackground
                              }
                            }
                          }
                        }
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: colors.inputBackground,
                      minHeight: 56,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.borderColor,
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                        borderWidth: 2
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                        borderWidth: 2
                      },
                      "& .MuiSelect-select": {
                        color: colors.textPrimary,
                        fontWeight: 500,
                        padding: "16px 14px"
                      },
                      "& .MuiSelect-icon": {
                        color: colors.textPrimary
                      }
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.name_category}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: colors.textPrimary }} />
                          <Typography sx={{ color: colors.textPrimary }}>{cat.name_category}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="__new__">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AddIcon sx={{ fontSize: 16, color: "#000000" }} />
                        <Typography sx={{ color: "#000000" }}>Nueva categoría</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {category === "__new__" && (
                  <Fade in timeout={300}>
                    <TextField
                      label="Nueva categoría"
                      value={newCategory}
                      onChange={(e) => setNewCategory(capitalizeFirstLetter(e.target.value))}
                      sx={{
                        flex: 1,
                        minWidth: { xs: "100%", md: 250 },
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: colors.inputBackground,
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                          transition: "all 0.3s ease",
                          transform: "perspective(1000px) rotateX(2deg)",
                          "& fieldset": {
                            borderColor: "#B0B0B0",
                            borderWidth: 2
                          },
                          "&:hover": {
                            transform: "perspective(1000px) rotateX(0deg) translateY(-2px)",
                            boxShadow: "0 6px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                          },
                          "&:hover fieldset": {
                            borderColor: "#475569"
                          },
                          "&.Mui-focused": {
                            transform: "perspective(1000px) rotateX(0deg) translateY(-2px)",
                            boxShadow: "0 6px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#A988F2",
                            borderWidth: 2
                          },
                          "& .MuiInputBase-input": {
                            color: colors.textPrimary
                          }
                        },
                        "& .MuiInputLabel-root": {
                          color: colors.textPrimary
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#A988F2"
                        }
                      }}
                    />
                  </Fade>
                )}


                <TextField
                  label="Pregunta"
                  value={questionText}
                  onChange={(e) => setQuestionText(capitalizeFirstLetter(e.target.value))}
                  sx={{
                    flex: 2,
                    minWidth: { xs: "100%", md: 250 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: colors.inputBackground,
                      "& fieldset": {
                        borderColor: "#B0B0B0",
                        borderWidth: 2
                      },
                      "&:hover fieldset": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#9933FF",
                        borderWidth: 2
                      },
                      "& .MuiInputBase-input": {
                        color: colors.textPrimary
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: colors.textPrimary
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#A988F2"
                    }
                  }}
                />
                <TextField
                  label="Respuesta"
                  value={answer}
                  onChange={(e) => setAnswer(capitalizeFirstLetter(e.target.value))}
                  sx={{
                    flex: 2,
                    minWidth: { xs: "100%", md: 250 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: colors.inputBackground,
                      "& fieldset": {
                        borderColor: "#B0B0B0",
                        borderWidth: 2
                      },
                      "&:hover fieldset": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#9933FF",
                        borderWidth: 2
                      },
                      "& .MuiInputBase-input": {
                        color: colors.textPrimary
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: colors.textPrimary
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#A988F2"
                    }
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<AddIcon />}
                  sx={{
                    height: { xs: 48, md: 50 },
                    borderRadius: 3,
                    background: "linear-gradient(145deg, #A988F2 0%, #8B6BCF 50%, #7C4EDB 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", md: "1rem" }, 
                    px: { xs: 2, md: 3 }, 
                    minWidth: { xs: "100%", md: 120 }, 
                    boxShadow: "0 8px 16px rgba(169, 136, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
                    border: `1px solid ${colors.borderColor}`,
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: "perspective(1000px) rotateX(5deg)",
                    "&:hover": {
                      background: "linear-gradient(145deg, #8B6BCF 0%, #7C4EDB 50%, #6A3BC7 100%)",
                      transform: "perspective(1000px) rotateX(0deg) translateY(-4px) scale(1.05)",
                      boxShadow: "0 12px 24px rgba(169, 136, 242, 0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)"
                    },
                    "&:active": {
                      transform: "perspective(1000px) rotateX(2deg) translateY(-2px) scale(0.98)",
                      boxShadow: "0 4px 8px rgba(169, 136, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)"
                    }
                  }}
                >
                  {editingId ? "Actualizar" : "Agregar"}
                </Button>
                
                {editingId && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingId(null);
                      setCategory("");
                      setNewCategory("");
                      setQuestionText("");
                      setAnswer("");
                    }}
                    sx={{
                      borderRadius: 3,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                      fontWeight: 600,
                      px: 3,
                      minWidth: 120,
                      "&:hover": {
                        borderColor: colors.primary,
                        backgroundColor: colors.chipBackground
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Slide>

        
        <Slide direction="down" in timeout={1200}>
          <Card
            sx={{
              mb: { xs: 3, md: 4 },
              background: colors.cardBackground,
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: { xs: "none", md: "perspective(1000px) rotateX(2deg)" },
              "&:hover": {
                transform: { xs: "none", md: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)" },
                boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 2 }} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilterListIcon sx={{ color: colors.textPrimary, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    Filtrar por categoría
                  </Typography>
                </Box>
                <FormControl sx={{ minWidth: { xs: "100%", md: 250 } }}>
                  <InputLabel sx={{ color: colors.textPrimary }}>Categoría</InputLabel>
                  <Select
                    value={selectedFilterCategory || ""}
                    label="Categoría"
                    onChange={(e) => {
                      const filterValue = e.target.value;
                      setSelectedFilterCategory(filterValue);
                      trackEvent('filter_by_category', { category: filterValue === "todas" ? "all" : filterValue });
                      // Scroll automático a la tabla cuando se filtre
                      if (filterValue) {
                        setTimeout(() => {
                          const tableElement = document.getElementById('questions-table');
                          if (tableElement) {
                            tableElement.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start' 
                            });
                          }
                        }, 300);
                      }
                    }}
                    renderValue={(value) => {
                      if (!value || value === "todas") return "Todas las categorías";
                      return value;
                    }}
                    MenuProps={{
                      ...SELECT_MENU_PROPS,
                      PaperProps: {
                        ...SELECT_MENU_PROPS.PaperProps,
                        sx: {
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                          maxHeight: 200,
                          overflow: 'auto',
                          "& .MuiMenuItem-root": {
                            color: colors.textPrimary,
                            backgroundColor: colors.inputBackground,
                            "&:hover": {
                              backgroundColor: colors.chipBackground
                            },
                            "&.Mui-selected": {
                              backgroundColor: colors.chipBackground,
                              "&:hover": {
                                backgroundColor: colors.chipBackground
                              }
                            }
                          }
                        }
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: colors.inputBackground,
                      minHeight: 56,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.borderColor,
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                        borderWidth: 2
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.primary,
                        borderWidth: 2
                      },
                      "& .MuiSelect-select": {
                        color: colors.textPrimary,
                        fontWeight: 500,
                        padding: "16px 14px"
                      },
                      "& .MuiSelect-icon": {
                        color: colors.textPrimary
                      }
                    }}
                  >
                    <MenuItem value="todas">
                      <em style={{ color: colors.textPrimary }}>Todas las categorías</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.name_category}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: colors.textPrimary }} />
                          <Typography sx={{ color: colors.textPrimary }}>{cat.name_category}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  disabled={!selectedFilterCategory || selectedFilterCategory === "todas"}
                  onClick={() => {
                    const categoryToDelete = categories.find(cat => cat.name_category === selectedFilterCategory);
                    if (categoryToDelete) {
                      if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${selectedFilterCategory}"?\n\nEsto eliminará todas las preguntas de esta categoría.`)) {
                        handleDeleteCategory(categoryToDelete.id);
                        setSelectedFilterCategory("todas");
                      }
                    }
                  }}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderRadius: 3,
                    borderWidth: 2,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    px: 3,
                    py: 1.5,
                    minWidth: 180,
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: "perspective(1000px) rotateX(2deg)",
                    boxShadow: "0 4px 8px rgba(255, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                    borderColor: "#ff4444",
                    color: "#ff4444",
                    backgroundColor: "rgba(255, 68, 68, 0.05)",
                    "&:hover": {
                      backgroundColor: "#ff4444",
                      color: "white",
                      transform: "perspective(1000px) rotateX(0deg) translateY(-2px) scale(1.02)",
                      boxShadow: "0 8px 16px rgba(255, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                      borderColor: "#ff3333"
                    },
                    "&:active": {
                      transform: "perspective(1000px) rotateX(1deg) translateY(-1px) scale(0.98)",
                      boxShadow: "0 2px 4px rgba(255, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                    },
                    "&:disabled": {
                      borderColor: "#666",
                      color: "#666",
                      backgroundColor: "rgba(102, 102, 102, 0.05)",
                      opacity: 0.6,
                      transform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "rgba(102, 102, 102, 0.05)",
                        color: "#666",
                        transform: "none",
                        boxShadow: "none"
                      }
                    }
                  }}
                >
                  Eliminar categoría
                </Button>
                
                {selectedFilterCategory && selectedFilterCategory !== "todas" && (
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedFilterCategory("todas")}
                    startIcon={<FilterListIcon />}
                    sx={{
                      borderRadius: 2,
                      borderColor: "#9933FF",
                      color: colors.textPrimary,
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: "#A988F2",
                        color: "white",
                        transform: "scale(1.05)"
                      }
                    }}
                  >
                    Limpiar filtro
                  </Button>
                )}
              </Stack>
              {selectedFilterCategory && selectedFilterCategory !== "todas" && (
                <Fade in timeout={500}>
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Chip
                        icon={<QuestionAnswerIcon />}
                        label={`${filteredQuestions.length} pregunta(s)`}
                        sx={{
                          backgroundColor: "#A988F2",
                          color: "white",
                          fontWeight: 600,
                          "& .MuiChip-icon": {
                            color: "white"
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: colors.textPrimary, fontWeight: 500 }}>
                        en la categoría "{selectedFilterCategory}"
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Slide>

        <Slide direction="up" in timeout={1600}>
          <Card
            sx={{
              background: colors.cardBackground,
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.2)",
              overflow: "hidden",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: { xs: "none", md: "perspective(1000px) rotateX(2deg)" },
              "&:hover": {
                transform: { xs: "none", md: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)" },
                boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
              }
            }}
          >
            <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: "1px solid #000000" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <QuestionAnswerIcon sx={{ color: colors.textPrimary, fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.textPrimary
                  }}
                >
                  Lista de Preguntas
                </Typography>
                <Chip
                        label={`${filteredQuestions.length} pregunta(s)`}
                  sx={{
                    backgroundColor: "#A988F2",
                    color: "white",
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
            
            {/* Vista de tabla para desktop */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer id="questions-table" sx={{ overflowX: 'hidden' }}>
                <Table sx={{ minWidth: 'auto', width: '100%' }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: colors.chipBackground }}>
                      {[
                        { title: "Categoría", width: "12%" },
                        { title: "Pregunta", width: "30%" },
                        { title: "Respuesta", width: "30%" },
                        { title: "Estado", width: "13%" },
                      { title: "Acciones", width: "15%" },
                    ].map((header) => (
                      <TableCell
                        key={header.title}
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                            color: colors.textPrimary,
                          borderBottom: "2px solid #475569",
                          py: 2
                        }}
                          align={header.title === "Acciones" || header.title === "Estado" ? "center" : "left"}
                      >
                        {header.title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedQuestions.map((q, index) => (
                    <Fade in timeout={500 + index * 100} key={q.id}>
                      <TableRow
                        hover
                        sx={{
                             backgroundColor: colors.chipBackground,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.08)",
                            transform: "scale(1.01)"
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={getCategoryName(q.category_id)}
                            sx={{
                                backgroundColor: colors.chipBackground,
                                color: colors.textPrimary,
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                          <TableCell sx={{ py: 2, fontWeight: 500, color: colors.textPrimary }}>
                          {q.question}
                        </TableCell>
                          <TableCell sx={{ py: 2, color: colors.textPrimary }}>
                          {q.answer}
                        </TableCell>
                          <TableCell sx={{ py: 2 }} align="center">
                            <Switch
                              checked={questionStates[q.id] === true}
                              onChange={() => handleToggleQuestionState(q.id)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: colors.buttonColor,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: colors.buttonColor,
                                },
                              }}
                            />
                        </TableCell>
                        <TableCell sx={{ py: 2 }} align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              onClick={() => handleEdit(q)}
                              sx={{
                                  color: colors.textPrimary,
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                                  transform: "scale(1.1)"
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => confirmDelete(q.id)}
                              sx={{
                                color: "#e53e3e",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(229, 62, 62, 0.1)",
                                  transform: "scale(1.1)"
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Paginador para preguntas - Desktop */}
            {totalQuestionsPages > 1 && (
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 2,
                mt: 3, 
                mb: 2,
                pt: 3,
                borderTop: `1px solid ${colors.borderColor}`
              }}>
                <Pagination 
                  count={totalQuestionsPages} 
                  page={questionsPage} 
                  onChange={handleQuestionsPageChange}
                  color="primary"
                  size="large"
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(169, 136, 242, 0.1)',
                        transform: 'scale(1.1)',
                      }
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#A988F2',
                      color: 'white',
                      border: '1px solid #A988F2',
                      '&:hover': {
                        backgroundColor: '#8B6BCF',
                      }
                    },
                    '& .MuiPaginationItem-icon': {
                      color: colors.textPrimary,
                    }
                  }}
                />
              </Box>
            )}
            </Box>

            {/* Vista de cards para móvil */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Stack spacing={2} sx={{ p: 2 }}>
                {paginatedQuestions.map((q, index) => (
                  <Fade in timeout={500 + index * 100} key={q.id}>
                    <Card
                      sx={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 3,
                        border: `1px solid ${colors.borderColor}`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(169, 136, 242, 0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Header con categoría y estado */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={getCategoryName(q.category_id)}
                              sx={{
                                backgroundColor: colors.chipBackground,
                                color: colors.textPrimary,
                                fontWeight: 600,
                                borderRadius: 2
                              }}
                            />
                            <Switch
                              checked={questionStates[q.id] === true}
                              onChange={() => handleToggleQuestionState(q.id)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: colors.buttonColor,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: colors.buttonColor,
                                },
                              }}
                            />
                          </Box>
                          
                          {/* Pregunta */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>
                              Pregunta:
                            </Typography>
                            <Typography variant="body1" sx={{ color: colors.textPrimary, fontWeight: 500 }}>
                              {q.question}
                            </Typography>
                          </Box>
                          
                          {/* Respuesta */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>
                              Respuesta:
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                              {q.answer}
                            </Typography>
                          </Box>
                          
                          {/* Botones de acción */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pt: 1 }}>
                            <IconButton
                              onClick={() => handleEdit(q)}
                              sx={{
                                color: colors.textPrimary,
                                backgroundColor: `${colors.buttonColor}20`,
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: `${colors.buttonColor}40`,
                                  transform: "scale(1.1)"
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => confirmDelete(q.id)}
                              sx={{
                                color: "#e53e3e",
                                backgroundColor: "rgba(229, 62, 62, 0.1)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(229, 62, 62, 0.2)",
                                  transform: "scale(1.1)"
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Stack>
            </Box>
            
            {/* Paginador para preguntas - Móvil */}
            {totalQuestionsPages > 1 && (
              <Box sx={{ 
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 2,
                mt: 3, 
                mb: 2,
                pt: 3,
                borderTop: `1px solid ${colors.borderColor}`
              }}>
                <Pagination 
                  count={totalQuestionsPages} 
                  page={questionsPage} 
                  onChange={handleQuestionsPageChange}
                  color="primary"
                  size="large"
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(169, 136, 242, 0.1)',
                        transform: 'scale(1.1)',
                      }
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#A988F2',
                      color: 'white',
                      border: '1px solid #A988F2',
                      '&:hover': {
                        backgroundColor: '#8B6BCF',
                      }
                    },
                    '& .MuiPaginationItem-icon': {
                      color: colors.textPrimary,
                    }
                  }}
                />
              </Box>
            )}
          </Card>
        </Slide>

        {/* Dialogo de confirmación de eliminación con diseño moderno */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: colors.cardBackground,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: "center", 
            fontSize: "1.3rem", 
            fontWeight: 600,
            color: colors.textPrimary,
            py: 3
          }}>
             ¿Eliminar pregunta?
          </DialogTitle>
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography sx={{ textAlign: "center", color: colors.textPrimary }}>
              Esta acción no se puede deshacer
            </Typography>
          </Box>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: "#475569",
                    color: "#000000",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.1)"
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleDelete(deleteId)}
              variant="contained"
              sx={{
                borderRadius: 2,
                backgroundColor: "#e53e3e",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  backgroundColor: "#c53030",
                  transform: "scale(1.05)"
                }
              }}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
    </>
  );
}

// Ratings Tab Component
function RatingsTab({ 
  ratings, 
  loading, 
  selectedFilterModalidad, 
  setSelectedFilterModalidad,
  colors, 
  loadRatings
}) {

  // Estado para paginación
  const [page, setPage] = useState(1);
  const ratingsPerPage = 9; // 3 columnas x 3 filas = 9 cards por página
  
  // Estado para filtro por estrellas
  const [selectedFilterStars, setSelectedFilterStars] = useState("todas");

  // Función para filtrar ratings
  const filteredRatings = ratings.filter(rating => {
    // Filtro por modalidad - buscar en diferentes campos posibles
    const ratingModality = (rating.modality || rating.modalidad || rating.Modality?.type || '').toString().trim();
    const filterModality = selectedFilterModalidad?.trim() || '';
    
    const modalityMatch = !selectedFilterModalidad || 
                          filterModality === "todas" || 
                          ratingModality === filterModality;
    
    // Filtro por estrellas
    const ratingScore = Number(rating.score) || 0;
    const starsMatch = selectedFilterStars === "todas" || ratingScore === Number(selectedFilterStars);
    
    return modalityMatch && starsMatch;
  });

  // Calcular páginas
  const totalPages = Math.ceil(filteredRatings.length / ratingsPerPage);
  
  // Obtener ratings de la página actual
  const startIndex = (page - 1) * ratingsPerPage;
  const paginatedRatings = filteredRatings.slice(startIndex, startIndex + ratingsPerPage);
  
  // Cambiar de página
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <>
      {/* Título principal */}
      <Fade in timeout={300}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: colors.textPrimary,
              fontWeight: 200,
              fontSize: { xs: "1.1rem", md: "1.4rem" },
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Reseñas de Usuarios
          </Typography>
          <Box
            sx={{
              width: 100,
              height: 2,
              background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
              mx: "auto",
              mt: 3,
              borderRadius: 1
            }}
          />
    </Box>
      </Fade>


      {/* Lista de calificaciones */}
      <Slide direction="up" in timeout={500}>
        <Card
          sx={{
            background: colors.cardBackground,
            backdropFilter: "blur(10px)",
            borderRadius: 4,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.2)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            transform: "perspective(1000px) rotateX(2deg)",
            "&:hover": {
              transform: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
            }
          }}
        >
          <Box sx={{ p: 3, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Primera fila: Lista de Reseñas + Filtro Modalidad */}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ 
                  backgroundColor: colors.ratingCardBackground,
                  borderRadius: 3,
                  p: 2,
                  border: `1px solid ${colors.borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2
                }}>
                  <GradeIcon sx={{ color: colors.textPrimary, fontSize: 28 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: colors.textPrimary
                    }}
                  >
                    Lista de Reseñas
                  </Typography>
                  <Chip
                    label={`${filteredRatings.length} reseña(s)`}
                    sx={{
                      backgroundColor: "#A988F2",
                      color: "white",
                      fontWeight: 600
                    }}
                  />
                </Box>
                
                {/* Filtro por modalidad */}
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }}>
                  <FormControl sx={{ minWidth: { xs: "140px", sm: 160 } }}>
                    <InputLabel sx={{ color: colors.textPrimary, fontSize: '0.875rem' }}>Modalidad</InputLabel>
                    <Select
                      value={selectedFilterModalidad || ""}
                      label="Modalidad"
                      onChange={(e) => {
                        setSelectedFilterModalidad(e.target.value);
                        setPage(1); // Resetear a página 1 al cambiar filtro
                      }}
                      renderValue={(value) => {
                        if (!value || value === "todas") return "Todas";
                        if (value === "Sede") return "Sede";
                        if (value === "100% Online") return "100% Online";
                        return value;
                      }}
                      sx={{
                        backgroundColor: colors.ratingCardBackground,
                        borderRadius: 2,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: colors.borderColor,
                          borderWidth: 1.5
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#A988F2"
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#A988F2",
                          borderWidth: 2
                        },
                        "& .MuiSelect-select": {
                          color: `${colors.textPrimary} !important`
                        },
                        "& .MuiSelect-select.MuiSelect-displayEmpty": {
                          color: `${colors.textPrimary} !important`
                        },
                        "& .MuiInputBase-input": {
                          color: `${colors.textPrimary} !important`
                        },
                        "& .MuiOutlinedInput-input": {
                          color: `${colors.textPrimary} !important`
                        },
                        "& .MuiSelect-icon": {
                          color: `${colors.textPrimary} !important`
                        },
                        "& .MuiPaper-root": {
                          backgroundColor: "#FFFFFF",
                          "& .MuiMenuItem-root": {
                            color: "#000000 !important",
                            "&:hover": {
                              backgroundColor: "#F5F5F5"
                            },
                            "& em": {
                              color: "#000000 !important"
                            },
                            "& .MuiTypography-root": {
                              color: "#000000 !important"
                            }
                          }
                        }
                      }}
                    >
                    <MenuItem value="todas">
                      <em style={{ color: "#000000" }}>Todas</em>
                    </MenuItem>
                      <MenuItem value="100% Online">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#000000" }}>💻</Typography>
                          <Typography sx={{ color: "#000000" }}>100% Online</Typography>
                        </Box>
                    </MenuItem>
                      <MenuItem value="Sede">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#000000" }}>🏫</Typography>
                          <Typography sx={{ color: "#000000" }}>Sede</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              {/* Cuadros de estadísticas */}
              <Box sx={{ 
                display: "flex", 
                gap: { xs: 2, md: 3 }, 
                flexDirection: { xs: "column", md: "row" },
                width: "100%",
                justifyContent: "center",
                alignItems: "stretch"
              }}>
                {/* Cuadro de promedio total */}
                <Box sx={{
                  backgroundColor: colors.ratingCardBackground,
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  border: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "center",
                  flex: 1
                }}>
                  <Typography variant="h6" sx={{ 
                    color: colors.textPrimary, 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    Promedio Total
                  </Typography>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: { xs: 0.5, md: 1 }, 
                    mb: 1,
                    flexDirection: { xs: "column", sm: "row" }
                  }}>
                    <Typography variant="h4" sx={{ 
                      color: colors.textPrimary, 
                      fontWeight: 700,
                      fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace",
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                      letterSpacing: '0.1em',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1
                    }}>
                      {ratings.length > 0 ? (ratings.reduce((sum, rating) => sum + (Number(rating.score) || 0), 0) / ratings.length).toFixed(1) : "0.0"}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: colors.textPrimary, 
                      opacity: 0.7,
                      fontSize: { xs: '0.9rem', md: '1.25rem' }
                    }}>
                      / 5.0
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    gap: { xs: 0.3, md: 0.5 },
                    mb: 1
                  }}>
                    {[...Array(5)].map((_, i) => {
                      const average = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + (Number(rating.score) || 0), 0) / ratings.length : 0;
                      return (
                        <Typography key={i} sx={{ 
                          color: i < average ? '#FFD700' : colors.textPrimary, 
                          opacity: i < average ? 1 : 0.3,
                          fontSize: { xs: '1.2rem', md: '1.5rem' }
                        }}>
                          ⭐
                        </Typography>
                      );
                    })}
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: colors.textPrimary, 
                    opacity: 0.7,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    {ratings.length} evaluación{ratings.length !== 1 ? 'es' : ''}
                  </Typography>
                </Box>

                {/* Botón Dashboard en vivo */}
                <Box sx={{
                  backgroundColor: colors.ratingCardBackground,
                  borderRadius: 3,
                  p: { xs: 2, md: 3 },
                  border: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "center",
                  flex: 1,
                    display: "flex", 
                  flexDirection: "column",
                    justifyContent: "center", 
                    alignItems: "center", 
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: colors.inputBackground,
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(169, 136, 242, 0.3)"
                  }
                }}
                onClick={() => window.open('https://analytics.google.com/analytics/web/?authuser=2#/a373069827p510642716/reports/intelligenthome?params=_u..nav%3Dmaui%26_r.0.01..metrics%3D%5B%22activeUsers%22%5D&collectionId=12360626756', '_blank')}
                >
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center",
                    mb: 2,
                    height: { xs: '3rem', md: '4rem' },
                    width: '100%'
                  }}>
                    <Typography sx={{ 
                      color: "#FF6B35", 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    }}>
                      📊
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ 
                    color: colors.textPrimary, 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    Dashboard en vivo
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: colors.textPrimary, 
                    opacity: 0.6,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    Ver estadísticas en tiempo real
                  </Typography>
                </Box>
              </Box>
              
              {/* Filtro por estrellas - Estrellas clicables */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                pt: 2
              }}>
                <Typography variant="caption" sx={{ 
                  color: colors.textPrimary,
                  opacity: 0.7,
                  fontSize: '0.8rem'
                }}>
                  Filtrar:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  {[...Array(5)].map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => {
                        setSelectedFilterStars(i + 1 === Number(selectedFilterStars) ? "todas" : String(i + 1));
                        setPage(1);
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '1.3rem',
                        transition: 'all 0.2s ease',
                        transform: selectedFilterStars === String(i + 1) ? 'scale(1.2)' : 'scale(1)',
                        filter: selectedFilterStars === String(i + 1) ? 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))' : 'none',
                        opacity: selectedFilterStars === "todas" ? 0.5 : (Number(selectedFilterStars) > i ? 1 : 0.3),
                        '&:hover': {
                          transform: 'scale(1.15)',
                          filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.6))'
                        }
                      }}
                    >
                      ⭐
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" sx={{ color: "rgba(0,0,0,0.5)" }}>
                  Cargando calificaciones...
                </Typography>
              </Box>
            ) : ratings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <GradeIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }} />
                <Typography variant="h6" sx={{ color: colors.textPrimary }}>
                  No hay reseñas registradas
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textPrimary, opacity: 0.7 }}>
                  Las reseñas aparecerán aquí cuando los estudiantes las envíen
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2,
                    width: '100%'
                  }}
                >
                  {paginatedRatings.map((rating, index) => (
                    <Fade in timeout={400 + index * 150} key={rating.id}>
                    <Card
                      sx={{
                          p: 1.5,
                          height: '200px',
                          background: `linear-gradient(145deg, ${colors.inputBackground} 0%, rgba(169, 136, 242, 0.05) 100%)`,
                          borderRadius: 2,
                        border: `1px solid ${colors.borderColor}`,
                          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: 'linear-gradient(90deg, #A988F2 0%, #8B6BCF 100%)'
                              },
                        "&:hover": {
                                transform: "translateY(-8px) scale(1.02)",
                                boxShadow: "0 12px 35px rgba(169, 136, 242, 0.25)",
                                borderColor: '#A988F2'
                              }
                            }}
                          >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, height: '100%' }}>
                        {/* Header con nombre y fecha */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #A988F2 0%, #8B6BCF 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              boxShadow: '0 4px 12px rgba(169, 136, 242, 0.3)',
                              flexShrink: 0
                            }}>
                              {rating.nombre ? rating.nombre.charAt(0).toUpperCase() : 'E'}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textPrimary, fontSize: '1rem', mb: 0.25, lineHeight: 1.2 }}>
                                {rating.nombre || 'Estudiante sin nombre'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colors.textPrimary, opacity: 0.6, fontSize: '0.85rem' }}>
                                {rating.date ? (() => {
                                  const date = new Date(rating.date);
                                  date.setHours(date.getHours() - 3);
                                  return date.toLocaleString('es-CL', { 
                                    timeZone: 'America/Santiago',
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  });
                                })() : 
                                 rating.created_at ? (() => {
                                   const date = new Date(rating.created_at);
                                   date.setHours(date.getHours() - 3);
                                   return date.toLocaleString('es-CL', { 
                                     timeZone: 'America/Santiago',
                                     year: 'numeric',
                                     month: '2-digit',
                                     day: '2-digit',
                                     hour: '2-digit',
                                     minute: '2-digit',
                                     hour12: false
                                   });
                                 })() : 
                                 rating.createdAt ? (() => {
                                   const date = new Date(rating.createdAt);
                                   date.setHours(date.getHours() - 3);
                                   return date.toLocaleString('es-CL', { 
                                     timeZone: 'America/Santiago',
                                     year: 'numeric',
                                     month: '2-digit',
                                     day: '2-digit',
                                     hour: '2-digit',
                                     minute: '2-digit',
                                     hour12: false
                                   });
                                 })() : 'Sin fecha'}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={(rating.modality || rating.modalidad || rating.Modality?.type || 'Sin modalidad').trim()}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(169, 136, 242, 0.15)',
                              color: colors.textPrimary,
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              height: '24px',
                              border: '1px solid rgba(169, 136, 242, 0.3)',
                              flexShrink: 0
                            }}
                          />
                        </Box>
                        
                        {/* Estrellas de calificación */}
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: '1rem' }}>
                            {rating.score}/5
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.1 }}>
                          {[...Array(5)].map((_, i) => (
                            <Typography key={i} sx={{ 
                              color: i < (Number(rating.score) || 0) ? '#FFD700' : colors.textPrimary, 
                                opacity: i < (Number(rating.score) || 0) ? 1 : 0.2,
                                fontSize: '1.2rem',
                                filter: i < (Number(rating.score) || 0) ? 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))' : 'none'
                            }}>
                              ⭐
                            </Typography>
                          ))}
                          </Box>
                        </Box>
                        
                        {/* Comentario */}
                        {rating.comment ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: colors.textPrimary, 
                              opacity: 0.9,
                              lineHeight: 1.5,
                              fontSize: '0.95rem',
                              flex: 1,
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            "{rating.comment}"
                          </Typography>
                        ) : (
                          <Box sx={{ flex: 1 }} />
                        )}
                        
                        {/* Información adicional */}
                        <Box sx={{ display: 'flex', gap: 0.5, opacity: 0.7, flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ color: colors.textPrimary, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📧 {rating.correo || 'Sin correo'}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                      </Fade>
                  ))}
                </Box>
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: 2,
                    mt: 3, 
                    mb: 2,
                    pt: 3,
                    borderTop: `1px solid ${colors.borderColor}`
                  }}>
                    <Pagination 
                      count={totalPages} 
                      page={page} 
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      shape="rounded"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`,
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(169, 136, 242, 0.1)',
                            transform: 'scale(1.1)',
                          }
                        },
                        '& .Mui-selected': {
                          backgroundColor: '#A988F2',
                          color: 'white',
                          border: '1px solid #A988F2',
                          '&:hover': {
                            backgroundColor: '#8B6BCF',
                          }
                        },
                        '& .MuiPaginationItem-icon': {
                          color: colors.textPrimary,
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Card>
      </Slide>
    </>
  );
}

// Estilos CSS para animaciones
const styles = `
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default App;