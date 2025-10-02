import React, { useEffect, useState } from "react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from "./services/questionService";
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
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

  // Cargar preguntas al inicio
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await getQuestions();
    setQuestions(data);
  };

  // Extraer categorías únicas
  const categories = [...new Set(questions.map(q => q.category))];

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

    // Limpiar campos
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
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Panel de Preguntas</Typography>

      {/* Select de categorías */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Categoría</InputLabel>
        <Select
          value={category}
          label="Categoría"
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
          <MenuItem value="__new__">+ Nueva categoría</MenuItem>
        </Select>
      </FormControl>

      {/* Input para nueva categoría */}
      {category === "__new__" && (
        <TextField
          label="Nombre de nueva categoría"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          fullWidth
          margin="normal"
        />
      )}

      <TextField
        label="Pregunta"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Respuesta"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        {editingId ? "Actualizar Pregunta" : "Agregar Pregunta"}
      </Button>

      <List sx={{ mt: 4 }}>
        {questions.map((q) => (
          <ListItem key={q.id} secondaryAction={
            <>
              <IconButton edge="end" onClick={() => handleEdit(q)}><EditIcon /></IconButton>
              <IconButton edge="end" onClick={() => handleDelete(q.id)}><DeleteIcon /></IconButton>
            </>
          }>
            <ListItemText primary={`${q.category} - ${q.question}`} secondary={q.answer} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default App;
