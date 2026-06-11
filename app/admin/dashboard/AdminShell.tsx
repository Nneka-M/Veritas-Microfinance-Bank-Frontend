"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Users, CreditCard,
    ArrowLeftRight, FileText, LogOut, ChevronRight,
} from "lucide-react";

const nav = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/dashboard/customers", label: "Customers", icon: Users },
    { href: "/admin/dashboard/accounts", label: "Accounts", icon: CreditCard },
    { href: "/admin/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/admin/dashboard/audit", label: "Audit Logs", icon: FileText },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) router.push("/admin/login");
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        router.push("/admin/login");
    };

    const user = (() => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("admin_user");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    })();

    return (
        <div className="flex h-screen bg-surface-50 overflow-hidden">
            <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-surface-100">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-surface-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                            <span className="text-white font-display italic text-lg leading-none">V</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-ink-primary leading-tight">Veritas</p>
                            <p className="text-[10px] text-ink-tertiary uppercase tracking-widest">Admin Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
                    {nav.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                  ${active
                                        ? "bg-brand-50 text-brand-600 font-medium"
                                        : "text-ink-secondary hover:bg-surface-50 hover:text-ink-primary"
                                    }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="px-3 py-4 border-t border-surface-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <span className="text-brand-600 text-xs font-semibold">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-primary truncate">{user?.full_name || "Admin"}</p>
                            <p className="text-xs text-ink-tertiary truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-secondary hover:bg-red-50 hover:text-danger transition-colors duration-150"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-8 py-8 page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}