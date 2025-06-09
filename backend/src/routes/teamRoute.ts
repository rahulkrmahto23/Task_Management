import { Router } from "express";
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByUser,
  getTeamStats,
} from "../controllers/teamController";
import { verifyToken } from "../utils/token-manager";

const teamRoutes = Router();

teamRoutes.use(verifyToken);

// Team CRUD operations
teamRoutes.get("/", getAllTeams);
teamRoutes.get("/user/:userId", getTeamsByUser);
teamRoutes.get("/:id", getTeamById);
teamRoutes.get("/stats/:id", getTeamStats);
teamRoutes.post("/", createTeam);
teamRoutes.patch("/:id", updateTeam);
teamRoutes.delete("/:id", deleteTeam);

export default teamRoutes;
