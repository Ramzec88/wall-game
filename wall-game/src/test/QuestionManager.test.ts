import { describe, it, expect } from 'vitest';
import type { QuestionManager } from '../data/questions';
import type { Question } from '../data/questions';
import { QuestionManager as QuestionManagerClass } from '../data/questions';

const testQuestions: Question[] = [
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

describe('QuestionManager', () => {
  it('should initialize with questions', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    expect(questionManager).toBeTruthy();
  });

  it('should get questions by tag', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    
    const generalQuestion = questionManager.getQuestionByTag('general');
    expect(generalQuestion).toBeTruthy();
    expect(['q1', 'q2']).toContain(generalQuestion?.id);

    const scienceQuestion = questionManager.getQuestionByTag('science');
    expect(scienceQuestion).toBeTruthy();
    expect(scienceQuestion?.id).toBe('q3');
  });

  it('should not repeat questions within the same tag', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    
    const firstGeneralQuestion = questionManager.getQuestionByTag('general');
    const secondGeneralQuestion = questionManager.getQuestionByTag('general');
    
    expect(firstGeneralQuestion?.id).not.toBe(secondGeneralQuestion?.id);
  });

  it('should return null when no questions with tag exist', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    
    const missingTagQuestion = questionManager.getQuestionByTag('history');
    expect(missingTagQuestion).toBeNull();
  });

  it('should check answers correctly', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    const question = testQuestions[0];

    expect(questionManager.checkAnswer(question, 1)).toBeTruthy();
    expect(questionManager.checkAnswer(question, 0)).toBeFalsy();
  });

  it('should reset used questions', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    
    questionManager.getQuestionByTag('general');
    questionManager.getQuestionByTag('general');
    
    questionManager.resetUsedQuestions();
    
    const generalQuestion = questionManager.getQuestionByTag('general');
    expect(generalQuestion).toBeTruthy();
  });

  it('should add new questions', () => {
    const questionManager = new QuestionManagerClass(testQuestions);
    
    const newQuestion: Question = {
      id: 'q4',
      tag: 'history',
      type: 'single',
      text: 'В каком году началась Вторая мировая война?',
      options: ['1939', '1941', '1945', '1914'],
      correctIndex: 0
    };

    questionManager.addQuestions([newQuestion]);
    
    const historyQuestion = questionManager.getQuestionByTag('history');
    expect(historyQuestion).toBeTruthy();
    expect(historyQuestion?.id).toBe('q4');
  });
});