import fs from "fs";
import path from "path";
import url from "url";
import config from "./config.json"; // plus besoin de 'assert { type: "json" }'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Charger les commandes dynamiquement
const commands = {};
const cmdPath = path.join(__dirname, "commands");

for (let file of fs.readdirSync(cmdPath)) {
  if (file.endsWith(".js")) {
    const name = file.replace(".js", "");
    const module = await import(`./commands/${file}`);
    commands[name] = module.default;
  }
}

// Fonction utilitaire pour envoyer un message avec contextInfo
export async function sendMessageWithContext(sock, jid, text, quotedMsg = null) {
  await sock.sendMessage(jid, {
    text,
    contextInfo: {
      mentionedJid: quotedMsg ? [quotedMsg.key.participant || jid] : [],
      forwardingScore: 0,
      isForwarded: false,
      externalAdReply: {
        title: "Bachira V1 Bot",
        body: "View Channel",
        mediaUrl: "https://whatsapp.com/channel/0029VbBjwT52f3ELVPsK6V2K",
        mediaType: 2
      }
    }
  });
}

// Handler principal
export default async function handler(msg, sock) {
  try {
    const text =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      "";

    const prefix = config.prefix;
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    if (commands[cmdName]) {
      await commands[cmdName](msg, sock, args, sendMessageWithContext);
    } else {
      await sendMessageWithContext(
        sock,
        msg.key.remoteJid,
        `❌ Commande inconnue : ${cmdName}`,
        msg
      );
    }
  } catch (e) {
    console.log("Handler Error:", e);
  }
}
