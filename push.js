/* push.js — le NOTIFICHE PUSH (il promemoria della sera).
   attivaNotifiche() chiede il permesso e registra su Supabase l'"indirizzo" di questo telefono (tabella cattura_push).
   La notifica la manda poi la funzione cattura-notifiche su Supabase, anche ad app chiusa:
   all'ora scelta conta le cose di «Questa settimana» da smistare.
   Su iPhone funzionano SOLO con l'app aggiunta alla schermata Home e aperta da lì. */
import { sb, PROVA } from "./dati.js?v=20261117005640";
import { VAPID_CHIAVE_PUBBLICA } from "./config.js?v=20261117005640";

const suIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
const installata = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

/** "attive" · "da-attivare" · "bloccate" · "serve-installazione" · "non-supportate" */
export function statoNotifiche() {
  if (suIPhone && !installata()) return "serve-installazione";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "non-supportate";
  if (Notification.permission === "granted") return "attive";
  if (Notification.permission === "denied") return "bloccate";
  return "da-attivare";
}

/** chiede il permesso (va chiamata durante un tocco) e registra il telefono */
export async function attivaNotifiche() {
  const permesso = await Notification.requestPermission();
  if (permesso !== "granted") throw new Error("Permesso non concesso");
  await registraDispositivo();
}

export async function registraDispositivo() {
  if (PROVA) return;
  const reg = await navigator.serviceWorker.ready;
  let iscrizione = await reg.pushManager.getSubscription();
  if (!iscrizione) {
    iscrizione = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: daBase64(VAPID_CHIAVE_PUBBLICA) });
  }
  const { endpoint, keys } = iscrizione.toJSON();
  const { error } = await sb.from("cattura_push").upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
}

/** il numerino sull'icona dell'app = cose di «Questa settimana» da smistare */
export function numerino(n) {
  try {
    if (n && navigator.setAppBadge) navigator.setAppBadge(n).catch(() => { });
    else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => { });
  } catch { /* non supportato */ }
}

function daBase64(testo) {
  const base64 = (testo + "=".repeat((4 - (testo.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
