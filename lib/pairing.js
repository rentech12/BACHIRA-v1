// lib/pairing.js
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askPhoneNumber() {
  return new Promise((resolve) => {
    rl.question("📱 Entrez votre numéro de téléphone (ex: 221771234567): ", (number) => {
      rl.close();
      resolve(number);
    });
  });
}

async function startPairing(sock, phoneNumber) {
  try {
    console.log("🔄 Démarrage du pairing...");
    
    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("🔑 CODE DE PAIRING:", code);
        console.log("📝 Entrez ce code dans WhatsApp > Appareils connectés");
      }, 2000);
    }
  } catch (error) {
    console.log("❌ Erreur pairing:", error.message);
  }
}

module.exports = { askPhoneNumber, startPairing };
