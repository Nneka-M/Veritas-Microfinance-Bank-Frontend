"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";
import { adminApi } from "@/lib/api";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await adminApi.login(data);
            localStorage.setItem("admin_token", res.data.access_token);
            localStorage.setItem("admin_user", JSON.stringify(res.data.user));
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
                        <span className="text-white font-display italic text-xl leading-none">V</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink-primary leading-tight">Veritas</p>
                        <p className="text-[10px] text-ink-tertiary uppercase tracking-widest">Admin Portal</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
                    <h1 className="text-xl font-semibold text-ink-primary mb-1">Staff sign in</h1>
                    <p className="text-sm text-ink-secondary mb-6">Access the admin dashboard</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="staff@veritas.ng"
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
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-ink-primary transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                            error={errors.password?.message}
                            {...register("password")}
                        />

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                            Sign in
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-ink-tertiary mt-4">
                    Customer portal?{" "}
                    <a href="/auth/login" className="text-brand-500 hover:text-brand-600 transition-colors">
                        Sign in here
                    </a>
                </p>
            </div>
        </div>
    );
}