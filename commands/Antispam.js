import fs from 'fs';

export const name = 'antispam';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./antispam.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🚫 *Anti-spam User*\n\nUsage:\n.antispam on <numéro> <intervalle> <message>\n.antispam off\n.antispam info\n\nExemple: .antispam on 23761234567 5 "Arrête de spam !"`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      const target = args[1];
      const interval = args[2] || 5;
      const spamMsg = args.slice(3).join(' ') || '🚫 SPAM DÉTECTÉ';
      
      if (target) {
        config.status = 'on';
        config.target = target.replace(/[^0-9]/g, '');
        config.interval = parseInt(interval);
        config.message = spamMsg;
        
        await sock.sendMessage(from, {
          text: `✅ *Anti-spam activé*\n\n👤 *Cible:* ${config.target}\n⏱️ *Intervalle:* ${interval}s\n💬 *Message:* ${spamMsg}`
        }, { quoted: msg });
      }
      break;
      
    case 'off':
      config.status = 'off';
      config.target = '';
      await sock.sendMessage(from, { text: '❌ Anti-spam désactivé' }, { quoted: msg });
      break;
      
    case 'info':
      await sock.sendMessage(from, {
        text: `🚫 *Info Anti-spam*\n\n📊 *Statut:* ${config.status}\n👤 *Cible:* ${config.target || 'Aucune'}\n⏱️ *Intervalle:* ${config.interval || 5}s\n💬 *Message:* ${config.message || 'Défaut'}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./antispam.json', JSON.stringify(config, null, 2));
};
