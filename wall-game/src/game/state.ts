import { GameBall } from '../physics/ball';
import { GameBoard } from '../physics/board';
import type { PegConfig } from '../physics/board';

export interface GameConfig {
  width: number;
  height: number;
  rows: number;
  cols: number;
  exits: { id: string; points: number }[];
}

export interface GameState {
  score: number;
  currentRound: number;
  totalRounds: number;
  selectedExit: string | null;
  finalRoundStake: number;
}

export class GameManager {
  private board: GameBoard;
  private ball: GameBall | null = null;
  private config: GameConfig;
  private state: GameState;

  constructor(config: GameConfig) {
    this.config = config;
    
    const pegGrid: PegConfig[] = this.generatePegGrid(
      config.width, 
      config.height, 
      config.rows, 
      config.cols
    );

    this.board = new GameBoard(config.width, config.height, pegGrid);

    this.state = {
      score: 0,
      currentRound: 1,
      totalRounds: 5,
      selectedExit: null,
      finalRoundStake: 0
    };
  }

  private generatePegGrid(width: number, height: number, rows: number, cols: number): PegConfig[] {
    const pegs: PegConfig[] = [];
    const xSpacing = width / (cols + 1);
    const ySpacing = height / (rows + 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = xSpacing * (col + 1);
        const y = ySpacing * (row + 1);
        pegs.push({ x, y });
      }
    }

    return pegs;
  }

  public selectEntry(entryIndex: number) {
    const startX = this.config.width * (entryIndex + 1) / (this.config.cols + 1);
    this.ball = new GameBall(startX, 0);
    this.ball.launch(Math.PI / 2, 0.01);
    this.state.selectedExit = this.determineExit(entryIndex);
  }

  private determineExit(entryIndex: number): string {
    // Простая логика определения выхода на основе входа
    const exitIndex = Math.floor(this.config.exits.length / 2 + (Math.random() - 0.5) * 2);
    return this.config.exits[exitIndex].id;
  }

  public calculateExitPoints(exitId: string): number {
    const exit = this.config.exits.find(e => e.id === exitId);
    return exit ? exit.points : 0;
  }

  public updateScore(isCorrectAnswer: boolean, points: number) {
    this.state.score += isCorrectAnswer ? points : -points;
  }

  public isGameOver(): boolean {
    return this.state.currentRound > this.state.totalRounds;
  }

  public nextRound() {
    if (!this.isGameOver()) {
      this.state.currentRound++;
      this.state.selectedExit = null;
      this.ball = null;
    }
  }

  public prepareFinalRound() {
    if (this.state.currentRound === this.state.totalRounds) {
      this.state.finalRoundStake = Math.floor(this.state.score * 0.5);
    }
  }

  public playFinalRound(isCorrectAnswer: boolean): number {
    if (isCorrectAnswer) {
      this.state.score += this.state.finalRoundStake;
    } else {
      this.state.score -= this.state.finalRoundStake;
    }
    return this.state.score;
  }

  public getState(): GameState {
    return { ...this.state };
  }
}