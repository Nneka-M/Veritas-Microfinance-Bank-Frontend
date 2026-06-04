"use client";
import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { Card, Badge, Amount, Spinner } from "@/components/ui";
import { transactionsApi } from "@/lib/api";

interface Transaction {
    txn_id: string;
    account_number: string;
    txn_type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    fee: number;
    status: string;
    reference: string;
    narration: string;
    created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    TRANSFER_IN: "Transfer received",
    TRANSFER_OUT: "Transfer sent",
    AIRTIME: "Airtime",
    DATA: "Data bundle",
    INTEREST: "Interest credit",
};

const CREDIT_TYPES = new Set(["DEPOSIT", "TRANSFER_IN", "INTEREST"]);

function TxnRow({ txn, onClick }: { txn: Transaction; onClick: () => void }) {
    const isCredit = CREDIT_TYPES.has(txn.txn_type);
    const date = new Date(txn.created_at);

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 py-3.5 px-1 border-b border-surface-100 last:border-0 cursor-pointer hover:bg-surface-50 rounded-xl transition-colors duration-150 -mx-1 px-2"
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-50" : "bg-surface-100"}`}>
                {isCredit
                    ? <ArrowDownLeft className="w-4 h-4 text-success" />
                    : <ArrowUpRight className="w-4 h-4 text-ink-secondary" />
                }
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">
                    {txn.narration || TYPE_LABELS[txn.txn_type] || txn.txn_type}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-ink-tertiary">
                        {date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className="text-ink-disabled">·</span>
                    <p className="text-xs text-ink-tertiary font-mono truncate">{txn.account_number}</p>
                </div>
            </div>

            <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular ${isCredit ? "text-success" : "text-ink-primary"}`}>
                    {isCredit ? "+" : "−"}<Amount value={txn.amount} size="sm" />
                </p>
                <Badge variant={txn.status === "SUCCESS" ? "success" : txn.status === "FAILED" ? "danger" : "warning"}>
                    {txn.status}
                </Badge>
            </div>
        </div>
    );
}

function TxnDetail({ txn, onClose }: { txn: Transaction; onClose: () => void }) {
    const isCredit = CREDIT_TYPES.has(txn.txn_type);
    const date = new Date(txn.created_at);

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <Card className="w-full max-w-sm" padding="lg">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-ink-primary">Transaction details</h3>
                    <button onClick={onClose} className="text-ink-tertiary hover:text-ink-primary transition-colors text-sm">
                        Close
                    </button>
                </div>

                <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isCredit ? "bg-green-50" : "bg-surface-100"}`}>
                        {isCredit
                            ? <ArrowDownLeft className="w-6 h-6 text-success" />
                            : <ArrowUpRight className="w-6 h-6 text-ink-secondary" />
                        }
                    </div>
                    <Amount value={txn.amount} size="lg" className={isCredit ? "text-success" : "text-ink-primary"} />
                    <p className="text-sm text-ink-secondary mt-1">{TYPE_LABELS[txn.txn_type] || txn.txn_type}</p>
                </div>

                <div className="space-y-3">
                    {[
                        ["Reference", txn.reference],
                        ["Account", txn.account_number],
                        ["Narration", txn.narration || "—"],
                        ["Fee", `₦${Number(txn.fee || 0).toFixed(2)}`],
                        ["Balance before", `₦${Number(txn.balance_before).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                        ["Balance after", `₦${Number(txn.balance_after).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                        ["Date", date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })],
                        ["Time", date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })],
                        ["Status", txn.status],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-sm border-b border-surface-100 pb-3 last:border-0 last:pb-0">
                            <span className="text-ink-tertiary">{label}</span>
                            <span className="font-medium text-ink-primary tabular text-right max-w-[55%] break-all">{value}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// Group transactions by date
function groupByDate(transactions: Transaction[]) {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((txn) => {
        const date = new Date(txn.created_at);
        const key = date.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        if (!groups[key]) groups[key] = [];
        groups[key].push(txn);
    });
    return groups;
}

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selected, setSelected] = useState<Transaction | null>(null);
    const [filter, setFilter] = useState<string>("ALL");
    const LIMIT = 20;

    const filters = ["ALL", "TRANSFER_IN", "TRANSFER_OUT", "DEPOSIT", "WITHDRAWAL", "AIRTIME"];

    useEffect(() => {
        fetchTransactions(0, true);
    }, []);

    const fetchTransactions = async (off: number, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const res = await transactionsApi.history(LIMIT, off);
            const data = res.data;
            setTransactions(prev => reset ? data : [...prev, ...data]);
            setOffset(off + LIMIT);
            setHasMore(data.length === LIMIT);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const filtered = filter === "ALL"
        ? transactions
        : transactions.filter(t => t.txn_type === filter);

    const grouped = groupByDate(filtered);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-ink-primary">History</h1>
                        <p className="text-sm text-ink-secondary mt-0.5">
                            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchTransactions(0, true)}
                        className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150
                ${filter === f
                                    ? "bg-brand-500 text-white"
                                    : "bg-surface-100 text-ink-secondary hover:bg-surface-200"
                                }
              `}
                        >
                            {f === "ALL" ? "All" : TYPE_LABELS[f] || f}
                        </button>
                    ))}
                </div>

                {/* Transactions grouped by date */}
                {Object.keys(grouped).length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-sm text-ink-tertiary">No transactions found</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([date, txns]) => (
                            <div key={date}>
                                <p className="text-xs font-medium text-ink-tertiary uppercase tracking-widest mb-2 px-1">
                                    {date}
                                </p>
                                <Card padding="sm">
                                    {txns.map((txn) => (
                                        <TxnRow key={txn.txn_id} txn={txn} onClick={() => setSelected(txn)} />
                                    ))}
                                </Card>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load more */}
                {hasMore && (
                    <button
                        onClick={() => fetchTransactions(offset)}
                        disabled={loadingMore}
                        className="w-full py-3 text-sm text-brand-500 font-medium hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                    >
                        {loadingMore ? <Spinner size="sm" /> : "Load more"}
                    </button>
                )}
            </div>

            {/* Transaction detail modal */}
            {selected && <TxnDetail txn={selected} onClose={() => setSelected(null)} />}
        </>
    );
}