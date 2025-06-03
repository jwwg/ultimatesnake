export interface Position {
    x: number;
    y: number;
}

export interface Direction {
    x: number;
    y: number;
}

export type SegmentType = 'normal' | 'ram' | 'speedy' | 'head';

export interface SnakeSegment extends Position {
    type: SegmentType;
    age?: number;
    lastDirection?: Direction;
    convergence?: number;
}

export type FoodType = 'red' | 'blue' | 'orange';

export interface FoodItem extends Position {
    createdAt: number;
    type: FoodType;
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