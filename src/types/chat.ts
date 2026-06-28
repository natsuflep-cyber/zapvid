export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isTyping?: boolean;
}

export interface ChatSettings {
  personAName: string;
  personBName: string;
  personAPhoto: string;
  personBPhoto: string;
  scrollSpeed: number;
  typingDuration: number;
  showReadTicks: boolean;
  theme: 'dark' | 'light';
}
