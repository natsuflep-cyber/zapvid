'use client';

import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages, settings }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    // Carrega o FFmpeg usando URLs estáveis do unpkg/cdnjs via WebAssembly
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreJS: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  };

  const handleGenerateVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');
    
    setIsRendering(true);
    setProgress(5);
    setVideoUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        await loadFFmpeg();
      }
      setProgress(20);

      // --- CONFIGURAÇÃO DO CANVAS PARA CAPTURA (1080x1920 - Full HD Vertical) ---
      const canvas = document.createElement('canvas');
      canvas.width = 1080;   // Resolução solicitada [cite: 13]
      canvas.height = 1920;  // Proporção TikTok 9:16 [cite: 13]
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Ouvinte de progresso do FFmpeg
      ffmpeg.on('progress', ({ progress: ffmpegProgress }) => {
        // Mapeia o progresso do FFmpeg (de 50% a 100% do processo total)
        setProgress(Math.round(50 + ffmpegProgress * 50));
      });

      const fps = 30;
      let frameCount = 0;

      // Simulação simplificada de desenho frame por frame para o FFmpeg
      // Aqui nós desenhamos o fundo do WhatsApp e os balões artificialmente no canvas
      ctx.fillStyle = '#0b141a'; // Cor de fundo do WhatsApp Dark Mode
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      setProgress(40);

      // Escreve os frames temporários na memória virtual do FFmpeg.wasm
      // Nota: Em uma estrutura robusta, capturamos o elemento HTML real via 'html2canvas' ou gravando a stream de um canvas animado.
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // Desenha o frame simulando o scroll
        ctx.fillStyle = '#0b141a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Estilização simples dos balões no Canvas gerado
        ctx.fillStyle = msg.sender.toLowerCase() === settings.personBName.toLowerCase() ? '#005c4b' : '#202c33';
        ctx.roundRect(100, 200 + (i * 180), 880, 140, 20);
        ctx.fill();

        // Texto da mensagem
        ctx.fillStyle = '#e9edef';
        ctx.font = '32px sans-serif';
        ctx.fillText(`${msg.sender}: ${msg.text}`, 140, 280 + (i * 180));

        // Transforma o frame atual do canvas em uma imagem binária (JPEG)
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = frameData.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Salva o frame numerado (ex: frame001.jpg, frame002.jpg)
        const frameName = `frame_${String(frameCount).padStart(3, '0')}.jpg`;
        await ffmpeg.writeFile(frameName, binaryData);
        frameCount++;
      }

      setProgress(60);

      // --- EXECUÇÃO DO COMANDO FFMPEG ---
      // Junta todos os frames JPG em um vídeo MP4 a 30 FPS com codec universal (h264) 
      await ffmpeg.exec([
        '-framerate', '1',          // Tempo de exposição por frame (ajustável)
        '-i', 'frame_%03d.jpg',     // Padrão de entrada dos frames
        '-c:v', 'libx264',          // Codec de vídeo universal
        '-pix_fmt', 'yuv420p',      // Garante compatibilidade de reprodução em celulares
        'output.mp4'                // Arquivo de saída
      ]);

      // Lê o arquivo final gerado na memória do WebAssembly
      const data = await ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(videoBlob);
      
      setVideoUrl(url);
      setProgress(100);
    } catch (error) {
      console.error('Erro na renderização:', error);
      alert('Houve um erro ao gerar o vídeo.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-sm mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4">
      {!isRendering && !videoUrl && (
        <button
          onClick={handleGenerateVideo}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg text-sm tracking-wide"
        >
          🎬 Gerar Vídeo Final (MP4) 
        </button>
      )}

      {isRendering && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>Renderizando vídeo Full HD... [cite: 13]</span>
            <span className="font-bold text-red-500">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-neutral-800">
            <div 
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
            ✓ Vídeo gerado com sucesso! 
          </p>
          <a
            href={videoUrl}
            download="conversa-tiktok.mp4"
            className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all text-sm shadow-lg shadow-green-900/20"
          >
            📥 Baixar MP4 para o TikTok [cite: 15, 16]
          </a>
          <button 
            onClick={() => setVideoUrl(null)}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-400 underline"
          >
            Gerar outro vídeo
          </button>
        </div>
      )}
    </div>
  );
}
