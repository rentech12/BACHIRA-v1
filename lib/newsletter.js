// lib/newsletter.js
const config = require('../config');

async function subscribeToNewsletter(sock) {
  try {
    console.log("📰 Tentative d'abonnement à la newsletter...");
    
    if (!config.newsletterId) {
      console.log("❌ Newsletter ID non configuré");
      return;
    }
    
    // Vérifier l'état d'abonnement
    const subscription = await sock.newsletterSubscriptionGet(config.newsletterId);
    console.log("📬 État de la newsletter:", subscription);
    
    console.log("✅ Connecté à la newsletter:", config.newsletterId);
    return true;
  } catch (error) {
    console.log("❌ Erreur newsletter:", error.message);
    return false;
  }
}

async function sendToNewsletter(sock, message) {
  try {
    await sock.newsletterSendMessage(config.newsletterId, message);
    console.log("📨 Message envoyé à la newsletter");
  } catch (error) {
    console.log("❌ Erreur envoi newsletter:", error.message);
  }
}

module.exports = { subscribeToNewsletter, sendToNewsletter };
