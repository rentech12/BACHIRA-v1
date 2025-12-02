import { db } from '../lib/database.js';
import { isGroup } from '../lib/functions.js';

async function antilink(m, socket, args) {
  if (!isGroup(m)) {
    await m.reply('❌ Cette commande est uniquement pour les groupes.');
    return;
  }
  
  const group = db.getGroup(m.key.remoteJid);
  const action = args[0]?.toLowerCase();
  
  if (action === 'on') {
    group.antilink = true;
    group.antilinkAction = args[1] || 'warn';
    await m.reply('✅ *Anti-lien activé* dans ce groupe.');
  } else if (action === 'off') {
    group.antilink = false;
    await m.reply('✅ *Anti-lien désactivé* dans ce groupe.');
  } else {
    await m.reply(`📌 *Statut Anti-lien:* ${group.antilink ? '✅ Activé' : '❌ Désactivé'}\n📌 *Action:* ${group.antilinkAction || 'warn'}\n\nUtilisez: !antilink [on/off] [warn/kick]`);
  }
  
  await db.save();
}

export default antilink;
