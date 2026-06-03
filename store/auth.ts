import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Customer {
    customer_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    kyc_status: string;
}

interface AuthState {
    token: string | null;
    customer: Customer | null;
    setAuth: (token: string, customer: Customer) => void;
    setCustomer: (customer: Customer) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            customer: null,

            setAuth: (token, customer) => {
                localStorage.setItem("token", token);
                set({ token, customer });
            },

            setCustomer: (customer) => set({ customer }),

            logout: () => {
                localStorage.removeItem("token");
                set({ token: null, customer: null });
            },

            isAuthenticated: () => !!get().token,
        }),
        {
            name: "veritas-auth",
            partialize: (state) => ({ customer: state.customer, token: state.token }),
        }
    )
);