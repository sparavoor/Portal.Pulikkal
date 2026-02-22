"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats { total: number; admitted: number; unitStats: { name: string; id: number; count: number }[] }

export default function SectorDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/sector/stats").then(async r => {
            if (r.status === 401) { router.push("/sector/login"); return; }
            setStats(await r.json());
        });
    }, [router]);

    if (!stats) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "1rem" }}>
            <div className="loader-ring" />
            <p style={{ color: "var(--text-dim)" }}>Loading dashboard...</p>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>Sector Dashboard</h1>
                <p style={{ color: "var(--text-dim)", fontSize: ".9rem" }}>Overview of your sector&apos;s registrations</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                    { icon: "📋", label: "Total Registrations", value: stats.total, color: "linear-gradient(135deg, #EBF8FF, #F0F4F8)" },
                    { icon: "✅", label: "Admitted", value: stats.admitted, color: "linear-gradient(135deg, #F0FDF4, #DCFCE7)" },
                    { icon: "⏳", label: "Pending", value: stats.total - stats.admitted, color: "linear-gradient(135deg, #FFFBEB, #FEF3C7)" },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, boxShadow: "var(--shadow-xs)" }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: ".8rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: ".95rem" }}>🔢 Unit-wise Count</h3>
                    {stats.unitStats.length === 0 ? <p style={{ color: "#94a3b8", fontSize: ".875rem" }}>No registrations yet</p> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                            {stats.unitStats.map(u => (
                                <div key={u.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".25rem" }}>
                                        <span style={{ fontSize: ".875rem", fontWeight: 600, color: "var(--text-sub)" }}>{u.name}</span>
                                        <span className="badge badge-primary">{u.count}</span>
                                    </div>
                                    <div style={{ height: 6, background: "var(--bg-muted)", borderRadius: 999 }}>
                                        <div style={{ height: "100%", background: "var(--grad-primary)", borderRadius: 999, width: `${stats.total > 0 ? (u.count / stats.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: ".95rem" }}>⚡ Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                        <a href="/sector/registrations" className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: ".88rem", gap: ".6rem" }}>
                            📋 View All Registrations
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
