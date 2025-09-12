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
    const xSpacing = width / (cols + 1); // равномерное распределение по всей ширине
    const ySpacing = (height - 160) / rows; 
    const startY = 100; 

    for (let row = 0; row < rows; row++) {
      // Шахматное расположение: нечетные ряды смещены на половину интервала
      const isEvenRow = row % 2 === 0;
      const rowOffset = isEvenRow ? 0 : xSpacing / 2;
      const colsInRow = isEvenRow ? cols : cols - 1;
      
      for (let col = 0; col < colsInRow; col++) {
        const x = xSpacing + col * xSpacing + rowOffset;
        const y = startY + row * ySpacing;
        
        // Штырьки покрывают всю ширину стены с минимальными отступами
        if (x > 25 && x < width - 25) {
          pegs.push({ x, y });
        }
      }
    }

    return pegs;
  }
}