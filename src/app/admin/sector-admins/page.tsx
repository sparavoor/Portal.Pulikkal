"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Key, ShieldCheck, X, Save } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Sector {
    id: number;
    name: string;
}

interface SectorAdmin {
    id: number;
    username: string;
    sectorId: number;
    sector: Sector;
}

interface DeleteTarget {
    id: number;
    username: string;
}

export default function SectorAdminsPage() {
    const [admins, setAdmins] = useState<SectorAdmin[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [editTarget, setEditTarget] = useState<SectorAdmin | null>(null);

    const [form, setForm] = useState({
        username: "",
        password: "",
        sectorId: ""
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        const [adminsRes, sectorsRes] = await Promise.all([
            fetch("/api/admin/sector-admins"),
            fetch("/api/admin/sectors")
        ]);

        if (adminsRes.ok) setAdmins(await adminsRes.json());
        if (sectorsRes.ok) setSectors(await sectorsRes.json());
        setLoading(false);
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            await loadData();
        };
        fetchAll();
    }, [loadData]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        const res = await fetch("/api/admin/sector-admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        if (res.ok) {
            setForm({ username: "", password: "", sectorId: "" });
            setShowAddModal(false);
            loadData();
        } else {
            const data = await res.json();
            alert(data.error || "Failed to create admin");
        }
        setActionLoading(false);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;

        setActionLoading(true);
        const res = await fetch("/api/admin/sector-admins", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editTarget.id,
                username: form.username,
                password: form.password || undefined, // only send if not empty
                sectorId: form.sectorId
            })
        });

        if (res.ok) {
            setForm({ username: "", password: "", sectorId: "" });
            setEditTarget(null);
            loadData();
        } else {
            const data = await res.json();
            alert(data.error || "Failed to update admin");
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setActionLoading(true);
        const res = await fetch(`/api/admin/sector-admins?id=${deleteTarget.id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            setDeleteTarget(null);
            loadData();
        }
        setActionLoading(false);
    };

    const openEdit = (admin: SectorAdmin) => {
        setEditTarget(admin);
        setForm({
            username: admin.username,
            password: "",
            sectorId: admin.sectorId.toString()
        });
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "1rem" }}>
            <div className="loader-ring" />
            <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>Loading sector admins...</p>
        </div>
    );

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", marginBottom: ".25rem" }}>Sector Admins</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>Manage login credentials for each sector</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setForm({ username: "", password: "", sectorId: "" }); }}>
                    <Plus size={18} /> Add New Admin
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                            <th style={{ padding: "1.1rem 1.5rem", fontSize: ".72rem", fontWeight: 800, color: "var(--primary)", letterSpacing: ".08em", textTransform: "uppercase" }}>Username</th>
                            <th style={{ padding: "1.1rem 1.5rem", fontSize: ".72rem", fontWeight: 800, color: "var(--primary)", letterSpacing: ".08em", textTransform: "uppercase" }}>Sector</th>
                            <th style={{ padding: "1.1rem 1.5rem", fontSize: ".72rem", fontWeight: 800, color: "var(--primary)", letterSpacing: ".08em", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: "3rem", textAlign: "center", color: "var(--text-dim)", fontSize: ".9rem" }}>
                                    No sector admins found. Click &quot;Add New Admin&quot; to create one.
                                </td>
                            </tr>
                        ) : admins.map(admin => (
                            <tr key={admin.id} style={{ borderBottom: "1px solid var(--border)", transition: "background .2s" }} className="hover-row">
                                <td style={{ padding: "1.1rem 1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                            <ShieldCheck size={18} />
                                        </div>
                                        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: ".95rem" }}>{admin.username}</div>
                                    </div>
                                </td>
                                <td style={{ padding: "1.1rem 1.5rem" }}>
                                    <div className="badge badge-outline" style={{ display: "inline-flex", gap: ".4rem", alignItems: "center", fontSize: ".8rem" }}>
                                        {admin.sector.name}
                                    </div>
                                </td>
                                <td style={{ padding: "1.1rem 1.5rem", textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(admin)} title="Edit">
                                            <Pencil size={15} color="var(--primary)" />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ id: admin.id, username: admin.username })} title="Delete">
                                            <Trash2 size={15} color="#dc2626" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            {(showAddModal || editTarget) && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 420 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                    {editTarget ? <Pencil size={20} /> : <Plus size={20} />}
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>{editTarget ? "Edit Admin" : "Add New Admin"}</h2>
                                    <p style={{ color: "var(--text-muted)", fontSize: ".78rem" }}>{editTarget ? "Update sector admin credentials" : "Create login access for a sector"}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddModal(false); setEditTarget(null); }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={editTarget ? handleEdit : handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 700, color: "#785048", marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".05em" }}>Username</label>
                                <input
                                    className="input"
                                    placeholder="e.g. north_sector"
                                    required
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 700, color: "#785048", marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".05em" }}>
                                    {editTarget ? "Change Password (optional)" : "Password"}
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder={editTarget ? "Leave blank to keep current" : "Enter secure password"}
                                        required={!editTarget}
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        style={{ paddingLeft: "2.4rem" }}
                                    />
                                    <Key size={16} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 700, color: "#785048", marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".05em" }}>Assign Sector</label>
                                <select
                                    className="input"
                                    required
                                    value={form.sectorId}
                                    onChange={e => setForm({ ...form, sectorId: e.target.value })}
                                >
                                    <option value="">Select a sector...</option>
                                    {sectors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAddModal(false); setEditTarget(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                                    {actionLoading ? <div className="spinner-primary" /> : <><Save size={18} /> {editTarget ? "Update" : "Create"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    title="Delete Sector Admin"
                    description={`Are you sure you want to delete account "${deleteTarget.username}"? They will no longer be able to log in.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
}
