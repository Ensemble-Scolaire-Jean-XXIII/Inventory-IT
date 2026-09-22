export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const getToken = () =>
  typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

const handleUnauthorized = () => {
  localStorage.removeItem("token");
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/connexion")
  ) {
    window.location.href = "/connexion";
  }
  throw new Error("Session expirée");
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    const errData = await res.json().catch(() => ({}));
    if (getToken()) {
      return handleUnauthorized();
    }
    throw new Error(errData.error || "Non autorisé.");
  }
  if (res.status === 204) return;
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Une erreur est survenue");
  }
  return res.json();
};

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },

  post: async (endpoint: string, data: unknown) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  put: async (endpoint: string, data: unknown) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },
};