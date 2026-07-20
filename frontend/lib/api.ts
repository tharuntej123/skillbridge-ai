const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getHeaders(isMultipart = false) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getHeaders(options.body instanceof FormData), ...options.headers };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const detail = typeof data === "object" && data !== null
        ? data.detail || data.message || "Something went wrong"
        : data || "Something went wrong";
      throw new Error(detail);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${error.message} (${url})`);
    }
    throw new Error(`Unable to reach the backend server at ${url}. Please make sure it is running.`);
  }
}

export const api = {
  // Auth
  async register(email: string, password_raw: string, role: string) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: password_raw, role }),
    });
  },
  
  async login(email: string, password_raw: string) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: password_raw }),
    });
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
    }
    return data;
  },
  
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  },
  
  getRole() {
    return typeof window !== "undefined" ? localStorage.getItem("role") : null;
  },
  
  getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null;
  },

  // Profile
  async getProfile() {
    return request("/profile");
  },
  
  async updateProfile(data: { name: string; skills?: string; education?: string; experience?: string }) {
    return request("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/profile/resume", {
      method: "POST",
      body: formData,
    });
  },

  // Jobs
  async getJobs() {
    return request("/jobs");
  },
  
  async getPostedJobs() {
    return request("/jobs/posted");
  },
  
  async getAppliedJobs() {
    return request("/jobs/applied");
  },
  
  async getJobApplicants(jobId: string) {
    return request(`/jobs/${jobId}/applicants`);
  },
  
  async createJob(jobData: { title: string; description: string; skills_required: string; budget: number }) {
    return request("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },
  
  async updateJob(jobId: string, jobData: { title: string; description: string; skills_required: string; budget: number }) {
    return request(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    });
  },
  
  async deleteJob(jobId: string) {
    return request(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  },
  
  async applyToJob(jobId: string) {
    return request(`/jobs/${jobId}/apply`, {
      method: "POST",
    });
  },
  
  async updateApplicationStatus(appId: string, status: "applied" | "shortlisted" | "rejected") {
    return request(`/jobs/applications/${appId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // AI & RAG Features
  async matchJobs() {
    return request("/ai/match-jobs", {
      method: "POST",
    });
  },
  
  async getCareerGuidance() {
    return request("/ai/career-guidance", {
      method: "POST",
    });
  },
  
  async getResumeFeedback() {
    return request("/ai/resume-feedback", {
      method: "POST",
    });
  },
  
  async generateLearningRoadmap(goal: string) {
    return request("/ai/learning-roadmap", {
      method: "POST",
      body: JSON.stringify({ goal }),
    });
  },
  
  async getSavedLearningRoadmap() {
    return request("/ai/learning-roadmap/saved");
  },
  
  async searchJobs(query: string) {
    return request(`/ai/search?q=${encodeURIComponent(query)}`);
  }
};
