"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Plus, ArrowLeftRight, Smartphone } from "lucide-react";
import { Card, Amount, Badge, Button, Spinner } from "@/components/ui";
import { accountsApi, transactionsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

interface Account {
    account_id: string;
    account_number: string;
    account_type: string;
    balance: number;
    is_active: boolean;
    interest_rate?: number;
    maturity_date?: string;
}

interface Transaction {
    txn_id: string;
    account_number: string;
    txn_type: string;
    amount: number;
    balance_after: number;
    status: string;
    reference: string;
    narration: string;
    created_at: string;
}

function AccountCard({ account }: { account: Account }) {
    const typeColors: Record<string, string> = {
        CURRENT: "bg-brand-500",
        SAVINGS: "bg-emerald-500",
        FIXED: "bg-violet-500",
    };

    const typeLabels: Record<string, string> = {
        CURRENT: "Current Account",
        SAVINGS: "Savings Account",
        FIXED: "Fixed Deposit",
    };

    return (
        <div className={`${typeColors[account.account_type] || "bg-brand-500"} rounded-2xl p-5 text-white`}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
                        {typeLabels[account.account_type]}
                    </p>
                    <p className="text-white/80 text-sm font-mono">{account.account_number}</p>
                </div>
                <Badge variant="default" className="bg-white/20 text-white border-0 text-xs">
                    {account.is_active ? "Active" : "Inactive"}
                </Badge>
            </div>
            <div>
                <p className="text-white/60 text-xs mb-1">Available balance</p>
                <Amount value={account.balance} size="xl" className="text-white" />
            </div>
            {account.account_type === "SAVINGS" && account.interest_rate && (
                <p className="text-white/50 text-xs mt-3">
                    {(account.interest_rate * 100).toFixed(1)}% p.a. interest
                </p>
            )}
            {account.account_type === "FIXED" && account.maturity_date && (
                <p className="text-white/50 text-xs mt-3">
                    Matures {new Date(account.maturity_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
            )}
        </div>
    );
}

function TxnRow({ txn }: { txn: Transaction }) {
    const isCredit = ["DEPOSIT", "TRANSFER_IN", "INTEREST"].includes(txn.txn_type);

    const typeLabel: Record<string, string> = {
        DEPOSIT: "Deposit",
        WITHDRAWAL: "Withdrawal",
        TRANSFER_IN: "Transfer received",
        TRANSFER_OUT: "Transfer sent",
        AIRTIME: "Airtime",
        DATA: "Data",
        INTEREST: "Interest credit",
    };

    return (
        <div className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-50" : "bg-surface-100"}`}>
                {isCredit
                    ? <ArrowDownLeft className="w-4 h-4 text-success" />
                    : <ArrowUpRight className="w-4 h-4 text-ink-secondary" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">
                    {txn.narration || typeLabel[txn.txn_type] || txn.txn_type}
                </p>
                <p className="text-xs text-ink-tertiary">
                    {new Date(txn.created_at).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular ${isCredit ? "text-success" : "text-ink-primary"}`}>
                    {isCredit ? "+" : "-"}<Amount value={txn.amount} size="sm" />
                </p>
                <p className="text-xs text-ink-tertiary">{txn.account_number}</p>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const { customer, isAuthenticated } = useAuthStore();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState(0);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login");
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, txnRes] = await Promise.all([
                accountsApi.getAll(),
                transactionsApi.history(5),
            ]);
            setAccounts(accRes.data);
            setTransactions(txnRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-ink-tertiary text-sm mb-0.5">
                        {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <h1 className="text-2xl font-semibold text-ink-primary">
                        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                        {customer?.first_name}
                    </h1>
                </div>
                {accounts.length === 0 && (
                    <Link href="/dashboard/accounts/new">
                        <Button size="sm" variant="secondary">
                            <Plus className="w-4 h-4" />
                            Open account
                        </Button>
                    </Link>
                )}
            </div>

            {/* No accounts state */}
            {accounts.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-6 h-6 text-brand-500" />
                    </div>
                    <h3 className="text-base font-semibold text-ink-primary mb-1">No accounts yet</h3>
                    <p className="text-sm text-ink-secondary mb-4">
                        Open your first account to start banking with Veritas.
                    </p>
                    <Link href="/dashboard/accounts/new">
                        <Button>Open an account</Button>
                    </Link>
                </Card>
            ) : (
                <>
                    {/* Total balance */}
                    <Card className="bg-surface-50 border-surface-100">
                        <p className="text-xs text-ink-tertiary uppercase tracking-widest font-medium mb-1">
                            Total balance
                        </p>
                        <Amount value={totalBalance} size="xl" className="text-ink-primary" />
                        <p className="text-xs text-ink-tertiary mt-1">
                            Across {accounts.length} account{accounts.length > 1 ? "s" : ""}
                        </p>
                    </Card>

                    {/* Account cards */}
                    <div>
                        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                            {accounts.map((acc, i) => (
                                <div key={acc.account_id} className="min-w-[280px]" onClick={() => setActiveCard(i)}>
                                    <AccountCard account={acc} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div>
                        <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest mb-3">
                            Quick actions
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: "Transfer", href: "/dashboard/transfer", icon: ArrowLeftRight },
                                { label: "Airtime", href: "/dashboard/airtime", icon: Smartphone },
                                { label: "History", href: "/dashboard/history", icon: ArrowUpRight },
                                { label: "Accounts", href: "/dashboard/accounts/new", icon: Plus },
                            ].map(({ label, href, icon: Icon }) => (
                                <Link key={label} href={href}>
                                    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-surface-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-150 cursor-pointer group">
                                        <div className="w-10 h-10 rounded-xl bg-surface-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors duration-150">
                                            <Icon className="w-4 h-4 text-ink-secondary group-hover:text-brand-600 transition-colors" />
                                        </div>
                                        <span className="text-xs font-medium text-ink-secondary group-hover:text-brand-600 transition-colors">
                                            {label}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent transactions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest">
                                Recent transactions
                            </p>
                            <Link href="/dashboard/history" className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors">
                                View all
                            </Link>
                        </div>
                        <Card padding="sm">
                            {transactions.length === 0 ? (
                                <p className="text-sm text-ink-tertiary text-center py-6">
                                    No transactions yet
                                </p>
                            ) : (
                                transactions.map((txn) => (
                                    <TxnRow key={txn.txn_id} txn={txn} />
                                ))
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}