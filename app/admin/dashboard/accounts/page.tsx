"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, Badge, Amount, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface Account {
    account_id: string;
    account_number: string;
    account_type: string;
    balance: number;
    is_active: boolean;
    created_at: string;
    customer_name: string;
    email: string;
}

const TYPE_COLORS: Record<string, string> = {
    CURRENT: "info",
    SAVINGS: "success",
    FIXED: "warning",
};

export default function AdminAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        adminApi.getAccounts()
            .then(res => setAccounts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-primary">Accounts</h1>
                    <p className="text-sm text-ink-secondary mt-0.5">{accounts.length} total accounts</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            <Card padding="sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100">
                                {["Account number", "Type", "Customer", "Balance", "Status", "Opened"].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider py-2 px-3 first:pl-1">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((a) => (
                                <tr key={a.account_id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors">
                                    <td className="py-3 px-3 first:pl-1 font-mono text-ink-primary">{a.account_number}</td>
                                    <td className="py-3 px-3">
                                        <Badge variant={(TYPE_COLORS[a.account_type] || "default") as any}>
                                            {a.account_type}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-3">
                                        <p className="font-medium text-ink-primary">{a.customer_name}</p>
                                        <p className="text-xs text-ink-tertiary">{a.email}</p>
                                    </td>
                                    <td className="py-3 px-3">
                                        <Amount value={a.balance} size="sm" className="font-semibold text-ink-primary" />
                                    </td>
                                    <td className="py-3 px-3">
                                        <Badge variant={a.is_active ? "success" : "danger"}>
                                            {a.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-3 text-ink-tertiary text-xs">
                                        {new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}