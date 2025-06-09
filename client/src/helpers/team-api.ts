import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8081/api/v1/team",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  withCredentials: true,
});

// ------------------- Team Management -------------------

export const getAllTeams = async () => {
  try {
    const res = await apiClient.get("/");
    return res.data.teams;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch teams");
  }
};

export const getTeamById = async (id: string) => {
  try {
    const res = await apiClient.get(`/${id}`);
    return res.data.team;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch team");
  }
};

export const createTeam = async (
  name: string,
  description: string,
  members: string[]
) => {
  try {
    const res = await apiClient.post("/", { name, description, members });
    return {
      success: true,
      message: res.data.message,
      team: res.data.team,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to create team");
  }
};

export const updateTeam = async (
  id: string,
  updatedData: {
    name?: string;
    description?: string;
    members?: string[];
  }
) => {
  try {
    const res = await apiClient.patch(`/${id}`, updatedData);
    return {
      success: true,
      message: res.data.message,
      team: res.data.team,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to update team");
  }
};

export const deleteTeam = async (id: string) => {
  try {
    const res = await apiClient.delete(`/${id}`);
    return { success: true, message: res.data.message };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to delete team");
  }
};

export const getTeamsByUser = async (userId: string) => {
  try {
    const res = await apiClient.get(`/user/${userId}`);
    return res.data.teams;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch user's teams"
    );
  }
};

export const getTeamStats = async (teamId: string) => {
  try {
    const res = await apiClient.get(`/stats/${teamId}`);
    return res.data.stats;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch team stats"
    );
  }
};
