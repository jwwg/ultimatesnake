import { GameConfig } from './types';

export const defaultConfig: GameConfig = {
    gridSize: 20,
    segmentScale: 0.9,
    maxFoodItems: 5,
    minFoodInterval: 3000,
    maxFoodInterval: 8000,
    initialSpeed: 150,
    minSpeed: 50,
    speedDecrease: 2,
    scorePerFood: 10
}; 