import { Position, Direction, SnakeSegment, FoodItem, GameConfig, FoodType, SegmentType } from './types.js';
import { defaultConfig } from './config.js';
import { SnakeRenderer } from './SnakeRenderer.js';

export class SnakeGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    readonly config: GameConfig;
    tileCount: { x: number; y: number };
    snake: SnakeSegment[];
    foods: FoodItem[];
    direction: Direction;
    score: number;
    highScore: number;
    gameLoop: number | null;
    speed: number;
    isGameOver: boolean;
    isWaiting: boolean;
    lastFoodGeneration: number;
    renderer: SnakeRenderer;

    constructor(config: GameConfig = defaultConfig) {
        this.config = config;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor(this.canvas.height / this.config.gridSize)
        };
        
        // Initialize snake with 10 segments
        const head = this.createInitialSnakeHead();
        this.snake = [head];
        for (let i = 1; i < 10; i++) {
            this.snake.push({
                x: head.x - i,
                y: head.y,
                type: 'normal',
                age: i,
                lastDirection: { x: 1, y: 0 },
                convergence: 3
            });
        }
        
        this.foods = [this.generateFood()];
        this.lastFoodGeneration = Date.now();
        this.direction = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
        this.gameLoop = null;
        this.speed = this.config.initialSpeed;
        this.isGameOver = false;
        this.isWaiting = true;
        this.renderer = new SnakeRenderer(this.canvas, this.ctx, this.config);

        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
    }

    private createInitialSnakeHead(): SnakeSegment {
        return {
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head',
            age: 0,
            lastDirection: { x: 0, y: 0 },
            convergence: 3
        };
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startButton')?.addEventListener('click', () => this.startGame());
        window.addEventListener('resize', () => this.handleResize());
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (this.isWaiting) {
            this.startGame();
            return;
        }

        const newDirection: Direction = { x: 0, y: 0 };

        switch(event.key) {
            case 'ArrowUp':
                if (this.direction.y !== 1) newDirection.y = -1;
                break;
            case 'ArrowDown':
                if (this.direction.y !== -1) newDirection.y = 1;
                break;
            case 'ArrowLeft':
                if (this.direction.x !== 1) newDirection.x = -1;
                break;
            case 'ArrowRight':
                if (this.direction.x !== -1) newDirection.x = 1;
                break;
        }

        if (newDirection.x !== 0 || newDirection.y !== 0) {
            this.direction = newDirection;
        }
    }

    private generateFood(): FoodItem {
        let food: FoodItem;
        const foodTypes: FoodType[] = ['red', 'blue', 'orange'];
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y),
                createdAt: Date.now(),
                type: foodTypes[Math.floor(Math.random() * foodTypes.length)]
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
                 (this.foods || []).some(f => f.x === food.x && f.y === food.y));
        return food;
    }

    private update(): void {
        if (this.isGameOver || this.isWaiting) return;

        const currentTime = Date.now();
        if (this.foods.length < this.config.maxFoodItems && 
            currentTime - this.lastFoodGeneration > this.config.minFoodInterval &&
            Math.random() < 0.1) {
            this.foods.push(this.generateFood());
            this.lastFoodGeneration = currentTime;
        }

        const lastConvergence = this.snake[0].convergence || 3;
        const convergenceChange = Math.random() < 0.5 ? -1 : 1;
        const newConvergence = Math.max(1, Math.min(5, lastConvergence + convergenceChange));

        // Calculate new head position
        const newHeadX = (this.snake[0].x + this.direction.x + this.tileCount.x) % this.tileCount.x;
        const newHeadY = (this.snake[0].y + this.direction.y + this.tileCount.y) % this.tileCount.y;

        // Check for collision before moving
        if (this.checkCollision({ x: newHeadX, y: newHeadY })) {
            this.gameOver();
            return;
        }

        // Update positions in reverse order
        for (let i = this.snake.length - 1; i > 0; i--) {
            const currentSegment = this.snake[i];
            const previousSegment = this.snake[i - 1];
            if (currentSegment && previousSegment) {
                currentSegment.x = previousSegment.x;
                currentSegment.y = previousSegment.y;
                if (previousSegment.lastDirection) {
                    currentSegment.lastDirection = { 
                        x: previousSegment.lastDirection.x,
                        y: previousSegment.lastDirection.y
                    };
                }
                if (currentSegment.age !== undefined) currentSegment.age++;
            }
        }

        // Update head position and properties
        this.snake[0].x = newHeadX;
        this.snake[0].y = newHeadY;
        this.snake[0].lastDirection = { ...this.direction };
        this.snake[0].convergence = newConvergence;

        const foodIndex = this.foods.findIndex(food => newHeadX === food.x && newHeadY === food.y);
        if (foodIndex !== -1) {
            this.score += this.config.scorePerFood;
            this.updateScore();
            const consumedFood = this.foods[foodIndex];
            
            // Shift all segment types one position back
            for (let i = this.snake.length - 1; i > 0; i--) {
                this.snake[i].type = this.snake[i - 1].type;
            }
            
            // Set new head type based on food type
            const newHeadType: SegmentType = consumedFood.type === 'blue' ? 'ram' : 
                                           consumedFood.type === 'orange' ? 'speedy' : 'normal';
            this.snake[0].type = newHeadType;
            
            // Add new segment at the end with the last segment's type
            const lastSegment = this.snake[this.snake.length - 1];
            this.snake.push({
                x: lastSegment.x,
                y: lastSegment.y,
                type: lastSegment.type,
                age: 0,
                lastDirection: lastSegment.lastDirection ? { ...lastSegment.lastDirection } : undefined,
                convergence: lastSegment.convergence
            });
            
            this.foods.splice(foodIndex, 1);
            this.speed = Math.max(this.config.minSpeed, this.speed - this.config.speedDecrease);
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = window.setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            }
        }
    }

    private checkCollision(head: Position): boolean {
        const collisionIndex = this.snake.findIndex(segment => segment.x === head.x && segment.y === head.y);
        if (collisionIndex === -1) return false;

        // If the head is a ram type, destroy segments after collision point
        if (this.snake[0].type === 'ram') {
            const segmentsCutOff = this.snake.length - collisionIndex;
            // Add destruction animations for each cut-off segment
            for (let i = collisionIndex; i < this.snake.length; i++) {
                this.renderer.addDestructionAnimation(this.snake[i]);
            }
            this.snake = this.snake.slice(0, collisionIndex);
            // Reward scales with segments cut off, with a bonus for cutting off more segments
            const reward = Math.floor(segmentsCutOff * 2.5);
            this.score += reward;
            this.updateScore();
            return false;
        }

        return true;
    }

    private draw(): void {
        if (this.isGameOver) return;
        this.renderer.draw(this.snake, this.foods, this.isGameOver);
    }

    private updateScore(): void {
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = this.score.toString();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
            this.updateHighScore();
        }
    }

    private updateHighScore(): void {
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) highScoreElement.textContent = this.highScore.toString();
    }

    private gameOver(): void {
        this.isGameOver = true;
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.draw();
        this.renderer.drawGameOver(this.score);
    }

    private startGame(): void {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        // Initialize snake with 10 segments
        const head = this.createInitialSnakeHead();
        this.snake = [head];
        for (let i = 1; i < 10; i++) {
            this.snake.push({
                x: head.x - i,
                y: head.y,
                type: 'normal',
                age: i,
                lastDirection: { x: 1, y: 0 },
                convergence: 3
            });
        }
        this.direction = { x: 1, y: 0 };
        this.score = 0;
        this.speed = this.config.initialSpeed;
        this.isGameOver = false;
        this.isWaiting = false;
        this.foods = [this.generateFood()];
        this.lastFoodGeneration = Date.now();
        this.updateScore();
        
        this.startCountdown();
    }

    private startCountdown(): void {
        let count = 2;
        const countdownInterval = setInterval(() => {
            this.renderer.drawCountdown(count);
            
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                this.gameLoop = window.setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            }
        }, 1000);
    }

    private handleResize(): void {
        const oldTileCount = { ...this.tileCount };
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor(this.canvas.height / this.config.gridSize)
        };
        
        const scaleX = this.tileCount.x / oldTileCount.x;
        const scaleY = this.tileCount.y / oldTileCount.y;
        
        this.snake = this.snake.map(segment => ({
            ...segment,
            x: Math.floor(segment.x * scaleX),
            y: Math.floor(segment.y * scaleY)
        }));
        
        this.foods = this.foods.map(food => ({
            ...food,
            x: Math.floor(food.x * scaleX),
            y: Math.floor(food.y * scaleY)
        }));
        
        this.draw();
    }
} 