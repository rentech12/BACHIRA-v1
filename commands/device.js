// === Bachira-v1 BOT ===
// Auteur : REN-TECH

import { getDevice } from "@whiskeysockets/baileys";

export const name = "device";

export const description = "Détecte l'appareil utilisé par un utilisateur (Android, iPhone, Web, etc.)";

export const usage = ".device";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo;

    // Réaction automatique
    await sock.sendMessage(from, { react: { text: "📱", key: msg.key } });

    // Vérifie si l'utilisateur a bien répondu à un message
    if (!quoted?.stanzaId) {
      await sock.sendMessage(
        from,
        { text: "*Bachira-v1* : Réponds à un message pour détecter l'appareil utilisé." },
        { quoted: msg }
      );
      return;
    }

    // Récupère le device de l'auteur du message cité
    const device = getDevice(quoted.stanzaId) || "un appareil inconnu";

    // Envoie le résultat
    await sock.sendMessage(
      from,
      {
        text: `*Bachira-v1* : L'utilisateur utilise *${device}*.`,
      },
      { quoted: msg }
    );

  } catch (e) {
    console.error(e);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Une erreur est survenue lors de la détection de l'appareil." },
      { quoted: msg }
    );
  }
}