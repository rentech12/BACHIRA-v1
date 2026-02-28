// ==================== config.js ====================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ================== ESM __dirname ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== CONFIGURATION PAR DÉFAUT ==================
const defaultConfig = {
  // 🔑 Identifiants
  SESSION_ID: "",
  OWNERS: ["50934264629"], // ← tableau des owners, uniquement les numéros
  PREFIX: ".",
  TIMEZONE: "Africa/Kinshasa",
  VERSION: "2.0.0",

  // 🤖 Paramètres du bot
  public: true,
  autoRead: true,
  restrict: false,
  botImage: "",
  blockInbox: false,

  // 🌐 Liens utiles
  LINKS: {
    group: "https://chat.whatsapp.com/IKxmPvpzZKdDPlRvtWtSoc",
    channel: "https://whatsapp.com/channel/0029VbBy5o5It5s4zZZRgo1y",
    telegram: "https://t.me/rentech12"
  }
};
// ================== CHEMINS DES DONNÉES ==================
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const configPath = path.join(dataDir, "config.json");

// ================== CRÉATION DU FICHIER SI INEXISTANT ==================
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log("✅ config.json créé avec les paramètres par défaut");
}

// ================== CHARGEMENT DE LA CONFIG ==================
let userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// ================== VARIABLES GLOBALES ==================
global.blockInbox = userConfig.blockInbox ?? false;

// 🔹 Initialisation des owners
global.owner = Array.isArray(userConfig.OWNERS)
  ? userConfig.OWNERS
  : [userConfig.OWNER_NUMBER].filter(Boolean);

// ================== FONCTION DE SAUVEGARDE ==================
export function saveConfig(updatedConfig) {
  userConfig = { ...userConfig, ...updatedConfig };
  fs.writeFileSync(configPath, JSON.stringify(userConfig, null, 2));

  // Mise à jour des variables globales
  if (typeof updatedConfig.blockInbox !== "undefined") {
    global.blockInbox = updatedConfig.blockInbox;
  }
  if (Array.isArray(updatedConfig.OWNERS)) {
    global.owner = updatedConfig.OWNERS;
  }

  console.log("✅ Configuration sauvegardée");
}

// ================== EXPORT ==================
export default userConfig;
