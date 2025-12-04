export const name = "add";

export async function execute(sock, msg, args) {
  const from = msg.key.remoteJid;

  // Vérification groupe
  if (!from.endsWith("@g.us")) {
    await sock.sendMessage(from, { text: "🩸 *Commande utilisable uniquement en groupe.*" }, { quoted: msg });
    return;
  }

  // Num du calling user
  const sender = msg.key.fromMe ? sock.user.id : msg.key.participant;
  const senderNum = sender.split("@")[0].replace(/[^0-9]/g, "");

  // Permissions définies dans index.js
  const allowed = [...(global.owners || [])];

  if (!allowed.includes(senderNum)) {
    await sock.sendMessage(from, { text: "🩸 *Tu n’as pas la permission d’utiliser add.*" }, { quoted: msg });
    return;
  }

  // Numéro à ajouter
  if (!args[0]) {
    await sock.sendMessage(from, { text: "🩸 Usage : *.add 237XXXXXXXX*" }, { quoted: msg });
    return;
  }

  let number = args[0].replace(/[^0-9]/g, "");

  if (number.length < 8) {
    await sock.sendMessage(from, { text: "🩸 Numéro invalide." }, { quoted: msg });
    return;
  }

  const jid = number + "@s.whatsapp.net";

  try {
    await sock.groupParticipantsUpdate(from, [jid], "add");

    await sock.sendMessage(from, { 
      text: `🩸 *Ajout en cours…*\n\n➡️ @${number}`, 
      mentions: [jid] 
    }, { quoted: msg });

  } catch (e) {
    await sock.sendMessage(from, { text: "❌ Impossible d’ajouter ce numéro." }, { quoted: msg });
    console.log("Erreur add:", e);
  }
}