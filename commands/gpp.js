// gpp.js — Changer la photo d'un groupe via image
// Compatible Bachira-v1 BOT

import fs from "fs";

export const name = "gpp";
export const alias = ["setppgroup", "setgpp", "grouppp"];
export const react = "📸";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;

    // Vérifier si c'est un groupe
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "Cette commande ne fonctionne que dans un groupe." }, { quoted: msg });
    }

    // Vérifier que l'utilisateur est admin
    const groupMetadata = await sock.groupMetadata(from);
    const sender = msg.key.participant || msg.key.remoteJid;
    const isAdmin = groupMetadata.participants.some(
      (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!isAdmin) {
      return await sock.sendMessage(from, { text: "Tu dois être *admin* pour changer la photo du groupe." }, { quoted: msg });
    }

    // Vérifier si bot est admin
    const botId = sock.user.id;
    const botAdmin = groupMetadata.participants.some(
      (p) => p.id === botId && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!botAdmin) {
      return await sock.sendMessage(from, { text: "❌ Je ne peux pas changer la photo : je dois être *admin*." }, { quoted: msg });
    }

    // Vérifier si une image est citée
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage) {
      return await sock.sendMessage(from, { text: "Répond à une *image* avec :\n\n.gpp" }, { quoted: msg });
    }

    // Télécharger l'image
    const buffer = await sock.downloadMediaMessage({ message: quoted });

    if (!buffer) {
      return await sock.sendMessage(from, { text: "❌ Impossible de télécharger l'image." }, { quoted: msg });
    }

    // Créer un fichier temporaire
    const filename = "./pp_group.jpg";
    fs.writeFileSync(filename, buffer);

    // Appliquer la photo de profil
    await sock.updateProfilePicture(from, { url: filename });

    // Suppression du fichier local
    fs.unlinkSync(filename);

    // Réponse finale
    await sock.sendMessage(from, { text: "*Photo du groupe mise à jour avec succès !*" }, { quoted: msg });

  } catch (e) {
    console.log("Erreur gpp.js :", e);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Une erreur est survenue lors du changement de photo." }, { quoted: msg });
  }
}