"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

interface Settings { [k: string]: string }

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings").then(r => r.json()).then(setSettings);
    }, []);

    const save = async () => {
        setLoading(true);
        await fetch("/api/admin/settings", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        setLoading(false); setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const update = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>Page Settings</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: ".9rem" }}>Customize the registration page appearance and fields</p>
                </div>
                <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
                    {saved && <span style={{ color: "#16a34a", fontSize: ".875rem", fontWeight: 600 }}>✅ Saved!</span>}
                    <button className="btn btn-primary" onClick={save} disabled={loading}>
                        {loading ? "Saving..." : "💾 Save Changes"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {/* Registration control */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>🔒 Registration Control</h3>
                    <label>Registration Status</label>
                    <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                        <button className={`btn ${settings.registration_status === "open" ? "btn-secondary" : "btn-ghost"}`}
                            onClick={() => update("registration_status", "open")} style={{ flex: 1 }}>
                            🔓 Open
                        </button>
                        <button className={`btn ${settings.registration_status === "closed" ? "btn-danger" : "btn-ghost"}`}
                            onClick={() => update("registration_status", "closed")} style={{ flex: 1 }}>
                            🔒 Closed
                        </button>
                    </div>
                    <p style={{ marginTop: ".75rem", fontSize: ".8rem", color: "var(--text-dim)" }}>
                        Current: <strong style={{ color: settings.registration_status === "open" ? "#16a34a" : "#dc2626" }}>
                            {settings.registration_status === "open" ? "Open" : "Closed"}
                        </strong>
                    </p>
                </div>

                {/* Page content */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>📝 Page Content</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                        <div>
                            <label>Page Heading</label>
                            <input className="input" value={settings.page_heading || ""} onChange={e => update("page_heading", e.target.value)} />
                        </div>
                        <div>
                            <label>Sub-heading</label>
                            <input className="input" value={settings.page_subheading || ""} onChange={e => update("page_subheading", e.target.value)} />
                        </div>
                        <div>
                            <label>Instructions</label>
                            <textarea className="input" rows={4} value={settings.page_instructions || ""} onChange={e => update("page_instructions", e.target.value)} style={{ resize: "vertical" }} />
                        </div>
                        <div>
                            <label>Logo URL (optional)</label>
                            <input className="input" placeholder="https://..." value={settings.page_logo || ""} onChange={e => update("page_logo", e.target.value)} />
                            {settings.page_logo && (
                                <img src={settings.page_logo} alt="Logo preview" style={{ height: 50, marginTop: ".5rem", borderRadius: 8 }} onError={e => (e.currentTarget.style.display = "none")} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Field toggles */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>🔧 Form Fields</h3>
                    {[
                        { key: "show_designation", label: "Designation Field" },
                        { key: "show_sector", label: "Sector Field" },
                        { key: "show_unit", label: "Unit Field" },
                    ].map(({ key, label }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".625rem .875rem", background: "var(--bg-muted)", borderRadius: 10, marginBottom: ".5rem" }}>
                            <span style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--text-sub)" }}>{label}</span>
                            <label style={{ cursor: "pointer", margin: 0 }}>
                                <input type="checkbox" checked={settings[key] !== "false"} onChange={e => update(key, e.target.checked ? "true" : "false")}
                                    style={{ display: "none" }} />
                                <div style={{
                                    width: 44, height: 24, borderRadius: 12, background: settings[key] !== "false" ? "var(--primary)" : "#cbd5e1",
                                    position: "relative", transition: "background .2s",
                                }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                                        position: "absolute", top: 3, left: settings[key] !== "false" ? 23 : 3, transition: "left .2s",
                                    }} />
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
