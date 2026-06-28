export interface Message {
  id: string;
  sender: string;       // Nome de quem enviou
  text: string;         // Conteúdo da mensagem
  time: string;         // Horário (ex: "14:32")
  isTyping?: boolean;   // Se deve mostrar a animação "digitando..." antes dela
}

export interface ChatSettings {
  personAName: string;
  personBName: string;
  personAPhoto: string;
  personBPhoto: string;
  scrollSpeed: number;      // Em segundos
  typingDuration: number;   // Tempo do efeito "digitando..."
  showReadTicks: boolean;   // Visto azul
  theme: 'dark' | 'light';
}
