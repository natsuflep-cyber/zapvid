'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';
import { parseRawText } from '../utils/parser';
import WhatsAppPreview from '../components/WhatsAppPreview';

export default function Home() {
  const [rawInput, setRawInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ChatSettings>({
    personAName: 'Pessoa A',
    personBName: 'Pessoa B',
    personAPhoto: '',
    personBPhoto: '',
    scrollSpeed: 1,
    typingDuration: 1.5,
    showReadTicks: true,
    theme: 'dark'
  });

  const handleProcessText = () => {
    const parsed = parseRawText(rawInput);
    if (parsed.length > 0) {
      // Atualiza os nomes baseados nas primeiras pessoas encontradas no texto
      const uniqueSenders = Array.from(new Set(parsed.map(m => m.sender)));
      setSettings(prev => ({
        ...prev,
        personAName: uniqueSenders[0] || 'Pessoa A',
        personBName: uniqueSenders[1] || 'Pessoa B',
      }));
      setMessages(parsed);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-neutral-900 py-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Gere seu vídeo de conversa em <span className="text-red-500">segundos</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Cole o roteiro do ChatGPT, personalize o visual e exporte direto para o TikTok.
        </p>
      </header>

      {/* Grid Principal */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO ESQUERDO: Controles e Inputs (5 Colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <span>📝</span> Cole sua conversa aqui
            </h2>
            <textarea
              className="w-full h-48 bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none placeholder-neutral-600"
              placeholder={`Exemplo:\nCarlos: Oi! Você não sabe o que descobri...\nAmanda: O que?? Me conta agora! (digitando)`}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <button
              onClick={handleProcessText}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-red-900/20"
            >
              Processar Conversa 🚀
            </button>
          </div>

          {/* Aqui entrarão os componentes de Configurações e Editor Individual de Mensagens */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-400 text-sm">
            Configure velocidades, fotos e estilos logo abaixo. (Campos em desenvolvimento)
          </div>
        </div>

        {/* LADO DIREITO: Mockup do Celular & Player (7 Colunas) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-900 rounded-2xl p-6 min-h-[600px]">
          <WhatsAppPreview messages={messages} settings={settings} />
        </div>

      </div>
    </main>
  );
}
