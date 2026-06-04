"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    ArrowLeftRight,
    Smartphone,
    History,
    PlusCircle,
    LogOut,
    User,
    ChevronRight,
    ArrowDownToLine,
    ArrowUpFromLine,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api";

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
    { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/dashboard/airtime", label: "Airtime", icon: Smartphone },
    { href: "/dashboard/history", label: "History", icon: History },
    { href: "/dashboard/accounts/new", label: "New Account", icon: PlusCircle },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { customer, isAuthenticated, logout, setCustomer } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login");
            return;
        }
        // Refresh customer data from backend on every dashboard load
        authApi.me().then(res => setCustomer(res.data)).catch(() => { });
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/auth/login");
    };

    const isActive = (item: { href: string; exact?: boolean }) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
    };

    return (
        <div className="min-h-screen bg-surface-50 flex">
            {/* ── Sidebar (desktop) ───────────────────────────── */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-surface-100 fixed inset-y-0 left-0 z-30">
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-100">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold italic text-lg leading-none">V</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink-primary leading-tight">Veritas</p>
                        <p className="text-[10px] text-ink-tertiary uppercase tracking-widest">Microfinance</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                                    ${active
                                        ? "bg-brand-500 text-white shadow-sm"
                                        : "text-ink-secondary hover:bg-surface-50 hover:text-ink-primary"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-ink-tertiary group-hover:text-ink-secondary"}`} />
                                {item.label}
                                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 py-4 border-t border-surface-100 space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-primary truncate">
                                {customer?.full_name || "—"}
                            </p>
                            <p className="text-xs text-ink-tertiary truncate">{customer?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-red-50 hover:text-danger transition-all duration-150"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── Mobile top bar ───────────────────────────────── */}
            <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-surface-100 flex items-center justify-between px-4 h-14">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                        <span className="text-white font-bold italic text-base leading-none">V</span>
                    </div>
                    <p className="text-sm font-semibold text-ink-primary">Veritas</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-ink-tertiary hover:bg-surface-100 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* ── Mobile bottom nav ────────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-surface-100 flex items-center justify-around px-2 h-16">
                {[
                    { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
                    { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
                    { href: "/dashboard/airtime", label: "Airtime", icon: Smartphone },
                    { href: "/dashboard/history", label: "History", icon: History },
                    { href: "/dashboard/accounts/new", label: "Account", icon: PlusCircle },
                ].map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${active ? "bg-brand-500" : "bg-transparent"}`}>
                                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-ink-tertiary"}`} />
                            </div>
                            <span className={`text-[10px] font-medium ${active ? "text-brand-500" : "text-ink-tertiary"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Main content ─────────────────────────────────── */}
            <main className="flex-1 md:ml-64 px-4 md:px-10 pt-20 md:pt-10 pb-24 md:pb-10">
                <div className="max-w-3xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}