import React, { useState } from 'react';
import type { Question } from '../data/questions';

interface QuestionModalProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOptionClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex !== null) {
      const isCorrect = selectedIndex === question.correctIndex;
      onAnswer(isCorrect);
    }
  };

  return (
    <div className="question-modal">
      <div className="question-content">
        <h2>{question.text}</h2>
        {question.options && (
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
        )}
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={selectedIndex === null}
        >
          Ответить
        </button>
      </div>
    </div>
  );
};