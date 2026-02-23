import { useState, useEffect, useCallback } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111",
  border: "#1e1e1e", divider: "#161616",
  text: "#e8e8e8", textMuted: "#5a5a5a", textSub: "#8a8a8a",
  emerald: "#1a6b4a", emeraldBright: "#22c77a", emeraldDim: "#134d36", emeraldGlow: "rgba(34,199,122,0.07)",
  red: "#c0392b", redDim: "rgba(192,57,43,0.1)",
  amber: "#d4a017",
};
const font = `'DM Sans', 'Helvetica Neue', Arial, sans-serif`;
const mono = `'DM Mono', 'Courier New', monospace`;

const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const aed = (n, short = false) => {
  if (short) {
    if (Math.abs(n) >= 1000000) return `AED ${(n/1000000).toFixed(2)}M`;
    if (Math.abs(n) >= 1000) return `AED ${(n/1000).toFixed(1)}K`;
    return `AED ${Math.round(n).toLocaleString()}`;
  }
  return `AED ${Math.round(n).toLocaleString()}`;
};

const today = () => new Date().toISOString().split("T")[0];
const monthKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}`; };

const CATS = [
  { id:"rent",       label:"Rent",               icon:"🏠" },
  { id:"groceries",  label:"Groceries",           icon:"🛒" },
  { id:"restaurant", label:"Restaurants",         icon:"🍽️" },
  { id:"transport",  label:"Transport",           icon:"🚗" },
  { id:"phone",      label:"Phone & Internet",    icon:"📱" },
  { id:"utilities",  label:"Electricity & Water", icon:"💡" },
  { id:"kids",       label:"Kids",                icon:"👶" },
  { id:"shopping",   label:"Shopping / Tabby",    icon:"🛍️" },
  { id:"personal",   label:"Personal",            icon:"👤" },
  { id:"fun",        label:"Fun & Entertainment", icon:"🎮" },
  { id:"other",      label:"Other",               icon:"📌" },
];
const catById = (id) => CATS.find(c => c.id === id) || CATS[CATS.length-1];

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0a0a0a;overflow:hidden;height:100%}
    body{font-family:${font};color:#e8e8e8;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#1e1e1e}
    input,select{font-family:${font}}
    *{-webkit-tap-highlight-color:transparent}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .fu{animation:fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both}
    .si{animation:scaleIn 0.22s cubic-bezier(0.16,1,0.3,1) both}
    .tap{transition:transform 0.1s ease,opacity 0.1s ease;cursor:pointer;user-select:none}
    .tap:active{transform:scale(0.95);opacity:0.75}
    .saif-range{-webkit-appearance:none;appearance:none;width:100%;height:2px;outline:none;border-radius:1px;cursor:pointer;background:#1e1e1e}
    .saif-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:#22c77a;border-radius:50%;border:2px solid #0a0a0a;box-shadow:0 0 0 1px #22c77a;transition:transform 0.1s}
    .saif-range:active::-webkit-slider-thumb{transform:scale(1.3)}
  `}</style>
);

const Lbl = ({ ch, style }) => <span style={{ fontSize:10, fontWeight:300, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted, ...style }}>{ch}</span>;
const Div = ({ style }) => <div style={{ height:1, background:C.divider, ...style }} />;

function Card({ ch, style, onClick }) {
  return <div onClick={onClick} className={onClick?"tap":""} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", ...style }}>{ch}</div>;
}

function ProgressBar({ val, max=100, color=C.emeraldBright, warn, style }) {
  const pct = Math.min(100, Math.max(0, (val/(max||1))*100));
  const c = warn && pct>=90 ? C.red : warn && pct>=70 ? C.amber : color;
  return (
    <div style={{ height:2, background:C.border, borderRadius:1, overflow:"hidden", ...style }}>
      <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:1, transition:"width 0.5s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function Badge({ ch, color, bg }) {
  return <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em", color, background:bg, padding:"3px 8px", borderRadius:4 }}>{ch}</span>;
}

function PBtn({ ch, onClick, style }) {
  return <button onClick={onClick} className="tap" style={{ width:"100%", background:C.emerald, border:"none", borderRadius:10, padding:14, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", ...style }}>{ch}</button>;
}

function GBtn({ ch, onClick, style }) {
  return <button onClick={onClick} className="tap" style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", color:C.textSub, fontSize:13, cursor:"pointer", ...style }}>{ch}</button>;
}

function Seg({ opts, val, onChange }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {opts.map(o => {
        const v = o.v ?? o; const l = o.l ?? o; const active = val === v;
        return <button key={String(v)} className="tap" onClick={() => onChange(v)} style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${active?C.emeraldBright:C.border}`, background:active?C.emeraldGlow:"transparent", color:active?C.emeraldBright:C.textSub, fontSize:13, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>;
      })}
    </div>
  );
}

function FInput({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <Lbl ch={label} style={{ display:"block", marginBottom:7 }} />}
      <input {...props} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", color:C.text, fontSize:15, outline:"none", fontFamily:font, ...props.style }}
        onFocus={e=>e.target.style.borderColor=C.emeraldBright} onBlur={e=>e.target.style.borderColor=C.border} />
    </div>
  );
}

function FSel({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <Lbl ch={label} style={{ display:"block", marginBottom:7 }} />}
      <select value={value} onChange={onChange} style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", color:C.text, fontSize:15, outline:"none", fontFamily:font, cursor:"pointer", appearance:"none" }}>
        {options.map(o => <option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="si" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"18px 18px 0 0", padding:24, width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", paddingBottom:40 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>{title}</span>
          <button onClick={onClose} className="tap" style={{ background:"none", border:"none", color:C.textMuted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LineChart({ data, color=C.emeraldBright, height=56 }) {
  if (!data||data.length<2) return <div style={{ height, display:"flex", alignItems:"center" }}><Lbl ch="No history yet" /></div>;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const W=200, H=height;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/range)*H*0.8-H*0.1}`).join(" ");
  const last=pts.split(" ").at(-1).split(",");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height, overflow:"visible" }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

// TODAY
function TodayScreen({ data, onUpdate }) {
  const { workFocus, study, cycling, sleep, mood, streak } = data;
  const score = (() => {
    let s=0;
    s += (workFocus/2)*2.5;
    s += (study/2)*2;
    s += cycling ? 1.5 : 0;
    s += ((sleep-4)/5)*2;
    s += ((mood-1)/4)*2;
    return Math.min(10, parseFloat(s.toFixed(1)));
  })();
  const sc = score>=8 ? C.emeraldBright : score>=5 ? C.textSub : C.red;
  return (
    <div className="fu" style={{ padding:"28px 20px 0" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <Lbl ch="Daily Score" />
        <div style={{ marginTop:4 }}>
          <span style={{ fontFamily:mono, fontSize:76, fontWeight:500, color:sc, letterSpacing:"-0.03em", lineHeight:1 }}>{score.toFixed(1)}</span>
          <span style={{ fontFamily:mono, fontSize:22, color:C.textMuted }}>/10</span>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        <Card ch={<><Lbl ch="Work Focus" /><div style={{ marginTop:10 }}><Seg opts={[0,1,2]} val={workFocus} onChange={v=>onUpdate({workFocus:v})} /></div></>} />
        <Card ch={<><Lbl ch="Study" /><div style={{ marginTop:10 }}><Seg opts={[0,1,2]} val={study} onChange={v=>onUpdate({study:v})} /></div></>} />
        <Card ch={<><Lbl ch="Cycling" /><div style={{ marginTop:10 }}><Seg opts={[{v:false,l:"No"},{v:true,l:"Yes"}]} val={cycling} onChange={v=>onUpdate({cycling:v})} /></div></>} />
        <Card ch={<div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <Lbl ch="Sleep" />
            <span style={{ fontFamily:mono, fontSize:15, color:C.emeraldBright }}>{sleep}h</span>
          </div>
          <input type="range" min={4} max={9} step={0.5} value={sleep} onChange={e=>onUpdate({sleep:parseFloat(e.target.value)})}
            className="saif-range" style={{ background:`linear-gradient(to right,${C.emeraldBright} ${((sleep-4)/5)*100}%,${C.border} ${((sleep-4)/5)*100}%)` }} />
        </div>} />
        <Card ch={<div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <Lbl ch="Mood" />
            <span style={{ fontSize:20 }}>{"😞😐😶🙂😊"[mood-1]}</span>
          </div>
          <input type="range" min={1} max={5} step={1} value={mood} onChange={e=>onUpdate({mood:parseInt(e.target.value)})}
            className="saif-range" style={{ background:`linear-gradient(to right,${C.emeraldBright} ${((mood-1)/4)*100}%,${C.border} ${((mood-1)/4)*100}%)` }} />
        </div>} />
      </div>
      <div style={{ textAlign:"center", paddingBottom:8 }}>
        <span style={{ fontFamily:mono, fontSize:12, color:C.textMuted }}>🔥 <span style={{ color:C.emeraldBright }}>{streak}</span> day streak</span>
      </div>
    </div>
  );
}

// MONEY
function MoneyScreen({ data, onUpdate }) {
  const [modal, setModal] = useState(null);
  const [expForm, setExpForm] = useState({ amount:"", cat:"groceries", note:"" });
  const [btcForm, setBtcForm] = useState({ coins:"", buyPrice:"", currentPrice:"" });

  const mk = monthKey();
  const monthExp = (data.expenses||[]).filter(e=>e.month===mk);
  const totalSpent = monthExp.reduce((s,e)=>s+e.amount,0);
  const remaining = Math.max(0, (data.salary||0) - (data.fixedBills||0) - totalSpent);
  const savingsEst = Math.max(0, (data.salary||0) - (data.fixedBills||0) - totalSpent);
  const savingsPct = data.salary>0 ? (savingsEst/data.salary)*100 : 0;
  const btcAED = (data.btcCoins||0) * (data.btcCurrentPrice||0);
  const btcPnL = ((data.btcCurrentPrice||0) - (data.btcBuyPrice||0)) * (data.btcCoins||0);
  const netWorth = (data.bankBalance||0) + btcAED + (data.savings||0);
  const catSpend = {};
  monthExp.forEach(e=>{ catSpend[e.cat]=(catSpend[e.cat]||0)+e.amount; });

  const addExpense = () => {
    if (!expForm.amount||isNaN(+expForm.amount)) return;
    const e = { id:Date.now(), amount:+expForm.amount, cat:expForm.cat, note:expForm.note, date:today(), month:mk };
    onUpdate({ expenses:[...(data.expenses||[]),e] });
    setExpForm({ amount:"", cat:"groceries", note:"" });
    setModal(null);
  };

  const saveBtc = () => {
    onUpdate({ btcCoins:+btcForm.coins, btcBuyPrice:+btcForm.buyPrice, btcCurrentPrice:+btcForm.currentPrice });
    setModal(null);
  };

  return (
    <div className="fu" style={{ padding:"24px 20px 0" }}>
      <div style={{ marginBottom:20 }}>
        <Lbl ch="Total Net Worth" />
        <div style={{ fontFamily:mono, fontSize:34, fontWeight:500, letterSpacing:"-0.03em", marginTop:4 }}>{aed(netWorth)}</div>
      </div>

      {!data.salary ? (
        <Card ch={<div style={{ textAlign:"center", padding:"8px 0" }}>
          <Lbl ch="Set your monthly salary to get started" style={{ display:"block", marginBottom:12 }} />
          <PBtn ch="Setup Monthly Income →" onClick={()=>setModal("setup")} />
        </div>} style={{ marginBottom:12, borderColor:C.emeraldDim, background:C.emeraldGlow }} />
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Card ch={<><Lbl ch="Monthly Salary" /><div style={{ fontFamily:mono, fontSize:18, marginTop:4, color:C.emeraldBright }}>{aed(data.salary,true)}</div></>} onClick={()=>setModal("setup")} />
            <Card ch={<><Lbl ch="Fixed Bills" /><div style={{ fontFamily:mono, fontSize:18, marginTop:4, color:C.textSub }}>{aed(data.fixedBills||0,true)}</div></>} onClick={()=>setModal("setup")} />
            <Card ch={<><Lbl ch="Spent This Month" /><div style={{ fontFamily:mono, fontSize:18, marginTop:4, color:totalSpent>(data.salary*0.6)?C.red:C.text }}>{aed(totalSpent,true)}</div></>} />
            <Card ch={<><Lbl ch="Remaining" /><div style={{ fontFamily:mono, fontSize:18, marginTop:4, color:remaining>0?C.emeraldBright:C.red }}>{aed(remaining,true)}</div></>} />
          </div>

          <Card ch={<>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <Lbl ch="Savings Rate" />
              <span style={{ fontFamily:mono, fontSize:12, color:savingsPct>=20?C.emeraldBright:C.amber }}>{savingsPct.toFixed(1)}%</span>
            </div>
            <ProgressBar val={savingsPct} max={50} warn />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              <Lbl ch="Est. available to save" />
              <span style={{ fontFamily:mono, fontSize:12, color:C.textSub }}>{aed(savingsEst,true)}</span>
            </div>
          </>} style={{ marginBottom:10 }} />
        </>
      )}

      <Card ch={<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <Lbl ch="Bitcoin" />
            <div style={{ fontFamily:mono, fontSize:18, marginTop:4 }}>{aed(btcAED,true)}</div>
            <div style={{ fontFamily:mono, fontSize:11, color:C.textMuted, marginTop:2 }}>{data.btcCoins||0} BTC · Buy: {aed(data.btcBuyPrice||0,true)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <Lbl ch="P&L" />
            <div style={{ fontFamily:mono, fontSize:15, marginTop:4, color:btcPnL>=0?C.emeraldBright:C.red }}>{btcPnL>=0?"+":""}{aed(btcPnL,true)}</div>
          </div>
        </div>
      </>} onClick={()=>{ setBtcForm({coins:data.btcCoins||"",buyPrice:data.btcBuyPrice||"",currentPrice:data.btcCurrentPrice||""}); setModal("btc"); }} style={{ marginBottom:10 }} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Card ch={<><Lbl ch="Bank Balance" /><div style={{ fontFamily:mono, fontSize:16, marginTop:4 }}>{aed(data.bankBalance||0,true)}</div></>} onClick={()=>setModal("setup")} />
        <Card ch={<><Lbl ch="Savings Account" /><div style={{ fontFamily:mono, fontSize:16, marginTop:4, color:C.emeraldBright }}>{aed(data.savings||0,true)}</div></>} onClick={()=>setModal("setup")} />
      </div>

      {Object.keys(catSpend).length>0 && (
        <div style={{ marginBottom:16 }}>
          <Lbl ch="This Month by Category" style={{ display:"block", marginBottom:10 }} />
          {CATS.filter(c=>catSpend[c.id]).map(c => {
            const budget=(data.budgets||{})[c.id]||0;
            return (
              <div key={c.id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:13 }}>{c.icon} {c.label}</span>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontFamily:mono, fontSize:12, color:C.textSub }}>{aed(catSpend[c.id],true)}</span>
                    {budget>0 && <span style={{ fontFamily:mono, fontSize:10, color:C.textMuted }}>/ {aed(budget,true)}</span>}
                  </div>
                </div>
                {budget>0 && <ProgressBar val={catSpend[c.id]} max={budget} warn />}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:"flex", gap:10, marginBottom:8 }}>
        <PBtn ch="+ Add Expense" onClick={()=>setModal("expense")} />
        <GBtn ch="Budgets" onClick={()=>setModal("budget")} style={{ whiteSpace:"nowrap" }} />
      </div>

      {monthExp.length>0 && (
        <div style={{ marginTop:8 }}>
          <Lbl ch="Recent Expenses" style={{ display:"block", marginBottom:8 }} />
          {monthExp.slice(-7).reverse().map(e=>{
            const c=catById(e.cat);
            return (
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.divider}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:16 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.label}</div>
                    {e.note && <div style={{ fontSize:11, color:C.textMuted }}>{e.note}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:mono, fontSize:13, color:C.red }}>−{aed(e.amount,true)}</span>
                  <button className="tap" onClick={()=>onUpdate({expenses:(data.expenses||[]).filter(x=>x.id!==e.id)})}
                    style={{ background:"none", border:"none", color:C.textMuted, fontSize:17, cursor:"pointer", lineHeight:1 }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal==="expense" && <Modal title="Add Expense" onClose={()=>setModal(null)}>
        <FInput label="Amount (AED)" type="number" placeholder="0" value={expForm.amount} onChange={e=>setExpForm(p=>({...p,amount:e.target.value}))} />
        <FSel label="Category" options={CATS.map(c=>({v:c.id,l:`${c.icon} ${c.label}`}))} value={expForm.cat} onChange={e=>setExpForm(p=>({...p,cat:e.target.value}))} />
        <FInput label="Note (optional)" placeholder="e.g. Carrefour, Noon order..." value={expForm.note} onChange={e=>setExpForm(p=>({...p,note:e.target.value}))} />
        <PBtn ch="Save Expense" onClick={addExpense} />
      </Modal>}

      {modal==="setup" && <Modal title="Monthly Setup" onClose={()=>setModal(null)}>
        <FInput label="Monthly Salary (AED)" type="number" placeholder="15000" value={data.salary||""} onChange={e=>onUpdate({salary:+e.target.value})} />
        <FInput label="Fixed Bills / Rent total (AED)" type="number" placeholder="5000" value={data.fixedBills||""} onChange={e=>onUpdate({fixedBills:+e.target.value})} />
        <Div style={{ margin:"4px 0 18px" }} />
        <FInput label="Bank Balance (AED)" type="number" placeholder="0" value={data.bankBalance||""} onChange={e=>onUpdate({bankBalance:+e.target.value})} />
        <FInput label="Savings Account Balance (AED)" type="number" placeholder="0" value={data.savings||""} onChange={e=>onUpdate({savings:+e.target.value})} />
        <PBtn ch="Save" onClick={()=>setModal(null)} />
      </Modal>}

      {modal==="btc" && <Modal title="Bitcoin Holdings" onClose={()=>setModal(null)}>
        <FInput label="How many BTC you own" type="number" placeholder="0.05" value={btcForm.coins} onChange={e=>setBtcForm(p=>({...p,coins:e.target.value}))} />
        <FInput label="Your average buy price (AED)" type="number" placeholder="180000" value={btcForm.buyPrice} onChange={e=>setBtcForm(p=>({...p,buyPrice:e.target.value}))} />
        <FInput label="Current BTC price (AED)" type="number" placeholder="245000" value={btcForm.currentPrice} onChange={e=>setBtcForm(p=>({...p,currentPrice:e.target.value}))} />
        <div style={{ padding:"12px 14px", background:C.bg, borderRadius:8, marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <Lbl ch="Total Value" />
            <span style={{ fontFamily:mono, fontSize:14, color:C.emeraldBright }}>{aed((+btcForm.coins)*(+btcForm.currentPrice),true)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <Lbl ch="Profit / Loss" />
            <span style={{ fontFamily:mono, fontSize:14, color:((+btcForm.currentPrice)-(+btcForm.buyPrice))*(+btcForm.coins)>=0?C.emeraldBright:C.red }}>
              {aed(((+btcForm.currentPrice)-(+btcForm.buyPrice))*(+btcForm.coins),true)}
            </span>
          </div>
        </div>
        <PBtn ch="Save" onClick={saveBtc} />
      </Modal>}

      {modal==="budget" && <Modal title="Monthly Budgets" onClose={()=>setModal(null)}>
        <Lbl ch="Set AED limits per category" style={{ display:"block", marginBottom:16 }} />
        {CATS.map(c=>(
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <span style={{ width:24, textAlign:"center" }}>{c.icon}</span>
            <span style={{ flex:1, fontSize:13 }}>{c.label}</span>
            <input type="number" placeholder="0" value={(data.budgets||{})[c.id]||""}
              onChange={e=>onUpdate({budgets:{...(data.budgets||{}),[c.id]:+e.target.value}})}
              style={{ width:90, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 10px", color:C.text, fontSize:13, textAlign:"right", outline:"none", fontFamily:mono }}
              onFocus={e=>e.target.style.borderColor=C.emeraldBright} onBlur={e=>e.target.style.borderColor=C.border} />
          </div>
        ))}
        <PBtn ch="Done" onClick={()=>setModal(null)} />
      </Modal>}
    </div>
  );
}

// GOALS
function GoalsScreen({ data, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", target:"", current:"", months:"" });
  const add = () => {
    if (!form.name||!form.target) return;
    onUpdate({ goals:[...(data.goals||[]),{ id:Date.now(), name:form.name, target:+form.target, current:+form.current||0, months:+form.months||12 }] });
    setForm({ name:"", target:"", current:"", months:"" }); setModal(false);
  };
  const upd = (id,patch) => onUpdate({ goals:(data.goals||[]).map(g=>g.id===id?{...g,...patch}:g) });
  const rm = (id) => onUpdate({ goals:(data.goals||[]).filter(g=>g.id!==id) });
  return (
    <div className="fu" style={{ padding:"24px 20px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <span style={{ fontSize:18, fontWeight:600 }}>Goals</span>
        <GBtn ch="+ Add" onClick={()=>setModal(true)} />
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {(data.goals||[]).map(g => {
          const pct = Math.min(100,(g.current/g.target)*100);
          const mNeeded = (g.target-g.current)/Math.max(1,g.months);
          const onTrack = pct >= Math.max(0, (1-g.months/60)*100);
          return (
            <Card key={g.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontWeight:600, fontSize:15 }}>{g.name}</span>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Badge ch={onTrack?"On Track":"Behind"} color={onTrack?C.emeraldBright:C.red} bg={onTrack?C.emeraldGlow:C.redDim} />
                  <button className="tap" onClick={()=>rm(g.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:17, cursor:"pointer" }}>×</button>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontFamily:mono, fontSize:13, color:C.emeraldBright }}>{aed(g.current,true)}</span>
                <span style={{ fontFamily:mono, fontSize:13, color:C.textMuted }}>{aed(g.target,true)}</span>
              </div>
              <ProgressBar val={pct} style={{ marginBottom:8 }} />
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <Lbl ch={`${g.months} months left`} />
                <Lbl ch={`${aed(mNeeded,true)}/mo needed`} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="tap" onClick={()=>upd(g.id,{current:Math.max(0,g.current-mNeeded)})}
                  style={{ flex:1, background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:8, color:C.textMuted, cursor:"pointer", fontSize:13 }}>−</button>
                <button className="tap" onClick={()=>upd(g.id,{current:Math.min(g.target,g.current+mNeeded)})}
                  style={{ flex:2, background:C.emeraldGlow, border:`1px solid ${C.emeraldDim}`, borderRadius:7, padding:8, color:C.emeraldBright, cursor:"pointer", fontSize:13, fontWeight:500 }}>
                  +{aed(mNeeded,true)}
                </button>
              </div>
            </Card>
          );
        })}
        {!(data.goals||[]).length && <div style={{ textAlign:"center", padding:"40px 0" }}><Lbl ch="No goals yet. Add one." /></div>}
      </div>
      {modal && <Modal title="New Goal" onClose={()=>setModal(false)}>
        <FInput label="Goal Name" placeholder="e.g. Marriage Fund" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
        <FInput label="Target (AED)" type="number" placeholder="100000" value={form.target} onChange={e=>setForm(p=>({...p,target:e.target.value}))} />
        <FInput label="Current Amount (AED)" type="number" placeholder="0" value={form.current} onChange={e=>setForm(p=>({...p,current:e.target.value}))} />
        <FInput label="Months Remaining" type="number" placeholder="24" value={form.months} onChange={e=>setForm(p=>({...p,months:e.target.value}))} />
        <PBtn ch="Add Goal" onClick={add} />
      </Modal>}
    </div>
  );
}

// PERFORMANCE
function PerformanceScreen({ data }) {
  const h = data.history||[];
  const charts = [
    { label:"Net Worth (AED)", data:h.map(d=>d.netWorth||0), color:C.emeraldBright },
    { label:"Monthly Salary (AED)", data:h.map(d=>d.salary||0), color:"#7cb9e8" },
    { label:"Monthly Expenses (AED)", data:h.map(d=>d.expenses||0), color:C.red },
    { label:"Daily Score", data:h.map(d=>d.score||0), color:"#d4a017" },
    { label:"Study Sessions", data:h.map(d=>d.study||0), color:"#9b89c4" },
    { label:"Cycling", data:h.map(d=>d.cycling?1:0), color:"#a8d8a8" },
  ];
  return (
    <div className="fu" style={{ padding:"24px 20px 0" }}>
      <span style={{ fontSize:18, fontWeight:600, display:"block", marginBottom:20 }}>Performance</span>
      {h.length<2 ? (
        <Card ch={<div style={{ textAlign:"center", padding:"30px 0" }}><Lbl ch="Data builds as you use the app daily" /></div>} />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {charts.map(c=>(
            <Card key={c.label} ch={<>
              <Lbl ch={c.label} style={{ display:"block", marginBottom:10 }} />
              <LineChart data={c.data} color={c.color} height={56} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <Lbl ch={`Low: ${Math.min(...c.data).toLocaleString()}`} />
                <Lbl ch={`High: ${Math.max(...c.data).toLocaleString()}`} />
              </div>
            </>} />
          ))}
        </div>
      )}
    </div>
  );
}

// FAMILY
function FamilyScreen({ data, onUpdate }) {
  const [modal, setModal] = useState(null);
  const [tForm, setTForm] = useState({ amount:"", who:"me", note:"" });
  const [gForm, setGForm] = useState({ name:"", target:"" });

  const transfers = data.familyTransfers||[];
  const myTotal = transfers.filter(t=>t.who==="me").reduce((s,t)=>s+t.amount,0);
  const herTotal = transfers.filter(t=>t.who==="wife").reduce((s,t)=>s+t.amount,0);
  const totalSaved = myTotal+herTotal;

  const addTransfer = () => {
    if (!tForm.amount||isNaN(+tForm.amount)) return;
    onUpdate({ familyTransfers:[...transfers,{ id:Date.now(), amount:+tForm.amount, who:tForm.who, note:tForm.note, date:today() }] });
    setTForm({ amount:"", who:"me", note:"" }); setModal(null);
  };
  const addGoal = () => {
    if (!gForm.name||!gForm.target) return;
    onUpdate({ familyGoals:[...(data.familyGoals||[]),{ id:Date.now(), name:gForm.name, target:+gForm.target }] });
    setGForm({ name:"", target:"" }); setModal(null);
  };

  return (
    <div className="fu" style={{ padding:"24px 20px 0" }}>
      <span style={{ fontSize:18, fontWeight:600, display:"block", marginBottom:20 }}>Family Savings</span>

      <Card ch={<>
        <Lbl ch="Total Shared Savings" />
        <div style={{ fontFamily:mono, fontSize:34, fontWeight:500, color:C.emeraldBright, marginTop:4, letterSpacing:"-0.03em" }}>{aed(totalSaved)}</div>
        <Div style={{ margin:"14px 0" }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:totalSaved>0?12:0 }}>
          <div>
            <Lbl ch="My Contributions" style={{ display:"block", marginBottom:4 }} />
            <span style={{ fontFamily:mono, fontSize:18 }}>{aed(myTotal,true)}</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <Lbl ch="Wife's Contributions" style={{ display:"block", marginBottom:4 }} />
            <span style={{ fontFamily:mono, fontSize:18 }}>{aed(herTotal,true)}</span>
          </div>
        </div>
        {totalSaved>0 && <>
          <ProgressBar val={myTotal} max={totalSaved} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
            <Lbl ch={`Me · ${((myTotal/totalSaved)*100).toFixed(0)}%`} />
            <Lbl ch={`Wife · ${((herTotal/totalSaved)*100).toFixed(0)}%`} />
          </div>
        </>}
      </>} style={{ marginBottom:12, background:C.emeraldGlow, borderColor:C.emeraldDim }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <Lbl ch="Shared Goals" />
        <button className="tap" onClick={()=>setModal("goal")} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 12px", color:C.textSub, fontSize:12, cursor:"pointer" }}>+ Add</button>
      </div>

      {(data.familyGoals||[]).map(g=>{
        const pct = Math.min(100,(totalSaved/g.target)*100);
        return (
          <Card key={g.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:14, fontWeight:500 }}>{g.name}</span>
              <span style={{ fontFamily:mono, fontSize:11, color:C.textMuted }}>{aed(totalSaved,true)} / {aed(g.target,true)}</span>
            </div>
            <ProgressBar val={totalSaved} max={g.target} />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <Lbl ch={`${pct.toFixed(0)}% complete`} />
              <Lbl ch={`${aed(Math.max(0,g.target-totalSaved),true)} to go`} />
            </div>
          </Card>
        );
      })}

      <PBtn ch="+ Log Transfer to Savings" onClick={()=>setModal("transfer")} style={{ marginTop:8, marginBottom:16 }} />

      {transfers.length>0 && <>
        <Lbl ch="Transfer History" style={{ display:"block", marginBottom:10 }} />
        {transfers.slice(-10).reverse().map(t=>(
          <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.divider}` }}>
            <div>
              <span style={{ fontSize:13, fontWeight:500 }}>{t.who==="me"?"👤 Me":"👩 Wife"}</span>
              {t.note && <span style={{ fontSize:11, color:C.textMuted, marginLeft:8 }}>{t.note}</span>}
              <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{t.date}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:mono, fontSize:13, color:C.emeraldBright }}>+{aed(t.amount,true)}</span>
              <button className="tap" onClick={()=>onUpdate({familyTransfers:transfers.filter(x=>x.id!==t.id)})}
                style={{ background:"none", border:"none", color:C.textMuted, fontSize:17, cursor:"pointer" }}>×</button>
            </div>
          </div>
        ))}
      </>}

      {modal==="transfer" && <Modal title="Log Savings Transfer" onClose={()=>setModal(null)}>
        <FInput label="Amount (AED)" type="number" placeholder="1000" value={tForm.amount} onChange={e=>setTForm(p=>({...p,amount:e.target.value}))} />
        <div style={{ marginBottom:14 }}>
          <Lbl ch="Who transferred?" style={{ display:"block", marginBottom:8 }} />
          <Seg opts={[{v:"me",l:"👤 Me"},{v:"wife",l:"👩 Wife"}]} val={tForm.who} onChange={v=>setTForm(p=>({...p,who:v}))} />
        </div>
        <FInput label="Note (optional)" placeholder="e.g. January savings" value={tForm.note} onChange={e=>setTForm(p=>({...p,note:e.target.value}))} />
        <PBtn ch="Save Transfer" onClick={addTransfer} />
      </Modal>}

      {modal==="goal" && <Modal title="Shared Goal" onClose={()=>setModal(null)}>
        <FInput label="Goal Name" placeholder="e.g. Family Vacation" value={gForm.name} onChange={e=>setGForm(p=>({...p,name:e.target.value}))} />
        <FInput label="Target (AED)" type="number" placeholder="50000" value={gForm.target} onChange={e=>setGForm(p=>({...p,target:e.target.value}))} />
        <PBtn ch="Add Goal" onClick={addGoal} />
      </Modal>}
    </div>
  );
}

// MAIN
const NAV = [
  {id:"today",icon:"◈",label:"Today"},
  {id:"money",icon:"◎",label:"Money"},
  {id:"goals",icon:"◇",label:"Goals"},
  {id:"perf",icon:"⟋",label:"Perf."},
  {id:"family",icon:"⊕",label:"Family"},
];

const DEFAULT = {
  workFocus:1, study:1, cycling:false, sleep:7, mood:3, streak:0,
  salary:0, fixedBills:0, bankBalance:0, savings:0,
  btcCoins:0, btcBuyPrice:0, btcCurrentPrice:0,
  expenses:[], budgets:{},
  goals:[
    {id:1,name:"Marriage Fund",target:100000,current:0,months:24},
    {id:2,name:"1M Net Worth",target:1000000,current:0,months:120},
  ],
  familyTransfers:[], familyGoals:[], history:[],
};

export default function SaifApp() {
  const [tab, setTab] = useState("money");
  const [state, setState] = useState(()=>load("saifapp_v2",DEFAULT));

  useEffect(()=>{ save("saifapp_v2",state); },[state]);

  useEffect(()=>{
    const td=today();
    if (state.lastHistoryDate!==td && state.salary>0) {
      const mk=monthKey();
      const totalExp=(state.expenses||[]).filter(e=>e.month===mk).reduce((s,e)=>s+e.amount,0);
      const btcAED=(state.btcCoins||0)*(state.btcCurrentPrice||0);
      const netWorth=(state.bankBalance||0)+btcAED+(state.savings||0);
      const snap={ date:td, netWorth, salary:state.salary, expenses:totalExp, score:0, study:state.study, cycling:state.cycling };
      setState(s=>({...s, lastHistoryDate:td, history:[...(s.history||[]).slice(-29),snap]}));
    }
  },[]);

  const update = useCallback((patch)=>setState(s=>({...s,...patch})),[]);

  const screens = {
    today:<TodayScreen data={state} onUpdate={update} />,
    money:<MoneyScreen data={state} onUpdate={update} />,
    goals:<GoalsScreen data={state} onUpdate={update} />,
    perf:<PerformanceScreen data={state} />,
    family:<FamilyScreen data={state} onUpdate={update} />,
  };

  return (
    <>
      <GS />
      <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto", background:C.bg, overflow:"hidden" }}>
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontFamily:mono, fontSize:13, fontWeight:500, color:C.emeraldBright, letterSpacing:"0.06em" }}>SAIFAPP</span>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:C.emeraldBright, animation:"pulse 2.5s ease infinite" }} />
            <Lbl ch={new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})} />
          </div>
        </div>
        <Div style={{ margin:"16px 0 0" }} />
        <div key={tab} style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {screens[tab]}
          <div style={{ height:24 }} />
        </div>
        <div style={{ flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.bg, paddingBottom:"env(safe-area-inset-bottom,8px)" }}>
          <div style={{ display:"flex" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className="tap"
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"12px 4px", background:"none", border:"none", cursor:"pointer", color:tab===n.id?C.emeraldBright:C.textMuted, transition:"color 0.15s", position:"relative" }}>
                {tab===n.id && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:28, height:2, background:C.emeraldBright, borderRadius:"0 0 2px 2px" }} />}
                <span style={{ fontSize:15 }}>{n.icon}</span>
                <span style={{ fontSize:9, letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:tab===n.id?600:400 }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
