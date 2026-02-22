"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard, ClipboardList, QrCode, Building2, Users,
    Settings, ExternalLink, LogOut, Ticket, Menu, ShieldCheck,
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/admin/registrations", label: "Registrations", Icon: ClipboardList },
    { href: "/admin/admission", label: "QR Admission", Icon: QrCode },
    { href: "/admin/sectors", label: "Sectors & Units", Icon: Building2 },
    { href: "/admin/sector-admins", label: "Sector Admins", Icon: Users },
    { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const currentPage = navItems.find(n => n.href === pathname);

    if (pathname === "/admin/login") return <>{children}</>;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
            {/* ── Sidebar ── */}
            <aside style={{
                width: 260, flexShrink: 0,
                background: "var(--bg-white)",
                borderRight: "1px solid var(--border)",
                boxShadow: "2px 0 12px var(--primary-faint)",
                display: "flex", flexDirection: "column",
                position: "fixed", height: "100vh", zIndex: 100,
                left: sidebarOpen ? 0 : "-260px",
                transition: "left .3s cubic-bezier(.22,.61,.36,1)",
            }} className="admin-sidebar">

                {/* Brand */}
                <div style={{ padding: "1.4rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                    <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: ".875rem", textDecoration: "none" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 13,
                            background: "var(--grad-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: "var(--shadow-sm)",
                        }}>
                            <Ticket size={22} color="#FFFFFF" />
                        </div>
                        <div>
                            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: ".92rem" }}>Admin Panel</div>
                            <div style={{ color: "var(--primary)", fontSize: ".73rem", fontWeight: 600 }}><span className="font-ssf">SSF</span> Pulikkal Division</div>
                        </div>
                    </a>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "1rem .875rem", display: "flex", flexDirection: "column", gap: ".18rem", overflowY: "auto" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 800, color: "var(--text-dim)", letterSpacing: ".12em", padding: ".5rem .5rem .25rem .5rem" }}>MENU</div>
                    {navItems.map(({ href, label, Icon }) => {
                        const active = pathname === href;
                        return (
                            <a key={href} href={href} className={`nav-item ${active ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                                <div className="nav-icon"><Icon size={17} /></div>
                                <span>{label}</span>
                                {active && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                            </a>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={{ padding: ".875rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: ".35rem" }}>
                    <a href="/" target="_blank" className="nav-item" style={{ fontSize: ".82rem" }}>
                        <div className="nav-icon"><ExternalLink size={16} /></div>
                        <span>View Registration Page</span>
                    </a>
                    <button onClick={logout} style={{
                        display: "flex", alignItems: "center", gap: ".75rem",
                        padding: ".6rem .875rem", borderRadius: 10,
                        border: "1px solid rgba(220,38,38,.18)", background: "rgba(220,38,38,.06)",
                        cursor: "pointer", fontSize: ".875rem", color: "#dc2626",
                        fontFamily: "inherit", width: "100%", fontWeight: 600, transition: "all .2s",
                    }}>
                        <div className="nav-icon" style={{ background: "rgba(220,38,38,.08)" }}><LogOut size={16} color="#dc2626" /></div>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 90, backdropFilter: "blur(3px)" }} />
            )}

            {/* Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "padding-left .3s" }} className="admin-content">
                <header className="topbar">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                        background: "var(--bg-muted)", border: "1px solid var(--border)",
                        borderRadius: 10, padding: ".5rem .65rem", cursor: "pointer", color: "var(--primary)",
                    }}>
                        <Menu size={18} />
                    </button>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: ".6rem" }}>
                        {currentPage && <currentPage.Icon size={17} color="var(--primary)" />}
                        <span style={{ color: "var(--text)", fontWeight: 700, fontSize: ".92rem" }}>
                            {currentPage?.label || "Admin Panel"}
                        </span>
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: ".6rem",
                        background: "var(--bg-muted)", border: "1px solid var(--border)",
                        borderRadius: 999, padding: ".35rem .875rem",
                    }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--grad-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShieldCheck size={14} color="#fff" />
                        </div>
                        <span style={{ fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 600 }}>Admin</span>
                    </div>
                </header>

                <main style={{ flex: 1, padding: "1.75rem", maxWidth: 1440, width: "100%", margin: "0 auto" }}>
                    {children}
                </main>
            </div>

            <style>{`
        @media (min-width: 769px) {
          .admin-sidebar { left: 0 !important; }
          .admin-content { padding-left: 260px !important; }
        }
      `}</style>
        </div>
    );
}
