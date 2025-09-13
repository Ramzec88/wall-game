export interface Question {
  id: string;
  tag: string;
  type: 'single' | 'true-false' | 'text-input';
  text: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
}

export class QuestionManager {
  private questions: Question[];
  private usedQuestionIds: Set<string> = new Set();

  constructor(questions: Question[]) {
    this.questions = questions;
  }

  public getQuestionByTag(tag: string): Question | null {
    const availableQuestions = this.questions
      .filter(q => q.tag === tag && !this.usedQuestionIds.has(q.id));

    if (availableQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    
    this.usedQuestionIds.add(selectedQuestion.id);
    return selectedQuestion;
  }

  public checkAnswer(question: Question, selectedIndex: number): boolean {
    return selectedIndex === question.correctIndex;
  }

  public checkTextAnswer(question: Question, userAnswer: string): boolean {
    if (!question.correctAnswer) return false;
    return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  }

  public resetUsedQuestions() {
    this.usedQuestionIds.clear();
  }

  public addQuestions(newQuestions: Question[]) {
    this.questions.push(...newQuestions);
  }
}

// Интерфейс для загруженных вопросов из JSON
interface QuestionsData {
  rounds: {
    [key: string]: {
      question: string;
      options?: string[];
      answer: string;
    }[];
  };
}

// Загрузка вопросов из JSON файла
let questionsData: QuestionsData | null = null;

export async function loadQuestions(): Promise<QuestionsData> {
  if (questionsData) return questionsData;
  
  try {
    const response = await fetch('/questions.json');
    questionsData = await response.json();
    return questionsData!;
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
}

// Конвертация вопросов из JSON формата в Question интерфейс
export function convertToQuestion(roundData: any, index: number, round: number): Question {
  const isVaBank = round === 8; // Ва-банк раунд
  const hasOptions = roundData.options && roundData.options.length > 0;
  
  if (isVaBank) {
    return {
      id: `r${round}-q${index}`,
      tag: 'va-bank',
      type: 'text-input',
      text: roundData.question,
      correctAnswer: roundData.answer
    };
  } else {
    const correctIndex = hasOptions ? roundData.options.findIndex((opt: string) => opt === roundData.answer) : -1;
    
    return {
      id: `r${round}-q${index}`,
      tag: `round-${round}`,
      type: hasOptions ? 'single' : 'true-false',
      text: roundData.question,
      options: roundData.options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0
    };
  }
}

// Пример начального набора вопросов для обратной совместимости
export const initialQuestions: Question[] = [];