// ⚽ Commande Leave — Bachira V1 BOT
// Sort le bot du groupe

export const name = "leave";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");

    // Réagir par ⚽
    await sock.sendMessage(from, {
      react: { text: "⚽", key: msg.key }
    });

    if (!isGroup) {
      return await sock.sendMessage(from, { text: "❌ Cette commande fonctionne uniquement dans un groupe." }, { quoted: msg });
    }

    // Message avant de quitter
    await sock.sendMessage(from, {
      text: "⚽ *Bachira V1 BOT* quitte le terrain..."
    }, { quoted: msg });

    // Quitter le groupe
    await sock.groupLeave(from);

  } catch (err) {
    console.log("Erreur leave.js :", err);
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Erreur dans la commande leave." }, { quoted: msg });
  }
}