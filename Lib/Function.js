import fs from 'fs-extra';
import { config } from './config.js';

export async function isOwner(sender) {
  return sender === config.owner;
}

export async function isMod(sender) {
  return config.mods.includes(sender);
}

export async function isGroup(m) {
  return m.key.remoteJid.endsWith('@g.us');
}

export async function getGroupMetadata(socket, jid) {
  try {
    return await socket.groupMetadata(jid);
  } catch {
    return null;
  }
}

export async function saveData(data, file) {
  await fs.writeJson(file, data, { spaces: 2 });
}

export async function loadData(file) {
  try {
    return await fs.readJson(file);
  } catch {
    return {};
  }
}

export function formatSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
