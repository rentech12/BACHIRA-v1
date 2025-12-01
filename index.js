import makeWASocket, {
  useSingleFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import handler from "./handler.js";

const authFile = "./session.json"; // fichier de session unique pour pairing

async function startBot() {
  const { state, saveCreds } = useSingleFileAuthState(authFile);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false // plus de QR
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "open") {
      console.log("✅ Bachira V1 connecté via pairing !");
    } else if (connection === "close") {
      console.log("❌ Déconnecté :", lastDisconnect?.error?.output?.statusCode);
    }

    // Affiche le pairing code une seule fois si nécessaire
    if (qr) {
      console.log("🔑 Scanner le QR ou utiliser le pairing code ci-dessous pour créer la session.");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    await handler(msg, sock);
  });
}

startBot();
