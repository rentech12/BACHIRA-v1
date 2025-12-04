import fs from 'fs';

export const name = 'autoresponder';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./autoresponder.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🤖 *Auto-répondeur*\n\nUsage:\n.autoresponder on/off\n.autoresponder add <trigger> <réponse>\n.autoresponder remove <trigger>\n.autoresponder list\n\nExemple: .autoresponder add salut Bonjour !`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      config.status = 'on';
      await sock.sendMessage(from, { text: '✅ Auto-répondeur activé' }, { quoted: msg });
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Auto-répondeur désactivé' }, { quoted: msg });
      break;
      
    case 'add':
      const trigger = args.slice(1, -1).join(' ');
      const response = args[args.length - 1];
      if (trigger && response) {
        config.responses[trigger] = response;
        await sock.sendMessage(from, { 
          text: `✅ Ajouté : "${trigger}" → "${response}"` 
        }, { quoted: msg });
      }
      break;
      
    case 'remove':
      const toRemove = args.slice(1).join(' ');
      if (config.responses[toRemove]) {
        delete config.responses[toRemove];
        await sock.sendMessage(from, { 
          text: `✅ Supprimé : "${toRemove}"` 
        }, { quoted: msg });
      }
      break;
      
    case 'list':
      const responses = Object.entries(config.responses)
        .map(([trigger, resp]) => `"${trigger}" → "${resp}"`)
        .join('\n') || 'Aucune réponse configurée';
      
      await sock.sendMessage(from, {
        text: `🤖 *Auto-réponses*\n\n${responses}\n\n📊 *Statut:* ${config.status}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./autoresponder.json', JSON.stringify(config, null, 2));
};
