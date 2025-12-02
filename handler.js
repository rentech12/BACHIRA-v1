import { db } from '../lib/database.js';
import { isOwner, isMod, isGroup } from '../lib/functions.js';
import { config } from '../lib/config.js';

// Import des commandes
import ping from '../commands/ping.js';
import about from '../commands/about.js';
import menu from '../commands/menu.js';
import antisticker from '../commands/antisticker.js';
import antilink from '../commands/antilink.js';
import autoread from '../commands/autoread.js';
import autoresponder from '../commands/autoresponder.js';
import autoview from '../commands/autoview.js';
import audio from '../commands/audio.js';
import gif from '../commands/gif.js';
import video from '../commands/video.js';
import bug from '../commands/bug.js';
import spam from '../commands/spam.js';
import antispam from '../commands/antispam.js';
import antipromote from '../commands/antipromote.js';
import promote from '../commands/promote.js';
import allmenu from '../commands/allmenu.js';
import kick from '../commands/kick.js';
import antipurge from '../commands/antipurge.js';
import kill from '../commands/kill.js';
import tagall from '../commands/tagall.js';
import left from '../commands/left.js';
import hidetag from '../commands/hidetag.js';
import info from '../commands/info.js';
import depromote from '../commands/depromote.js';
import antidepromote from '../commands/antidepromote.js';
import img from '../commands/img.js';
import fancy from '../commands/fancy.js';
import faketyping from '../commands/faketyping.js';
import alwaysonline from '../commands/alwaysonline.js';
import neveronline from '../commands/neveronline.js';
import autoreact from '../commands/autoreact.js';
import chautoreact from '../commands/chautoreact.js';
import block from '../commands/block.js';
import unblock from '../commands/unblock.js';
import add from '../commands/add.js';
import joke from '../commands/joke.js';
import join from '../commands/join.js';
import play from '../commands/play.js';
import antidelete from '../commands/antidelete.js';
import clearall from '../commands/clearall.js';
import linkgc from '../commands/linkgc.js';

export async function handler(m, socket) {
  try {
    if (!m.message) return;
    
    const text = (m.message.conversation || 
                  m.message.extendedTextMessage?.text || 
                  m.message.imageMessage?.caption || '').trim();
    
    if (!text.startsWith(config.prefix)) return;
    
    const [cmd, ...args] = text.slice(config.prefix.length).split(' ');
    const command = cmd.toLowerCase();
    const sender = m.key.participant || m.key.remoteJid;
    
    // Vérifier si l'utilisateur est bloqué
    if (db.blocked.includes(sender.split('@')[0])) return;
    
    // Anti-spam
    const user = db.getUser(sender);
    const now = Date.now();
    if (now - user.lastCommand < 2000) {
      await m.reply('⚠️ *Anti-spam*: Veuillez attendre 2 secondes entre chaque commande.');
      return;
    }
    user.lastCommand = now;
    
    switch(command) {
      case 'ping': {
        await m.react('🏓');
        await ping(m, socket);
        break;
      }
      
      case 'about':
      case 'info': {
        await m.react('📝');
        await about(m, socket);
        break;
      }
      
      case 'menu':
      case 'help': {
        await m.react('📋');
        await menu(m, socket, args);
        break;
      }
      
      case 'antisticker': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🛡️');
        await antisticker(m, socket, args);
        break;
      }
      
      case 'antilink': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🔗');
        await antilink(m, socket, args);
        break;
      }
      
      case 'autoread': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('👁️');
        await autoread(m, socket, args);
        break;
      }
      
      case 'autoresponder': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🤖');
        await autoresponder(m, socket, args);
        break;
      }
      
      case 'autoview': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('👁️');
        await autoview(m, socket, args);
        break;
      }
      
      case 'audio': {
        await m.react('🎵');
        await audio(m, socket, args);
        break;
      }
      
      case 'gif': {
        await m.react('🎬');
        await gif(m, socket, args);
        break;
      }
      
      case 'video':
      case 'vv': {
        await m.react('🎥');
        await video(m, socket, args);
        break;
      }
      
      case 'bug': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('🐛');
        await bug(m, socket, args);
        break;
      }
      
      case 'spam': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('⚠️');
        await spam(m, socket, args);
        break;
      }
      
      case 'antispam': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*);
          return;
        }
        await m.react('🛡️');
        await antispam(m, socket, args);
        break;
      }
      
      case 'antipromote': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('👑');
        await antipromote(m, socket, args);
        break;
      }
      
      case 'promote': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('⬆️');
        await promote(m, socket, args);
        break;
      }
      
      case 'allmenu': {
        await m.react('📜');
        await allmenu(m, socket);
        break;
      }
      
      case 'kick': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('👢');
        await kick(m, socket, args);
        break;
      }
      
      case 'antipurge': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🛡️');
        await antipurge(m, socket, args);
        break;
      }
      
      case 'kill':
      case 'stop': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('💀');
        await kill(m, socket);
        break;
      }
      
      case 'tagall': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🏷️');
        await tagall(m, socket, args);
        break;
      }
      
      case 'left': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('👋');
        await left(m, socket, args);
        break;
      }
      
      case 'hidetag': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('👻');
        await hidetag(m, socket, args);
        break;
      }
      
      case 'depromote': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('⬇️');
        await depromote(m, socket, args);
        break;
      }
      
      case 'antidepromote': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🛡️');
        await antidepromote(m, socket, args);
        break;
      }
      
      case 'img':
      case 'image': {
        await m.react('🖼️');
        await img(m, socket, args);
        break;
      }
      
      case 'fancy': {
        await m.react('✨');
        await fancy(m, socket, args);
        break;
      }
      
      case 'faketyping': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('⌨️');
        await faketyping(m, socket, args);
        break;
      }
      
      case 'alwaysonline': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('🟢');
        await alwaysonline(m, socket, args);
        break;
      }
      
      case 'neveronline': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('⚫');
        await neveronline(m, socket, args);
        break;
      }
      
      case 'autoreact': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('❤️');
        await autoreact(m, socket, args);
        break;
      }
      
      case 'chautoreact': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('💬');
        await chautoreact(m, socket, args);
        break;
      }
      
      case 'block': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('🚫');
        await block(m, socket, args);
        break;
      }
      
      case 'unblock': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('✅');
        await unblock(m, socket, args);
        break;
      }
      
      case 'add': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('➕');
        await add(m, socket, args);
        break;
      }
      
      case 'joke': {
        await m.react('😂');
        await joke(m, socket);
        break;
      }
      
      case 'join': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('📥');
        await join(m, socket, args);
        break;
      }
      
      case 'play': {
        await m.react('🎮');
        await play(m, socket, args);
        break;
      }
      
      case 'antidelete': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🗑️');
        await antidelete(m, socket, args);
        break;
      }
      
      case 'clearall': {
        if (!await isOwner(sender)) {
          await m.reply('❌ *Owner uniquement*');
          return;
        }
        await m.react('🧹');
        await clearall(m, socket);
        break;
      }
      
      case 'linkgc':
      case 'linkgroup': {
        if (!await isOwner(sender) && !await isMod(sender)) {
          await m.reply('❌ *Permission refusée*');
          return;
        }
        await m.react('🔗');
        await linkgc(m, socket);
        break;
      }
      
      default: {
        // Vérifier les réponses automatiques
        if (db.autoreply[command]) {
          await m.reply(db.autoreply[command]);
        }
        break;
      }
    }
    
  } catch (error) {
    console.error('Handler error:', error);
  }
}

export default handler;
