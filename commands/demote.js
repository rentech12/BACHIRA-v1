// 🩸 BACHIRA-v1 — DEMOTE (RETIRER ADMIN)

export const name = "demote";

export async function execute(sock, msg, args) {

  const from = msg.key.remoteJid;

  // Réaction automatique 🩸

  await sock.sendMessage(from, {

    react: { text: "🩸", key: msg.key }

  });

  const quoted = msg.message?.extendedTextMessage?.contextInfo;

  let target;

  // 1️⃣ @mention

  if (quoted?.mentionedJid?.length) {

    target = quoted.mentionedJid[0];

  }

  // 2️⃣ message répondu

  else if (quoted?.participant) {

    target = quoted.participant;

  }

  // 3️⃣ numéro → .demote 2376XXXXXXXX

  else if (args[0]) {

    let num = args[0].replace(/[^0-9]/g, "");

    if (num.length < 5) {

      return await sock.sendMessage(from, {

        text: "❌ Numéro invalide."

      }, { quoted: msg });

    }

    target = `${num}@s.whatsapp.net`;

  }

  // 4️⃣ aucune cible

  else {

    return await sock.sendMessage(from, {

      text: "🩸 *Usage :*\n- .demote @tag\n- .demote (en répondant)\n- .demote 2376XXXXXXXX"

    }, { quoted: msg });

  }

  // Vérifier si on est dans un groupe

  if (!from.endsWith("@g.us")) {

    return await sock.sendMessage(from, {

      text: "❌ Cette commande fonctionne dans un groupe uniquement."

    }, { quoted: msg });

  }

  // === RETIRER ADMIN ===

  try {

    await sock.groupParticipantsUpdate(from, [target], "demote");

    await sock.sendMessage(from, {

      text: `🩸 *Rétrogradation effectuée !*\n> ${target.split("@")[0]} n'est plus *ADMIN*.`

    }, { quoted: msg });

  } catch (error) {

    await sock.sendMessage(from, {

      text: "❌ Impossible de rétrograder cette personne."

    }, { quoted: msg });

  }

}