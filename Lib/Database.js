import fs from 'fs-extra';
import { config } from './config.js';

const dbPath = './lib/database.json';

export const db = {
  groups: {},
  users: {},
  autoreact: {},
  autoreply: {},
  blocked: [],
  antispam: {},
  
  async load() {
    try {
      const data = await fs.readJson(dbPath);
      Object.assign(this, data);
    } catch {
      await this.save();
    }
  },
  
  async save() {
    await fs.writeJson(dbPath, {
      groups: this.groups,
      users: this.users,
      autoreact: this.autoreact,
      autoreply: this.autoreply,
      blocked: this.blocked,
      antispam: this.antispam
    }, { spaces: 2 });
  },
  
  getGroup(jid) {
    if (!this.groups[jid]) {
      this.groups[jid] = {
        antilink: false,
        antisticker: false,
        antipromote: false,
        welcome: false,
        left: false,
        autoreact: {},
        autoreply: {}
      };
    }
    return this.groups[jid];
  },
  
  getUser(jid) {
    if (!this.users[jid]) {
      this.users[jid] = {
        warnings: 0,
        lastCommand: 0
      };
    }
    return this.users[jid];
  }
};

await db.load();
setInterval(() => db.save(), 60000);
