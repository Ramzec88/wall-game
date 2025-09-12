import * as Matter from 'matter-js';

export class GameBall {
  private ball: Matter.Body;

  constructor(x: number, y: number, radius: number = 10, color: string = '#FF0000') {
    this.ball = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.9, // сильный отскок для непредсказуемости
      friction: 0.001,  // минимальное трение
      frictionAir: 0.005, // небольшое сопротивление воздуха
      density: 0.0005,  // еще меньше плотность
      render: {
        fillStyle: color
      }
    });
  }

  public launch(angle: number, force: number) {
    const impulse = {
      x: Math.cos(angle) * force,
      y: Math.sin(angle) * force
    };
    Matter.Body.applyForce(this.ball, this.ball.position, impulse);
  }

  public getBody(): Matter.Body {
    return this.ball;
  }

  public reset(x: number, y: number) {
    Matter.Body.setPosition(this.ball, { x, y });
    Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
  }
}