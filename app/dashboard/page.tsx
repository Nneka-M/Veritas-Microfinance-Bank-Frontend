"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowUpRight, ArrowDownLeft, Plus, ArrowLeftRight,
    Smartphone, Eye, EyeOff, Copy, Check, ArrowDownToLine,
    ArrowUpFromLine, TrendingUp, RefreshCw,
} from "lucide-react";
import { Spinner } from "@/components/ui";
import { accountsApi, transactionsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

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

// ── Account type config ───────────────────────────────────────
const ACCOUNT_CONFIG: Record<string, { gradient: string; label: string; chipBg: string }> = {
    CURRENT: {
        gradient: "from-brand-600 to-brand-500",
        label: "Current Account",
        chipBg: "bg-white/20",
    },
    SAVINGS: {
        gradient: "from-emerald-600 to-emerald-400",
        label: "Savings Account",
        chipBg: "bg-white/20",
    },
    FIXED: {
        gradient: "from-violet-600 to-violet-400",
        label: "Fixed Deposit",
        chipBg: "bg-white/20",
    },
};

// ── Account Card ─────────────────────────────────────────────
function AccountCard({
    account,
    active,
    onClick,
}: {
    account: Account;
    active: boolean;
    onClick: () => void;
}) {
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [copied, setCopied] = useState(false);
    const cfg = ACCOUNT_CONFIG[account.account_type] || ACCOUNT_CONFIG.CURRENT;

    const copyNumber = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(account.account_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleBalance = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBalanceHidden(h => !h);
    };

    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.gradient} cursor-pointer select-none
                transition-all duration-200
                ${active ? "ring-2 ring-white ring-offset-2 ring-offset-surface-100 shadow-xl scale-[1.01]" : "shadow-md hover:shadow-lg hover:scale-[1.005]"}
            `}
        >
            {/* decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-6 w-48 h-48 rounded-full bg-white/5" />

            <div className="relative p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-white/60 text-[11px] font-medium uppercase tracking-widest mb-0.5">
                            {cfg.label}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-white/90 text-sm font-mono tracking-wider">
                                {account.account_number.replace(/(\d{3})(\d{4})(\d{3})/, "$1 $2 $3")}
                            </p>
                            <button onClick={copyNumber} className="text-white/50 hover:text-white transition-colors">
                                {copied
                                    ? <Check className="w-3.5 h-3.5 text-green-300" />
                                    : <Copy className="w-3.5 h-3.5" />
                                }
                            </button>
                        </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.chipBg} text-white/80`}>
                        {account.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                </div>

                {/* Balance row */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-white/50 text-xs mb-1">Available balance</p>
                        <div className="flex items-center gap-2">
                            <p className="text-white text-3xl font-semibold tracking-tight">
                                {balanceHidden
                                    ? "₦ ••••••"
                                    : `₦${account.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                                }
                            </p>
                            <button onClick={toggleBalance} className="text-white/50 hover:text-white transition-colors mb-1">
                                {balanceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {/* Interest / maturity info */}
                    {account.account_type === "SAVINGS" && account.interest_rate && (
                        <div className="text-right">
                            <p className="text-white/40 text-[10px]">Interest p.a.</p>
                            <p className="text-white/80 text-sm font-semibold">{(account.interest_rate * 100).toFixed(0)}%</p>
                        </div>
                    )}
                    {account.account_type === "FIXED" && account.maturity_date && (
                        <div className="text-right">
                            <p className="text-white/40 text-[10px]">Matures</p>
                            <p className="text-white/80 text-sm font-medium">
                                {new Date(account.maturity_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Transaction row ───────────────────────────────────────────
const TXN_META: Record<string, { label: string; credit: boolean; iconBg: string; iconColor: string }> = {
    DEPOSIT: { label: "Deposit", credit: true, iconBg: "bg-green-50", iconColor: "text-success" },
    WITHDRAWAL: { label: "Withdrawal", credit: false, iconBg: "bg-surface-100", iconColor: "text-ink-secondary" },
    TRANSFER_IN: { label: "Transfer received", credit: true, iconBg: "bg-green-50", iconColor: "text-success" },
    TRANSFER_OUT: { label: "Transfer sent", credit: false, iconBg: "bg-surface-100", iconColor: "text-ink-secondary" },
    AIRTIME: { label: "Airtime", credit: false, iconBg: "bg-amber-50", iconColor: "text-warning" },
    DATA: { label: "Data", credit: false, iconBg: "bg-amber-50", iconColor: "text-warning" },
    INTEREST: { label: "Interest credit", credit: true, iconBg: "bg-blue-50", iconColor: "text-brand-600" },
};

function TxnRow({ txn }: { txn: Transaction }) {
    const meta = TXN_META[txn.txn_type] || { label: txn.txn_type, credit: false, iconBg: "bg-surface-100", iconColor: "text-ink-secondary" };

    return (
        <div className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                {meta.credit
                    ? <ArrowDownLeft className={`w-4 h-4 ${meta.iconColor}`} />
                    : <ArrowUpRight className={`w-4 h-4 ${meta.iconColor}`} />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">
                    {txn.narration || meta.label}
                </p>
                <p className="text-xs text-ink-tertiary">
                    {new Date(txn.created_at).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                    })}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular ${meta.credit ? "text-success" : "text-ink-primary"}`}>
                    {meta.credit ? "+" : "−"}₦{txn.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-ink-tertiary">
                    {txn.status === "SUCCESS" ? "" : txn.status}
                </p>
            </div>
        </div>
    );
}

// ── Quick action button ───────────────────────────────────────
function QuickAction({ href, icon: Icon, label, color }: {
    href: string; icon: React.ElementType; label: string; color: string;
}) {
    return (
        <Link href={href}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-surface-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-150 group cursor-pointer">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-ink-secondary group-hover:text-brand-600 transition-colors whitespace-nowrap">
                    {label}
                </span>
            </div>
        </Link>
    );
}

// ── Main dashboard ────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const { customer, isAuthenticated } = useAuthStore();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            const [accRes, txnRes] = await Promise.all([
                accountsApi.getAll(),
                transactionsApi.history(8),
            ]);
            setAccounts(accRes.data);
            setTransactions(txnRes.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) { router.push("/auth/login"); return; }
        fetchData().finally(() => setLoading(false));
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const activeAccount = accounts[activeIdx] ?? null;
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // ── No accounts ───────────────────────────────────────────
    if (accounts.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <p className="text-ink-tertiary text-sm">
                        {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <h1 className="text-2xl font-semibold text-ink-primary mt-0.5">
                        {greeting()}, {customer?.first_name} 👋
                    </h1>
                </div>

                <div className="bg-white border border-surface-100 rounded-2xl p-10 text-center shadow-card">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-7 h-7 text-brand-500" />
                    </div>
                    <h3 className="text-base font-semibold text-ink-primary mb-1">No accounts yet</h3>
                    <p className="text-sm text-ink-secondary mb-5 max-w-xs mx-auto">
                        Open your first account to start banking with Veritas.
                    </p>
                    <Link href="/dashboard/accounts/new">
                        <button className="inline-flex items-center gap-2 bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-brand-600 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Open an account
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // ── Full dashboard ─────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-ink-tertiary text-sm">
                        {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <h1 className="text-2xl font-semibold text-ink-primary mt-0.5">
                        {greeting()}, {customer?.first_name} 👋
                    </h1>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="mt-1 p-2 rounded-xl text-ink-tertiary hover:bg-surface-100 transition-colors disabled:opacity-40"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── Total balance pill ───────────────────────────── */}
            <div className="bg-surface-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-ink-tertiary uppercase tracking-widest font-medium mb-0.5">
                        Total balance
                    </p>
                    <p className="text-2xl font-semibold text-ink-primary tabular">
                        ₦{totalBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-ink-tertiary mb-0.5">Accounts</p>
                    <p className="text-lg font-semibold text-ink-primary">{accounts.length}</p>
                </div>
            </div>

            {/* ── Account cards ────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest">My accounts</p>
                    <Link href="/dashboard/accounts/new"
                        className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add account
                    </Link>
                </div>

                {/* scrollable card row */}
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
                    {accounts.map((acc, i) => (
                        <div key={acc.account_id} className="min-w-[300px] w-[300px] snap-start shrink-0">
                            <AccountCard
                                account={acc}
                                active={activeIdx === i}
                                onClick={() => setActiveIdx(i)}
                            />
                        </div>
                    ))}
                </div>

                {/* dot indicators */}
                {accounts.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                        {accounts.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                className={`rounded-full transition-all duration-200 ${activeIdx === i ? "w-4 h-1.5 bg-brand-500" : "w-1.5 h-1.5 bg-surface-300"}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Quick actions ─────────────────────────────────── */}
            <div>
                <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest mb-3">Quick actions</p>
                <div className="grid grid-cols-5 gap-2">
                    <QuickAction href="/dashboard/transfer" icon={ArrowLeftRight} label="Transfer" color="bg-brand-500" />
                    <QuickAction href="/dashboard/deposit" icon={ArrowDownToLine} label="Deposit" color="bg-emerald-500" />
                    <QuickAction href="/dashboard/withdraw" icon={ArrowUpFromLine} label="Withdraw" color="bg-orange-400" />
                    <QuickAction href="/dashboard/airtime" icon={Smartphone} label="Airtime" color="bg-amber-400" />
                    <QuickAction href="/dashboard/accounts/new" icon={Plus} label="Account" color="bg-violet-500" />
                </div>
            </div>

            {/* ── Active account detail strip ───────────────────── */}
            {activeAccount && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: "Account no.",
                            value: activeAccount.account_number,
                            mono: true,
                        },
                        {
                            label: "Account type",
                            value: ACCOUNT_CONFIG[activeAccount.account_type]?.label || activeAccount.account_type,
                            mono: false,
                        },
                        {
                            label: "Status",
                            value: activeAccount.is_active ? "Active" : "Inactive",
                            mono: false,
                            color: activeAccount.is_active ? "text-success" : "text-danger",
                        },
                    ].map(({ label, value, mono, color }) => (
                        <div key={label} className="bg-white border border-surface-100 rounded-xl p-3 shadow-card">
                            <p className="text-[11px] text-ink-tertiary mb-1">{label}</p>
                            <p className={`text-sm font-medium truncate ${mono ? "font-mono text-ink-primary" : color || "text-ink-primary"}`}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Recent transactions ───────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest">
                        Recent transactions
                    </p>
                    <Link href="/dashboard/history"
                        className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                        View all
                    </Link>
                </div>

                <div className="bg-white border border-surface-100 rounded-2xl shadow-card overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                                <TrendingUp className="w-5 h-5 text-ink-tertiary" />
                            </div>
                            <p className="text-sm font-medium text-ink-primary mb-0.5">No transactions yet</p>
                            <p className="text-xs text-ink-tertiary">Make your first deposit to get started</p>
                        </div>
                    ) : (
                        <div className="px-4">
                            {transactions.map((txn) => (
                                <TxnRow key={txn.txn_id} txn={txn} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}