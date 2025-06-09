import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8081/api/v1/user",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ------------------- User Auth -------------------

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await apiClient.post("/login", { email, password });
    return {
      success: true,
      message: res.data.message,
      user: {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        designation: res.data.designation,
        role: res.data.role,
      },
    };
  } catch (error: any) {
    console.error("Login Error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Unable to login");
  }
};

export const signupUser = async (
  name: string,
  email: string,
  password: string,
  designation: string,
  role = "employee"
) => {
  try {
    const res = await apiClient.post("/signup", {
      name,
      email,
      password,
      designation,
      role,
    });
    return {
      success: true,
      message: res.data.message,
      user: {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        designation: res.data.designation,
        role: res.data.role,
      },
    };
  } catch (error: any) {
    console.error("Signup Error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Unable to signup");
  }
};

export const logoutUser = async () => {
  try {
    const res = await apiClient.get("/logout");
    return { success: true, message: res.data.message };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to logout");
  }
};

export const verifyUser = async () => {
  try {
    const res = await apiClient.get("/verify");
    return {
      success: true,
      user: {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        designation: res.data.user.designation,
        role: res.data.user.role,
        teams: res.data.user.teams,
        projects: res.data.user.projects,
        tasks: res.data.user.tasks,
      },
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Verification failed");
  }
};

// ------------------- User Management -------------------

export const getAllUsers = async () => {
  try {
    const res = await apiClient.get("/");
    return res.data.users;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch users");
  }
};

export const getUserById = async (id: string) => {
  try {
    const res = await apiClient.get(`/${id}`);
    return res.data.user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to fetch user");
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res = await apiClient.delete(`/${id}`);
    return { success: true, message: res.data.message };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to delete user");
  }
};

export const editUser = async (
  id: string,
  updatedData: {
    name?: string;
    email?: string;
    designation?: string;
    role?: string;
  }
) => {
  try {
    const res = await apiClient.put(`/${id}`, updatedData);
    return {
      success: true,
      message: res.data.message,
      user: res.data.user,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to update user");
  }
};

export const getUserStats = async (id: string) => {
  try {
    const res = await apiClient.get(`/stats/${id}`);
    return res.data.stats;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch user stats"
    );
  }
};
