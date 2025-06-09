import { Router } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByProject,
  getTasksByUser,
  getTaskStats,
} from "../controllers/taskController";
import { verifyToken } from "../utils/token-manager";

const taskRoutes = Router();

taskRoutes.use(verifyToken);

// Task operations
taskRoutes.get("/", getAllTasks);
taskRoutes.get("/user/:userId", getTasksByUser);
taskRoutes.get("/project/:projectId", getTasksByProject);
taskRoutes.get("/:id", getTaskById);
taskRoutes.get("/stats/:id", getTaskStats);
taskRoutes.post("/", createTask);
taskRoutes.put("/:id", updateTask);
taskRoutes.patch("/:id/status", updateTaskStatus);
taskRoutes.delete("/:id", deleteTask);

export default taskRoutes;
