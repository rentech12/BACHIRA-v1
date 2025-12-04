import fs from 'fs';

export const name = 'bangroup';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./bangroup.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🚷 *Ban Groupe*\n\nUsage:\n.bangroup on <jid_groupe> <raison>\n.bangroup off\n.bangroup list\n\nExemple: .bangroup on 123456789@g.us "Spam"`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      const groupJid = args[1];
      const reason = args.slice(2).join(' ') || 'Violation des règles';
      
      if (groupJid) {
        config.status = 'on';
        if (!config.groups.includes(groupJid)) {
          config.groups.push(groupJid);
        }
        config.reason = reason;
        
        await sock.sendMessage(from, {
          text: `✅ *Auto-ban groupe activé*\n\n🏷️ *Groupe:* ${groupJid}\n📝 *Raison:* ${reason}\n\n⚠️ Le bot quittera ce groupe automatiquement`
        }, { quoted: msg });
      }
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Auto-ban groupe désactivé' }, { quoted: msg });
      break;
      
    case 'list':
      const groups = config.groups.length > 0 
        ? config.groups.map(g => `▸ ${g}`).join('\n')
        : 'Aucun groupe';
      
      await sock.sendMessage(from, {
        text: `🚷 *Groupes Auto-ban*\n\n${groups}\n\n📊 *Statut:* ${config.status}\n📝 *Raison par défaut:* ${config.reason || 'Aucune'}\n📈 *Total:* ${config.groups.length} groupes`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./bangroup.json', JSON.stringify(config, null, 2));
};
