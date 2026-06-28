'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

// Força a tipagem explícita dos parâmetros para matar o erro de build da Vercel
export default function VideoExporter({ 
  messages, 
  settings 
}: { 
  messages: Message[]; 
  settings: ChatSettings; 
}) {
  const [isRendering, setIsRendering] = useState(false);

  const handleExport = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    const element = document.getElementById('zapvid-phone-container');
    if (!element) return alert('Erro: Componente visual do celular não encontrado.');

    // Importação dinâmica para evitar problemas no lado do servidor (SSR)
    const html2canvas = (await import('html2canvas')).default;

    try {
      setIsRendering(true);

      const targetWidth = element.offsetWidth;
      const targetHeight = element.offsetHeight;
      
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = targetWidth;
      recordCanvas.height = targetHeight;
      const ctx = recordCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível obter o contexto do canvas.');

      // Pega o método do navegador de forma isolada e segura para o TypeScript
      const canvasObj = recordCanvas as any;
      const captureMethod = canvasObj['captureStream'] || canvasObj['mozCaptureStream'];
      
      if (typeof captureMethod !== 'function') {
        alert('Este navegador não suporta a gravação direta em memória de elementos canvas.');
        setIsRendering(false);
        return;
      }

      const stream = captureMethod.call(recordCanvas, 30);
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
          
          const tracks = stream.getTracks();
          if (tracks && Array.isArray(tracks)) {
            for (let i = 0; i < tracks.length; i++) {
              const track = tracks[i];
              if (track && typeof track.stop === 'function') {
                track.stop();
              }
            }
          }
        }
        window.removeEventListener('zapvid-end-render', handleAutoStop);
      };

      window.addEventListener('zapvid-end-render', handleAutoStop);

    } catch (err) {
      console.error(err);
      alert('Erro durante o processamento do vídeo.');
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
