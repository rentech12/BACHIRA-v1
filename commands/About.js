async function about(m, socket) {
  const aboutText = `*🤖 BACHIRA BOT V1*

*Version:* 1.0.0
*Développeur:* ren tech 
*Langage:* JavaScript/Node.js
*Bibliothèque:* Baileys
*Prefix:* !

*Fonctionnalités:*
• Anti-spam
• Anti-lien
• Auto-répondreur
• Gestion de groupe
• Jeux et divertissement
• Et bien plus...

*Source:* https://github.com/rentech/bachira-v1`;
  
  await m.reply(aboutText);
}

export default about;
