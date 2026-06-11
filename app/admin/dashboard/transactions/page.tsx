"use client";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { Card, Badge, Amount, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface Transaction {
    txn_id: string;
    txn_type: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    narration: string;
    created_at: string;
    account_number: string;
    customer_name: string;
}

const CREDIT_TYPES = new Set(["DEPOSIT", "TRANSFER_IN", "INTEREST"]);

const TYPE_LABELS: Record<string, string> = {
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    TRANSFER_IN: "Transfer In",
    TRANSFER_OUT: "Transfer Out",
    AIRTIME: "Airtime",
    DATA: "Data",
    INTEREST: "Interest",
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const filters = ["ALL", "DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", "AIRTIME"];

    const load = () => {
        setLoading(true);
        adminApi.getTransactions(100)
            .then(res => setTransactions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = filter === "ALL"
        ? transactions
        : transactions.filter(t => t.txn_type === filter);

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-primary">Transactions</h1>
                    <p className="text-sm text-ink-secondary mt-0.5">{filtered.length} transactions</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150
              ${filter === f ? "bg-brand-500 text-white" : "bg-surface-100 text-ink-secondary hover:bg-surface-200"}`}
                    >
                        {f === "ALL" ? "All" : TYPE_LABELS[f] || f}
                    </button>
                ))}
            </div>

            <Card padding="sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100">
                                {["Type", "Customer", "Account", "Amount", "Status", "Reference", "Date"].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider py-2 px-3 first:pl-1">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t) => {
                                const isCredit = CREDIT_TYPES.has(t.txn_type);
                                return (
                                    <tr key={t.txn_id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors">
                                        <td className="py-3 px-3 first:pl-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCredit ? "bg-green-50" : "bg-surface-100"}`}>
                                                    {isCredit
                                                        ? <ArrowDownLeft className="w-3.5 h-3.5 text-success" />
                                                        : <ArrowUpRight className="w-3.5 h-3.5 text-ink-secondary" />
                                                    }
                                                </div>
                                                <span className="text-ink-primary">{TYPE_LABELS[t.txn_type] || t.txn_type}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-ink-secondary">{t.customer_name}</td>
                                        <td className="py-3 px-3 font-mono text-xs text-ink-tertiary">{t.account_number}</td>
                                        <td className="py-3 px-3">
                                            <span className={`font-semibold tabular ${isCredit ? "text-success" : "text-ink-primary"}`}>
                                                {isCredit ? "+" : "−"}<Amount value={t.amount} size="sm" />
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <Badge variant={t.status === "SUCCESS" ? "success" : t.status === "FAILED" ? "danger" : "warning"}>
                                                {t.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs text-ink-tertiary">{t.reference}</td>
                                        <td className="py-3 px-3 text-xs text-ink-tertiary">
                                            {new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}