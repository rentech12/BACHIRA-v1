// ⚽ Bachira V1 — unmute.js
// Rouvre le groupe et permet aux membres d'envoyer des messages.

export const name = "unmute";
export const description = "Rouvre le groupe et permet aux membres d'envoyer des messages.";

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

  // === Vérification permissions
  if (
    !admins.includes(sender) &&
    !global.owners.includes(senderClean) &&
    !sudo.includes(senderClean)
  ) {
    return await sock.sendMessage(from, { text: "❌ Tu dois être admin pour utiliser cette commande." }, { quoted: msg });
  }

  try {
    // === Réouverture du groupe
    await sock.groupSettingUpdate(from, "not_announcement");

    await sock.sendMessage(from, {
      text: "🔓 *Match repris !*\nLes joueurs peuvent à nouveau communiquer sur le terrain."
    });

  } catch (e) {
    await sock.sendMessage(from, { text: "❌ Erreur lors de l'ouverture du groupe." }, { quoted: msg });
  }
}