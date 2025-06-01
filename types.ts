export interface Position {
    x: number;
    y: number;
}

export interface Direction {
    x: number;
    y: number;
}

export interface SnakeSegment extends Position {
    type: 'head' | 'body';
    color?: string;
    age?: number;
    lastDirection?: Direction;
    convergence?: number;
}

export interface FoodItem extends Position {
    createdAt: number;
}

export interface GameConfig {
    gridSize: number;
    segmentScale: number;
    maxFoodItems: number;
    minFoodInterval: number;
    maxFoodInterval: number;
    initialSpeed: number;
    minSpeed: number;
    speedDecrease: number;
    scorePerFood: number;
} 