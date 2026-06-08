export interface Question {
  tipo: 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'DROP_DOWN';
  titulo: string;
  opcoes: string[];
  respostasCorretas: number[];
  feedbackCorreto: string;
  feedbackIncorreto: string;
}

export interface ExamRequest {
  formId: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  totalQuestions: number;
  pointsPerQuestion: number;
  numMultipleChoice: number;
  numCheckbox: number;
  numDropdown: number;
  baseMaterial: string;
}

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: Date;
  stepIndex?: number;
}
