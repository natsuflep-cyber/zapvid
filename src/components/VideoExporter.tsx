'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleGenerateVideo = () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');
    setIsRendering(true);
    
    // Simulação inicial de download rápido
    setTimeout(() => {
      setIsRendering(false);
      alert('A engine de captura de vídeo está pronta para compilar o conteúdo!');
    }, 2000);
  };

  return (
    <div className="w-full max-w-sm mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
      <button
        onClick={handleGenerateVideo}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all text-sm tracking-wide"
      >
        {isRendering ? '🎬 Processando...' : '🎬 Gerar Vídeo Final (MP4)'}
      </button>
    </div>
  );
}
