require('dotenv').config();

const config = {
  // Configuration du bot
  botName: process.env.BOT_NAME || "BACHIRA V1",
  ownerNumber: process.env.OWNER_NUMBER || "50934264629", // Ton numéro WhatsApp (sans +)
  newsletterId: process.env.NEWSLETTER_ID || "120363423327928356@newsletter",

  // Session
  sessionName: process.env.SESSION_NAME || "bachira-session",
  sessionId: process.env.SESSION_ID || "", // ID de session depuis meguru-session-id.vercel.app

  // Paramètres
  prefix: process.env.PREFIX || ".",

  // Options
  readMessages: true,
  autoReact: false,
  autoRead: true,
};

module.exports = config;
