"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Alert } from "@/components/ui";
import { accountsApi } from "@/lib/api";

const schema = z.object({
    account_type: z.enum(["CURRENT", "SAVINGS", "FIXED"]),
    opening_balance: z.coerce.number().min(0),
    maturity_months: z.coerce.number().min(1).max(60).optional(),
});

type FormData = z.infer<typeof schema>;

const accountTypes = [
    {
        type: "CURRENT",
        title: "Current Account",
        description: "Everyday spending and transfers. No withdrawal limits.",
        interest: "No interest",
        color: "border-brand-200 bg-brand-50",
        activeColor: "border-brand-500 bg-brand-50",
    },
    {
        type: "SAVINGS",
        title: "Savings Account",
        description: "Earn 10% p.a. interest on your balance. Great for goals.",
        interest: "10% p.a.",
        color: "border-surface-200",
        activeColor: "border-emerald-500 bg-emerald-50",
    },
    {
        type: "FIXED",
        title: "Fixed Deposit",
        description: "Lock funds for higher returns. 15% p.a. Minimum ₦10,000.",
        interest: "15% p.a.",
        color: "border-surface-200",
        activeColor: "border-violet-500 bg-violet-50",
    },
];

export default function NewAccountPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { account_type: "CURRENT", opening_balance: 0, maturity_months: 12 },
    });

    const selectedType = watch("account_type");

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            await accountsApi.create(data);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Could not create account. Please try again.");
        }
    };

    return (
        <div className="max-w-lg">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <h1 className="text-2xl font-semibold text-ink-primary mb-1">Open an account</h1>
            <p className="text-sm text-ink-secondary mb-6">Choose the account type that suits your needs</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Account type selector */}
                <div className="space-y-2">
                    {accountTypes.map(({ type, title, description, interest, color, activeColor }) => {
                        const selected = selectedType === type;
                        return (
                            <div
                                key={type}
                                onClick={() => setValue("account_type", type as any)}
                                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all duration-150
                  ${selected ? activeColor : `${color} hover:border-surface-300`}
                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${selected ? "border-brand-500" : "border-surface-300"}
                      `}>
                                                {selected && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                                            </div>
                                            <p className="text-sm font-semibold text-ink-primary">{title}</p>
                                        </div>
                                        <p className="text-xs text-ink-secondary ml-6">{description}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-ink-secondary ml-4 shrink-0">{interest}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Opening balance */}
                <Card padding="sm">
                    <label className="text-sm font-medium text-ink-primary block mb-2">
                        Opening deposit (optional)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary text-sm">₦</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-surface-200 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            {...register("opening_balance")}
                        />
                    </div>
                    {selectedType === "FIXED" && (
                        <p className="text-xs text-ink-tertiary mt-1.5">Minimum ₦10,000 for fixed deposits</p>
                    )}
                </Card>

                {/* Maturity period — only for FIXED */}
                {selectedType === "FIXED" && (
                    <Card padding="sm">
                        <label className="text-sm font-medium text-ink-primary block mb-2">
                            Lock period (months)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[3, 6, 12, 24].map((months) => {
                                const current = watch("maturity_months");
                                return (
                                    <button
                                        key={months}
                                        type="button"
                                        onClick={() => setValue("maturity_months", months)}
                                        className={`h-10 rounded-xl text-sm font-medium border transition-all duration-150
                      ${current === months
                                                ? "border-brand-500 bg-brand-50 text-brand-600"
                                                : "border-surface-200 text-ink-secondary hover:border-surface-300"
                                            }
                    `}
                                    >
                                        {months}mo
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                    Open account
                </Button>
            </form>
        </div>
    );
}