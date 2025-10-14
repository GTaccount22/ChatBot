import React, { useEffect, useState } from "react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from "./services/questionService";
import { getRatings } from "./services/ratingService";
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
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
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

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('home');
  
  // Admin panel state
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
    const data = await getQuestions();
    setQuestions(data);
      const uniqueCategories = [...new Set(data.map(q => q.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };
  
  // Filtrar preguntas por categoría seleccionada
  const filteredQuestions = selectedFilterCategory 
    ? questions.filter(q => q.category === selectedFilterCategory)
    : questions;

  const handleSubmit = async () => {
    const catToSend = category === "__new__" ? newCategory : category;

    if (!catToSend || !questionText || !answer) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (editingId) {
      await updateQuestion(editingId, { category: catToSend, question: questionText, answer });
      setEditingId(null);
    } else {
      await createQuestion({ category: catToSend, question: questionText, answer });
    }

    setCategory("");
    setNewCategory("");
    setQuestionText("");
    setAnswer("");
    loadQuestions();
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setCategory(categories.includes(q.category) ? q.category : "__new__");
    setNewCategory(categories.includes(q.category) ? "" : q.category);
    setQuestionText(q.question);
    setAnswer(q.answer);
  };

  const handleDelete = async (id) => {
    await deleteQuestion(id);
    loadQuestions();
    setDeleteDialogOpen(false);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const drawerWidth = 280;

  const menuItems = [
    { id: 'home', label: 'Gestor de Preguntas y Respuestas', icon: <HomeIcon /> },
    { id: 'ratings', label: 'Gestor de Calificaciones', icon: <GradeIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
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
        />;
      case 'ratings':
        return <RatingsTab />;
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
            backgroundColor: '#2C2C34',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#FFFFFF',
              fontSize: '1.5rem',
              letterSpacing: '0.05em',
              fontFamily: "'Playfair Display', serif"
            }}
          >
            Panel de Administrador
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#B0B0B0',
              mt: 1,
              fontSize: '0.9rem'
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
                  backgroundColor: activeTab === item.id ? 'rgba(169, 136, 242, 0.2)' : 'transparent',
                  border: activeTab === item.id ? '1px solid #A988F2' : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(169, 136, 242, 0.1)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === item.id ? '#A988F2' : '#B0B0B0', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: activeTab === item.id ? '#FFFFFF' : '#B0B0B0',
                      fontWeight: activeTab === item.id ? 600 : 400,
                      fontSize: '0.95rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
      sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: '#15151D',
        }}
      >
        
        
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
}

// Admin Panel Component
function AdminPanel({
  questions,
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
  loadQuestions
}) {
  const categories = [...new Set(questions.map((q) => q.category))];
  
  // Filtrar preguntas por categoría seleccionada
  const filteredQuestions = selectedFilterCategory 
    ? questions.filter(q => q.category === selectedFilterCategory)
    : questions;

  return (
    <>
        {/* Título principal elegante */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
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
               fontSize: { xs: "3.5rem", md: "5.5rem" },
                letterSpacing: "0.05em",
                fontFamily: "'Playfair Display', serif"
              }}
            >
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontWeight: 200,
                fontSize: { xs: "1.1rem", md: "1.4rem" },
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif"
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
              mb: 4,
              maxHeight: "500px", // Altura máxima para evitar sobreposición
              background: "#2C2C34",
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: "perspective(1000px) rotateX(2deg)",
              overflow: "hidden", 
              "&:hover": {
                transform: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
              }
            }}
          >
            <CardContent sx={{ 
              p: 3, 
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "auto" 
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <AddIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#FFFFFF"
                  }}
                >
                  Crear Nueva Pregunta
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2} // Reducido de 3 a 2
                flexWrap="wrap"
                alignItems="flex-start"
                sx={{ flex: 1 }}
              >
                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel sx={{ color: "#FFFFFF" }}>Categoría</InputLabel>
                  <Select
                    value={category}
                    label="Categoría"
                    onChange={(e) => setCategory(e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 150, // Altura controlada para evitar sobreposición
                          overflow: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#475569 #f1f1f1',
                          '&::-webkit-scrollbar': {
                            width: '6px'
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#302E40',
                            borderRadius: '3px'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#475569',
                            borderRadius: '3px'
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: '#334155'
                          }
                        }
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#393249",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#B0B0B0",
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#9933FF",
                        borderWidth: 2
                      },
                      "& .MuiSelect-select": {
                        color: "#FFFFFF"
                      }
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: "#000000" }} />
                          <Typography sx={{ color: "#000000" }}>{cat}</Typography>
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
                      onChange={(e) => setNewCategory(e.target.value)}
                      sx={{
                        flex: 1,
                        minWidth: 250,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: "#393249",
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
                            color: "#FFFFFF"
                          }
                        },
                        "& .MuiInputLabel-root": {
                          color: "#FFFFFF"
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
                  onChange={(e) => setQuestionText(e.target.value)}
                  sx={{
                    flex: 2,
                    minWidth: 250, // Reducido de 300 a 250
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#393249",
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
                        color: "#FFFFFF"
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: "#FFFFFF"
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#A988F2"
                    }
                  }}
                />
                <TextField
                  label="Respuesta"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  sx={{
                    flex: 2,
                    minWidth: 250, // Reducido de 300 a 250
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#393249",
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
                        color: "#FFFFFF"
                      }
                    },
                    "& .MuiInputLabel-root": {
                      color: "#FFFFFF"
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
                    height: 50, // Reducido de 60 a 50
                    borderRadius: 3,
                    background: "linear-gradient(145deg, #475569 0%, #334155 50%, #1e293b 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem", 
                    px: 3, 
                    minWidth: 120, 
                    boxShadow: "0 8px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: "perspective(1000px) rotateX(5deg)",
                    "&:hover": {
                      background: "linear-gradient(145deg, #334155 0%, #1e293b 50%, #0f172a 100%)",
                      transform: "perspective(1000px) rotateX(0deg) translateY(-4px) scale(1.05)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)"
                    },
                    "&:active": {
                      transform: "perspective(1000px) rotateX(2deg) translateY(-2px) scale(0.98)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)"
                    }
                  }}
                >
                  {editingId ? "Actualizar" : "Agregar"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Slide>

        
        <Slide direction="down" in timeout={1200}>
          <Card
            sx={{
              mb: 4,
              background: "#2C2C34",
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: "perspective(1000px) rotateX(2deg)",
              "&:hover": {
                transform: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilterListIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#FFFFFF" }}>
                    Filtrar por categoría
                  </Typography>
                </Box>
                <FormControl sx={{ minWidth: 250 }}>
                  <InputLabel sx={{ color: "#FFFFFF" }}>Categoría</InputLabel>
                  <Select
                    value={selectedFilterCategory}
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
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 150, 
                          overflow: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#475569 #f1f1f1',
                          '&::-webkit-scrollbar': {
                            width: '6px'
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#302E40',
                            borderRadius: '3px'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#475569',
                            borderRadius: '3px'
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: '#334155'
                          }
                        }
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#393249",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#B0B0B0",
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#9933FF",
                        borderWidth: 2
                      },
                      "& .MuiSelect-select": {
                        color: "#FFFFFF"
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em style={{ color: "#000000" }}>Todas las categorías</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: "#000000" }} />
                          <Typography sx={{ color: "#000000" }}>{cat}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedFilterCategory && (
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedFilterCategory("")}
                    startIcon={<FilterListIcon />}
                    sx={{
                      borderRadius: 2,
                      borderColor: "#9933FF",
                      color: "#FFFFFF",
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
              {selectedFilterCategory && (
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
                      <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 500 }}>
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
              background: "#2C2C34",
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <QuestionAnswerIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#FFFFFF"
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
            
            <TableContainer id="questions-table">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#302E40" }}>
                    {[
                      { title: "Categoría", width: "15%" },
                      { title: "Pregunta", width: "35%" },
                      { title: "Respuesta", width: "35%" },
                      { title: "Acciones", width: "15%" },
                    ].map((header) => (
                      <TableCell
                        key={header.title}
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "#FFFFFF",
                          borderBottom: "2px solid #475569",
                          py: 2
                        }}
                        align={header.title === "Acciones" ? "center" : "left"}
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
                           backgroundColor: "#302E40",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.08)",
                            transform: "scale(1.01)"
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={q.category}
                            sx={{
                              backgroundColor: "#302E40",
                              color: "white",
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2, fontWeight: 500, color: "#FFFFFF" }}>
                          {q.question}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: "#FFFFFF" }}>
                          {q.answer}
                        </TableCell>
                        <TableCell sx={{ py: 2 }} align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              onClick={() => handleEdit(q)}
                              sx={{
                                color: "#FFFFFF",
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
          </Card>
        </Slide>

        {/* Dialogo de confirmación de eliminación con diseño moderno */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: "#2C2C34",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: "center", 
            fontSize: "1.3rem", 
            fontWeight: 600,
                color: "#FFFFFF",
            py: 3
          }}>
             ¿Eliminar pregunta?
          </DialogTitle>
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography sx={{ textAlign: "center", color: "#FFFFFF" }}>
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
                color: "#FFFFFF",
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
function RatingsTab() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterModalidad, setSelectedFilterModalidad] = useState("");

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await getRatings();
      setRatings(data);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Título principal */}
      <Fade in timeout={1000}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontWeight: 200,
              fontSize: { xs: "1.1rem", md: "1.4rem" },
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <span style={{ color: '#00d4ff' }}>✦</span> Reseñas de Usuarios <span style={{ color: '#00d4ff' }}>✦</span>
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
      <Slide direction="up" in timeout={1600}>
        <Card
          sx={{
            background: "#2C2C34",
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  backgroundColor: "#393249",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <GradeIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#FFFFFF"
                    }}
                  >
                    Lista de Reseñas
                  </Typography>
                  <Chip
                    label={`${ratings.filter(rating => !selectedFilterModalidad || rating.modalidad === selectedFilterModalidad).length} reseña(s)`}
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
                  backgroundColor: "#393249",
                  borderRadius: 3,
                  p: 2,
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: "#FFFFFF"
                    }}
                  >
                    Filtrar:
                  </Typography>
                  <FormControl sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedFilterModalidad || ""}
                      onChange={(e) => setSelectedFilterModalidad(e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "#393249",
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
                          color: "#FFFFFF"
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em style={{ color: "#000000" }}>Todas</em>
                      </MenuItem>
                      <MenuItem value="Sede">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#000000" }}>🏫</Typography>
                          <Typography sx={{ color: "#000000" }}>Sede</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="100% Online">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "#000000" }}>💻</Typography>
                          <Typography sx={{ color: "#000000" }}>100% Online</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              {/* Cuadro de promedio total */}
              <Box sx={{
                backgroundColor: "#393249",
                borderRadius: 3,
                p: 3,
                minWidth: 200,
                border: "1px solid rgba(255,255,255,0.1)",
                textAlign: "center"
              }}>
                <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 600, mb: 1 }}>
                  Promedio Total
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="h4" sx={{ color: "#FFD700", fontWeight: 700 }}>
                    {ratings.length > 0 ? (ratings.reduce((sum, rating) => sum + rating.calificacion, 0) / ratings.length).toFixed(1) : "0.0"}
                  </Typography>
                  <Typography variant="h6" sx={{ color: "#FFFFFF", opacity: 0.7 }}>
                    / 5.0
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                  {[...Array(5)].map((_, i) => {
                    const average = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating.calificacion, 0) / ratings.length : 0;
                    return (
                      <Typography key={i} sx={{ 
                        color: i < average ? '#FFD700' : '#FFFFFF', 
                        opacity: i < average ? 1 : 0.3,
                        fontSize: '1.5rem'
                      }}>
                        ⭐
                      </Typography>
                    );
                  })}
                </Box>
                <Typography variant="caption" sx={{ color: "#FFFFFF", opacity: 0.7 }}>
                  {ratings.length} evaluación{ratings.length !== 1 ? 'es' : ''}
                </Typography>
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
                <Typography variant="h6" sx={{ color: "#FFFFFF" }}>
                  No hay reseñas registradas
                </Typography>
                <Typography variant="body2" sx={{ color: "#FFFFFF", opacity: 0.7 }}>
                  Las reseñas aparecerán aquí cuando los estudiantes las envíen
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {ratings
                  .filter(rating => !selectedFilterModalidad || rating.modalidad === selectedFilterModalidad)
                  .map((rating, index) => (
                  <Fade in timeout={500 + index * 100} key={rating.id}>
                    <Card
                      sx={{
                        p: 3,
                        backgroundColor: "#393249",
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.1)",
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: '50%', 
                              backgroundColor: '#A988F2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            }}>
                              {rating.nombre ? rating.nombre.charAt(0).toUpperCase() : 'E'}
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: "#FFFFFF", mb: 0.5 }}>
                                {rating.nombre || 'Estudiante sin nombre'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#FFFFFF", opacity: 0.7 }}>
                                {rating.fecha ? (() => {
                                  const date = new Date(rating.fecha);
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
                            <Typography variant="body2" sx={{ color: "#FFFFFF", opacity: 0.8 }}>
                              {rating.modalidad || 'Sin modalidad'}
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
                              <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem' }}>⭐</Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* Estrellas de calificación */}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {[...Array(5)].map((_, i) => (
                            <Typography key={i} sx={{ 
                              color: i < rating.calificacion ? '#FFD700' : '#FFFFFF', 
                              opacity: i < rating.calificacion ? 1 : 0.3,
                              fontSize: '1.2rem'
                            }}>
                              ⭐
                            </Typography>
                          ))}
                        </Box>
                        
                        {/* Comentario */}
                        {rating.comentario && (
                          <Typography variant="body2" sx={{ 
                            color: "#FFFFFF", 
                            opacity: 0.9,
                            lineHeight: 1.5
                          }}>
                            "{rating.comentario}"
                          </Typography>
                        )}
                        
                        {/* Información adicional */}
                        <Box sx={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                          <Typography variant="caption" sx={{ color: "#FFFFFF" }}>
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

export default App;
