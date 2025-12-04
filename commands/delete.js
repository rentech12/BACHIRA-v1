// 🩸 delete.js — Supprime un média

// === BACHIRA-v1 BOT ===

// Auteur : 🩸 BACHIRA-v1 🩸

export const name = "delete";

export const description = "Supprime un média (image, audio, vidéo, etc.) du chat.";

export const usage = ".delete (réponds à un média)";

export async function execute(sock, msg) {

  try {

    // Réagit automatiquement 🩸

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🩸", key: msg.key } });

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

    const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    const from = msg.key.remoteJid;

    if (!quoted) {

      await sock.sendMessage(from, { text: "⚠️ Réponds à un média pour le supprimer." }, { quoted: msg });

      return;

    }

    // Suppression du média (message complet)

    await sock.sendMessage(from, { delete: { remoteJid: from, id: key, fromMe: false, participant: participant } });

    // Confirmation

    await sock.sendMessage(from, { text: "✅ Média supprimé avec succès !" });

    


  } catch (error) {

    console.error("Erreur dans delete.js :", error);

    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Erreur : impossible de supprimer le média." }, { quoted: msg });

  }

}