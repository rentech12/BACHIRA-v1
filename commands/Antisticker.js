import { db } from '../lib/database.js';
import { isGroup } from '../lib/functions.js';

async function antisticker(m, socket, args) {
  if (!isGroup(m)) {
    await m.reply('❌ Cette commande est uniquement pour les groupes.');
    return;
  }
  
  const group = db.getGroup(m.key.remoteJid);
  const action = args[0]?.toLowerCase();
  
  if (action === 'on') {
    group.antisticker = true;
    await m.reply('✅ *Anti-sticker activé* dans ce groupe.');
  } else if (action === 'off') {
    group.antisticker = false;
    await m.reply('✅ *Anti-sticker désactivé* dans ce groupe.');
  } else {
    await m.reply(`📌 *Statut Anti-sticker:* ${group.antisticker ? '✅ Activé' : '❌ Désactivé'}\n\nUtilisez: !antisticker [on/off]`);
  }
  
  await db.save();
}

export default antisticker;
