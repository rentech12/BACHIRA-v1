import fs from "fs";
import path from "path";
import url from "url";
import config from "./config.json" assert { type: "json" };

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Charger les commandes
const commands = {};
const cmdPath = path.join(__dirname, "commands");

for (let file of fs.readdirSync(cmdPath)) {
  if (file.endsWith(".js")) {
    const name = file.replace(".js", "");
    const module = await import(`./commands/${file}`);
    commands[name] = module.default;
  }
}

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
      await commands[cmdName](msg, sock, args);
    } else {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Commande inconnue : ${cmdName}`
      });
    }
  } catch (e) {
    console.log("Handler Error:", e);
  }
}
