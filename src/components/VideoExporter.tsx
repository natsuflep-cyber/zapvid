'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages, settings }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleExport = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    const element = document.getElementById('zapvid-phone-container');
    if (!element) return alert('Erro: Componente visual do celular não encontrado.');

    const html2canvas = (await import('html2canvas')).default;

    try {
      setIsRendering(true);

      const targetWidth = element.offsetWidth;
      const targetHeight = element.offsetHeight;
      
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = targetWidth;
      recordCanvas.height = targetHeight;
      const ctx = recordCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter o contexto.');

      // Mudança crucial: Evita checagem de propriedade estrita no compilador da Vercel
      const canvasRef = recordCanvas as any;
      const streamFunction = canvasRef['captureStream'] || canvasRef['mozCaptureStream'];

      if (!streamFunction) {
        alert('API de renderização direta em background não suportada neste navegador.');
        setIsRendering(false);
        return;
      }

      const stream = streamFunction.call(recordCanvas, 30);
      const chunks: any[] = [];
      
      // Instanciação dinâmica para o compilador do Next não checar tipos globais do MediaRecorder
      const globalWindow = window as any;
      const RecorderConstructor = globalWindow['MediaRecorder'];
      
      if (!RecorderConstructor) {
        alert('Gravador de mídia indisponível.');
        setIsRendering(false);
        return;
      }

      const mediaRecorder = new RecorderConstructor(stream, { mimeType: 'video/webm;codecs=vp9' });

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
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
      window.dispatchEvent(new CustomEvent('zapvid-start-render'));

      let isRecordingActive = true;
      
      const captureFrame = async () => {
        if (!isRecordingActive) return;

        try {
          const canvasFrame = await html2canvas(element, {
            useCORS: true,
            scale: 1,
            backgroundColor: '#0b141a',
            logging: false
          });

          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(canvasFrame, 0, 0, targetWidth, targetHeight);
        } catch (e) {
          console.error(e);
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
          
          try {
            const tracks = stream.getTracks();
            if (tracks) {
              tracks.forEach((track: any) => track.stop());
            }
          } catch(e){}
        }
        window.removeEventListener('zapvid-end-render', handleAutoStop);
      };

      window.addEventListener('zapvid-end-render', handleAutoStop);

    } catch (err) {
      console.error(err);
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handleExport}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? '⚡ Gerando arquivo de vídeo...' : '📥 Baixar Vídeo Pronto'}
      </button>
    </div>
  );
}
