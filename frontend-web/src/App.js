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
  Paper,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Dialog,
  DialogTitle,
  DialogActions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

function App() {
  const [questions, setQuestions] = useState([]);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await getQuestions();
    setQuestions(data);
  };

  const categories = [...new Set(questions.map((q) => q.category))];

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
    <Container maxWidth={false} sx={{ mt: 6, mb: 4, px: { xs: 2, md: 5 } }}>
      {/* Título principal */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 4, fontWeight: 600, textAlign: "center", color: "#000000" }}
      >
        Panel de Administración de Preguntas
      </Typography>

      {/* Panel de ingreso */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: "#f5f5f5",
          borderRadius: 3,
          boxShadow: 3,
          width: "100%",
          maxWidth: "1350px",
          mx: "auto"
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 500, color: "#000000" }}
        >
          Ingresar nueva pregunta
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          flexWrap="wrap"
          alignItems="flex-start"
          sx={{ mt: 2 }}
        >
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={category}
              label="Categoría"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
              <MenuItem value="__new__">+ Nueva categoría</MenuItem>
            </Select>
          </FormControl>

          {category === "__new__" && (
            <TextField
              label="Nueva categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
            />
          )}

          <TextField
            label="Pregunta"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            sx={{ flex: 2, minWidth: 250 }}
          />
          <TextField
            label="Respuesta"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            sx={{ flex: 2, minWidth: 250 }}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              height: 55,
              borderRadius: 2,
              backgroundColor: "#ffb800",
              color: "#000000",
              fontWeight: 700,
              fontSize: "1rem",
              px: 3,
              "&:hover": { backgroundColor: "#e0a500" },
            }}
          >
            {editingId ? "Actualizar" : "Agregar"}
          </Button>
        </Stack>
      </Paper>

      {/* Tabla de preguntas */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 4,
          borderRadius: 3,
          overflow: "hidden",
          width: "100%",
          maxWidth: "1400px",
          mx: "auto"
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                { title: "Categoría", width: "11%" },
                { title: "Pregunta", width: "15%" },
                { title: "Respuesta", width: "25%" },
                { title: "Acciones", width: "10%" },
              ].map((header) => (
                <TableCell
                  key={header.title}
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", sm: "1.2rem" },
                    backgroundColor: "#d3d3d3",
                    color: "#000000",
                    width: header.width,
                  }}
                  align={header.title === "Acciones" ? "center" : "left"}
                >
                  {header.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((q, index) => (
              <TableRow
                key={q.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                }}
              >
                <TableCell sx={{ minWidth: "20%" }}>{q.category}</TableCell>
                <TableCell sx={{ minWidth: "40%" }}>{q.question}</TableCell>
                <TableCell sx={{ minWidth: "25%" }}>{q.answer}</TableCell>
                <TableCell sx={{ minWidth: "15%" }} align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      onClick={() => handleEdit(q)}
                      sx={{ color: "#1976d2" }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => confirmDelete(q.id)}
                      sx={{ color: "#d32f2f" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{"¿Estás seguro de eliminar esta pregunta?"}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={() => handleDelete(deleteId)}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
