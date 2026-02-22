"use client";
import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
    title: string;
    description: string;
    warning?: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export default function DeleteConfirmModal({ title, description, warning, onConfirm, onCancel }: Props) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        // Don't need to unset loading here if the component unmounts on success, but safe to do so
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{
                        width: 68, height: 68, borderRadius: "50%",
                        background: "#FEF2F2", border: "2px solid rgba(220,38,38,.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1rem",
                    }}>
                        <Trash2 size={30} color="#dc2626" />
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: "1.15rem", color: "var(--text)", marginBottom: ".5rem" }}>{title}</h2>
                    <p style={{ color: "var(--text-dim)", fontSize: ".875rem", lineHeight: 1.6 }}>{description}</p>
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid rgba(217,119,6,.25)", borderRadius: 10, padding: ".8rem 1rem", marginBottom: "1.5rem", display: "flex", gap: ".65rem", alignItems: "flex-start" }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: ".1rem" }} />
                    <span style={{ fontSize: ".83rem", color: "#92400e", lineHeight: 1.6 }}>{warning || "This action cannot be undone."}</span>
                </div>

                <div style={{ display: "flex", gap: ".75rem" }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirm} disabled={loading}>
                        {loading ? <><span className="spinner-primary" style={{ borderTopColor: "#dc2626", borderColor: "rgba(220,38,38,.2)" }} /> Deleting...</> : <><Trash2 size={15} /> Delete</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
