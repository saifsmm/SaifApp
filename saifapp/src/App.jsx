import { useState, useEffect, useCallback } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0a",
  surface: "#111111",
  surfaceHover: "#161616",
  border: "#1e1e1e",
  divider: "#181818",
  text: "#e8e8e8",
  textMuted: "#5a5a5a",
  textSub: "#8a8a8a",
  emerald: "#1a6b4a",
  emeraldBright: "#22c77a",
  emeraldDim: "#134d36",
  emeraldGlow: "rgba(34,199,122,0.08)",
  red: "#c0392b",
  redDim: "rgba(192,57,43,0.12)",
};

const font = `'DM Sans', 'Helvetica Neue', Arial, sans-serif`;

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; color: ${C.text}; font-family: ${font}; -webkit-font-smoothing: antialiased; overflow: hidden; }
    ::-webkit-scrollbar { width: 2px; } 
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 1px; }
    input, select, textarea { font-family: ${font}; }
    * { -webkit-tap-highlight-color: transparent; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
    }
    .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .scale-in { animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both; }

    .btn-tap {
      transition: transform 0.12s ease, background 0.15s ease, opacity 0.12s ease;
      cursor: pointer;
      user-select: none;
    }
    .btn-tap:active { transform: scale(0.95); opacity: 0.8; }
  `}</style>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

const fmtFull = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const load = (key, def) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
};
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Label({ children, style }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, ...style }}>
      {children}
    </span>
  );
}

function BigNumber({ value, prefix = "", suffix = "", style }) {
  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, letterSpacing: "-0.02em", ...style }}>
      {prefix}{value}{suffix}
    </span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "btn-tap" : ""}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = C.emeraldBright, style }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden", ...style }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 1, transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

// ─── SLIDER ───────────────────────────────────────────────────────────────────
function Slider({ min, max, value, onChange, label, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Label style={{ width: 90, flexShrink: 0 }}>{label}</Label>
      <div style={{ flex: 1, position: "relative" }}>
        <style>{`
          .saif-slider { -webkit-appearance:none; appearance:none; width:100%; height:2px; background:linear-gradient(to right, ${C.emeraldBright} 0%, ${C.emeraldBright} ${((value - min) / (max - min)) * 100}%, ${C.border} ${((value - min) / (max - min)) * 100}%, ${C.border} 100%); outline:none; border-radius:1px; cursor:pointer; }
          .saif-slider::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:${C.emeraldBright}; border-radius:50%; cursor:pointer; border:2px solid ${C.bg}; box-shadow:0 0 0 1px ${C.emeraldBright}; transition:transform 0.12s ease; }
          .saif-slider:active::-webkit-slider-thumb { transform:scale(1.3); }
        `}</style>
        <input
          type="range" min={min} max={max} step={min === 4 ? 0.5 : 1} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="saif-slider"
        />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: C.emeraldBright, width: 36, textAlign: "right" }}>
        {display || value}
      </span>
    </div>
  );
}

// ─── SEGMENTED ────────────────────────────────────────────────────────────────
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt}
          className="btn-tap"
          onClick={() => onChange(opt)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${value === opt ? C.emeraldBright : C.border}`,
            background: value === opt ? C.emeraldGlow : "transparent",
            color: value === opt ? C.emeraldBright : C.textSub,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── MINI LINE CHART ──────────────────────────────────────────────────────────
function LineChart({ data, height = 80, color = C.emeraldBright, label }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Label>Not enough data</Label>
    </div>
  );
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.8 - h * 0.1}`).join(" ");
  return (
    <div>
      {label && <Label style={{ display:"block", marginBottom: 8 }}>{label}</Label>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color} />
      </svg>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="scale-in" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"16px 16px 0 0", padding:28, width:"100%", maxWidth:480, paddingBottom:40 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>{title}</span>
          <button onClick={onClose} className="btn-tap" style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label style={{ display:"block", marginBottom:8 }}>{label}</Label>
      <input {...props} style={{
        width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
        padding:"12px 14px", color:C.text, fontSize:15, outline:"none",
        fontFamily: font,
        transition:"border-color 0.15s",
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = C.emeraldBright}
      onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label style={{ display:"block", marginBottom:8 }}>{label}</Label>
      <select value={value} onChange={onChange} style={{
        width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
        padding:"12px 14px", color:C.text, fontSize:15, outline:"none",
        fontFamily: font, cursor:"pointer", appearance:"none",
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PrimaryBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} className="btn-tap" style={{
      width:"100%", background:C.emerald, border:"none", borderRadius:10,
      padding:"14px", color:"#fff", fontSize:15, fontWeight:600,
      cursor:"pointer", letterSpacing:"0.02em", ...style,
    }}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════════════════════

// ─── TODAY ────────────────────────────────────────────────────────────────────
function TodayScreen({ data, onUpdate }) {
  const { workFocus, study, cycling, sleep, mood, streak } = data;

  const calcScore = (d) => {
    let s = 0;
    s += (d.workFocus / 2) * 2;   // 0–2
    s += (d.study / 2) * 2;        // 0–2
    s += d.cycling ? 1.5 : 0;      // 0–1.5
    s += ((d.sleep - 4) / 5) * 2;  // 0–2
    s += ((d.mood - 1) / 4) * 2.5; // 0–2.5
    return Math.min(10, parseFloat(s.toFixed(1)));
  };

  const score = calcScore(data);

  const scoreColor = score >= 8 ? C.emeraldBright : score >= 5 ? C.textSub : C.red;

  return (
    <div className="fade-up" style={{ padding:"32px 20px 0" }}>
      {/* Score */}
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <Label>Daily Score</Label>
        <div style={{ marginTop:6 }}>
          <BigNumber value={score.toFixed(1)} style={{ fontSize:80, color: scoreColor, lineHeight:1 }} />
          <span style={{ fontSize:24, color:C.textMuted, fontFamily:"'DM Mono',monospace" }}>/10</span>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
        {/* Work Focus */}
        <Card>
          <Label>Work Focus</Label>
          <div style={{ marginTop:12 }}>
            <Segmented options={[0,1,2]} value={workFocus} onChange={v => onUpdate({ workFocus: v })} />
          </div>
        </Card>

        {/* Study */}
        <Card>
          <Label>Study</Label>
          <div style={{ marginTop:12 }}>
            <Segmented options={[0,1,2]} value={study} onChange={v => onUpdate({ study: v })} />
          </div>
        </Card>

        {/* Cycling */}
        <Card>
          <Label>Cycling</Label>
          <div style={{ marginTop:12 }}>
            <Segmented options={["No","Yes"]} value={cycling ? "Yes" : "No"} onChange={v => onUpdate({ cycling: v === "Yes" })} />
          </div>
        </Card>

        {/* Sleep */}
        <Card>
          <Slider min={4} max={9} value={sleep} onChange={v => onUpdate({ sleep: v })} label="Sleep" display={`${sleep}h`} />
        </Card>

        {/* Mood */}
        <Card>
          <Slider min={1} max={5} value={mood} onChange={v => onUpdate({ mood: v })} label="Mood" display={["","😐","🙁","😶","🙂","😊"][mood]} />
        </Card>
      </div>

      {/* Streak */}
      <div style={{ textAlign:"center", paddingBottom:4 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.textMuted }}>
          🔥 <span style={{ color:C.emeraldBright, fontWeight:500 }}>{streak}</span> day streak
        </span>
      </div>
    </div>
  );
}

// ─── MONEY ────────────────────────────────────────────────────────────────────
function MoneyScreen({ data, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [expense, setExpense] = useState({ amount: "", category: "Food", note: "" });

  const { bank, btc, btcPrice, income, expenses } = data;
  const netWorth = bank + btc * btcPrice;
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const savingsRate = income > 0 ? Math.max(0, ((income - totalExp) / income) * 100) : 0;

  const cats = ["Food","Transport","Housing","Health","Entertainment","Shopping","Other"];

  const addExpense = () => {
    if (!expense.amount || isNaN(+expense.amount)) return;
    onUpdate({ expenses: [...expenses, { amount: +expense.amount, category: expense.category, note: expense.note, date: Date.now() }] });
    setExpense({ amount: "", category: "Food", note: "" });
    setShowModal(false);
  };

  return (
    <div className="fade-up" style={{ padding:"32px 20px 0" }}>
      {/* Net Worth */}
      <div style={{ marginBottom:28 }}>
        <Label>Net Worth</Label>
        <div style={{ marginTop:6 }}>
          <BigNumber value={fmtFull(netWorth)} style={{ fontSize:40, letterSpacing:"-0.03em" }} />
        </div>
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <Label>Savings rate</Label>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.emeraldBright }}>{savingsRate.toFixed(1)}%</span>
          </div>
          <ProgressBar value={savingsRate} />
        </div>
      </div>

      {/* Four cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"Bank", value: fmt(bank) },
          { label:"BTC Value", value: fmt(btc * btcPrice) },
          { label:"Income", value: fmt(income) },
          { label:"Expenses", value: fmt(totalExp), warn: totalExp > income },
        ].map(({ label, value, warn }) => (
          <Card key={label} style={{ background: warn ? C.redDim : C.surface, borderColor: warn ? C.red : C.border }}>
            <Label>{label}</Label>
            <div style={{ marginTop:6 }}>
              <BigNumber value={value} style={{ fontSize:20, color: warn ? C.red : C.text }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Remaining */}
      <Card style={{ marginBottom:16, background:C.emeraldGlow, borderColor:C.emeraldDim }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Label>Remaining this month</Label>
          <BigNumber value={fmt(Math.max(0, income - totalExp))} style={{ fontSize:18, color:C.emeraldBright }} />
        </div>
      </Card>

      {/* Add Expense */}
      <PrimaryBtn onClick={() => setShowModal(true)}>+ Add Expense</PrimaryBtn>

      {/* Recent */}
      {expenses.slice(-3).reverse().map((e, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.divider}` }}>
          <span style={{ fontSize:13, color:C.textSub }}>{e.category}</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.red }}>−{fmt(e.amount)}</span>
        </div>
      ))}

      {showModal && (
        <Modal title="Add Expense" onClose={() => setShowModal(false)}>
          <Input label="Amount" type="number" placeholder="0.00" value={expense.amount} onChange={e => setExpense(p => ({...p, amount: e.target.value}))} />
          <Select label="Category" options={cats} value={expense.category} onChange={e => setExpense(p => ({...p, category: e.target.value}))} />
          <PrimaryBtn onClick={addExpense}>Save</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

// ─── GOALS ────────────────────────────────────────────────────────────────────
function GoalsScreen({ data, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", target:"", current:"", months:"" });

  const add = () => {
    if (!form.name || !form.target) return;
    onUpdate({ goals: [...data.goals, { id: Date.now(), name:form.name, target:+form.target, current:+form.current||0, months:+form.months||12 }] });
    setForm({ name:"", target:"", current:"", months:"" });
    setShowAdd(false);
  };

  const updateCurrent = (id, v) => {
    onUpdate({ goals: data.goals.map(g => g.id === id ? {...g, current: Math.min(g.target, Math.max(0, v))} : g) });
  };

  return (
    <div className="fade-up" style={{ padding:"32px 20px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <span style={{ fontSize:18, fontWeight:600 }}>Goals</span>
        <button onClick={() => setShowAdd(true)} className="btn-tap" style={{ background:C.emeraldGlow, border:`1px solid ${C.emeraldDim}`, borderRadius:8, padding:"6px 14px", color:C.emeraldBright, fontSize:13, fontWeight:500, cursor:"pointer" }}>+ Add</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {data.goals.map(g => {
          const pct = (g.current / g.target) * 100;
          const monthlyNeeded = (g.target - g.current) / Math.max(1, g.months);
          const onTrack = g.current / g.target >= (1 - g.months / 24);
          return (
            <Card key={g.id}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontWeight:500, fontSize:15 }}>{g.name}</span>
                <span style={{ fontSize:11, fontWeight:500, color: onTrack ? C.emeraldBright : C.red, background: onTrack ? C.emeraldGlow : C.redDim, padding:"2px 8px", borderRadius:4 }}>
                  {onTrack ? "On Track" : "Behind"}
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.textSub }}>{fmt(g.current)}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.textMuted }}>of {fmt(g.target)}</span>
              </div>
              <ProgressBar value={pct} style={{ marginBottom:10 }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <Label>{g.months}mo remaining</Label>
                <Label>{fmt(monthlyNeeded)}/mo needed</Label>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button onClick={() => updateCurrent(g.id, g.current - monthlyNeeded)} className="btn-tap" style={{ flex:1, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"6px", color:C.textMuted, cursor:"pointer", fontSize:13 }}>−</button>
                <button onClick={() => updateCurrent(g.id, g.current + monthlyNeeded)} className="btn-tap" style={{ flex:1, background:C.emeraldGlow, border:`1px solid ${C.emeraldDim}`, borderRadius:6, padding:"6px", color:C.emeraldBright, cursor:"pointer", fontSize:13 }}>+{fmt(monthlyNeeded)}</button>
              </div>
            </Card>
          );
        })}
      </div>

      {showAdd && (
        <Modal title="New Goal" onClose={() => setShowAdd(false)}>
          <Input label="Name" placeholder="e.g. Marriage Fund" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
          <Input label="Target Amount" type="number" placeholder="100000" value={form.target} onChange={e => setForm(p=>({...p,target:e.target.value}))} />
          <Input label="Current Amount" type="number" placeholder="0" value={form.current} onChange={e => setForm(p=>({...p,current:e.target.value}))} />
          <Input label="Months Remaining" type="number" placeholder="24" value={form.months} onChange={e => setForm(p=>({...p,months:e.target.value}))} />
          <PrimaryBtn onClick={add}>Add Goal</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

// ─── PERFORMANCE ──────────────────────────────────────────────────────────────
function PerformanceScreen({ history }) {
  const charts = [
    { label:"Net Worth", data: history.map(d => d.netWorth), color: C.emeraldBright },
    { label:"Monthly Income", data: history.map(d => d.income), color: "#7cb9e8" },
    { label:"Expenses", data: history.map(d => d.totalExp), color: C.red },
    { label:"Daily Score", data: history.map(d => d.score), color: "#c8a96e" },
    { label:"Cycling Days", data: history.map(d => d.cycling ? 1 : 0), color: "#9b89c4" },
  ];

  return (
    <div className="fade-up" style={{ padding:"32px 20px 0" }}>
      <span style={{ fontSize:18, fontWeight:600, display:"block", marginBottom:20 }}>Performance</span>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {charts.map(c => (
          <Card key={c.label}>
            <LineChart label={c.label} data={c.data} color={c.color} height={60} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FAMILY ───────────────────────────────────────────────────────────────────
function FamilyScreen({ data, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", target:"", contrib:"" });

  const sharedExp = (data.expenses||[]).filter(e => e.shared);
  const totalShared = sharedExp.reduce((s,e) => s+e.amount, 0);
  const myContrib = totalShared * (data.myContribPct / 100);

  const addGoal = () => {
    if (!form.name || !form.target) return;
    onUpdate({ familyGoals: [...(data.familyGoals||[]), { id:Date.now(), name:form.name, target:+form.target, current:0 }] });
    setForm({ name:"", target:"", contrib:"" });
    setShowAdd(false);
  };

  return (
    <div className="fade-up" style={{ padding:"32px 20px 0" }}>
      <span style={{ fontSize:18, fontWeight:600, display:"block", marginBottom:20 }}>Family</span>

      {/* Shared summary */}
      <Card style={{ marginBottom:12, background:C.emeraldGlow, borderColor:C.emeraldDim }}>
        <Label>Total Shared Expenses</Label>
        <BigNumber value={fmt(totalShared)} style={{ fontSize:28, display:"block", marginTop:4, color:C.emeraldBright }} />
        <div style={{ marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <Label>My contribution ({data.myContribPct}%)</Label>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.textSub }}>{fmt(myContrib)}</span>
          </div>
          <ProgressBar value={data.myContribPct} />
        </div>
      </Card>

      {/* Contribution split slider */}
      <Card style={{ marginBottom:16 }}>
        <Slider min={0} max={100} value={data.myContribPct} onChange={v => onUpdate({ myContribPct: v })} label="My Split" display={`${data.myContribPct}%`} />
      </Card>

      {/* Shared Goals */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <Label>Shared Goals</Label>
        <button onClick={() => setShowAdd(true)} className="btn-tap" style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 12px", color:C.textSub, fontSize:12, cursor:"pointer" }}>+ Add</button>
      </div>

      {(data.familyGoals||[]).map(g => {
        const pct = (g.current / g.target) * 100;
        return (
          <Card key={g.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:500 }}>{g.name}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.textSub }}>{fmt(g.current)} / {fmt(g.target)}</span>
            </div>
            <ProgressBar value={pct} />
          </Card>
        );
      })}

      {/* Mark shared expenses */}
      <Label style={{ display:"block", marginTop:20, marginBottom:10 }}>Recent Expenses</Label>
      {(data.expenses||[]).slice(-5).reverse().map((e, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.divider}` }}>
          <div>
            <span style={{ fontSize:13 }}>{e.category}</span>
            <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>{fmt(e.amount)}</span>
          </div>
          <button className="btn-tap" onClick={() => {
            const updated = [...data.expenses];
            const idx = data.expenses.length - 1 - i;
            updated[idx] = { ...updated[idx], shared: !updated[idx].shared };
            onUpdate({ expenses: updated });
          }} style={{
            background: e.shared ? C.emeraldGlow : "none",
            border:`1px solid ${e.shared ? C.emeraldBright : C.border}`,
            borderRadius:6, padding:"4px 10px",
            color: e.shared ? C.emeraldBright : C.textMuted,
            fontSize:11, cursor:"pointer",
          }}>
            {e.shared ? "Shared" : "Personal"}
          </button>
        </div>
      ))}

      {showAdd && (
        <Modal title="Shared Goal" onClose={() => setShowAdd(false)}>
          <Input label="Name" placeholder="e.g. Family Vacation" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
          <Input label="Target" type="number" placeholder="10000" value={form.target} onChange={e => setForm(p=>({...p,target:e.target.value}))} />
          <PrimaryBtn onClick={addGoal}>Add Goal</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

const NAV = [
  { id:"today",   icon:"◈", label:"Today" },
  { id:"money",   icon:"◎", label:"Money" },
  { id:"goals",   icon:"◇", label:"Goals" },
  { id:"perf",    icon:"⟋", label:"Perf." },
  { id:"family",  icon:"⊕", label:"Family" },
];

const defaultState = {
  // Today
  workFocus: 1, study: 1, cycling: false, sleep: 7, mood: 3, streak: 12,
  // Money
  bank: 18500, btc: 0.15, btcPrice: 67000, income: 8000, expenses: [],
  myContribPct: 50,
  // Goals
  goals: [
    { id:1, name:"Marriage Fund", target:50000, current:12000, months:24 },
    { id:2, name:"Car Upgrade", target:30000, current:8000, months:18 },
    { id:3, name:"1M Net Worth", target:1000000, current:55000, months:120 },
    { id:4, name:"BTC Target", target:1, current:0.15, months:36 },
  ],
  familyGoals: [
    { id:10, name:"Family Vacation", target:10000, current:3200 },
  ],
  // History (for charts - simulate some data)
  history: Array.from({length:8}, (_,i) => ({
    netWorth: 48000 + i*1200 + Math.random()*500,
    income: 7800 + Math.random()*400,
    totalExp: 3200 + Math.random()*600,
    score: 6 + Math.random()*2.5,
    cycling: Math.random() > 0.5,
  })),
};

export default function SaifApp() {
  const [tab, setTab] = useState("today");
  const [state, setState] = useState(() => load("saifapp_v1", defaultState));

  useEffect(() => { save("saifapp_v1", state); }, [state]);

  const update = useCallback((patch) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const screens = {
    today: <TodayScreen data={state} onUpdate={update} />,
    money: <MoneyScreen data={state} onUpdate={update} />,
    goals: <GoalsScreen data={state} onUpdate={update} />,
    perf:  <PerformanceScreen history={state.history} />,
    family:<FamilyScreen data={state} onUpdate={update} />,
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto", background:C.bg, position:"relative", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color:C.emeraldBright, letterSpacing:"0.05em" }}>SAIFAPP</span>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.emeraldBright, animation:"pulse 2s ease-in-out infinite" }} />
            <Label>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</Label>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:C.divider, margin:"16px 0 0" }} />

        {/* Screen */}
        <div key={tab} style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {screens[tab]}
          <div style={{ height:20 }} />
        </div>

        {/* Nav */}
        <div style={{ flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.bg, paddingBottom:"env(safe-area-inset-bottom,8px)" }}>
          <div style={{ display:"flex" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} className="btn-tap"
                style={{
                  flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                  padding:"12px 4px", background:"none", border:"none", cursor:"pointer",
                  color: tab === n.id ? C.emeraldBright : C.textMuted,
                  transition:"color 0.15s ease",
                  position:"relative",
                }}>
                {tab === n.id && (
                  <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:32, height:2, background:C.emeraldBright, borderRadius:"0 0 2px 2px" }} />
                )}
                <span style={{ fontSize:16 }}>{n.icon}</span>
                <span style={{ fontSize:9, letterSpacing:"0.06em", textTransform:"uppercase", fontWeight: tab===n.id ? 600 : 400 }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
