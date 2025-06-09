import { NextFunction, Request, Response } from "express";
import User from "../models/userSchema";
import Team from "../models/teamSchema";
import Project from "../models/projectSchema";
import Task from "../models/taskSchema";
import { hash, compare } from "bcrypt";
import { createToken } from "../utils/token-manager";
import { COOKIE_NAME } from "../utils/constants";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (res.locals.jwtData.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const users = await User.find()
      .select("-password")
      .populate("teams", "name")
      .populate("projects", "name")
      .populate("tasks", "title");

    return res.status(200).json({ message: "OK", users });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, designation, role } = req.body;

    // Only admin can create users with admin/manager role
    // if (role && role !== 'employee' && res.locals.jwtData?.role !== 'admin') {
    //   return res.status(403).json({ message: "Only admin can create users with elevated roles" });
    // }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ message: "User already registered" });
    }

    const hashedPassword = await hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      designation,
      role: role || "employee",
    });
    await user.save();

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      domain: "localhost",
      signed: true,
      path: "/",
    });

    const token = createToken(user._id.toString(), user.email, user.role, "7d");

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, {
      path: "/",
      domain: "localhost",
      expires,
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json({
      message: "OK",
      id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      role: user.role,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }

    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Incorrect Password" });
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      domain: "localhost",
      signed: true,
      path: "/",
    });

    const token = createToken(user._id.toString(), user.email, user.role, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, {
      path: "/",
      domain: "localhost",
      expires,
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "OK",
      id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      role: user.role,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id)
      .select("-password")
      .populate("teams", "name")
      .populate("projects", "name")
      .populate("tasks", "title");

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not registered OR Token malfunctioned" });
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).json({ message: "Permissions didn't match" });
    }
    return res.status(200).json({
      message: "OK",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.role,
        teams: user.teams,
        projects: user.projects,
        tasks: user.tasks,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res
        .status(401)
        .json({ message: "User not registered OR Token malfunctioned" });
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).json({ message: "Permissions didn't match" });
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      domain: "localhost",
      signed: true,
      path: "/",
    });

    return res.status(200).json({ message: "OK" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .populate("teams", "name")
      .populate("projects", "name")
      .populate("tasks", "title");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "OK",
      user,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user._id.toString() !== res.locals.jwtData.id &&
      res.locals.jwtData.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this user" });
    }

    await Team.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    await Project.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    await Task.updateMany(
      { "assignedMembers.member": user._id },
      { $pull: { assignedMembers: { member: user._id } } }
    );

    await User.findByIdAndDelete(id);

    if (user._id.toString() === res.locals.jwtData.id) {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        domain: "localhost",
        signed: true,
        path: "/",
      });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const editUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, designation, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user._id.toString() !== res.locals.jwtData.id &&
      res.locals.jwtData.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this user" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.designation = designation || user.designation;

    if (role && res.locals.jwtData.role === "admin") {
      user.role = role;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("teams", "name")
      .populate("projects", "name")
      .populate("tasks", "title");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (res.locals.jwtData.role !== "admin" && res.locals.jwtData.id !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const teamCount = await Team.countDocuments({ members: user._id });
    const projectCount = await Project.countDocuments({ members: user._id });

    const tasks = await Task.aggregate([
      { $match: { "assignedMembers.member": user._id } },
      { $unwind: "$assignedMembers" },
      { $match: { "assignedMembers.member": user._id } },
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

    return res.status(200).json({
      message: "OK",
      stats: {
        teamCount,
        projectCount,
        taskStats,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};
