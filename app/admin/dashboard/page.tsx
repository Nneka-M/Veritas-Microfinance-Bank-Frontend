"use client";
import { useEffect, useState } from "react";
import { Users, CreditCard, ArrowLeftRight, TrendingUp, Clock, Wallet } from "lucide-react";
import { Card, Amount, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface Stats {
    total_customers: number;
    total_accounts: number;
    total_transactions: number;
    total_volume: number;
    pending_kyc: number;
    total_balance: number;
}

function StatCard({
    label, value, icon: Icon, color, isMoney = false,
}: {
    label: string;
    value: number;
    icon: any;
    color: string;
    isMoney?: boolean;
}) {
    return (
        <Card className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xs text-ink-tertiary font-medium uppercase tracking-widest mb-1">{label}</p>
                {isMoney
                    ? <Amount value={value} size="lg" className="text-ink-primary font-semibold" />
                    : <p className="text-2xl font-semibold text-ink-primary tabular">{value.toLocaleString()}</p>
                }
            </div>
        </Card>
    );
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.stats()
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
    if (!stats) return <p className="text-ink-secondary">Failed to load stats.</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-ink-primary mb-1">Overview</h1>
                <p className="text-sm text-ink-secondary">System-wide summary for Veritas Microfinance Bank</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Total customers" value={stats.total_customers} icon={Users} color="bg-brand-500" />
                <StatCard label="Total accounts" value={stats.total_accounts} icon={CreditCard} color="bg-emerald-500" />
                <StatCard label="Total transactions" value={stats.total_transactions} icon={ArrowLeftRight} color="bg-violet-500" />
                <StatCard label="Transaction volume" value={stats.total_volume} icon={TrendingUp} color="bg-amber-500" isMoney />
                <StatCard label="Pending KYC" value={stats.pending_kyc} icon={Clock} color="bg-orange-500" />
                <StatCard label="Total deposits" value={stats.total_balance} icon={Wallet} color="bg-cyan-500" isMoney />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Manage customers", href: "/admin/dashboard/customers", desc: "View, verify and manage customer accounts" },
                    { label: "All transactions", href: "/admin/dashboard/transactions", desc: "Monitor all transactions across the system" },
                    { label: "Audit logs", href: "/admin/dashboard/audit", desc: "Track all system events and changes" },
                ].map(({ label, href, desc }) => (
                    <a key={href} href={href}>
                        <Card className="hover:border-brand-200 hover:shadow-panel transition-all duration-150 cursor-pointer h-full">
                            <p className="text-sm font-semibold text-ink-primary mb-1">{label}</p>
                            <p className="text-xs text-ink-secondary">{desc}</p>
                        </Card>
                    </a>
                ))}
            </div>
        </div>
    );
}