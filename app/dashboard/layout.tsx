import DashboardShell from "./DashboardShell";

// This is a Server Component — no "use client" here.
// All client logic (hooks, auth redirect, nav active state) lives in DashboardShell.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}