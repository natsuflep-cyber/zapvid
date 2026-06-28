import { Message } from '../types/chat';

export function parseRawText(text: string): Message[] {
  const lines = text.split('\n');
  const messages: Message[] = [];
  let currentHour = 10;
  let currentMinute = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Procura por formatos como "Nome: Mensagem" ou "Nome - Mensagem"
    const match = trimmed.match(/^([^:-]+)[: -](.+)$/);
    
    if (match) {
      const sender = match[1].trim();
      let messageText = match[2].trim();
      let isTyping = false;

      // Detecta se a linha indica que a pessoa estava digitando
      if (messageText.toLowerCase().includes('(digitando)')) {
        isTyping = true;
        messageText = messageText.replace(/\(digitando\)/gi, '').trim();
      }

      // Incrementa o tempo de forma fictícia para simular uma conversa real
      currentMinute += Math.floor(Math.random() * 2) + 1;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      messages.push({
        id: `msg-${index}-${Date.now()}`,
        sender,
        text: messageText,
        time: timeString,
        isTyping
      });
    } else {
      // Se a linha não tiver "Nome:", adiciona ao texto da última mensagem enviada
      if (messages.length > 0) {
        messages[messages.length - 1].text += `\n${trimmed}`;
      }
    }
  });

  return messages;
}
