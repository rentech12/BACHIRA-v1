// 🩸 Bachira-v1 BOT
// === INDEX PRINCIPAL DU BOT ===
// Version : v3.0.0 (Bachira-v1 Build Advanced)
// Contexte : Mon index - voici le lien de ma chaîne pour toutes les commandes https://whatsapp.com/channel/0029VbBaZ6ALo4hb3iDBla2Z

import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "readline";
import dotenv from "dotenv";
import { Boom } from "@hapi/boom";

dotenv.config();

// === Interface console ===
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// === Config globale ===
const PREFIX = process.env.PREFIX || ".";
const MODE_FILE = "./mode.json";

// === Fichiers de configuration ===
const CONFIG_FILES = {
  autoreact: "./autoreact.json",
  autoresponder: "./autoresponder.json",
  antibug: "./antibug.json",
  antispam: "./antispam.json",
  antiban: "./antiban.json",
  invisiblenumber: "./invisiblenumber.json",
  bangroup: "./bangroup.json",
  spamgroup: "./spamgroup.json",
  autoview: "./autoview.json"
};

// === Initialisation des fichiers config ===
function initConfigFiles() {
  for (const [key, file] of Object.entries(CONFIG_FILES)) {
    if (!fs.existsSync(file)) {
      let defaultData = {};
      
      switch(key) {
        case 'autoreact':
          defaultData = { status: "off", reactions: {}, groups: {} };
          break;
        case 'autoresponder':
          defaultData = { status: "off", responses: {} };
          break;
        case 'antibug':
          defaultData = { status: "off", target: "", reason: "" };
          break;
        case 'antispam':
          defaultData = { status: "off", target: "", interval: 5, message: "" };
          break;
        case 'antiban':
          defaultData = { status: "off", numbers: [] };
          break;
        case 'invisiblenumber':
          defaultData = { status: "off", numbers: [] };
          break;
        case 'bangroup':
          defaultData = { status: "off", groups: [], reason: "" };
          break;
        case 'spamgroup':
          defaultData = { status: "off", target: "", messages: [], interval: 10 };
          break;
        case 'autoview':
          defaultData = { status: "off" };
          break;
      }
      
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
      console.log(chalk.yellow(`Fichier cree : ${file}`));
    }
  }
}

// === Gestion du mode (public / private) ===
function getMode() {
  if (!fs.existsSync(MODE_FILE)) {
    fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "private" }, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(MODE_FILE));
  return data.mode || "private";
}

function setMode(newMode) {
  fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: newMode }, null, 2));
}

// === Helpers universels ===
function normalizeJid(jid) {
  if (!jid) return null;
  return jid.split(":")[0].replace("@lid", "@s.whatsapp.net");
}
function getBareNumber(input) {
  if (!input) return "";
  return String(input).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
}
function unwrapMessage(m) {
  return (
    m?.ephemeralMessage?.message ||
    m?.viewOnceMessageV2?.message ||
    m?.documentWithCaptionMessage?.message ||
    m
  );
}
function pickText(m) {
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    null
  );
}
function loadSudo() {
  const file = "./sudo.json";
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ sudo: [] }, null, 2));
  return JSON.parse(fs.readFileSync(file)).sudo;
}

// === Système d'auto-réaction ===
async function handleAutoreact(sock, msg, from, sender, senderNum) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoreact));
  if (config.status !== "on") return;
  
  const isGroup = from.endsWith("@g.us");
  let shouldReact = false;
  let reaction = "❤";
  
  if (isGroup && config.groups[from]) {
    shouldReact = true;
    reaction = config.groups[from];
  } else if (config.reactions[senderNum]) {
    shouldReact = true;
    reaction = config.reactions[senderNum];
  } else if (config.reactions["default"]) {
    shouldReact = true;
    reaction = config.reactions["default"];
  }
  
  if (shouldReact) {
    try {
      await sock.sendMessage(from, { react: { text: reaction, key: msg.key } });
    } catch (e) {
      console.log(chalk.red("Erreur autoreact:"), e);
    }
  }
}

// === Système auto-répondeur ===
async function handleAutoresponder(sock, msg, from, text, sender) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoresponder));
  if (config.status !== "on") return;
  
  const normalizedText = text.toLowerCase().trim();
  
  for (const [trigger, response] of Object.entries(config.responses)) {
    if (normalizedText.includes(trigger.toLowerCase())) {
      await sock.sendMessage(from, { text: response, mentions: [sender] }, { quoted: msg });
      break;
    }
  }
}

// === Système antibug user ===
async function handleAntibug(sock, from, sender, senderNum) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antibug));
  if (config.status !== "on" || !config.target) return;
  
  if (senderNum === config.target.replace(/[^0-9]/g, "")) {
    try {
      const bugMessages = [
        "Erreur système",
        "Maintenance en cours",
        "Signal faible",
        "Reconnexion...",
        "Crash détecté"
      ];
      
      for (let i = 0; i < 10; i++) {
        await sock.sendMessage(from, { text: bugMessages[Math.floor(Math.random() * bugMessages.length)] });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await sock.updateBlockStatus(sender, "block");
      console.log(chalk.red(`User ${senderNum} buggé et bloqué`));
      
    } catch (e) {
      console.log(chalk.red("Erreur antibug:"), e);
    }
  }
}

// === Système anti-spam user ===
const spamCounters = {};
async function handleAntispam(sock, msg, from, sender, senderNum) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antispam));
  if (config.status !== "on" || !config.target) return;
  
  const targetNum = config.target.replace(/[^0-9]/g, "");
  if (senderNum !== targetNum) return;
  
  if (!spamCounters[targetNum]) {
    spamCounters[targetNum] = { count: 0, lastSpam: Date.now() };
  }
  
  const now = Date.now();
  const interval = (config.interval || 5) * 1000;
  
  if (now - spamCounters[targetNum].lastSpam > interval) {
    spamCounters[targetNum].count = 0;
    spamCounters[targetNum].lastSpam = now;
  }
  
  spamCounters[targetNum].count++;
  
  if (spamCounters[targetNum].count <= 5) {
    const spamMsg = config.message || `SPAM DETECTE ${spamCounters[targetNum].count}/5`;
    await sock.sendMessage(from, { text: spamMsg, mentions: [sender] }, { quoted: msg });
  } else if (spamCounters[targetNum].count === 6) {
    await sock.updateBlockStatus(sender, "block");
    await sock.sendMessage(from, { 
      text: `@${senderNum} bloque pour spam excessif`, 
      mentions: [sender] 
    });
    console.log(chalk.red(`User ${senderNum} bloque pour spam`));
  }
}

// === Système anti-ban numéro ===
async function handleAntiban(sock, from, senderNum) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antiban));
  if (config.status !== "on") return;
  
  if (config.numbers.includes(senderNum)) {
    try {
      await sock.updateBlockStatus(`${senderNum}@s.whatsapp.net`, "block");
      console.log(chalk.red(`Numero ${senderNum} auto-bloque`));
    } catch (e) {
      console.log(chalk.red("Erreur antiban:"), e);
    }
  }
}

// === Système numéro invisible ===
async function handleInvisibleNumber(sock, msg, from, sender, senderNum) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.invisiblenumber));
  if (config.status !== "on") return;
  
  if (config.numbers.includes(senderNum)) {
    await sock.sendMessage(from, {
      text: `Ce numero n'existe plus sur WhatsApp.\n\nPour contacter cette personne, cliquez ici : wa.me/${senderNum}`,
      mentions: [sender]
    }, { quoted: msg });
    
    await sock.sendMessage(from, {
      delete: {
        remoteJid: from,
        id: msg.key.id,
        participant: msg.key.participant || sender
      }
    });
    
    return true;
  }
  return false;
}

// === Système ban groupe ===
async function handleBanGroup(sock, from) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.bangroup));
  if (config.status !== "on") return;
  
  if (config.groups.includes(from)) {
    try {
      await sock.groupLeave(from);
      console.log(chalk.red(`Groupe ${from} auto-quitte`));
      
      if (config.reason) {
        const owner = global.owners?.[0];
        if (owner) {
          await sock.sendMessage(`${owner}@s.whatsapp.net`, {
            text: `Groupe auto-quitte : ${from}\nRaison : ${config.reason}`
          });
        }
      }
    } catch (e) {
      console.log(chalk.red("Erreur bangroup:"), e);
    }
  }
}

// === Système spam groupe ===
const groupSpamTimers = {};
async function handleSpamGroup(sock) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.spamgroup));
  if (config.status !== "on" || !config.target) return;
  
  const targetGroup = config.target;
  const messages = config.messages || ["BACHIRA-V1 ACTIVE"];
  const interval = (config.interval || 10) * 1000;
  
  if (!groupSpamTimers[targetGroup]) {
    groupSpamTimers[targetGroup] = setInterval(async () => {
      try {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        await sock.sendMessage(targetGroup, { text: randomMsg });
      } catch (e) {
        clearInterval(groupSpamTimers[targetGroup]);
        delete groupSpamTimers[targetGroup];
      }
    }, interval);
    
    console.log(chalk.yellow(`Spam groupe demarre : ${targetGroup}`));
  }
}

// === Système auto-view ===
async function handleAutoview(sock, msg) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoview));
  if (config.status !== "on") return;
  
  if (msg.message?.viewOnceMessageV2) {
    try {
      await sock.readMessages([msg.key]);
    } catch (e) {
      console.log(chalk.red("Erreur autoview:"), e);
    }
  }
}

// === Fonction principale ===
async function startBachira() {
  initConfigFiles();
  
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Ubuntu", "Chrome", "Bachira-v1"],
  });

  try {
    if (!state?.creds?.registered) {
      let number = (process.env.OWNER_NUMBER || "").trim();
      if (!number && process.stdin.isTTY) {
        number = (await ask(chalk.cyan("Entre ton numero WhatsApp (ex: 2376XXXXXXXX): "))).trim();
      }

      if (!number) {
        console.log(chalk.red("Aucun numero saisi."));
      } else {
        const resp = await sock.requestPairingCode(number);
        const code = typeof resp === "string" ? resp : resp?.code || null;
        if (code) {
          console.log(chalk.green("\nCode d'appairage : ") + chalk.yellow(code.split("").join(" ")));
        } else {
          console.log(chalk.red("Aucun code reçu. Essaie de redémarrer."));
        }
      }
    }
  } catch (e) {
    console.log(chalk.red("Erreur appairage:"), e);
  }

  const commands = {};
  const cmdPath = path.join(process.cwd(), "commands");
  if (!fs.existsSync(cmdPath)) fs.mkdirSync(cmdPath, { recursive: true });

  for (const file of fs.readdirSync(cmdPath).filter((f) => f.endsWith(".js"))) {
    try {
      const cmd = await import(path.join(cmdPath, file));
      if (cmd.name && typeof cmd.execute === "function") {
        commands[cmd.name.toLowerCase()] = cmd;
        console.log(chalk.greenBright(`Commande chargee : ${cmd.name}`));
      }
    } catch (err) {
      console.log(chalk.red(`Erreur chargement ${file}:`), err);
    }
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) console.log(chalk.yellow("Scanne le QR code vite !"));
    if (connection === "open") {
      console.log(chalk.greenBright("===================================="));
      console.log(chalk.greenBright("BACHIRA-v1 BOT ACTIVE"));
      console.log(chalk.greenBright("Connecte a WhatsApp avec succes !"));
      console.log(chalk.greenBright("Lien des commandes : https://whatsapp.com/channel/0029VbBaZ6ALo4hb3iDBla2Z"));
      console.log(chalk.greenBright("===================================="));

      const ownerId = normalizeJid(sock.user?.id);
      const ownerBare = getBareNumber(ownerId);
      const ownerLid = sock.user?.lid ? getBareNumber(sock.user.lid) : null;

      global.owners = [ownerBare];
      if (ownerLid) global.owners.push(ownerLid);

      setTimeout(() => handleSpamGroup(sock), 5000);

      if (!fs.existsSync("./.firstboot")) {
        fs.writeFileSync("./.firstboot", "ok");
        console.log(chalk.magentaBright("Premier lancement détecte → redémarrage dans 5s..."));
        setTimeout(() => process.exit(1), 5000);
      }
    } else if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(chalk.red("Déconnecte — Code:", reason));
      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow("Tentative de reconnexion dans 5s..."));
        setTimeout(startBachira, 5000);
      } else {
        console.log(chalk.red("Session expiree → Supprime ./session et relance."));
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      let sender = msg.key.fromMe ? sock.user.id : msg.key.participant || from;
      sender = normalizeJid(sender);
      const senderNum = getBareNumber(sender);
      const text = pickText(unwrapMessage(msg.message));
      
      const invisibleHandled = await handleInvisibleNumber(sock, msg, from, sender, senderNum);
      if (invisibleHandled) continue;
      
      if (!text) continue;

      const mode = getMode();
      const sudo = loadSudo().map((x) => String(x).replace(/[^0-9]/g, ""));
      const allowed = [...(global.owners || []), ...sudo];

      if (mode === "private" && !allowed.includes(senderNum)) return;

      await handleAutoreact(sock, msg, from, sender, senderNum);
      await handleAutoresponder(sock, msg, from, text, sender);
      await handleAntibug(sock, from, sender, senderNum);
      await handleAntispam(sock, msg, from, sender, senderNum);
      await handleAntiban(sock, from, senderNum);
      await handleBanGroup(sock, from);
      await handleAutoview(sock, msg);

      const antiLinkConfig = JSON.parse(fs.readFileSync("./antilink.json"));
      const antiLinkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|bit\.ly|tinyurl\.com)/i;

      if (antiLinkConfig.status === "on" && isGroup && antiLinkRegex.test(text)) {
        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants
          .filter(p => p.admin)
          .map(p => String(p.id).split("@")[0].replace(/[^0-9]/g, ""));

        const isAdmin = admins.includes(senderNum);
        const sudo = loadSudo().map(x => String(x).replace(/[^0-9]/g, ""));
        const owners = global.owners || [];

        if (!owners.includes(senderNum) && !sudo.includes(senderNum) && !isAdmin) {
          await sock.sendMessage(from, { react: { text: "⚠", key: msg.key } });
          
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              id: msg.key.id,
              participant: msg.key.participant || sender
            }
          });

          if (!antiLinkConfig.warnings[senderNum]) {
            antiLinkConfig.warnings[senderNum] = 0;
          }

          antiLinkConfig.warnings[senderNum] += 1;
          fs.writeFileSync("./antilink.json", JSON.stringify(antiLinkConfig, null, 2));

          const warn = antiLinkConfig.warnings[senderNum];

          if (warn < 3) {
            await sock.sendMessage(from, {
              text: `Lien détecte !\n⚠️ @${senderNum} → Avertissement ${warn}/3\n\nApres 3 warns → Expulsion automatique`,
              mentions: [sender]
            });
            return;
          }

          if (warn >= 3) {
            await sock.groupParticipantsUpdate(from, [sender], "remove");
            await sock.sendMessage(from, {
              text: `AntiLink Auto Kick\n🚫 @${senderNum} expulse apres 3 warnings.`,
              mentions: [sender]
            });

            delete antiLinkConfig.warnings[senderNum];
            fs.writeFileSync("./antilink.json", JSON.stringify(antiLinkConfig, null, 2));
            console.log(`AntiLink → ${senderNum} expulse !`);
          }
        }
      }

      if (!text.startsWith(PREFIX)) continue;

      const args = text.slice(PREFIX.length).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      
      if (cmd === "mode") {
        if (!allowed.includes(senderNum)) return;
        const newMode = args[0];
        if (!["public", "private"].includes(newMode)) {
          await sock.sendMessage(from, { text: "Usage : .mode public / private" }, { quoted: msg });
          return;
        }
        setMode(newMode);
        await sock.sendMessage(from, { text: `Mode change → ${newMode.toUpperCase()}` }, { quoted: msg });
        console.log(chalk.blue(`Mode change par ${senderNum} → ${newMode}`));
        return;
      }

      if (cmd === "autoreact") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoreact));
        
        if (args[0] === "on") {
          config.status = "on";
          await sock.sendMessage(from, { text: "Auto-reaction activee" }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Auto-reaction desactivee" }, { quoted: msg });
        } else if (args[0] === "add") {
          const target = args[1];
          const reaction = args[2] || "❤";
          if (isGroup) {
            config.groups[from] = reaction;
            await sock.sendMessage(from, { text: `Reaction "${reaction}" ajoutee pour ce groupe` }, { quoted: msg });
          } else {
            config.reactions[target] = reaction;
            await sock.sendMessage(from, { text: `Reaction "${reaction}" ajoutee pour ${target}` }, { quoted: msg });
          }
        } else if (args[0] === "list") {
          const list = Object.entries(config.reactions).map(([num, react]) => `${num}: ${react}`).join("\n");
          const groupList = Object.entries(config.groups).map(([jid, react]) => `${jid}: ${react}`).join("\n");
          await sock.sendMessage(from, { 
            text: `Auto-reactions :\n${list}\n\nGroupes :\n${groupList}\n\nStatut : ${config.status}` 
          }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.autoreact, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "autoresponder") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoresponder));
        
        if (args[0] === "on") {
          config.status = "on";
          await sock.sendMessage(from, { text: "Auto-repondeur active" }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Auto-repondeur desactive" }, { quoted: msg });
        } else if (args[0] === "add") {
          const trigger = args.slice(1, -1).join(" ");
          const response = args[args.length - 1];
          config.responses[trigger] = response;
          await sock.sendMessage(from, { text: `Reponse ajoutee : "${trigger}" → "${response}"` }, { quoted: msg });
        } else if (args[0] === "list") {
          const list = Object.entries(config.responses).map(([t, r]) => `${t} → ${r}`).join("\n");
          await sock.sendMessage(from, { 
            text: `Auto-reponses :\n${list}\n\nStatut : ${config.status}` 
          }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.autoresponder, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "antibug") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antibug));
        
        if (args[0] === "on") {
          const target = args[1];
          const reason = args.slice(2).join(" ") || "Bug système";
          config.status = "on";
          config.target = target;
          config.reason = reason;
          await sock.sendMessage(from, { text: `Anti-bug active pour ${target}\nRaison : ${reason}` }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Anti-bug desactive" }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.antibug, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "antispam") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antispam));
        
        if (args[0] === "on") {
          const target = args[1];
          const interval = args[2] || 5;
          const message = args.slice(3).join(" ") || "SPAM DETECTE";
          config.status = "on";
          config.target = target;
          config.interval = parseInt(interval);
          config.message = message;
          await sock.sendMessage(from, { text: `Anti-spam active pour ${target}` }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Anti-spam desactive" }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.antispam, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "antiban") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.antiban));
        
        if (args[0] === "on") {
          config.status = "on";
          await sock.sendMessage(from, { text: "Anti-ban active" }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Anti-ban desactive" }, { quoted: msg });
        } else if (args[0] === "add") {
          const number = args[1];
          if (!config.numbers.includes(number)) {
            config.numbers.push(number);
            await sock.sendMessage(from, { text: `${number} ajoute a la liste anti-ban` }, { quoted: msg });
          }
        } else if (args[0] === "remove") {
          const number = args[1];
          config.numbers = config.numbers.filter(n => n !== number);
          await sock.sendMessage(from, { text: `${number} retire de la liste anti-ban` }, { quoted: msg });
        } else if (args[0] === "list") {
          const list = config.numbers.join("\n");
          await sock.sendMessage(from, { 
            text: `Liste anti-ban :\n${list}\n\nStatut : ${config.status}` 
          }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.antiban, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "invisiblenumber") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.invisiblenumber));
        
        if (args[0] === "on") {
          config.status = "on";
          await sock.sendMessage(from, { text: "Numéro invisible active" }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Numéro invisible desactive" }, { quoted: msg });
        } else if (args[0] === "add") {
          const number = args[1];
          if (!config.numbers.includes(number)) {
            config.numbers.push(number);
            await sock.sendMessage(from, { text: `${number} ajoute aux numeros invisibles` }, { quoted: msg });
          }
        } else if (args[0] === "remove") {
          const number = args[1];
          config.numbers = config.numbers.filter(n => n !== number);
          await sock.sendMessage(from, { text: `${number} retire des numeros invisibles` }, { quoted: msg });
        } else if (args[0] === "list") {
          const list = config.numbers.join("\n");
          await sock.sendMessage(from, { 
            text: `Numeros invisibles :\n${list}\n\nStatut : ${config.status}` 
          }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.invisiblenumber, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "bangroup") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.bangroup));
        
        if (args[0] === "on") {
          const groupJid = args[1];
          const reason = args.slice(2).join(" ") || "Violation des règles";
          config.status = "on";
          if (!config.groups.includes(groupJid)) {
            config.groups.push(groupJid);
          }
          config.reason = reason;
          await sock.sendMessage(from, { text: `Auto-ban active pour ${groupJid}` }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Auto-ban groupe desactive" }, { quoted: msg });
        } else if (args[0] === "list") {
          const list = config.groups.join("\n");
          await sock.sendMessage(from, { 
            text: `Groupes auto-ban :\n${list}\n\nStatut : ${config.status}\nRaison : ${config.reason}` 
          }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.bangroup, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "spamgroup") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.spamgroup));
        
        if (args[0] === "on") {
          const target = args[1];
          const interval = args[2] || 10;
          const messages = args.slice(3);
          config.status = "on";
          config.target = target;
          config.interval = parseInt(interval);
          config.messages = messages.length > 0 ? messages : ["BACHIRA-V1 ACTIVE"];
          await sock.sendMessage(from, { text: `Spam groupe active pour ${target}` }, { quoted: msg });
          handleSpamGroup(sock);
        } else if (args[0] === "off") {
          config.status = "off";
          if (groupSpamTimers[config.target]) {
            clearInterval(groupSpamTimers[config.target]);
            delete groupSpamTimers[config.target];
          }
          await sock.sendMessage(from, { text: "Spam groupe desactive" }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.spamgroup, JSON.stringify(config, null, 2));
        return;
      }

      if (cmd === "autoview") {
        if (!allowed.includes(senderNum)) return;
        const config = JSON.parse(fs.readFileSync(CONFIG_FILES.autoview));
        
        if (args[0] === "on") {
          config.status = "on";
          await sock.sendMessage(from, { text: "Auto-view active" }, { quoted: msg });
        } else if (args[0] === "off") {
          config.status = "off";
          await sock.sendMessage(from, { text: "Auto-view desactive" }, { quoted: msg });
        }
        
        fs.writeFileSync(CONFIG_FILES.autoview, JSON.stringify(config, null, 2));
        return;
      }

      if (commands[cmd]) {
        try {
          await commands[cmd].execute(sock, msg, args);
          console.log(chalk.green(`Commande exécutée : ${cmd}`));
        } catch (err) {
          console.log(chalk.red(`Erreur commande ${cmd}:`), err);
          await sock.sendMessage(from, { text: "Erreur lors de l'execution de la commande." }, { quoted: msg });
        }
      }
    }
  });
}

startBachira().catch(console.error);
