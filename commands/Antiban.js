import fs from 'fs';

export const name = 'antiban';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./antiban.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🛡️ *Anti-ban Numéro*\n\nUsage:\n.antiban on/off\n.antiban add <numéro>\n.antiban remove <numéro>\n.antiban list\n\nExemple: .antiban add 23761234567`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      config.status = 'on';
      await sock.sendMessage(from, { 
        text: '✅ Anti-ban activé\n\nLes numéros listés seront auto-bloqués' 
      }, { quoted: msg });
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Anti-ban désactivé' }, { quoted: msg });
      break;
      
    case 'add':
      const numToAdd = args[1]?.replace(/[^0-9]/g, '');
      if (numToAdd && !config.numbers.includes(numToAdd)) {
        config.numbers.push(numToAdd);
        await sock.sendMessage(from, { 
          text: `✅ ${numToAdd} ajouté à la liste anti-ban` 
        }, { quoted: msg });
      }
      break;
      
    case 'remove':
      const numToRemove = args[1]?.replace(/[^0-9]/g, '');
      if (numToRemove) {
        config.numbers = config.numbers.filter(n => n !== numToRemove);
        await sock.sendMessage(from, { 
          text: `✅ ${numToRemove} retiré de la liste anti-ban` 
        }, { quoted: msg });
      }
      break;
      
    case 'list':
      const numbers = config.numbers.length > 0 
        ? config.numbers.map(n => `▸ ${n}`).join('\n')
        : 'Aucun numéro';
      
      await sock.sendMessage(from, {
        text: `🛡️ *Liste Anti-ban*\n\n${numbers}\n\n📊 *Statut:* ${config.status}\n📈 *Total:* ${config.numbers.length} numéros`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./antiban.json', JSON.stringify(config, null, 2));
};
