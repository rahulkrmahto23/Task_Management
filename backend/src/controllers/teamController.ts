import { NextFunction, Request, Response } from "express";
import Team from "../models/teamSchema";
import User from "../models/userSchema";
import Project from "../models/projectSchema";
import Task from "../models/taskSchema";

export const getAllTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    const filter = isAdmin
      ? {}
      : {
          $or: [{ members: userId }, { createdBy: userId }],
        };

    const teams = await Team.find(filter)
      .populate("members", "name email designation role")
      .populate("createdBy", "name email")
      .populate("projects", "name");

    return res.status(200).json({ message: "OK", teams });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTeamById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    const team = await Team.findById(id)
      .populate("members", "name email designation role")
      .populate("createdBy", "name email")
      .populate("projects", "name description");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member._id.toString() === userId
    );
    const isCreator = team.createdBy._id.toString() === userId;

    if (!isAdmin && !isMember && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team" });
    }

    return res.status(200).json({ message: "OK", team });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, members } = req.body;
    const createdBy = res.locals.jwtData.id;

    const creator = await User.findById(createdBy);
    if (!creator) {
      return res.status(404).json({ message: "Creator user not found" });
    }

    if (creator.role === "employee") {
      return res
        .status(403)
        .json({ message: "Only admins and managers can create teams" });
    }

    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res
        .status(400)
        .json({ message: "One or more member IDs are invalid" });
    }

    const allMembers = [...new Set([...members, createdBy])];

    const team = new Team({
      name,
      description,
      members: allMembers,
      createdBy,
    });

    await team.save();

    await User.updateMany(
      { _id: { $in: allMembers } },
      { $addToSet: { teams: team._id } }
    );

    const populatedTeam = await Team.findById(team._id)
      .populate("members", "name email designation role")
      .populate("createdBy", "name email")
      .populate("projects", "name");

    return res.status(201).json({
      message: "Team created successfully",
      team: populatedTeam,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, members } = req.body;
    const userId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isCreator = team.createdBy.toString() === userId;

    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this team" });
    }

    if (members) {
      const users = await User.find({ _id: { $in: members } });
      if (users.length !== members.length) {
        return res
          .status(400)
          .json({ message: "One or more member IDs are invalid" });
      }
    }

    team.name = name || team.name;
    team.description = description || team.description;

    if (members) {
      const allMembers = [...new Set([...members, team.createdBy.toString()])];

      const currentMembers = team.members.map((m) => m.toString());
      const membersToAdd = allMembers.filter(
        (m) => !currentMembers.includes(m)
      );
      const membersToRemove = currentMembers.filter(
        (m) => !allMembers.includes(m) && m !== team.createdBy.toString()
      );

      team.members = allMembers;

      if (membersToAdd.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToAdd } },
          { $addToSet: { teams: team._id } }
        );
      }

      if (membersToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: membersToRemove } },
          { $pull: { teams: team._id } }
        );

        await Project.updateMany(
          { team: team._id },
          { $pull: { members: { $in: membersToRemove } } }
        );
      }
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate("members", "name email designation role")
      .populate("createdBy", "name email")
      .populate("projects", "name");

    return res.status(200).json({
      message: "Team updated successfully",
      team: populatedTeam,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isCreator = team.createdBy.toString() === userId;

    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this team" });
    }

    await User.updateMany(
      { _id: { $in: team.members } },
      { $pull: { teams: team._id } }
    );

    const projects = await Project.find({ team: team._id });
    const projectIds = projects.map((p) => p._id);

    await Task.deleteMany({ project: { $in: projectIds } });
    await Project.deleteMany({ team: team._id });

    await Team.findByIdAndDelete(id);

    return res.status(200).json({ message: "Team deleted successfully" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTeamsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const currentUserId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    if (!isAdmin && userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these teams" });
    }

    const teams = await Team.find({ members: userId })
      .populate("members", "name email designation role")
      .populate("createdBy", "name email")
      .populate("projects", "name");

    return res.status(200).json({ message: "OK", teams });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getTeamStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = res.locals.jwtData.id;
    const isAdmin = res.locals.jwtData.role === "admin";

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isMember = team.members.includes(userId);
    const isCreator = team.createdBy.toString() === userId;

    if (!isAdmin && !isMember && !isCreator) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these stats" });
    }

    const projectCount = await Project.countDocuments({ team: team._id });
    const memberCount = team.members.length;

    const tasks = await Task.aggregate([
      { $match: { project: { $in: team.projects } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskStats = tasks.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      message: "OK",
      stats: {
        projectCount,
        memberCount,
        taskStats,
      },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
