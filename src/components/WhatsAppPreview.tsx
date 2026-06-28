'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages, settings }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateDirectVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    try {
      setIsRendering(true);
      setProgress(0);

      // 1. Cria um Canvas invisível na proporção exata do TikTok (720x1280)
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível iniciar o contexto do Canvas');

      // 2. Configura o gravador do Canvas
      const stream = canvas.captureStream(30); // 30 FPS
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gerador-zapvid.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
      };

      mediaRecorder.start();

      // 3. Motor de renderização frame a frame
      let currentMsgIndex = 0;
      let visibleMsgs: Message[] = [];
      let frameCount = 0;

      const renderLoop = () => {
        if (!ctx) return;

        // Desenha o fundo escuro do WhatsApp
        ctx.fillStyle = '#0b141a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha o Header Fixo
        ctx.fillStyle = '#1f2c34';
        ctx.fillRect(0, 0, canvas.width, 140);
        ctx.fillStyle = '#e9edef';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(settings.personAName || 'Contato', 50, 85);

        // Renderiza os balões de texto na tela
        let currentY = 200;
        visibleMsgs.forEach((msg) => {
          const isMe = msg.sender.toLowerCase() === settings.personBName.toLowerCase();
          
          ctx.font = '28px Arial';
          const textWidth = ctx.measureText(msg.text).width;
          const bubbleWidth = Math.min(textWidth + 40, 500);
          const bubbleHeight = 70;
          const currentX = isMe ? canvas.width - bubbleWidth - 40 : 40;

          // Cor do balão
          ctx.fillStyle = isMe ? '#005c4b' : '#202c33';
          
          // Desenha o balão arredondado
          ctx.beginPath();
          ctx.roundRect?.(currentX, currentY, bubbleWidth, bubbleHeight, 15);
          ctx.fill();

          // Texto interno
          ctx.fillStyle = '#e9edef';
          ctx.fillText(msg.text, currentX + 20, currentY + 45);

          currentY += bubbleHeight + 20;
        });

        frameCount++;

        // Controla o tempo de entrada de cada mensagem (Simula a cada 60 frames / 2 segundos)
        if (frameCount % 60 === 0 && currentMsgIndex < messages.length) {
          visibleMsgs.push(messages[currentMsgIndex]);
          currentMsgIndex++;
          setProgress(Math.round((currentMsgIndex / messages.length) * 100));
        }

        // Verifica se a conversa terminou
        if (currentMsgIndex >= messages.length && frameCount % 60 === 0) {
          mediaRecorder.stop();
        } else {
          requestAnimationFrame(renderLoop);
        }
      };

      // Inicia a compilação em segundo plano
      renderLoop();

    } catch (error) {
      console.error(error);
      alert('Erro ao processar o arquivo de mídia.');
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={generateDirectVideo}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? `⏳ Compilando Vídeo direto (${progress}%)` : '⚡ Gerar e Baixar Vídeo MP4'}
      </button>
    </div>
  );
}
