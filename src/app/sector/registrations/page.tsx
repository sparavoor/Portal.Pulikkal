"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { FileSpreadsheet, FileDown, CheckCircle2, Clock, X, Copy, CalendarDays } from "lucide-react";

interface Registration {
    id: number; regId: string; name: string; mobile: string;
    designation: string; sector: { name: string }; unit: { id: number; name: string };
    admitted: boolean; createdAt: string;
}
interface Unit { id: number; name: string }

export default function SectorRegistrationsPage() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitId, setUnitId] = useState("");
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const router = useRouter();



    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            const params = unitId ? `?unitId=${unitId}` : "";
            const res = await fetch(`/api/sector/registrations${params}`);
            if (res.status === 401) { router.push("/sector/login"); return; }
            const data = await res.json();
            if (mounted) {
                setRegistrations(data);
                setLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, [unitId, router]);

    useEffect(() => {
        fetch("/api/sector/units").then(r => r.json()).then(setUnits);
    }, []);

    const exportExcel = () => {
        const data = registrations.map(r => ({
            "Reg ID": r.regId, Name: r.name, Mobile: r.mobile, Designation: r.designation,
            Unit: r.unit.name, Status: r.admitted ? "Admitted" : "Pending",
            "Registered At": new Date(r.createdAt).toLocaleString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registrations");
        XLSX.writeFile(wb, `sector-registrations-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const exportPDF = () => {
        const sectorName = registrations.length > 0 ? registrations[0].sector.name : "Sector";
        const pdf = new jsPDF({ orientation: "landscape" });
        pdf.setFontSize(13); pdf.setFont("helvetica", "bold");
        pdf.text("Sector Registration Report - SSF Pulikkal Division", 14, 14);
        pdf.setFontSize(8); pdf.setFont("helvetica", "normal");
        pdf.text(`Exported: ${new Date().toLocaleString()} | Total: ${registrations.length}`, 14, 21);

        const headers = ["Reg ID", "Name", "Mobile", "Designation", "Unit", "Status", "Date"];
        const rows = registrations.map(r => [
            r.regId, r.name, r.mobile, r.designation.split(" ")[0],
            r.unit.name, r.admitted ? "Admitted" : "Pending",
            new Date(r.createdAt).toLocaleDateString(),
        ]);

        let y = 30;
        const colWidths = [22, 40, 28, 28, 25, 22, 22];
        let x = 14;

        pdf.setFillColor(0, 71, 171); pdf.setTextColor(255, 255, 255);
        pdf.rect(14, y - 4, colWidths.reduce((a, b) => a + b, 0), 8, "F");
        headers.forEach((h, i) => { pdf.setFontSize(7.5); pdf.text(h, x + 2, y); x += colWidths[i]; });
        y += 6; x = 14;

        pdf.setTextColor(10, 25, 47);
        rows.forEach((row, ri) => {
            if (y > 185) { pdf.addPage(); y = 15; }
            if (ri % 2 === 0) { pdf.setFillColor(235, 248, 255); pdf.rect(14, y - 4, colWidths.reduce((a, b) => a + b, 0), 7, "F"); }
            row.forEach((cell, i) => { pdf.setFontSize(7); pdf.text(String(cell), x + 2, y); x += colWidths[i]; });
            y += 7; x = 14;
        });

        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Report Generated: ${new Date().toLocaleString("en-GB")} | SSF ${sectorName} Sector`, 14, 205);

        pdf.save(`sector-registrations-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const copyReport = () => {
        const counts: Record<string, number> = {};
        registrations.forEach(r => {
            counts[r.unit.name] = (counts[r.unit.name] || 0) + 1;
        });
        const breakdown = Object.entries(counts).map(([unit, count]) => `${unit} - ${count}`).join("\n\n");
        const sectorName = registrations.length > 0 ? registrations[0].sector.name : "Sector";
        const today = new Date().toLocaleDateString("en-GB");
        const text = `*Badr Smridhi 🔖*\nRegistration\n\n${breakdown}\n\n*Total - ${registrations.length}*\n\n📅 ${today}\n_SSF ${sectorName} Sector_`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>Sector Registrations</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: ".9rem" }}>{registrations.length} record{registrations.length !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                    <button className="btn btn-ghost" onClick={copyReport} style={{ gap: ".4rem" }}>
                        {copied ? <CheckCircle2 size={15} color="#16a34a" /> : <Copy size={15} color="var(--primary)" />}
                        {copied ? "Copied" : "Copy Report"}
                    </button>
                    <button className="btn btn-ghost" onClick={exportExcel} style={{ gap: ".4rem" }}>
                        <FileSpreadsheet size={15} color="var(--primary)" /> Excel
                    </button>
                    <button className="btn btn-ghost" onClick={exportPDF} style={{ gap: ".4rem" }}>
                        <FileDown size={15} color="var(--primary)" /> PDF
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="card" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                    <select className="input" value={unitId} onChange={e => setUnitId(e.target.value)} style={{ maxWidth: 220 }}>
                        <option value="">All Units</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    {unitId && <button className="btn btn-ghost" onClick={() => setUnitId("")} style={{ gap: ".4rem" }}><X size={15} /> Clear</button>}
                </div>
            </div>

            {/* Table */}
            <div className="table-wrap">
                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Reg ID</th><th>Name</th><th>Mobile</th><th>Designation</th><th>Unit</th><th>Status</th><th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "3rem" }}>No registrations found</td></tr>
                            )}
                            {registrations.map(r => (
                                <tr key={r.id}>
                                    <td><span style={{ fontWeight: 700, color: "var(--primary)", fontSize: ".85rem" }}>{r.regId}</span></td>
                                    <td style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--text)" }}>{r.name}</td>
                                    <td style={{ fontSize: ".85rem", color: "var(--text-sub)" }}>{r.mobile}</td>
                                    <td><span className="badge badge-primary" style={{ fontSize: ".75rem" }}>{r.designation.split(" ")[0]}</span></td>
                                    <td style={{ fontSize: ".85rem", color: "var(--text-sub)" }}>{r.unit.name}</td>
                                    <td>
                                        <span className={`badge ${r.admitted ? "badge-primary" : "badge-gray"}`} style={{ display: "inline-flex", alignItems: "center", gap: ".3rem" }}>
                                            {r.admitted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                            {r.admitted ? "Admitted" : "Pending"}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: ".8rem", color: "var(--text-dim)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
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
