import React, { useState, useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import type { GameManager } from '../game/state';
import type { GameConfig } from '../game/state';
import type { Question, QuestionManager } from '../data/questions';
import { loadQuestions, convertToQuestion } from '../data/questions';
import { QuestionModal } from './QuestionModal';
import { GameManager as GameManagerClass } from '../game/state';
import { QuestionManager as QuestionManagerClass } from '../data/questions';
import { GameBoard } from '../physics/board';
import { GameBall } from '../physics/ball';

const GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  rows: 8,
  cols: 10,
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

const NUM_ENTRIES = 7; // Количество входов фиксировано

export const GameBoardComponent: React.FC = () => {
  const [gameManager] = useState<GameManager>(new GameManagerClass(GAME_CONFIG));
  const [questionManager] = useState<QuestionManager>(new QuestionManagerClass([]));
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [finalRoundMode, setFinalRoundMode] = useState(false);
  const [ballDropping, setBallDropping] = useState(false);
  const [isVaBankRound, setIsVaBankRound] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);

  // Загрузка вопросов при старте
  useEffect(() => {
    const initQuestions = async () => {
      try {
        console.log('Loading questions...');
        const data = await loadQuestions();
        console.log('Questions loaded:', data);
        setQuestionsData(data);
        setQuestionsLoaded(true);
        console.log('Questions state updated');
      } catch (error) {
        console.error('Failed to load questions:', error);
      }
    };
    initQuestions();
  }, []);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const currentBallRef = useRef<GameBall | null>(null);
  const exitSensorsRef = useRef<Matter.Body[]>([]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create();
    // Настраиваем гравитацию для медленного падения
    engine.world.gravity.y = 1;
    engine.world.gravity.scale = 0.0004;
    engineRef.current = engine;

    // Создаем физическую доску с штырьками
    const tempBoard = new GameBoard(GAME_CONFIG.width, GAME_CONFIG.height, []);
    const pegGrid = tempBoard.generatePegGrid(GAME_CONFIG.width, GAME_CONFIG.height - 150, GAME_CONFIG.rows, GAME_CONFIG.cols);
    
    // Создаем границы мира
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      render: { fillStyle: '#1a1a2e' },
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
      const pegBody = Matter.Bodies.polygon(peg.x, peg.y, 4, 6, {
        isStatic: true,
        restitution: 0.95, // очень высокий отскок от штырьков
        friction: 0.001,   // минимальное трение штырьков
        render: { 
          fillStyle: '#ff6b35',
          strokeStyle: '#f7931e',
          lineWidth: 2
        },
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
          fillStyle: '#00f5ff',
          strokeStyle: '#0099cc',
          lineWidth: 3
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
            // Фиксируем шар в выходной ячейке (делаем статичным)
            const ballBody = currentBallRef.current.getBody();
            const exitIndex = GAME_CONFIG.exits.findIndex(e => e.id === exitId);
            const exitWidth = GAME_CONFIG.width / GAME_CONFIG.exits.length;
            const fixedX = exitWidth * exitIndex + exitWidth / 2;
            const fixedY = GAME_CONFIG.height - 75; // чуть выше выходной ячейки
            
            // Позиционируем и фиксируем шар
            Matter.Body.setPosition(ballBody, { x: fixedX, y: fixedY });
            Matter.Body.setVelocity(ballBody, { x: 0, y: 0 });
            Matter.Body.setStatic(ballBody, true);
            
            setBallDropping(false);
            
            // Обновляем состояние игры
            gameManager.getState().selectedExit = exitId;
            
            console.log('Ball landed, questionsLoaded:', questionsLoaded, 'questionsData:', questionsData);
            
            if (questionsLoaded && questionsData) {
              const question = getQuestionForCurrentRound();
              console.log('Generated question:', question);
              setCurrentQuestion(question);
            } else {
              console.log('Questions not loaded yet, retrying in 100ms');
              setTimeout(() => {
                if (questionsData) {
                  const question = getQuestionForCurrentRound();
                  console.log('Generated question (delayed):', question);
                  setCurrentQuestion(question);
                }
              }, 100);
            }
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

  // Получение вопроса для текущего раунда
  const getQuestionForCurrentRound = (): Question | null => {
    console.log('getQuestionForCurrentRound called, currentRound:', currentRound);
    console.log('questionsData:', questionsData);
    
    if (!questionsData || !questionsData.rounds) {
      console.log('No questions data available');
      return null;
    }
    
    const roundKey = currentRound <= 7 ? currentRound.toString() : 'va-bank';
    console.log('roundKey:', roundKey);
    
    const roundQuestions = questionsData.rounds[roundKey];
    console.log('roundQuestions:', roundQuestions);
    
    if (!roundQuestions || roundQuestions.length === 0) {
      console.log('No questions for round:', roundKey);
      return null;
    }
    
    // Выбираем случайный вопрос из 50 вопросов раунда
    const randomIndex = Math.floor(Math.random() * roundQuestions.length);
    const questionData = roundQuestions[randomIndex];
    console.log('Selected question data:', questionData);
    
    // Конвертируем в наш формат
    const roundNumber = roundKey === 'va-bank' ? 8 : currentRound;
    const convertedQuestion = convertToQuestion(questionData, randomIndex, roundNumber);
    console.log('Converted question:', convertedQuestion);
    
    return convertedQuestion;
  };

  const handleEntrySelect = (entryIndex: number) => {
    if (ballDropping || !engineRef.current) return;
    
    // Убираем предыдущий зафиксированный шар, если он есть
    if (currentBallRef.current) {
      Matter.World.remove(engineRef.current.world, currentBallRef.current.getBody());
      currentBallRef.current = null;
    }
    
    setBallDropping(true);
    
    // Создаем шар в выбранном входе
    const entryWidth = GAME_CONFIG.width / NUM_ENTRIES;
    const entryX = entryWidth * entryIndex + entryWidth / 2;
    const entryY = 50;
    
    const ball = new GameBall(entryX, entryY, 16, '#39ff14');
    ball.getBody().label = 'ball';
    currentBallRef.current = ball;
    
    // Добавляем шар в мир
    Matter.World.add(engineRef.current.world, ball.getBody());
    
    // Запускаем шар с небольшой случайной силой для непредсказуемости
    const randomX = (Math.random() - 0.5) * 0.0004; // больше случайности для отскока
    const baseY = 0.0012; // немного больше начальная сила 
    const randomY = baseY + (Math.random() - 0.5) * 0.0003; // больше вариации
    
    Matter.Body.applyForce(ball.getBody(), ball.getBody().position, { x: randomX, y: randomY });
  };

  const handleQuestionAnswer = (isCorrect: boolean) => {
    const points = gameManager.calculateExitPoints(gameManager.getState().selectedExit || 'e4');
    gameManager.updateScore(isCorrect, points);
    setScore(gameManager.getState().score);
    
    setCurrentQuestion(null);
    
    if (currentRound >= 7) {
      // После 7 раунда - ва-банк
      setIsVaBankRound(true);
      setFinalRoundMode(true);
    } else {
      gameManager.nextRound();
      setCurrentRound(gameManager.getState().currentRound);
    }
  };

  const handleFinalRoundAnswer = (isCorrect: boolean) => {
    if (isVaBankRound) {
      // Ва-банк раунд - показываем вопрос
      const vaBankQuestion = getQuestionForCurrentRound();
      setCurrentQuestion(vaBankQuestion);
      setIsVaBankRound(false);
    } else {
      // Ответ на ва-банк вопрос
      const finalScore = gameManager.playFinalRound(isCorrect);
      setScore(finalScore);
      setGameOver(true);
    }
  };

  const renderEntryButtons = () => {
    return Array.from({ length: NUM_ENTRIES }, (_, index) => (
      <button 
        key={index} 
        onClick={() => handleEntrySelect(index)}
        disabled={currentQuestion !== null || gameOver || finalRoundMode || ballDropping || !questionsLoaded}
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
            <p>Раунд: {currentRound} / 7 {finalRoundMode ? '(Ва-банк)' : ''}</p>
            {!questionsLoaded && <p>Загрузка вопросов...</p>}
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
              onAnswer={isVaBankRound ? handleQuestionAnswer : (currentQuestion.type === 'text-input' ? handleFinalRoundAnswer : handleQuestionAnswer)}
              questionManager={questionManager}
            />
          )}
          {finalRoundMode && !currentQuestion && (
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
              questionManager={questionManager}
            />
          )}
        </>
      )}
    </div>
  );
};