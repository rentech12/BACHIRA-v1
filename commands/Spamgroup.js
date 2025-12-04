import fs from 'fs';

export const name = 'spamgroup';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./spamgroup.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `💣 *Spam Groupe*\n\nUsage:\n.spamgroup on <jid_groupe> <intervalle> <messages...>\n.spamgroup off\n.spamgroup info\n\nExemple: .spamgroup on 123456789@g.us 10 "Message 1" "Message 2"`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      const target = args[1];
      const interval = args[2] || 10;
      const messages = args.slice(3);
      
      if (target && messages.length > 0) {
        config.status = 'on';
        config.target = target;
        config.interval = parseInt(interval);
        config.messages = messages;
        
        await sock.sendMessage(from, {
          text: `✅ *Spam groupe activé*\n\n🏷️ *Groupe:* ${target}\n⏱️ *Intervalle:* ${interval}s\n📊 *Messages:* ${messages.length}\n\n💬 *Exemple:* ${messages[0]}`
        }, { quoted: msg });
      }
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Spam groupe désactivé' }, { quoted: msg });
      break;
      
    case 'info':
      const messagesPreview = config.messages?.slice(0, 3).map((m, i) => `${i+1}. ${m}`).join('\n') || 'Aucun';
      
      await sock.sendMessage(from, {
        text: `💣 *Info Spam Groupe*\n\n📊 *Statut:* ${config.status}\n🏷️ *Cible:* ${config.target || 'Aucune'}\n⏱️ *Intervalle:* ${config.interval || 10}s\n📊 *Messages:* ${config.messages?.length || 0}\n\n💬 *Preview:*\n${messagesPreview}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./spamgroup.json', JSON.stringify(config, null, 2));
};
