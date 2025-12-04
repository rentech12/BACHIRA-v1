import fs from "fs";

export const name = "save";

export const description = "Sauvegarde le message cité";

export const usage = ".save (en réponse à un message)";

export async function execute(sock, msg, args) {

  const from = msg.key.remoteJid;

  // Réaction automatique ⚽

  await sock.sendMessage(from, {

    react: { text: "⚽", key: msg.key }

  });

  try {

    const quoted =

      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {

      return sock.sendMessage(

        from,

        { text: "⚽ Réponds à un message pour le sauvegarder." },

        { quoted: msg }

      );

    }

    // Crée le dossier /saved si absent

    if (!fs.existsSync("./saved")) {

      fs.mkdirSync("./saved");

    }

    const type = Object.keys(quoted)[0];

    let filename = `./saved/save_${Date.now()}`;

    // === Téléchargement des médias ===

    if (

      type === "imageMessage" ||

      type === "videoMessage" ||

      type === "audioMessage" ||

      type === "documentMessage"

    ) {

      const buffer = await sock.downloadMediaMessage({

        message: quoted

      });

      // Extensions fichiers

      const ext =

        type === "imageMessage"

          ? ".jpg"

          : type === "videoMessage"

          ? ".mp4"

          : type === "audioMessage"

          ? ".mp3"

          : quoted.documentMessage.fileName

          ? "_" + quoted.documentMessage.fileName

          : ".bin";

      filename += ext;

      fs.writeFileSync(filename, buffer);

    }

    // === Sauvegarde messages TEXT ===

    else if (

      type === "conversation" ||

      type === "extendedTextMessage" ||

      type === "textMessage"

    ) {

      filename += ".txt";

      const text =

        quoted.conversation ||

        quoted.extendedTextMessage?.text ||

        quoted.textMessage?.text ||

        "Message vide";

      fs.writeFileSync(filename, text);

    }

    // === Type non géré ===

    else {

      return sock.sendMessage(

        from,

        { text: "⚽ Format non supporté." },

        { quoted: msg }

      );

    }

    // === Confirmation ===

    await sock.sendMessage(

      from,

      {

        text: `⚽ Fichier sauvegardé dans :\n\n📁 *${filename}*`

      },

      { quoted: msg }

    );

  } catch (err) {

    console.log("SAVE ERROR :", err);

    await sock.sendMessage(

      from,

      { text: "⚠️ Erreur pendant la sauvegarde." },

      { quoted: msg }

    );

  }

}