import { NextFunction, Request, Response } from "express";
import Project from "../models/projectSchema";
import Team from "../models/teamSchema";
import User from "../models/userSchema";
import Task from "../models/taskSchema";

export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isAdmin = res.locals.jwtData.role === "admin";
    const filter = isAdmin ? {} : { members: res.locals.jwtData.id };

    const projects = await Project.find(filter)
      .populate("members", "name email designation")
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate("tasks", "title status");

    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "name email designation")
      .populate("team", "name description")
      .populate("createdBy", "name email")
      .populate("tasks", "title status deadline");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const isMember = project.members.some(
      (m) => m._id.toString() === res.locals.jwtData.id
    );
    const isAdmin = res.locals.jwtData.role === "admin";
    const team = await Team.findById(project.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;

    if (!isAdmin && !isMember && !isTeamCreator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view this project",
        });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, members, team } = req.body;
    const createdBy = res.locals.jwtData.id;

    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const isTeamCreator = teamExists.createdBy.toString() === createdBy;
    const creator = await User.findById(createdBy);
    const isManager = creator?.role === "manager";

    if (!isAdmin && !isTeamCreator && !isManager) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to create projects" });
    }

    const invalidMembers = members.filter(
      (m: string) => !teamExists.members.includes(m)
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more members are not part of the team",
      });
    }

    const project = await Project.create({
      name,
      description,
      members,
      team,
      createdBy,
    });

    await Team.findByIdAndUpdate(team, {
      $addToSet: { projects: project._id },
    });

    await User.updateMany(
      { _id: { $in: members } },
      { $addToSet: { projects: project._id } }
    );

    const populatedProject = await Project.findById(project._id)
      .populate("members", "name email designation")
      .populate("team", "name")
      .populate("createdBy", "name email");

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, members } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check authorization
    const isAdmin = res.locals.jwtData.role === "admin";
    const team = await Team.findById(project.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;
    const creator = await User.findById(res.locals.jwtData.id);
    const isManager = creator?.role === "manager";
    const isProjectMember = project.members.includes(res.locals.jwtData.id);

    if (!isAdmin && !isTeamCreator && !isManager && !isProjectMember) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this project",
        });
    }

    if (members && !isAdmin && !isTeamCreator && !isManager) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to modify project members",
        });
    }

    if (members) {
      const invalidMembers = members.filter(
        (m: string) => !team?.members.includes(m)
      );
      if (invalidMembers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more members are not part of the team",
        });
      }

      const currentMembers = project.members.map((m) => m.toString());
      const membersToAdd = members.filter(
        (m: string) => !currentMembers.includes(m)
      );
      const membersToRemove = currentMembers.filter(
        (m) => !members.includes(m)
      );

      project.members = members;

      if (membersToAdd.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToAdd } },
          { $addToSet: { projects: project._id } }
        );
      }

      if (membersToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToRemove } },
          { $pull: { projects: project._id } }
        );
      }
    }

    project.name = name || project.name;
    project.description = description || project.description;
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("members", "name email designation")
      .populate("team", "name")
      .populate("createdBy", "name email");

    res.status(200).json({ success: true, data: populatedProject });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const isAdmin = res.locals.jwtData.role === "admin";
    const team = await Team.findById(project.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;
    const creator = await User.findById(res.locals.jwtData.id);
    const isManager = creator?.role === "manager";

    if (!isAdmin && !isTeamCreator && !isManager) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this project",
        });
    }

    await Team.findByIdAndUpdate(project.team, {
      $pull: { projects: project._id },
    });

    await User.updateMany(
      { _id: { $in: project.members } },
      { $pull: { projects: project._id } }
    );

    await Task.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectsByTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    const isMember = team.members.includes(res.locals.jwtData.id);
    const isAdmin = res.locals.jwtData.role === "admin";
    const isTeamCreator = team.createdBy.toString() === res.locals.jwtData.id;

    if (!isAdmin && !isMember && !isTeamCreator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view these projects",
        });
    }

    const projects = await Project.find({ team: teamId })
      .populate("members", "name email designation")
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate("tasks", "title status");

    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectsByUser = async (
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
        .json({
          success: false,
          message: "Not authorized to view these projects",
        });
    }

    const projects = await Project.find({ members: userId })
      .populate("members", "name email designation")
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate("tasks", "title status");

    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const isMember = project.members.includes(res.locals.jwtData.id);
    const isAdmin = res.locals.jwtData.role === "admin";
    const team = await Team.findById(project.team);
    const isTeamCreator = team?.createdBy.toString() === res.locals.jwtData.id;

    if (!isAdmin && !isMember && !isTeamCreator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view these stats",
        });
    }

    const memberCount = project.members.length;
    const taskCount = await Task.countDocuments({ project: project._id });

    const tasks = await Task.aggregate([
      { $match: { project: project._id } },
      { $unwind: "$assignedMembers" },
      {
        $group: {
          _id: "$assignedMembers.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskStats = tasks.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      data: {
        memberCount,
        taskCount,
        taskStats,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
