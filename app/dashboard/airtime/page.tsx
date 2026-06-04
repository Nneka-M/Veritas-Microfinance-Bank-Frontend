"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Smartphone, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, Alert, Amount, Spinner } from "@/components/ui";
import { accountsApi, transactionsApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Account {
    account_id: string;
    account_number: string;
    account_type: string;
    balance: number;
}

const NETWORKS = [
    { id: "MTN", label: "MTN", color: "bg-yellow-400", textColor: "text-yellow-900" },
    { id: "AIRTEL", label: "Airtel", color: "bg-red-500", textColor: "text-white" },
    { id: "GLO", label: "Glo", color: "bg-green-500", textColor: "text-white" },
    { id: "9MOBILE", label: "9mobile", color: "bg-emerald-700", textColor: "text-white" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const schema = z.object({
    account_id: z.string().min(1, "Select an account"),
    phone: z.string().min(11, "Enter a valid 11-digit phone number").max(11, "Enter a valid 11-digit phone number"),
    amount: z.coerce.number().min(50, "Minimum airtime is ₦50").max(50000, "Maximum airtime is ₦50,000"),
    network: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"], { required_error: "Select a network" }),
});

type FormData = z.infer<typeof schema>;

const typeColors: Record<string, string> = {
    CURRENT: "bg-brand-500",
    SAVINGS: "bg-emerald-500",
    FIXED: "bg-violet-500",
};

export default function AirtimePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const selectedAccountId = watch("account_id");
    const selectedNetwork = watch("network");
    const amount = watch("amount");
    const selectedAccount = accounts.find(a => a.account_id === selectedAccountId);
    const insufficientFunds = selectedAccount && amount > 0 && Number(amount) > selectedAccount.balance;

    useEffect(() => {
        accountsApi.getAll()
            .then(res => setAccounts(res.data.filter((a: Account) => a.balance > 0)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await transactionsApi.airtime(data);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Airtime purchase failed. Please try again.");
        }
    };

    // ── Success ───────────────────────────────────────────────
    if (result) {
        const network = NETWORKS.find(n => n.id === result.network);
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-ink-primary mb-1">Airtime purchased!</h2>
                <p className="text-sm text-ink-secondary mb-6">
                    ₦{Number(result.amount).toLocaleString()} {result.network} airtime sent to {result.phone}
                </p>

                <Card className="text-left mb-6">
                    {[
                        ["Phone number", result.phone],
                        ["Network", result.network],
                        ["Amount", `₦${Number(result.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                        ["Reference", result.reference],
                        ["New balance", `₦${Number(result.new_balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between py-2.5 border-b border-surface-100 last:border-0">
                            <span className="text-sm text-ink-secondary">{label}</span>
                            <span className="text-sm font-medium text-ink-primary">{value}</span>
                        </div>
                    ))}
                </Card>

                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                        Back to dashboard
                    </Button>
                    <Button className="flex-1" onClick={() => setResult(null)}>
                        Buy again
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

            <h1 className="text-2xl font-semibold text-ink-primary mb-1">Buy airtime</h1>
            <p className="text-sm text-ink-secondary mb-6">Top up any Nigerian network instantly</p>

            {loading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Network selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-ink-primary">Network</label>
                        <div className="grid grid-cols-4 gap-2">
                            {NETWORKS.map((net) => {
                                const selected = selectedNetwork === net.id;
                                return (
                                    <button
                                        key={net.id}
                                        type="button"
                                        onClick={() => setValue("network", net.id as any)}
                                        className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all duration-150
                      ${selected ? "border-brand-500 shadow-sm" : "border-surface-200 hover:border-surface-300"}
                    `}
                                    >
                                        <div className={`w-8 h-8 rounded-full ${net.color} flex items-center justify-center`}>
                                            <span className={`text-[10px] font-bold ${net.textColor}`}>
                                                {net.label[0]}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-medium ${selected ? "text-brand-600" : "text-ink-secondary"}`}>
                                            {net.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.network && <p className="text-xs text-danger">{errors.network.message}</p>}
                    </div>

                    {/* Phone number */}
                    <Input
                        label="Phone number"
                        type="tel"
                        placeholder="08012345678"
                        maxLength={11}
                        hint="11-digit Nigerian number"
                        error={errors.phone?.message}
                        {...register("phone")}
                    />

                    {/* Quick amount select */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-ink-primary">Amount</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {QUICK_AMOUNTS.map((preset) => {
                                const selected = Number(amount) === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setValue("amount", preset as any)}
                                        className={`h-10 rounded-xl text-sm font-medium border transition-all duration-150
                      ${selected
                                                ? "border-brand-500 bg-brand-50 text-brand-600"
                                                : "border-surface-200 text-ink-secondary hover:border-surface-300"
                                            }
                    `}
                                    >
                                        ₦{preset.toLocaleString()}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary text-sm font-medium">₦</span>
                            <input
                                type="number"
                                min="50"
                                step="50"
                                placeholder="Custom amount"
                                className={`w-full h-11 pl-7 pr-3 rounded-xl border text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  ${errors.amount ? "border-danger focus:ring-danger" : "border-surface-200"}
                `}
                                {...register("amount")}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
                    </div>

                    {/* Account selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-ink-primary">Debit account</label>
                        {accounts.length === 0 ? (
                            <p className="text-sm text-ink-tertiary">No accounts with sufficient balance.</p>
                        ) : (
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
                                            <div className={`w-8 h-8 rounded-xl ${typeColors[acc.account_type] || "bg-brand-500"} flex items-center justify-center shrink-0`}>
                                                <Smartphone className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-ink-primary">{acc.account_type}</p>
                                                <p className="text-xs text-ink-tertiary font-mono">{acc.account_number}</p>
                                            </div>
                                            <Amount value={acc.balance} size="sm" className="font-semibold text-ink-primary shrink-0" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {errors.account_id && <p className="text-xs text-danger">{errors.account_id.message}</p>}
                        {insufficientFunds && (
                            <p className="text-xs text-danger">
                                Insufficient funds. Available: ₦{selectedAccount!.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={!selectedAccountId || !selectedNetwork || !!insufficientFunds}
                        loading={isSubmitting}
                    >
                        <Smartphone className="w-4 h-4" />
                        Buy airtime
                    </Button>
                </form>
            )}
        </div>
    );
}