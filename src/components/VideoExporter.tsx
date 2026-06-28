'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    const element = document.getElementById('zapvid-phone-container');
    if (!element) return alert('Erro: Componente visual do celular não encontrado.');

    // Importa dinamicamente a biblioteca para não quebrar o build do Next.js
    const html2canvas = (await import('html2canvas')).default;

    try {
      setIsRendering(true);
      setProgress('Iniciando...');

      // 1. Prepara um Canvas oculto no tamanho exato do celular para receber os frames
      const targetWidth = element.offsetWidth;
      const targetHeight = element.offsetHeight;
      
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = targetWidth;
      recordCanvas.height = targetHeight;
      const ctx = recordCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter o contexto do canvas.');

      // 2. Cria o gravador de mídia a partir desse canvas estável
      const stream = recordCanvas.captureStream(30); // 30 FPS estáveis
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
        setProgress('');
      };

      mediaRecorder.start();

      // 3. Dá o Play automático na simulação da tela
      window.dispatchEvent(new CustomEvent('zapvid-start-render'));

      // 4. Loop de renderização: tira fotos da sua div em tempo real e joga pro vídeo
      let isRecordingActive = true;
      
      const captureFrame = async () => {
        if (!isRecordingActive) return;

        try {
          const canvasFrame = await html2canvas(element, {
            useCORS: true,
            scale: 1, // Mantém a proporção real leve e idêntica
            backgroundColor: '#0b141a'
          });

          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(canvasFrame, 0, 0, targetWidth, targetHeight);
        } catch (e) {
          console.error('Erro no frame:', e);
        }

        if (isRecordingActive) {
          requestAnimationFrame(captureFrame);
        }
      };

      // Inicia o processo de captura dos frames visuais
      captureFrame();

      // 5. Escuta o fim da conversa para fechar o arquivo e baixar
      const handleAutoStop = () => {
        isRecordingActive = false;
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        }
        window.removeEventListener('zapvid-end-render', handleAutoStop);
      };

      window.addEventListener('zapvid-end-render', handleAutoStop);

    } catch (err) {
      console.error(err);
      alert('Erro durante o processamento do vídeo.');
      setIsRendering(false);
      setProgress('');
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handleExport}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? `⚡ Gravando Interface... ${progress}` : '📥 Baixar Vídeo com Design Perfeito'}
      </button>
      <p className="text-[11px] text-neutral-500 mt-2">
        A simulação rodará e o arquivo final será baixado de forma idêntica ao simulador da tela.
      </p>
    </div>
  );
}
