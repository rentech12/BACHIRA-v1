import fs from 'fs';

export const name = 'antibug';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./antibug.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🐛 *Anti-bug User*\n\nUsage:\n.antibug on <numéro> <raison>\n.antibug off\n.antibug info\n\nExemple: .antibug on 23761234567 Spam`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      const target = args[1];
      const reason = args.slice(2).join(' ') || 'Bug système';
      if (target) {
        config.status = 'on';
        config.target = target.replace(/[^0-9]/g, '');
        config.reason = reason;
        
        await sock.sendMessage(from, {
          text: `✅ *Anti-bug activé*\n\n👤 *Cible:* ${config.target}\n📝 *Raison:* ${reason}\n\n⚠️ L'utilisateur sera buggé et bloqué automatiquement`
        }, { quoted: msg });
      }
      break;
      
    case 'off':
      config.status = 'off';
      config.target = '';
      config.reason = '';
      await sock.sendMessage(from, { text: '❌ Anti-bug désactivé' }, { quoted: msg });
      break;
      
    case 'info':
      await sock.sendMessage(from, {
        text: `🐛 *Info Anti-bug*\n\n📊 *Statut:* ${config.status}\n👤 *Cible:* ${config.target || 'Aucune'}\n📝 *Raison:* ${config.reason || 'Aucune'}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./antibug.json', JSON.stringify(config, null, 2));
};
