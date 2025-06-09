import { Router } from "express";
import {
  getAllUsers,
  userLogin,
  userLogout,
  userSignup,
  verifyUser,
  getUserById,
  deleteUser,
  editUser,
  getUserStats,
} from "../controllers/userController";
import { verifyToken } from "../utils/token-manager";

const userRoutes = Router();

userRoutes.post("/signup", userSignup);
userRoutes.post("/login", userLogin);

userRoutes.use(verifyToken);
userRoutes.get("/", getAllUsers);
userRoutes.get("/auth-status", verifyUser);
userRoutes.get("/logout", userLogout);
userRoutes.get("/stats/:id", getUserStats);

// User CRUD operations
userRoutes.get("/:id", getUserById);
userRoutes.delete("/:id", deleteUser);
userRoutes.put("/:id", editUser);

export default userRoutes;
