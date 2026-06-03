import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("token");
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