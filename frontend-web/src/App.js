import React, { useEffect, useState, useCallback } from "react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, toggleQuestionState } from "./services/questionService";
import { getRatings } from "./services/ratingService";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./services/categoryService";
import { io } from "socket.io-client";
import { COLOR_PALETTES, COMMON_STYLES, SELECT_MENU_PROPS } from "./constants/styles";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Dialog,
  DialogTitle,
  DialogActions,
  Box,
  Fade,
  Slide,
  Chip,
  Card,
  CardContent,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import HomeIcon from "@mui/icons-material/Home";
import GradeIcon from "@mui/icons-material/Grade";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

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
  
  // Estados para Socket.IO y datos históricos
  const [socket, setSocket] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
    setQuestions(data);
    // Las categorías se cargan por separado con loadCategories()
  } catch (error) {
    console.error('Error loading questions:', error);
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
      setRatings(data);
    } catch (error) {
      console.error('Error loading ratings:', error);
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
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await createCategory({ name_category: newCategory.trim() });
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
      await loadCategories();
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Inicializar Socket.IO con detección automática de ngrok
  useEffect(() => {
    let mounted = true;
    
    const initializeSocket = async () => {
      try {
        // Probar ngrok primero
        const isNgrokAvailable = await testNgrokConnection();
        const socketUrl = 'http://localhost:5000';
        
        console.log(`🔄 Conectando Socket.IO a: ${socketUrl}`);
        
        const newSocket = io(socketUrl, {
          transports: ["websocket"],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          extraHeaders: isNgrokAvailable ? {
            'ngrok-skip-browser-warning': 'true'
          } : {}
        });
        
        if (!mounted) return;
        
        setSocket(newSocket);

        // Eventos de conexión
        newSocket.on('connect', () => {
          console.log('✅ Conectado a Socket.IO');
          if (mounted) setSocketConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Desconectado de Socket.IO');
          if (mounted) setSocketConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Error de conexión Socket.IO:', error);
          if (mounted) setSocketConnected(false);
        });

        // Eventos del servidor
        newSocket.on('actualizar_conteo', ({ fecha, total }) => {
          console.log('📊 Conteo actualizado:', { fecha, total });
          if (mounted) {
            setIsAnimating(true);
            setHistoricalData(prev => ({ ...prev, [fecha]: total }));
            setTimeout(() => {
              if (mounted) setIsAnimating(false);
            }, 1000);
          }
        });

        newSocket.on('actualizar_calificaciones', (data) => {
          console.log('⭐ Nueva calificación recibida:', data);
          if (mounted) loadRatings();
        });

        // Cargar datos históricos
        try {
          const response = await fetch(`${socketUrl}/api/usuarios-por-dia`);
          
          if (response.ok && mounted) {
            const data = await response.json();
            setHistoricalData(data);
          }
        } catch (error) {
          console.error('Error cargando datos históricos:', error);
        }

      } catch (error) {
        console.error('Error inicializando Socket.IO:', error);
        if (mounted) setSocketConnected(false);
      }
    };

    initializeSocket();

    // Cleanup
    return () => {
      mounted = false;
      if (socket) {
        socket.close();
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
    } else {
      await createQuestion({ category_id: categoryId, question: questionText, answer });
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
          historicalData={historicalData}
          isAnimating={isAnimating}
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
                onChange={(e) => setIsDarkMode(e.target.checked)}
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
  // Filtrar preguntas por categoría seleccionada
  const filteredQuestions = selectedFilterCategory && selectedFilterCategory !== "todas"
    ? questions.filter(q => getCategoryName(q.category_id) === selectedFilterCategory)
    : questions;

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
              maxHeight: { xs: "auto", md: "500px" },
              background: colors.cardBackground,
              ...COMMON_STYLES.card,
              overflow: "hidden"
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, md: 3 }, 
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "auto" 
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
                      setSelectedFilterCategory(e.target.value);
                      // Scroll automático a la tabla cuando se filtre
                      if (e.target.value) {
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
              <TableContainer id="questions-table" sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 'auto' }}>
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
                  {filteredQuestions.map((q, index) => (
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
            </Box>

            {/* Vista de cards para móvil */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Stack spacing={2} sx={{ p: 2 }}>
                {filteredQuestions.map((q, index) => (
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
  loadRatings, 
  historicalData, 
  isAnimating 
}) {

  // Función para filtrar ratings
  const filteredRatings = ratings.filter(rating => {
    // Filtro por modalidad - buscar en diferentes campos posibles
    const ratingModality = (rating.modality || rating.modalidad || rating.Modality?.type || '').toString().trim();
    const filterModality = selectedFilterModalidad?.trim() || '';
    
    const modalityMatch = !selectedFilterModalidad || 
                          filterModality === "todas" || 
                          ratingModality === filterModality;
    
    return modalityMatch;
  });

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
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, flex: 1 }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                        backgroundColor: colors.ratingCardBackground,
                  borderRadius: 3,
                  p: 2,
                  border: `1px solid ${colors.borderColor}`
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
                  gap: { xs: 1, md: 2 },
                  backgroundColor: colors.ratingCardBackground,
                  borderRadius: 3,
                  p: { xs: 1.5, md: 2 },
                  border: `1px solid ${colors.borderColor}`,
                  flexDirection: { xs: "column", sm: "row" }
                }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: colors.textPrimary
                    }}
                  >
                    Filtrar:
                  </Typography>
                  <FormControl sx={{ minWidth: { xs: "100%", sm: 120 } }}>
                    <InputLabel sx={{ color: colors.textPrimary, fontSize: '0.875rem' }}>Modalidad</InputLabel>
                    <Select
                      value={selectedFilterModalidad || ""}
                      label="Modalidad"
                      onChange={(e) => setSelectedFilterModalidad(e.target.value)}
                      renderValue={(value) => {
                        if (!value || value === "todas") return "Todas";
                        if (value === "Sede") return "Sede";
                        if (value === "100% Online") return "100% Online";
                        return value;
                      }}
                      sx={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 2,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#B0B0B0",
                          borderWidth: 2
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#475569"
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

                {/* Cuadro de usuarios nuevos por día */}
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
                    Usuarios Nuevos
                  </Typography>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    mb: 1,
                    height: { xs: '3rem', md: '4rem' },
                    width: '100%'
                  }}>
                    <Typography 
                      variant="h2" 
                      className={isAnimating ? 'digital-counter-animating' : ''}
                      sx={{ 
                        color: colors.textPrimary, 
                        fontWeight: 700,
                        fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace",
                        fontSize: { xs: '2.5rem', sm: '3.2rem', md: '4rem' },
                        letterSpacing: '0.1em',
                        transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'center',
                        ...(isAnimating && {
                          animation: 'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                        })
                      }}
                    >
                      {historicalData && typeof historicalData === 'object' ? 
                        Object.values(historicalData).reduce((sum, count) => sum + count, 0) : 0}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    gap: { xs: 0.3, md: 0.5 }, 
                    mb: 1 
                  }}>
                    <Typography sx={{ 
                      color: "#4CAF50", 
                      fontSize: { xs: '1.2rem', md: '1.5rem' } 
                    }}>
                      🎓
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: colors.textPrimary, 
                    opacity: 0.7,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    {historicalData && typeof historicalData === 'object' && Object.keys(historicalData).length > 0 ? 
                      Object.keys(historicalData).sort().pop() : 
                      new Date().toLocaleDateString('es-CL')
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: colors.textPrimary, 
                    opacity: 0.5, 
                    display: 'block', 
                    mt: 0.5,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    (sesiones nuevas)
                  </Typography>
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
              <Stack spacing={2}>
                {filteredRatings.map((rating, index) => (
                  <Fade in timeout={200 + index * 50} key={rating.id}>
                    <Card
                      sx={{
                        p: 3,
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Header con nombre y fecha */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              backgroundColor: '#A988F2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: colors.textPrimary,
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            }}>
                              {rating.nombre ? rating.nombre.charAt(0).toUpperCase() : 'E'}
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary, mb: 0.5 }}>
                                {rating.nombre || 'Estudiante sin nombre'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colors.textPrimary, opacity: 0.7 }}>
                                {rating.date ? (() => {
                                  const date = new Date(rating.date);
                                  date.setHours(date.getHours() - 3); // Ajuste para Chile (UTC-3)
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
                                   date.setHours(date.getHours() - 3); // Ajuste para Chile (UTC-3)
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
                                   date.setHours(date.getHours() - 3); // Ajuste para Chile (UTC-3)
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: colors.textPrimary, opacity: 0.8 }}>
                              {(rating.modality || rating.modalidad || rating.Modality?.type || 'Sin modalidad').trim()}
                            </Typography>
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              backgroundColor: '#A988F2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Typography sx={{ color: colors.textPrimary, fontSize: '0.8rem' }}>⭐</Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* Estrellas de calificación */}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {[...Array(5)].map((_, i) => (
                            <Typography key={i} sx={{ 
                              color: i < (Number(rating.score) || 0) ? '#FFD700' : colors.textPrimary, 
                              opacity: i < (Number(rating.score) || 0) ? 1 : 0.3,
                              fontSize: '1.2rem'
                            }}>
                              ⭐
                            </Typography>
                          ))}
                        </Box>
                        
                        {/* Comentario */}
                        {rating.comment && (
                          <Typography variant="body2" sx={{ 
                            color: colors.textPrimary, 
                            opacity: 0.9,
                            lineHeight: 1.5
                          }}>
                            "{rating.comment}"
                          </Typography>
                        )}
                        
                        {/* Información adicional */}
                        <Box sx={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                          <Typography variant="caption" sx={{ color: colors.textPrimary }}>
                            📧 {rating.correo || 'Sin correo'}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Fade>
                ))}
              </Stack>
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
