"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, Badge, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface AuditLog {
    audit_id: string;
    table_name: string;
    action: string;
    record_id: string | null;
    performed_by: string | null;
    actor_type: string;
    description: string;
    created_at: string;
}

const ACTION_VARIANT: Record<string, any> = {
    INSERT: "success",
    UPDATE: "info",
    DELETE: "danger",
    LOGIN: "default",
    FAILED_LOGIN: "danger",
};

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const actions = ["ALL", "INSERT", "UPDATE", "DELETE", "LOGIN", "FAILED_LOGIN"];

    const load = () => {
        setLoading(true);
        adminApi.getAudit(100)
            .then(res => setLogs(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = filter === "ALL"
        ? logs
        : logs.filter(l => l.action === filter);

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-primary">Audit Logs</h1>
                    <p className="text-sm text-ink-secondary mt-0.5">{filtered.length} log entries</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {actions.map((a) => (
                    <button
                        key={a}
                        onClick={() => setFilter(a)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150
              ${filter === a ? "bg-brand-500 text-white" : "bg-surface-100 text-ink-secondary hover:bg-surface-200"}`}
                    >
                        {a === "ALL" ? "All" : a.replace("_", " ")}
                    </button>
                ))}
            </div>

            <Card padding="sm">
                <div className="space-y-0">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-ink-tertiary text-center py-8">No audit logs found</p>
                    ) : (
                        filtered.map((log) => (
                            <div key={log.audit_id} className="flex items-start gap-3 py-3 border-b border-surface-100 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <Badge variant={ACTION_VARIANT[log.action] || "default"}>
                                            {log.action}
                                        </Badge>
                                        <span className="text-xs text-ink-tertiary font-mono">{log.table_name}</span>
                                        {log.performed_by && (
                                            <span className="text-xs text-ink-tertiary">by {log.performed_by}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-ink-primary truncate">{log.description || "—"}</p>
                                    {log.record_id && (
                                        <p className="text-xs text-ink-tertiary font-mono mt-0.5">ID: {log.record_id}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-ink-tertiary">
                                        {new Date(log.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                    </p>
                                    <p className="text-xs text-ink-tertiary">
                                        {new Date(log.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}