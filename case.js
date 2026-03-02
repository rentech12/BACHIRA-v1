// case.js - Gestionnaire de commandes
const config = require('./config');
const { sendToNewsletter } = require('./lib/newsletter');

async function handleCommand(sock, message, msgInfo) {
  const { sender, pushName, messageType, command, args, isOwner } = msgInfo;
  const prefix = config.prefix;
  
  try {
    // Commande aide
    if (command === 'aide' || command === 'menu' || command === 'help') {
      const menuText = `╭━━━❰ *${config.botName}* ❱━━━╮
┃
┃ 👋 Salut *@${sender.split('@')[0]}*
┃
┃ 📋 *LISTE DES COMMANDES*
┃
┃ ╭━━❰ *GÉNÉRAL* ❱
┃ ┣ .menu / .aide
┃ ┣ .ping
┃ ┣ .info
┃ ┣ .newsletter
┃ ╰━━━━━━━━━━━
┃
┃ ╭━━❰ *ADMIN* ❱
┃ ┣ .say <message>
┃ ┣ .broadcast <message>
┃ ╰━━━━━━━━━━━
┃
╰━━━━━━━━━━━━━━━╯

📢 Newsletter: *MEGURU NEWS*
📌 ID: ${config.newsletterId}`;

      await sock.sendMessage(sender, { 
        text: menuText,
        mentions: [sender]
      });
      return;
    }

    // Commande ping
    if (command === 'ping') {
      await sock.sendMessage(sender, { 
        text: '🏓 Pong!\n⚡ Vitesse: ' + Date.now() + 'ms'
      });
      return;
    }

    // Commande info
    if (command === 'info') {
      const info = `🤖 *${config.botName}*\n\n` +
        `📌 Version: 1.0.0\n` +
        `👤 Propriétaire: ${config.ownerNumber}\n` +
        `⚡ Status: Actif\n` +
        `📅 Date: ${new Date().toLocaleDateString()}`;
      
      await sock.sendMessage(sender, { text: info });
      return;
    }

    // Commande newsletter
    if (command === 'newsletter') {
      await sock.sendMessage(sender, { 
        text: `📢 *NEWSLETTER MEGURU*\n\nID: ${config.newsletterId}\n\nRejoignez notre newsletter pour les dernières mises à jour!` 
      });
      return;
    }

    // Commande say (admin seulement)
    if (command === 'say' && isOwner) {
      if (args.length === 0) {
        await sock.sendMessage(sender, { text: '❌ Format: .say <message>' });
        return;
      }
      
      const textToSay = args.join(' ');
      await sock.sendMessage(sender, { text: textToSay });
      
      // Optionnel: envoyer aussi à la newsletter
      // await sendToNewsletter(sock, { text: textToSay });
      return;
    }

    // Commande broadcast (admin seulement)
    if (command === 'broadcast' && isOwner) {
      if (args.length === 0) {
        await sock.sendMessage(sender, { text: '❌ Format: .broadcast <message>' });
        return;
      }

      const broadcastMsg = args.join(' ');
      
      // Envoyer à la newsletter
      await sendToNewsletter(sock, { 
        text: `📢 *BROADCAST*\n\n${broadcastMsg}` 
      });
      
      await sock.sendMessage(sender, { 
        text: '✅ Broadcast envoyé à la newsletter!' 
      });
      return;
    }

    // Commande inconnue
    if (command) {
      await sock.sendMessage(sender, { 
        text: `❓ Commande "${prefix}${command}" inconnue.\nTapez *${prefix}menu* pour voir les commandes.` 
      });
    }

  } catch (error) {
    console.log('❌ Erreur commande:', error);
    await sock.sendMessage(sender, { 
      text: '❌ Une erreur est survenue lors du traitement de la commande.' 
    });
  }
}

module.exports = handleCommand;
