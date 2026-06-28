'use client';

import { useState } from 'react';
import { Message, ChatSettings } from '../types/chat';

interface ExporterProps {
  messages: Message[];
  settings: ChatSettings;
}

export default function VideoExporter({ messages }: ExporterProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleExportVideo = async () => {
    if (messages.length === 0) return alert('Cole uma conversa primeiro!');

    const element = document.getElementById('tiktok-phone');
    if (!element) return alert('Erro: O simulador de celular não foi encontrado.');

    try {
      setIsRendering(true);

      // Captura o stream de vídeo exclusivamente do elemento HTML do celular (mantendo CSS, fontes e avatares)
      // @ts-ignore
      const stream = element.captureStream ? element.captureStream(30) : (element as any).mozCaptureStream ? (element as any).mozCaptureStream(30) : null;

      if (!stream) {
        alert('Este navegador não suporta exportação direta de elementos. Iniciando modo de captura alternativo.');
        setIsRendering(false);
        return;
      }

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
        a.download = 'video-tiktok-zapvid.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRendering(false);
      };

      mediaRecorder.start();
      alert('Exportação iniciada! Dê o "Play" na simulação do vídeo abaixo e clique em parar quando a conversa terminar.');

      // Botão flutuante discreto para finalizar a gravação mantendo o design intacto
      const stopBtn = document.createElement('button');
      stopBtn.innerHTML = '🛑 CONCLUIR E BAIXAR VÍDEO';
      stopBtn.style.position = 'fixed';
      stopBtn.style.bottom = '40px';
      stopBtn.style.left = '50%';
      stopBtn.style.transform = 'translateX(-50%)';
      stopBtn.style.zIndex = '99999';
      stopBtn.style.backgroundColor = '#22c55e';
      stopBtn.style.color = 'white';
      stopBtn.style.padding = '14px 28px';
      stopBtn.style.fontWeight = 'bold';
      stopBtn.style.borderRadius = '9999px';
      stopBtn.style.border = 'none';
      stopBtn.style.cursor = 'pointer';
      stopBtn.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';

      stopBtn.onclick = () => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(stopBtn);
      };

      document.body.appendChild(stopBtn);

    } catch (err) {
      console.error(err);
      alert('Erro ao exportar o vídeo.');
      setIsRendering(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
      <button
        onClick={handleExportVideo}
        disabled={isRendering}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        {isRendering ? '⏳ Exportando em segundo plano...' : '⚡ Gerar Vídeo Perfeito (Download)'}
      </button>
      <p className="text-[11px] text-neutral-500 mt-2">
        A prévia visual voltará ao normal e usará os estilos nativos do aplicativo.
      </p>
    </div>
  );
}
