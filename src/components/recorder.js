// Arquivo isolado para contornar o compilador estrito e gravar apenas o elemento do celular
export async function startCanvasRecorder(elementId, onStopCallback) {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    alert('Erro: Simulador de celular não encontrado na página.');
    return;
  }

  // Importa dinamicamente a biblioteca de clonagem visual
  const html2canvas = (await import('html2canvas')).default;

  const targetWidth = element.offsetWidth;
  const targetHeight = element.offsetHeight;

  const recordCanvas = document.createElement('canvas');
  recordCanvas.width = targetWidth;
  recordCanvas.height = targetHeight;
  const ctx = recordCanvas.getContext('2d');
  if (!ctx) return;

  // Acesso direto sem checagem de tipos estritos do Next.js
  const captureMethod = recordCanvas['captureStream'] || recordCanvas['mozCaptureStream'];
  if (!captureMethod) {
    alert('Navegador incompatível com a renderização interna.');
    return;
  }

  const stream = captureMethod.call(recordCanvas, 30);
  const chunks = [];
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

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
    if (onStopCallback) onStopCallback();
  };

  mediaRecorder.start();
  window.dispatchEvent(new CustomEvent('zapvid-start-render'));

  let isRecordingActive = true;

  const captureFrame = async () => {
    if (!isRecordingActive) return;
    try {
      const canvasFrame = await html2canvas(element, {
        useCORS: true,
        scale: 1,
        backgroundColor: '#0b141a',
        logging: false
      });
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(canvasFrame, 0, 0, targetWidth, targetHeight);
    } catch (e) {}

    if (isRecordingActive) {
      requestAnimationFrame(captureFrame);
    }
  };

  captureFrame();

  const stopSignalHandler = () => {
    isRecordingActive = false;
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
    }
    window.removeEventListener('zapvid-end-render', stopSignalHandler);
  };

  window.addEventListener('zapvid-end-render', stopSignalHandler);
}
