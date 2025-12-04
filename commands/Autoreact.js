export const name = 'autoreact';
export const execute = async (sock, msg, args) => {
  const from = msg.key.remoteJid;
  const config = JSON.parse(fs.readFileSync('./autoreact.json'));
  
  if (!args[0]) {
    return await sock.sendMessage(from, {
      text: `🩸 *Auto-réaction*\n\nUsage:\n.autoreact on/off\n.autoreact add <numéro> <réaction>\n.autoreact addgroup <réaction>\n.autoreact list\n\nExemple: .autoreact add 23761234567 🔥`
    }, { quoted: msg });
  }
  
  const action = args[0].toLowerCase();
  
  switch(action) {
    case 'on':
      config.status = 'on';
      await sock.sendMessage(from, { text: '✅ Auto-réaction activée' }, { quoted: msg });
      break;
      
    case 'off':
      config.status = 'off';
      await sock.sendMessage(from, { text: '❌ Auto-réaction désactivée' }, { quoted: msg });
      break;
      
    case 'add':
      if (args[1] && args[2]) {
        const number = args[1].replace(/[^0-9]/g, '');
        const reaction = args[2];
        config.reactions[number] = reaction;
        await sock.sendMessage(from, { 
          text: `✅ Réaction "${reaction}" ajoutée pour ${number}` 
        }, { quoted: msg });
      }
      break;
      
    case 'addgroup':
      if (args[1]) {
        const reaction = args[1];
        config.groups[from] = reaction;
        await sock.sendMessage(from, { 
          text: `✅ Réaction "${reaction}" ajoutée pour ce groupe` 
        }, { quoted: msg });
      }
      break;
      
    case 'list':
      const reactions = Object.entries(config.reactions)
        .map(([num, react]) => `${num}: ${react}`)
        .join('\n') || 'Aucune';
      const groups = Object.entries(config.groups)
        .map(([jid, react]) => `${jid}: ${react}`)
        .join('\n') || 'Aucun';
      
      await sock.sendMessage(from, {
        text: `🩸 *Auto-réactions*\n\n🔹 *Réactions par numéro:*\n${reactions}\n\n🔹 *Réactions par groupe:*\n${groups}\n\n🔹 *Statut:* ${config.status}`
      }, { quoted: msg });
      break;
  }
  
  fs.writeFileSync('./autoreact.json', JSON.stringify(config, null, 2));
};
