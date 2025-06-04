import { GameConfig } from './types';

export const defaultConfig: GameConfig = {
    gridSize: 30,
    segmentScale: 0.9,
    maxFoodItems: 5,
    minFoodInterval: 500,
    maxFoodInterval: 1000,
    initialSpeed: 200,
    minSpeed: 50,
    speedDecrease: 2,
    scorePerFood: 10,
    ramRewardMultiplier: 25, //should be high, so that its worth cutting off segments
    scoreLengthMultiplier: 0.5, //should be significantly less than ramRewardMultiplier
    foodExpirationTime: 10000 // Food disappears after 10 seconds
}; 