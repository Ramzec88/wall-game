import * as Matter from 'matter-js';

export interface PegConfig {
  x: number;
  y: number;
}

export class GameBoard {
  private engine: Matter.Engine;
  private world: Matter.World;
  private pegs: Matter.Body[] = [];

  constructor(width: number, height: number, pegConfig: PegConfig[]) {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    this.createBoundaries(width, height);
    this.createPegs(pegConfig);
  }

  private createBoundaries(width: number, height: number) {
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      render: { fillStyle: '#2E2E2E' },
      chamfer: { radius: 0 }
    };

    Matter.World.add(this.world, [
      Matter.Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions),
      Matter.Bodies.rectangle(width / 2, -50, width, 100, wallOptions),
      Matter.Bodies.rectangle(-50, height / 2, 100, height, wallOptions),
      Matter.Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions)
    ]);
  }

  private createPegs(pegConfig: PegConfig[]) {
    pegConfig.forEach(config => {
      const peg = Matter.Bodies.circle(config.x, config.y, 5, {
        isStatic: true,
        render: { fillStyle: '#FFFFFF' }
      });
      this.pegs.push(peg);
      Matter.World.add(this.world, peg);
    });
  }

  public update() {
    Matter.Engine.update(this.engine);
  }

  public getWorld() {
    return this.world;
  }

  public generatePegGrid(width: number, height: number, rows: number, cols: number): PegConfig[] {
    const pegs: PegConfig[] = [];
    const xSpacing = width / (cols + 1);
    const ySpacing = height / (rows + 1);
    const startY = ySpacing + 80; // отступ сверху

    for (let row = 0; row < rows; row++) {
      // Шахматное расположение: нечетные ряды смещены
      const rowOffset = (row % 2) * (xSpacing / 2);
      const baseColsInRow = Math.ceil(cols * 0.8); // немного меньше колонок для симметрии
      
      for (let col = 0; col < baseColsInRow; col++) {
        const x = xSpacing * (col + 1) + rowOffset;
        const y = startY + ySpacing * row;
        
        // Проверяем, что штырек не слишком близко к краям и покрывает правый нижний угол
        if (x > 60 && x < width - 60 && y < height - 120) {
          pegs.push({ x, y });
        }
      }
    }

    return pegs;
  }
}