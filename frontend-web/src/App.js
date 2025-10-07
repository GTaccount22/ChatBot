import React, { useEffect, useState } from "react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from "./services/questionService";
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
  Divider
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";

function App() {
  const [questions, setQuestions] = useState([]);
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
    const data = await getQuestions();
    setQuestions(data);
  };

  const categories = [...new Set(questions.map((q) => q.category))];
  
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #475569 50%, #475569 100%)",
        py: 4,
        px: { xs: 2, md: 4 }
      }}
    >
      <Container maxWidth="xl">
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
                fontSize: { xs: "3rem", md: "4.5rem" },
                letterSpacing: "0.05em",
                fontFamily: "'Playfair Display', serif"
              }}
            >
              Panel de Administrador
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
              <span style={{ color: '#00d4ff' }}>✦</span> Preguntas & Respuestas <span style={{ color: '#00d4ff' }}>✦</span>
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
              background: "rgba(255,255,255,0.95)",
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
                <AddIcon sx={{ color: "#475569", fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#475569"
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
                  <InputLabel sx={{ color: "#1e293b" }}>Categoría</InputLabel>
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
                            background: '#f1f1f1',
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
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e2e8f0",
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569",
                        borderWidth: 2
                      }
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: "#475569" }} />
                          {cat}
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="__new__">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AddIcon sx={{ fontSize: 16, color: "#475569" }} />
                         Nueva categoría
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
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                          transition: "all 0.3s ease",
                          transform: "perspective(1000px) rotateX(2deg)",
                          "& fieldset": {
                            borderColor: "#e2e8f0",
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
                            borderColor: "#475569",
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Fade>
                )}

                <TextField
                  label="Pregunta"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  multiline
                  rows={2}
                  sx={{
                    flex: 2,
                    minWidth: 250, // Reducido de 300 a 250
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e2e8f0",
                        borderWidth: 2
                      },
                      "&:hover fieldset": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#475569",
                        borderWidth: 2
                      }
                    }
                  }}
                />
                <TextField
                  label="Respuesta"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  multiline
                  rows={2}
                  sx={{
                    flex: 2,
                    minWidth: 250, // Reducido de 300 a 250
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e2e8f0",
                        borderWidth: 2
                      },
                      "&:hover fieldset": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#475569",
                        borderWidth: 2
                      }
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
              background: "rgba(255,255,255,0.95)",
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
                  <FilterListIcon sx={{ color: "#1e293b", fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
                    Filtrar por categoría
                  </Typography>
                </Box>
                <FormControl sx={{ minWidth: 250 }}>
                  <InputLabel sx={{ color: "#1e293b" }}>Categoría</InputLabel>
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
                            background: '#f1f1f1',
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
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e2e8f0",
                        borderWidth: 2
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569"
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569",
                        borderWidth: 2
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas las categorías</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: "#475569" }} />
                          {cat}
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
                      borderColor: "#475569",
                      color: "#475569",
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: "#475569",
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
                          backgroundColor: "#475569",
                          color: "white",
                          fontWeight: 600,
                          "& .MuiChip-icon": {
                            color: "white"
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>
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
              background: "rgba(255,255,255,0.95)",
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
                <QuestionAnswerIcon sx={{ color: "#475569", fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#475569"
                  }}
                >
                  Lista de Preguntas
                </Typography>
                <Chip
                  label={`${filteredQuestions.length} pregunta(s)`}
                  sx={{
                    backgroundColor: "#475569",
                    color: "white",
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
            
            <TableContainer id="questions-table">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(102, 126, 234, 0.1)" }}>
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
                          color: "#475569",
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
                          backgroundColor: index % 2 === 0 ? "rgba(102, 126, 234, 0.02)" : "white",
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
                              backgroundColor: "#475569",
                              color: "white",
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2, fontWeight: 500, color: "#475569" }}>
                          {q.question}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: "#475569" }}>
                          {q.answer}
                        </TableCell>
                        <TableCell sx={{ py: 2 }} align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              onClick={() => handleEdit(q)}
                              sx={{
                                color: "#475569",
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
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: "center", 
            fontSize: "1.3rem", 
            fontWeight: 600,
            color: "#475569",
            py: 3
          }}>
             ¿Eliminar pregunta?
          </DialogTitle>
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography sx={{ textAlign: "center", color: "#475569" }}>
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
                color: "#475569",
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
      </Container>
    </Box>
  );
}

export default App;
