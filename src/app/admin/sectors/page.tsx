"use client";
import { useEffect, useState, useCallback } from "react";
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Sector { id: number; name: string; units: { id: number; name: string }[]; _count: { registrations: number } }
interface DeleteTarget { type: "sector" | "unit"; id: number; label: string; extra?: string; }

export default function SectorsPage() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [newSector, setNewSector] = useState("");
    const [newUnit, setNewUnit] = useState({ name: "", sectorId: "" });
    const [editSector, setEditSector] = useState<{ id: number; name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedSector, setExpandedSector] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    const load = useCallback(async () => {
        const res = await fetch("/api/admin/sectors");
        setSectors(await res.json());
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load(); }, [load]);

    const addSector = async () => {
        if (!newSector.trim()) return;
        setLoading(true);
        await fetch("/api/admin/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSector.trim() }) });
        setNewSector(""); setLoading(false); load();
    };

    const saveSector = async () => {
        if (!editSector) return;
        await fetch("/api/admin/sectors", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editSector.id, name: editSector.name }) });
        setEditSector(null); load();
    };

    const addUnit = async () => {
        if (!newUnit.name.trim() || !newUnit.sectorId) return;
        await fetch("/api/admin/units", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUnit.name.trim(), sectorId: newUnit.sectorId }) });
        setNewUnit({ name: "", sectorId: "" }); load();
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "sector") await fetch(`/api/admin/sectors?id=${deleteTarget.id}`, { method: "DELETE" });
        else await fetch(`/api/admin/units?id=${deleteTarget.id}`, { method: "DELETE" });
        setDeleteTarget(null); load();
    };

    return (
        <div>
            {deleteTarget && (
                <DeleteConfirmModal
                    title={deleteTarget.type === "sector" ? "Delete Sector" : "Delete Unit"}
                    description={deleteTarget.type === "sector" ? `Delete the sector "${deleteTarget.label}"?` : `Delete unit "${deleteTarget.label}" from ${deleteTarget.extra}?`}
                    warning={deleteTarget.type === "sector" ? "This will also delete all units inside this sector. Cannot be undone." : "This unit will be removed. Cannot be undone."}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text)" }}>Sectors & Units</h1>
                <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>Manage all sectors and their units. Changes reflect immediately on the registration page.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {/* Add form */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1rem" }}>
                        <div className="section-icon"><Building2 size={17} color="#fff" /></div>
                        <h3 style={{ fontWeight: 800 }}>Add New Sector</h3>
                    </div>
                    <label>Sector Name</label>
                    <input className="input" placeholder="e.g. North Sector" value={newSector}
                        onChange={e => setNewSector(e.target.value)} onKeyDown={e => e.key === "Enter" && addSector()} style={{ marginBottom: ".75rem" }} />
                    <button className="btn btn-primary" style={{ width: "100%", gap: ".5rem" }} onClick={addSector} disabled={loading || !newSector.trim()}>
                        <Plus size={16} />{loading ? "Adding..." : "Add Sector"}
                    </button>

                    <hr style={{ margin: "1.25rem 0", borderColor: "var(--border)" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1rem" }}>
                        <div className="section-icon"><Plus size={17} color="#fff" /></div>
                        <h3 style={{ fontWeight: 800 }}>Add Unit to Sector</h3>
                    </div>
                    <label>Select Sector</label>
                    <select className="input" value={newUnit.sectorId} onChange={e => setNewUnit({ ...newUnit, sectorId: e.target.value })} style={{ marginBottom: ".75rem" }}>
                        <option value="">Select a sector</option>
                        {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <label>Unit Name</label>
                    <input className="input" placeholder="e.g. Unit 5" value={newUnit.name} onChange={e => setNewUnit({ ...newUnit, name: e.target.value })} style={{ marginBottom: ".75rem" }} />
                    <button className="btn btn-secondary" style={{ width: "100%", gap: ".5rem" }} onClick={addUnit} disabled={!newUnit.name.trim() || !newUnit.sectorId}>
                        <Plus size={16} /> Add Unit
                    </button>
                </div>

                {/* Sector list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {sectors.length === 0 && (
                        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-dim)" }}>No sectors yet. Add one!</div>
                    )}
                    {sectors.map(sector => (
                        <div key={sector.id} className="card" style={{ padding: "1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                                {editSector?.id === sector.id ? (
                                    <>
                                        <input className="input" value={editSector.name} onChange={e => setEditSector({ ...editSector, name: e.target.value })} style={{ flex: 1 }} />
                                        <button className="btn btn-primary" style={{ padding: ".4rem .8rem", fontSize: ".8rem", gap: ".35rem" }} onClick={saveSector}><Save size={14} /> Save</button>
                                        <button className="btn btn-ghost" style={{ padding: ".4rem .8rem", fontSize: ".8rem" }} onClick={() => setEditSector(null)}><X size={14} /></button>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 700, color: "var(--text)" }}>{sector.name}</span>
                                            <span className="badge badge-primary" style={{ marginLeft: ".6rem" }}>{sector._count.registrations} regs</span>
                                        </div>
                                        <button className="btn btn-ghost" style={{ padding: ".35rem .6rem" }} onClick={() => setEditSector(sector)}><Pencil size={15} /></button>
                                        <button className="btn btn-danger" style={{ padding: ".35rem .6rem" }} onClick={() => setDeleteTarget({ type: "sector", id: sector.id, label: sector.name })}><Trash2 size={15} /></button>
                                        <button className="btn btn-ghost" style={{ padding: ".35rem .6rem" }} onClick={() => setExpandedSector(expandedSector === sector.id ? null : sector.id)}>
                                            {expandedSector === sector.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </>
                                )}
                            </div>

                            {expandedSector === sector.id && (
                                <div style={{ marginTop: ".875rem", paddingTop: ".875rem", borderTop: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: ".72rem", fontWeight: 800, color: "var(--text-dim)", letterSpacing: ".1em", marginBottom: ".6rem" }}>UNITS ({sector.units.length})</div>
                                    {sector.units.length === 0 && <p style={{ fontSize: ".85rem", color: "var(--text-dim)" }}>No units yet</p>}
                                    <div style={{ display: "flex", flexDirection: "column", gap: ".375rem" }}>
                                        {sector.units.map(unit => (
                                            <div key={unit.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-muted)", borderRadius: 8, padding: ".45rem .875rem" }}>
                                                <span style={{ fontSize: ".875rem", color: "var(--text-sub)", fontWeight: 500 }}>{unit.name}</span>
                                                <button className="btn btn-danger" style={{ padding: ".22rem .55rem" }} onClick={() => setDeleteTarget({ type: "unit", id: unit.id, label: unit.name, extra: sector.name })}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
