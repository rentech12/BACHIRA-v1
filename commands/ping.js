// 𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 ⚽𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1 ⚽

// === Commande : ping.js ===

// Vérifie la latence et réagit avec ⚽

import chalk from "chalk";

export const name = "ping";

export const description = "Vérifie la latence du bot et réagit avec ⚽";

export const usage = ".pong";

export async function execute(sock, m) {

  try {

    // ⚽ Réaction automatique

    await sock.sendMessage(m.key.remoteJid, {

      react: { text: "⚽", key: m.key },

    });

    const start = Date.now();

    const sent = await sock.sendMessage(

      m.key.remoteJid,

      { text: "🏓 *Pong...*" },

      { quoted: m }

    );

    const end = Date.now();

    const ping = end - start;

    const msg = `✅ *Pong!*\n⏱️ Vitesse : *${ping} ms*\n ⚽𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝘼𝘾𝙃𝙄𝙍𝘼 𝙑1 ⚽`;
     

    await sock.sendMessage(m.key.remoteJid, { text: msg }, { quoted: sent });

    console.log(chalk.green(`[PING] Latence ${ping}ms ⚽`));

  } catch (err) {

    console.error(chalk.red("[PING] Erreur:"), err);

    await sock.sendMessage(

      m.key.remoteJid,

      { text: "⚠️ Erreur lors du test de ping." },

      { quoted: m }

    );

  }

}