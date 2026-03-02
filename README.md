# 🤖 BACHIRA BOT V1 — Guide de Déploiement

---

## ✅ ÉTAPES POUR DÉPLOYER

### 1. Obtenir ta Session WhatsApp

Va sur ce site et génère ton session ID :
👉 https://meguru-session-id.vercel.app
(Connecte-toi avec ton numéro WhatsApp)
Copie le SESSION_ID affiché.

---

### 2. Configurer le fichier .env

Ouvre le fichier .env et remplis :

OWNER_NUMBER=TON_NUMERO_SANS_PLUS   # ex: 33612345678
BOT_NAME=BACHIRA V1
PREFIX=.
SESSION_ID=COLLE_TON_SESSION_ID_ICI

---

### 3. Déployer sur Katabump (GRATUIT)

1. Va sur https://dashboard.katabump.com/auth/login
2. Cree un compte gratuit
3. Cree un nouveau service Node.js
4. Upload ce dossier (ou connecte ton GitHub)
5. Dans les variables d'environnement, ajoute les memes que dans .env
6. Lance avec : npm install && npm start

---

### 4. Déployer localement (sur ton PC)

  npm install
  node index.js

---

## COMMANDES DISPONIBLES

.menu      - Affiche le menu
.ping      - Teste la vitesse
.info      - Infos du bot
.say msg   - Bot parle (owner seulement)
.broadcast - Envoie a la newsletter (owner)

---

## CONFIGURATION (.env)

OWNER_NUMBER  = Ton numéro sans + (ex: 33612345678)
BOT_NAME      = Nom du bot
PREFIX        = Préfixe des commandes (ex: .)
SESSION_ID    = ID session depuis le site de pairing

