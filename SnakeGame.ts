import { Position, Direction, SnakeSegment, FoodItem, GameConfig, FoodType } from './types.js';
import { defaultConfig } from './config.js';

export class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private readonly config: GameConfig;
    private tileCount: { x: number; y: number };
    private snake: SnakeSegment[];
    private foods: FoodItem[];
    private direction: Direction;
    private score: number;
    private highScore: number;
    private gameLoop: number | null;
    private speed: number;
    private isGameOver: boolean;
    private isWaiting: boolean;
    private lastFoodGeneration: number;

    constructor(config: GameConfig = defaultConfig) {
        this.config = config;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor(this.canvas.height / this.config.gridSize)
        };
        
        this.snake = [this.createInitialSnakeHead()];
        this.foods = [this.generateFood()];
        this.lastFoodGeneration = Date.now();
        this.direction = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
        this.gameLoop = null;
        this.speed = this.config.initialSpeed;
        this.isGameOver = false;
        this.isWaiting = true;

        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
    }

    private createInitialSnakeHead(): SnakeSegment {
        return {
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head',
            color: '#45a049',
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

        const head: SnakeSegment = {
            x: (this.snake[0].x + this.direction.x + this.tileCount.x) % this.tileCount.x,
            y: (this.snake[0].y + this.direction.y + this.tileCount.y) % this.tileCount.y,
            type: 'head',
            color: '#45a049',
            age: 0,
            lastDirection: { ...this.direction },
            convergence: newConvergence
        };

        this.snake.forEach(segment => {
            segment.type = 'body';
            segment.color = '#4CAF50';
            if (segment.age !== undefined) segment.age++;
        });

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        const foodIndex = this.foods.findIndex(food => head.x === food.x && head.y === food.y);
        if (foodIndex !== -1) {
            this.score += this.config.scorePerFood;
            this.updateScore();
            this.foods.splice(foodIndex, 1);
            this.speed = Math.max(this.config.minSpeed, this.speed - this.config.speedDecrease);
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = window.setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            }
        } else {
            this.snake.pop();
        }
    }

    private checkCollision(head: Position): boolean {
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    private draw(): void {
        if (this.isGameOver) return;

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawSnake();
        this.drawFood();
    }

    private drawSnake(): void {
        this.snake.forEach(segment => {
            const x = segment.x * this.config.gridSize;
            const y = segment.y * this.config.gridSize;
            const size = this.config.gridSize - 2;
            
            if (segment.type === 'head') {
                this.drawSnakeHead(segment, x, y, size);
            } else {
                this.drawSnakeBody(segment, x, y, size);
            }
            
            if (segment.lastDirection) {
                this.drawDirectionLines(segment, x, y, size);
            }
        });
    }

    private drawSnakeHead(segment: SnakeSegment, x: number, y: number, size: number): void {
        this.ctx.strokeStyle = segment.color || '#45a049';
        this.ctx.lineWidth = 2;
        const arrowLength = size * this.config.segmentScale;
        const arrowWidth = size * this.config.segmentScale;
        const centerX = x + size/2;
        const centerY = y + size/2;
        
        this.ctx.beginPath();
        if (segment.lastDirection?.x === 1) {
            this.drawRightArrow(x, centerY, arrowLength, arrowWidth);
        } else if (segment.lastDirection?.x === -1) {
            this.drawLeftArrow(x, centerY, arrowLength, arrowWidth, size);
        } else if (segment.lastDirection?.y === 1) {
            this.drawDownArrow(centerX, y, arrowLength, arrowWidth);
        } else if (segment.lastDirection?.y === -1) {
            this.drawUpArrow(centerX, y, arrowLength, arrowWidth, size);
        }
        this.ctx.stroke();
    }

    private drawSnakeBody(segment: SnakeSegment, x: number, y: number, size: number): void {
        this.ctx.strokeStyle = segment.color || '#4CAF50';
        this.ctx.lineWidth = 1;
        const segmentLength = size * this.config.segmentScale;
        const segmentWidth = size * this.config.segmentScale;
        const centerX = x + size/2;
        const centerY = y + size/2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - segmentLength/2, centerY - segmentWidth/2);
        this.ctx.lineTo(centerX + segmentLength/2, centerY - segmentWidth/2);
        this.ctx.lineTo(centerX + segmentLength/2, centerY + segmentWidth/2);
        this.ctx.lineTo(centerX - segmentLength/2, centerY + segmentWidth/2);
        this.ctx.lineTo(centerX - segmentLength/2, centerY - segmentWidth/2);
        this.ctx.stroke();
    }

    private drawDirectionLines(segment: SnakeSegment, x: number, y: number, size: number): void {
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 1;
        const convergence = segment.convergence || 3;
        
        if (segment.lastDirection?.x === 1 || segment.lastDirection?.x === -1) {
            this.drawHorizontalDirectionLines(x, y, size, convergence, segment.lastDirection.x);
        } else if (segment.lastDirection?.y === 1 || segment.lastDirection?.y === -1) {
            this.drawVerticalDirectionLines(x, y, size, convergence, segment.lastDirection.y);
        }
    }

    private drawHorizontalDirectionLines(x: number, y: number, size: number, convergence: number, direction: number): void {
        const offsetLeft = direction === 1 ? 0 : convergence;
        const offsetRight = direction === 1 ? convergence : 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + offsetLeft);
        this.ctx.lineTo(x + size, y + offsetRight);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size - offsetLeft);
        this.ctx.lineTo(x + size, y + size - offsetRight);
        this.ctx.stroke();
    }

    private drawVerticalDirectionLines(x: number, y: number, size: number, convergence: number, direction: number): void {
        const offsetTop = direction === 1 ? 0 : convergence;
        const offsetBottom = direction === 1 ? convergence : 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + offsetTop, y);
        this.ctx.lineTo(x + offsetBottom, y + size);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + size - offsetTop, y);
        this.ctx.lineTo(x + size - offsetBottom, y + size);
        this.ctx.stroke();
    }

    private drawRightArrow(x: number, centerY: number, arrowLength: number, arrowWidth: number): void {
        this.ctx.moveTo(x, centerY - arrowWidth/2);
        this.ctx.lineTo(x + arrowLength, centerY - arrowWidth/2);
        this.ctx.lineTo(x + arrowLength, centerY + arrowWidth/2);
        this.ctx.lineTo(x, centerY + arrowWidth/2);
        this.ctx.lineTo(x, centerY - arrowWidth/2);
    }

    private drawLeftArrow(x: number, centerY: number, arrowLength: number, arrowWidth: number, size: number): void {
        this.ctx.moveTo(x + size, centerY - arrowWidth/2);
        this.ctx.lineTo(x + size - arrowLength, centerY - arrowWidth/2);
        this.ctx.lineTo(x + size - arrowLength, centerY + arrowWidth/2);
        this.ctx.lineTo(x + size, centerY + arrowWidth/2);
        this.ctx.lineTo(x + size, centerY - arrowWidth/2);
    }

    private drawDownArrow(centerX: number, y: number, arrowLength: number, arrowWidth: number): void {
        this.ctx.moveTo(centerX - arrowWidth/2, y);
        this.ctx.lineTo(centerX - arrowWidth/2, y + arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y);
        this.ctx.lineTo(centerX - arrowWidth/2, y);
    }

    private drawUpArrow(centerX: number, y: number, arrowLength: number, arrowWidth: number, size: number): void {
        this.ctx.moveTo(centerX - arrowWidth/2, y + size);
        this.ctx.lineTo(centerX - arrowWidth/2, y + size - arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + size - arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + size);
        this.ctx.lineTo(centerX - arrowWidth/2, y + size);
    }

    private drawFood(): void {
        this.foods.forEach(food => {
            const colors = {
                red: '#ff0000',
                blue: '#0000ff',
                orange: '#ffa500'
            };
            this.ctx.fillStyle = colors[food.type];
            this.ctx.fillRect(
                food.x * this.config.gridSize,
                food.y * this.config.gridSize,
                this.config.gridSize - 2,
                this.config.gridSize - 2
            );
        });
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
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    private startGame(): void {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.snake = [this.createInitialSnakeHead()];
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
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(count.toString(), this.canvas.width / 2, this.canvas.height / 2);
            
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