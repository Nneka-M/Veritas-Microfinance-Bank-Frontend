"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, Phone, User, Shield, CheckCircle2 } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const detailsSchema = z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(11, "Enter a valid 11-digit phone number").max(11, "Enter a valid 11-digit phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpSchema = z.object({
    otp_code: z.string().length(6, "OTP must be exactly 6 digits"),
});

const kycSchema = z.object({
    id_type: z.enum(["BVN", "NIN"], { required_error: "Select an ID type" }),
    id_number: z.string().length(11, "ID number must be exactly 11 digits"),
});

type DetailsData = z.infer<typeof detailsSchema>;
type OtpData = z.infer<typeof otpSchema>;
type KycData = z.infer<typeof kycSchema>;

const steps = ["Your details", "Verify phone", "Identity check"];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${done ? "bg-brand-500 text-white" : ""} ${active ? "bg-brand-500 text-white ring-4 ring-brand-100" : ""} ${!done && !active ? "bg-surface-100 text-ink-tertiary" : ""}`}>
                                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-[11px] whitespace-nowrap font-medium ${active ? "text-brand-600" : done ? "text-ink-secondary" : "text-ink-tertiary"}`}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-px mx-2 mb-5 transition-colors duration-300 ${done ? "bg-brand-500" : "bg-surface-200"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [step, setStep] = useState(0);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [savedPhone, setSavedPhone] = useState("");
    const [devOtp, setDevOtp] = useState("");

    const detailsForm = useForm<DetailsData>({ resolver: zodResolver(detailsSchema) });
    const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });
    const kycForm = useForm<KycData>({ resolver: zodResolver(kycSchema) });

    const onDetailsSubmit = async (data: DetailsData) => {
        setError("");
        try {
            const res = await authApi.register(data);
            setSavedPhone(data.phone);
            if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
            setStep(1);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed. Please try again.");
        }
    };

    const onOtpSubmit = async (data: OtpData) => {
        setError("");
        try {
            await authApi.verifyOtp({ phone: savedPhone, otp_code: data.otp_code });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP. Please try again.");
        }
    };

    const onKycSubmit = async (data: KycData) => {
        setError("");
        try {
            const loginRes = await authApi.login({
                email: detailsForm.getValues("email"),
                password: detailsForm.getValues("password"),
            });
            setAuth(loginRes.data.access_token, loginRes.data.user);
            await authApi.verifyKyc(data);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Verification failed. Check your details.");
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            <div className="hidden lg:flex w-[380px] shrink-0 bg-brand-500 flex-col justify-between p-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <span className="text-white font-display italic text-lg leading-none">V</span>
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold leading-tight">Veritas</p>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest">Microfinance</p>
                    </div>
                </div>
                <div>
                    <h1 className="font-display italic text-white text-4xl leading-tight mb-4">
                        Open your account<br />in minutes.
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Join thousands of students and staff banking smarter with Veritas.
                    </p>
                </div>
                <div className="space-y-3">
                    {[
                        ["No hidden fees", "Transparent pricing always"],
                        ["Instant account", "Start banking immediately"],
                        ["Secure & private", "Your data is protected"],
                    ].map(([title, sub]) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">{title}</p>
                                <p className="text-white/50 text-xs">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                            <span className="text-white font-display italic text-lg leading-none">V</span>
                        </div>
                        <p className="text-sm font-semibold text-ink-primary">Veritas Microfinance</p>
                    </div>

                    <h2 className="text-2xl font-semibold text-ink-primary mb-1">Create account</h2>
                    <p className="text-sm text-ink-secondary mb-6">
                        {step === 0 && "Fill in your personal details to get started"}
                        {step === 1 && `Enter the 6-digit code sent to ${savedPhone}`}
                        {step === 2 && "Verify your identity to activate your account"}
                    </p>

                    <StepIndicator current={step} />

                    {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                    {step === 0 && (
                        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="First name"
                                    placeholder="Ada"
                                    leftIcon={<User className="w-4 h-4" />}
                                    error={detailsForm.formState.errors.first_name?.message}
                                    {...detailsForm.register("first_name")}
                                />
                                <Input
                                    label="Last name"
                                    placeholder="Obi"
                                    error={detailsForm.formState.errors.last_name?.message}
                                    {...detailsForm.register("last_name")}
                                />
                            </div>
                            <Input
                                label="Email address"
                                type="email"
                                placeholder="you@example.com"
                                leftIcon={<Mail className="w-4 h-4" />}
                                error={detailsForm.formState.errors.email?.message}
                                {...detailsForm.register("email")}
                            />
                            <Input
                                label="Phone number"
                                type="tel"
                                placeholder="08012345678"
                                leftIcon={<Phone className="w-4 h-4" />}
                                hint="11-digit Nigerian number"
                                error={detailsForm.formState.errors.phone?.message}
                                {...detailsForm.register("phone")}
                            />
                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 6 characters"
                                leftIcon={<Lock className="w-4 h-4" />}
                                rightIcon={
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-ink-primary transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                                error={detailsForm.formState.errors.password?.message}
                                {...detailsForm.register("password")}
                            />
                            <Button type="submit" size="lg" className="w-full mt-1" loading={detailsForm.formState.isSubmitting}>
                                Continue
                            </Button>
                        </form>
                    )}

                    {step === 1 && (
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-4">
                            {devOtp && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <p className="text-xs font-medium text-warning mb-0.5">Dev mode — OTP</p>
                                    <p className="text-2xl font-mono font-semibold text-ink-primary tracking-widest">{devOtp}</p>
                                </div>
                            )}
                            <Input
                                label="6-digit OTP"
                                type="text"
                                placeholder="123456"
                                maxLength={6}
                                leftIcon={<Shield className="w-4 h-4" />}
                                hint="Check your phone for the verification code"
                                error={otpForm.formState.errors.otp_code?.message}
                                {...otpForm.register("otp_code")}
                            />
                            <Button type="submit" size="lg" className="w-full" loading={otpForm.formState.isSubmitting}>
                                Verify phone
                            </Button>
                            <button type="button" className="text-sm text-ink-secondary hover:text-brand-500 transition-colors text-center" onClick={() => setStep(0)}>
                                Back to details
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-ink-primary">ID type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["BVN", "NIN"].map((type) => {
                                        const selected = kycForm.watch("id_type") === type;
                                        return (
                                            <label key={type} className={`flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium cursor-pointer transition-all duration-150 ${selected ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-ink-secondary hover:border-surface-300"}`}>
                                                <input type="radio" value={type} className="sr-only" {...kycForm.register("id_type")} />
                                                {type}
                                            </label>
                                        );
                                    })}
                                </div>
                                {kycForm.formState.errors.id_type && (
                                    <p className="text-xs text-danger">{kycForm.formState.errors.id_type.message}</p>
                                )}
                            </div>
                            <Input
                                label="ID number"
                                placeholder="12345678901"
                                maxLength={11}
                                leftIcon={<Shield className="w-4 h-4" />}
                                hint="Enter your 11-digit BVN or NIN"
                                error={kycForm.formState.errors.id_number?.message}
                                {...kycForm.register("id_number")}
                            />
                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                <p className="text-xs font-medium text-brand-600 mb-1">Dev mode — valid test IDs</p>
                                <p className="text-xs text-ink-secondary">BVN: <span className="font-mono">12345678901</span></p>
                                <p className="text-xs text-ink-secondary">NIN: <span className="font-mono">12345678901</span></p>
                            </div>
                            <Button type="submit" size="lg" className="w-full" loading={kycForm.formState.isSubmitting}>
                                Complete registration
                            </Button>
                        </form>
                    )}

                    {step === 0 && (
                        <p className="text-center text-sm text-ink-secondary mt-6">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}