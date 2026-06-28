'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';
import { parseRawText } from '../utils/parser';
import WhatsAppPreview from '../components/WhatsAppPreview';
import VideoExporter from '../components/VideoExporter';

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
    showReadTicks: false,
    theme: 'dark'
  });

  const handleProcessText = () => {
    const parsed = parseRawText(rawInput);
    if (parsed.length > 0) {
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
      <header className="border-b border-neutral-900 py-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Gere seu vídeo de conversa em <span className="text-red-500">segundos</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          Cole o roteiro do ChatGPT e exporte direto para o TikTok.
        </p>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <span>📝</span> Cole sua conversa aqui
            </h2>
            <textarea
              className="w-full h-48 bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none placeholder-neutral-600"
              placeholder={`Exemplo:\nCarlos: Oi!\nAmanda: O que foi?`}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <button
              onClick={handleProcessText}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Processar Conversa 🚀
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-900 rounded-2xl p-6 min-h-[600px]">
          <WhatsAppPreview messages={messages} settings={settings} />
          <VideoExporter messages={messages} settings={settings} />
        </div>
      </div>
    </main>
  );
}
