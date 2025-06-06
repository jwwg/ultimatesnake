import { FoodItem, CardSuit, CardRank, Position } from './types.js';

export class FoodManager {
    private foods: FoodItem[] = [];
    private lastFoodGeneration: number = Date.now();
    private readonly tileCount: { x: number; y: number };
    private readonly config: {
        maxFoodItems: number;
        minFoodInterval: number;
        foodExpirationTime: number;
    };

    constructor(tileCount: { x: number; y: number }, config: {
        maxFoodItems: number;
        minFoodInterval: number;
        foodExpirationTime: number;
    }) {
        this.tileCount = tileCount;
        this.config = config;
        // Generate initial food
        this.foods = [this.generateFood([])];
    }

    generateFood(snakePositions: Position[]): FoodItem {
        let food: FoodItem;
        const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y),
                createdAt: Date.now(),
                suit: suits[Math.floor(Math.random() * suits.length)],
                rank: ranks[Math.floor(Math.random() * ranks.length)]
            };
        } while (this.isPositionOccupied(food, snakePositions));
        
        return food;
    }

    private isPositionOccupied(position: Position, snakePositions: Position[]): boolean {
        return snakePositions.some(pos => pos.x === position.x && pos.y === position.y) ||
               this.foods.some(food => food.x === position.x && food.y === position.y);
    }

    update(snakePositions: Position[]): void {
        const currentTime = Date.now();
        
        // Remove expired food
        this.foods = this.foods.filter(food => 
            currentTime - food.createdAt < this.config.foodExpirationTime
        );

        // Ensure there's at least one food item
        if (this.foods.length === 0) {
            this.foods.push(this.generateFood(snakePositions));
            this.lastFoodGeneration = currentTime;
            return;
        }

        // Generate new food if conditions are met
        if (this.foods.length < this.config.maxFoodItems && 
            currentTime - this.lastFoodGeneration > this.config.minFoodInterval &&
            Math.random() < 0.1) {
            this.foods.push(this.generateFood(snakePositions));
            this.lastFoodGeneration = currentTime;
        }
    }

    getFoods(): FoodItem[] {
        return this.foods;
    }

    removeFoodAt(position: Position): void {
        const index = this.foods.findIndex(food => food.x === position.x && food.y === position.y);
        if (index !== -1) {
            this.foods.splice(index, 1);
        }
    }

    isFoodExpiring(food: FoodItem): boolean {
        const currentTime = Date.now();
        const timeLeft = this.config.foodExpirationTime - (currentTime - food.createdAt);
        return timeLeft < 2000; // Show warning in last 2 seconds
    }
} 