"use client";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PGTO_LABEL = {
  pix: "PIX",
  avista: "Dinheiro",
  debito: "Débito",
  credito1x: "Crédito 1x",
  credito3x: "Crédito 3x",
  credito4x: "Crédito 4x+",
};

const PGTO_COLOR = {
  pix: { bg: "#d1fae5", text: "#065f46" },
  avista: { bg: "#fef3c7", text: "#92400e" },
  debito: { bg: "#dbeafe", text: "#1e40af" },
  credito1x: { bg: "#ede9fe", text: "#4c1d95" },
  credito3x: { bg: "#ede9fe", text: "#4c1d95" },
  credito4x: { bg: "#fee2e2", text: "#991b1b" },
};

const CHART_COLORS = ["#1D9E75", "#BA7517", "#378ADD", "#7F77DD", "#D85A30", "#639922"];

function fmt(val) {
  return Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function Badge({ pgto }) {
  const c = PGTO_COLOR[pgto] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{ background: c.bg, color: c.text, padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
      {PGTO_LABEL[pgto]}
    </span>
  );
}

const VENDA_VAZIA = {
  cliente: "", telefone: "", modelo: "", marca: "Nike", cor: "", num: "",
  custo: "", venda: "", pgto: "pix", desconto: "5", descCustom: "", data: hoje(), obs: "",
};

function FormVenda({ inicial, onSalvar, onCancelar, btnLabel }) {
  const [f, setF] = useState(inicial);

  useEffect(() => {
    if (f.pgto === "pix" || f.pgto === "avista") {
      setF(prev => ({ ...prev, desconto: "5" }));
    } else {
      setF(prev => ({ ...prev, desconto: prev.desconto === "5" ? "0" : prev.desconto }));
    }
  }, [f.pgto]);

  const pct = f.desconto === "5" ? 5 : f.desconto === "custom" ? parseFloat(f.descCustom) || 0 : 0;
  const vendaNum = parseFloat(f.venda) || 0;
  const finalVal = vendaNum * (1 - pct / 100);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));

  function salvar() {
    if (!f.modelo || !f.venda || !f.data) {
      alert("Preencha pelo menos: modelo, preço de venda e data.");
      return;
    }
    const custo = parseFloat(f.custo) || 0;
    const lucro = custo > 0 ? finalVal - custo : null;
    onSalvar({ ...f, custo, venda: vendaNum, desconto: pct, final: finalVal, lucro });
  }

  const s = styles;

  return (
    <div>
      <div className="form-grid" style={s.formGrid}>
        <Field label="Nome do cliente">
          <input style={s.input} value={f.cliente} onChange={set("cliente")} placeholder="Ex: João Silva" />
        </Field>
        <Field label="Telefone / WhatsApp">
          <input style={s.input} value={f.telefone} onChange={set("telefone")} placeholder="Ex: (93) 99999-0000" />
        </Field>
        <Field label="Modelo do tênis">
          <input style={s.input} value={f.modelo} onChange={set("modelo")} placeholder="Ex: Nike Air Force 1" />
        </Field>
        <Field label="Marca">
          <select style={s.input} value={f.marca} onChange={set("marca")}>
            {["Nike","Adidas","New Balance","Puma","Vans","Outro"].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Cor">
          <input style={s.input} value={f.cor} onChange={set("cor")} placeholder="Ex: Branco" />
        </Field>
        <Field label="Numeração (BR)">
          <input style={s.input} value={f.num} onChange={set("num")} placeholder="Ex: 42" />
        </Field>
        <Field label="Preço de custo (R$)">
          <input style={s.input} type="number" value={f.custo} onChange={set("custo")} placeholder="Ex: 280.00" step="0.01" />
        </Field>
        <Field label="Preço de venda (R$)">
          <input style={s.input} type="number" value={f.venda} onChange={set("venda")} placeholder="Ex: 459.90" step="0.01" />
        </Field>
        <Field label="Forma de pagamento">
          <select style={s.input} value={f.pgto} onChange={set("pgto")}>
            <option value="pix">PIX</option>
            <option value="avista">Dinheiro à vista</option>
            <option value="debito">Cartão de débito</option>
            <option value="credito1x">Cartão de crédito 1x</option>
            <option value="credito3x">Cartão de crédito 3x (sem juros)</option>
            <option value="credito4x">Cartão de crédito 4x+</option>
          </select>
        </Field>
        <Field label="Desconto">
          <select style={s.input} value={f.desconto} onChange={set("desconto")}>
            <option value="0">Sem desconto</option>
            <option value="5">5% (à vista / PIX)</option>
            <option value="custom">Desconto personalizado</option>
          </select>
        </Field>
        {f.desconto === "custom" && (
          <Field label="Desconto personalizado (%)">
            <input style={s.input} type="number" value={f.descCustom} onChange={set("descCustom")} placeholder="Ex: 10" min="0" max="100" />
          </Field>
        )}
        <Field label="Data da venda">
          <input style={s.input} type="date" value={f.data} onChange={set("data")} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={s.finalBox}>
            <span style={{ fontSize: 13, color: "#888" }}>Valor final{pct > 0 ? ` (${pct}% de desconto)` : ""}</span>
            <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "#22c55e" }}>
              R$ {fmt(finalVal)}
            </span>
            {pct > 0 && f.venda && (
              <span style={{ fontSize: 12, color: "#666" }}>
                Desconto de R$ {fmt(vendaNum - finalVal)} sobre R$ {fmt(vendaNum)}
              </span>
            )}
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Observação (opcional)">
            <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={f.obs} onChange={set("obs")} placeholder="Ex: cliente recorrente, troca, etc." />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {onCancelar && (
          <button onClick={onCancelar} style={{ ...s.btnSecondary }}>Cancelar</button>
        )}
        <button onClick={salvar} style={s.btnPrimary}>{btnLabel}</button>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const [vendas, setVendas] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState("nova");
  const [msg, setMsg] = useState("");
  const [editando, setEditando] = useState(null);

  const [filDe, setFilDe] = useState("");
  const [filAte, setFilAte] = useState("");
  const [filPgto, setFilPgto] = useState("");
  const [periodo, setPeriodo] = useState("mes");

  useEffect(() => {
    const saved = localStorage.getItem("df-financeiro-vendas");
    if (saved) setVendas(JSON.parse(saved));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("df-financeiro-vendas", JSON.stringify(vendas));
  }, [vendas, hydrated]);

  function registrar(dados) {
    setVendas(prev => [...prev, { id: Date.now(), ...dados }]);
    setMsg("✅ Venda registrada com sucesso!");
    setTimeout(() => setMsg(""), 3000);
  }

  function salvarEdicao(dados) {
    setVendas(prev => prev.map(v => v.id === editando.id ? { ...v, ...dados } : v));
    setEditando(null);
    setMsg("💾 Venda atualizada com sucesso!");
    setTimeout(() => setMsg(""), 3000);
  }

  function excluir(id) {
    if (!confirm("Remover esta venda?")) return;
    setVendas(prev => prev.filter(v => v.id !== id));
  }

  function abrirEdicao(venda) {
    setEditando({
      ...venda,
      custo: venda.custo > 0 ? String(venda.custo) : "",
      venda: String(venda.venda),
      desconto: venda.desconto === 5 ? "5" : venda.desconto > 0 ? "custom" : "0",
      descCustom: venda.desconto !== 5 && venda.desconto > 0 ? String(venda.desconto) : "",
    });
  }

  const vendasFiltradas = vendas
    .filter(v => {
      if (filDe && v.data < filDe) return false;
      if (filAte && v.data > filAte) return false;
      if (filPgto && v.pgto !== filPgto) return false;
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  function filtrarPeriodo(arr) {
    const hj = new Date(); hj.setHours(0, 0, 0, 0);
    return arr.filter(v => {
      const d = new Date(v.data + "T00:00:00");
      if (periodo === "hoje") return d.getTime() === hj.getTime();
      if (periodo === "semana") { const s = new Date(hj); s.setDate(hj.getDate() - hj.getDay()); return d >= s; }
      if (periodo === "mes") return d.getMonth() === hj.getMonth() && d.getFullYear() === hj.getFullYear();
      return true;
    });
  }

  const vendasRel = filtrarPeriodo(vendas);
  const totalVendido = vendasRel.reduce((s, v) => s + v.final, 0);
  const lucroTotal = vendasRel.filter(v => v.lucro != null).reduce((s, v) => s + v.lucro, 0);
  const qtd = vendasRel.length;
  const ticket = qtd > 0 ? totalVendido / qtd : 0;

  const pgtoMap = {};
  vendasRel.forEach(v => { pgtoMap[v.pgto] = (pgtoMap[v.pgto] || 0) + v.final; });
  const pgtoKeys = Object.keys(pgtoMap);

  const chartPgtoData = {
    labels: pgtoKeys.map(k => PGTO_LABEL[k]),
    datasets: [{ data: pgtoKeys.map(k => parseFloat(pgtoMap[k].toFixed(2))), backgroundColor: CHART_COLORS.slice(0, pgtoKeys.length), borderWidth: 2, borderColor: "#1a1a1a" }],
  };

  const diaMap = {};
  vendasRel.forEach(v => { diaMap[v.data] = (diaMap[v.data] || 0) + v.final; });
  const dias = Object.keys(diaMap).sort();
  const chartDiaData = {
    labels: dias.map(d => d.split("-").slice(1).reverse().join("/")),
    datasets: [{ label: "Vendas (R$)", data: dias.map(d => parseFloat(diaMap[d].toFixed(2))), backgroundColor: "#378ADD", borderColor: "#185FA5", borderWidth: 1 }],
  };

  if (!hydrated) return null;

  const s = styles;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { outline: none; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .sale-row { grid-template-columns: 65px 1fr 70px 70px 52px !important; }
          .col-lucro { display: none; }
          .cards-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={s.header}>
        <div style={s.logo}>💰</div>
        <div>
          <div style={s.logoTitle}>Diamante Fit ATM</div>
          <div style={s.logoSub}>Sistema Financeiro</div>
        </div>
      </div>

      <div style={s.tabs}>
        {[["nova", "➕ Nova venda"], ["vendas", "📋 Vendas"], ["relatorio", "📊 Relatório"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ margin: "12px 20px 0", padding: "10px 14px", background: "#0a2e14", border: "1px solid #22c55e", borderRadius: 8, fontSize: 13, color: "#22c55e" }}>
          {msg}
        </div>
      )}

      <div style={s.content}>

        {tab === "nova" && (
          <FormVenda inicial={VENDA_VAZIA} onSalvar={registrar} btnLabel="✅ Registrar venda" />
        )}

        {tab === "vendas" && (
          <div>
            <div style={s.filterRow}>
              <input style={s.filterInput} type="date" value={filDe} onChange={e => setFilDe(e.target.value)} />
              <input style={s.filterInput} type="date" value={filAte} onChange={e => setFilAte(e.target.value)} />
              <select style={s.filterInput} value={filPgto} onChange={e => setFilPgto(e.target.value)}>
                <option value="">Todas as formas</option>
                {Object.entries(PGTO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {vendasFiltradas.length === 0 ? (
              <div style={s.empty}>Nenhuma venda encontrada.</div>
            ) : (
              <>
                <div className="sale-row" style={{ ...s.saleRow, ...s.saleHeader }}>
                  <span>Data</span><span>Produto</span><span>Pagto.</span>
                  <span style={{ textAlign: "right" }}>Venda</span>
                  <span className="col-lucro" style={{ textAlign: "right" }}>Lucro</span>
                  <span></span>
                </div>
                {vendasFiltradas.map(v => (
                  <div key={v.id} className="sale-row" style={s.saleRow}>
                    <span style={{ color: "#888", fontSize: 12 }}>{v.data.split("-").reverse().join("/")}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v.modelo}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{v.marca} · N°{v.num} · {v.cor}</div>
                      {v.cliente && <div style={{ fontSize: 11, color: "#888" }}>👤 {v.cliente}{v.telefone ? ` · 📱 ${v.telefone}` : ""}</div>}
                      {v.desconto > 0 && <span style={{ background: "#3a1f0a", color: "#f97316", padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{v.desconto}% desc.</span>}
                    </div>
                    <span><Badge pgto={v.pgto} /></span>
                    <span style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#22c55e" }}>R$ {fmt(v.final)}</span>
                    <span className="col-lucro" style={{ textAlign: "right", fontSize: 13, color: v.lucro != null ? (v.lucro >= 0 ? "#22c55e" : "#ef4444") : "#444" }}>
                      {v.lucro != null ? `R$ ${fmt(v.lucro)}` : "—"}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => abrirEdicao(v)} style={s.actionBtn} title="Editar venda">✏️</button>
                      <button onClick={() => excluir(v.id)} style={{ ...s.actionBtn }} title="Remover venda">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "12px 0", textAlign: "right", fontSize: 13, color: "#888", borderTop: "1px solid #1e1e1e", marginTop: 4 }}>
                  {vendasFiltradas.length} venda(s) · Total: <strong style={{ color: "#22c55e" }}>R$ {fmt(vendasFiltradas.reduce((s, v) => s + v.final, 0))}</strong>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "relatorio" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <select style={s.filterInput} value={periodo} onChange={e => setPeriodo(e.target.value)}>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
                <option value="tudo">Todo o período</option>
              </select>
            </div>
            <div className="cards-grid" style={s.cardsGrid}>
              {[
                { label: "Total vendido", valor: `R$ ${fmt(totalVendido)}`, color: "#22c55e" },
                { label: "Lucro estimado", valor: `R$ ${fmt(lucroTotal)}`, color: "#3b82f6" },
                { label: "Qtd. vendida", valor: qtd, color: "#f0f0f0" },
                { label: "Ticket médio", valor: `R$ ${fmt(ticket)}`, color: "#f97316" },
              ].map((c, i) => (
                <div key={i} style={s.card}>
                  <div style={s.cardLabel}>{c.label}</div>
                  <div style={{ ...s.cardValue, color: c.color }}>{c.valor}</div>
                </div>
              ))}
            </div>
            {vendasRel.length === 0 ? (
              <div style={s.empty}>Nenhuma venda no período selecionado.</div>
            ) : (
              <>
                <div style={s.sectionTitle}>Vendas por forma de pagamento</div>
                <div style={{ maxWidth: 360, margin: "0 auto 2rem" }}>
                  <Doughnut data={chartPgtoData} options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom", labels: { color: "#aaa", font: { size: 12 }, boxWidth: 12 } },
                      tooltip: { callbacks: { label: ctx => ` R$ ${fmt(ctx.raw)}` } }
                    }
                  }} />
                </div>
                <div style={s.sectionTitle}>Vendas por dia</div>
                <div style={{ position: "relative", width: "100%", height: 220 }}>
                  <Bar data={chartDiaData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { ticks: { color: "#888", callback: v => "R$ " + v.toLocaleString("pt-BR") }, grid: { color: "#1e1e1e" } },
                      x: { ticks: { color: "#888", autoSkip: false, maxRotation: 45 }, grid: { color: "#1e1e1e" } }
                    }
                  }} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div style={s.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setEditando(null); }}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17 }}>✏️ Editar venda</div>
              <button onClick={() => setEditando(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 4px" }}>✕</button>
            </div>
            <div style={{ maxHeight: "72vh", overflowY: "auto", paddingRight: 4 }}>
              <FormVenda
                inicial={editando}
                onSalvar={salvarEdicao}
                onCancelar={() => setEditando(null)}
                btnLabel="💾 Salvar alterações"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  page: { fontFamily: "'DM Sans', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#f0f0f0" },
  header: { background: "#111", borderBottom: "1px solid #1e1e1e", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 },
  logo: { width: 40, height: 40, background: "linear-gradient(135deg, #22c55e, #16a34a)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  logoTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: "#555" },
  tabs: { display: "flex", gap: 8, padding: "16px 20px 0", flexWrap: "wrap" },
  tab: { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, background: "#1e1e1e", color: "#666" },
  tabActive: { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" },
  content: { padding: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 },
  input: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 12px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, width: "100%" },
  finalBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 },
  btnPrimary: { background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 10, padding: "13px 24px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1 },
  btnSecondary: { background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 10, padding: "13px 20px", color: "#888", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
  filterRow: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  filterInput: { flex: 1, minWidth: 120, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "8px 12px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13 },
  saleRow: { display: "grid", gridTemplateColumns: "75px 1fr 90px 90px 80px 58px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #161616", fontSize: 13 },
  saleHeader: { fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 },
  actionBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "3px 5px", borderRadius: 4 },
  actionBtnDelete: { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "3px 5px", borderRadius: 4, filter: "sepia(1) saturate(5) hue-rotate(300deg) brightness(1.4)" },
  empty: { textAlign: "center", padding: "2.5rem", color: "#444", fontSize: 14 },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px" },
  cardLabel: { fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" },
  cardValue: { fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" },
  sectionTitle: { fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: "1rem", marginTop: "1.5rem" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modalBox: { background: "#111", border: "1px solid #222", borderRadius: 20, padding: 24, width: "100%", maxWidth: 540 },
};
