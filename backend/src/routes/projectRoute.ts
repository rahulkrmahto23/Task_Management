import { Router } from "express";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByTeam,
  getProjectsByUser,
  getProjectStats,
} from "../controllers/projectController";
import { verifyToken } from "../utils/token-manager";

const projectRoutes = Router();

projectRoutes.use(verifyToken);

projectRoutes.get("/", getAllProjects);
projectRoutes.get("/team/:teamId", getProjectsByTeam);
projectRoutes.get("/user/:userId", getProjectsByUser);
projectRoutes.get("/:id", getProjectById);
projectRoutes.get("/stats/:id", getProjectStats);
projectRoutes.post("/", createProject);
projectRoutes.put("/:id", updateProject);
projectRoutes.delete("/:id", deleteProject);

export default projectRoutes;
