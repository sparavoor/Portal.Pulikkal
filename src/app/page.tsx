"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { Smartphone, Lock, FileDown, Share2, CheckCircle2, Info, AlertCircle, ArrowRight, ArrowLeft, Ticket, BadgeCheck } from "lucide-react";

interface Sector { id: number; name: string; units: Unit[]; }
interface Unit { id: number; name: string; sectorId: number; }
interface Registration {
  id: number; regId: string; name: string; mobile: string;
  designation: string; sector: Sector; unit: Unit;
  admitted: boolean; createdAt: string;
}
interface Settings { [k: string]: string; }

const DESIGNATIONS = [
  "Division Executive",
  "Division Directorate",
  "Sector Executive",
  "Unit Executive",
];

export default function RegisterPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [step, setStep] = useState<"mobile" | "form" | "success" | "existing">("mobile");
  const [mobile, setMobile] = useState("");
  const [existingReg, setExistingReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", designation: "", sectorId: "", unitId: "" });
  const [newReg, setNewReg] = useState<Registration | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : ({}))
      .then(setSettings)
      .catch(() => { });

    fetch("/api/sectors")
      .then(r => r.ok ? r.json() : ([]))
      .then(data => Array.isArray(data) ? setSectors(data) : setSectors([]))
      .catch(() => setSectors([]));
  }, []);

  const selectedSectorUnits = Array.isArray(sectors) ? (sectors.find(s => s.id === parseInt(form.sectorId))?.units || []) : [];

  const generateQR = async (reg: Registration) => {
    const url = await QRCode.toDataURL(JSON.stringify({ regId: reg.regId, name: reg.name, mobile: reg.mobile }), {
      width: 240, margin: 2, color: { dark: "#5C2920", light: "#FFFFFF" },
    });
    setQrUrl(url);
  };

  const checkMobile = async () => {
    if (!mobile || mobile.length < 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setChecking(true); setError("");
    const res = await fetch(`/api/register?mobile=${mobile}`);
    const data = await res.json();
    setChecking(false);
    if (data.exists) { setExistingReg(data.registration); setStep("existing"); generateQR(data.registration); }
    else setStep("form");
  };

  const submitForm = async () => {
    if (!form.name || !form.designation || !form.sectorId || !form.unitId) { setError("All fields are required"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, mobile, designation: form.designation, sectorId: form.sectorId, unitId: form.unitId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setNewReg(data.registration);
    await generateQR(data.registration);
    setStep("success");
  };

  const downloadPDF = async (reg: Registration) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [90, 140] });
    const qr = await QRCode.toDataURL(JSON.stringify({ regId: reg.regId, name: reg.name, mobile: reg.mobile }), { width: 300, margin: 2, color: { dark: "#001A3D", light: "#FFFFFF" } });

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 90, 140, "F");

    // Professional Blue header
    pdf.setFillColor(0, 71, 171);
    pdf.rect(0, 0, 90, 30, "F");
    pdf.setFillColor(0, 99, 229);
    pdf.rect(0, 26, 90, 4, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5);
    pdf.text("SSF PULIKKAL DIVISION", 45, 9, { align: "center" });
    pdf.setFontSize(10); pdf.text("ENTRY TICKET", 45, 17, { align: "center" });


    // White card body
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(5, 33, 80, 100, 4, 4, "F");
    pdf.setDrawColor(0, 71, 171, 40);
    pdf.roundedRect(5, 33, 80, 100, 4, 4, "S");

    // QR Code
    pdf.addImage(qr, "PNG", 23, 38, 44, 44);

    // Dotted divider
    pdf.setDrawColor(0, 71, 171, 40);
    pdf.setLineDashPattern([1.5, 2], 0);
    pdf.line(8, 87, 82, 87);
    pdf.setLineDashPattern([], 0);

    // ID - Bronze Gold
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
    pdf.setTextColor(171, 100, 0);
    pdf.text(reg.regId, 45, 96, { align: "center" });

    // Name
    pdf.setFontSize(9); pdf.setTextColor(10, 25, 47);
    pdf.text(reg.name, 45, 104, { align: "center" });

    // Sub-info
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(66, 82, 110);
    pdf.text(reg.designation, 45, 110, { align: "center" });
    pdf.text(`${reg.sector.name}  ·  ${reg.unit.name}`, 45, 116, { align: "center" });
    pdf.setTextColor(107, 119, 140);
    pdf.text(reg.mobile, 45, 122, { align: "center" });

    // Footer ribbon
    pdf.setFillColor(0, 71, 171, 10);
    pdf.rect(5, 128, 80, 9, "F");
    pdf.setFontSize(5.5); pdf.setTextColor(0, 71, 171);
    pdf.text("Present this ticket at the entrance for admission", 45, 133.5, { align: "center" });

    pdf.save(`ticket-${reg.regId}.pdf`);
  };

  const shareTicket = (reg: Registration) => {
    const text = `🎫 *Entry Ticket*\n\n🆔 ${reg.regId}\n👤 ${reg.name}\n📱 ${reg.mobile}\n🏢 ${reg.sector.name} · ${reg.unit.name}\n📋 ${reg.designation}\n\n— SSF Pulikkal Division Registration Portal`;
    if (navigator.share) navigator.share({ title: "Entry Ticket", text });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const registrationClosed = settings.registration_status === "closed";

  const renderTicketCard = (reg: Registration) => (
    <div className="animate-fade-up" style={{
      background: "#FFFFFF",
      border: "1.5px solid var(--border)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "var(--shadow-lg)",
    }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0047AB, #0063E5)", padding: "1.25rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: ".62rem", letterSpacing: ".22em", color: "rgba(255,255,255,.8)", marginBottom: ".2rem" }}><span className="font-ssf">SSF</span> PULIKKAL DIVISION</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}><Ticket size={18} color="#FFFFFF" /> ENTRY TICKET</div>
      </div>

      {/* Tear line */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg-base)", flexShrink: 0, marginLeft: -11 }} />
        <div style={{ flex: 1, borderTop: "2px dashed var(--border)", margin: "0 6px" }} />
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg-base)", flexShrink: 0, marginRight: -11 }} />
      </div>

      {/* QR + details */}
      <div style={{ textAlign: "center", padding: "1.25rem 1.5rem .75rem" }}>
        {qrUrl && (
          <div style={{ display: "inline-block", background: "#fff", border: "6px solid var(--bg-muted)", borderRadius: 14, marginBottom: "1rem", boxShadow: "var(--shadow-sm)" }}>
            <img src={qrUrl} alt="QR Code" style={{ width: 140, height: 140, display: "block", borderRadius: 8 }} />
          </div>
        )}
        <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#AB6400", letterSpacing: ".06em", marginBottom: ".35rem" }}>{reg.regId}</div>
        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)", marginBottom: ".2rem" }}>{reg.name}</div>
        <div style={{ fontSize: ".82rem", color: "var(--text-muted)", marginBottom: ".15rem" }}>{reg.designation}</div>
        <div style={{ fontSize: ".82rem", color: "var(--text-muted)", marginBottom: ".15rem" }}>{reg.sector?.name} · {reg.unit?.name}</div>
        <div style={{ fontSize: ".78rem", color: "var(--text-dim)" }}>{reg.mobile}</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: ".75rem", padding: "1rem 1.25rem 1.25rem" }}>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: ".85rem", gap: ".5rem" }} onClick={() => downloadPDF(reg)}>
          <FileDown size={16} /> Download PDF
        </button>
        <button className="btn btn-outline" style={{ flex: 1, fontSize: ".85rem", gap: ".5rem" }} onClick={() => shareTicket(reg)}>
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );

  return (
    <div className="hero-bg" style={{ minHeight: "100vh" }}>
      {/* Blobs */}
      <div className="hero-blob" style={{ width: 500, height: 500, background: "var(--bg-muted)", top: -200, left: -150 }} />
      <div className="hero-blob" style={{ width: 350, height: 350, background: "var(--bg-subtle)", top: 0, right: -120 }} />
      <div className="hero-blob" style={{ width: 300, height: 300, background: "var(--bg-white)", bottom: -100, left: "45%" }} />


      {/* Hero */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "3.5rem 1.5rem 2rem" }}>
        <div className="animate-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: ".5rem",
          background: settings.registration_status === "open" ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)",
          border: `1px solid ${settings.registration_status === "open" ? "rgba(22,163,74,.25)" : "rgba(220,38,38,.25)"}`,
          borderRadius: 999, padding: ".35rem 1rem", marginBottom: "1.25rem",
          fontSize: ".78rem", fontWeight: 700,
          color: settings.registration_status === "open" ? "#15803d" : "#dc2626",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: settings.registration_status === "open" ? "#16a34a" : "#dc2626", animation: "pulse 2s infinite" }} />
          {settings.registration_status === "open" ? "Registration is Now Open" : "Registration is Closed"}
        </div>
        <h1 className="animate-fade-up" style={{ fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: ".75rem", color: "var(--text)" }}>
          {settings.page_heading || "Smart Registration Portal"}
        </h1>
        <p className="animate-fade-up" style={{ color: "var(--text-dim)", fontSize: "1rem", maxWidth: 480, margin: "0 auto" }}>
          {settings.page_instructions || "Enter your mobile number to register and receive your entry ticket instantly."}
        </p>
      </div>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 520, margin: "0 auto", padding: "0 1rem 4rem" }}>

        {registrationClosed && (
          <div className="card animate-fade-up" style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Lock size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontWeight: 800, color: "var(--primary)", marginBottom: ".5rem" }}>Registration Closed</h2>
            <p style={{ color: "var(--text-muted)", fontSize: ".9rem" }}>Registration is currently closed. Please check back later or contact the organizers.</p>
          </div>
        )}

        {!registrationClosed && (
          <>
            {/* STEP: Mobile */}
            {step === "mobile" && (
              <div className="card animate-fade-up" style={{ padding: "2rem", borderColor: "var(--border)" }}>
                <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                  <div style={{
                    width: 66, height: 66, borderRadius: 20,
                    background: "var(--grad-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem",
                    boxShadow: "var(--shadow-md)",
                  }}><Smartphone size={30} color="#fff" /></div>
                  <h2 style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--text)", marginBottom: ".35rem" }}>Enter Mobile Number</h2>
                  <p style={{ color: "var(--text-dim)", fontSize: ".88rem" }}>We&apos;ll check if you&apos;re already registered</p>
                </div>
                {error && (
                  <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#dc2626", padding: ".75rem 1rem", borderRadius: 10, marginBottom: "1rem", fontSize: ".875rem" }}>
                    ⚠️ {error}
                  </div>
                )}
                <input className="input" type="tel" inputMode="numeric"
                  placeholder="Enter your 10-digit mobile number"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={e => e.key === "Enter" && checkMobile()}
                  style={{ marginBottom: "1.1rem" }}
                />
                <button className="btn btn-primary" style={{ width: "100%", padding: ".9rem", fontSize: ".95rem" }} onClick={checkMobile} disabled={checking}>
                  {checking ? <><span className="spinner" /> Checking...</> : <><span>Continue</span><ArrowRight size={17} /></>}
                </button>
              </div>
            )}

            {/* STEP: Form */}
            {step === "form" && (
              <div className="card animate-fade-up" style={{ padding: "2rem", borderColor: "var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                  <button className="btn btn-ghost" style={{ padding: ".4rem .75rem", fontSize: ".82rem", gap: ".35rem" }} onClick={() => { setStep("mobile"); setError(""); }}><ArrowLeft size={15} /> Back</button>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text)", fontSize: ".92rem" }}>Registration Form</div>
                    <div style={{ fontSize: ".78rem", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: ".3rem" }}><Smartphone size={12} /> {mobile}</div>
                  </div>
                </div>
                {error && (
                  <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#dc2626", padding: ".75rem 1rem", borderRadius: 10, marginBottom: "1rem", fontSize: ".875rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <AlertCircle size={15} /> {error}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label>Full Name</label>
                    <input className="input" placeholder="Enter your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  {settings.show_designation !== "false" && (
                    <div>
                      <label>Designation</label>
                      <select className="input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                        <option value="">Select Designation</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {settings.show_sector !== "false" && (
                    <div>
                      <label>Sector</label>
                      <select className="input" value={form.sectorId} onChange={e => setForm({ ...form, sectorId: e.target.value, unitId: "" })}>
                        <option value="">Select Sector</option>
                        {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {settings.show_unit !== "false" && form.sectorId && (
                    <div>
                      <label>Unit</label>
                      <select className="input" value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })}>
                        <option value="">Select Unit</option>
                        {selectedSectorUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}
                  <button className="btn btn-primary" style={{ padding: ".9rem", marginTop: ".25rem", fontSize: ".95rem" }} onClick={submitForm} disabled={loading}>
                    {loading ? <><span className="spinner" /> Registering...</> : <><BadgeCheck size={18} /> Complete Registration</>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Existing */}
            {step === "existing" && existingReg && (
              <div className="animate-fade-up">
                <div style={{ background: "#FFFBEB", border: "1px solid rgba(217,119,6,.25)", borderRadius: 12, padding: ".875rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
                  <Info size={17} color="#d97706" style={{ flexShrink: 0, marginTop: ".1rem" }} />
                  <p style={{ fontSize: ".88rem", color: "#92400e" }}>This mobile number is already registered. Here is your existing ticket.</p>
                </div>
                {renderTicketCard(existingReg)}
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: "1rem" }} onClick={() => { setStep("mobile"); setMobile(""); setExistingReg(null); }}>
                  Register a different number
                </button>
              </div>
            )}

            {/* STEP: Success */}
            {step === "success" && newReg && (
              <div className="animate-fade-up">
                <div style={{ background: "#F0FDF4", border: "1px solid rgba(22,163,74,.25)", borderRadius: 12, padding: ".875rem 1.1rem", marginBottom: "1.25rem", display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: ".1rem" }} />
                  <div>
                    <p style={{ fontWeight: 800, color: "#15803d" }}>Registration Successful!</p>
                    <p style={{ fontSize: ".82rem", color: "#16a34a" }}>Download or share your ticket below.</p>
                  </div>
                </div>
                {renderTicketCard(newReg)}
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: "1rem" }} onClick={() => { setStep("mobile"); setMobile(""); setNewReg(null); setForm({ name: "", designation: "", sectorId: "", unitId: "" }); }}>
                  Register another number
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "1.5rem 1rem", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,.6)", backdropFilter: "blur(10px)", color: "var(--text-dim)", fontSize: ".78rem" }}>
        <>
          <span className="font-ssf" style={{ fontWeight: 900, fontSize: ".88rem", color: "var(--primary)", letterSpacing: ".04em" }}>SSF</span>
          {" "}Pulikkal Division | Students&apos; Centre, Siyamkandam
        </>
      </footer>
    </div>
  );
}
