export interface Question {
  id: string;
  tag: string;
  type: 'single' | 'true-false';
  text: string;
  options?: string[];
  correctIndex: number;
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

  public resetUsedQuestions() {
    this.usedQuestionIds.clear();
  }

  public addQuestions(newQuestions: Question[]) {
    this.questions.push(...newQuestions);
  }
}

// Пример начального набора вопросов
export const initialQuestions: Question[] = [
  {
    id: 'q1',
    tag: 'general',
    type: 'single',
    text: 'Какой цвет получают при смешении синего и жёлтого?',
    options: ['Оранжевый', 'Зелёный', 'Фиолетовый', 'Коричневый'],
    correctIndex: 1
  },
  {
    id: 'q2',
    tag: 'general',
    type: 'true-false',
    text: 'Столица России - Москва',
    options: ['Верно', 'Неверно'],
    correctIndex: 0
  },
  {
    id: 'q3',
    tag: 'science',
    type: 'single',
    text: 'Какая планета ближайшая к Солнцу?',
    options: ['Марс', 'Венера', 'Меркурий', 'Земля'],
    correctIndex: 2
  }
];