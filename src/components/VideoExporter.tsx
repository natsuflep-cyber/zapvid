'use client';

import { useEffect, useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface WhatsAppPreviewProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function WhatsAppPreview({ messages, settings }: WhatsAppPreviewProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Escuta o sinal vindo do botão do VideoExporter para iniciar a simulação limpa
    const handleStartRender = () => {
      setVisibleMessages([]);
      setIsTyping(false);
      
      if (messages.length === 0) return;

      let currentIdx = 0;

      const renderNextMessage = () => {
        if (currentIdx >= messages.length) {
          setIsTyping(false);
          // Avisa o exportador que a conversa terminou para ele fechar o vídeo
          window.dispatchEvent(new CustomEvent('zapvid-end-render'));
          return;
        }

        setIsTyping(true);

        // Simula o tempo de digitação antes de mostrar a mensagem na prévia do celular
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, messages[currentIdx]]);
          currentIdx++;
          
          // Intervalo fixo e seguro entre uma mensagem e outra
          setTimeout(renderNextMessage, 1000);
        }, 1500);
      };

      renderNextMessage();
    };

    window.addEventListener('zapvid-start-render', handleStartRender);
    
    // Fallback inicial: se não estiver gravando, mostra a conversa inteira para o usuário ver
    if (visibleMessages.length === 0 && messages.length > 0) {
      setVisibleMessages(messages);
    }

    return () => {
      window.removeEventListener('zapvid-start-render', handleStartRender);
    };
  }, [messages, visibleMessages.length]);

  return (
    <div 
      id="zapvid-phone-container" 
      className="w-[360px] h-[740px] bg-[#0b141a] rounded-[40px] shadow-2xl border-[8px] border-neutral-800 relative overflow-hidden flex flex-col select-none"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Barra de Status Superior do WhatsApp */}
      <div className="w-full bg-[#0b141a] pt-4 px-6 pb-2 flex justify-between items-center text-xs text-white/80 z-10">
        <span className="font-semibold">09:41</span>
        <div className="flex items-center gap-1.5">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Cabeçalho do Chat (Avatar + Nome) */}
      <div className="w-full bg-[#1f2c34] p-3 flex items-center gap-3 border-b border-neutral-800/50 z-10">
        <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center text-white font-bold overflow-hidden border border-neutral-700">
          {settings?.avatarUrl ? (
            <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{settings?.chatName?.charAt(0).toUpperCase() || 'Z'}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">{settings?.chatName || 'Contato'}</span>
          <span className="text-[#8696a0] text-xs h-4">
            {isTyping ? 'digitando...' : 'online'}
          </span>
        </div>
      </div>

      {/* Corpo da Conversa (Fundo Oficial do WhatsApp) */}
      <div 
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#0b141a]"
        style={{
          backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
          backgroundOpacity: 0.06,
          backgroundBlendMode: 'overlay'
        }}
      >
        {visibleMessages.map((msg, index) => {
          // Define se a mensagem foi enviada pelo usuário principal ou pelo receptor
          const isMe = msg.sender?.toLowerCase() === 'me' || msg.sender === settings?.chatName;
          
          return (
            <div
              key={index}
              className={`max-w-[75%] p-2.5 rounded-lg text-sm text-white relative shadow-sm animate-fade-in ${
                isMe 
                  ? 'bg-[#005c4b] align-self-end self-end rounded-tr-none' 
                  : 'bg-[#202c33] align-self-start self-start rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
              <span className="block text-[10px] text-white/50 text-right mt-1">09:41</span>
            </div>
          );
        })}
        
        {/* Balão Visual do "digitando..." para dar efeito dinâmico no vídeo */}
        {isTyping && (
          <div className="bg-[#202c33] text-white max-w-[30%] p-2.5 rounded-lg rounded-tl-none text-sm self-start shadow-sm flex items-center gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce [animation-delay:0.2s]">●</span>
            <span className="animate-bounce [animation-delay:0.4s]">●</span>
          </div>
        )}
      </div>
    </div>
  );
}
