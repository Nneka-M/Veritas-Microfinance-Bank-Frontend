"use client";
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, Badge, Spinner, Button } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface Customer {
    customer_id: string;
    full_name: string;
    email: string;
    phone: string;
    kyc_status: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        adminApi.getCustomers()
            .then(res => setCustomers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleKyc = async (id: string, status: string) => {
        setUpdating(id);
        try {
            await adminApi.updateKyc(id, status);
            setCustomers(prev => prev.map(c =>
                c.customer_id === id ? { ...c, kyc_status: status } : c
            ));
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to update KYC");
        } finally {
            setUpdating(null);
        }
    };

    const handleToggle = async (id: string) => {
        setUpdating(id);
        try {
            const res = await adminApi.toggleCustomer(id);
            setCustomers(prev => prev.map(c =>
                c.customer_id === id ? { ...c, is_active: res.data.is_active } : c
            ));
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to update status");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-primary">Customers</h1>
                    <p className="text-sm text-ink-secondary mt-0.5">{customers.length} registered customers</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            <Card padding="sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-100">
                                {["Customer", "Phone", "KYC", "Status", "Joined", "Actions"].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-ink-tertiary uppercase tracking-wider py-2 px-3 first:pl-1">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.customer_id} className="border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors">
                                    <td className="py-3 px-3 first:pl-1">
                                        <p className="font-medium text-ink-primary">{c.full_name}</p>
                                        <p className="text-xs text-ink-tertiary">{c.email}</p>
                                    </td>
                                    <td className="py-3 px-3 text-ink-secondary">{c.phone}</td>
                                    <td className="py-3 px-3">
                                        <Badge variant={
                                            c.kyc_status === "VERIFIED" ? "success" :
                                                c.kyc_status === "FAILED" ? "danger" : "warning"
                                        }>
                                            {c.kyc_status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-3">
                                        <Badge variant={c.is_active ? "success" : "danger"}>
                                            {c.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-3 text-ink-tertiary text-xs">
                                        {new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-1">
                                            {c.kyc_status !== "VERIFIED" && (
                                                <button
                                                    onClick={() => handleKyc(c.customer_id, "VERIFIED")}
                                                    disabled={updating === c.customer_id}
                                                    className="p-1.5 rounded-lg hover:bg-green-50 text-ink-tertiary hover:text-success transition-colors"
                                                    title="Verify KYC"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {c.kyc_status !== "FAILED" && (
                                                <button
                                                    onClick={() => handleKyc(c.customer_id, "FAILED")}
                                                    disabled={updating === c.customer_id}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-ink-tertiary hover:text-danger transition-colors"
                                                    title="Reject KYC"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleToggle(c.customer_id)}
                                                disabled={updating === c.customer_id}
                                                className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-tertiary hover:text-ink-primary transition-colors"
                                                title={c.is_active ? "Deactivate" : "Activate"}
                                            >
                                                {c.is_active
                                                    ? <ToggleRight className="w-4 h-4 text-success" />
                                                    : <ToggleLeft className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}