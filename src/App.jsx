import { useState, useRef, useEffect, useCallback } from "react";

// ── Supabase ──────────────────────────────────────────────
const SUPABASE_URL = "https://cwsjuqznjeuethqfvomb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2p1cXpuamV1ZXRocWZ2b21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjg5NTMsImV4cCI6MjA5ODUwNDk1M30.r86p87wdm_hHX842poLHjTbPAs9Af_TfHs9oZi-73Ig";

const sbFetch = async (path, opts={}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  async getPatients() {
    const rows = await sbFetch("/patients?select=*&order=updated_at.desc");
    return rows.map(r => r.data);
  },
  async savePatient(patient) {
    await sbFetch("/patients", {
      method: "POST",
      body: JSON.stringify({ id: patient.id, data: patient, updated_at: new Date().toISOString() }),
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    });
  },
  async deletePatient(id) {
    await sbFetch(`/patients?id=eq.${id}`, { method: "DELETE" });
  },
  async getInventory() {
    const rows = await sbFetch("/inventory?select=*&order=updated_at.desc");
    return rows.map(r => r.data);
  },
  async saveInventoryItem(item) {
    await sbFetch("/inventory", {
      method: "POST",
      body: JSON.stringify({ id: item.id, data: item, updated_at: new Date().toISOString() }),
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    });
  },
  async deleteInventoryItem(id) {
    await sbFetch(`/inventory?id=eq.${id}`, { method: "DELETE" });
  },
};

const C = {
  hero1:"#e8aac8", hero2:"#f7d6e8", accent:"#c47aaa",
  mint:"#98d4c0", amber:"#f7d89a", red:"#f4aaaa",
  bg:"#fef9fc", card:"#ffffff", border:"#f5e4ef",
  text:"#3d2438", muted:"#c096b0",
};

const fmt = (d) => { if (!d) return "—"; const [y,m,day] = d.split("-"); return `${m}/${day}/${y}`; };
const currency = (n) => `$${Number(n||0).toFixed(2)}`;
const uid = () => `${Date.now()}-${Math.random()}`;
const todayStr = () => new Date().toISOString().slice(0,10);
const TODAY = todayStr();

const INSURANCE     = ["None / Self-Pay","Blue Cross","Aetna","Cigna","United","Medicare","Medicaid","Other"];
const VISIT_TYPES   = ["Initial Consultation","Follow-Up","Weigh-In","Injection Visit","Lab Review","Nutrition Counseling","Other"];
const PAYMENT_METHODS = ["Cash","Card","Zelle","CareCredit","Insurance","Other"];
const STATUSES      = ["Active","Inactive","On Hold"];
const GENDERS       = ["Female","Male","Non-binary","Prefer not to say","Other"];
const APPT_TIMES    = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM"];
const APPT_STATUSES = ["Scheduled","Confirmed","Checked In","Completed","No Show","Cancelled"];
const NEXT_STATUS   = { Scheduled:"Confirmed", Confirmed:"Checked In", "Checked In":"Completed" };
const INV_CATS      = ["Medications","Supplies","Equipment","Other"];
const INV_UNITS     = ["vials","units","boxes","bottles","syringes","tablets","patches","other"];
const MED_ROUTES    = ["Subcutaneous","Intramuscular","Oral","Topical","Other"];
const MED_FREQS     = ["Once daily","Twice daily","Once weekly","Twice weekly","Once monthly","As needed","One time only"];

const SAMPLE_DATA = [{
  id:"p1", firstName:"Maria", lastName:"Lopez", dob:"1985-04-12",
  phone:"713-555-0192", email:"maria@email.com", gender:"Female",
  insurance:"None / Self-Pay", emergencyContact:"Juan Lopez", emergencyPhone:"713-555-0100",
  status:"Active", allergies:"Penicillin, Sulfa drugs",
  startWeight:218, currentWeight:194, goalWeight:160, heightIn:63,
  medications:["Phentermine 15mg","Semaglutide 0.5mg","Vitamin B12 injection"],
  labResults:"Lipid panel 5/1: LDL 142, HDL 48. A1C 5.9.",
  imaging:"Abdominal US 5/1: No abnormalities.",
  consentSigned:true, consentDate:"2026-05-01",
  consentData:{ fullName:"Maria Lopez", dob:"1985-04-12", phone:"713-555-0192", email:"maria@email.com", emergencyContact:"Juan Lopez", emergencyPhone:"713-555-0100", medicalHistory:"None", currentMeds:"None", allergies:"Penicillin, Sulfa drugs", signature:"Maria Lopez", agreeTreatment:true, agreePhotos:true, agreePolicy:true, agreeAge:true, agreePrivacy:true, agreePhotoCon:true },
  appointments:[
    { id:"a1", date:TODAY, time:"10:00 AM", type:"Injection Visit", provider:"Dr. Rios", status:"Confirmed", notes:"Semaglutide refill" },
    { id:"a2", date:"2026-07-15", time:"9:00 AM", type:"Follow-Up", provider:"Dr. Rios", status:"Scheduled", notes:"Monthly check-in" },
  ],
  visits:[
    { id:"v1", date:"2026-05-01", type:"Initial Consultation", provider:"Dr. Rios", bp:"128/82", hr:"78", glucose:"95", weightToday:"218", notes:"Started phentermine 15mg." },
    { id:"v2", date:"2026-06-10", type:"Injection Visit", provider:"Dr. Rios", bp:"122/78", hr:"74", glucose:"90", weightToday:"194", notes:"Semaglutide 0.5mg. Tolerating well.", medsDispensed:[{ id:"md1", name:"Semaglutide 0.5mg", dose:"0.5mg", route:"Subcutaneous", freq:"Once weekly", notes:"" }] },
  ],
  billing:[
    { id:"b1", date:"2026-05-01", description:"Initial Consult", amount:"150", paid:"150", method:"Card", note:"" },
    { id:"b2", date:"2026-06-10", description:"Semaglutide Injection", amount:"200", paid:"100", method:"Cash", note:"Paying remainder 7/1" },
  ],
  photos:[], files:[],
}];

const SAMPLE_INVENTORY = [
  { id:"i1", name:"Semaglutide 0.5mg", category:"Medications", quantity:24, unit:"vials", lowAlert:5, notes:"Refrigerate" },
  { id:"i2", name:"Phentermine 15mg",   category:"Medications", quantity:100, unit:"tablets", lowAlert:20, notes:"" },
  { id:"i3", name:"Vitamin B12",        category:"Medications", quantity:50,  unit:"vials",   lowAlert:10, notes:"" },
  { id:"i4", name:"Syringes 1ml",       category:"Supplies",    quantity:200, unit:"syringes", lowAlert:30, notes:"" },
];

// ── UI Atoms ──────────────────────────────────────────────
const Lbl = ({children}) => <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{children}</div>;
const Inp = ({value,onChange,type="text",placeholder="",readOnly=false}) => <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={{width:"100%",padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:readOnly?"#f9f4f7":"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none"}}/>;
const Txa = ({value,onChange,placeholder="",rows=3}) => <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none",resize:"vertical"}}/>;
const Sel = ({value,onChange,options}) => <select value={value} onChange={onChange} style={{width:"100%",padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none"}}><option value="">Select...</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;
const Pill = ({children,color="rose"}) => { const map={rose:{bg:"#fce8f3",fg:"#b0608c"},mint:{bg:"#e0f5ef",fg:"#4a9e89"},amber:{bg:"#fef5dc",fg:"#a07830"},red:{bg:"#fde8e8",fg:"#b05050"},gray:{bg:"#f5eef8",fg:"#7a5a8a"},blue:{bg:"#e8f0fe",fg:"#3b5bdb"},purple:{bg:"#f3e8ff",fg:"#7c3aed"}}; const s=map[color]||map.rose; return <span style={{display:"inline-block",padding:"2px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:s.bg,color:s.fg}}>{children}</span>; };
const Btn = ({children,onClick,variant="primary",small=false}) => { const styles={primary:{background:`linear-gradient(135deg,${C.hero1},${C.hero2})`,color:C.text,border:"none"},outline:{background:"rgba(255,255,255,0.9)",color:C.accent,border:`1.5px solid ${C.accent}`},ghost:{background:"#f3e0e9",color:C.accent,border:"none"},danger:{background:"#fee2e2",color:"#b05050",border:"none"},mint:{background:"#d0ede8",color:"#2d6b5e",border:"none"},blue:{background:"#e8f0fe",color:"#3b5bdb",border:"none"}}; return <button onClick={onClick} style={{...styles[variant],borderRadius:9,padding:small?"5px 12px":"9px 18px",fontWeight:700,fontSize:small?12:13,cursor:"pointer",fontFamily:"inherit"}}>{children}</button>; };
const SectionHead = ({children}) => <div style={{fontWeight:800,fontSize:13,color:C.accent,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{children}</div>;
const Row2 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>{children}</div>;
const F = ({label,full=false,children}) => <div style={{gridColumn:full?"1/-1":"auto"}}><Lbl>{label}</Lbl>{children}</div>;
const Empty = ({icon,msg}) => <div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:36}}>{icon}</div><div style={{fontWeight:600,marginTop:8,fontSize:14}}>{msg}</div></div>;

const WeightBar = ({start,current,goal}) => {
  const s=Number(start),c=Number(current),g=Number(goal);
  if (!s||!c||!g||s<=g) return null;
  const pct=Math.min(100,Math.max(0,Math.round(((s-c)/(s-g))*100)));
  return <div style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}><span>Progress to goal</span><span style={{fontWeight:700,color:C.accent}}>{pct}%</span></div><div style={{height:10,background:C.border,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.mint},${C.hero1})`,borderRadius:99}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:3}}><span>Start: {s} lbs</span><span>Goal: {g} lbs</span></div></div>;
};

const bmiCalc = (lbs,ins) => (!lbs||!ins)?null:((lbs/(ins*ins))*703).toFixed(1);
const bmiLabel = (b) => { if(!b) return null; if(b<18.5) return{label:"Underweight",color:"amber"}; if(b<25) return{label:"Normal",color:"mint"}; if(b<30) return{label:"Overweight",color:"amber"}; return{label:"Obese",color:"red"}; };
const statusColor = (s) => ({Active:"mint","On Hold":"amber",Inactive:"gray"}[s]||"gray");
const apptColor = (s) => ({Scheduled:"blue",Confirmed:"purple","Checked In":"mint",Completed:"gray","No Show":"red",Cancelled:"gray"}[s]||"gray");
const lastVisitDate = (v=[]) => { if(!v.length) return null; return [...v].sort((a,b)=>b.date.localeCompare(a.date))[0].date; };
const nextApptOf = (a=[]) => { const f=a.filter(x=>x.date>=TODAY&&x.status!=="Cancelled"&&x.status!=="No Show"); if(!f.length) return null; return [...f].sort((a,b)=>a.date.localeCompare(b.date)||APPT_TIMES.indexOf(a.time)-APPT_TIMES.indexOf(b.time))[0]; };
const daysSince = (d) => { if(!d) return null; const diff=Math.floor((Date.now()-new Date(d))/86400000); if(diff===0) return"Today"; if(diff===1) return"Yesterday"; if(diff<30) return`${diff}d ago`; if(diff<365) return`${Math.floor(diff/30)}mo ago`; return`${Math.floor(diff/365)}y ago`; };
const totals = (billing=[]) => { const charged=billing.reduce((s,b)=>s+Number(b.amount||0),0); const paid=billing.reduce((s,b)=>s+Number(b.paid||0),0); return{charged,paid,owed:charged-paid}; };
const weightLost = (p) => { const sw=Number(p.startWeight||0),cw=Number(p.currentWeight||0); return(sw&&cw)?(sw-cw).toFixed(1):null; };

const emptyPatient = () => ({id:uid(),firstName:"",lastName:"",dob:"",phone:"",email:"",gender:"",status:"Active",insurance:"",emergencyContact:"",emergencyPhone:"",allergies:"",startWeight:"",currentWeight:"",goalWeight:"",heightIn:"",medications:[],labResults:"",imaging:"",consentSigned:false,consentDate:"",consentData:null,appointments:[],visits:[],billing:[],photos:[],files:[]});
const emptyAppt   = () => ({id:uid(),date:TODAY,time:"",type:"",provider:"",status:"Scheduled",notes:""});
const emptyVisit  = () => ({id:uid(),date:"",type:"",provider:"",bp:"",hr:"",glucose:"",weightToday:"",notes:"",medsDispensed:[]});
const emptyBill   = () => ({id:uid(),date:"",description:"",amount:"",paid:"",method:"",note:""});
const emptyInv    = () => ({id:uid(),name:"",category:"",quantity:"",unit:"",lowAlert:"",notes:""});
const emptyMedRow = () => ({id:uid(),name:"",dose:"",route:"",freq:"",notes:""});
const emptyConsent= () => ({fullName:"",dob:"",phone:"",email:"",emergencyContact:"",emergencyPhone:"",medicalHistory:"",currentMeds:"",allergies:"",signature:"",agreeTreatment:false,agreePhotoCon:false,agreePolicy:false,agreeAge:false,agreePrivacy:false});

// ── Consent Form Modal ────────────────────────────────────
function ConsentModal({patient, onSave, onClose}) {
  const [form, setForm] = useState(patient.consentData || {...emptyConsent(), fullName:`${patient.firstName} ${patient.lastName}`, dob:patient.dob||"", phone:patient.phone||"", email:patient.email||"", allergies:patient.allergies||""});
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const fc = k => e => setForm(p=>({...p,[k]:e.target.checked}));
  const submit = () => {
    if (!form.fullName||!form.signature) return alert("Full name and signature required.");
    if (!form.agreeAll) return alert("Please check the box agreeing to all terms to continue.");
    onSave(form);
  };
  const iStyle = {width:"100%",padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none"};
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(61,36,56,0.5)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:560,boxShadow:"0 8px 32px rgba(194,24,91,0.2)",margin:"20px auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800,color:C.accent}}>🌸 Sulem Ageless Slimming</div>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:4}}>Patient Liability & Consent Form</div>
        </div>

        {/* Personal Info */}
        <SectionHead>Personal Information</SectionHead>
        <Row2>
          <F label="Full Name *"><Inp value={form.fullName} onChange={f("fullName")}/></F>
          <F label="Date of Birth"><Inp type="date" value={form.dob} onChange={f("dob")}/></F>
          <F label="Phone"><Inp value={form.phone} onChange={f("phone")}/></F>
          <F label="Email"><Inp value={form.email} onChange={f("email")}/></F>
          <F label="Emergency Contact"><Inp value={form.emergencyContact} onChange={f("emergencyContact")}/></F>
          <F label="Emergency Phone"><Inp value={form.emergencyPhone} onChange={f("emergencyPhone")}/></F>
        </Row2>

        {/* Medical */}
        <SectionHead>Medical Information</SectionHead>
        <Row2>
          <F label="Medical History / Conditions" full><Txa value={form.medicalHistory} onChange={f("medicalHistory")} placeholder="List conditions or write None" rows={2}/></F>
          <F label="Current Medications" full><Txa value={form.currentMeds} onChange={f("currentMeds")} placeholder="List medications or write None" rows={2}/></F>
          <F label="Allergies *" full><Inp value={form.allergies} onChange={f("allergies")} placeholder="List all allergies or write None"/></F>
        </Row2>

        {/* Liability Text */}
        <SectionHead>Consent & Liability</SectionHead>
        <div style={{background:"#fef9fc",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:14,fontSize:12,color:C.muted,lineHeight:1.7}}>
          <b style={{color:C.text,fontSize:13}}>Release of Liability & Treatment Consent</b><br/>
          <br/>
          <b style={{color:C.text}}>1. Consent to Treatment</b><br/>
          I hereby consent to medical evaluation, weight loss treatment, and beauty treatments by the clinical staff at Sulem Ageless Slimming, including but not limited to prescription medications, injectable therapies, nutrition counseling, and aesthetic services.<br/>
          <br/>
          <b style={{color:C.text}}>2. No Guarantee of Results</b><br/>
          I understand and acknowledge that no specific outcome, result, or level of improvement has been promised or guaranteed to me. Weight loss and aesthetic results vary from person to person based on individual factors including health history, lifestyle, adherence to the program, and physiology. I am not relying on any guarantee of specific results in agreeing to treatment.<br/>
          <br/>
          <b style={{color:C.text}}>3. Right to Withdraw Consent</b><br/>
          I understand that I have the right to refuse or withdraw my consent to any treatment at any time, without penalty or impact on my care. I may ask questions at any point and may stop any procedure if I am uncomfortable.<br/>
          <br/>
          <b style={{color:C.text}}>4. Accuracy of Medical History</b><br/>
          I confirm that all medical history, medications, allergies, and health information I have provided is true, accurate, and complete to the best of my knowledge. I understand that withholding or providing inaccurate medical information may affect my safety and the effectiveness of treatment, and I assume full responsibility for any consequences resulting from inaccurate information provided by me.<br/>
          <br/>
          <b style={{color:C.text}}>5. Assumption of Risk & Known Side Effects</b><br/>
          I acknowledge that all medical and aesthetic treatments carry inherent risks. These may include but are not limited to: redness, bruising, swelling, discomfort, tenderness, temporary skin irritation, allergic reactions, infection, or unexpected responses to medications or procedures. I voluntarily assume these known and unknown risks associated with my chosen treatments.<br/>
          <br/>
          <b style={{color:C.text}}>6. Release of Liability</b><br/>
          I release and hold harmless Sulem Ageless Slimming, its owners, physicians, nurses, and staff from any liability arising from treatment, except in cases of gross negligence or intentional misconduct. I acknowledge I have had the opportunity to ask questions and all have been answered to my satisfaction. I agree to the clinic's payment and cancellation policy, including a $25 late-cancel fee and $35 no-show fee. My personal and medical information will be kept confidential per HIPAA regulations.
        </div>

        {/* Checkboxes */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {/* Master agree all */}
          <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",background:"#fef0f8",border:`1.5px solid ${C.hero1}`,borderRadius:10,padding:"12px 14px"}}>
            <input type="checkbox" checked={form["agreeAll"]||false} onChange={e=>{const v=e.target.checked; setForm(p=>({...p,agreeAll:v,agreeTreatment:v,agreePolicy:v,agreePrivacy:v,agreeAge:v}));}} style={{marginTop:2,accentColor:C.accent,width:18,height:18,flexShrink:0}}/>
            <span style={{fontSize:13,color:C.text,fontWeight:700,lineHeight:1.6}}>I have read, understood, and agree to all of the above terms, consents, and policies. <span style={{color:C.accent}}>*</span></span>
          </label>
          <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}>
            <input type="checkbox" checked={form["agreePhotoCon"]||false} onChange={fc("agreePhotoCon")} style={{marginTop:2,accentColor:C.accent,width:16,height:16,flexShrink:0}}/>
            <span style={{fontSize:12,color:C.text,lineHeight:1.6}}>I consent to before/after photos for my medical chart (optional)</span>
          </label>
        </div>

        {/* Signature */}
        <SectionHead>Signature</SectionHead>
        <Lbl>Type your full name as your digital signature *</Lbl>
        <Inp value={form.signature} onChange={f("signature")} placeholder="Type full name to sign"/>
        <div style={{fontSize:11,color:C.muted,marginTop:4,marginBottom:20}}>Date: {new Date().toLocaleDateString()}</div>

        <div style={{display:"flex",gap:10}}>
          <Btn onClick={submit}>Submit & Sign</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Modal ─────────────────────────────────────────
function InvoiceModal({patient, onClose}) {
  const t = totals(patient.billing);
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(61,36,56,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:480,boxShadow:"0 8px 32px rgba(194,24,91,0.2)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:22,fontWeight:800,color:C.accent}}>🌸 Sulem Ageless Slimming</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>Receipt / Invoice</div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"12px 0",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{patient.firstName} {patient.lastName}</div>
          <div style={{fontSize:12,color:C.muted}}>{patient.phone} · {patient.email}</div>
          <div style={{fontSize:12,color:C.muted}}>Date: {new Date().toLocaleDateString()}</div>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16}}>
          <thead><tr style={{background:"#fef9fc"}}>{["Date","Description","Charged","Paid"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{patient.billing.map(b=><tr key={b.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"8px",fontSize:12}}>{fmt(b.date)}</td><td style={{padding:"8px",fontSize:12}}>{b.description}</td><td style={{padding:"8px",fontSize:12}}>{currency(b.amount)}</td><td style={{padding:"8px",fontSize:12,color:"#4a9e89"}}>{currency(b.paid)}</td></tr>)}</tbody>
        </table>
        <div style={{background:"#fef9fc",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
          {[["Total Charged",currency(t.charged),C.text],["Total Paid",currency(t.paid),"#4a9e89"],["Balance Due",currency(t.owed),t.owed>0?"#a07830":"#4a9e89"]].map(([k,v,c])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4,fontWeight:k==="Balance Due"?800:400}}><span style={{color:C.muted}}>{k}</span><span style={{color:c}}>{v}</span></div>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:11,color:C.muted,marginBottom:20}}>Thank you for choosing Sulem Ageless Slimming! 🌸</div>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={()=>window.print()}>🖨️ Print</Btn>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Meds Dispensed Editor ─────────────────────────────────
function MedsDispensed({meds, onChange}) {
  const add = () => onChange([...meds, emptyMedRow()]);
  const upd = (id,k,v) => onChange(meds.map(m=>m.id===id?{...m,[k]:v}:m));
  const rem = (id) => onChange(meds.filter(m=>m.id!==id));
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Lbl>Medications / Products Dispensed</Lbl>
        <Btn small variant="mint" onClick={add}>+ Add</Btn>
      </div>
      {meds.length===0 && <div style={{fontSize:12,color:C.muted,marginBottom:8,fontStyle:"italic"}}>No medications added yet — tap + Add</div>}
      {meds.map((m,i)=>(
        <div key={m.id} style={{background:"#fef9fc",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:C.accent}}>Medication {i+1}</div>
            <button onClick={()=>rem(m.id)} style={{background:"#fee2e2",border:"none",color:"#b05050",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>Remove</button>
          </div>
          <Row2>
            <F label="Name / Product"><Inp value={m.name} onChange={e=>upd(m.id,"name",e.target.value)} placeholder="e.g. Semaglutide 0.5mg"/></F>
            <F label="Dose"><Inp value={m.dose} onChange={e=>upd(m.id,"dose",e.target.value)} placeholder="e.g. 0.5mg"/></F>
            <F label="Route"><Sel value={m.route} onChange={e=>upd(m.id,"route",e.target.value)} options={MED_ROUTES}/></F>
            <F label="Frequency">
                <Sel value={m.freq} onChange={e=>upd(m.id,"freq",e.target.value)} options={MED_FREQS}/>
                <Inp value={m.freqCustom||""} onChange={e=>upd(m.id,"freqCustom",e.target.value)} placeholder="Or type your own frequency..." />
              </F>
            <F label="Notes" full><Inp value={m.notes} onChange={e=>upd(m.id,"notes",e.target.value)} placeholder="Any special instructions..."/></F>
          </Row2>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function App() {
  const [patients,  setPatients]  = useState(SAMPLE_DATA);
  const [inventory, setInventory] = useState(SAMPLE_INVENTORY);
  const [syncing,   setSyncing]   = useState(false);
  const [syncMsg,   setSyncMsg]   = useState("");

  // Load from Supabase on mount
  useEffect(() => {
    setSyncing(true);
    setSyncMsg("Loading...");
    Promise.all([db.getPatients(), db.getInventory()])
      .then(([pts, inv]) => {
        if (pts.length > 0) setPatients(pts);
        if (inv.length > 0) setInventory(inv);
        setSyncMsg("");
      })
      .catch(() => setSyncMsg("Offline — showing local data"))
      .finally(() => setSyncing(false));
  }, []);

  // Save patient to Supabase whenever patients change
  const savePatientToDb = useCallback(async (patient) => {
    try { await db.savePatient(patient); setSyncMsg(""); }
    catch { setSyncMsg("⚠️ Sync error — check connection"); }
  }, []);

  const saveInventoryToDb = useCallback(async (item) => {
    try { await db.saveInventoryItem(item); setSyncMsg(""); }
    catch { setSyncMsg("⚠️ Sync error — check connection"); }
  }, []);

  const [page,       setPage]       = useState("today");
  const [activeId,   setActiveId]   = useState(null);
  const [tab,        setTab]        = useState("appts");
  const [search,     setSearch]     = useState("");
  const [stFilter,   setStFilter]   = useState("All");
  const [ptForm,     setPtForm]     = useState(null);
  const [apptForm,   setApptForm]   = useState(null);
  const [visitForm,  setVisitForm]  = useState(null);
  const [billForm,   setBillForm]   = useState(null);
  const [invForm,    setInvForm]    = useState(null);
  const [editApptId, setEditApptId] = useState(null);
  const [editVisitId,setEditVisitId]= useState(null);
  const [editBillId, setEditBillId] = useState(null);
  const [editInvId,  setEditInvId]  = useState(null);
  const [quickAppt,  setQuickAppt]  = useState(null);
  const [quickPtId,  setQuickPtId]  = useState("");
  const [showInvoice,setShowInvoice]= useState(false);
  const [showConsent,setShowConsent]= useState(false);
  const fileRef  = useRef();
  const photoRef = useRef();

  const active   = patients.find(p=>p.id===activeId);
  const upActive = fn => setPatients(ps => {
    const updated = ps.map(p => p.id===activeId ? fn(p) : p);
    const updatedPatient = updated.find(p => p.id===activeId);
    if (updatedPatient) savePatientToDb(updatedPatient);
    return updated;
  });

  const todayAppts = patients.flatMap(p=>(p.appointments||[]).filter(a=>a.date===TODAY).map(a=>({...a,patient:p}))).sort((a,b)=>APPT_TIMES.indexOf(a.time)-APPT_TIMES.indexOf(b.time));

  const filtered = patients.filter(p=>{
    const q=search.toLowerCase();
    const mq=[p.firstName,p.lastName,p.phone,p.email].join(" ").toLowerCase().includes(q);
    const ms=stFilter==="All"||p.status===stFilter;
    return mq&&ms;
  });

  const openChart = p => { setActiveId(p.id); setTab("appts"); setPage("chart"); };
  const goRoster  = () => { setPage("roster"); setPtForm(null); setApptForm(null); setVisitForm(null); setBillForm(null); };

  const savePt = () => {
    if (!ptForm.firstName||!ptForm.lastName) return alert("First and last name required.");
    const toSave = patients.find(p=>p.id===ptForm.id) ? {...ptForm} : {...ptForm, id:uid()};
    if (patients.find(p=>p.id===toSave.id)) { setPatients(ps=>ps.map(p=>p.id===toSave.id?toSave:p)); }
    else { setPatients(ps=>[toSave,...ps]); }
    savePatientToDb(toSave);
    goRoster();
  };

  const saveAppt = () => {
    if (!apptForm.date||!apptForm.time) return alert("Date and time required.");
    if (editApptId) { upActive(p=>({...p,appointments:p.appointments.map(a=>a.id===editApptId?{...apptForm}:a)})); }
    else { upActive(p=>({...p,appointments:[{...apptForm,id:uid()},...p.appointments]})); }
    setApptForm(null); setEditApptId(null);
  };

  const saveQuickAppt = () => {
    if (!quickPtId) return alert("Please select a patient.");
    if (!quickAppt.date||!quickAppt.time) return alert("Date and time required.");
    setPatients(ps => {
      const updated = ps.map(p=>{ if(String(p.id)!==String(quickPtId)) return p; return{...p,appointments:[{...quickAppt,id:uid()},...p.appointments]}; });
      const updatedPatient = updated.find(p=>String(p.id)===String(quickPtId));
      if (updatedPatient) savePatientToDb(updatedPatient);
      return updated;
    });
    setQuickAppt(null); setQuickPtId("");
  };

  const setApptStatus = (patientId,apptId,newStatus) => setPatients(ps => {
    const updated = ps.map(p=>{ if(p.id!==patientId) return p; return{...p,appointments:p.appointments.map(a=>a.id===apptId?{...a,status:newStatus}:a)}; });
    const updatedPatient = updated.find(p=>p.id===patientId);
    if (updatedPatient) savePatientToDb(updatedPatient);
    return updated;
  });

  const saveVisit = () => {
    if (!visitForm.date) return alert("Date required.");
    if (editVisitId) { upActive(p=>({...p,visits:p.visits.map(v=>v.id===editVisitId?{...visitForm}:v)})); }
    else { upActive(p=>({...p,visits:[{...visitForm,id:uid()},...p.visits]})); }
    setVisitForm(null); setEditVisitId(null);
  };

  const saveBill = () => {
    if (!billForm.description||!billForm.amount) return alert("Description and amount required.");
    if (editBillId) { upActive(p=>({...p,billing:p.billing.map(b=>b.id===editBillId?{...billForm}:b)})); }
    else { upActive(p=>({...p,billing:[{...billForm,id:uid()},...p.billing]})); }
    setBillForm(null); setEditBillId(null);
  };

  const saveInv = () => {
    if (!invForm.name||!invForm.quantity) return alert("Name and quantity required.");
    const toSave = editInvId ? {...invForm} : {...invForm, id:uid()};
    if (editInvId) { setInventory(iv=>iv.map(i=>i.id===editInvId?toSave:i)); }
    else { setInventory(iv=>[toSave,...iv]); }
    saveInventoryToDb(toSave);
    setInvForm(null); setEditInvId(null);
  };

  const handleFiles = e => { [...e.target.files].forEach(f=>{ const r=new FileReader(); r.onload=ev=>{ const obj={id:uid(),name:f.name,type:f.type,dataUrl:ev.target.result,uploadedAt:new Date().toLocaleDateString()}; upActive(p=>({...p,files:[...p.files,obj]})); }; r.readAsDataURL(f); }); e.target.value=""; };
  const handlePhoto = (e,label,weight) => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ const obj={id:uid(),date:TODAY,label:label||"Photo",dataUrl:ev.target.result,weight:weight||""}; upActive(p=>({...p,photos:[...(p.photos||[]),obj]})); }; r.readAsDataURL(f); e.target.value=""; };
  const saveConsent = data => { upActive(p=>({...p,consentSigned:true,consentDate:TODAY,consentData:data,allergies:data.allergies||p.allergies})); setShowConsent(false); };

  const hGrad = "linear-gradient(135deg,#e8aac8 0%,#d4a8e0 50%,#f7d6e8 100%)";
  const lowItems = inventory.filter(i=>Number(i.quantity)<=Number(i.lowAlert||0));

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:C.bg,minHeight:"100vh",paddingBottom:60}}>

      {/* HEADER */}
      <div style={{background:hGrad,padding:"18px 20px 16px",color:C.text,boxShadow:"0 2px 16px rgba(220,170,210,0.3)"}}>
        <div style={{maxWidth:780,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",opacity:0.7}}>Sulem Ageless Slimming</div>
            <div style={{fontSize:20,fontWeight:800}}>
              {page==="today"&&"Today's Schedule"}
              {page==="roster"&&"Patient Roster"}
              {page==="inventory"&&"Inventory"}
              {page==="addPt"&&(ptForm&&patients.find(p=>p.id===ptForm.id)?"Edit Patient":"Add Patient")}
              {page==="chart"&&active&&`${active.firstName} ${active.lastName}`}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {page==="today"   && <Btn onClick={()=>{setQuickAppt(emptyAppt());setQuickPtId("");}}>+ New Appt</Btn>}
            {page==="roster"  && <Btn onClick={()=>{setPtForm(emptyPatient());setPage("addPt");}}>+ Add Patient</Btn>}
            {page==="inventory"&&<Btn onClick={()=>{setInvForm(emptyInv());setEditInvId(null);}}>+ Add Item</Btn>}
            {(page==="chart"||page==="addPt")&&<Btn variant="outline" onClick={goRoster}>Back to Roster</Btn>}
          </div>
        </div>
        {syncMsg && (
          <div style={{maxWidth:780,margin:"4px auto 0",padding:"0 20px"}}>
            <div style={{fontSize:11,color:syncMsg.includes("⚠️")?"#b05050":"rgba(61,36,56,0.6)",textAlign:"right"}}>{syncMsg}</div>
          </div>
        )}
      </div>

      {/* NAV TABS */}
      <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:780,margin:"0 auto",display:"flex"}}>
          {[["today","📅 Today"],["roster","👥 Roster"],["inventory","📦 Inventory"]].map(([v,label])=>(
            <button key={v} onClick={()=>setPage(v)} style={{flex:1,padding:"12px 8px",border:"none",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:"transparent",color:page===v?C.accent:C.muted,borderBottom:page===v?`3px solid ${C.accent}`:"3px solid transparent",position:"relative"}}>
              {label}
              {v==="inventory"&&lowItems.length>0&&<span style={{position:"absolute",top:8,right:"20%",background:C.red,color:"#b05050",borderRadius:99,fontSize:9,fontWeight:800,padding:"1px 5px"}}>{lowItems.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:780,margin:"0 auto",padding:"0 16px"}}>

        {/* ══ TODAY ══ */}
        {page==="today"&&(
          <div style={{marginTop:20}}>
            <div style={{background:C.card,borderRadius:14,padding:"14px 18px",boxShadow:"0 1px 6px rgba(194,24,91,0.08)",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase"}}>Today</div>
                <div style={{fontSize:18,fontWeight:800,color:C.text}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:600}}>Appointments</div>
                <div style={{fontSize:28,fontWeight:800,color:C.hero1}}>{todayAppts.length}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {[["Upcoming",todayAppts.filter(a=>a.status==="Scheduled"||a.status==="Confirmed").length,"#e8f0fe","#3b5bdb"],["Checked In",todayAppts.filter(a=>a.status==="Checked In").length,"#e0f5ef","#4a9e89"],["Completed",todayAppts.filter(a=>a.status==="Completed").length,"#f5eef8","#7a5a8a"]].map(([label,val,bg,fg])=>(
                <div key={label} style={{background:bg,borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:800,color:fg}}>{val}</div>
                  <div style={{fontSize:11,fontWeight:600,color:fg,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            {lowItems.length>0&&(
              <div style={{background:"#fff5f5",border:"1.5px solid #fcd0d0",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#b05050",marginBottom:6}}>⚠️ Low Inventory Alert</div>
                {lowItems.map(i=><div key={i.id} style={{fontSize:12,color:"#b05050"}}>• {i.name}: only {i.quantity} {i.unit} left</div>)}
              </div>
            )}
            {todayAppts.length===0&&<Empty icon="🌸" msg="No appointments scheduled for today"/>}
            {todayAppts.map(a=>{
              const p=a.patient; const ns=NEXT_STATUS[a.status];
              return (
                <div key={a.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 6px rgba(194,24,91,0.07)",borderLeft:`4px solid ${a.status==="Completed"?C.mint:a.status==="No Show"?C.red:C.hero1}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                        <span style={{fontWeight:800,fontSize:15,color:C.text}}>{a.time}</span>
                        <Pill color={apptColor(a.status)}>{a.status}</Pill>
                        {!p.consentSigned&&<Pill color="red">⚠️ No Consent</Pill>}
                      </div>
                      <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:2}}>{p.firstName} {p.lastName}</div>
                      <div style={{fontSize:12,color:C.muted}}>{a.type}{a.provider&&` · ${a.provider}`}{p.phone&&` · 📞 ${p.phone}`}</div>
                      {p.allergies&&<div style={{fontSize:11,color:"#b05050",fontWeight:700,marginTop:4}}>⚠️ Allergies: {p.allergies}</div>}
                      {a.notes&&<div style={{fontSize:12,color:C.muted,marginTop:4,fontStyle:"italic"}}>Note: {a.notes}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,marginLeft:10,flexShrink:0}}>
                      <Btn small variant="ghost" onClick={()=>openChart(p)}>Chart</Btn>
                      {ns&&<Btn small variant="mint" onClick={()=>setApptStatus(p.id,a.id,ns)}>{ns==="Confirmed"?"Confirm":ns==="Checked In"?"Check In":"Complete"}</Btn>}
                      {a.status!=="No Show"&&a.status!=="Completed"&&a.status!=="Cancelled"&&<Btn small variant="danger" onClick={()=>setApptStatus(p.id,a.id,"No Show")}>No Show</Btn>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ROSTER ══ */}
        {page==="roster"&&(
          <div style={{marginTop:20}}>
            <input placeholder="Search by name, phone, or email..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:13,background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none",marginBottom:10}}/>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {["All","Active","On Hold","Inactive"].map(s=><button key={s} onClick={()=>setStFilter(s)} style={{padding:"4px 14px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:stFilter===s?C.accent:"#f5e4ef",color:stFilter===s?"#fff":C.muted}}>{s}</button>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
              {[["Patients",patients.length,"rose"],["Total Charged",currency(patients.reduce((s,p)=>s+totals(p.billing).charged,0)),"rose"],["Total Owed",currency(patients.reduce((s,p)=>s+totals(p.billing).owed,0)),"amber"]].map(([label,val,color])=>(
                <div key={label} style={{background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.08)",borderTop:`3px solid ${color==="amber"?C.amber:C.hero1}`}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:2}}>{val}</div>
                </div>
              ))}
            </div>
            {filtered.length===0&&<Empty icon="🌸" msg="No patients found"/>}
            {filtered.map(p=>{
              const t=totals(p.billing); const lost=weightLost(p); const lv=lastVisitDate(p.visits); const na=nextApptOf(p.appointments);
              return (
                <div key={p.id} onClick={()=>openChart(p)} style={{background:C.card,borderRadius:14,padding:"16px",marginBottom:10,boxShadow:"0 1px 6px rgba(194,24,91,0.07)",cursor:"pointer",borderLeft:`4px solid ${p.status==="Inactive"?C.muted:p.status==="On Hold"?C.amber:C.hero1}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontWeight:800,fontSize:15,color:C.text}}>{p.firstName} {p.lastName}</span>
                      {p.status&&<Pill color={statusColor(p.status)}>{p.status}</Pill>}
                      {!p.consentSigned&&<Pill color="red">No Consent</Pill>}
                    </div>
                    <div style={{fontSize:12,color:C.muted,margin:"3px 0"}}>{p.phone&&<span>📞 {p.phone}</span>}{lv&&<span style={{marginLeft:10}}>🕐 Last seen: {daysSince(lv)}</span>}</div>
                    {na&&<div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:4}}>📅 Next: {na.date===TODAY?"Today":fmt(na.date)} at {na.time}</div>}
                    {p.allergies&&<div style={{fontSize:11,color:"#b05050",fontWeight:700,marginBottom:4}}>⚠️ {p.allergies}</div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
                      {lost&&Number(lost)>0&&<Pill color="mint">↓ {lost} lbs lost</Pill>}
                      {t.owed>0&&<Pill color="amber">Owes {currency(t.owed)}</Pill>}
                      {t.owed===0&&t.charged>0&&<Pill color="mint">✓ Paid in full</Pill>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                    <div style={{fontSize:11,color:C.muted}}>Visits</div>
                    <div style={{fontSize:22,fontWeight:800,color:C.hero1}}>{p.visits.length}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ INVENTORY ══ */}
        {page==="inventory"&&(
          <div style={{marginTop:20}}>
            {lowItems.length>0&&<div style={{background:"#fff5f5",border:"1.5px solid #fcd0d0",borderRadius:12,padding:"12px 16px",marginBottom:16}}><div style={{fontSize:12,fontWeight:700,color:"#b05050",marginBottom:6}}>⚠️ Low Stock — Reorder Needed</div>{lowItems.map(i=><div key={i.id} style={{fontSize:12,color:"#b05050"}}>• {i.name}: {i.quantity} {i.unit} remaining</div>)}</div>}
            {invForm&&(
              <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(194,24,91,0.08)",marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.text}}>{editInvId?"Edit Item":"Add Item"}</div>
                <Row2>
                  <F label="Item Name *"><Inp value={invForm.name} onChange={e=>setInvForm(f=>({...f,name:e.target.value}))}/></F>
                  <F label="Category"><Sel value={invForm.category} onChange={e=>setInvForm(f=>({...f,category:e.target.value}))} options={INV_CATS}/></F>
                  <F label="Quantity *"><Inp type="number" value={invForm.quantity} onChange={e=>setInvForm(f=>({...f,quantity:e.target.value}))}/></F>
                  <F label="Unit"><Sel value={invForm.unit} onChange={e=>setInvForm(f=>({...f,unit:e.target.value}))} options={INV_UNITS}/></F>
                  <F label="Low Stock Alert At"><Inp type="number" value={invForm.lowAlert} onChange={e=>setInvForm(f=>({...f,lowAlert:e.target.value}))} placeholder="e.g. 5"/></F>
                  <F label="Notes"><Inp value={invForm.notes} onChange={e=>setInvForm(f=>({...f,notes:e.target.value}))}/></F>
                </Row2>
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  <Btn onClick={saveInv}>Save</Btn>
                  <Btn variant="ghost" onClick={()=>{setInvForm(null);setEditInvId(null);}}>Cancel</Btn>
                </div>
              </div>
            )}
            {inventory.length===0&&<Empty icon="📦" msg="No inventory items yet"/>}
            {INV_CATS.map(cat=>{
              const items=inventory.filter(i=>i.category===cat);
              if(!items.length) return null;
              return (
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.accent,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>{cat}</div>
                  {items.map(i=>{
                    const isLow=Number(i.quantity)<=Number(i.lowAlert||0);
                    return (
                      <div key={i.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:8,boxShadow:"0 1px 4px rgba(194,24,91,0.07)",borderLeft:`4px solid ${isLow?C.red:C.mint}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:C.text}}>{i.name}</div>
                            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{i.notes&&<span>{i.notes} · </span>}Alert at {i.lowAlert||0} {i.unit}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:22,fontWeight:800,color:isLow?"#b05050":C.mint}}>{i.quantity}</div>
                              <div style={{fontSize:11,color:C.muted}}>{i.unit}</div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              <Btn small variant="ghost" onClick={()=>{setInvForm({...i});setEditInvId(i.id);}}>Edit</Btn>
                              <Btn small variant="mint" onClick={()=>{ const upd={...i,quantity:Number(i.quantity)+1}; setInventory(iv=>iv.map(x=>x.id===i.id?upd:x)); saveInventoryToDb(upd); }}>+1</Btn>
                              <Btn small variant="danger" onClick={()=>{ const upd={...i,quantity:Math.max(0,Number(i.quantity)-1)}; setInventory(iv=>iv.map(x=>x.id===i.id?upd:x)); saveInventoryToDb(upd); }}>-1</Btn>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ ADD / EDIT PATIENT ══ */}
        {page==="addPt"&&ptForm&&(
          <div style={{marginTop:20}}>
            <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(194,24,91,0.08)"}}>
              <SectionHead>Personal Info</SectionHead>
              <Row2>
                <F label="First Name *"><Inp value={ptForm.firstName} onChange={e=>setPtForm(f=>({...f,firstName:e.target.value}))}/></F>
                <F label="Last Name *"><Inp value={ptForm.lastName} onChange={e=>setPtForm(f=>({...f,lastName:e.target.value}))}/></F>
                <F label="Date of Birth"><Inp type="date" value={ptForm.dob} onChange={e=>setPtForm(f=>({...f,dob:e.target.value}))}/></F>
                <F label="Gender"><Sel value={ptForm.gender} onChange={e=>setPtForm(f=>({...f,gender:e.target.value}))} options={GENDERS}/></F>
                <F label="Phone"><Inp value={ptForm.phone} onChange={e=>setPtForm(f=>({...f,phone:e.target.value}))}/></F>
                <F label="Email"><Inp value={ptForm.email} onChange={e=>setPtForm(f=>({...f,email:e.target.value}))}/></F>
                <F label="Insurance"><Sel value={ptForm.insurance} onChange={e=>setPtForm(f=>({...f,insurance:e.target.value}))} options={INSURANCE}/></F>
                <F label="Status"><Sel value={ptForm.status} onChange={e=>setPtForm(f=>({...f,status:e.target.value}))} options={STATUSES}/></F>
                <F label="Emergency Contact"><Inp value={ptForm.emergencyContact} placeholder="Name" onChange={e=>setPtForm(f=>({...f,emergencyContact:e.target.value}))}/></F>
                <F label="Emergency Phone"><Inp value={ptForm.emergencyPhone} onChange={e=>setPtForm(f=>({...f,emergencyPhone:e.target.value}))}/></F>
              </Row2>
              <div style={{marginTop:14,background:"#fff5f5",border:"1.5px solid #fcd0d0",borderRadius:10,padding:"12px 14px"}}>
                <Lbl>⚠️ Allergies / Contraindications</Lbl>
                <Inp value={ptForm.allergies} placeholder="e.g. Penicillin — leave blank if none" onChange={e=>setPtForm(f=>({...f,allergies:e.target.value}))}/>
              </div>
              <SectionHead>Weight & Goals</SectionHead>
              <Row2>
                <F label="Height (inches)"><Inp type="number" value={ptForm.heightIn} onChange={e=>setPtForm(f=>({...f,heightIn:e.target.value}))}/></F>
                <F label="Starting Weight (lbs)"><Inp type="number" value={ptForm.startWeight} onChange={e=>setPtForm(f=>({...f,startWeight:e.target.value}))}/></F>
                <F label="Current Weight (lbs)"><Inp type="number" value={ptForm.currentWeight} onChange={e=>setPtForm(f=>({...f,currentWeight:e.target.value}))}/></F>
                <F label="Goal Weight (lbs)"><Inp type="number" value={ptForm.goalWeight} onChange={e=>setPtForm(f=>({...f,goalWeight:e.target.value}))}/></F>
              </Row2>
              <SectionHead>Medical Info</SectionHead>
              <Row2>
                <F label="Medications (one per line)" full><Txa value={(ptForm.medications||[]).join("\n")} placeholder="e.g. Phentermine 15mg" onChange={e=>setPtForm(f=>({...f,medications:e.target.value.split("\n")}))}/></F>
                <F label="Lab Results" full><Txa value={ptForm.labResults} onChange={e=>setPtForm(f=>({...f,labResults:e.target.value}))}/></F>
                <F label="Imaging Notes" full><Txa value={ptForm.imaging} onChange={e=>setPtForm(f=>({...f,imaging:e.target.value}))}/></F>
              </Row2>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <Btn onClick={savePt}>Save Patient</Btn>
                <Btn variant="ghost" onClick={goRoster}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══ CHART ══ */}
        {page==="chart"&&active&&(()=>{
          const t=totals(active.billing); const lost=weightLost(active);
          const b=bmiCalc(active.currentWeight,active.heightIn); const bl=bmiLabel(b);
          const lv=lastVisitDate(active.visits); const na=nextApptOf(active.appointments);
          return (
            <div style={{marginTop:18}}>
              {/* Patient header */}
              <div style={{background:C.card,borderRadius:16,padding:18,boxShadow:"0 1px 8px rgba(194,24,91,0.08)",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase"}}>Patient</div>
                    <div style={{fontSize:20,fontWeight:800,color:C.text}}>{active.firstName} {active.lastName}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:3}}>
                      {active.gender&&<span>{active.gender} &nbsp;·&nbsp; </span>}
                      {active.dob&&<span>DOB: {fmt(active.dob)} &nbsp;·&nbsp; </span>}
                      {active.phone&&<span>{active.phone}</span>}
                    </div>
                    {active.allergies&&<div style={{marginTop:8,background:"#fff0f0",border:"1px solid #fcd0d0",borderRadius:8,padding:"6px 10px",fontSize:12,color:"#b05050",fontWeight:700}}>⚠️ ALLERGIES: {active.allergies}</div>}
                    <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                      {active.status&&<Pill color={statusColor(active.status)}>{active.status}</Pill>}
                      {active.consentSigned?<Pill color="mint">✓ Consent {fmt(active.consentDate)}</Pill>:<Pill color="red">⚠️ No Consent</Pill>}
                      {lost&&Number(lost)>0&&<Pill color="mint">↓ {lost} lbs lost</Pill>}
                      {bl&&<Pill color={bl.color}>BMI {b} · {bl.label}</Pill>}
                      {t.owed>0&&<Pill color="amber">Owes {currency(t.owed)}</Pill>}
                      {t.owed===0&&t.charged>0&&<Pill color="mint">✓ Paid in full</Pill>}
                    </div>
                    <div style={{marginTop:8,display:"flex",gap:16,fontSize:12,flexWrap:"wrap"}}>
                      {na&&<span style={{color:C.accent,fontWeight:700}}>📅 Next: {na.date===TODAY?"Today":fmt(na.date)} at {na.time}</span>}
                      {lv&&<span style={{color:C.muted}}>🕐 Last seen: {daysSince(lv)}</span>}
                    </div>
                    <WeightBar start={active.startWeight} current={active.currentWeight} goal={active.goalWeight}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginLeft:10,flexShrink:0}}>
                    <Btn small variant="ghost" onClick={()=>{setPtForm({...active});setPage("addPt");}}>Edit</Btn>
                    <Btn small variant="blue" onClick={()=>setShowInvoice(true)}>🧾 Invoice</Btn>
                    {!active.consentSigned&&<Btn small variant="mint" onClick={()=>setShowConsent(true)}>📋 Consent</Btn>}
                    {active.consentSigned&&<Btn small variant="ghost" onClick={()=>setShowConsent(true)}>📋 Re-sign</Btn>}
                  </div>
                </div>
              </div>

              {/* Chart tabs */}
              <div style={{display:"flex",gap:4,marginBottom:16,background:"#f3e0e9",borderRadius:12,padding:4}}>
                {[["appts","📅"],["overview","📋"],["visits","🩺"],["photos","📸"],["billing","💳"],["files","📎"]].map(([v,label])=>(
                  <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:9,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",background:tab===v?"#fff":"transparent",color:tab===v?C.accent:C.muted,boxShadow:tab===v?"0 1px 4px rgba(194,24,91,0.12)":"none"}}>{label}</button>
                ))}
              </div>

              {/* APPTS TAB */}
              {tab==="appts"&&(
                <div>
                  {apptForm?(
                    <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(194,24,91,0.08)"}}>
                      <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.text}}>{editApptId?"Edit Appointment":"Schedule Appointment"}</div>
                      <Row2>
                        <F label="Date *"><Inp type="date" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))}/></F>
                        <F label="Time *"><Sel value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} options={APPT_TIMES}/></F>
                        <F label="Visit Type"><Sel value={apptForm.type} onChange={e=>setApptForm(f=>({...f,type:e.target.value}))} options={VISIT_TYPES}/></F>
                        <F label="Provider"><Inp value={apptForm.provider} onChange={e=>setApptForm(f=>({...f,provider:e.target.value}))}/></F>
                        <F label="Status"><Sel value={apptForm.status} onChange={e=>setApptForm(f=>({...f,status:e.target.value}))} options={APPT_STATUSES}/></F>
                        <F label="Notes" full><Inp value={apptForm.notes} placeholder="Optional..." onChange={e=>setApptForm(f=>({...f,notes:e.target.value}))}/></F>
                      </Row2>
                      <div style={{display:"flex",gap:10,marginTop:16}}>
                        <Btn onClick={saveAppt}>Save Appointment</Btn>
                        <Btn variant="ghost" onClick={()=>{setApptForm(null);setEditApptId(null);}}>Cancel</Btn>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                        <Btn onClick={()=>{setApptForm(emptyAppt());setEditApptId(null);}}>+ Schedule Appointment</Btn>
                      </div>
                      {(active.appointments||[]).length===0&&<Empty icon="📅" msg="No appointments scheduled"/>}
                      {[...(active.appointments||[])].sort((a,b)=>a.date.localeCompare(b.date)||APPT_TIMES.indexOf(a.time)-APPT_TIMES.indexOf(b.time)).map(a=>{
                        const ns=NEXT_STATUS[a.status];
                        return (
                          <div key={a.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(194,24,91,0.07)",borderLeft:`4px solid ${a.date===TODAY?C.accent:a.date<TODAY?"#e5e7eb":C.hero2}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div>
                                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                                  <span style={{fontWeight:800,fontSize:14,color:C.text}}>{a.date===TODAY?"Today":fmt(a.date)} at {a.time}</span>
                                  <Pill color={apptColor(a.status)}>{a.status}</Pill>
                                  {a.date===TODAY&&<Pill color="rose">Today</Pill>}
                                </div>
                                <div style={{fontSize:12,color:C.muted}}>{a.type}{a.provider&&` · ${a.provider}`}</div>
                                {a.notes&&<div style={{fontSize:12,color:C.muted,marginTop:4,fontStyle:"italic"}}>Note: {a.notes}</div>}
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:5,marginLeft:10,flexShrink:0}}>
                                <Btn small variant="ghost" onClick={()=>{setApptForm({...a});setEditApptId(a.id);}}>Edit</Btn>
                                {ns&&<Btn small variant="mint" onClick={()=>setApptStatus(activeId,a.id,ns)}>{ns==="Confirmed"?"Confirm":ns==="Checked In"?"Check In":"Complete"}</Btn>}
                                {a.status!=="No Show"&&a.status!=="Completed"&&a.status!=="Cancelled"&&<Btn small variant="danger" onClick={()=>setApptStatus(activeId,a.id,"No Show")}>No Show</Btn>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* OVERVIEW TAB */}
              {tab==="overview"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[["Starting Weight",active.startWeight?`${active.startWeight} lbs`:"—"],["Current Weight",active.currentWeight?`${active.currentWeight} lbs`:"—"],["Goal Weight",active.goalWeight?`${active.goalWeight} lbs`:"—"],["Height",active.heightIn?`${Math.floor(active.heightIn/12)}ft ${active.heightIn%12}in`:"—"]].map(([k,v])=>(
                    <div key={k} style={{background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}>
                      <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{k}</div>
                      <div style={{fontSize:20,fontWeight:800,color:C.text,marginTop:2}}>{v}</div>
                    </div>
                  ))}
                  <div style={{gridColumn:"1/-1",background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:8}}>MEDICATIONS</div>
                    {(active.medications||[]).filter(Boolean).length===0?<span style={{fontSize:13,color:C.muted}}>None recorded</span>:(active.medications||[]).filter(Boolean).map((m,i)=><div key={i} style={{fontSize:13,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>{m}</div>)}
                  </div>
                  {active.labResults&&<div style={{gridColumn:"1/-1",background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}><div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>LAB RESULTS</div><div style={{fontSize:13,color:C.text,whiteSpace:"pre-wrap"}}>{active.labResults}</div></div>}
                  {active.imaging&&<div style={{gridColumn:"1/-1",background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}><div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>IMAGING</div><div style={{fontSize:13,color:C.text,whiteSpace:"pre-wrap"}}>{active.imaging}</div></div>}
                  {active.emergencyContact&&<div style={{gridColumn:"1/-1",background:C.card,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}><div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>EMERGENCY CONTACT</div><div style={{fontSize:13,color:C.text}}>{active.emergencyContact} {active.emergencyPhone&&`· ${active.emergencyPhone}`}</div></div>}
                  {active.consentSigned&&active.consentData&&(
                    <div style={{gridColumn:"1/-1",background:"#f0fff8",border:`1px solid ${C.mint}`,borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:11,color:"#4a9e89",fontWeight:700,marginBottom:6}}>✓ CONSENT SIGNED — {fmt(active.consentDate)}</div>
                      <div style={{fontSize:12,color:C.text}}>Signed by: <b>{active.consentData.signature}</b></div>
                      {active.consentData.medicalHistory&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>Medical history: {active.consentData.medicalHistory}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* VISITS TAB */}
              {tab==="visits"&&(
                <div>
                  {visitForm?(
                    <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(194,24,91,0.08)"}}>
                      <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.text}}>{editVisitId?"Edit Visit":"Log New Visit"}</div>
                      <Row2>
                        <F label="Date *"><Inp type="date" value={visitForm.date} onChange={e=>setVisitForm(f=>({...f,date:e.target.value}))}/></F>
                        <F label="Visit Type"><Sel value={visitForm.type} onChange={e=>setVisitForm(f=>({...f,type:e.target.value}))} options={VISIT_TYPES}/></F>
                        <F label="Provider"><Inp value={visitForm.provider} onChange={e=>setVisitForm(f=>({...f,provider:e.target.value}))}/></F>
                        <F label="Weight Today (lbs)"><Inp type="number" value={visitForm.weightToday} onChange={e=>setVisitForm(f=>({...f,weightToday:e.target.value}))}/></F>
                        <F label="Blood Pressure"><Inp value={visitForm.bp} placeholder="120/80" onChange={e=>setVisitForm(f=>({...f,bp:e.target.value}))}/></F>
                        <F label="Heart Rate (bpm)"><Inp type="number" value={visitForm.hr} onChange={e=>setVisitForm(f=>({...f,hr:e.target.value}))}/></F>
                        <F label="Glucose (mg/dL)"><Inp type="number" value={visitForm.glucose} onChange={e=>setVisitForm(f=>({...f,glucose:e.target.value}))}/></F>
                        <F label="Notes" full><Txa value={visitForm.notes} onChange={e=>setVisitForm(f=>({...f,notes:e.target.value}))}/></F>
                      </Row2>

                      {/* MEDS DISPENSED */}
                      <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                        <MedsDispensed
                          meds={visitForm.medsDispensed||[]}
                          onChange={meds=>setVisitForm(f=>({...f,medsDispensed:meds}))}
                        />
                      </div>

                      <div style={{display:"flex",gap:10,marginTop:16}}>
                        <Btn onClick={saveVisit}>Save Visit</Btn>
                        <Btn variant="ghost" onClick={()=>{setVisitForm(null);setEditVisitId(null);}}>Cancel</Btn>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                        <Btn onClick={()=>{setVisitForm(emptyVisit());setEditVisitId(null);}}>+ Log Visit</Btn>
                      </div>
                      {active.visits.length===0&&<Empty icon="🩺" msg="No visits logged yet"/>}
                      {active.visits.map(v=>(
                        <div key={v.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(194,24,91,0.07)",borderLeft:`4px solid ${C.hero2}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:14,color:C.text}}>{v.type||"Visit"} · {fmt(v.date)}</div>
                              {v.provider&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>Provider: {v.provider}</div>}
                              <div style={{display:"flex",gap:10,marginTop:6,flexWrap:"wrap",fontSize:12}}>
                                {v.weightToday&&<span>⚖️ {v.weightToday} lbs</span>}
                                {v.bp&&<span>❤️ BP {v.bp}</span>}
                                {v.hr&&<span>💓 {v.hr} bpm</span>}
                                {v.glucose&&<span>🩸 {v.glucose} mg/dL</span>}
                              </div>
                              {v.notes&&<div style={{fontSize:12,color:C.muted,marginTop:6,fontStyle:"italic"}}>"{v.notes}"</div>}
                              {/* Show meds dispensed */}
                              {(v.medsDispensed||[]).length>0&&(
                                <div style={{marginTop:10,background:"#f0fff8",borderRadius:8,padding:"8px 12px",border:`1px solid ${C.mint}`}}>
                                  <div style={{fontSize:11,fontWeight:700,color:"#4a9e89",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>💊 Dispensed</div>
                                  {v.medsDispensed.map(m=>(
                                    <div key={m.id} style={{fontSize:12,color:C.text,marginBottom:3}}>
                                      <b>{m.name}</b>{m.dose&&` · ${m.dose}`}{m.route&&` · ${m.route}`}{(m.freqCustom||m.freq)&&` · ${m.freqCustom||m.freq}`}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Btn small variant="ghost" onClick={()=>{setVisitForm({...v,medsDispensed:v.medsDispensed||[]});setEditVisitId(v.id);}}>Edit</Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PHOTOS TAB */}
              {tab==="photos"&&(
                <div>
                  <input type="file" ref={photoRef} accept="image/*" style={{display:"none"}} onChange={e=>{const label=prompt("Label this photo (e.g. Before, After, Week 4):"); const weight=prompt("Weight at time of photo (lbs):"); handlePhoto(e,label,weight);}}/>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                    <Btn onClick={()=>photoRef.current.click()}>📸 Add Photo</Btn>
                  </div>
                  {(active.photos||[]).length===0&&<Empty icon="📸" msg="No photos yet — add a before photo to start tracking!"/>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {(active.photos||[]).map(ph=>(
                      <div key={ph.id} style={{background:C.card,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}>
                        {ph.dataUrl?<img src={ph.dataUrl} alt={ph.label} style={{width:"100%",height:180,objectFit:"cover"}}/>:<div style={{height:180,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>📷</div>}
                        <div style={{padding:"10px 12px"}}>
                          <div style={{fontWeight:700,fontSize:13,color:C.text}}>{ph.label}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmt(ph.date)}{ph.weight&&` · ${ph.weight} lbs`}</div>
                          <button onClick={()=>upActive(p=>({...p,photos:(p.photos||[]).filter(x=>x.id!==ph.id)}))} style={{marginTop:6,fontSize:11,fontWeight:700,color:"#b05050",background:"#fee2e2",border:"none",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BILLING TAB */}
              {tab==="billing"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
                    {[["Total Charged",currency(t.charged),C.hero1],["Total Paid",currency(t.paid),C.mint],["Balance Owed",currency(t.owed),t.owed>0?C.amber:C.mint]].map(([k,v,bc])=>(
                      <div key={k} style={{background:C.card,borderRadius:12,padding:"12px 14px",boxShadow:"0 1px 4px rgba(194,24,91,0.07)",borderTop:`3px solid ${bc}`}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:700}}>{k}</div>
                        <div style={{fontSize:18,fontWeight:800,color:C.text,marginTop:2}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {billForm?(
                    <div style={{background:C.card,borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(194,24,91,0.08)"}}>
                      <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.text}}>{editBillId?"Edit Charge":"Add Charge"}</div>
                      <Row2>
                        <F label="Date"><Inp type="date" value={billForm.date} onChange={e=>setBillForm(f=>({...f,date:e.target.value}))}/></F>
                        <F label="Description *"><Inp value={billForm.description} onChange={e=>setBillForm(f=>({...f,description:e.target.value}))}/></F>
                        <F label="Amount Charged ($) *"><Inp type="number" value={billForm.amount} onChange={e=>setBillForm(f=>({...f,amount:e.target.value}))}/></F>
                        <F label="Amount Paid ($)"><Inp type="number" value={billForm.paid} onChange={e=>setBillForm(f=>({...f,paid:e.target.value}))}/></F>
                        <F label="Payment Method"><Sel value={billForm.method} onChange={e=>setBillForm(f=>({...f,method:e.target.value}))} options={PAYMENT_METHODS}/></F>
                        <F label="Payment Note" full><Inp value={billForm.note} placeholder="e.g. Payment plan, insurance pending..." onChange={e=>setBillForm(f=>({...f,note:e.target.value}))}/></F>
                      </Row2>
                      <div style={{display:"flex",gap:10,marginTop:16}}>
                        <Btn onClick={saveBill}>Save</Btn>
                        <Btn variant="ghost" onClick={()=>{setBillForm(null);setEditBillId(null);}}>Cancel</Btn>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                        <Btn onClick={()=>{setBillForm(emptyBill());setEditBillId(null);}}>+ Add Charge</Btn>
                      </div>
                      {active.billing.length===0&&<Empty icon="💳" msg="No charges yet"/>}
                      {active.billing.map(bi=>{
                        const owed=Number(bi.amount||0)-Number(bi.paid||0);
                        return (
                          <div key={bi.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(194,24,91,0.07)",borderLeft:`4px solid ${owed>0?C.amber:C.mint}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div>
                                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{bi.description}</div>
                                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{fmt(bi.date)}{bi.method&&` · ${bi.method}`}</div>
                                <div style={{fontSize:12,marginTop:6,display:"flex",gap:10}}>
                                  <span>Charged: <b>{currency(bi.amount)}</b></span>
                                  <span style={{color:"#4a9e89"}}>Paid: <b>{currency(bi.paid)}</b></span>
                                  {owed>0&&<span style={{color:"#a07830"}}>Owes: <b>{currency(owed)}</b></span>}
                                </div>
                                {bi.note&&<div style={{fontSize:11,color:C.muted,marginTop:4,fontStyle:"italic"}}>Note: {bi.note}</div>}
                              </div>
                              <Btn small variant="ghost" onClick={()=>{setBillForm({...bi});setEditBillId(bi.id);}}>Edit</Btn>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FILES TAB */}
              {tab==="files"&&(
                <div>
                  <input type="file" ref={fileRef} multiple accept="image/*,.pdf" style={{display:"none"}} onChange={handleFiles}/>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
                    <Btn onClick={()=>fileRef.current.click()}>Upload File</Btn>
                  </div>
                  <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:14,padding:32,textAlign:"center",cursor:"pointer",marginBottom:16,background:"#fff9fc"}}>
                    <div style={{fontSize:32,marginBottom:8}}>☁️</div>
                    <div style={{fontWeight:700,color:C.muted,fontSize:14}}>Tap to upload images or PDFs</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:4}}>Lab results, insurance cards, consent forms...</div>
                  </div>
                  {active.files.length===0&&<Empty icon="📄" msg="No files uploaded yet"/>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {active.files.map(fi=>(
                      <div key={fi.id} style={{background:C.card,borderRadius:12,padding:12,boxShadow:"0 1px 4px rgba(194,24,91,0.07)"}}>
                        {fi.type.startsWith("image/")?<img src={fi.dataUrl} alt={fi.name} style={{width:"100%",height:120,objectFit:"cover",borderRadius:8,marginBottom:8}}/>:<div style={{height:80,background:"#fce4ec",borderRadius:8,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📄</div>}
                        <div style={{fontSize:12,fontWeight:700,color:C.text,wordBreak:"break-word"}}>{fi.name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{fi.uploadedAt}</div>
                        <div style={{display:"flex",gap:6,marginTop:8}}>
                          <a href={fi.dataUrl} download={fi.name} style={{fontSize:11,fontWeight:700,color:C.accent,textDecoration:"none",background:"#fce4ec",padding:"3px 10px",borderRadius:6}}>Download</a>
                          <button onClick={()=>upActive(p=>({...p,files:p.files.filter(x=>x.id!==fi.id)}))} style={{fontSize:11,fontWeight:700,color:"#b05050",background:"#fee2e2",border:"none",padding:"3px 10px",borderRadius:6,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
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

      {/* QUICK APPT MODAL */}
      {quickAppt&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(61,36,56,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.card,borderRadius:20,padding:24,width:"100%",maxWidth:460,boxShadow:"0 8px 32px rgba(194,24,91,0.2)"}}>
            <div style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:4}}>Schedule Appointment</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Pick a patient and fill in the details</div>
            <div style={{marginBottom:12}}>
              <Lbl>Patient *</Lbl>
              <select value={quickPtId} onChange={e=>setQuickPtId(e.target.value)} style={{width:"100%",padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none"}}>
                <option value="">Select patient...</option>
                {patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <Row2>
              <F label="Date *"><Inp type="date" value={quickAppt.date} onChange={e=>setQuickAppt(f=>({...f,date:e.target.value}))}/></F>
              <F label="Time *"><Sel value={quickAppt.time} onChange={e=>setQuickAppt(f=>({...f,time:e.target.value}))} options={APPT_TIMES}/></F>
              <F label="Visit Type"><Sel value={quickAppt.type} onChange={e=>setQuickAppt(f=>({...f,type:e.target.value}))} options={VISIT_TYPES}/></F>
              <F label="Provider"><Inp value={quickAppt.provider} onChange={e=>setQuickAppt(f=>({...f,provider:e.target.value}))}/></F>
              <F label="Notes" full><Inp value={quickAppt.notes} placeholder="Optional notes..." onChange={e=>setQuickAppt(f=>({...f,notes:e.target.value}))}/></F>
            </Row2>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <Btn onClick={saveQuickAppt}>Save Appointment</Btn>
              <Btn variant="ghost" onClick={()=>{setQuickAppt(null);setQuickPtId("");}}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {showInvoice&&active&&<InvoiceModal patient={active} onClose={()=>setShowInvoice(false)}/>}

      {/* CONSENT MODAL */}
      {showConsent&&active&&<ConsentModal patient={active} onSave={saveConsent} onClose={()=>setShowConsent(false)}/>}

    </div>
  );
}
