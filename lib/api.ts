import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    const direct = localStorage.getItem("token");
    if (direct) return direct;
    try {
        const raw = localStorage.getItem("veritas-auth");
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed?.state?.token || null;
        }
    } catch { }
    return null;
}

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("veritas-auth");
            window.location.href = "/auth/login";
        }
        return Promise.reject(err);
    }
);

export const authApi = {
    register: (data: any) => api.post("/auth/register", data),
    verifyOtp: (data: any) => api.post("/auth/verify-otp", data),
    login: (data: any) => api.post("/auth/login", data),
    verifyKyc: (data: any) => api.post("/auth/kyc", data),
    me: () => api.get("/auth/me"),
};

export const accountsApi = {
    create: (data: any) => api.post("/accounts", data),
    getAll: () => api.get("/accounts"),
    getBalance: (id: string) => api.get(`/accounts/${id}/balance`),
    resolveNumber: (num: string) => api.get(`/accounts/resolve/${num}`),
};

export const transactionsApi = {
    deposit: (data: any) => api.post("/transactions/deposit", data),
    withdraw: (data: any) => api.post("/transactions/withdraw", data),
    transfer: (data: any) => api.post("/transactions/transfer", data),
    airtime: (data: any) => api.post("/transactions/airtime", data),
    history: (limit = 50, offset = 0) => api.get(`/transactions/history?limit=${limit}&offset=${offset}`),
    transfers: () => api.get("/transactions/transfers"),
};

export const beneficiariesApi = {
    getAll: () => api.get("/beneficiaries"),
    add: (data: any) => api.post("/beneficiaries", data),
    remove: (id: string) => api.delete(`/beneficiaries/${id}`),
};

export const adminApi = {
    login: (data: any) => api.post("/admin/login", data),
    stats: () => api.get("/admin/stats"),
    getCustomers: (limit = 50, offset = 0) => api.get(`/admin/customers?limit=${limit}&offset=${offset}`),
    updateKyc: (id: string, status: string) => api.patch(`/admin/customers/${id}/kyc`, { id_type: status }),
    toggleCustomer: (id: string) => api.patch(`/admin/customers/${id}/toggle`),
    getAccounts: (limit = 50, offset = 0) => api.get(`/admin/accounts?limit=${limit}&offset=${offset}`),
    getTransactions: (limit = 50, offset = 0) => api.get(`/admin/transactions?limit=${limit}&offset=${offset}`),
    getAudit: (limit = 50, offset = 0) => api.get(`/admin/audit?limit=${limit}&offset=${offset}`),
};