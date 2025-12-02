import { isGroup, getGroupMetadata } from '../lib/functions.js';

async function promote(m, socket, args) {
  if (!isGroup(m)) {
    await m.reply('❌ Cette commande est uniquement pour les groupes.');
    return;
  }
  
  const jid = m.key.remoteJid;
  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target = mentioned[0] || args[0]?.replace('@', '').split('@')[0] + '@s.whatsapp.net';
  
  if (!target) {
    await m.reply('❌ Mentionnez un utilisateur ou fournissez son numéro.\nEx: !promote @user');
    return;
  }
  
  try {
    await socket.groupParticipantsUpdate(jid, [target], 'promote');
    await m.reply(`✅ ${target.split('@')[0]} a été promu administrateur.`);
  } catch (error) {
    await m.reply(`❌ Erreur: ${error.message}`);
  }
}

export default promote;
