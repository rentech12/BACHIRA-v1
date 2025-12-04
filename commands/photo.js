import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const name = "photo";
export const description = "Transforme une image, sticker ou vid¨¦o en photo avec le sceau BACHIRA V1";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // D¨¦tecte le type de m¨¦dia (image / sticker / vid¨¦o)
    const type = quoted
      ? Object.keys(quoted)[0]
      : Object.keys(msg.message)[0];

    if (
      type !== "imageMessage" &&
      type !== "stickerMessage" &&
      type !== "videoMessage"
    ) {
      await sock.sendMessage(
        from,
        { text: "? R¨¦ponds ¨¤ une *image, sticker ou vid¨¦o* pour la transformer en photo." },
        { quoted: msg }
      );
      return;
    }

    // S¨¦lection du message contenant le m¨¦dia
    const mediaMessage = quoted ? { message: quoted } : msg;

    // D¨¦termine le bon type de contenu
    const contentType =
      type === "stickerMessage"
        ? "sticker"
        : type === "imageMessage"
        ? "image"
        : "video";

    // T¨¦l¨¦chargement du m¨¦dia
    const stream = await downloadContentFromMessage(
      mediaMessage.message[type],
      contentType
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Envoi de l'image convertie avec nouvelle l¨¦gende
    const caption = `
> ? *Le g¨¦nie du dribble BACHIRA r¨¦v¨¨le la vraie forme...*

> ? *Transform¨¦ par BACHIRA V1 BOT - L'art du football* ?
`.trim();

    await sock.sendMessage(
      from,
      {
        image: buffer,
        caption
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("? Erreur photo :", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "? Une erreur est survenue pendant la transformation en photo.",
    });
  }
}