import { Router } from "express";
import userRoutes from "./userRoute";
import teamRoutes from "./teamRoute";
import projectRoutes from "./projectRoute";
import taskRoutes from "./taskRoute";

const appRouter = Router();

appRouter.use("/user", userRoutes);
appRouter.use("/team", teamRoutes);
appRouter.use("/project", projectRoutes);
appRouter.use("/task", taskRoutes);

export default appRouter;