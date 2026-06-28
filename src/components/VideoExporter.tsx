'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleGenerateVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');
    
    try {
      setIsRendering(true);
      
      // 1. Pede permissão para capturar a tela/aba do navegador
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false
      });

      const chunks: Blob[] = [];
      // 2. Inicializa o gravador de mídia nativo do navegador
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // 3. Quando a gravação parar, gera o download automático do arquivo
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

      // Inicia a gravação
      mediaRecorder.start();
      alert('Selecione a aba do simulador e clique em Compartilhar. Pare a gravação quando a conversa terminar!');

    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ou a captura de tela foi cancelada.');
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
      <button
        onClick={handleGenerateVideo}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? '🎥 Gravando Tela... Pare no botão do navegador' : '🎬 Iniciar Gravação Final'}
      </button>
    </div>
  );
}
