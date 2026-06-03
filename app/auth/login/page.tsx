"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, Input, Divider, Alert } from "@/components/ui";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await authApi.login(data);
            setAuth(res.data.access_token, res.data.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left — branding panel */}
            <div className="hidden lg:flex w-[420px] shrink-0 bg-brand-500 flex-col justify-between p-10">
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
                        Banking built<br />for your world.
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Secure, fast, and transparent banking for the university community.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        ["Secure", "256-bit encryption"],
                        ["Fast", "Instant transfers"],
                        ["Available", "24/7 access"],
                        ["Trusted", "CBN regulated"],
                    ].map(([title, sub]) => (
                        <div key={title} className="bg-white/10 rounded-xl p-3">
                            <p className="text-white text-sm font-medium">{title}</p>
                            <p className="text-white/50 text-xs mt-0.5">{sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-10 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                            <span className="text-white font-display italic text-lg leading-none">V</span>
                        </div>
                        <p className="text-sm font-semibold text-ink-primary">Veritas Microfinance</p>
                    </div>

                    <h2 className="text-2xl font-semibold text-ink-primary mb-1">Welcome back</h2>
                    <p className="text-sm text-ink-secondary mb-8">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            {...register("email")}
                        />

                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            leftIcon={<Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-ink-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                            error={errors.password?.message}
                            {...register("password")}
                        />

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
                            Sign in
                        </Button>
                    </form>

                    <Divider className="my-6" />

                    <p className="text-center text-sm text-ink-secondary">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/register" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}