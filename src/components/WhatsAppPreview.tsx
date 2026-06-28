'use client';

import { useEffect, useState, useRef } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface PreviewProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function WhatsAppPreview({ messages, settings }: PreviewProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTyper, setCurrentTyper] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleForcePlay = () => {
      setVisibleMessages([]);
      setCurrentIndex(0);
      setIsPlaying(true);
    };

    window.addEventListener('zapvid-start-render', handleForcePlay);
    return () => window.removeEventListener('zapvid-start-render', handleForcePlay);
  }, []);

  useEffect(() => {
    if (!isPlaying || messages.length === 0 || currentIndex >= messages.length) {
      if (currentIndex >= messages.length && messages.length > 0) {
        setIsPlaying(false);
        window.dispatchEvent(new CustomEvent('zapvid-end-render'));
      }
      return;
    }

    const currentMsg = messages[currentIndex];
    setIsTyping(true);
    setCurrentTyper(currentMsg.sender);

    const textLengthFactor = Math.min(currentMsg.text.length * 0.03, 3);
    const typingTime = settings.typingDuration * textLengthFactor * 1000;

    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages((prev) => [...prev, currentMsg]);
      
      const readingTime = Math.max(currentMsg.text.length * 40, 1500) * settings.scrollSpeed;

      const nextMessageTimeout = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, readingTime);

      return () => clearTimeout(nextMessageTimeout);

    }, typingTime);

    return () => clearTimeout(typingTimeout);
  }, [isPlaying, currentIndex, messages, settings]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleMessages, isTyping]);

  const handlePlayPause = () => {
    if (currentIndex >= messages.length) {
      setVisibleMessages([]);
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const isMe = (sender: string) => sender.toLowerCase() === settings.personBName.toLowerCase();
  const contactName = settings.personAName || 'Contato';

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <div className="w-full flex justify-between items-center mb-4 bg-neutral-900 border border-neutral-800 p-3 rounded-lg">
        <button
          onClick={handlePlayPause}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors"
        >
          {currentIndex >= messages.length ? '🔄 Reiniciar' : isPlaying ? '⏸️ Pausar' : '▶️ Simular Vídeo'}
        </button>
        <span className="text-xs text-neutral-400">
          Progresso: {currentIndex} / {messages.length}
        </span>
      </div>

      <div 
        id="zapvid-phone-container" 
        className="relative w-full aspect-[9/16] bg-neutral-950 border-4 border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-[#0b141a] text-neutral-200 px-5 pt-10 pb-3 flex items-center gap-3 border-b border-neutral-900 z-10">
          <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center text-sm font-bold text-neutral-300">
            {contactName[0]?.toUpperCase() || 'W'}
          </div>
          <div>
            <div className="font-bold text-sm">{contactName}</div>
            <div className="text-xs text-[#53bdeb] font-medium h-4">
              {isTyping && !isMe(currentTyper) ? 'digitando...' : 'online'}
            </div>
          </div>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] transition-all relative select-none"
          style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundBlendMode: 'overlay', opacity: 0.95 }}
        >
          {visibleMessages.map((msg) => {
            const myMsg = isMe(msg.sender);
            return (
              <div key={msg.id} className={`flex w-full ${myMsg ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm shadow relative break-words whitespace-pre-wrap ${myMsg ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>
                  <span className="block text-[11px] font-semibold text-neutral-400 mb-0.5">{msg.sender}</span>
                  <p className="pr-8 leading-relaxed">{msg.text}</p>
                  <div className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] text-[#8696a0]">
                    <span>{msg.time}</span>
                    {myMsg && settings.showReadTicks && <span className="text-[#53bdeb] text-xs font-bold">✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className={`flex w-full ${isMe(currentTyper) ? 'justify-end' : 'justify-start'}`}>
              <div className="rounded-lg px-4 py-2 bg-[#202c33] text-[#8696a0] rounded-tl-none text-xs flex items-center gap-1">
                <span className="font-semibold text-neutral-300 mr-1">{currentTyper}</span> está digitando
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                <span className="animate-bounce [animation-delay:0.4s]">.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
