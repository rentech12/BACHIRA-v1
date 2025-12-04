// ⚽ Bachira V1 BOT — Commande tag.js
// Tag tous les membres avec un message personnalisé

export const name = "tag";

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;
  const group = await sock.groupMetadata(from);
  const participants = group.participants.map((p) => p.id);

  if (!args[0]) {
    await sock.sendMessage(from, { text: "📛 Usage : .tag votre message" }, { quoted: msg });
    return;
  }

  const message = args.join(" ");

  // Réaction automatique
  await sock.sendMessage(from, {
    react: { text: "⚽", key: msg.key }
  });

  // Envoi du tag
  await sock.sendMessage(
    from,
    {
      text: `⚽ *APPEL D'ÉQUIPE* ⚽\n\n${message}\n\n👥 *Joueurs appelés :*`,
      mentions: participants,
    },
    { quoted: msg }
  );
}