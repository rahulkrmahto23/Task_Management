import { NextFunction, Request, Response } from "express";
import Task from "../models/taskSchema";
import Team from "../models/teamSchema";
import User from "../models/userSchema";
import Project from "../models/projectSchema";

export const getAllTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (res.locals.jwtData.role === "admin") {
      const tasks = await Task.find()
        .populate("project", "name")
        .populate("assignedMembers.member", "name email designation")
        .populate("createdBy", "name email");
      return res.status(200).json({ message: "OK", tasks });
    } else {
      const projects = await Project.find({ members: res.locals.jwtData.id });
      const projectIds = projects.map((p) => p._id);

      const tasks = await Task.find({
        $or: [
          { "assignedMembers.member": res.locals.jwtData.id },
          { project: { $in: projectIds } },
        ],
      })
        .populate("project", "name")
        .populate("assignedMembers.member", "name email designation")
        .populate("createdBy", "name email");

      return res.status(200).json({ message: "OK", tasks });
    }
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate("project", "name description")
      .populate("assignedMembers.member", "name email designation role")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedMembers.some(
      (am) => am.member._id.toString() === res.locals.jwtData.id
    );
    const isAdmin = res.locals.jwtData.role === "admin";
    const project = await Project.findById(task.project);
    const isProjectMember = project?.members.includes(res.locals.jwtData.id);
    const team = await Team.findById(project?.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;

    if (!isAdmin && !isAssigned && !isProjectMember && !isTeamCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task" });
    }

    return res.status(200).json({ message: "OK", task });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, deadline, project, assignedMembers } = req.body;
    const creatorId = res.locals.jwtData.id;

    const projectObj = await Project.findById(project).populate(
      "team",
      "members createdBy"
    );
    if (!projectObj) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const isTeamCreator = projectObj.team.createdBy.toString() === creatorId;
    const isProjectCreator = projectObj.createdBy.toString() === creatorId;
    const creator = await User.findById(creatorId);
    const isManager = creator?.role === "manager";

    if (!isAdmin && !isTeamCreator && !isProjectCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to create tasks for this project" });
    }
    const invalidMembers = assignedMembers.filter(
      (am: any) => !projectObj.team.members.includes(am.member)
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({
        message:
          "One or more assigned members are not part of the project team",
      });
    }

    const task = new Task({
      title,
      description,
      deadline,
      project,
      assignedMembers: assignedMembers.map((am: any) => ({
        member: am.member,
        status: "to-do",
      })),
      createdBy: creatorId,
    });

    await task.save();

    await Project.findByIdAndUpdate(project, {
      $addToSet: { tasks: task._id },
    });

    const memberIds = assignedMembers.map((am: any) => am.member);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { tasks: task._id } }
    );

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedMembers.member", "name email designation")
      .populate("createdBy", "name email");

    return res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, assignedMembers } = req.body;
    const userId = res.locals.jwtData.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const isAssigned = task.assignedMembers.some(
      (am) => am.member.toString() === userId
    );
    const project = await Project.findById(task.project).populate(
      "team",
      "createdBy"
    );
    const isTeamCreator = project?.team.createdBy.toString() === userId;
    const isProjectCreator = project?.createdBy.toString() === userId;
    const creator = await User.findById(userId);
    const isManager = creator?.role === "manager";

    const canModify = isAdmin || isTeamCreator || isProjectCreator || isManager;

    if (!canModify && !isAssigned) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    if (canModify) {
      task.title = title || task.title;
      task.description = description || task.description;
      task.deadline = deadline || task.deadline;
    }

    if (assignedMembers && canModify) {
      const project = await Project.findById(task.project).populate(
        "team",
        "members"
      );

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const invalidMembers = assignedMembers.filter(
        (am: any) => !project.team.members.includes(am.member)
      );
      if (invalidMembers.length > 0) {
        return res.status(400).json({
          message:
            "One or more assigned members are not part of the project team",
        });
      }

      const currentMembers = task.assignedMembers.map((am) =>
        am.member.toString()
      );
      const newMembers = assignedMembers.map((am: any) => am.member);

      const membersToAdd = newMembers.filter(
        (m: string) => !currentMembers.includes(m)
      );
      const membersToRemove = currentMembers.filter(
        (m) => !newMembers.includes(m)
      );

      task.assignedMembers = assignedMembers.map((am: any) => ({
        member: am.member,
        status: am.status || "to-do",
      }));

      // Update users' tasks arrays
      if (membersToAdd.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToAdd } },
          { $addToSet: { tasks: task._id } }
        );
      }

      if (membersToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToRemove } },
          { $pull: { tasks: task._id } }
        );
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedMembers.member", "name email designation")
      .populate("createdBy", "name email");

    return res.status(200).json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = res.locals.jwtData.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const memberAssignment = task.assignedMembers.find(
      (am) => am.member.toString() === userId
    );

    if (!memberAssignment) {
      return res
        .status(403)
        .json({ message: "Not authorized to update status for this task" });
    }

    memberAssignment.status = status;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .select("title assignedMembers.$")
      .populate("assignedMembers.member", "name email");

    return res.status(200).json({
      message: "Task status updated successfully",
      task: populatedTask,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const project = await Project.findById(task.project).populate(
      "team",
      "createdBy"
    );
    const isTeamCreator = project?.team.createdBy.toString() === userId;
    const isProjectCreator = project?.createdBy.toString() === userId;
    const creator = await User.findById(userId);
    const isManager = creator?.role === "manager";

    if (!isAdmin && !isTeamCreator && !isProjectCreator && !isManager) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: task._id },
    });

    const memberIds = task.assignedMembers.map((am) => am.member);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { tasks: task._id } }
    );

    await Task.findByIdAndDelete(id);
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTasksByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const userId = res.locals.jwtData.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const isProjectMember = project.members.includes(userId);
    const team = await Team.findById(project.team);
    const isTeamCreator = team?.createdBy.toString() === userId;

    if (!isAdmin && !isProjectMember && !isTeamCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to view tasks for this project" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("project", "name")
      .populate("assignedMembers.member", "name email designation")
      .populate("createdBy", "name email");

    return res.status(200).json({ message: "OK", tasks });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTasksByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (
      res.locals.jwtData.role !== "admin" &&
      userId !== res.locals.jwtData.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these tasks" });
    }

    const tasks = await Task.find({ "assignedMembers.member": userId })
      .populate("project", "name")
      .populate("assignedMembers.member", "name email designation")
      .populate("createdBy", "name email");

    return res.status(200).json({ message: "OK", tasks });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTaskStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedMembers.some(
      (am) => am.member.toString() === res.locals.jwtData.id
    );
    const isAdmin = res.locals.jwtData.role === "admin";
    const project = await Project.findById(task.project);
    const isProjectMember = project?.members.includes(res.locals.jwtData.id);
    const team = await Team.findById(project?.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;

    if (!isAdmin && !isAssigned && !isProjectMember && !isTeamCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these stats" });
    }

    const statusCounts = task.assignedMembers.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      message: "OK",
      stats: {
        totalAssigned: task.assignedMembers.length,
        statusCounts,
        overdue:
          task.deadline < new Date() &&
          task.assignedMembers.some(
            (am) => am.status !== "done" && am.status !== "cancelled"
          ),
      },
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
