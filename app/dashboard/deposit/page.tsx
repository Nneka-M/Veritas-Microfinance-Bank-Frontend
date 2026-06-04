"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, Alert, Amount, Spinner } from "@/components/ui";
import { accountsApi, transactionsApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Account {
    account_id: string;
    account_number: string;
    account_type: string;
    balance: number;
}

const schema = z.object({
    account_id: z.string().min(1, "Select an account"),
    amount: z.coerce.number().min(1, "Enter an amount greater than 0"),
    narration: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const typeColors: Record<string, string> = {
    CURRENT: "bg-brand-500",
    SAVINGS: "bg-emerald-500",
    FIXED: "bg-violet-500",
};

export default function DepositPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const selectedAccountId = watch("account_id");
    const amount = watch("amount");
    const selectedAccount = accounts.find(a => a.account_id === selectedAccountId);

    useEffect(() => {
        accountsApi.getAll()
            .then(res => setAccounts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await transactionsApi.deposit(data);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Deposit failed. Please try again.");
        }
    };

    // ── Success ───────────────────────────────────────────────
    if (result) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-ink-primary mb-1">Deposit successful</h2>
                <p className="text-sm text-ink-secondary mb-6">Funds have been added to your account</p>

                <Card className="text-left mb-6">
                    {[
                        ["Reference", result.reference],
                        ["Amount deposited", `₦${Number(result.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                        ["New balance", `₦${Number(result.new_balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                        ["Status", result.status],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between py-2.5 border-b border-surface-100 last:border-0">
                            <span className="text-sm text-ink-secondary">{label}</span>
                            <span className={`text-sm font-medium ${label === "Status" ? "text-success" : "text-ink-primary"}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </Card>

                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                        Back to dashboard
                    </Button>
                    <Button className="flex-1" onClick={() => { setResult(null); }}>
                        Deposit again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-2xl font-semibold text-ink-primary mb-1">Deposit funds</h1>
            <p className="text-sm text-ink-secondary mb-6">Add money to one of your accounts</p>

            {loading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : accounts.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-sm text-ink-secondary mb-4">You have no accounts to deposit into.</p>
                    <Button onClick={() => router.push("/dashboard/accounts/new")}>Open an account</Button>
                </Card>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Account selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-ink-primary">Select account</label>
                        <div className="space-y-2">
                            {accounts.map((acc) => {
                                const selected = selectedAccountId === acc.account_id;
                                return (
                                    <div
                                        key={acc.account_id}
                                        onClick={() => setValue("account_id", acc.account_id)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150
                      ${selected ? "border-brand-500 bg-brand-50" : "border-surface-200 hover:border-surface-300"}
                    `}
                                    >
                                        <div className={`w-9 h-9 rounded-xl ${typeColors[acc.account_type] || "bg-brand-500"} flex items-center justify-center shrink-0`}>
                                            <ArrowDownToLine className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-ink-primary">{acc.account_type} Account</p>
                                            <p className="text-xs text-ink-tertiary font-mono">{acc.account_number}</p>
                                        </div>
                                        <Amount value={acc.balance} size="sm" className="font-semibold text-ink-primary shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                        {errors.account_id && <p className="text-xs text-danger">{errors.account_id.message}</p>}
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-ink-primary">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary text-sm font-medium">₦</span>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full h-11 pl-7 pr-3 rounded-xl border border-surface-200 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                {...register("amount")}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
                        {selectedAccount && amount > 0 && (
                            <p className="text-xs text-ink-tertiary">
                                New balance after deposit:{" "}
                                <span className="font-medium text-success">
                                    ₦{(selectedAccount.balance + Number(amount)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Narration */}
                    <Input
                        label="Narration (optional)"
                        placeholder="e.g. Monthly savings"
                        {...register("narration")}
                    />

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={!selectedAccountId}
                        loading={isSubmitting}
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        Deposit funds
                    </Button>
                </form>
            )}
        </div>
    );
}