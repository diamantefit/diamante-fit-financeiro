"use client";
import { useState, useEffect, useRef } from "react";
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

export default function Financeiro() {
  const [vendas, setVendas] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState("nova");
  const [msg, setMsg] = useState("");

  // Form state
  const [fModelo, setFModelo] = useState("");
  const [fMarca, setFMarca] = useState("Nike");
  const [fCor, setFCor] = useState("");
  const [fNum, setFNum] = useState("");
  const [fCusto, setFCusto] = useState("");
  const [fVenda, setFVenda] = useState("");
  const [fPgto, setFPgto] = useState("pix");
  const [fDesconto, setFDesconto] = useState("5");
  const [fDescCustom, setFDescCustom] = useState("");
  const [fData, setFData] = useState(hoje());
  const [fObs, setFObs] = useState("");

  // Filtros
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

  useEffect(() => {
    if (fPgto === "pix" || fPgto === "avista") setFDesconto("5");
    else setFDesconto("0");
  }, [fPgto]);

  const pctDesc = fDesconto === "5" ? 5 : fDesconto === "custom" ? parseFloat(fDescCustom) || 0 : 0;
  const vendaNum = parseFloat(fVenda) || 0;
  const finalVal = vendaNum * (1 - pctDesc / 100);

  function registrar() {
    if (!fModelo || !fVenda || !fData) {
      alert("Preencha pelo menos: modelo, preço de venda e data.");
      return;
    }
    const custo = parseFloat(fCusto) || 0;
    const lucro = custo > 0 ? finalVal - custo : null;
    const nova = {
      id: Date.now(),
      modelo: fModelo,
      marca: fMarca,
      cor: fCor,
      num: fNum,
      custo,
      venda: vendaNum,
      desconto: pctDesc,
      final: finalVal,
      pgto: fPgto,
      data: fData,
      obs: fObs,
      lucro,
    };
    setVendas((prev) => [...prev, nova]);
    setMsg("Venda registrada com sucesso!");
    setTimeout(() => setMsg(""), 2500);
    setFModelo(""); setFCor(""); setFNum(""); setFCusto(""); setFVenda("");
    setFObs(""); setFPgto("pix"); setFDesconto("5"); setFData(hoje());
  }

  function excluir(id) {
    if (!confirm("Remover esta venda?")) return;
    setVendas((prev) => prev.filter((v) => v.id !== id));
  }

  // Filtro de vendas
  const vendasFiltradas = vendas
    .filter((v) => {
      if (filDe && v.data < filDe) return false;
      if (filAte && v.data > filAte) return false;
      if (filPgto && v.pgto !== filPgto) return false;
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  // Filtro relatório
  function filtrarPeriodo(arr) {
    const hj = new Date(); hj.setHours(0, 0, 0, 0);
    return arr.filter((v) => {
      const d = new Date(v.data + "T00:00:00");
      if (periodo === "hoje") return d.getTime() === hj.getTime();
      if (periodo === "semana") { const s = new Date(hj); s.setDate(hj.getDate() - hj.getDay()); return d >= s; }
      if (periodo === "mes") return d.getMonth() === hj.getMonth() && d.getFullYear() === hj.getFullYear();
      return true;
    });
  }

  const vendasRel = filtrarPeriodo(vendas);
  const totalVendido = vendasRel.reduce((s, v) => s + v.final, 0);
  const lucroTotal = vendasRel.filter((v) => v.lucro != null).reduce((s, v) => s + v.lucro, 0);
  const qtd = vendasRel.length;
  const ticket = qtd > 0 ? totalVendido / qtd : 0;

  // Chart pgto
  const pgtoMap = {};
  vendasRel.forEach((v) => { pgtoMap[v.pgto] = (pgtoMap[v.pgto] || 0) + v.final; });
  const pgtoKeys = Object.keys(pgtoMap);

  const chartPgtoData = {
    labels: pgtoKeys.map((k) => PGTO_LABEL[k]),
    datasets: [{
      data: pgtoKeys.map((k) => parseFloat(pgtoMap[k].toFixed(2))),
      backgroundColor: CHART_COLORS.slice(0, pgtoKeys.length),
      borderWidth: 2,
      borderColor: "#1a1a1a",
    }],
  };

  // Chart dia
  const diaMap = {};
  vendasRel.forEach((v) => { diaMap[v.data] = (diaMap[v.data] || 0) + v.final; });
  const dias = Object.keys(diaMap).sort();
  const chartDiaData = {
    labels: dias.map((d) => d.split("-").slice(1).reverse().join("/")),
    datasets: [{
      label: "Vendas (R$)",
      data: dias.map((d) => parseFloat(diaMap[d].toFixed(2))),
      backgroundColor: "#378ADD",
      borderColor: "#185FA5",
      borderWidth: 1,
    }],
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
          .sale-row { grid-template-columns: 70px 1fr 70px 70px 24px !important; }
          .col-lucro { display: none; }
          .cards-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>💰</div>
        <div>
          <div style={s.logoTitle}>Diamante Fit ATM</div>
          <div style={s.logoSub}>Sistema Financeiro</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["nova", "➕ Nova venda"], ["vendas", "📋 Vendas"], ["relatorio", "📊 Relatório"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      <div style={s.content}>

        {/* ABA NOVA VENDA */}
        {tab === "nova" && (
          <div>
            <div className="form-grid" style={s.formGrid}>
              <Field label="Modelo do tênis">
                <input style={s.input} value={fModelo} onChange={e => setFModelo(e.target.value)} placeholder="Ex: Nike Air Force 1" />
              </Field>
              <Field label="Marca">
                <select style={s.input} value={fMarca} onChange={e => setFMarca(e.target.value)}>
                  {["Nike","Adidas","New Balance","Puma","Vans","Outro"].map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Cor">
                <input style={s.input} value={fCor} onChange={e => setFCor(e.target.value)} placeholder="Ex: Branco" />
              </Field>
              <Field label="Numeração (BR)">
                <input style={s.input} value={fNum} onChange={e => setFNum(e.target.value)} placeholder="Ex: 42" />
              </Field>
              <Field label="Preço de custo (R$)">
                <input style={s.input} type="number" value={fCusto} onChange={e => setFCusto(e.target.value)} placeholder="Ex: 280.00" step="0.01" />
              </Field>
              <Field label="Preço de venda (R$)">
                <input style={s.input} type="number" value={fVenda} onChange={e => setFVenda(e.target.value)} placeholder="Ex: 459.90" step="0.01" />
              </Field>
              <Field label="Forma de pagamento">
                <select style={s.input} value={fPgto} onChange={e => setFPgto(e.target.value)}>
                  <option value="pix">PIX</option>
                  <option value="avista">Dinheiro à vista</option>
                  <option value="debito">Cartão de débito</option>
                  <option value="credito1x">Cartão de crédito 1x</option>
                  <option value="credito3x">Cartão de crédito 3x (sem juros)</option>
                  <option value="credito4x">Cartão de crédito 4x+</option>
                </select>
              </Field>
              <Field label="Desconto">
                <select style={s.input} value={fDesconto} onChange={e => setFDesconto(e.target.value)}>
                  <option value="0">Sem desconto</option>
                  <option value="5">5% (à vista / PIX)</option>
                  <option value="custom">Desconto personalizado</option>
                </select>
              </Field>
              {fDesconto === "custom" && (
                <Field label="Desconto personalizado (%)">
                  <input style={s.input} type="number" value={fDescCustom} onChange={e => setFDescCustom(e.target.value)} placeholder="Ex: 10" min="0" max="100" />
                </Field>
              )}
              <Field label="Data da venda">
                <input style={s.input} type="date" value={fData} onChange={e => setFData(e.target.value)} />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={s.finalBox}>
                  <span style={{ fontSize: 13, color: "#888" }}>Valor final{pctDesc > 0 ? ` (${pctDesc}% de desconto)` : ""}</span>
                  <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "#22c55e" }}>
                    R$ {fmt(finalVal)}
                  </span>
                  {pctDesc > 0 && fVenda && (
                    <span style={{ fontSize: 12, color: "#666" }}>
                      Desconto de R$ {fmt(vendaNum - finalVal)} sobre R$ {fmt(vendaNum)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Observação (opcional)">
                  <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={fObs} onChange={e => setFObs(e.target.value)} placeholder="Ex: cliente recorrente, troca, etc." />
                </Field>
              </div>
            </div>
            <button onClick={registrar} style={s.btnPrimary}>✅ Registrar venda</button>
            {msg && <div style={s.successMsg}>{msg}</div>}
          </div>
        )}

        {/* ABA VENDAS */}
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
                      {v.desconto > 0 && <span style={{ background: "#3a1f0a", color: "#f97316", padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{v.desconto}% desc.</span>}
                    </div>
                    <span><Badge pgto={v.pgto} /></span>
                    <span style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#22c55e" }}>R$ {fmt(v.final)}</span>
                    <span className="col-lucro" style={{ textAlign: "right", fontSize: 13, color: v.lucro != null ? (v.lucro >= 0 ? "#22c55e" : "#ef4444") : "#444" }}>
                      {v.lucro != null ? `R$ ${fmt(v.lucro)}` : "—"}
                    </span>
                    <button onClick={() => excluir(v.id)} style={s.delBtn} aria-label="Remover">🗑</button>
                  </div>
                ))}
                <div style={{ padding: "12px 0", textAlign: "right", fontSize: 13, color: "#888", borderTop: "1px solid #1e1e1e", marginTop: 4 }}>
                  {vendasFiltradas.length} venda(s) · Total: <strong style={{ color: "#22c55e" }}>R$ {fmt(vendasFiltradas.reduce((s, v) => s + v.final, 0))}</strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* ABA RELATÓRIO */}
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
                    responsive: true,
                    maintainAspectRatio: false,
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
  tab: { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, background: "#1e1e1e", color: "#666", transition: "all 0.15s" },
  tabActive: { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" },
  content: { padding: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 },
  input: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 12px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, width: "100%" },
  finalBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 },
  btnPrimary: { background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 10, padding: "13px 24px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%" },
  successMsg: { marginTop: 12, padding: "10px 14px", background: "#0a2e14", border: "1px solid #22c55e", borderRadius: 8, fontSize: 13, color: "#22c55e" },
  filterRow: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  filterInput: { flex: 1, minWidth: 120, background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "8px 12px", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13 },
  saleRow: { display: "grid", gridTemplateColumns: "75px 1fr 90px 90px 80px 28px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #161616", fontSize: 13 },
  saleHeader: { fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 },
  delBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px", borderRadius: 4 },
  empty: { textAlign: "center", padding: "2.5rem", color: "#444", fontSize: 14 },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px" },
  cardLabel: { fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" },
  cardValue: { fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" },
  sectionTitle: { fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: "1rem", marginTop: "1.5rem" },
};
