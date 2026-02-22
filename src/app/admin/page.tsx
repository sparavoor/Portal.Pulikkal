"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardList, CalendarDays, CheckCircle2, Clock,
    MapPin, Tag, Hash, Zap,
    QrCode, Building2, Settings,
} from "lucide-react";

interface Stats {
    total: number; todayCount: number; admitted: number;
    sectorStats: { name: string; count: number }[];
    unitStats: { name: string; count: number }[];
    designationStats: { name: string; count: number }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [regStatus, setRegStatus] = useState("open");
    const [togglingStatus, setTogglingStatus] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadDashboardData = async () => {
            const [statsRes, settingsRes] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/admin/settings")]);
            if (statsRes.status === 401) { router.push("/admin/login"); return; }
            setStats(await statsRes.json());
            const s = await settingsRes.json();
            setRegStatus(s.registration_status || "open");
        };
        loadDashboardData();
    }, [router]);

    const toggleStatus = async () => {
        setTogglingStatus(true);
        const newStatus = regStatus === "open" ? "closed" : "open";
        await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration_status: newStatus }) });
        setRegStatus(newStatus); setTogglingStatus(false);
    };

    if (!stats) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "65vh", flexDirection: "column", gap: "1rem" }}>
            <div className="loader-ring" />
            <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>Loading dashboard...</p>
        </div>
    );

    const statCards = [
        { label: "Total Registrations", value: stats.total, Icon: ClipboardList, bg: "linear-gradient(135deg, #EBF8FF, #F0F4F8)", iconBg: "var(--grad-primary)" },
        { label: "Today's Registrations", value: stats.todayCount, Icon: CalendarDays, bg: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", iconBg: "linear-gradient(135deg, #10b981, #059669)" },
        { label: "Admitted", value: stats.admitted, Icon: CheckCircle2, bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", iconBg: "linear-gradient(135deg, #f59e0b, #d97706)" },
        { label: "Pending", value: stats.total - stats.admitted, Icon: Clock, bg: "linear-gradient(135deg, #FDF2F2, #FEE2E2)", iconBg: "linear-gradient(135deg, #ef4444, #dc2626)" },
    ];

    const chartSections = [
        {
            Icon: MapPin, title: "Sector-wise Count", data: stats.sectorStats, showBar: true,
        },
        {
            Icon: Tag, title: "Designation-wise", data: stats.designationStats, showBar: false,
        },
        {
            Icon: Hash, title: "Unit-wise Count", data: stats.unitStats, showBar: false, scroll: true,
        },
    ];

    const quickLinks = [
        { href: "/admin/registrations", Icon: ClipboardList, label: "View All Registrations" },
        { href: "/admin/admission", Icon: QrCode, label: "Open QR Scanner" },
        { href: "/admin/sectors", Icon: Building2, label: "Manage Sectors" },
        { href: "/admin/settings", Icon: Settings, label: "Page Settings" },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", marginBottom: ".25rem" }}>Dashboard</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>Welcome back, Admin · <span className="font-ssf">SSF</span> Pulikkal Division</p>
                </div>

                {/* Registration toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: ".875rem 1.2rem", boxShadow: "var(--shadow-sm)" }}>
                    <div>
                        <div style={{ fontSize: ".68rem", fontWeight: 800, color: "var(--text-dim)", letterSpacing: ".1em", marginBottom: ".2rem" }}>REGISTRATION</div>
                        <div style={{ fontWeight: 700, fontSize: ".9rem", color: regStatus === "open" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: ".4rem" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: regStatus === "open" ? "#16a34a" : "#dc2626", display: "inline-block" }} />
                            {regStatus === "open" ? "Open" : "Closed"}
                        </div>
                    </div>
                    <div onClick={toggleStatus} className="toggle" title="Toggle registration">
                        <div className={`toggle-track ${regStatus === "open" ? "on" : ""}`}><div className="toggle-thumb" /></div>
                    </div>
                    {togglingStatus && <span className="spinner-primary" />}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
                {statCards.map(({ label, value, Icon, bg, iconBg }, i) => (
                    <div key={i} className="stat-card" style={{ background: bg }}>
                        <div className="stat-icon" style={{ background: iconBg, boxShadow: "var(--shadow-sm)" }}>
                            <Icon size={24} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: ".2rem" }}>{label}</div>
                            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "1.25rem" }}>
                {chartSections.map(({ Icon, title, data, showBar, scroll }) => (
                    <div key={title} className="card" style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: "1.25rem" }}>
                            <div className="section-icon"><Icon size={17} color="#fff" /></div>
                            <h3 style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--text)" }}>{title}</h3>
                        </div>
                        {data.length === 0 ? <p style={{ color: "var(--text-dim)", fontSize: ".875rem" }}>No data yet</p> : (
                            <div style={{ display: "flex", flexDirection: "column", gap: showBar ? ".9rem" : ".55rem", maxHeight: scroll ? 220 : undefined, overflowY: scroll ? "auto" : undefined }}>
                                {data.map((item, i) => (
                                    <div key={i}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: showBar ? "0 0 .35rem" : ".55rem .75rem", background: showBar ? "transparent" : "var(--bg-muted)", borderRadius: showBar ? 0 : 8 }}>
                                            <span style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--text-sub)" }}>{item.name}</span>
                                            <span className="badge badge-primary">{item.count}</span>
                                        </div>
                                        {showBar && (
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Quick Actions */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: "1.25rem" }}>
                        <div className="section-icon"><Zap size={17} color="#fff" /></div>
                        <h3 style={{ fontWeight: 800, fontSize: ".95rem", color: "var(--text)" }}>Quick Actions</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                        {quickLinks.map(({ href, Icon, label }) => (
                            <a key={href} href={href} className="btn btn-ghost" style={{ justifyContent: "flex-start", fontSize: ".88rem", gap: ".65rem" }}>
                                <Icon size={16} color="var(--primary)" />{label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
