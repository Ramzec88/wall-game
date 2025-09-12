import React, { useState, useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import type { GameManager } from '../game/state';
import type { GameConfig } from '../game/state';
import type { Question, QuestionManager } from '../data/questions';
import { initialQuestions } from '../data/questions';
import { QuestionModal } from './QuestionModal';
import { GameBoard as PlinkoBoard } from '../physics/board';
import { GameBall } from '../physics/ball';
import { GameManager as GameManagerClass } from '../game/state';
import { QuestionManager as QuestionManagerClass } from '../data/questions';

const GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  rows: 7,
  cols: 7,
  exits: [
    { id: 'e1', points: 100 },
    { id: 'e2', points: 200 },
    { id: 'e3', points: 300 },
    { id: 'e4', points: 400 },
    { id: 'e5', points: 300 },
    { id: 'e6', points: 200 },
    { id: 'e7', points: 100 }
  ]
};

export const GameBoardComponent: React.FC = () => {
  const [gameManager] = useState<GameManager>(new GameManagerClass(GAME_CONFIG));
  const [questionManager] = useState<QuestionManager>(new QuestionManagerClass(initialQuestions));
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [finalRoundMode, setFinalRoundMode] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        wireframes: false
      }
    });
    renderRef.current = render;

    const pegGrid = new PlinkoBoard(GAME_CONFIG.width, GAME_CONFIG.height, []).generatePegGrid(
      GAME_CONFIG.width, 
      GAME_CONFIG.height, 
      GAME_CONFIG.rows, 
      GAME_CONFIG.cols
    );

    const board = new PlinkoBoard(GAME_CONFIG.width, GAME_CONFIG.height, pegGrid);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []);

  const handleEntrySelect = (entryIndex: number) => {
    gameManager.selectEntry(entryIndex);
    const question = questionManager.getQuestionByTag('general');
    setCurrentQuestion(question);
  };

  const handleQuestionAnswer = (isCorrect: boolean) => {
    const points = gameManager.calculateExitPoints(gameManager.getState().selectedExit || 'e4');
    gameManager.updateScore(isCorrect, points);
    setScore(gameManager.getState().score);
    
    gameManager.nextRound();
    setCurrentRound(gameManager.getState().currentRound);
    setCurrentQuestion(null);

    if (gameManager.isGameOver()) {
      gameManager.prepareFinalRound();
      setFinalRoundMode(true);
    }
  };

  const handleFinalRoundAnswer = (isCorrect: boolean) => {
    const finalScore = gameManager.playFinalRound(isCorrect);
    setScore(finalScore);
    setGameOver(true);
  };

  const renderEntryButtons = () => {
    return Array.from({ length: GAME_CONFIG.cols }, (_, index) => (
      <button 
        key={index} 
        onClick={() => handleEntrySelect(index)}
        disabled={currentQuestion !== null || gameOver || finalRoundMode}
      >
        Вход {index + 1}
      </button>
    ));
  };

  const renderGameOverScreen = () => (
    <div className="game-over">
      <h2>Игра окончена</h2>
      <p>Ваш итоговый счет: {score}</p>
      <button onClick={() => window.location.reload()}>Начать заново</button>
    </div>
  );

  return (
    <div className="game-container">
      {gameOver ? (
        renderGameOverScreen()
      ) : (
        <>
          <div className="game-stats">
            <p>Счет: {score}</p>
            <p>Раунд: {currentRound} / {GAME_CONFIG.exits.length}</p>
          </div>
          <div className="entry-buttons">
            {renderEntryButtons()}
          </div>
          <div ref={sceneRef} className="game-scene" />
          {currentQuestion && (
            <QuestionModal 
              question={currentQuestion} 
              onAnswer={handleQuestionAnswer} 
            />
          )}
          {finalRoundMode && (
            <QuestionModal 
              question={{
                id: 'final-round',
                tag: 'final',
                type: 'single',
                text: `Финальный раунд: ва-банк на ${gameManager.getState().finalRoundStake} очков`,
                options: ['Рискнуть', 'Отказаться'],
                correctIndex: 0
              }}
              onAnswer={handleFinalRoundAnswer}
            />
          )}
        </>
      )}
    </div>
  );
};