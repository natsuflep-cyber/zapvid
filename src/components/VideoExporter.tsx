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

    // Importação dinâmica sem quebrar o ecossistema estrito de compilação
    const html2canvas = (await import('html2canvas')).default;

    try {
      setIsRendering(true);
      setProgress('Iniciando...');

      const targetWidth = element.offsetWidth;
      const targetHeight = element.offsetHeight;
      
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = targetWidth;
      recordCanvas.height = targetHeight;
      const ctx = recordCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter o contexto do canvas.');

      // Captura estável da stream de forma compatível e tipada
      const stream = (recordCanvas as any).captureStream ? (recordCanvas as any).captureStream(30) : null;

      if (!stream) {
        alert('Seu navegador não suporta a API de captura de mídia necessária.');
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
        setProgress('');
      };

      mediaRecorder.start();

      // Dispara o início sincronizado da reprodução na interface visual
      window.dispatchEvent(new CustomEvent('zapvid-start-render'));

      let isRecordingActive = true;
      
      const captureFrame = async () => {
        if (!isRecordingActive) return;

        try {
          const canvasFrame = await html2canvas(element, {
            useCORS: true,
            scale: 1,
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

      captureFrame();

      const handleAutoStop = () => {
        isRecordingActive = false;
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          // Interrompe todas as faixas ativas com tipagem segura padrão do navegador
          const tracks = stream.getTracks();
          if (tracks && Array.isArray(tracks)) {
            tracks.forEach((track: MediaStreamTrack) => {
              if (track && typeof track.stop === 'function') {
                track.stop();
              }
            });
          }
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
