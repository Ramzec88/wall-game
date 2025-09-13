import React, { useState } from 'react';
import type { Question } from '../data/questions';

interface QuestionModalProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  questionManager?: any;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer, questionManager }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>('');

  const handleOptionClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (question.type === 'text-input') {
      const isCorrect = questionManager?.checkTextAnswer(question, textAnswer) || false;
      onAnswer(isCorrect);
    } else if (selectedIndex !== null) {
      const isCorrect = selectedIndex === question.correctIndex;
      onAnswer(isCorrect);
    }
  };

  return (
    <div className="question-modal">
      <div className="question-content">
        <h2>{question.text}</h2>
        {question.type === 'text-input' ? (
          <div className="text-input-container">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="text-input"
            />
          </div>
        ) : (
          question.options && (
            <div className="options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(index)}
                >
                  {option}
                </button>
              ))}
            </div>
          )
        )}
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={question.type === 'text-input' ? textAnswer.trim() === '' : selectedIndex === null}
        >
          Ответить
        </button>
      </div>
    </div>
  );
};