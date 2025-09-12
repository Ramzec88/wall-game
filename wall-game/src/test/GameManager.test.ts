import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../game/state';

const GAME_CONFIG = {
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

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager(GAME_CONFIG);
  });

  it('should initialize with correct initial state', () => {
    const state = gameManager.getState();

    expect(state.score).toBe(0);
    expect(state.currentRound).toBe(1);
    expect(state.totalRounds).toBe(5);
    expect(state.selectedExit).toBeNull();
  });

  it('should update score correctly', () => {
    gameManager.updateScore(true, 200);
    expect(gameManager.getState().score).toBe(200);

    gameManager.updateScore(false, 100);
    expect(gameManager.getState().score).toBe(100);
  });

  it('should progress through rounds', () => {
    for (let i = 1; i < 5; i++) {
      gameManager.nextRound();
      expect(gameManager.getState().currentRound).toBe(i + 1);
    }

    expect(gameManager.isGameOver()).toBeFalsy();
    gameManager.nextRound();
    expect(gameManager.isGameOver()).toBeTruthy();
  });

  it('should calculate exit points correctly', () => {
    const points = gameManager.calculateExitPoints('e4');
    expect(points).toBe(400);
  });

  it('should handle final round stake', () => {
    // Manually set score to test final round stake
    gameManager['state'].score = 1000;
    gameManager['state'].currentRound = 5;
    
    gameManager.prepareFinalRound();
    
    const stake = gameManager.getState().finalRoundStake;
    expect(stake).toBe(500);
    
    const finalScoreWin = gameManager.playFinalRound(true);
    expect(finalScoreWin).toBe(1500);
    
    // Reset score and test losing final round
    gameManager['state'].score = 1000;
    const finalScoreLose = gameManager.playFinalRound(false);
    expect(finalScoreLose).toBe(500);
  });
});