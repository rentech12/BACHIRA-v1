// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const config = require('./config');
const handleCommand = require('./case');
const { askPhoneNumber, startPairing } = require('./lib/pairing');
const { subscribeToNewsletter } = require('./lib/newsletter');

// Configuration du logger
const logger = pino({ level: 'silent' });
const app = express();
const PORT = process.env.PORT || 3000;

// Serveur web simple pour garder le bot actif
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>${config.botName}</title></head>
      <body>
        <h1>🤖 ${config.botName} est actif!</h1>
        <p>Statut: ✅ Connecté à WhatsApp</p>
        <p>Newsletter: ${config.newsletterId}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Serveur web démarré sur port ${PORT}`);
});

// Fonction principale
async function startBot() {
  console.log(`
╔══════════════════════════╗
║   🤖 ${config.botName}        ║
║   Démarrage en cours...   ║
╚══════════════════════════╝
  `);

  const { state, saveCreds } = await useMultiFileAuthState(`./${config.sessionName}`);
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: logger,
    browser: ['Meguru Bot', 'Chrome', '1.0.0']
  });

  // Gestion des mises à jour de connexion
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scannez ce QR code avec WhatsApp:');
      console.log(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection fermée:', lastDisconnect.error?.message);
      
      if (shouldReconnect) {
        console.log('🔄 Reconnexion dans 5 secondes...');
        setTimeout(startBot, 5000);
      }
    } else if (connection === 'open') {
      console.log('✅ Connecté à WhatsApp!');
      
      // Demander le mode de connexion
      console.log('\n📱 Choisissez votre méthode de connexion:');
      console.log('1. QR Code (plus simple)');
      console.log('2. Code de pairing (si QR ne marche pas)');
      
      setTimeout(async () => {
        // S'abonner à la newsletter
        await subscribeToNewsletter(sock);
        
        console.log(`\n⚡ Bot prêt! Utilisez ${config.prefix}menu pour les commandes`);
        console.log(`📢 Newsletter: ${config.newsletterId}`);
      }, 2000);
    }
  });

  // Sauvegarde des identifiants
  sock.ev.on('creds.update', saveCreds);

  // Gestion des messages entrants
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const m = messages[0];
    
    if (!m.message || m.key.fromMe) return;
    
    const sender = m.key.remoteJid;
    const messageType = Object.keys(m.message)[0];
    const messageText = m.message.conversation || 
                       m.message.extendedTextMessage?.text || 
                       m.message.imageMessage?.caption || '';
    
    // Extraire les infos du message
    const pushName = m.pushName || 'Utilisateur';
    const isOwner = sender.includes(config.ownerNumber.split('@')[0]) || 
                   sender.includes(config.ownerNumber.replace('@s.whatsapp.net', ''));

    // Vérifier si c'est une commande
    if (messageText.startsWith(config.prefix)) {
      const args = messageText.slice(config.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      const msgInfo = {
        sender,
        pushName,
        messageType,
        command,
        args,
        isOwner
      };

      console.log(`📩 Commande: ${config.prefix}${command} de ${pushName} (${sender})`);
      await handleCommand(sock, m, msgInfo);
    } else if (config.readMessages) {
      // Lire les messages si configuré
      await sock.readMessages([m.key]);
    }
  });

  // Gestion des erreurs
  process.on('uncaughtException', (err) => {
    console.log('❌ Erreur non catchée:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.log('❌ Promise rejetée:', err);
  });
}

// Lancer le bot
startBot();
