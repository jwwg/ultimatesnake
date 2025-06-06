import { GameConfig } from './types';

export const defaultConfig: GameConfig = {
    gridSize: 40,
    segmentScale: 0.5,
    maxFoodItems: 5,
    minFoodInterval: 500,
    maxFoodInterval: 2000,
    initialSpeed: 200,
    minSpeed: 50,
    speedDecrease: 0,
    scorePerFood: 1, //just picking up cards shouldn't be worth much
    ramRewardMultiplier: 25, //should be high, so that its worth cutting off segments
    scoreLengthMultiplier: 0.5, //should be significantly less than ramRewardMultiplier
    foodExpirationTime: 10000, // Food disappears after 10 seconds
    initialSnakeLength: 2, // Initial number of snake segments
    arrowSpeed: 5, // Speed of the arrow moving across the screen
    arrowWidth: 40, // Width of the arrow
    arrowHeight: 20, // Height of the arrow
    maxMultiplierExponent: 10 // Maximum value for the multiplier exponent
}; 