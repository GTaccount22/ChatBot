import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const getQuestions = async () => {
  const res = await axios.get(`${API_URL}/questions`);
  return res.data;
};

export const createQuestion = async (question) => {
  const res = await axios.post(`${API_URL}/questions`, question);
  return res.data;
};

export const updateQuestion = async (id, question) => {
  const res = await axios.put(`${API_URL}/questions/${id}`, question);
  return res.data;
};

export const deleteQuestion = async (id) => {
  const res = await axios.delete(`${API_URL}/questions/${id}`);
  return res.data;
};
