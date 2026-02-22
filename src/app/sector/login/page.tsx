"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building, ArrowRight } from "lucide-react";

export default function SectorLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const login = async () => {
        if (!username || !password) { setError("Both fields are required"); return; }
        setLoading(true); setError("");
        const res = await fetch("/api/sector/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error); return; }
        router.push("/sector");
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
            <div className="hero-blob" style={{ width: 400, height: 400, background: "var(--bg-muted)", top: -150, left: -120 }} />
            <div className="hero-blob" style={{ width: 300, height: 300, background: "var(--bg-subtle)", bottom: -100, right: -80 }} />

            <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420 }}>
                <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
                    <div style={{
                        width: 76, height: 76, borderRadius: 22,
                        background: "var(--grad-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.1rem",
                        boxShadow: "var(--shadow-md)",
                    }}>
                        <Building size={34} color="#fff" />
                    </div>
                    <h1 style={{ fontWeight: 900, fontSize: "1.6rem", color: "var(--text)", marginBottom: ".3rem" }}>Sector Portal</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: ".9rem" }}>Sign in to your sector dashboard</p>
                </div>

                <div className="card" style={{ padding: "2.25rem", borderColor: "var(--border)" }}>
                    {error && (
                        <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#dc2626", padding: ".75rem 1rem", borderRadius: 10, marginBottom: "1.25rem", fontSize: ".875rem", fontWeight: 500 }}>
                            {error}
                        </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                        <div>
                            <label>Username</label>
                            <input className="input" placeholder="Sector username" value={username}
                                onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
                        </div>
                        <div>
                            <label>Password</label>
                            <input className="input" type="password" placeholder="Password" value={password}
                                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
                        </div>
                        <button className="btn btn-primary" style={{ width: "100%", padding: ".9rem", fontSize: ".95rem" }} onClick={login} disabled={loading}>
                            {loading ? <><span className="spinner" /> Signing in...</> : <><span>Sign In</span><ArrowRight size={17} /></>}
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "1.25rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                    <Link href="/" style={{ color: "var(--text-dim)", fontSize: ".82rem", textDecoration: "none", fontWeight: 500 }}>← Registration Page</Link>
                </div>
            </div>
        </div>
    );
}
