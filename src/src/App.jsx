import { useState, useRef, useEffect } from "react";

const C = {
  hero1:"#e8aac8", hero2:"#f7d6e8", accent:"#c47aaa",
  mint:"#98d4c0", amber:"#f7d89a", red:"#f4aaaa",
  bg:"#fef9fc", card:"#ffffff", border:"#f5e4ef",
  text:"#3d2438", muted:"#c096b0",
};

const fmt = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${m}/${day}/${y}`;
};
const currency = (n) => `$${Number(n || 0).toFixed(2)}`;
const uid = () => `${Date.now()}-${Math.random()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const TODAY = todayStr();

const INSURANCE = ["None / Self-Pay","Blue Cross","Aetna","Cigna","United","Medicare","Medicaid","Other"];
const VISIT_TYPES = ["Initial Consultation","Follow-Up","Weigh-In","Injection Visit","Lab Review","Nutrition Counseling","Other"];
const PAYMENT_METHODS = ["Cash","Card","Zelle","CareCredit","Insurance","Other"];
const STATUSES = ["Active","Inactive","On Hold"];
const GENDERS = ["Female","Male","Non-binary","Prefer not to say","Other"];
const APPT_TIMES = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM",
];
const APPT_STATUSES = ["Scheduled","Confirmed","Checked In","Completed","No Show","Cancelled"];
const NEXT_STATUS = { Scheduled:"Confirmed", Confirmed:"Checked In", "Checked In":"Completed" };

const SAMPLE_DATA = [
  {
    id:"p1", firstName:"Maria", lastName:"Lopez", dob:"1985-04-12",
    phone:"713-555-0192", email:"maria@email.com", gender:"Female",
    insurance:"None / Self-Pay", emergencyContact:"Juan Lopez 713-555-0100",
    status:"Active", allergies:"Penicillin, Sulfa drugs",
    startWeight:218, currentWeight:194, goalWeight:160, heightIn:63,
    medications:["Phentermine 15mg","Semaglutide 0.5mg","Vitamin B12 injection"],
    labResults:"Lipid panel 5/1: LDL 142, HDL 48. A1C 5.9.",
    imaging:"Abdominal US 5/1: No abnormalities.",
    appointments:[
      { id:"a1", date:TODAY, time:"10:00 AM", type:"Injection Visit", provider:"Dr. Rios", status:"Confirmed", notes:"Semaglutide refill" },
      { id:"a2", date:"2026-07-15", time:"9:00 AM", type:"Follow-Up", provider:"Dr. Rios", status:"Scheduled", notes:"Monthly check-in" },
    ],
    visits:[
      { id:"v1", date:"2026-05-01", type:"Initial Consultation", provider:"Dr. Rios", bp:"128/82", hr:"78", glucose:"95", weightToday:"218", notes:"Started phentermine 15mg." },
      { id:"v2", date:"2026-06-10", type:"Injection Visit", provider:"Dr. Rios", bp:"122/78", hr:"74", glucose:"90", weightToday:"194", notes:"Semaglutide 0.5mg. Tolerating well." },
    ],
    billing:[
      { id:"b1", date:"2026-05-01", description:"Initial Consult", amount:"150", paid:"150", method:"Card", note:"" },
      { id:"b2", date:"2026-06-10", description:"Semaglutide Injection", amount:"200", paid:"100", method:"Cash", note:"Paying remainder 7/1" },
    ],
    files:[],
  },
  {
    id:"p2", firstName:"Rosa", lastName:"Martinez", dob:"1992-08-20",
    phone:"713-555-0344", email:"rosa@email.com", gender:"Female",
    insurance:"Aetna", emergencyContact:"Carlos Martinez 713-555-0200",
    status:"Active", allergies:"",
    startWeight:195, currentWeight:181, goalWeight:150, heightIn:61,
    medications:["Semaglutide 0.25mg"],
    labResults:"", imaging:"",
    appointments:[
      { id:"a3", date:TODAY, time:"11:30 AM", type:"Weigh-In", provider:"Dr. Rios", status:"Scheduled", notes:"" },
    ],
    visits:[
      { id:"v3", date:"2026-04-15", type:"Initial Consultation", provider:"Dr. Rios", bp:"118/76", hr:"72", glucose:"88", weightToday:"195", notes:"Started program." },
    ],
    billing:[
      { id:"b3", date:"2026-04-15", description:"Initial Consult", amount:"150", paid:"150", method:"Card", note:"" },
    ],
    files:[],
  },
];

// ── Tiny UI atoms ─────────────────────────────────────────
function Lbl({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
      {children}
    </div>
  );
}

function Inp({ value, onChange, type="text", placeholder="" }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.border}`, borderRadius:8,
        fontSize:13, color:C.text, background:"#fff", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}
    />
  );
}

function Txa({ value, onChange, placeholder="", rows=3 }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.border}`, borderRadius:8,
        fontSize:13, color:C.text, background:"#fff", boxSizing:"border-box", fontFamily:"inherit", outline:"none", resize:"vertical" }}
    />
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select
      value={value} onChange={onChange}
      style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.border}`, borderRadius:8,
        fontSize:13, color:C.text, background:"#fff", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}
    >
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Pill({ children, color="rose" }) {
  const map = {
    rose:   { bg:"#fce8f3", fg:"#b0608c" },
    mint:   { bg:"#e0f5ef", fg:"#4a9e89" },
    amber:  { bg:"#fef5dc", fg:"#a07830" },
    red:    { bg:"#fde8e8", fg:"#b05050" },
    gray:   { bg:"#f5eef8", fg:"#7a5a8a" },
    blue:   { bg:"#e8f0fe", fg:"#3b5bdb" },
    purple: { bg:"#f3e8ff", fg:"#7c3aed" },
  };
  const s = map[color] || map.rose;
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:s.bg, color:s.fg }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant="primary", small=false }) {
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.hero1},${C.hero2})`, color:C.text, border:"none" },
    outline:  { background:"rgba(255,255,255,0.9)", color:C.accent, border:`1.5px solid ${C.accent}` },
    ghost:    { background:"#f3e0e9", color:C.accent, border:"none" },
    danger:   { background:"#fee2e2", color:"#b05050", border:"none" },
    mint:     { background:"#d0ede8", color:"#2d6b5e", border:"none" },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...styles[variant], borderRadius:9, padding: small ? "5px 12px" : "9px 18px",
        fontWeight:700, fontSize: small ? 12 : 13, cursor:"pointer", fontFamily:"inherit" }}
    >
      {children}
    </button>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontWeight:800, fontSize:13, color:C.accent, textTransform:"uppercase",
      letterSpacing:"0.07em", marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function Row2({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 16px" }}>{children}</div>;
}

function F({ label, full=false, children }) {
  return (
    <div style={{ gridColumn: full ? "1/-1" : "auto" }}>
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

function Empty({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
      <div style={{ fontSize:36 }}>{icon}</div>
      <div style={{ fontWeight:600, marginTop:8, fontSize:14 }}>{msg}</div>
    </div>
  );
}

function WeightBar({ start, current, goal }) {
  const s = Number(start), c = Number(current), g = Number(goal);
  if (!s || !c || !g || s <= g) return null;
  const pct = Math.min(100, Math.max(0, Math.round(((s - c) / (s - g)) * 100)));
  return (
    <div style={{ marginTop:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:4 }}>
        <span>Progress to goal</span>
        <span style={{ fontWeight:700, color:C.accent }}>{pct}%</span>
      </div>
      <div style={{ height:10, background:C.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${C.mint},${C.hero1})`, borderRadius:99 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginTop:3 }}>
        <span>Start: {s} lbs</span><span>Goal: {g} lbs</span>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────
const bmiCalc = (lbs, ins) => (!lbs || !ins) ? null : ((lbs / (ins * ins)) * 703).toFixed(1);
const bmiLabel = (b) => {
  if (!b) return null;
  if (b < 18.5) return { label:"Underweight", color:"amber" };
  if (b < 25)   return { label:"Normal",      color:"mint"  };
  if (b < 30)   return { label:"Overweight",  color:"amber" };
  return               { label:"Obese",        color:"red"   };
};
const statusColor = (s) => ({ Active:"mint", "On Hold":"amber", Inactive:"gray" }[s] || "gray");
const apptColor   = (s) => ({ Scheduled:"blue", Confirmed:"purple", "Checked In":"mint", Completed:"gray", "No Show":"red", Cancelled:"gray" }[s] || "gray");
const lastVisitDate = (visits) => {
  if (!visits || !visits.length) return null;
  return [...visits].sort((a, b) => b.date.localeCompare(a.date))[0].date;
};
const nextApptOf = (appts) => {
  if (!appts) return null;
  const future = appts.filter(a => a.date >= TODAY && a.status !== "Cancelled" && a.status !== "No Show");
  if (!future.length) return null;
  return [...future].sort((a, b) => a.date.localeCompare(b.date) || APPT_TIMES.indexOf(a.time) - APPT_TIMES.indexOf(b.time))[0];
};
const daysSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30)  return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
};
const totals = (billing = []) => {
  const charged = billing.reduce((s, b) => s + Number(b.amount || 0), 0);
  const paid    = billing.reduce((s, b) => s + Number(b.paid   || 0), 0);
  return { charged, paid, owed: charged - paid };
};
const weightLost = (p) => {
  const sw = Number(p.startWeight || 0), cw = Number(p.currentWeight || 0);
  return (sw && cw) ? (sw - cw).toFixed(1) : null;
};

const emptyPatient = () => ({
  id:uid(), firstName:"", lastName:"", dob:"", phone:"", email:"",
  gender:"", status:"Active", insurance:"", emergencyContact:"", allergies:"",
  startWeight:"", currentWeight:"", goalWeight:"", heightIn:"",
  medications:[], labResults:"", imaging:"",
  appointments:[], visits:[], billing:[], files:[],
});
const emptyAppt  = () => ({ id:uid(), date:TODAY, time:"", type:"", provider:"", status:"Scheduled", notes:"" });
const emptyVisit = () => ({ id:uid(), date:"", type:"", provider:"", bp:"", hr:"", glucose:"", weightToday:"", notes:"" });
const emptyBill  = () => ({ id:uid(), date:"", description:"", amount:"", paid:"", method:"", note:"" });

// ══════════════════════════════════════════════════════════
export default function App() {
  const [patients, setPatients] = useState(() => {
    try {
      const s = localStorage.getItem("sulem_clinic_patients");
      return s ? JSON.parse(s) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA; }
  });

  useEffect(() => {
    try { localStorage.setItem("sulem_clinic_patients", JSON.stringify(patients)); } catch {}
  }, [patients]);

  const [page,        setPage]        = useState("today");   // today | roster | chart | addPt
  const [activeId,    setActiveId]    = useState(null);
  const [tab,         setTab]         = useState("appts");   // appts | overview | visits | billing | files
  const [search,      setSearch]      = useState("");
  const [stFilter,    setStFilter]    = useState("All");
  const [ptForm,      setPtForm]      = useState(null);
  const [apptForm,    setApptForm]    = useState(null);      // used in chart appts tab
  const [visitForm,   setVisitForm]   = useState(null);
  const [billForm,    setBillForm]    = useState(null);
  const [editApptId,  setEditApptId]  = useState(null);
  const [editVisitId, setEditVisitId] = useState(null);
  const [editBillId,  setEditBillId]  = useState(null);
  const [quickAppt,   setQuickAppt]   = useState(null);      // global new-appt modal
  const [quickPtId,   setQuickPtId]   = useState("");
  const fileRef = useRef();

  const active   = patients.find(p => p.id === activeId);
  const upActive = fn => setPatients(ps => ps.map(p => p.id === activeId ? fn(p) : p));

  const todayAppts = patients
    .flatMap(p => (p.appointments || []).filter(a => a.date === TODAY).map(a => ({ ...a, patient:p })))
    .sort((a, b) => APPT_TIMES.indexOf(a.time) - APPT_TIMES.indexOf(b.time));

  const filtered = patients.filter(p => {
    const q  = search.toLowerCase();
    const mq = [p.firstName, p.lastName, p.phone, p.email].join(" ").toLowerCase().includes(q);
    const ms = stFilter === "All" || p.status === stFilter;
    return mq && ms;
  });

  const openChart = (p) => { setActiveId(p.id); setTab("appts"); setPage("chart"); };
  const goRoster  = ()  => { setPage("roster"); setPtForm(null); setApptForm(null); setVisitForm(null); setBillForm(null); };

  // ── saves ─────────────────────────────────────────────
  const savePt = () => {
    if (!ptForm.firstName || !ptForm.lastName) return alert("First and last name required.");
    if (patients.find(p => p.id === ptForm.id)) {
      setPatients(ps => ps.map(p => p.id === ptForm.id ? { ...ptForm } : p));
    } else {
      setPatients(ps => [{ ...ptForm, id:uid() }, ...ps]);
    }
    goRoster();
  };

  const saveAppt = () => {
    if (!apptForm.date || !apptForm.time) return alert("Date and time required.");
    if (editApptId) {
      upActive(p => ({ ...p, appointments: p.appointments.map(a => a.id === editApptId ? { ...apptForm } : a) }));
    } else {
      upActive(p => ({ ...p, appointments: [{ ...apptForm, id:uid() }, ...p.appointments] }));
    }
    setApptForm(null); setEditApptId(null);
  };

  const saveQuickAppt = () => {
    if (!quickPtId)              return alert("Please select a patient.");
    if (!quickAppt.date || !quickAppt.time) return alert("Date and time required.");
    setPatients(ps => ps.map(p => {
      if (String(p.id) !== String(quickPtId)) return p;
      return { ...p, appointments: [{ ...quickAppt, id:uid() }, ...p.appointments] };
    }));
    setQuickAppt(null); setQuickPtId("");
  };

  const setApptStatus = (patientId, apptId, newStatus) => {
    setPatients(ps => ps.map(p => {
      if (p.id !== patientId) return p;
      return { ...p, appointments: p.appointments.map(a => a.id === apptId ? { ...a, status:newStatus } : a) };
    }));
  };

  const saveVisit = () => {
    if (!visitForm.date) return alert("Date required.");
    if (editVisitId) {
      upActive(p => ({ ...p, visits: p.visits.map(v => v.id === editVisitId ? { ...visitForm } : v) }));
    } else {
      upActive(p => ({ ...p, visits: [{ ...visitForm, id:uid() }, ...p.visits] }));
    }
    setVisitForm(null); setEditVisitId(null);
  };

  const saveBill = () => {
    if (!billForm.description || !billForm.amount) return alert("Description and amount required.");
    if (editBillId) {
      upActive(p => ({ ...p, billing: p.billing.map(b => b.id === editBillId ? { ...billForm } : b) }));
    } else {
      upActive(p => ({ ...p, billing: [{ ...billForm, id:uid() }, ...p.billing] }));
    }
    setBillForm(null); setEditBillId(null);
  };

  const handleFiles = (e) => {
    [...e.target.files].forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => {
        const obj = { id:uid(), name:f.name, type:f.type, dataUrl:ev.target.result, uploadedAt:new Date().toLocaleDateString() };
        upActive(p => ({ ...p, files: [...p.files, obj] }));
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const hGrad = "linear-gradient(135deg,#e8aac8 0%,#d4a8e0 50%,#f7d6e8 100%)";

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:C.bg, minHeight:"100vh", paddingBottom:60 }}>

      {/* ── HEADER ── */}
      <div style={{ background:hGrad, padding:"18px 20px 16px", color:C.text, boxShadow:"0 2px 16px rgba(220,170,210,0.3)" }}>
        <div style={{ maxWidth:780, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", opacity:0.7 }}>Sulem Ageless Slimming</div>
            <div style={{ fontSize:20, fontWeight:800 }}>
              {page === "today"   && "Today's Schedule"}
              {page === "roster"  && "Patient Roster"}
              {page === "addPt"   && (ptForm && patients.find(p => p.id === ptForm.id) ? "Edit Patient" : "Add Patient")}
              {page === "chart"   && active && `${active.firstName} ${active.lastName}`}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {page === "today"  && (
              <Btn onClick={() => { setQuickAppt(emptyAppt()); setQuickPtId(""); }}>+ New Appt</Btn>
            )}
            {page === "roster" && (
              <Btn onClick={() => { setPtForm(emptyPatient()); setPage("addPt"); }}>+ Add Patient</Btn>
            )}
            {(page === "chart" || page === "addPt") && (
              <Btn variant="outline" onClick={goRoster}>Back to Roster</Btn>
            )}
          </div>
        </div>
      </div>

      {/* ── TOP NAV TABS ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:780, margin:"0 auto", display:"flex" }}>
          {[["today","📅 Today"], ["roster","👥 Roster"]].map(([v, label]) => (
            <button key={v} onClick={() => setPage(v)}
              style={{ flex:1, padding:"12px 8px", border:"none", fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"inherit", background:"transparent",
                color: page === v ? C.accent : C.muted,
                borderBottom: page === v ? `3px solid ${C.accent}` : "3px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"0 16px" }}>

        {/* ══ TODAY ══ */}
        {page === "today" && (
          <div style={{ marginTop:20 }}>
            <div style={{ background:C.card, borderRadius:14, padding:"14px 18px",
              boxShadow:"0 1px 6px rgba(194,24,91,0.08)", marginBottom:16,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase" }}>Today</div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text }}>
                  {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>Appointments</div>
                <div style={{ fontSize:28, fontWeight:800, color:C.hero1 }}>{todayAppts.length}</div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
              {[
                ["Upcoming", todayAppts.filter(a => a.status === "Scheduled" || a.status === "Confirmed").length, "#e8f0fe", "#3b5bdb"],
                ["Checked In", todayAppts.filter(a => a.status === "Checked In").length, "#e0f5ef", "#4a9e89"],
                ["Completed", todayAppts.filter(a => a.status === "Completed").length, "#f5eef8", "#7a5a8a"],
              ].map(([label, val, bg, fg]) => (
                <div key={label} style={{ background:bg, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:fg }}>{val}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:fg, marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>

            {todayAppts.length === 0 && <Empty icon="🌸" msg="No appointments scheduled for today" />}

            {todayAppts.map(a => {
              const p  = a.patient;
              const ns = NEXT_STATUS[a.status];
              return (
                <div key={a.id} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:10,
                  boxShadow:"0 1px 6px rgba(194,24,91,0.07)",
                  borderLeft:`4px solid ${a.status === "Completed" ? C.mint : a.status === "No Show" ? C.red : C.hero1}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                        <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{a.time}</span>
                        <Pill color={apptColor(a.status)}>{a.status}</Pill>
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:2 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize:12, color:C.muted }}>
                        {a.type}{a.provider && ` · ${a.provider}`}{p.phone && ` · 📞 ${p.phone}`}
                      </div>
                      {p.allergies && (
                        <div style={{ fontSize:11, color:"#b05050", fontWeight:700, marginTop:4 }}>⚠️ Allergies: {p.allergies}</div>
                      )}
                      {a.notes && <div style={{ fontSize:12, color:C.muted, marginTop:4, fontStyle:"italic" }}>Note: {a.notes}</div>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5, marginLeft:10, flexShrink:0 }}>
                      <Btn small variant="ghost" onClick={() => openChart(p)}>Chart</Btn>
                      {ns && (
                        <Btn small variant="mint" onClick={() => setApptStatus(p.id, a.id, ns)}>
                          {ns === "Confirmed" ? "Confirm" : ns === "Checked In" ? "Check In" : "Complete"}
                        </Btn>
                      )}
                      {a.status !== "No Show" && a.status !== "Completed" && a.status !== "Cancelled" && (
                        <Btn small variant="danger" onClick={() => setApptStatus(p.id, a.id, "No Show")}>No Show</Btn>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ROSTER ══ */}
        {page === "roster" && (
          <div style={{ marginTop:20 }}>
            <input
              placeholder="Search by name, phone, or email..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:10,
                fontSize:13, background:"#fff", boxSizing:"border-box", fontFamily:"inherit", outline:"none", marginBottom:10 }}
            />
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {["All","Active","On Hold","Inactive"].map(s => (
                <button key={s} onClick={() => setStFilter(s)}
                  style={{ padding:"4px 14px", borderRadius:99, border:"none", cursor:"pointer",
                    fontWeight:700, fontSize:12, fontFamily:"inherit",
                    background: stFilter === s ? C.accent : "#f5e4ef",
                    color:      stFilter === s ? "#fff"   : C.muted }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
              {[
                ["Patients",       patients.length,                                                                   "rose"],
                ["Total Charged",  currency(patients.reduce((s, p) => s + totals(p.billing).charged, 0)),             "rose"],
                ["Total Owed",     currency(patients.reduce((s, p) => s + totals(p.billing).owed,    0)),             "amber"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background:C.card, borderRadius:12, padding:"14px 16px",
                  boxShadow:"0 1px 4px rgba(194,24,91,0.08)",
                  borderTop:`3px solid ${color === "amber" ? C.amber : C.hero1}` }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:C.text, marginTop:2 }}>{val}</div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && <Empty icon="🌸" msg="No patients found" />}

            {filtered.map(p => {
              const t    = totals(p.billing);
              const lost = weightLost(p);
              const lv   = lastVisitDate(p.visits);
              const na   = nextApptOf(p.appointments);
              return (
                <div key={p.id} onClick={() => openChart(p)}
                  style={{ background:C.card, borderRadius:14, padding:"16px", marginBottom:10,
                    boxShadow:"0 1px 6px rgba(194,24,91,0.07)", cursor:"pointer",
                    borderLeft:`4px solid ${p.status === "Inactive" ? C.muted : p.status === "On Hold" ? C.amber : C.hero1}`,
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{p.firstName} {p.lastName}</span>
                      {p.status && <Pill color={statusColor(p.status)}>{p.status}</Pill>}
                    </div>
                    <div style={{ fontSize:12, color:C.muted, margin:"3px 0" }}>
                      {p.phone && <span>📞 {p.phone}</span>}
                      {lv      && <span style={{ marginLeft:10 }}>🕐 Last seen: {daysSince(lv)}</span>}
                    </div>
                    {na && (
                      <div style={{ fontSize:12, color:C.accent, fontWeight:700, marginBottom:4 }}>
                        📅 Next: {na.date === TODAY ? "Today" : fmt(na.date)} at {na.time}
                      </div>
                    )}
                    {p.allergies && (
                      <div style={{ fontSize:11, color:"#b05050", fontWeight:700, marginBottom:4 }}>⚠️ {p.allergies}</div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                      {lost && Number(lost) > 0 && <Pill color="mint">↓ {lost} lbs lost</Pill>}
                      {t.owed > 0               && <Pill color="amber">Owes {currency(t.owed)}</Pill>}
                      {t.owed === 0 && t.charged > 0 && <Pill color="mint">✓ Paid in full</Pill>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                    <div style={{ fontSize:11, color:C.muted }}>Visits</div>
                    <div style={{ fontSize:22, fontWeight:800, color:C.hero1 }}>{p.visits.length}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ADD / EDIT PATIENT ══ */}
        {page === "addPt" && ptForm && (
          <div style={{ marginTop:20 }}>
            <div style={{ background:C.card, borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(194,24,91,0.08)" }}>
              <SectionHead>Personal Info</SectionHead>
              <Row2>
                <F label="First Name *"><Inp value={ptForm.firstName} onChange={e => setPtForm(f => ({ ...f, firstName:e.target.value }))} /></F>
                <F label="Last Name *"><Inp value={ptForm.lastName}  onChange={e => setPtForm(f => ({ ...f, lastName:e.target.value }))} /></F>
                <F label="Date of Birth"><Inp type="date" value={ptForm.dob} onChange={e => setPtForm(f => ({ ...f, dob:e.target.value }))} /></F>
                <F label="Gender"><Sel value={ptForm.gender} onChange={e => setPtForm(f => ({ ...f, gender:e.target.value }))} options={GENDERS} /></F>
                <F label="Phone"><Inp value={ptForm.phone} onChange={e => setPtForm(f => ({ ...f, phone:e.target.value }))} /></F>
                <F label="Email"><Inp value={ptForm.email} onChange={e => setPtForm(f => ({ ...f, email:e.target.value }))} /></F>
                <F label="Insurance"><Sel value={ptForm.insurance} onChange={e => setPtForm(f => ({ ...f, insurance:e.target.value }))} options={INSURANCE} /></F>
                <F label="Status"><Sel value={ptForm.status} onChange={e => setPtForm(f => ({ ...f, status:e.target.value }))} options={STATUSES} /></F>
                <F label="Emergency Contact" full><Inp value={ptForm.emergencyContact} placeholder="Name & phone" onChange={e => setPtForm(f => ({ ...f, emergencyContact:e.target.value }))} /></F>
              </Row2>

              <div style={{ marginTop:14, background:"#fff5f5", border:"1.5px solid #fcd0d0", borderRadius:10, padding:"12px 14px" }}>
                <Lbl>⚠️ Allergies / Contraindications</Lbl>
                <Inp value={ptForm.allergies} placeholder="e.g. Penicillin — leave blank if none" onChange={e => setPtForm(f => ({ ...f, allergies:e.target.value }))} />
              </div>

              <SectionHead>Weight & Goals</SectionHead>
              <Row2>
                <F label="Height (inches)"><Inp type="number" value={ptForm.heightIn}     onChange={e => setPtForm(f => ({ ...f, heightIn:e.target.value }))} /></F>
                <F label="Starting Weight (lbs)"><Inp type="number" value={ptForm.startWeight}  onChange={e => setPtForm(f => ({ ...f, startWeight:e.target.value }))} /></F>
                <F label="Current Weight (lbs)"><Inp type="number" value={ptForm.currentWeight} onChange={e => setPtForm(f => ({ ...f, currentWeight:e.target.value }))} /></F>
                <F label="Goal Weight (lbs)"><Inp type="number" value={ptForm.goalWeight}   onChange={e => setPtForm(f => ({ ...f, goalWeight:e.target.value }))} /></F>
              </Row2>

              <SectionHead>Medical Info</SectionHead>
              <Row2>
                <F label="Medications (one per line)" full>
                  <Txa value={(ptForm.medications || []).join("\n")} placeholder="e.g. Phentermine 15mg"
                    onChange={e => setPtForm(f => ({ ...f, medications:e.target.value.split("\n") }))} />
                </F>
                <F label="Lab Results" full><Txa value={ptForm.labResults} onChange={e => setPtForm(f => ({ ...f, labResults:e.target.value }))} /></F>
                <F label="Imaging Notes" full><Txa value={ptForm.imaging} onChange={e => setPtForm(f => ({ ...f, imaging:e.target.value }))} /></F>
              </Row2>

              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <Btn onClick={savePt}>Save Patient</Btn>
                <Btn variant="ghost" onClick={goRoster}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══ CHART ══ */}
        {page === "chart" && active && (() => {
          const t    = totals(active.billing);
          const lost = weightLost(active);
          const b    = bmiCalc(active.currentWeight, active.heightIn);
          const bl   = bmiLabel(b);
          const lv   = lastVisitDate(active.visits);
          const na   = nextApptOf(active.appointments);

          return (
            <div style={{ marginTop:18 }}>
              {/* Patient card */}
              <div style={{ background:C.card, borderRadius:16, padding:18, boxShadow:"0 1px 8px rgba(194,24,91,0.08)", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase" }}>Patient</div>
                    <div style={{ fontSize:20, fontWeight:800, color:C.text }}>{active.firstName} {active.lastName}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                      {active.gender    && <span>{active.gender} &nbsp;·&nbsp; </span>}
                      {active.dob       && <span>DOB: {fmt(active.dob)} &nbsp;·&nbsp; </span>}
                      {active.phone     && <span>{active.phone}</span>}
                    </div>
                    {active.allergies && (
                      <div style={{ marginTop:8, background:"#fff0f0", border:"1px solid #fcd0d0",
                        borderRadius:8, padding:"6px 10px", fontSize:12, color:"#b05050", fontWeight:700 }}>
                        ⚠️ ALLERGIES: {active.allergies}
                      </div>
                    )}
                    <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                      {active.status                && <Pill color={statusColor(active.status)}>{active.status}</Pill>}
                      {lost && Number(lost) > 0     && <Pill color="mint">↓ {lost} lbs lost</Pill>}
                      {bl                           && <Pill color={bl.color}>BMI {b} · {bl.label}</Pill>}
                      {t.owed > 0                   && <Pill color="amber">Owes {currency(t.owed)}</Pill>}
                      {t.owed === 0 && t.charged > 0 && <Pill color="mint">✓ Paid in full</Pill>}
                    </div>
                    <div style={{ marginTop:8, display:"flex", gap:16, fontSize:12, flexWrap:"wrap" }}>
                      {na && <span style={{ color:C.accent, fontWeight:700 }}>📅 Next: {na.date === TODAY ? "Today" : fmt(na.date)} at {na.time}</span>}
                      {lv && <span style={{ color:C.muted }}>🕐 Last seen: {daysSince(lv)}</span>}
                    </div>
                    <WeightBar start={active.startWeight} current={active.currentWeight} goal={active.goalWeight} />
                  </div>
                  <Btn small variant="ghost" onClick={() => { setPtForm({ ...active }); setPage("addPt"); }}>Edit</Btn>
                </div>
              </div>

              {/* Chart tabs */}
              <div style={{ display:"flex", gap:4, marginBottom:16, background:"#f3e0e9", borderRadius:12, padding:4 }}>
                {[["appts","📅 Appts"],["overview","📋 Overview"],["visits","🩺 Visits"],["billing","💳 Billing"],["files","📎 Files"]].map(([v, label]) => (
                  <button key={v} onClick={() => setTab(v)}
                    style={{ flex:1, padding:"8px 4px", border:"none", borderRadius:9, fontWeight:700, fontSize:11,
                      cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
                      background: tab === v ? "#fff" : "transparent",
                      color:      tab === v ? C.accent : C.muted,
                      boxShadow:  tab === v ? "0 1px 4px rgba(194,24,91,0.12)" : "none" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── APPTS TAB ── */}
              {tab === "appts" && (
                <div>
                  {apptForm ? (
                    <div style={{ background:C.card, borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(194,24,91,0.08)" }}>
                      <div style={{ fontWeight:800, fontSize:15, marginBottom:16, color:C.text }}>
                        {editApptId ? "Edit Appointment" : "Schedule Appointment"}
                      </div>
                      <Row2>
                        <F label="Date *"><Inp type="date" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date:e.target.value }))} /></F>
                        <F label="Time *"><Sel value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time:e.target.value }))} options={APPT_TIMES} /></F>
                        <F label="Visit Type"><Sel value={apptForm.type} onChange={e => setApptForm(f => ({ ...f, type:e.target.value }))} options={VISIT_TYPES} /></F>
                        <F label="Provider"><Inp value={apptForm.provider} onChange={e => setApptForm(f => ({ ...f, provider:e.target.value }))} /></F>
                        <F label="Status"><Sel value={apptForm.status} onChange={e => setApptForm(f => ({ ...f, status:e.target.value }))} options={APPT_STATUSES} /></F>
                        <F label="Notes" full><Inp value={apptForm.notes} placeholder="Optional..." onChange={e => setApptForm(f => ({ ...f, notes:e.target.value }))} /></F>
                      </Row2>
                      <div style={{ display:"flex", gap:10, marginTop:16 }}>
                        <Btn onClick={saveAppt}>Save Appointment</Btn>
                        <Btn variant="ghost" onClick={() => { setApptForm(null); setEditApptId(null); }}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                        <Btn onClick={() => { setApptForm(emptyAppt()); setEditApptId(null); }}>+ Schedule Appointment</Btn>
                      </div>
                      {(active.appointments || []).length === 0 && <Empty icon="📅" msg="No appointments scheduled" />}
                      {[...(active.appointments || [])]
                        .sort((a, b) => a.date.localeCompare(b.date) || APPT_TIMES.indexOf(a.time) - APPT_TIMES.indexOf(b.time))
                        .map(a => {
                          const ns = NEXT_STATUS[a.status];
                          return (
                            <div key={a.id} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:10,
                              boxShadow:"0 1px 4px rgba(194,24,91,0.07)",
                              borderLeft:`4px solid ${a.date === TODAY ? C.accent : a.date < TODAY ? "#e5e7eb" : C.hero2}` }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div>
                                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
                                    <span style={{ fontWeight:800, fontSize:14, color:C.text }}>
                                      {a.date === TODAY ? "Today" : fmt(a.date)} at {a.time}
                                    </span>
                                    <Pill color={apptColor(a.status)}>{a.status}</Pill>
                                    {a.date === TODAY && <Pill color="rose">Today</Pill>}
                                  </div>
                                  <div style={{ fontSize:12, color:C.muted }}>{a.type}{a.provider && ` · ${a.provider}`}</div>
                                  {a.notes && <div style={{ fontSize:12, color:C.muted, marginTop:4, fontStyle:"italic" }}>Note: {a.notes}</div>}
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", gap:5, marginLeft:10, flexShrink:0 }}>
                                  <Btn small variant="ghost" onClick={() => { setApptForm({ ...a }); setEditApptId(a.id); }}>Edit</Btn>
                                  {ns && (
                                    <Btn small variant="mint" onClick={() => setApptStatus(activeId, a.id, ns)}>
                                      {ns === "Confirmed" ? "Confirm" : ns === "Checked In" ? "Check In" : "Complete"}
                                    </Btn>
                                  )}
                                  {a.status !== "No Show" && a.status !== "Completed" && a.status !== "Cancelled" && (
                                    <Btn small variant="danger" onClick={() => setApptStatus(activeId, a.id, "No Show")}>No Show</Btn>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* ── OVERVIEW TAB ── */}
              {tab === "overview" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[
                    ["Starting Weight", active.startWeight  ? `${active.startWeight} lbs`  : "—"],
                    ["Current Weight",  active.currentWeight ? `${active.currentWeight} lbs` : "—"],
                    ["Goal Weight",     active.goalWeight    ? `${active.goalWeight} lbs`    : "—"],
                    ["Height",          active.heightIn      ? `${Math.floor(active.heightIn/12)}ft ${active.heightIn%12}in` : "—"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background:C.card, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{k}</div>
                      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ gridColumn:"1/-1", background:C.card, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8 }}>MEDICATIONS</div>
                    {(active.medications || []).filter(Boolean).length === 0
                      ? <span style={{ fontSize:13, color:C.muted }}>None recorded</span>
                      : (active.medications || []).filter(Boolean).map((m, i) => (
                          <div key={i} style={{ fontSize:13, color:C.text, padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>{m}</div>
                        ))}
                  </div>
                  {active.labResults && (
                    <div style={{ gridColumn:"1/-1", background:C.card, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6 }}>LAB RESULTS</div>
                      <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap" }}>{active.labResults}</div>
                    </div>
                  )}
                  {active.imaging && (
                    <div style={{ gridColumn:"1/-1", background:C.card, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6 }}>IMAGING</div>
                      <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap" }}>{active.imaging}</div>
                    </div>
                  )}
                  {active.emergencyContact && (
                    <div style={{ gridColumn:"1/-1", background:C.card, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                      <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:4 }}>EMERGENCY CONTACT</div>
                      <div style={{ fontSize:13, color:C.text }}>{active.emergencyContact}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── VISITS TAB ── */}
              {tab === "visits" && (
                <div>
                  {visitForm ? (
                    <div style={{ background:C.card, borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(194,24,91,0.08)" }}>
                      <div style={{ fontWeight:800, fontSize:15, marginBottom:16, color:C.text }}>
                        {editVisitId ? "Edit Visit" : "Log New Visit"}
                      </div>
                      <Row2>
                        <F label="Date *"><Inp type="date" value={visitForm.date} onChange={e => setVisitForm(f => ({ ...f, date:e.target.value }))} /></F>
                        <F label="Visit Type"><Sel value={visitForm.type} onChange={e => setVisitForm(f => ({ ...f, type:e.target.value }))} options={VISIT_TYPES} /></F>
                        <F label="Provider"><Inp value={visitForm.provider} onChange={e => setVisitForm(f => ({ ...f, provider:e.target.value }))} /></F>
                        <F label="Weight Today (lbs)"><Inp type="number" value={visitForm.weightToday} onChange={e => setVisitForm(f => ({ ...f, weightToday:e.target.value }))} /></F>
                        <F label="Blood Pressure"><Inp value={visitForm.bp} placeholder="120/80" onChange={e => setVisitForm(f => ({ ...f, bp:e.target.value }))} /></F>
                        <F label="Heart Rate (bpm)"><Inp type="number" value={visitForm.hr} onChange={e => setVisitForm(f => ({ ...f, hr:e.target.value }))} /></F>
                        <F label="Glucose (mg/dL)"><Inp type="number" value={visitForm.glucose} onChange={e => setVisitForm(f => ({ ...f, glucose:e.target.value }))} /></F>
                        <F label="Notes" full><Txa value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes:e.target.value }))} /></F>
                      </Row2>
                      <div style={{ display:"flex", gap:10, marginTop:16 }}>
                        <Btn onClick={saveVisit}>Save Visit</Btn>
                        <Btn variant="ghost" onClick={() => { setVisitForm(null); setEditVisitId(null); }}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                        <Btn onClick={() => { setVisitForm(emptyVisit()); setEditVisitId(null); }}>+ Log Visit</Btn>
                      </div>
                      {active.visits.length === 0 && <Empty icon="🩺" msg="No visits logged yet" />}
                      {active.visits.map(v => (
                        <div key={v.id} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:10,
                          boxShadow:"0 1px 4px rgba(194,24,91,0.07)", borderLeft:`4px solid ${C.hero2}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div>
                              <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{v.type || "Visit"} · {fmt(v.date)}</div>
                              {v.provider && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Provider: {v.provider}</div>}
                              <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap", fontSize:12 }}>
                                {v.weightToday && <span>⚖️ {v.weightToday} lbs</span>}
                                {v.bp          && <span>❤️ BP {v.bp}</span>}
                                {v.hr          && <span>💓 {v.hr} bpm</span>}
                                {v.glucose     && <span>🩸 {v.glucose} mg/dL</span>}
                              </div>
                              {v.notes && <div style={{ fontSize:12, color:C.muted, marginTop:6, fontStyle:"italic" }}>"{v.notes}"</div>}
                            </div>
                            <Btn small variant="ghost" onClick={() => { setVisitForm({ ...v }); setEditVisitId(v.id); }}>Edit</Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── BILLING TAB ── */}
              {tab === "billing" && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                    {[
                      ["Total Charged", currency(t.charged), C.hero1],
                      ["Total Paid",    currency(t.paid),    C.mint ],
                      ["Balance Owed",  currency(t.owed),    t.owed > 0 ? C.amber : C.mint],
                    ].map(([k, v, bc]) => (
                      <div key={k} style={{ background:C.card, borderRadius:12, padding:"12px 14px",
                        boxShadow:"0 1px 4px rgba(194,24,91,0.07)", borderTop:`3px solid ${bc}` }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{k}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:C.text, marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {billForm ? (
                    <div style={{ background:C.card, borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(194,24,91,0.08)" }}>
                      <div style={{ fontWeight:800, fontSize:15, marginBottom:16, color:C.text }}>
                        {editBillId ? "Edit Charge" : "Add Charge"}
                      </div>
                      <Row2>
                        <F label="Date"><Inp type="date" value={billForm.date} onChange={e => setBillForm(f => ({ ...f, date:e.target.value }))} /></F>
                        <F label="Description *"><Inp value={billForm.description} onChange={e => setBillForm(f => ({ ...f, description:e.target.value }))} /></F>
                        <F label="Amount Charged ($) *"><Inp type="number" value={billForm.amount} onChange={e => setBillForm(f => ({ ...f, amount:e.target.value }))} /></F>
                        <F label="Amount Paid ($)"><Inp type="number" value={billForm.paid} onChange={e => setBillForm(f => ({ ...f, paid:e.target.value }))} /></F>
                        <F label="Payment Method"><Sel value={billForm.method} onChange={e => setBillForm(f => ({ ...f, method:e.target.value }))} options={PAYMENT_METHODS} /></F>
                        <F label="Payment Note" full><Inp value={billForm.note} placeholder="e.g. Payment plan, insurance pending..." onChange={e => setBillForm(f => ({ ...f, note:e.target.value }))} /></F>
                      </Row2>
                      <div style={{ display:"flex", gap:10, marginTop:16 }}>
                        <Btn onClick={saveBill}>Save</Btn>
                        <Btn variant="ghost" onClick={() => { setBillForm(null); setEditBillId(null); }}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                        <Btn onClick={() => { setBillForm(emptyBill()); setEditBillId(null); }}>+ Add Charge</Btn>
                      </div>
                      {active.billing.length === 0 && <Empty icon="💳" msg="No charges yet" />}
                      {active.billing.map(bi => {
                        const owed = Number(bi.amount || 0) - Number(bi.paid || 0);
                        return (
                          <div key={bi.id} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:10,
                            boxShadow:"0 1px 4px rgba(194,24,91,0.07)",
                            borderLeft:`4px solid ${owed > 0 ? C.amber : C.mint}` }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{bi.description}</div>
                                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{fmt(bi.date)}{bi.method && ` · ${bi.method}`}</div>
                                <div style={{ fontSize:12, marginTop:6, display:"flex", gap:10 }}>
                                  <span>Charged: <b>{currency(bi.amount)}</b></span>
                                  <span style={{ color:"#4a9e89" }}>Paid: <b>{currency(bi.paid)}</b></span>
                                  {owed > 0 && <span style={{ color:"#a07830" }}>Owes: <b>{currency(owed)}</b></span>}
                                </div>
                                {bi.note && <div style={{ fontSize:11, color:C.muted, marginTop:4, fontStyle:"italic" }}>Note: {bi.note}</div>}
                              </div>
                              <Btn small variant="ghost" onClick={() => { setBillForm({ ...bi }); setEditBillId(bi.id); }}>Edit</Btn>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── FILES TAB ── */}
              {tab === "files" && (
                <div>
                  <input type="file" ref={fileRef} multiple accept="image/*,.pdf" style={{ display:"none" }} onChange={handleFiles} />
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                    <Btn onClick={() => fileRef.current.click()}>Upload File</Btn>
                  </div>
                  <div onClick={() => fileRef.current.click()}
                    style={{ border:`2px dashed ${C.border}`, borderRadius:14, padding:32,
                      textAlign:"center", cursor:"pointer", marginBottom:16, background:"#fff9fc" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>☁️</div>
                    <div style={{ fontWeight:700, color:C.muted, fontSize:14 }}>Tap to upload images or PDFs</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Lab results, insurance cards, consent forms...</div>
                  </div>
                  {active.files.length === 0 && <Empty icon="📄" msg="No files uploaded yet" />}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {active.files.map(fi => (
                      <div key={fi.id} style={{ background:C.card, borderRadius:12, padding:12, boxShadow:"0 1px 4px rgba(194,24,91,0.07)" }}>
                        {fi.type.startsWith("image/")
                          ? <img src={fi.dataUrl} alt={fi.name} style={{ width:"100%", height:120, objectFit:"cover", borderRadius:8, marginBottom:8 }} />
                          : <div style={{ height:80, background:"#fce4ec", borderRadius:8, marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>📄</div>
                        }
                        <div style={{ fontSize:12, fontWeight:700, color:C.text, wordBreak:"break-word" }}>{fi.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{fi.uploadedAt}</div>
                        <div style={{ display:"flex", gap:6, marginTop:8 }}>
                          <a href={fi.dataUrl} download={fi.name}
                            style={{ fontSize:11, fontWeight:700, color:C.accent, textDecoration:"none", background:"#fce4ec", padding:"3px 10px", borderRadius:6 }}>
                            Download
                          </a>
                          <button onClick={() => upActive(p => ({ ...p, files: p.files.filter(x => x.id !== fi.id) }))}
                            style={{ fontSize:11, fontWeight:700, color:"#b05050", background:"#fee2e2",
                              border:"none", padding:"3px 10px", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ══ QUICK APPT MODAL ══ */}
      {quickAppt && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0,
          background:"rgba(61,36,56,0.4)", zIndex:100,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:24, width:"100%", maxWidth:460,
            boxShadow:"0 8px 32px rgba(194,24,91,0.2)" }}>
            <div style={{ fontWeight:800, fontSize:17, color:C.text, marginBottom:4 }}>Schedule Appointment</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Pick a patient and fill in the details</div>
            <div style={{ marginBottom:12 }}>
              <Lbl>Patient *</Lbl>
              <select
                value={quickPtId}
                onChange={e => setQuickPtId(e.target.value)}
                style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${C.border}`, borderRadius:8,
                  fontSize:13, color:C.text, background:"#fff", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}>
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <Row2>
              <F label="Date *"><Inp type="date" value={quickAppt.date} onChange={e => setQuickAppt(f => ({ ...f, date:e.target.value }))} /></F>
              <F label="Time *"><Sel value={quickAppt.time} onChange={e => setQuickAppt(f => ({ ...f, time:e.target.value }))} options={APPT_TIMES} /></F>
              <F label="Visit Type"><Sel value={quickAppt.type} onChange={e => setQuickAppt(f => ({ ...f, type:e.target.value }))} options={VISIT_TYPES} /></F>
              <F label="Provider"><Inp value={quickAppt.provider} onChange={e => setQuickAppt(f => ({ ...f, provider:e.target.value }))} /></F>
              <F label="Notes" full><Inp value={quickAppt.notes} placeholder="Optional notes..." onChange={e => setQuickAppt(f => ({ ...f, notes:e.target.value }))} /></F>
            </Row2>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn onClick={saveQuickAppt}>Save Appointment</Btn>
              <Btn variant="ghost" onClick={() => { setQuickAppt(null); setQuickPtId(""); }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
