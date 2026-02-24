import { useState, useCallback } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111",
  border: "#1e1e1e", divider: "#161616",
  text: "#e8e8e8", textMuted: "#4a4a4a", textSub: "#7a7a7a",
  emerald: "#1a6b4a", emeraldBright: "#22c77a", emeraldDim: "#134d36", emeraldGlow: "rgba(34,199,122,0.07)",
  red: "#c0392b", redDim: "rgba(192,57,43,0.1)",
};
const font = `'DM Sans','Helvetica Neue',Arial,sans-serif`;
const mono = `'DM Mono','Courier New',monospace`;

const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const aed = (n) => `AED ${Math.abs(Math.round(n)).toLocaleString()}`;
const today = () => new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
const monthLabel = () => new Date().toLocaleDateString("en-GB", { month:"long", year:"numeric" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0a0a0a;overflow:hidden;height:100%;touch-action:manipulation}
    body{font-family:${font};color:#e8e8e8;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#222}
    input,select,textarea{font-family:${font};color:#e8e8e8}
    *{-webkit-tap-highlight-color:transparent;outline:none}
    @keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes si{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
    @keyframes dot{0%,100%{opacity:1}50%{opacity:0.25}}
    .up{animation:up 0.32s cubic-bezier(0.16,1,0.3,1) both}
    .si{animation:si 0.22s cubic-bezier(0.16,1,0.3,1) both}
    .tap{cursor:pointer;user-select:none;-webkit-user-select:none;transition:opacity 0.1s,transform 0.1s}
    .tap:active{opacity:0.6;transform:scale(0.96)}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  `}</style>
);

// ── PRIMITIVES ──────────────────────────────────────────────────────────────
const L = ({ t, s }) => <span style={{ fontSize:10, fontWeight:300, letterSpacing:"0.12em", textTransform:"uppercase", color:C.textMuted, ...s }}>{t}</span>;

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} className={onClick ? "tap" : ""}
      style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", ...style }}>
      {children}
    </div>
  );
}

function Bar({ val, max, warn }) {
  const pct = Math.min(100, Math.max(0, (val / (max||1)) * 100));
  const color = warn ? (pct > 90 ? C.red : pct > 70 ? "#d4a017" : C.emeraldBright) : C.emeraldBright;
  return (
    <div style={{ height:2, background:C.border, borderRadius:1, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, transition:"width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function PBtn({ label, onClick, style }) {
  return (
    <button onClick={onClick} className="tap"
      style={{ width:"100%", background:C.emerald, border:"none", borderRadius:11, padding:"15px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", letterSpacing:"0.01em", ...style }}>
      {label}
    </button>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="si" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ fontSize:17, fontWeight:600 }}>{title}</span>
          <button onClick={onClose} className="tap" style={{ background:"none", border:"none", color:C.textSub, fontSize:24, cursor:"pointer", lineHeight:1, padding:"0 4px" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      {label && <L t={label} s={{ display:"block", marginBottom:8 }} />}
      <input {...props}
        style={{ width:"100%", background:C.bg, border:`1px solid ${focused ? C.emeraldBright : C.border}`, borderRadius:10, padding:"13px 15px", color:C.text, fontSize:16, transition:"border-color 0.15s", ...props.style }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

// ── NAV ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"money",  icon:"◎", label:"Money"   },
  { id:"saving", icon:"◈", label:"Saving"  },
  { id:"cycling",icon:"⟳", label:"Cycling" },
];

// ══════════════════════════════════════════════════════════════════════════════
// MONEY SCREEN
// Three sections: Income entries, Bills/expenses, Summary
// ══════════════════════════════════════════════════════════════════════════════
function MoneyScreen({ data, onUpdate }) {
  const [sheet, setSheet] = useState(null); // 'income' | 'bill'
  const [incomeForm, setIncomeForm] = useState({ label:"", amount:"" });
  const [billForm, setBillForm] = useState({ label:"", amount:"" });

  const mk = (() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}`; })();
  const incomes = (data.incomes || []).filter(i => i.month === mk);
  const bills   = (data.bills   || []).filter(b => b.month === mk);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalBills  = bills.reduce((s, b) => s + b.amount, 0);
  const leftover    = totalIncome - totalBills;

  const addIncome = () => {
    if (!incomeForm.amount || isNaN(+incomeForm.amount)) return;
    const entry = { id:uid(), label:incomeForm.label||"Commission", amount:+incomeForm.amount, date:today(), month:mk };
    onUpdate({ incomes:[...(data.incomes||[]), entry] });
    setIncomeForm({ label:"", amount:"" });
    setSheet(null);
  };

  const addBill = () => {
    if (!billForm.amount || isNaN(+billForm.amount)) return;
    const entry = { id:uid(), label:billForm.label||"Payment", amount:+billForm.amount, date:today(), month:mk };
    onUpdate({ bills:[...(data.bills||[]), entry] });
    setBillForm({ label:"", amount:"" });
    setSheet(null);
  };

  const delIncome = (id) => onUpdate({ incomes:(data.incomes||[]).filter(i=>i.id!==id) });
  const delBill   = (id) => onUpdate({ bills:(data.bills||[]).filter(b=>b.id!==id) });

  return (
    <div className="up" style={{ padding:"28px 20px 0" }}>
      {/* Month */}
      <L t={monthLabel()} s={{ display:"block", marginBottom:6 }} />

      {/* Big summary */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:mono, fontSize:42, fontWeight:500, letterSpacing:"-0.03em", color: leftover < 0 ? C.red : C.text, lineHeight:1 }}>
          {leftover < 0 ? "−" : ""}{aed(leftover)}
        </div>
        <div style={{ fontSize:13, color:C.textSub, marginTop:6 }}>
          left after bills
        </div>
      </div>

      {/* Income block */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <L t="Income this month" />
            <div style={{ fontFamily:mono, fontSize:22, fontWeight:500, color:C.emeraldBright, marginTop:3 }}>{aed(totalIncome)}</div>
          </div>
          <button onClick={() => setSheet("income")} className="tap"
            style={{ background:C.emeraldGlow, border:`1px solid ${C.emeraldDim}`, borderRadius:9, padding:"8px 16px", color:C.emeraldBright, fontSize:13, fontWeight:500, cursor:"pointer" }}>
            + Add
          </button>
        </div>
        {incomes.length === 0 && (
          <div style={{ padding:"14px 0", borderTop:`1px solid ${C.divider}` }}>
            <span style={{ fontSize:13, color:C.textMuted }}>No income logged yet</span>
          </div>
        )}
        {incomes.map(i => (
          <div key={i.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderTop:`1px solid ${C.divider}` }}>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>{i.label}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{i.date}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontFamily:mono, fontSize:14, color:C.emeraldBright }}>+{aed(i.amount)}</span>
              <button className="tap" onClick={() => delIncome(i.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bills block */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <L t="Bills & Payments" />
            <div style={{ fontFamily:mono, fontSize:22, fontWeight:500, color: totalBills > totalIncome ? C.red : C.text, marginTop:3 }}>{aed(totalBills)}</div>
          </div>
          <button onClick={() => setSheet("bill")} className="tap"
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:9, padding:"8px 16px", color:C.textSub, fontSize:13, fontWeight:500, cursor:"pointer" }}>
            + Add
          </button>
        </div>
        {bills.length === 0 && (
          <div style={{ padding:"14px 0", borderTop:`1px solid ${C.divider}` }}>
            <span style={{ fontSize:13, color:C.textMuted }}>No bills added yet</span>
          </div>
        )}
        {bills.map(b => (
          <div key={b.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderTop:`1px solid ${C.divider}` }}>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>{b.label}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{b.date}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontFamily:mono, fontSize:14, color:C.red }}>−{aed(b.amount)}</span>
              <button className="tap" onClick={() => delBill(b.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Sheets */}
      {sheet === "income" && (
        <Sheet title="Add Income" onClose={() => setSheet(null)}>
          <Field label="Source / Description" placeholder="e.g. Commission — Al Barsha deal" value={incomeForm.label} onChange={e => setIncomeForm(p => ({...p, label:e.target.value}))} />
          <Field label="Amount (AED)" type="number" placeholder="5000" value={incomeForm.amount} onChange={e => setIncomeForm(p => ({...p, amount:e.target.value}))} />
          <PBtn label="Add to Income" onClick={addIncome} />
        </Sheet>
      )}
      {sheet === "bill" && (
        <Sheet title="Add Bill / Payment" onClose={() => setSheet(null)}>
          <Field label="What is this for?" placeholder="e.g. Rent, Car loan, School fees" value={billForm.label} onChange={e => setBillForm(p => ({...p, label:e.target.value}))} />
          <Field label="Amount (AED)" type="number" placeholder="3000" value={billForm.amount} onChange={e => setBillForm(p => ({...p, amount:e.target.value}))} />
          <PBtn label="Add Bill" onClick={addBill} />
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SAVING SCREEN  — joint account with wife
// ══════════════════════════════════════════════════════════════════════════════
function SavingScreen({ data, onUpdate }) {
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ who:"me", amount:"", note:"" });

  const transfers = data.transfers || [];
  const myTotal   = transfers.filter(t => t.who === "me").reduce((s,t) => s+t.amount, 0);
  const herTotal  = transfers.filter(t => t.who === "wife").reduce((s,t) => s+t.amount, 0);
  const total     = myTotal + herTotal;

  const add = () => {
    if (!form.amount || isNaN(+form.amount)) return;
    const t = { id:uid(), who:form.who, amount:+form.amount, note:form.note, date:today() };
    onUpdate({ transfers:[...transfers, t] });
    setForm({ who:"me", amount:"", note:"" });
    setSheet(false);
  };

  const del = (id) => onUpdate({ transfers:transfers.filter(t=>t.id!==id) });

  const myPct   = total > 0 ? (myTotal/total)*100 : 50;
  const herPct  = total > 0 ? (herTotal/total)*100 : 50;

  return (
    <div className="up" style={{ padding:"28px 20px 0" }}>
      <L t="Joint Savings Account" s={{ display:"block", marginBottom:8 }} />

      {/* Big total */}
      <div style={{ fontFamily:mono, fontSize:42, fontWeight:500, letterSpacing:"-0.03em", color:C.emeraldBright, lineHeight:1, marginBottom:6 }}>
        {aed(total)}
      </div>
      <div style={{ fontSize:13, color:C.textSub, marginBottom:24 }}>total saved together</div>

      {/* Split */}
      <Card style={{ marginBottom:20, background:C.emeraldGlow, borderColor:C.emeraldDim }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, marginBottom:14 }}>
          <div>
            <L t="You" s={{ display:"block", marginBottom:6 }} />
            <div style={{ fontFamily:mono, fontSize:20, fontWeight:500 }}>{aed(myTotal)}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>{myPct.toFixed(0)}% of total</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <L t="Wife" s={{ display:"block", marginBottom:6 }} />
            <div style={{ fontFamily:mono, fontSize:20, fontWeight:500 }}>{aed(herTotal)}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>{herPct.toFixed(0)}% of total</div>
          </div>
        </div>
        {total > 0 && (
          <div style={{ height:3, background:C.border, borderRadius:2, overflow:"hidden" }}>
            <div style={{ width:`${myPct}%`, height:"100%", background:C.emeraldBright, borderRadius:2 }} />
          </div>
        )}
      </Card>

      <PBtn label="+ Log a Transfer" onClick={() => setSheet(true)} style={{ marginBottom:24 }} />

      {/* History */}
      {transfers.length === 0 && (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <L t="No transfers logged yet" />
        </div>
      )}
      {transfers.slice().reverse().map(t => (
        <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderTop:`1px solid ${C.divider}` }}>
          <div>
            <div style={{ fontSize:14, fontWeight:500 }}>{t.who === "me" ? "👤 You" : "👩 Wife"}</div>
            {t.note && <div style={{ fontSize:12, color:C.textSub, marginTop:2 }}>{t.note}</div>}
            <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{t.date}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:mono, fontSize:15, color:C.emeraldBright }}>+{aed(t.amount)}</span>
            <button className="tap" onClick={() => del(t.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", lineHeight:1 }}>×</button>
          </div>
        </div>
      ))}

      {sheet && (
        <Sheet title="Log Transfer to Savings" onClose={() => setSheet(false)}>
          <div style={{ marginBottom:16 }}>
            <L t="Who transferred?" s={{ display:"block", marginBottom:10 }} />
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"me",l:"👤 You"},{v:"wife",l:"👩 Wife"}].map(o => (
                <button key={o.v} onClick={() => setForm(p=>({...p,who:o.v}))} className="tap"
                  style={{ flex:1, padding:"12px", borderRadius:10, border:`1px solid ${form.who===o.v?C.emeraldBright:C.border}`, background:form.who===o.v?C.emeraldGlow:"transparent", color:form.who===o.v?C.emeraldBright:C.textSub, fontSize:14, fontWeight:500, cursor:"pointer" }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <Field label="Amount (AED)" type="number" placeholder="2000" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} />
          <Field label="Note (optional)" placeholder="e.g. March savings" value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} />
          <PBtn label="Save" onClick={add} />
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CYCLING SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function CyclingScreen({ data, onUpdate }) {
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ date:"", km:"", avgSpeed:"", note:"", isRace:false });

  const rides = data.rides || [];

  const totalKm    = rides.reduce((s,r) => s + r.km, 0);
  const totalRides = rides.length;
  const races      = rides.filter(r => r.isRace);
  const avgSpeed   = rides.length > 0 ? (rides.reduce((s,r) => s + r.avgSpeed, 0) / rides.length) : 0;
  const bestSpeed  = rides.length > 0 ? Math.max(...rides.map(r => r.avgSpeed)) : 0;
  const longestRide= rides.length > 0 ? Math.max(...rides.map(r => r.km)) : 0;

  const add = () => {
    if (!form.km || isNaN(+form.km)) return;
    const r = { id:uid(), date:form.date||today(), km:+form.km, avgSpeed:+form.avgSpeed||0, note:form.note, isRace:form.isRace };
    onUpdate({ rides:[...rides, r] });
    setForm({ date:"", km:"", avgSpeed:"", note:"", isRace:false });
    setSheet(false);
  };

  const del = (id) => onUpdate({ rides:rides.filter(r=>r.id!==id) });

  // last 8 rides for mini chart
  const recent = rides.slice(-8);

  return (
    <div className="up" style={{ padding:"28px 20px 0" }}>
      <L t="Cycling" s={{ display:"block", marginBottom:8 }} />

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        <Card style={{ padding:"14px 14px" }}>
          <L t="Total KM" s={{ display:"block", marginBottom:5 }} />
          <div style={{ fontFamily:mono, fontSize:22, fontWeight:500, color:C.emeraldBright }}>{totalKm.toFixed(0)}</div>
          <div style={{ fontSize:10, color:C.textMuted }}>km</div>
        </Card>
        <Card style={{ padding:"14px 14px" }}>
          <L t="Rides" s={{ display:"block", marginBottom:5 }} />
          <div style={{ fontFamily:mono, fontSize:22, fontWeight:500 }}>{totalRides}</div>
          <div style={{ fontSize:10, color:C.textMuted }}>{races.length} race{races.length!==1?"s":""}</div>
        </Card>
        <Card style={{ padding:"14px 14px" }}>
          <L t="Avg Speed" s={{ display:"block", marginBottom:5 }} />
          <div style={{ fontFamily:mono, fontSize:22, fontWeight:500 }}>{avgSpeed > 0 ? avgSpeed.toFixed(1) : "—"}</div>
          <div style={{ fontSize:10, color:C.textMuted }}>km/h</div>
        </Card>
      </div>

      {/* Personal bests */}
      {rides.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          <Card style={{ padding:"14px 16px", borderColor:C.emeraldDim, background:C.emeraldGlow }}>
            <L t="Best Speed" s={{ display:"block", marginBottom:5 }} />
            <div style={{ fontFamily:mono, fontSize:18, color:C.emeraldBright }}>{bestSpeed.toFixed(1)} <span style={{ fontSize:11, color:C.textMuted }}>km/h</span></div>
          </Card>
          <Card style={{ padding:"14px 16px", borderColor:C.emeraldDim, background:C.emeraldGlow }}>
            <L t="Longest Ride" s={{ display:"block", marginBottom:5 }} />
            <div style={{ fontFamily:mono, fontSize:18, color:C.emeraldBright }}>{longestRide.toFixed(0)} <span style={{ fontSize:11, color:C.textMuted }}>km</span></div>
          </Card>
        </div>
      )}

      {/* Mini KM chart */}
      {recent.length >= 2 && (
        <Card style={{ marginBottom:20 }}>
          <L t="Last rides — km" s={{ display:"block", marginBottom:10 }} />
          <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:48 }}>
            {recent.map((r,i) => {
              const maxKm = Math.max(...recent.map(x=>x.km));
              const h = Math.max(6, (r.km/maxKm)*48);
              return (
                <div key={r.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", height:h, background:r.isRace?C.amber:C.emeraldBright, borderRadius:3, opacity: i===recent.length-1?1:0.5, transition:"height 0.4s" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <L t="older" />
            <L t="latest" />
          </div>
        </Card>
      )}

      <PBtn label="+ Log a Ride" onClick={() => setSheet(true)} style={{ marginBottom:20 }} />

      {/* Ride history */}
      {rides.length === 0 && (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <L t="No rides logged yet" />
        </div>
      )}
      {rides.slice().reverse().map(r => (
        <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"13px 0", borderTop:`1px solid ${C.divider}` }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:14, fontWeight:600, fontFamily:mono }}>{r.km} km</span>
              {r.isRace && <span style={{ fontSize:10, fontWeight:600, color:"#d4a017", background:"rgba(212,160,23,0.1)", padding:"2px 8px", borderRadius:4, letterSpacing:"0.06em" }}>RACE</span>}
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {r.avgSpeed > 0 && <span style={{ fontSize:12, color:C.textSub }}>{r.avgSpeed} km/h avg</span>}
              <span style={{ fontSize:12, color:C.textMuted }}>{r.date}</span>
            </div>
            {r.note && <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>{r.note}</div>}
          </div>
          <button className="tap" onClick={() => del(r.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", lineHeight:1, padding:"0 0 0 12px" }}>×</button>
        </div>
      ))}

      {sheet && (
        <Sheet title="Log a Ride" onClose={() => setSheet(false)}>
          <div style={{ marginBottom:16 }}>
            <L t="Type" s={{ display:"block", marginBottom:10 }} />
            <div style={{ display:"flex", gap:8 }}>
              {[{v:false,l:"🚴 Training"},{v:true,l:"🏁 Race"}].map(o => (
                <button key={String(o.v)} onClick={() => setForm(p=>({...p,isRace:o.v}))} className="tap"
                  style={{ flex:1, padding:"12px", borderRadius:10, border:`1px solid ${form.isRace===o.v?C.emeraldBright:C.border}`, background:form.isRace===o.v?C.emeraldGlow:"transparent", color:form.isRace===o.v?C.emeraldBright:C.textSub, fontSize:13, fontWeight:500, cursor:"pointer" }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <Field label="Date" type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))}
            style={{ colorScheme:"dark" }} />
          <Field label="Distance (km)" type="number" placeholder="45" value={form.km} onChange={e => setForm(p=>({...p,km:e.target.value}))} />
          <Field label="Average Speed (km/h)" type="number" placeholder="28" value={form.avgSpeed} onChange={e => setForm(p=>({...p,avgSpeed:e.target.value}))} />
          <Field label="Note (optional)" placeholder="e.g. Al Qudra loop, felt strong" value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} />
          <PBtn label="Save Ride" onClick={add} />
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
const DEFAULT = { incomes:[], bills:[], transfers:[], rides:[] };

export default function SaifApp() {
  const [tab, setTab] = useState("money");
  const [state, setState] = useState(() => load("saifapp_v3", DEFAULT));

  const update = useCallback((patch) => {
    setState(s => {
      const next = { ...s, ...patch };
      save("saifapp_v3", next);
      return next;
    });
  }, []);

  const screens = {
    money:   <MoneyScreen   data={state} onUpdate={update} />,
    saving:  <SavingScreen  data={state} onUpdate={update} />,
    cycling: <CyclingScreen data={state} onUpdate={update} />,
  };

  return (
    <>
      <GS />
      <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:430, margin:"0 auto", background:C.bg, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"22px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontFamily:mono, fontSize:14, fontWeight:500, color:C.emeraldBright, letterSpacing:"0.05em" }}>SAIFAPP</span>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.emeraldBright, animation:"dot 2.5s ease infinite" }} />
            <L t={new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})} />
          </div>
        </div>

        <div style={{ height:1, background:C.divider, margin:"18px 0 0", flexShrink:0 }} />

        {/* Screen */}
        <div key={tab} style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {screens[tab]}
          <div style={{ height:28 }} />
        </div>

        {/* Bottom Nav */}
        <div style={{ flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.bg, paddingBottom:"env(safe-area-inset-bottom,10px)" }}>
          <div style={{ display:"flex" }}>
            {TABS.map(n => {
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)} className="tap"
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"13px 0 10px", background:"none", border:"none", cursor:"pointer", color:active?C.emeraldBright:C.textMuted, position:"relative", transition:"color 0.15s" }}>
                  {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:24, height:2, background:C.emeraldBright, borderRadius:"0 0 2px 2px" }} />}
                  <span style={{ fontSize:17 }}>{n.icon}</span>
                  <span style={{ fontSize:10, letterSpacing:"0.07em", textTransform:"uppercase", fontWeight:active?600:300 }}>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
