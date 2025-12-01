/**
 * BACHIRA V1 - Bot WhatsApp Multifonction
 * Développé par REN ❤️
 * Version: 1.0.0
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');

// ================= CONFIGURATION =================
const app = express();
const PORT = process.env.PORT || 3000;

moment.locale('fr');

// Configuration WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "bachira-v1",
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Variables globales BACHIRA
global.BACHIRA = {
    commands: new Map(),
    pairs: new Map(),
    autoResponders: new Map(),
    userData: new Map(),
    groupSettings: new Map(),
    games: new Map(),
    economy: new Map(),
    cooldowns: new Map(),
    stats: {
        messages: 0,
        commands: 0,
        users: new Set(),
        startTime: Date.now()
    }
};

// ================= CHARGEMENT DES MODULES =================
async function loadBachiraModules() {
    console.log('🎮 BACHIRA V1 - Chargement des modules...');
    
    // Charger les configurations
    const configs = await loadConfigs();
    
    // Charger les commandes
    await loadCommands();
    
    // Charger la base de données
    await loadDatabase();
    
    // Charger les auto-répondeurs
    await loadAutoResponders();
    
    console.log(`✅ BACHIRA prêt avec ${global.BACHIRA.commands.size} commandes!`);
}

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'src', 'commands');
    const categories = ['admin', 'fun', 'tools', 'media', 'games', 'utils', 'mod', 'search', 'download', 'ai'];
    
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        
        if (await fs.pathExists(categoryPath)) {
            const files = await fs.readdir(categoryPath);
            
            for (const file of files.filter(f => f.endsWith('.js'))) {
                try {
                    const cmdPath = path.join(categoryPath, file);
                    const command = require(cmdPath);
                    
                    if (command.config && command.config.name) {
                        global.BACHIRA.commands.set(command.config.name, command);
                        
                        // Ajouter les alias
                        if (command.config.aliases) {
                            command.config.aliases.forEach(alias => {
                                global.BACHIRA.commands.set(alias, command);
                            });
                        }
                        
                        console.log(`🎯 ${command.config.name} (${category})`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur ${file}:`, error.message);
                }
            }
        }
    }
}

// ================= GESTION DES ÉVÉNEMENTS =================
client.on('qr', qr => {
    console.log('\n🔐 BACHIRA - SCANNEZ LE QR CODE:\n');
    qrcode.generate(qr, { small: true });
    
    // Sauvegarder QR
    const qrText = `=== BACHIRA V1 ===\n${new Date().toLocaleString()}\n\n${qr}`;
    fs.writeFileSync('./data/qr_code.txt', qrText);
});

client.on('ready', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🤖 BACHIRA V1 - PRÊT AU COMBAT!');
    console.log('='.repeat(50));
    console.log(`👤 Nom: ${client.info.pushname}`);
    console.log(`📱 Numéro: ${client.info.wid.user}`);
    console.log(`🎮 Commandes: ${global.BACHIRA.commands.size}`);
    console.log(`🕒 Démarrage: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50) + '\n');
    
    loadBachiraModules();
    startBachiraServices();
    
    // Message de bienvenue aux admins
    sendStartupMessage();
});

client.on('message', async message => {
    try {
        global.BACHIRA.stats.messages++;
        
        // Ignorer les messages du bot
        if (message.fromMe) return;
        
        // Journalisation
        logBachiraMessage(message);
        
        // Vérifier anti-spam
        if (await checkSpam(message)) return;
        
        // Traitement spécial pour les groupes
        const chat = await message.getChat();
        if (chat.isGroup) {
            await handleGroupMessage(message, chat);
        }
        
        // Vérifier auto-répondeurs
        await checkAutoResponders(message);
        
        // Vérifier appairage
        if (await checkPairing(message)) return;
        
        // Gérer les commandes
        await handleCommand(message);
        
    } catch (error) {
        console.error('❌ Erreur BACHIRA:', error);
    }
});

// ================= GESTION DES COMMANDES =================
async function handleCommand(message) {
    const prefix = process.env.PREFIX || '!';
    const body = message.body.trim();
    
    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    
    // Vérifier cooldown
    if (await checkCooldown(message.from, cmdName)) {
        return;
    }
    
    const command = global.BACHIRA.commands.get(cmdName);
    
    if (!command) {
        return message.reply(`❌ Commande inconnue. Tape *${prefix}menu* pour l'aide.`);
    }
    
    // Vérifier permissions
    if (!await verifyPermissions(message, command)) {
        return;
    }
    
    // Exécuter la commande
    try {
        global.BACHIRA.stats.commands++;
        await command.execute(message, args, client, global.BACHIRA);
        
        // Mettre à jour les stats utilisateur
        updateUserStats(message.from, cmdName);
        
    } catch (error) {
        console.error(`💥 Erreur ${cmdName}:`, error);
        await message.reply('💥 Erreur d\'exécution. Contactez l\'admin.');
    }
}

// ================= FONCTIONS BACHIRA =================
async function verifyPermissions(message, command) {
    const chat = await message.getChat();
    const isAdmin = await checkAdmin(message.from);
    
    // Commandes admin seulement
    if (command.config.adminOnly && !isAdmin) {
        await message.reply('🔒 Commande réservée aux administrateurs!');
        return false;
    }
    
    // Commandes groupe seulement
    if (command.config.groupOnly && !chat.isGroup) {
        await message.reply('👥 Cette commande fonctionne seulement en groupe!');
        return false;
    }
    
    // Commandes privées seulement
    if (command.config.privateOnly && chat.isGroup) {
        await message.reply('🔐 Cette commande fonctionne seulement en privé!');
        return false;
    }
    
    return true;
}

async function checkAdmin(chatId) {
    const admins = (process.env.ADMIN_NUMBERS || '').split(',').map(n => n.trim());
    const contact = await client.getContactById(chatId);
    return admins.includes(contact.number);
}

async function checkPairing(message) {
    const chatId = message.from;
    
    if (global.BACHIRA.pairs.has(chatId)) {
        const targetId = global.BACHIRA.pairs.get(chatId);
        
        try {
            const targetChat = await client.getChatById(targetId);
            const sender = await message.getContact();
            
            await targetChat.sendMessage(
                `🔗 *Message de ${sender.name || sender.number}:*\n${message.body}`
            );
            
            await message.reply('✅ Message transféré!');
            return true;
        } catch (error) {
            global.BACHIRA.pairs.delete(chatId);
        }
    }
    return false;
}

async function checkAutoResponders(message) {
    const chatId = message.from;
    const text = message.body.toLowerCase();
    
    if (global.BACHIRA.autoResponders.has(chatId)) {
        const responses = global.BACHIRA.autoResponders.get(chatId);
        
        for (const [trigger, response] of responses) {
            if (text.includes(trigger.toLowerCase())) {
                await message.reply(response);
                return true;
            }
        }
    }
    
    // Auto-répondeurs globaux
    const globalResponses = [
        { trigger: 'bonjour', response: 'Salut ! 👋 Comment puis-je t\'aider?' },
        { trigger: 'merci', response: 'De rien ! 😊 N\'hésite pas si tu as besoin d\'autre chose.' },
        { trigger: 'bachira', response: 'Oui ? Je suis là ! 🎮 Tape !menu pour voir mes commandes.' }
    ];
    
    for (const { trigger, response } of globalResponses) {
        if (text.includes(trigger)) {
            await message.reply(response);
            return true;
        }
    }
    
    return false;
}

async function checkSpam(message) {
    const chatId = message.from;
    const now = Date.now();
    
    if (!global.BACHIRA.cooldowns.has(chatId)) {
        global.BACHIRA.cooldowns.set(chatId, { lastMessage: now, count: 1 });
        return false;
    }
    
    const userData = global.BACHIRA.cooldowns.get(chatId);
    const timeDiff = now - userData.lastMessage;
    
    if (timeDiff < 1000) { // 1 seconde
        userData.count++;
        
        if (userData.count > 5) {
            await message.reply('⚠️ Arrête de spammer !');
            return true;
        }
    } else {
        userData.count = 1;
    }
    
    userData.lastMessage = now;
    return false;
}

async function checkCooldown(chatId, commandName) {
    const key = `${chatId}_${commandName}`;
    const cooldownTime = 3000; // 3 secondes
    
    if (global.BACHIRA.cooldowns.has(key)) {
        const lastUsed = global.BACHIRA.cooldowns.get(key);
        const timeLeft = cooldownTime - (Date.now() - lastUsed);
        
        if (timeLeft > 0) {
            const seconds = Math.ceil(timeLeft / 1000);
            // On ne répond pas pour éviter le spam
            return true;
        }
    }
    
    global.BACHIRA.cooldowns.set(key, Date.now());
    setTimeout(() => global.BACHIRA.cooldowns.delete(key), cooldownTime);
    return false;
}

// ================= SERVICES BACHIRA =================
function startBachiraServices() {
    console.log('🚀 Démarrage des services BACHIRA...');
    
    // Sauvegarde automatique
    setInterval(saveBachiraData, 5 * 60 * 1000);
    
    // Nettoyage quotidien
    cron.schedule('0 3 * * *', cleanupBachira);
    
    // Stats journalières
    cron.schedule('0 0 * * *', sendDailyStats);
    
    // Backup GitHub
    if (process.env.GITHUB_TOKEN) {
        cron.schedule('0 2 * * *', backupToGitHub);
    }
}

async function saveBachiraData() {
    const data = {
        stats: global.BACHIRA.stats,
        pairs: Array.from(global.BACHIRA.pairs.entries()),
        autoResponders: Array.from(global.BACHIRA.autoResponders.entries()),
        userData: Array.from(global.BACHIRA.userData.entries()),
        lastBackup: new Date().toISOString()
    };
    
    await fs.writeJson('./data/bachira_data.json', data, { spaces: 2 });
    console.log('💾 Données BACHIRA sauvegardées');
}

async function backupToGitHub() {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) return;
    
    try {
        const data = await fs.readFile('./data/bachira_data.json', 'utf8');
        const base64Data = Buffer.from(data).toString('base64');
        
        await axios.put(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/backup.json`,
            {
                message: `Backup BACHIRA ${new Date().toISOString()}`,
                content: base64Data,
                branch: process.env.GITHUB_BRANCH || 'main'
            },
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('📤 Backup GitHub réussi');
    } catch (error) {
        console.error('❌ Erreur backup GitHub:', error.message);
    }
}

function logBachiraMessage(message) {
    const logEntry = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message.from} - ${message.body.substring(0, 50)}`;
    
    const logFile = `./logs/bachira_${moment().format('YYYY-MM-DD')}.log`;
    fs.appendFileSync(logFile, logEntry + '\n');
}

async function sendStartupMessage() {
    const admins = (process.env.ADMIN_NUMBERS || '').split(',');
    
    for (const admin of admins) {
        if (admin.trim()) {
            try {
                await client.sendMessage(
                    `${admin.trim()}@c.us`,
                    `🤖 *BACHIRA V1 démarré!*\n\n` +
                    `✅ Connexion établie\n` +
                    `🎮 ${global.BACHIRA.commands.size} commandes chargées\n` +
                    `🕒 ${moment().format('HH:mm:ss')}\n\n` +
                    `Tape !menu pour commencer!`
                );
            } catch (error) {
                console.log(`❌ Impossible de notifier ${admin}`);
            }
        }
    }
}

async function sendDailyStats() {
    const stats = global.BACHIRA.stats;
    const uptime = Date.now() - stats.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    
    const report = `📊 *RAPPORT QUOTIDIEN BACHIRA*\n\n` +
        `📨 Messages: ${stats.messages}\n` +
        `🎮 Commandes: ${stats.commands}\n` +
        `👥 Utilisateurs: ${stats.users.size}\n` +
        `⏱️ Uptime: ${hours}h\n` +
        `📅 ${moment().format('DD/MM/YYYY')}`;
    
    // Envoyer aux admins
    const admins = (process.env.ADMIN_NUMBERS || '').split(',');
    for (const admin of admins) {
        if (admin.trim()) {
            try {
                await client.sendMessage(`${admin.trim()}@c.us`, report);
            } catch (error) {
                // Ignorer les erreurs
            }
        }
    }
    
    // Réinitialiser les stats quotidiennes
    stats.messages = 0;
    stats.commands = 0;
}

// ================= SERVEUR WEB BACHIRA =================
app.use(express.json());
app.use(express.static('public'));

// Page d'accueil
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>BACHIRA V1 - Bot WhatsApp</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                h1 {
                    font-size: 3em;
                    margin-bottom: 20px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 20px;
                    border-radius: 10px;
                }
                .command-list {
                    text-align: left;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 BACHIRA V1</h1>
                <p>Bot WhatsApp Multifonction avec 68 commandes</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <h3>${global.BACHIRA.commands.size}</h3>
                        <p>Commandes</p>
                    </div>
                    <div class="stat-card">
                        <h3>${global.BACHIRA.stats.messages}</h3>
                        <p>Messages</p>
                    </div>
                    <div class="stat-card">
                        <h3>${global.BACHIRA.stats.users.size}</h3>
                        <p>Utilisateurs</p>
                    </div>
                    <div class="stat-card">
                        <h3>${Math.floor((Date.now() - global.BACHIRA.stats.startTime) / (1000 * 60 * 60))}h</h3>
                        <p>Uptime</p>
                    </div>
                </div>
                
                <div class="command-list">
                    <h3>📋 Commandes disponibles:</h3>
                    <ul>
                        ${Array.from(global.BACHIRA.commands.keys()).slice(0, 20).map(cmd => 
                            `<li><code>!${cmd}</code></li>`
                        ).join('')}
                        ${global.BACHIRA.commands.size > 20 ? 
                            `<li>... et ${global.BACHIRA.commands.size - 20} autres</li>` : ''}
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">
                    <strong>Prefix:</strong> !<br>
                    <strong>Version:</strong> 1.0.0<br>
                    <strong>Statut:</strong> ${client.info ? '✅ En ligne' : '⏳ Connexion...'}
                </p>
            </div>
        </body>
        </html>
    `);
});

// API pour les statistiques
app.get('/api/stats', (req, res) => {
    res.json({
        status: 'online',
        commands: global.BACHIRA.commands.size,
        messages: global.BACHIRA.stats.messages,
        users: global.BACHIRA.stats.users.size,
        uptime: Date.now() - global.BACHIRA.stats.startTime,
        pairs: global.BACHIRA.pairs.size,
        version: '1.0.0'
    });
});

// API pour le pairing
app.post('/api/pair', async (req, res) => {
    const { user1, user2 } = req.body;
    
    if (!user1 || !user2) {
        return res.status(400).json({ error: 'user1 et user2 requis' });
    }
    
    global.BACHIRA.pairs.set(user1, user2);
    global.BACHIRA.pairs.set(user2, user1);
    
    res.json({ success: true, message: 'Appairage réussi' });
});

// Webhook GitHub
app.post('/webhook/github', (req, res) => {
    if (req.headers['x-github-event'] === 'push') {
        console.log('🔄 Mise à jour GitHub reçue');
        
        // Redémarrer pour appliquer les changements
        setTimeout(() => {
            process.exit(0);
        }, 1000);
        
        res.json({ success: true, message: 'Redémarrage programmé' });
    } else {
        res.status(400).json({ error: 'Événement non supporté' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🌐 Interface BACHIRA: http://localhost:${PORT}`);
});

// ================= DÉMARRAGE BACHIRA =================
client.initialize();

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
    console.error('💥 Erreur non gérée:', error);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt de BACHIRA...');
    await saveBachiraData();
    process.exit(0);
});
