import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking Matter.js for testing
vi.mock('matter-js', () => ({
  Engine: {
    create: vi.fn(() => ({
      world: {}
    })),
    update: vi.fn()
  },
  Render: {
    create: vi.fn(),
    run: vi.fn(),
    stop: vi.fn()
  },
  Runner: {
    create: vi.fn(),
    run: vi.fn(),
    stop: vi.fn()
  },
  World: {
    add: vi.fn()
  },
  Bodies: {
    circle: vi.fn(),
    rectangle: vi.fn()
  },
  Body: {
    setPosition: vi.fn(),
    setVelocity: vi.fn(),
    applyForce: vi.fn()
  }
}));