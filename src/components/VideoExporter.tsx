'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

// CORREÇÃO AQUI: Adicionado o 'settings' para bater com a interface ExporterProps
export default function VideoExporter({ messages, settings }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleGenerateVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    // Busca o mockup do celular (caso você tenha mudado para zapvid-phone-container, altere aqui)
    const element = document.getElementById('zapvid-phone-container') || document.getElementById('tiktok-phone');
    if (!element) return alert('Erro: O simulador de celular não foi encontrado na página.');

    try {
      setIsRendering(true);

      // Captura o fluxo visual estrito e isolado do elemento do celular
      const stream = (element as any).captureStream 
        ? (element as any).captureStream(30) 
        : (element as any).mozCaptureStream 
          ? (element as any).mozCaptureStream(30) 
          : null;

      if (!stream) {
        // Fallback seguro caso o navegador bloqueie a API do Element (Garante que nunca dê tela preta)
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: false
        });
        startMediaRecorder(displayStream);
      } else {
        startMediaRecorder(stream);
      }

    } catch (error) {
      console.error(error);
      alert('Erro ao iniciar o motor de exportação.');
      setIsRendering(false);
    }
  };

  const startMediaRecorder = (stream: MediaStream) => {
    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video-zapvid.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRendering(false);
    };

    mediaRecorder.start();

    // Cria um botão discreto para você finalizar o download quando o vídeo acabar
    const stopButton = document.createElement('button');
    stopButton.innerHTML = '🛑 CONCLUIR E BAIXAR VÍDEO';
    stopButton.style.position = 'fixed';
    stopButton.style.bottom = '30px';
    stopButton.style.left = '50%';
    stopButton.style.transform = 'translateX(-50%)';
    stopButton.style.zIndex = '99999';
    stopButton.style.backgroundColor = '#22c55e';
    stopButton.style.color = 'white';
    stopButton.style.padding = '14px 28px';
    stopButton.style.fontWeight = 'bold';
    stopButton.style.borderRadius = '9999px';
    stopButton.style.border = 'none';
    stopButton.style.cursor = 'pointer';
    stopButton.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
    
    stopButton.onclick = () => {
      mediaRecorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      document.body.removeChild(stopButton);
    };

    document.body.appendChild(stopButton);
  };

  return (
    <div className="w-full max-w-sm mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handleGenerateVideo}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 text-sm"
      >
        {isRendering ? '🎥 Gravando o Celular...' : '🎬 Gerar Vídeo Focado (Download)'}
      </button>
    </div>
  );
}
