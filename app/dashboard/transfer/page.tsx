"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Search, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, Alert, Amount, Spinner } from "@/components/ui";
import { accountsApi, transactionsApi, beneficiariesApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Account {
    account_id: string;
    account_number: string;
    account_type: string;
    balance: number;
}

interface Beneficiary {
    beneficiary_id: string;
    account_number: string;
    account_name: string;
    bank_name: string;
    display_name: string;
}

interface ResolvedAccount {
    account_number: string;
    account_name: string;
    bank_name: string;
}

const schema = z.object({
    from_account_id: z.string().min(1, "Select an account to debit"),
    to_account_number: z.string().length(10, "Account number must be 10 digits"),
    amount: z.coerce.number().min(1, "Enter an amount"),
    narration: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TRANSFER_FEE = 10.50;

export default function TransferPage() {
    const router = useRouter();
    const [step, setStep] = useState<"form" | "confirm" | "success">("form");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [resolved, setResolved] = useState<ResolvedAccount | null>(null);
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState("");
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);

    const { register, handleSubmit, watch, setValue, getValues,
        formState: { errors, isSubmitting } } = useForm<FormData>({
            resolver: zodResolver(schema),
        });

    const toAccountNumber = watch("to_account_number");
    const fromAccountId = watch("from_account_id");
    const amount = watch("amount");

    const selectedAccount = accounts.find(a => a.account_id === fromAccountId);

    useEffect(() => {
        Promise.all([accountsApi.getAll(), beneficiariesApi.getAll()])
            .then(([accRes, benRes]) => {
                setAccounts(accRes.data);
                setBeneficiaries(benRes.data);
            })
            .catch(console.error);
    }, []);

    // Auto-resolve account number after 10 digits
    useEffect(() => {
        if (toAccountNumber?.length === 10) {
            resolveAccount(toAccountNumber);
        } else {
            setResolved(null);
            setResolveError("");
        }
    }, [toAccountNumber]);

    const resolveAccount = async (number: string) => {
        setResolving(true);
        setResolveError("");
        setResolved(null);
        try {
            const res = await accountsApi.resolveNumber(number);
            setResolved(res.data);
        } catch {
            setResolveError("Account not found. Check the number and try again.");
        } finally {
            setResolving(false);
        }
    };

    const onSubmit = (data: FormData) => {
        if (!resolved) return;
        setStep("confirm");
    };

    const onConfirm = async () => {
        setError("");
        const data = getValues();
        // Find the to_account_id from the resolved account number
        try {
            // Get the account by number to get its ID
            const toAccRes = await accountsApi.resolveNumber(data.to_account_number);
            // We need to find the account_id — resolve returns account info but not ID
            // so we pass account_number and let the backend handle it
            const res = await transactionsApi.transfer({
                from_account_id: data.from_account_id,
                to_account_id: toAccRes.data.account_id || data.to_account_number,
                amount: data.amount,
                narration: data.narration || "",
            });

            if (saveBeneficiary && resolved) {
                await beneficiariesApi.add({
                    account_number: resolved.account_number,
                    account_name: resolved.account_name,
                    bank_name: resolved.bank_name,
                    bank_code: "000",
                }).catch(() => { }); // non-critical
            }

            setResult(res.data);
            setStep("success");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Transfer failed. Please try again.");
        }
    };

    // ── Success screen ────────────────────────────────────────
    if (step === "success" && result) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-ink-primary mb-1">Transfer successful</h2>
                <p className="text-sm text-ink-secondary mb-6">Your transfer has been processed</p>

                <Card className="text-left mb-6">
                    {[
                        ["Reference", result.reference],
                        ["Amount", `₦${result.amount?.toLocaleString()}`],
                        ["Fee", `₦${result.fee?.toFixed(2)}`],
                        ["New balance", `₦${result.new_balance?.toLocaleString()}`],
                        ["Status", result.status],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between py-2 border-b border-surface-100 last:border-0">
                            <span className="text-sm text-ink-secondary">{label}</span>
                            <span className="text-sm font-medium text-ink-primary">{value}</span>
                        </div>
                    ))}
                </Card>

                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                        Back to dashboard
                    </Button>
                    <Button className="flex-1" onClick={() => { setStep("form"); setResult(null); }}>
                        New transfer
                    </Button>
                </div>
            </div>
        );
    }

    // ── Confirm screen ────────────────────────────────────────
    if (step === "confirm") {
        const data = getValues();
        return (
            <div className="max-w-md">
                <button onClick={() => setStep("form")} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h1 className="text-2xl font-semibold text-ink-primary mb-1">Confirm transfer</h1>
                <p className="text-sm text-ink-secondary mb-6">Review the details before sending</p>

                <Card className="mb-4">
                    {[
                        ["To", `${resolved?.account_name} — ${resolved?.account_number}`],
                        ["Bank", resolved?.bank_name || ""],
                        ["Amount", `₦${Number(data.amount).toLocaleString()}`],
                        ["Fee", `₦${TRANSFER_FEE.toFixed(2)}`],
                        ["Total", `₦${(Number(data.amount) + TRANSFER_FEE).toLocaleString()}`],
                        ["Narration", data.narration || "—"],
                        ["From", selectedAccount?.account_number || ""],
                    ].map(([label, value]) => (
                        <div key={label} className="flex justify-between py-2.5 border-b border-surface-100 last:border-0">
                            <span className="text-sm text-ink-secondary">{label}</span>
                            <span className="text-sm font-medium text-ink-primary text-right max-w-[60%]">{value}</span>
                        </div>
                    ))}
                </Card>

                <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={saveBeneficiary}
                        onChange={e => setSaveBeneficiary(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-ink-secondary">Save as beneficiary</span>
                </label>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep("form")}>
                        Cancel
                    </Button>
                    <Button className="flex-1" onClick={onConfirm} loading={isSubmitting}>
                        Send money
                    </Button>
                </div>
            </div>
        );
    }

    // ── Form screen ───────────────────────────────────────────
    return (
        <div className="max-w-md">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-2xl font-semibold text-ink-primary mb-1">Send money</h1>
            <p className="text-sm text-ink-secondary mb-6">Transfer to any Veritas account instantly</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* From account */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-primary">From account</label>
                    {accounts.length === 0 ? (
                        <p className="text-sm text-ink-tertiary">No accounts found</p>
                    ) : (
                        <div className="space-y-2">
                            {accounts.map(acc => {
                                const selected = fromAccountId === acc.account_id;
                                return (
                                    <div
                                        key={acc.account_id}
                                        onClick={() => setValue("from_account_id", acc.account_id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-150
                      ${selected ? "border-brand-500 bg-brand-50" : "border-surface-200 hover:border-surface-300"}
                    `}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-ink-primary">{acc.account_type}</p>
                                            <p className="text-xs text-ink-tertiary font-mono">{acc.account_number}</p>
                                        </div>
                                        <Amount value={acc.balance} size="sm" className="font-semibold text-ink-primary" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {errors.from_account_id && <p className="text-xs text-danger">{errors.from_account_id.message}</p>}
                </div>

                {/* Beneficiaries quick select */}
                {beneficiaries.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-ink-primary mb-2">Saved beneficiaries</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {beneficiaries.map(b => (
                                <button
                                    key={b.beneficiary_id}
                                    type="button"
                                    onClick={() => setValue("to_account_number", b.account_number)}
                                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all shrink-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-ink-secondary">
                                            {b.display_name?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-ink-secondary whitespace-nowrap">{b.display_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* To account number */}
                <div>
                    <Input
                        label="Recipient account number"
                        placeholder="0123456789"
                        maxLength={10}
                        leftIcon={<Search className="w-4 h-4" />}
                        error={errors.to_account_number?.message || resolveError}
                        hint="10-digit Veritas account number"
                        {...register("to_account_number")}
                    />
                    {resolving && (
                        <div className="flex items-center gap-2 mt-2">
                            <Spinner size="sm" />
                            <span className="text-xs text-ink-tertiary">Looking up account...</span>
                        </div>
                    )}
                    {resolved && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-ink-primary">{resolved.account_name}</p>
                                <p className="text-xs text-ink-tertiary">{resolved.bank_name}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-primary">Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary text-sm font-medium">₦</span>
                        <input
                            type="number"
                            min="1"
                            placeholder="0.00"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-surface-200 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            {...register("amount")}
                        />
                    </div>
                    {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
                    {amount > 0 && (
                        <p className="text-xs text-ink-tertiary">
                            + ₦{TRANSFER_FEE.toFixed(2)} fee = ₦{(Number(amount) + TRANSFER_FEE).toLocaleString()} total
                        </p>
                    )}
                </div>

                {/* Narration */}
                <Input
                    label="Narration (optional)"
                    placeholder="What is this for?"
                    {...register("narration")}
                />

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!resolved || !fromAccountId}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}