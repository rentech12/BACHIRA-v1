// ⚽ Bachira V1 — mute.js

// Empêche le groupe d’envoyer des messages (fermeture du groupe)

export const name = "mute";

export const description = "Ferme le groupe et empêche les membres d'envoyer des messages.";

import fs from "fs";

function loadSudo() {

  const file = "./sudo.json";

  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ sudo: [] }, null, 2));

  return JSON.parse(fs.readFileSync(file)).sudo;

}

export async function execute(sock, msg, args) {

  const from = msg.key.remoteJid;

  const isGroup = from.endsWith("@g.us");

  const sender = msg.key.participant || msg.key.remoteJid;

  // === Réaction

  await sock.sendMessage(from, { react: { text: "⚽", key: msg.key } });

  if (!isGroup) {

    return await sock.sendMessage(from, { text: "❌ Cette commande fonctionne uniquement en groupe." }, { quoted: msg });

  }

  const groupMetadata = await sock.groupMetadata(from);

  const admins = groupMetadata.participants

    .filter((p) => p.admin === "admin" || p.admin === "superadmin")

    .map((p) => p.id);

  const sudo = loadSudo().map(x => String(x));

  const senderClean = String(sender).split("@")[0].replace(/[^0-9]/g, "");

  // === Permissions

  if (

    !admins.includes(sender) &&

    !global.owners.includes(senderClean) &&

    !sudo.includes(senderClean)

  ) {

    return await sock.sendMessage(from, { text: "❌ Tu dois être admin pour utiliser cette commande." }, { quoted: msg });

  }

  // === Timer automatique (.mute 10m)

  let duration = null;

  if (args[0]) {

    const val = parseInt(args[0]);

    if (!isNaN(val)) {

      if (args[0].toLowerCase().includes("s")) duration = val * 1000;

      if (args[0].toLowerCase().includes("m")) duration = val * 60 * 1000;

      if (args[0].toLowerCase().includes("h")) duration = val * 60 * 60 * 1000;

    }

  }

  try {

    // === Fermeture du groupe

    await sock.groupSettingUpdate(from, "announcement");

    await sock.sendMessage(from, { text: "🔒 *Groupe verrouillé !*\nLe match est en pause, personne ne peut parler." });

    // === Si timer → auto unmute

    if (duration) {

      setTimeout(async () => {

        try {

          await sock.groupSettingUpdate(from, "not_announcement");

          await sock.sendMessage(from, { text: "🔓 *Match repris !*\nLe groupe est rouvert automatiquement." });

        } catch {}

      }, duration);

      await sock.sendMessage(from, { text: `⏳ Le groupe sera rouvert dans *${args[0]}*.` });

    }

  } catch (e) {

    await sock.sendMessage(from, { text: "❌ Erreur lors du verrouillage du groupe." }, { quoted: msg });

  }

}