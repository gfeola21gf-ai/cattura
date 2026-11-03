/* app.js — Cattura: una schermata sola per buttare dentro quello che passa per la testa.
   Raccoglie, non smista: smista la skill /settimana (la domenica, o «smista quelle di questa settimana»).

   Dati (dati.js, tabella cattura_dati): voce:<id> = {
     testo, tipo (idea | fare | persona | ciclo | pensiero | impegno | null),
     corsia ("domenica" | "settimana"), entro (AAAA-MM-GG, solo per "settimana"),
     stato ("smistare" | "smistata" | "chiusa"), dove (dove è finita, la scrive la skill),
     creata, cambiata, chiusaIl (ISO) }

   Gesti su una voce: tocco = modifica · scorri a destra = chiusa (in «Chiuse»: riapri) ·
   scorri a sinistra = elimina (con Annulla) · tieni premuto / tasto destro = foglio (tipo, corsia, smistata…).
   La domenica (o dalla settimana dopo) le voci di «Questa settimana» non sistemate passano a «Per domenica». */
import * as D from "./dati.js?v=20261103221717";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- icone (niente emoji: tratto arrotondato) ----------
const ICO = {
  idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  fare: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
  persona: '<circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c1-3.6 3.8-5.4 7-5.4s6 1.8 7 5.4"/>',
  ciclo: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M17.5 2.8v3.6h-3.6"/>',
  pensiero: '<path d="M7.5 16.5a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.4 1.3 3.4 3.4 0 0 1-.8 6.7z"/><circle cx="7" cy="20" r="1.2"/>',
  impegno: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  su: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  copia: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cestino: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  freccia: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  indietro: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  vuoto: '<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>',
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24">${ICO[n]}</svg>`;
const TIPI = [["idea", "idea"], ["fare", "da fare"], ["persona", "persona"], ["ciclo", "ciclo aperto"], ["pensiero", "pensiero"], ["impegno", "impegno"]];
const nomeTipo = t => TIPI.find(x => x[0] === t)?.[1] || "";

// il retino (logo)
const LOGO = `<svg class="logo" viewBox="0 0 40 40" fill="none" stroke="#1D1C1A" stroke-linecap="round" stroke-linejoin="round">
  <clipPath id="sacco"><path d="M14 13 C15 23 21 32 27 33 C31.5 33 35.5 23 36 13Z"/></clipPath>
  <path d="M14 13 C15 23 21 32 27 33 C31.5 33 35.5 23 36 13" fill="#F3B33D" stroke-width="2"/>
  <g stroke-width="1.3" opacity=".7" clip-path="url(#sacco)"><path d="M19.6 15.6 C20.8 23 23.8 30 27 33"/><path d="M25 16.9 V33"/>
  <path d="M30.4 15.6 C30 23 29 30 27 33"/><path d="M15.4 20.5 C21 23.3 30 23.3 35.2 20.5"/><path d="M18.2 27 C22 29.3 30 29.3 33.2 27"/></g>
  <ellipse cx="25" cy="13" rx="11" ry="4.2" stroke-width="2.4" fill="#FBF8F2"/><path d="M14.2 14.5 L4 36" stroke-width="3.2"/></svg>`;

// Gomi, la mascotte (gomitolo di lana), contento
const GOMI = `<svg width="150" height="150" viewBox="0 0 130 130">
  <defs><radialGradient id="luce" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFD978"/><stop offset=".55" stop-color="#F3B33D"/><stop offset="1" stop-color="#DD9424"/></radialGradient>
  <clipPath id="palla"><circle cx="60" cy="62" r="44"/></clipPath></defs>
  <path d="M92 98 C108 110 104 124 118 122" fill="none" stroke="#D8901F" stroke-width="4" stroke-linecap="round"/>
  <circle cx="60" cy="62" r="44" fill="url(#luce)"/>
  <g clip-path="url(#palla)" fill="none" stroke="#D8901F" stroke-width="2.6" stroke-linecap="round" opacity=".55">
    <path d="M8 40 C40 28 82 30 112 48"/><path d="M6 52 C40 40 84 42 114 60"/><path d="M86 12 C70 40 70 84 90 112"/>
    <path d="M98 16 C82 44 82 86 100 108"/><path d="M20 100 C36 76 60 64 104 70"/></g>
  <path d="M44 20 C40 12 46 6 52 10" fill="none" stroke="#D8901F" stroke-width="4" stroke-linecap="round"/>
  <g fill="none" stroke="#1D1C1A" stroke-linecap="round"><path d="M39 66 C42 58 50 58 53 66" stroke-width="4.5"/><path d="M65 66 C68 58 76 58 79 66" stroke-width="4.5"/>
  <path d="M54 76 C57 80 61 80 64 76" stroke-width="3"/></g>
  <ellipse cx="34" cy="76" rx="6" ry="3.4" fill="#E88A5B" opacity=".55"/><ellipse cx="84" cy="76" rx="6" ry="3.4" fill="#E88A5B" opacity=".55"/></svg>`;

// ---------- date ----------
const GG = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const piu = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const oggi = () => iso(new Date());
const daIso = s => new Date(s + "T12:00:00");
function lunedi(d = new Date()) { return iso(piu(d, -((d.getDay() + 6) % 7))); }
/** i giorni da oggi a domenica (la scadenza di «Questa settimana») */
function giorniRimasti() {
  const out = [], d = new Date();
  for (let i = 0; i < 7; i++) {
    const g = piu(d, i);
    out.push({ g: iso(g), nome: i === 0 ? "Oggi" : i === 1 ? "Domani" : GG[g.getDay()][0].toUpperCase() + GG[g.getDay()].slice(1) });
    if (g.getDay() === 0) break;
  }
  return out;
}
function testoEntro(e) {
  const o = oggi();
  if (e < o) {
    const ieri = iso(piu(new Date(), -1));
    return { t: e === ieri ? "scaduta ieri" : "scaduta " + GG[daIso(e).getDay()], tardi: true };
  }
  if (e === o) return { t: "entro oggi" };
  if (e === iso(piu(new Date(), 1))) return { t: "entro domani" };
  return { t: "entro " + GG[daIso(e).getDay()] };
}
function quando(isoT) {
  if (!isoT) return "";
  const d = new Date(isoT), g = iso(d), ora = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (g === oggi()) return "oggi " + ora;
  if (g === iso(piu(new Date(), -1))) return "ieri " + ora;
  if (g >= iso(piu(new Date(), -6))) return GG[d.getDay()] + " " + ora;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ---------- voci ----------
const voci = () => D.elenco("voce:").map(([k, v]) => ({ id: k.slice(5), ...v }));
const nuovoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function salva(id, campi) {
  const k = "voce:" + id, v = D.leggi(k);
  if (!v) return;
  D.scrivi(k, { ...v, ...campi, cambiata: new Date().toISOString() });
}
/** le voci di «Questa settimana» non sistemate passano a «Per domenica» la domenica (o dalla settimana dopo) */
function rollover() {
  const lun = lunedi(), o = oggi(), domenica = new Date().getDay() === 0;
  D.senzaRegistro(() => {
    for (const v of voci()) {
      if (v.stato !== "smistare" || v.corsia !== "settimana" || !v.entro) continue;
      if (v.entro < lun || (domenica && v.entro < o)) salva(v.id, { corsia: "domenica", daSettimana: v.entro });
    }
  });
}

// ---------- stato della schermata ----------
const S = { scheda: "smistare", tipo: null, corsia: "domenica", entro: null, edit: null, foglio: null, doveAperto: false };

// ---------- disegno ----------
function disegnaAccesso(errore = "") {
  $("#app").innerHTML = `<div class="accesso">${LOGO.replace('class="logo"', 'width="64" height="64"')}
    <h1>Cattura</h1><p>Butta qui quello che ti passa per la testa. Accedi con l'account delle tue app.</p>
    <form id="f-accesso">
      <input name="email" type="email" autocomplete="username" placeholder="Email" required>
      <input name="password" type="password" autocomplete="current-password" placeholder="Password" required>
      <button class="pieno">Accedi</button>
      ${errore ? `<p class="errore">${esc(errore)}</p>` : ""}
    </form>
    <a class="link" href="?prova">Prova senza account</a></div>`;
  $("#f-accesso").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    e.target.querySelector("button").textContent = "Un attimo…";
    try { await D.accedi(String(f.get("email")).trim(), String(f.get("password"))); avviaApp(); }
    catch (err) { disegnaAccesso(err.message === "Invalid login credentials" ? "Email o password sbagliate." : err.message); }
  };
}

function disegnaGuscio() {
  $("#app").innerHTML = `<div class="pagina">
    <div class="testa">${LOGO}<div class="nome">Cattura</div><span class="stato" id="stato"></span>
      <button class="btn-tondo" id="copia" aria-label="Copia le voci da smistare">${ico("copia")}</button></div>
    <div class="campo"><textarea id="campo" rows="2" enterkeyhint="send" placeholder="Cosa ti passa per la testa?"></textarea>
      <button class="manda" id="manda" aria-label="Salva" disabled>${ico("su")}</button></div>
    <div id="controlli"></div>
    <div id="lista"></div></div>`;
  const campo = $("#campo");
  const cresci = () => { campo.style.height = "auto"; campo.style.height = campo.scrollHeight + "px"; $("#manda").disabled = !campo.value.trim(); };
  campo.addEventListener("input", cresci);
  campo.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); cattura(); } });
  $("#manda").onclick = () => cattura();
  $("#copia").onclick = copia;
  disegnaControlli();
  disegnaLista();
  disegnaStato();
}

function htmlCorsia(corsia, entro, pre) {
  const giorni = giorniRimasti();
  const nomeE = giorni.find(g => g.g === entro)?.nome.toLowerCase();
  return `<div class="corsia"><button data-${pre}corsia="domenica" class="${corsia === "domenica" ? "su" : ""}">Domenica</button>
    <button data-${pre}corsia="settimana" class="${corsia === "settimana" ? "su giallo" : ""}">Questa settimana${corsia === "settimana" && nomeE ? " · entro " + nomeE : ""}</button></div>
    ${corsia === "settimana" ? `<div class="entro-riga">${giorni.map(g => `<button data-${pre}entro="${g.g}" class="${g.g === entro ? "su" : ""}">${g.nome}</button>`).join("")}</div>` : ""}`;
}
function disegnaControlli() {
  const giorni = giorniRimasti();
  if (S.corsia === "settimana" && !giorni.some(g => g.g === S.entro)) S.entro = giorni[giorni.length - 1].g;
  const corto = { ciclo: "ciclo" };   // «ciclo aperto» non ci sta sull'iPhone SE
  $("#controlli").innerHTML = `<div class="tipi-riga">${TIPI.map(([k, n]) =>
    `<button data-tipo="${k}" class="${S.tipo === k ? "su" : ""}" aria-label="${n}">${ico(k)}<span>${corto[k] || n}</span></button>`).join("")}</div>`
    + htmlCorsia(S.corsia, S.entro, "");
}

function rigaHtml(v) {
  const meta = [];
  if (v.tipo) meta.push(`<span class="tipo">${ico(v.tipo)}${nomeTipo(v.tipo)}</span>`);
  if (v.stato === "smistare" && v.corsia === "settimana" && v.entro) {
    const e = testoEntro(v.entro);
    meta.push(`<span class="entro${e.tardi ? " tardi" : ""}">${e.t}</span>`);
  }
  if (v.stato === "smistata") meta.push(`<span class="dove">${ico("freccia")}${esc(v.dove || "smistata")}</span>`);
  meta.push(`<span>${v.stato === "chiusa" ? "chiusa " + quando(v.chiusaIl).replace(/ \d+:\d+$/, "") : quando(v.creata)}</span>`);
  const destra = v.stato === "chiusa" ? `${ico("indietro")}Riapri` : `${ico("check")}Chiusa`;
  const urg = v.stato === "smistare" && v.corsia === "settimana";
  return `<div class="riga-wrap${urg ? " urgente" : ""}${v.stato === "chiusa" ? " chiusa" : ""}" data-id="${v.id}">
    <div class="sotto verde">${destra}</div><div class="sotto rosso">Elimina${ico("cestino")}</div>
    <div class="riga"><div class="t">${esc(v.testo)}</div><div class="meta">${meta.join("")}</div></div></div>`;
}

function disegnaLista() {
  if (S.edit) return;   // mentre scrivi in una voce non ridisegno
  const tutte = voci();
  const per = s => tutte.filter(v => v.stato === s);
  const da = per("smistare");
  let corpo = "";
  if (S.scheda === "smistare") {
    const sett = da.filter(v => v.corsia === "settimana").sort((a, b) => (a.entro || "").localeCompare(b.entro || "") || a.creata.localeCompare(b.creata));
    const dom = da.filter(v => v.corsia !== "settimana").sort((a, b) => b.creata.localeCompare(a.creata));
    if (sett.length) corpo += `<div class="giorno forte">Questa settimana</div>` + sett.map(rigaHtml).join("");
    if (dom.length) corpo += (sett.length ? `<div class="giorno">Per domenica</div>` : "") + dom.map(rigaHtml).join("");
    if (!da.length) corpo = `<div class="vuoto">${GOMI}<h2>Testa leggera.</h2><p>Niente da smistare. Butta qui la prossima cosa che ti viene in mente.</p></div>`;
  } else if (S.scheda === "smistate") {
    const l = per("smistata").sort((a, b) => (b.cambiata || "").localeCompare(a.cambiata || ""));
    corpo = l.length ? l.map(rigaHtml).join("") : `<div class="vuoto"><p>Qui finiscono le voci smistate, con il posto dove sono andate (lo scrive /settimana).</p></div>`;
  } else {
    const l = per("chiusa").sort((a, b) => (b.chiusaIl || "").localeCompare(a.chiusaIl || ""));
    corpo = l.length ? l.map(rigaHtml).join("") : `<div class="vuoto"><p>Le cose chiuse (scorri una voce verso destra) arrivano qui.</p></div>`;
  }
  $("#lista").innerHTML = `<div class="schede">
      <button data-scheda="smistare" class="${S.scheda === "smistare" ? "su" : ""}">Da smistare${da.length ? `<em>${da.length}</em>` : ""}</button>
      <button data-scheda="smistate" class="${S.scheda === "smistate" ? "su" : ""}">Smistate</button>
      <button data-scheda="chiuse" class="${S.scheda === "chiuse" ? "su" : ""}">Chiuse</button></div>${corpo}`;
}

function disegnaStato() {
  const el = $("#stato");
  if (el) el.textContent = D.PROVA ? "prova" : D.stato_() === "offline" ? "offline" : "";
}

// ---------- azioni ----------
function cattura() {
  const campo = $("#campo"), testo = campo.value.trim();
  if (!testo) return;
  const ora = new Date().toISOString();
  D.scrivi("voce:" + nuovoId(), {
    testo, tipo: S.tipo, corsia: S.corsia, entro: S.corsia === "settimana" ? S.entro : null,
    stato: "smistare", dove: "", creata: ora, cambiata: ora,
  });
  campo.value = "";
  campo.dispatchEvent(new Event("input"));
  campo.focus();
  S.tipo = null; S.corsia = "domenica"; S.entro = null;   // tipo e interruttore ripartono sempre da capo
  S.scheda = "smistare";
  disegnaControlli();
  disegnaLista();
}

let timerAvviso = null;
function avviso(testo, conAnnulla = true) {
  const el = $("#avviso");
  el.innerHTML = `<span>${esc(testo)}</span>${conAnnulla ? `<button id="annulla">Annulla</button>` : ""}`;
  el.hidden = false;
  if (conAnnulla) $("#annulla").onclick = () => { D.annulla(); el.hidden = true; disegnaLista(); if (S.foglio) apriFoglio(S.foglio); };
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => { el.hidden = true; }, 5000);
}

function chiudi(id) { salva(id, { stato: "chiusa", chiusaIl: new Date().toISOString() }); avviso("Chiusa"); }
function riapri(id) { salva(id, { stato: "smistare", chiusaIl: null }); avviso("Riaperta"); }
function elimina(id) { D.scrivi("voce:" + id, null); avviso("Eliminata"); }

async function copia() {
  const da = voci().filter(v => v.stato === "smistare");
  if (!da.length) return avviso("Niente da copiare", false);
  const riga = v => `- ${v.testo.replace(/\n+/g, " ")}${v.tipo ? ` [${nomeTipo(v.tipo)}]` : ""}${v.corsia === "settimana" && v.entro ? ` (${testoEntro(v.entro).t})` : ""}`;
  const sett = da.filter(v => v.corsia === "settimana"), dom = da.filter(v => v.corsia !== "settimana");
  let t = `Da Cattura — da smistare (${da.length})\n`;
  if (sett.length) t += `\nQUESTA SETTIMANA\n${sett.map(riga).join("\n")}\n`;
  if (dom.length) t += `\nPER DOMENICA\n${dom.map(riga).join("\n")}\n`;
  try { await navigator.clipboard.writeText(t); avviso(`Copiate ${da.length} voci`, false); }
  catch { avviso("Non riesco a copiare", false); }
}

// ---------- modifica nella riga (tocco) ----------
function apriModifica(wrap) {
  const id = wrap.dataset.id, v = D.leggi("voce:" + id);
  if (!v) return;
  S.edit = id;
  const t = wrap.querySelector(".t");
  const ta = document.createElement("textarea");
  ta.className = "t"; ta.value = v.testo; ta.rows = 1; ta.enterKeyHint = "done";
  t.replaceWith(ta);
  const cresci = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
  cresci(); ta.addEventListener("input", cresci);
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  let fatto = false;
  const fine = (tieni = true) => {
    if (fatto) return; fatto = true;
    S.edit = null; S.fineEdit = null;
    const nuovo = ta.value.trim();
    if (tieni && nuovo !== v.testo) { if (nuovo) salva(id, { testo: nuovo }); else elimina(id); }
    disegnaLista();
  };
  S.fineEdit = fine;
  ta.addEventListener("blur", () => fine());
  ta.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ta.blur(); }
    if (e.key === "Escape") { fine(false); }
  });
}

// ---------- foglio (tieni premuto) ----------
function apriFoglio(id) {
  const v = D.leggi("voce:" + id);
  if (!v) return chiudiFoglio();
  S.foglio = id;
  const el = $("#foglio");
  const altre = [];
  if (v.stato === "smistare") altre.push(`<button data-f="smistata">${ico("freccia")}Smistata… dove è finita?</button>`);
  if (v.stato === "smistata") altre.push(`<button data-f="dove">${ico("freccia")}Cambia dove è finita</button>`, `<button data-f="rimetti">${ico("indietro")}Rimetti da smistare</button>`);
  altre.push(v.stato === "chiusa" ? `<button data-f="riapri">${ico("indietro")}Riapri</button>` : `<button data-f="chiudi">${ico("check")}Chiusa</button>`);
  altre.push(`<button data-f="elimina" class="rosso">${ico("cestino")}Elimina</button>`);
  el.innerHTML = `<div class="velo" data-f="esci"></div><div class="f"><div class="maniglia"></div>
    <div class="cita">«${esc(v.testo)}»</div>
    <div class="tipi">${TIPI.map(([k, n]) => `<button data-ftipo="${k}" class="${v.tipo === k ? "su" : ""}">${ico(k)}${n}</button>`).join("")}</div>
    ${v.stato === "smistare" ? `<h3>Quando</h3>${htmlCorsia(v.corsia || "domenica", v.entro, "f")}` : ""}
    ${S.doveAperto ? `<h3>Dove è finita?</h3><form class="dove-campo" id="f-dove"><input id="dove" placeholder="es. Calendar mer 15:00, parcheggio" value="${esc(v.dove || "")}"><button class="pieno">Fatto</button></form>` : ""}
    <div class="altre">${altre.join("")}</div></div>`;
  el.hidden = false;
  if (S.doveAperto) {
    $("#dove").focus();
    $("#f-dove").onsubmit = e => {
      e.preventDefault();
      salva(id, { stato: "smistata", dove: $("#dove").value.trim() });
      chiudiFoglio(); disegnaLista(); avviso("Smistata");
    };
  }
}
function chiudiFoglio() { S.foglio = null; S.doveAperto = false; $("#foglio").hidden = true; $("#foglio").innerHTML = ""; }

let finePremuto = 0;   // il clic che segue un «tieni premuto» non deve toccare il foglio appena aperto
$("#foglio").addEventListener("click", e => {
  if (Date.now() - finePremuto < 400) return;
  const id = S.foglio, v = id && D.leggi("voce:" + id);
  if (!v) return;
  const b = e.target.closest("[data-f],[data-ftipo],[data-fcorsia],[data-fentro]");
  if (!b) return;
  if (b.dataset.ftipo) { salva(id, { tipo: v.tipo === b.dataset.ftipo ? null : b.dataset.ftipo }); apriFoglio(id); disegnaLista(); return; }
  if (b.dataset.fcorsia) {
    const c = b.dataset.fcorsia, g = giorniRimasti();
    salva(id, { corsia: c, entro: c === "settimana" ? (g.some(x => x.g === v.entro) ? v.entro : g[g.length - 1].g) : null });
    apriFoglio(id); disegnaLista(); return;
  }
  if (b.dataset.fentro) { salva(id, { entro: b.dataset.fentro }); apriFoglio(id); disegnaLista(); return; }
  const f = b.dataset.f;
  if (f === "esci") return chiudiFoglio();
  if (f === "smistata" || f === "dove") { S.doveAperto = true; return apriFoglio(id); }
  if (f === "rimetti") { salva(id, { stato: "smistare", dove: "" }); avviso("Di nuovo da smistare"); }
  if (f === "chiudi") chiudi(id);
  if (f === "riapri") riapri(id);
  if (f === "elimina") elimina(id);
  chiudiFoglio(); disegnaLista();
});

// ---------- clic sui controlli ----------
$("#app").addEventListener("click", e => {
  const b = e.target.closest("[data-tipo],[data-corsia],[data-entro],[data-scheda]");
  if (!b) return;
  if (b.dataset.tipo) { S.tipo = S.tipo === b.dataset.tipo ? null : b.dataset.tipo; disegnaControlli(); }
  if (b.dataset.corsia) { S.corsia = b.dataset.corsia; if (S.corsia === "domenica") S.entro = null; disegnaControlli(); }
  if (b.dataset.entro) { S.entro = b.dataset.entro; disegnaControlli(); }
  if (b.dataset.scheda) { S.scheda = b.dataset.scheda; disegnaLista(); }
});

// tocco fuori dalla voce che stai modificando = salva (anche se il campo avesse perso il fuoco da solo)
addEventListener("pointerdown", e => { if (S.fineEdit && !e.target.closest(".riga textarea")) S.fineEdit(); }, true);

// ---------- gesti sulle voci: tocco, scorri, tieni premuto ----------
let g = null;
const SOGLIA = 90;
$("#app").addEventListener("pointerdown", e => {
  const wrap = e.target.closest(".riga-wrap");
  if (!wrap || S.edit || e.target.closest("textarea") || (e.pointerType === "mouse" && e.button !== 0)) return;
  g = { wrap, riga: wrap.querySelector(".riga"), x: e.clientX, y: e.clientY, dx: 0, scorre: false, lungo: false, id: e.pointerId };
  g.timer = setTimeout(() => {
    if (!g || g.scorre) return;
    g.lungo = true;
    navigator.vibrate?.(10);
    apriFoglio(g.wrap.dataset.id);
  }, 450);
});
addEventListener("pointermove", e => {
  if (!g || e.pointerId !== g.id || g.lungo) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  if (!g.scorre) {
    if (Math.abs(dy) > 10) { clearTimeout(g.timer); g = null; return; }   // sta scorrendo la pagina
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      g.scorre = true; clearTimeout(g.timer);
      g.wrap.classList.add("tira");
      try { g.wrap.setPointerCapture(e.pointerId); } catch { /* niente */ }
    } else return;
  }
  g.dx = dx;
  g.riga.style.transform = `translateX(${dx}px)`;
  g.wrap.querySelector(".sotto.verde").style.opacity = dx > 0 ? Math.min(1, dx / SOGLIA) : 0;
  g.wrap.querySelector(".sotto.rosso").style.opacity = dx < 0 ? Math.min(1, -dx / SOGLIA) : 0;
});
function fineGesto(e, annullato = false) {
  if (!g || e.pointerId !== g.id) return;
  const { wrap, riga, dx, scorre, lungo } = g;
  clearTimeout(g.timer);
  g = null;
  if (lungo) { finePremuto = Date.now(); return; }
  const id = wrap.dataset.id;
  if (scorre) {
    if (!annullato && dx > SOGLIA) { D.leggi("voce:" + id)?.stato === "chiusa" ? riapri(id) : chiudi(id); disegnaLista(); return; }
    if (!annullato && dx < -SOGLIA) { elimina(id); disegnaLista(); return; }
    riga.classList.add("torna"); riga.style.transform = "";
    setTimeout(() => { riga.classList.remove("torna"); wrap.classList.remove("tira"); wrap.querySelectorAll(".sotto").forEach(s => s.style.opacity = 0); }, 200);
    return;
  }
  if (!annullato) apriModifica(wrap);
}
addEventListener("pointerup", e => fineGesto(e));
addEventListener("pointercancel", e => fineGesto(e, true));
// iPhone: mentre trascini di lato la pagina non deve scorrere
addEventListener("touchmove", e => { if (g?.scorre) e.preventDefault(); }, { passive: false });
$("#app").addEventListener("contextmenu", e => {
  const wrap = e.target.closest(".riga-wrap");
  if (!wrap || S.edit) return;
  e.preventDefault();
  if (g) { clearTimeout(g.timer); g = null; }
  apriFoglio(wrap.dataset.id);
});

// ---------- tastiera: ⌘Z / ⇧⌘Z ----------
addEventListener("keydown", e => {
  if (e.key === "Escape" && S.foglio) return chiudiFoglio();
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.target.closest?.("textarea,input")) return;
  e.preventDefault();
  if (e.shiftKey ? D.ripeti() : D.annulla()) disegnaLista();
});

// ---------- dati di prova ----------
function datiProva() {
  if (voci().length) return;
  const ora = Date.now(), h = n => new Date(ora - n * 3600e3).toISOString();
  const g = giorniRimasti(), ultimo = g[g.length - 1].g;
  const p = [
    { testo: "Spostare la call con Sara, è saltata la sala", corsia: "settimana", entro: oggi(), creata: h(1) },
    { testo: "Mandare le slide del corso a Luca", tipo: "fare", corsia: "settimana", entro: ultimo, creata: h(3) },
    { testo: "Idea: una pagina con le domande frequenti del corso", tipo: "idea", creata: h(5) },
    { testo: "Rinnovare l'assicurazione della macchina", creata: h(8) },
    { testo: "Non ho ancora risposto alla mail di Tor Vergata", tipo: "ciclo", creata: h(26) },
    { testo: "Chiamare il commercialista", stato: "smistata", dove: "Calendar mer 15:00", creata: h(50) },
    { testo: "Pagare la bolletta della luce", stato: "chiusa", chiusaIl: h(20), creata: h(70) },
  ];
  D.senzaRegistro(() => p.forEach((v, i) => D.scrivi("voce:prova" + i, {
    tipo: null, corsia: "domenica", entro: null, stato: "smistare", dove: "", cambiata: v.creata, ...v,
  })));
}

// ---------- avvio ----------
function avviaApp() {
  if (D.PROVA) datiProva();
  rollover();
  disegnaGuscio();
}
D.suCambio(() => { rollover(); disegnaLista(); if (S.foglio) apriFoglio(S.foglio); });
D.suStato(disegnaStato);
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !$("#lista")) return;
  rollover(); disegnaControlli(); disegnaLista();
});
addEventListener("error", e => avviso("Errore: " + (e.message || "sconosciuto"), false));

if ("serviceWorker" in navigator && !D.PROVA) navigator.serviceWorker.register("sw.js").catch(() => {});

(async () => {
  try { (await D.avvia()) ? avviaApp() : disegnaAccesso(); }
  catch (e) { console.warn(e); disegnaAccesso("Non riesco a collegarmi. Riprova tra poco."); }
})();
