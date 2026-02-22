"use client";
import { useEffect, useRef, useState } from "react";

interface Registration {
    id: number; regId: string; name: string; mobile: string;
    designation: string; sector: { name: string }; unit: { name: string };
    admitted: boolean; admissionTime: string | null;
}

interface ScanResult {
    success?: boolean; error?: string; alreadyAdmitted?: boolean;
    registration?: Registration;
}

export default function AdmissionPage() {
    const [manualId, setManualId] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const admit = async (regId: string) => {
        setLoading(true);
        const res = await fetch("/api/admin/admit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ regId }),
        });
        const data = await res.json();
        setResult(data);
        setLoading(false);
    };

    const handleManual = () => {
        if (!manualId.trim()) return;
        admit(manualId.trim().toUpperCase());
    };

    const startCamera = async () => {
        setCameraActive(true);
    };

    useEffect(() => {
        let active = true;

        async function initCamera() {
            if (!cameraActive) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;

                // Wait for video element to be available in the DOM
                let attempts = 0;
                while (!videoRef.current && attempts < 10) {
                    await new Promise(r => setTimeout(r, 100));
                    attempts++;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(e => console.error("Video play failed:", e));
                }

                const { default: jsQR } = await import("jsqr");
                scanInterval.current = setInterval(() => {
                    if (!videoRef.current || !canvasRef.current) return;
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (!ctx || videoRef.current.readyState < 2) return;

                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        try {
                            const parsed = JSON.parse(code.data);
                            if (parsed.regId) {
                                stopCamera();
                                admit(parsed.regId);
                            }
                        } catch {
                            if (code.data.startsWith("REG-")) {
                                stopCamera();
                                admit(code.data);
                            }
                        }
                    }
                }, 300);
            } catch (e: any) {
                console.error("Camera Error:", e);
                setCameraActive(false);
                alert(`Camera error: ${e.message || "Unknown error"}`);
            }
        }

        if (cameraActive) {
            initCamera();
        } else {
            stopCamera();
        }

        return () => {
            active = false;
        };
    }, [cameraActive]);

    const stopCamera = () => {
        if (scanInterval.current) {
            clearInterval(scanInterval.current);
            scanInterval.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    useEffect(() => () => stopCamera(), []);

    const reset = () => { setResult(null); setManualId(""); };

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>QR Admission Scanner</h1>
                <p style={{ color: "var(--text-dim)", fontSize: ".9rem" }}>Scan QR codes or enter Registration IDs manually</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {/* Scanner */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>📷 QR Code Scanner</h3>
                    {!cameraActive ? (
                        <div style={{ textAlign: "center", padding: "2rem 0" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📷</div>
                            <p style={{ color: "var(--text-dim)", marginBottom: "1.25rem", fontSize: ".9rem" }}>
                                Click to start camera and scan QR codes
                            </p>
                            <button className="btn btn-primary" onClick={startCamera}>
                                Start Camera
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", marginBottom: "1rem" }}>
                                <video ref={videoRef} style={{ width: "100%", display: "block", borderRadius: 12 }} playsInline muted />
                                <canvas ref={canvasRef} style={{ display: "none" }} />
                                {/* Scan overlay */}
                                <div style={{
                                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <div style={{ width: 200, height: 200, border: "3px solid var(--primary)", borderRadius: 12, boxShadow: "0 0 0 9999px rgba(0,0,0,.35)" }}>
                                        <div style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderTop: "4px solid var(--primary)", borderLeft: "4px solid var(--primary)" }} />
                                        <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, borderTop: "4px solid var(--primary)", borderRight: "4px solid var(--primary)" }} />
                                        <div style={{ position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderBottom: "4px solid var(--primary)", borderLeft: "4px solid var(--primary)" }} />
                                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderBottom: "4px solid var(--primary)", borderRight: "4px solid var(--primary)" }} />
                                    </div>
                                </div>
                            </div>
                            <p style={{ textAlign: "center", color: "var(--text-dim)", fontSize: ".85rem", marginBottom: ".75rem" }}>
                                📡 Scanning for QR codes...
                            </p>
                            <button className="btn btn-danger" style={{ width: "100%" }} onClick={stopCamera}>
                                Stop Camera
                            </button>
                        </div>
                    )}
                </div>

                {/* Manual entry */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>⌨️ Manual Entry</h3>
                    <label>Registration ID</label>
                    <input className="input" placeholder="e.g. REG-0001" value={manualId}
                        onChange={e => setManualId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManual()}
                        style={{ marginBottom: "1rem" }}
                    />
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleManual} disabled={loading || !manualId}>
                        {loading ? <><span className="spinner" /> Processing...</> : "Mark as Admitted"}
                    </button>

                    {/* Recent scan result */}
                    {result && (
                        <div style={{
                            marginTop: "1.25rem",
                            background: result.success ? "#f0fdf4" : result.alreadyAdmitted ? "#fef9c3" : "#fef2f2",
                            border: `1px solid ${result.success ? "#bbf7d0" : result.alreadyAdmitted ? "#fde68a" : "#fecaca"}`,
                            borderRadius: 12, padding: "1.25rem",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: result.registration ? ".75rem" : 0 }}>
                                <span style={{ fontSize: "1.5rem" }}>
                                    {result.success ? "✅" : result.alreadyAdmitted ? "⚠️" : "❌"}
                                </span>
                                <div>
                                    <p style={{ fontWeight: 700, color: result.success ? "#15803d" : result.alreadyAdmitted ? "#92400e" : "#dc2626" }}>
                                        {result.success ? "Admitted Successfully!" : result.alreadyAdmitted ? "Already Admitted" : result.error}
                                    </p>
                                    {result.registration?.admissionTime && result.alreadyAdmitted && (
                                        <p style={{ fontSize: ".8rem", color: "#92400e" }}>
                                            At: {new Date(result.registration.admissionTime).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {result.registration && (
                                <div style={{ background: "rgba(255,255,255,.7)", borderRadius: 8, padding: ".75rem" }}>
                                    <p style={{ fontWeight: 700, marginBottom: ".25rem", color: "var(--text)" }}>{result.registration.name}</p>
                                    <p style={{ fontSize: ".85rem", color: "var(--text-dim)" }}>{result.registration.regId} · {result.registration.mobile}</p>
                                    <p style={{ fontSize: ".85rem", color: "var(--text-dim)" }}>{result.registration.designation}</p>
                                    <p style={{ fontSize: ".85rem", color: "var(--text-dim)" }}>{result.registration.sector?.name} · {result.registration.unit?.name}</p>
                                </div>
                            )}
                            <button className="btn btn-ghost" style={{ width: "100%", marginTop: ".75rem", fontSize: ".85rem" }} onClick={reset}>
                                Scan Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
