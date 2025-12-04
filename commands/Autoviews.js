import fs from 'fs';

export const name = 'autoview';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./autoview.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `👁️ *Auto-view*\n\nUsage:\n.autoview on/off\n.autoview info\n\nFonction: Marque automatiquement les messages viewOnce comme vus`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      config.status = 'on';
      await sock.sendMessage(from, { 
        text: '✅ Auto-view activé\n\nLes messages viewOnce seront automatiquement marqués comme vus' 
      }, { quoted: msg });
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Auto-view désactivé' }, { quoted: msg });
      break;
      
    case 'info':
      await sock.sendMessage(from, {
        text: `👁️ *Info Auto-view*\n\n📊 *Statut:* ${config.status}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./autoview.json', JSON.stringify(config, null, 2));
};
