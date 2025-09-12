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
  private config: GameConfig;
  private state: GameState;

  constructor(config: GameConfig) {
    this.config = config;
    
    // Удалена генерация pegGrid, так как не используется
    this.state = {
      score: 0,
      currentRound: 1,
      totalRounds: 5,
      selectedExit: null,
      finalRoundStake: 0
    };
  }

  // Метод generatePegGrid удален, так как не используется

  public selectEntry(entryIndex: number) {
    // Удалена логика с GameBall
    this.state.selectedExit = this.determineExit(entryIndex);
  }

  private determineExit(_entryIndex: number): string {
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