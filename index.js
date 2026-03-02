// index.js - BACHIRA BOT V1
require('dotenv').config();

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handleCommand = require('./case');
const { subscribeToNewsletter } = require('./lib/newsletter');

// Logger silencieux
const logger = pino({ level: 'silent' });

// Serveur Express pour garder le bot actif (Katabump / Render / Railway)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>${config.botName}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1a1a2e; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 0 30px #00ff8855; }
          h1 { color: #00ff88; } p { color: #aaa; }
          .badge { background: #00ff88; color: #000; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🤖 ${config.botName}</h1>
          <p><span class="badge">✅ EN LIGNE</span></p>
          <p>Bot WhatsApp actif et opérationnel</p>
          <p style="font-size:12px; color:#555;">Uptime: ${Math.floor(process.uptime())}s</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Serveur web actif sur le port ${PORT}`);
});

// Restaurer session depuis SESSION_ID (env var)
async function restoreSession() {
  const sessionDir = `./${config.sessionName}`;
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  if (config.sessionId && !fs.existsSync(path.join(sessionDir, 'creds.json'))) {
    try {
      console.log('🔑 Restauration de la session depuis SESSION_ID...');
      // Le SESSION_ID peut être un JSON encodé en base64 ou une chaîne brute
      let credsData;
      try {
        credsData = JSON.parse(Buffer.from(config.sessionId, 'base64').toString('utf-8'));
      } catch {
        credsData = JSON.parse(config.sessionId);
      }
      fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(credsData, null, 2));
      console.log('✅ Session restaurée avec succès!');
    } catch (err) {
      console.log('⚠️  Impossible de restaurer la session:', err.message);
    }
  }
}

// Fonction principale
async function startBot() {
  await restoreSession();

  console.log(`
╔══════════════════════════════╗
║   🤖  ${config.botName.padEnd(22)}║
║   Démarrage en cours...      ║
╚══════════════════════════════╝
  `);

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(`./${config.sessionName}`);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger,
    browser: ['BACHIRA Bot', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  // Connexion
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scannez le QR code ci-dessus avec WhatsApp');
      console.log('💡 Ou utilisez SESSION_ID pour éviter le QR code');
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const reason = DisconnectReason;

      console.log('❌ Connexion fermée | Code:', code, '| Raison:', lastDisconnect?.error?.message);

      if (code === reason.loggedOut) {
        console.log('🚪 Session expirée. Suppression de la session...');
        fs.rmSync(`./${config.sessionName}`, { recursive: true, force: true });
        console.log('🔄 Redémarrage...');
        setTimeout(startBot, 3000);
      } else if (code === reason.restartRequired) {
        console.log('🔄 Redémarrage requis...');
        setTimeout(startBot, 2000);
      } else {
        console.log('🔄 Reconnexion dans 5 secondes...');
        setTimeout(startBot, 5000);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp!');
      console.log(`⚡ Préfixe: ${config.prefix} | Owner: ${config.ownerNumber}`);

      setTimeout(async () => {
        try {
          await subscribeToNewsletter(sock);
        } catch {}
        console.log(`\n🎉 ${config.botName} est prêt! Tapez ${config.prefix}menu`);
      }, 2000);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Messages entrants
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const m of messages) {
      try {
        if (!m.message) continue;
        if (m.key.fromMe) continue;

        const sender = m.key.remoteJid;
        if (!sender) continue;

        // Ignorer les channels/newsletters
        if (sender.endsWith('@newsletter')) continue;

        const messageType = Object.keys(m.message)[0];
        const messageText = (
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.imageMessage?.caption ||
          m.message.videoMessage?.caption ||
          ''
        ).trim();

        const pushName = m.pushName || 'Utilisateur';
        const isGroup = sender.endsWith('@g.us');

        // Vérifier owner
        const ownerNum = config.ownerNumber.replace(/[^0-9]/g, '');
        const senderNum = sender.replace(/[^0-9]/g, '');
        const isOwner = senderNum.includes(ownerNum) || ownerNum.includes(senderNum);

        // Auto-read
        if (config.autoRead) {
          await sock.readMessages([m.key]).catch(() => {});
        }

        // Traiter commande
        if (messageText.startsWith(config.prefix)) {
          const body = messageText.slice(config.prefix.length).trim();
          const args = body.split(/ +/);
          const command = args.shift().toLowerCase();

          if (!command) continue;

          const msgInfo = {
            sender,
            pushName,
            messageType,
            command,
            args,
            isOwner,
            isGroup,
            m,
          };

          console.log(`📩 [${isGroup ? 'GROUPE' : 'PRIVÉ'}] ${config.prefix}${command} — ${pushName}`);
          await handleCommand(sock, m, msgInfo);
        }
      } catch (err) {
        console.log('❌ Erreur message:', err.message);
      }
    }
  });

  // Erreurs globales
  process.on('uncaughtException', (err) => {
    console.log('❌ Exception non catchée:', err.message);
  });

  process.on('unhandledRejection', (err) => {
    console.log('❌ Promise rejetée:', err?.message || err);
  });

  return sock;
}

// Démarrage
startBot().catch(err => {
  console.error('❌ Erreur fatale:', err);
  setTimeout(startBot, 10000);
});
