// 🩸 BACHIRA-v1 BOT — demoteall.js
// Déclassement de tous les admins d’un groupe
// Compatible index.js BACHIRA-v1 BOT

export const name = "demoteall";

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;

  // Réaction automatique 🩸
  await sock.sendMessage(from, {
    react: { text: "🩸", key: msg.key }
  });

  // Vérifie groupe
  if (!from.endsWith("@g.us")) {
    return await sock.sendMessage(from, {
      text: "🩸 *Commande utilisable uniquement dans un groupe.*"
    }, { quoted: msg });
  }

  // Récupère infos groupe
  const group = await sock.groupMetadata(from);
  const participants = group.participants;

  // Liste des admins
  const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");

  // Aucun admin ? 🤔
  if (admins.length === 0) {
    return await sock.sendMessage(from, {
      text: "🩸 Aucun admin trouvé."
    }, { quoted: msg });
  }

  // Ton numéro → on ne te rétrograde jamais
  const me = msg.key.fromMe ? sock.user.id : msg.key.participant;

  // Filtrer : enlever *toi*
  const targetAdmins = admins.filter(a => a.id !== me);

  if (targetAdmins.length === 0) {
    return await sock.sendMessage(from, {
      text: "🩸 Impossible : tu es le seul admin."
    }, { quoted: msg });
  }

  // Message avant action
  await sock.sendMessage(from, {
    text: "🩸 *Déclassement de tous les admins…*"
  });

  // Appliquer les rétrogradations
  await sock.groupParticipantsUpdate(
    from,
    targetAdmins.map(u => u.id),
    "demote"
  );

  // Confirmation
  await sock.sendMessage(from, {
    text: `🩸 *Tous les admins ont été déclassés avec succès.*`
  });
}