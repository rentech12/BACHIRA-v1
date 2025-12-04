import fs from "fs";
import { exec } from "child_process";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const name = "sticker";

export async function execute(sock, msg, args) {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.pushName || "Anonyme";

    // Vérifie le message cité
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const type = quoted ? Object.keys(quoted)[0] : Object.keys(msg.message)[0];

    if (type !== "imageMessage" && type !== "videoMessage") {
      await sock.sendMessage(from, {
        text: "📸 *Réponds à une image ou une courte vidéo pour en faire un sticker.*",
      }, { quoted: msg });
      return;
    }

    // Télécharge le média
    const message = quoted ? quoted[type] : msg.message[type];
    const stream = await downloadContentFromMessage(
      message,
      type === "imageMessage" ? "image" : "video"
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Chemins temporaires
    const inputPath = `./temp_${Date.now()}.${type === "imageMessage" ? "jpg" : "mp4"}`;
    const outputPath = `./sticker_${Date.now()}.webp`;
    fs.writeFileSync(inputPath, buffer);

    // Texte gravé
    const watermark = `${sender} ✦ BACHIRA V1`;

    // Conversion + ajout du nom sur le sticker
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,drawtext=text='${watermark}':x=(w-text_w)-10:y=(h-text_h)-10:fontcolor=white:fontsize=18:borderw=1:bordercolor=black,fps=15,pad=512:512:-1:-1:color=black" -loop 0 -an -vsync 0 -s 512x512 -f webp ${outputPath}`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    const stickerBuffer = fs.readFileSync(outputPath);

    // Envoi du sticker sans message texte
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

    // Nettoyage
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

  } catch (err) {
    console.error("❌ Erreur sticker.js :", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Une erreur est survenue. Assure-toi que *ffmpeg* est installé.",
    }, { quoted: msg });
  }
}