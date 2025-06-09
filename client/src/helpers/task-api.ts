import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8081/api/v1/task",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(
        error.response.data?.message || "An error occurred"
      );
    } else if (error.request) {
      return Promise.reject("No response received from server");
    } else {
      return Promise.reject(error.message);
    }
  }
);

// ------------------- Task API Functions -------------------

export const getAllTasks = async () => {
  try {
    const res = await apiClient.get("/");
    return res.data.tasks || [];
  } catch (error) {
    throw new Error(error);
  }
};

export const getTaskById = async (id: string) => {
  try {
    const res = await apiClient.get(`/${id}`);
    return res.data.task;
  } catch (error) {
    throw new Error(error);
  }
};

export const createTask = async (taskData: {
  title: string;
  description: string;
  deadline: string;
  project: string;
  assignedMembers: { member: string }[];
}) => {
  try {
    const res = await apiClient.post("/", taskData);
    return res.data.task;
  } catch (error) {
    throw new Error(error);
  }
};

export const updateTask = async (
  id: string,
  taskData: {
    title?: string;
    description?: string;
    deadline?: string;
    assignedMembers?: { member: string; status?: string }[];
  }
) => {
  try {
    const res = await apiClient.put(`/${id}`, taskData);
    return res.data.task;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to update task");
  }
};

export const updateTaskStatus = async (id: string, status: string) => {
  try {
    const res = await apiClient.patch(`/${id}/status`, { status });
    return res.data.task;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to update task status"
    );
  }
};

export const deleteTask = async (id: string) => {
  try {
    const res = await apiClient.delete(`/${id}`);
    return res.data.message;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Unable to delete task");
  }
};

export const getTasksByProject = async (projectId: string) => {
  try {
    const res = await apiClient.get(`/project/${projectId}`);
    return res.data.tasks;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch project tasks"
    );
  }
};

export const getTasksByUser = async (userId: string) => {
  try {
    const res = await apiClient.get(`/user/${userId}`);
    return res.data.tasks;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch user tasks"
    );
  }
};

export const getTaskStats = async (id: string) => {
  try {
    const res = await apiClient.get(`/stats/${id}`);
    return res.data.stats;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Unable to fetch task stats"
    );
  }
};
