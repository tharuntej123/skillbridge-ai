export function storeAuthToken(accessToken: string, role: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", accessToken);
  localStorage.setItem("role", role);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
