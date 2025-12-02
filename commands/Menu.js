async function menu(m, socket, args) {
  const menuText = `*📋 MENU BACHIRA BOT*

*⚙️ ADMIN:*
!antilink [on/off]
!antisticker [on/off]
!promote [@user]
!depromote [@user]
!kick [@user]
!tagall [message]

*🎵 MEDIA:*
!audio [recherche]
!gif [recherche]
!video [recherche]
!img [recherche]

*🤖 BOT:*
!ping
!status
!info
!menu
!allmenu

*🎮 DIVERTISSEMENT:*
!joke
!play [jeu]
!fancy [texte]

Utilisez *!allmenu* pour voir toutes les commandes.`;
  
  await m.reply(menuText);
}

export default menu;
