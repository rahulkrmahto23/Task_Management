import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8081/api/v1/project",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ------------------- Project Management -------------------

export const getAllProjects = async () => {
  try {
    const res = await apiClient.get("/");
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch projects");
  }
};

export const getProjectById = async (id: string) => {
  try {
    const res = await apiClient.get(`/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch project");
  }
};

export const createProject = async (data: {
  name: string;
  description: string;
  members: string[];
  team: string | null;
  startDate?: Date;
  endDate?: Date | null;
}) => {
  try {
    const res = await apiClient.post("/", data);
    return res.data;
  } catch (error: any) {
    console.error('Project creation error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      "Unable to create project"
    );
  }
};

export const updateProject = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    members?: string[];
  }
) => {
  try {
    const res = await apiClient.put(`/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to update project");
  }
};

export const deleteProject = async (id: string) => {
  try {
    const res = await apiClient.delete(`/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to delete project");
  }
};

export const getProjectsByTeam = async (teamId: string) => {
  try {
    const res = await apiClient.get(`/team/${teamId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch team projects");
  }
};

export const getProjectsByUser = async (userId: string) => {
  try {
    const res = await apiClient.get(`/user/${userId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch user projects");
  }
};

export const getProjectStats = async (projectId: string) => {
  try {
    const res = await apiClient.get(`/${projectId}/stats`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch project stats");
  }
};