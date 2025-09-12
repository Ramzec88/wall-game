import React, { useState, useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import type { GameManager } from '../game/state';
import type { GameConfig } from '../game/state';
import type { Question, QuestionManager } from '../data/questions';
import { initialQuestions } from '../data/questions';
import { QuestionModal } from './QuestionModal';
import { GameManager as GameManagerClass } from '../game/state';
import { QuestionManager as QuestionManagerClass } from '../data/questions';
import { GameBoard } from '../physics/board';
import { GameBall } from '../physics/ball';

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
  const [ballDropping, setBallDropping] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const currentBallRef = useRef<GameBall | null>(null);
  const exitSensorsRef = useRef<Matter.Body[]>([]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    // Настраиваем гравитацию для лучшего падения
    engine.world.gravity.y = 1;
    engine.world.gravity.scale = 0.001;
    engineRef.current = engine;

    // Создаем физическую доску с штырьками
    const tempBoard = new GameBoard(GAME_CONFIG.width, GAME_CONFIG.height, []);
    const pegGrid = tempBoard.generatePegGrid(GAME_CONFIG.width, GAME_CONFIG.height - 150, GAME_CONFIG.rows, GAME_CONFIG.cols);
    
    // Создаем границы мира
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      render: { fillStyle: '#2E2E2E' },
      chamfer: { radius: 0 }
    };

    Matter.World.add(engine.world, [
      // Нижняя стена
      Matter.Bodies.rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height + 50, GAME_CONFIG.width, 100, wallOptions),
      // Верхняя стена  
      Matter.Bodies.rectangle(GAME_CONFIG.width / 2, -50, GAME_CONFIG.width, 100, wallOptions),
      // Левая стена
      Matter.Bodies.rectangle(-50, GAME_CONFIG.height / 2, 100, GAME_CONFIG.height, wallOptions),
      // Правая стена
      Matter.Bodies.rectangle(GAME_CONFIG.width + 50, GAME_CONFIG.height / 2, 100, GAME_CONFIG.height, wallOptions)
    ]);
    
    // Создаем штырьки-ромбики  
    pegGrid.forEach(peg => {
      const pegBody = Matter.Bodies.polygon(peg.x, peg.y, 4, 8, {
        isStatic: true,
        render: { fillStyle: '#FFFFFF' },
        angle: Math.PI / 4, // поворот на 45 градусов для ромба
        chamfer: { radius: 0 }
      });
      Matter.World.add(engine.world, pegBody);
    });
    
    // Создаем выходные ячейки внизу
    const exitWidth = GAME_CONFIG.width / GAME_CONFIG.exits.length;
    const exitHeight = 50;
    const exitY = GAME_CONFIG.height - exitHeight / 2;
    
    GAME_CONFIG.exits.forEach((exit, index) => {
      const exitX = exitWidth * index + exitWidth / 2;
      const exitSensor = Matter.Bodies.rectangle(exitX, exitY, exitWidth - 5, exitHeight, {
        isSensor: true,
        isStatic: true,
        render: { 
          fillStyle: '#e74c3c',
          strokeStyle: '#fff',
          lineWidth: 2
        },
        label: `exit-${exit.id}`
      });
      exitSensorsRef.current.push(exitSensor);
      Matter.World.add(engine.world, exitSensor);
    });

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height,
        wireframes: false,
        background: '#2c3e50',
        showAngleIndicator: false,
        showVelocity: false
      }
    });
    renderRef.current = render;

    // Добавляем детекцию столкновений
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Проверяем попадание шара в выходную ячейку
        if ((bodyA.label?.startsWith('exit-') || bodyB.label?.startsWith('exit-')) && 
            (bodyA.label === 'ball' || bodyB.label === 'ball')) {
          
          const exitBody = bodyA.label?.startsWith('exit-') ? bodyA : bodyB;
          const exitId = exitBody.label?.replace('exit-', '');
          
          if (exitId && currentBallRef.current) {
            // Убираем шар из мира
            Matter.World.remove(engine.world, currentBallRef.current.getBody());
            currentBallRef.current = null;
            setBallDropping(false);
            
            // Обновляем состояние игры
            gameManager.getState().selectedExit = exitId;
            const question = questionManager.getQuestionByTag('general');
            setCurrentQuestion(question);
          }
        }
      });
    });

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      currentBallRef.current = null;
      exitSensorsRef.current = [];
    };
  }, []);

  const handleEntrySelect = (entryIndex: number) => {
    if (ballDropping || !engineRef.current) return;
    
    setBallDropping(true);
    
    // Создаем шар в выбранном входе
    const entryWidth = GAME_CONFIG.width / GAME_CONFIG.cols;
    const entryX = entryWidth * entryIndex + entryWidth / 2;
    const entryY = 50;
    
    const ball = new GameBall(entryX, entryY, 8, '#f39c12');
    ball.getBody().label = 'ball';
    currentBallRef.current = ball;
    
    // Добавляем шар в мир
    Matter.World.add(engineRef.current.world, ball.getBody());
    
    // Запускаем шар с небольшой случайной силой для непредсказуемости
    const randomX = (Math.random() - 0.5) * 0.0005; // больше случайности по X
    const baseY = 0.002; // больше начальная сила вниз
    const randomY = baseY + (Math.random() - 0.5) * 0.0003; // небольшая вариация по Y
    
    Matter.Body.applyForce(ball.getBody(), ball.getBody().position, { x: randomX, y: randomY });
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
        disabled={currentQuestion !== null || gameOver || finalRoundMode || ballDropping}
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
          <div className="game-board-container">
            <div ref={sceneRef} className="game-scene" />
            <div className="exit-labels">
              {GAME_CONFIG.exits.map((exit, index) => (
                <div key={exit.id} className="exit-label" style={{
                  left: `${(100 / GAME_CONFIG.exits.length) * index + (100 / GAME_CONFIG.exits.length) / 2}%`
                }}>
                  {exit.points}
                </div>
              ))}
            </div>
          </div>
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