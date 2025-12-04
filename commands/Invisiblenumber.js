import fs from 'fs';

export const name = 'invisiblenumber';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./invisiblenumber.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `👻 *Numéro Invisible*\n\nUsage:\n.invisiblenumber on/off\n.invisiblenumber add <numéro>\n.invisiblenumber remove <numéro>\n.invisiblenumber list\n\nExemple: .invisiblenumber add 23761234567`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      config.status = 'on';
      await sock.sendMessage(from, { 
        text: '✅ Numéro invisible activé\n\nLes numéros listés apparaîtront comme inexistants' 
      }, { quoted: msg });
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Numéro invisible désactivé' }, { quoted: msg });
      break;
      
    case 'add':
      const numToAdd = args[1]?.replace(/[^0-9]/g, '');
      if (numToAdd && !config.numbers.includes(numToAdd)) {
        config.numbers.push(numToAdd);
        await sock.sendMessage(from, { 
          text: `✅ ${numToAdd} ajouté aux numéros invisibles` 
        }, { quoted: msg });
      }
      break;
      
    case 'remove':
      const numToRemove = args[1]?.replace(/[^0-9]/g, '');
      if (numToRemove) {
        config.numbers = config.numbers.filter(n => n !== numToRemove);
        await sock.sendMessage(from, { 
          text: `✅ ${numToRemove} retiré des numéros invisibles` 
        }, { quoted: msg });
      }
      break;
      
    case 'list':
      const numbers = config.numbers.length > 0 
        ? config.numbers.map(n => `▸ ${n}`).join('\n')
        : 'Aucun numéro';
      
      await sock.sendMessage(from, {
        text: `👻 *Numéros Invisibles*\n\n${numbers}\n\n📊 *Statut:* ${config.status}\n📈 *Total:* ${config.numbers.length} numéros`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./invisiblenumber.json', JSON.stringify(config, null, 2));
};
