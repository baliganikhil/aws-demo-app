import express from "express";
import cors from "cors";
import { createTodo, deleteTodo, listTodos, updateTodo } from "./todos";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/todos", async (_req, res) => {
  try {
    const todos = await listTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Failed to load todos" });
  }
});

app.post("/api/todos", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) {
    res.status(400).json({ message: "text is required" });
    return;
  }

  try {
    const todo = await createTodo(text.trim());
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: "Failed to create todo" });
  }
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body as {
    text?: string;
    completed?: boolean;
  };

  try {
    const updated = await updateTodo(id, { text, completed });
    if (!updated) {
      res.status(400).json({ message: "No updates provided" });
      return;
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update todo" });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteTodo(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete todo" });
  }
});
