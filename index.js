import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import handler from "./handler.js";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("🟦 Scan le QR pour connecter Bachira V1");
    }

    if (connection === "open") {
      console.log("✅ Bachira V1 connecté avec succès !");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Messages reçus
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    await handler(msg, sock);
  });
}

startBot();
