export const name = "invite";

export const description = "Génère le lien du groupe avec sa photo d'invocation.";

export async function execute(sock, m, args) {

  try {

    const from = m.key.remoteJid;

    // Vérifie si c'est bien un groupe

    if (!from.endsWith("@g.us")) {

      await sock.sendMessage(

        from,

        {

          text: `⚠️ *Ce rituel ne peut être invoqué que dans un groupe.*

⚽𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1 ⚽`,

        },

        { quoted: m }

      );

      return;

    }

    // Récupération des infos du groupe

    const metadata = await sock.groupMetadata(from);

    const groupName = metadata.subject;

    const groupDesc = metadata.desc || "Aucune description mystique.";

    const admins = metadata.participants

      .filter(p => p.admin !== null)

      .map(p => p.id);

    const sender = m.key.participant || m.key.remoteJid;

    // Vérifie si la personne est admin

    if (!admins.includes(sender)) {

      await sock.sendMessage(

        from,

        {

          text: `⛔ *Seuls les gardiens du cercle (admins)* peuvent invoquer le portail d'invitation.*

⚽𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1 ⚽`,

        },

        { quoted: m }

      );

      return;

    }

    // Récupération du lien d'invitation

    const code = await sock.groupInviteCode(from);

    const inviteLink = `https://chat.whatsapp.com/${code}`;

    // Récupération de la photo du groupe

    let pfpUrl;

    try {

      pfpUrl = await sock.profilePictureUrl(from, "image");

    } catch {

      pfpUrl =

        "https://i.ibb.co/6m1y7ZL/no-group-image.jpg"; // image par défaut si pas de photo

    }

    // Envoi du message avec photo

    await sock.sendMessage(from, {

      image: { url: pfpUrl },

      caption: `🌑 *Portail d'Invocation du Cercle* 🌑

📜 *Nom du Groupe :* ${groupName}

🪶 *Description :* ${groupDesc}

🔗 *Lien sacré :* ${inviteLink}

> ⚔️ *Partage-le avec prudence... les ombres observent.* 👁️‍🗨️

⚽𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1⚽`,

    }, { quoted: m });

  } catch (e) {

    await sock.sendMessage(

      m.key.remoteJid,

      {

        text: `❌ *Une force obscure a empêché l'invocation du portail.*

📜 *Détails :* ${e.message}

⚽𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1 ⚽`,

      },

      { quoted: m }

    );

  }

}