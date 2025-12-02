import { db } from '../lib/database.js';

async function autoresponder(m, socket, args) {
  const action = args[0]?.toLowerCase();
  const trigger = args[1];
  const response = args.slice(2).join(' ');
  
  if (action === 'add') {
    if (!trigger || !response) {
      await m.reply('❌ Usage: !autoresponder add [trigger] [response]');
      return;
    }
    db.autoreply[trigger] = response;
    await m.reply(`✅ Auto-réponse ajoutée:\n*Trigger:* ${trigger}\n*Réponse:* ${response}`);
  } else if (action === 'del') {
    if (!trigger) {
      await m.reply('❌ Usage: !autoresponder del [trigger]');
      return;
    }
    delete db.autoreply[trigger];
    await m.reply(`✅ Auto-réponse supprimée: ${trigger}`);
  } else if (action === 'list') {
    const list = Object.entries(db.autoreply).map(([t, r]) => `• ${t} → ${r}`).join('\n');
    await m.reply(`📋 *Auto-réponses:*\n${list || 'Aucune auto-réponse configurée.'}`);
  } else {
    await m.reply('📌 *Auto-responder*\n\n!autoresponder add [trigger] [response]\n!autoresponder del [trigger]\n!autoresponder list');
  }
  
  await db.save();
}

export default autoresponder;
