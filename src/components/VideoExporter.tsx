'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages, settings }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const handleStartCapture = async () => {
    try {
      // Abre o pop-up nativo do navegador para gravar a tela/aba
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false
      });

      setIsRendering(true);
      setActiveStream(stream);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gravacao-zapvid.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
        setMediaRecorder(null);
        setActiveStream(null);
      };

      recorder.start();
      setMediaRecorder(recorder);

      // Dispara o início da animação das mensagens no seu componente de Preview
      window.dispatchEvent(new CustomEvent('zapvid-start-render'));

    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      alert('Gravação cancelada ou não suportada.');
      setIsRendering(false);
    }
  };

  const handleStopCapture = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center flex flex-col gap-2">
      {!isRendering ? (
        <button
          onClick={handleStartCapture}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
        >
          🎥 1. Iniciar Gravação de Tela
        </button>
      ) : (
        <button
          onClick={handleStopCapture}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all animate-pulse"
        >
          🛑 2. Concluir e Baixar Vídeo
        </button>
      )}
      <p className="text-[11px] text-neutral-500">
        Selecione a aba atual no pop-up. Ao finalizar a conversa, clique em concluir para baixar o arquivo e jogar no CapCut.
      </p>
    </div>
  );
}
