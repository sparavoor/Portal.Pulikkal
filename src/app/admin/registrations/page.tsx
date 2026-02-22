"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Search, CalendarDays, FileSpreadsheet, FileDown, Trash2, X, CheckCircle2, Clock, Copy } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Registration {
    id: number; regId: string; name: string; mobile: string;
    designation: string; sector: { id: number; name: string };
    unit: { id: number; name: string }; admitted: boolean;
    admissionTime: string | null; createdAt: string;
}
interface Sector { id: number; name: string; units: { id: number; name: string }[] }

export default function RegistrationsPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: "", sectorId: "", unitId: "", designation: "", date: "" });
    const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const DESIGNATIONS = ["Division Executive", "Division Directorate", "Sector Executive", "Unit Executive"];

    const load = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.sectorId) params.set("sectorId", filters.sectorId);
        if (filters.unitId) params.set("unitId", filters.unitId);
        if (filters.designation) params.set("designation", filters.designation);
        if (filters.date) params.set("date", filters.date);
        const res = await fetch(`/api/admin/registrations?${params}`);
        if (res.status === 401) { router.push("/admin/login"); return; }
        setRegistrations(await res.json());
        setLoading(false);
    }, [filters, router]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [filters]);
    useEffect(() => {
        fetch("/api/admin/sectors").then(r => r.json()).then(setSectors);
    }, []);

    const selectedSectorUnits = sectors.find(s => s.id === parseInt(filters.sectorId))?.units || [];

    const exportExcel = () => {
        const data = registrations.map(r => ({
            "Reg ID": r.regId, Name: r.name, Mobile: r.mobile, Designation: r.designation,
            Sector: r.sector.name, Unit: r.unit.name,
            Status: r.admitted ? "Admitted" : "Pending",
            "Admission Time": r.admissionTime ? new Date(r.admissionTime).toLocaleString() : "-",
            "Registered At": new Date(r.createdAt).toLocaleString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registrations");
        XLSX.writeFile(wb, `registrations-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const exportPDF = () => {
        const pdf = new jsPDF({ orientation: "landscape" });
        pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
        pdf.text("Registration List - SSF Pulikkal Division", 14, 15);
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal");
        pdf.text(`Exported: ${new Date().toLocaleString()} | Total: ${registrations.length}`, 14, 22);
        const headers = ["Reg ID", "Name", "Mobile", "Designation", "Sector", "Unit", "Status", "Date"];
        const rows = registrations.map(r => [r.regId, r.name, r.mobile, r.designation.split(" ")[0], r.sector.name, r.unit.name, r.admitted ? "Admitted" : "Pending", new Date(r.createdAt).toLocaleDateString()]);
        let y = 30; const colWidths = [22, 35, 28, 30, 28, 20, 22, 22]; let x = 14;
        pdf.setFillColor(168, 92, 79); pdf.setTextColor(255, 255, 255);
        pdf.rect(14, y - 4, colWidths.reduce((a, b) => a + b, 0), 8, "F");
        headers.forEach((h, i) => { pdf.setFontSize(7.5); pdf.text(h, x + 2, y); x += colWidths[i]; });
        y += 6; x = 14; pdf.setTextColor(28, 14, 12);
        rows.forEach((row, ri) => {
            if (y > 185) { pdf.addPage(); y = 20; }
            if (ri % 2 === 0) { pdf.setFillColor(253, 246, 245); pdf.rect(14, y - 4, colWidths.reduce((a, b) => a + b, 0), 7, "F"); }
            row.forEach((cell, i) => { pdf.setFontSize(7); pdf.text(String(cell), x + 2, y); x += colWidths[i]; });
            y += 7; x = 14;
        });

        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Report Generated: ${new Date().toLocaleString("en-GB")} | SSF Pulikkal Division`, 14, 205);
        pdf.save(`registrations-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const copyReport = () => {
        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            counts[r.sector.name] = (counts[r.sector.name] || 0) + 1;
        });
        const breakdown = Object.entries(counts).map(([sector, count]) => `${sector} - ${count}`).join("\n\n");
        const today = new Date().toLocaleDateString("en-GB");
        const text = `*Badr Smridhi 🔖*\nRegistration\n\n${breakdown}\n\n*Total - ${registrations.length}*\n\n📅 ${today}\n_SSF Pulikkal Division_`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            {deleteTarget && (
                <DeleteConfirmModal
                    title="Delete Registration"
                    description={`Permanently delete the registration of "${deleteTarget.name}" (${deleteTarget.regId})?`}
                    warning="This will remove all registration data including admission status. This cannot be undone."
                    onConfirm={async () => {
                        await fetch(`/api/admin/registrations?id=${deleteTarget.id}`, { method: "DELETE" });
                        setDeleteTarget(null); load();
                    }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text)" }}>Registrations</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>{registrations.length} record{registrations.length !== 1 ? "s" : ""} found</p>
                </div>
                <div style={{ display: "flex", gap: ".75rem" }}>
                    <button className="btn btn-ghost" onClick={copyReport} style={{ gap: ".5rem" }}>
                        {copied ? <CheckCircle2 size={16} color="#16a34a" /> : <Copy size={16} color="var(--primary)" />}
                        {copied ? "Copied" : "Copy Report"}
                    </button>
                    <button className="btn btn-ghost" onClick={exportExcel} style={{ gap: ".5rem" }}>
                        <FileSpreadsheet size={16} color="var(--primary)" /> Excel
                    </button>
                    <button className="btn btn-ghost" onClick={exportPDF} style={{ gap: ".5rem" }}>
                        <FileDown size={16} color="var(--primary)" /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: ".75rem" }}>
                    <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                        <Search size={17} style={{ position: "absolute", left: ".9rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                        <input className="input" style={{ paddingLeft: "2.5rem" }} placeholder="Search by name, ID, mobile..." value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <CalendarDays size={15} style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                        <input className="input" type="date" value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })} style={{ paddingLeft: "2.25rem" }} />
                    </div>
                    <select className="input" value={filters.sectorId} onChange={e => setFilters({ ...filters, sectorId: e.target.value, unitId: "" })}>
                        <option value="">All Sectors</option>
                        {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select className="input" value={filters.unitId} onChange={e => setFilters({ ...filters, unitId: e.target.value })}>
                        <option value="">All Units</option>
                        {selectedSectorUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select className="input" value={filters.designation} onChange={e => setFilters({ ...filters, designation: e.target.value })}>
                        <option value="">All Designations</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button className="btn btn-ghost" onClick={() => setFilters({ search: "", sectorId: "", unitId: "", designation: "", date: "" })} style={{ gap: ".4rem" }}>
                        <X size={15} /> Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrap">
                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dim)" }}>Loading...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Reg ID</th><th>Name</th><th>Mobile</th><th>Designation</th>
                                <th>Sector</th><th>Unit</th><th>Status</th><th>Date</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.length === 0 && (
                                <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem" }}>No registrations found</td></tr>
                            )}
                            {registrations.map(r => (
                                <tr key={r.id}>
                                    <td><span style={{ fontWeight: 700, color: "var(--primary)", fontSize: ".85rem" }}>{r.regId}</span></td>
                                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{r.name}</td>
                                    <td style={{ color: "var(--text-sub)" }}>{r.mobile}</td>
                                    <td><span className="badge badge-primary">{r.designation.split(" ")[0]}</span></td>
                                    <td>{r.sector.name}</td>
                                    <td>{r.unit.name}</td>
                                    <td>
                                        <span className={`badge ${r.admitted ? "badge-green" : "badge-gray"}`} style={{ display: "inline-flex", alignItems: "center", gap: ".3rem" }}>
                                            {r.admitted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                            {r.admitted ? "Admitted" : "Pending"}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-dim)", fontSize: ".82rem" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-danger" style={{ padding: ".35rem .65rem" }} onClick={() => setDeleteTarget(r)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Visual Footer for UI */}
            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", color: "var(--text-dim)", fontSize: ".85rem" }}>
                <CalendarDays size={16} />
                <span>Report Generated on {new Date().toLocaleDateString("en-GB")}</span>
            </div>
        </div>
    );
}
