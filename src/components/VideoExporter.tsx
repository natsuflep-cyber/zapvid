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

  const handlePureCodeExport = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    const element = document.getElementById('zapvid-phone-container');
    if (!element) return alert('Erro: O simulador de celular não foi encontrado na página.');

    // Importa dinamicamente para não quebrar o build da Vercel
    const html2canvas = (await import('html2canvas')).default;

    try {
      setIsRendering(true);
      setProgress(0);

      const targetWidth = element.offsetWidth;
      const targetHeight = element.offsetHeight;

      // Cria um canvas oculto na memória (não joga na tela e não pede gravação)
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = targetWidth;
      recordCanvas.height = targetHeight;
      const ctx = recordCanvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao criar contexto gráfico.');

      // Captura o stream do canvas em memória (Isso NÃO grava a tela do PC)
      const stream = (recordCanvas as any).captureStream ? (recordCanvas as any).captureStream(30) : null;
      if (!stream) {
        alert('Seu navegador não possui suporte para renderização em memória.');
        setIsRendering(false);
        return;
      }

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
        a.download = 'conversa-zapvid.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
      };

      mediaRecorder.start();

      // Dispara o início da simulação visual lá no WhatsAppPreview
      window.dispatchEvent(new CustomEvent('zapvid-start-render'));

      let isRecordingActive = true;
      let totalFramesProcessed = 0;

      // Loop interno que clona apenas a div do celular frame por frame para o vídeo em background
      const processFrame = async () => {
        if (!isRecordingActive) return;

        try {
          const canvasFrame = await html2canvas(element, {
            useCORS: true,
            scale: 1,
            backgroundColor: '#0b141a',
            logging: false,
          });

          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(canvasFrame, 0, 0, targetWidth, targetHeight);
          
          totalFramesProcessed++;
          // Apenas atualiza um indicador visual discreto no botão
          if (totalFramesProcessed % 30 === 0) {
            setProgress((prev) => prev + 1);
          }
        } catch (e) {
          console.error(e);
        }

        if (isRecordingActive) {
          requestAnimationFrame(processFrame);
        }
      };

      // Inicializa o processo
      processFrame();

      // Escuta o evento de fim da conversa emitido pelo simulador
      const handleStopSignal = () => {
        isRecordingActive = false;
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        window.removeEventListener('zapvid-end-render', handleStopSignal);
      };

      window.addEventListener('zapvid-end-render', handleStopSignal);

    } catch (err) {
      console.error(err);
      alert('Erro na compilação interna do vídeo.');
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-sm mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handlePureCodeExport}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 text-sm"
      >
        {isRendering ? `⚡ Renderizando Vídeo Oculto...` : '📥 Baixar Vídeo Pronto'}
      </button>
    </div>
  );
}
