// ⚽ Bachira V1 – vv.js
// Enlève la vue unique + réaction automatique ⚽

export default {
  name: "vv",
  alias: ["viewonce", "unview"],
  description: "Enlève la vue unique d'un média View Once",

  run: async ({ sock, m }) => {
    try {

      // Réaction automatique ⚽
      await sock.sendMessage(m.chat, {
        react: { text: "⚽", key: m.key }
      });

      if (!m.message) return m.reply("⚽ Aucune vue unique détectée.");

      // Détecte la vraie structure ViewOnce
      const viewed =
        m.message.viewOnceMessageV2 ||
        m.message.viewOnceMessageV2Extension;

      if (!viewed) return m.reply("⚽ Ce message n'est pas une vue unique.");

      const realMessage = viewed.message;
      const mediaType = Object.keys(realMessage)[0];

      let fileBuffer;
      let mimeType;

      // Téléchargement du média original
      if (mediaType === "imageMessage") {
        fileBuffer = await sock.downloadMediaMessage({ message: realMessage });
        mimeType = realMessage.imageMessage.mimetype;
      } 
      else if (mediaType === "videoMessage") {
        fileBuffer = await sock.downloadMediaMessage({ message: realMessage });
        mimeType = realMessage.videoMessage.mimetype;
      } 
      else if (mediaType === "audioMessage") {
        fileBuffer = await sock.downloadMediaMessage({ message: realMessage });
        mimeType = realMessage.audioMessage.mimetype;
      } 
      else {
        return m.reply("⚽ Format non supporté.");
      }

      // Réenvoi sans vue unique
      await sock.sendMessage(
        m.chat,
        {
          [mediaType.replace("Message", "")]: fileBuffer,
          mimetype: mimeType,
          caption: "⚽ *Vue unique désactivée*",
        },
        { quoted: m }
      );

    } catch (e) {
      console.log("VV ERROR:", e);
      m.reply("⚽ Une erreur est survenue lors du traitement.");
    }
  },
};