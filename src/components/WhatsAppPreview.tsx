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

  const handleGenerateVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    try {
      setIsRendering(true);
      setProgress(0);

      // 🎥 1. Cria um Canvas interno isolado na proporção vertical do TikTok (720x1280)
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível iniciar o motor gráfico.');

      // ⚙️ 2. Configura a captura de frames
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
        a.download = 'zapvid-tiktok.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
      };

      mediaRecorder.start();

      // ✍️ 3. Variáveis de controle da animação interna
      let currentMsgIndex = 0;
      let visibleMsgs: Message[] = [];
      let frameCount = 0;
      const contactName = settings.personAName || 'Patrícia';

      const renderFrame = () => {
        if (!ctx) return;

        // Fundo escuro oficial do WhatsApp
        ctx.fillStyle = '#0b141a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- HEADER FIXO ---
        ctx.fillStyle = '#1f2c34';
        ctx.fillRect(0, 0, canvas.width, 160);

        // Avatar (Círculo)
        ctx.styleCtx = '#6b7280';
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(90, 95, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Letra do Avatar
        ctx.fillStyle = '#e9edef';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(contactName[0]?.toUpperCase() || 'P', 90, 105);

        // Nome do Contato e Status
        ctx.textAlign = 'left';
        ctx.font = 'bold 34px Arial';
        ctx.fillText(contactName, 150, 90);
        
        ctx.fillStyle = '#53bdeb';
        ctx.font = '24px Arial';
        
        // Verifica se quem está "falando" na vez é a pessoa da esquerda para mostrar digitando
        const nextMsg = messages[currentMsgIndex];
        const isA_Typing = nextMsg && nextMsg.sender.toLowerCase() !== (settings.personBName?.toLowerCase() || 'juliana');
        if (currentMsgIndex < messages.length && isA_Typing) {
          ctx.fillText('digitando...', 150, 130);
        } else {
          ctx.fillText('online', 150, 130);
        }

        // --- DESENHO DOS BALÕES DE MENSAGEM ---
        let currentY = 200;
        visibleMsgs.forEach((msg) => {
          const isMe = msg.sender.toLowerCase() === (settings.personBName?.toLowerCase() || 'juliana');
          
          ctx.font = '28px Arial';
          
          // Lógica simplificada de quebra de linha para evitar estouro do balão
          const maxLineWidth = 450;
          const words = msg.text.split(' ');
          let line = '';
          let lines: string[] = [];

          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          const bubbleWidth = 500;
          const bubbleHeight = (lines.length * 36) + 40;
          const currentX = isMe ? canvas.width - bubbleWidth - 40 : 40;

          // Desenha o corpo do balão do WhatsApp
          ctx.fillStyle = isMe ? '#005c4b' : '#202c33';
          ctx.beginPath();
          // @ts-ignore
          if (ctx.roundRect) ctx.roundRect(currentX, currentY, bubbleWidth, bubbleHeight, 16);
          else ctx.fillRect(currentX, currentY, bubbleWidth, bubbleHeight);
          ctx.fill();

          // Desenha o texto linha por linha dentro do balão
          ctx.fillStyle = '#e9edef';
          lines.forEach((lineStr, index) => {
            ctx.fillText(lineStr, currentX + 25, currentY + 40 + (index * 36));
          });

          currentY += bubbleHeight + 25;
        });

        // Controle de tempo (passa de mensagem a cada 75 frames ~ 2.5 segundos)
        frameCount++;
        if (frameCount % 75 === 0 && currentMsgIndex < messages.length) {
          visibleMsgs.push(messages[currentMsgIndex]);
          currentMsgIndex++;
          setProgress(Math.round((currentMsgIndex / messages.length) * 100));
        }

        // Finalização automática do arquivo de vídeo
        if (currentMsgIndex >= messages.length && frameCount % 75 === 0) {
          mediaRecorder.stop();
        } else {
          requestAnimationFrame(renderFrame);
        }
      };

      renderFrame();

    } catch (err) {
      console.error(err);
      alert('Erro ao processar a renderização do arquivo de vídeo.');
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handleGenerateVideo}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? `⏳ Gerando Arquivo Final (${progress}%)` : '⚡ Gerar e Baixar Vídeo Pronto'}
      </button>
    </div>
  );
}
