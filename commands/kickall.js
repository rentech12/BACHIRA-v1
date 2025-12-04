// ⚽ kickall.js — Bachira V1 BOT
// Expulse tous les membres du groupe sauf owner, sudo et bot.

export const name = "kickall";

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith("@g.us");

  if (!isGroup) {
    return await sock.sendMessage(
      from,
      { text: "⚠️ Cette commande fonctionne uniquement en groupe." },
      { quoted: msg }
    );
  }

  // Infos groupe
  const metadata = await sock.groupMetadata(from);
  const participants = metadata.participants || [];

  // Helpers rapides
  const normalize = (jid) => jid?.split(":")[0].replace("@lid", "@s.whatsapp.net");
  const getNum = (jid) => String(jid).split("@")[0].replace(/[^0-9]/g, "");

  // ID bot
  const botId = normalize(sock.user?.id);
  const botNum = getNum(botId);

  // Owner + sudo
  const owners = global.owners || [];
  const sudo = JSON.parse(require("fs").readFileSync("./sudo.json")).sudo
    .map((x) => String(x).replace(/[^0-9]/g, ""));

  const allowed = [...owners, ...sudo];

  // ID utilisateur qui lance la commande
  const sender = normalize(msg.key.fromMe ? sock.user.id : msg.key.participant);
  const senderNum = getNum(sender);

  // Permission
  if (!allowed.includes(senderNum)) {
    return await sock.sendMessage(
      from,
      { text: "🚫 Tu n'as pas la permission d'utiliser cette commande." },
      { quoted: msg }
    );
  }

  // Réaction automatique ⚽
  await sock.sendMessage(from, { react: { text: "⚽", key: msg.key } });

  // Annonce
  await sock.sendMessage(from, { text: "⚽ *Nettoyage du terrain en cours…*" });

  // Sélection des membres à expulser
  const toKick = participants
    .map((p) => normalize(p.id))
    .filter((jid) => {
      const num = getNum(jid);
      return (
        num !== botNum &&          // pas le bot
        !owners.includes(num) &&   // pas owner
        !sudo.includes(num)        // pas sudo
      );
    });

  if (toKick.length === 0) {
    return await sock.sendMessage(from, { text: "✔️ Aucun membre à expulser." });
  }

  // Kick ultra rapide
  for (const jid of toKick) {
    try {
      await sock.groupParticipantsUpdate(from, [jid], "remove");
      await new Promise((r) => setTimeout(r, 120)); // Anti-ban
    } catch (e) {
      console.log("Erreur kick:", e);
    }
  }

  await sock.sendMessage(from, {
    text: `⚽ *Opération terminée.*\n${toKick.length} membres dribblés hors du terrain.`,
  });
}