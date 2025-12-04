// ⚽ Bachira V1 — PROMOTEALL (METTRE ADMIN TOUT LE MONDE)

export const name = "promoteall";

export async function execute(sock, msg) {
  const from = msg.key.remoteJid;

  // Réaction automatique ⚽
  await sock.sendMessage(from, {
    react: { text: "⚽", key: msg.key }
  });

  // Vérifier groupe
  if (!from.endsWith("@g.us")) {
    return await sock.sendMessage(
      from,
      { text: "❌ Cette commande fonctionne uniquement dans un groupe." },
      { quoted: msg }
    );
  }

  // Récupérer les infos du groupe
  const group = await sock.groupMetadata(from);
  const participants = group.participants;

  // ID du bot pour éviter de le promouvoir
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

  // Tous les membres sauf le bot
  const targets = participants
    .map(p => p.id)
    .filter(id => id !== botId);

  if (targets.length === 0) {
    return await sock.sendMessage(from, {
      text: "⚽ Aucun membre à promouvoir."
    }, { quoted: msg });
  }

  // Promouvoir tous les membres
  try {
    await sock.groupParticipantsUpdate(from, targets, "promote");

    await sock.sendMessage(from, {
      text: `⚽ *Toute l'équipe est maintenant capitaine !*\n👥 Membres promus : *${targets.length}*`
    }, { quoted: msg });

  } catch (e) {
    await sock.sendMessage(from, {
      text: "❌ Une erreur est survenue pendant la promotion."
    }, { quoted: msg });
  }
}