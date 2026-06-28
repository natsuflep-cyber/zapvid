'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleExport = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');
    
    setIsRendering(true);

    // Importa o script JavaScript puro ignorando o validador estrito da Vercel
    const { startCanvasRecorder } = await import('./recorder');
    
    await startCanvasRecorder('zapvid-phone-container', () => {
      setIsRendering(false);
    });
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
