import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  delay
} from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { handler } from './handlers/handler.js';
import { handleEvents } from './handlers/commandHandler.js';
import { config } from './lib/config.js';
import fs from 'fs-extra';

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  
  const socket = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' }))
    },
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000
  });
  
  socket.ev.on('creds.update', saveCreds);
  
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('QR Code reçu:');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const reason = new DisconnectReason(lastDisconnect?.error);
      console.log('Déconnexion:', reason);
      
      if (reason === DisconnectReason.loggedOut) {
        console.log('Session supprimée, redémarrage...');
        await fs.remove(config.sessionPath);
        connectToWhatsApp();
      } else {
        console.log('Reconnexion...');
        setTimeout(connectToWhatsApp, 5000);
      }
    }
    
    if (connection === 'open') {
      console.log(`✅ ${config.name} connecté!`);
      console.log(`👤 Utilisateur: ${socket.user?.name}`);
      console.log(`🔧 Prefix: ${config.prefix}`);
    }
  });
  
  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    const m = messages[0];
    
    // Auto-read
    if (config.autoread && !m.key.fromMe) {
      await delay(1000);
      await socket.readMessages([m.key]);
    }
    
    // Auto-view
    if (config.autoview && !m.key.fromMe) {
      await delay(2000);
      await socket.sendReceipt(m.key.remoteJid, m.key.participant, [m.key.id], 'viewed');
    }
    
    // Gestion des commandes
    if (m.message) {
      await handler(m, socket);
    }
    
    // Gestion des événements
    await handleEvents(m, socket);
  });
  
  socket.ev.on('group-participants.update', async (update) => {
    console.log('Mise à jour participants:', update);
  });
  
  socket.ev.on('messages.update', async (updates) => {
    console.log('Messages mis à jour:', updates);
  });
  
  return socket;
}

// Gestion des erreurs non catchées
process.on('uncaughtException', (error) => {
  console.error('Erreur non catchée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse non gérée:', reason);
});

// Démarrer le bot
connectToWhatsApp();
