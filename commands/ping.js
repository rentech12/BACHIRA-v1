async function ping(m, socket) {
  const start = Date.now();
  await m.reply('*Pong!* 🏓');
  const latency = Date.now() - start;
  await m.reply(`*Latence:* ${latency}ms\n*Statut:* ✅ En ligne`);
}

export default ping;
