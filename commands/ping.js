export default async function ping(msg, sock) {
  await sock.sendMessage(msg.key.remoteJid, {
    text: "🏓 Pong ! Bachira V1 est en ligne."
  });
}
