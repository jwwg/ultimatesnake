interface Position {
    x: number;
    y: number;
}

interface Direction {
    x: number;
    y: number;
}

interface SnakeSegment extends Position {
    type: 'head' | 'body';
    color?: string;
    // Add any additional properties you want for each segment
    age?: number;
    lastDirection?: Direction;
}

class SnakeGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private readonly gridSize: number = 20;
    private tileCount: { x: number; y: number };
    private snake: SnakeSegment[];
    private food: Position;
    private direction: Direction;
    private score: number;
    private highScore: number;
    private gameLoop: number | null;
    private speed: number;
    private isGameOver: boolean;
    private isWaiting: boolean;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.gridSize),
            y: Math.floor(this.canvas.height / this.gridSize)
        };
        
        // Initialize snake with typed segments
        this.snake = [{
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head',
            color: '#45a049',
            age: 0,
            lastDirection: { x: 0, y: 0 }
        }];
        
        this.food = this.generateFood();
        this.direction = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
        this.gameLoop = null;
        this.speed = 150;
        this.isGameOver = false;
        this.isWaiting = true;

        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
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

    private generateFood(): Position {
        let food: Position;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    private update(): void {
        if (this.isGameOver || this.isWaiting) return;

        const head: SnakeSegment = {
            x: (this.snake[0].x + this.direction.x + this.tileCount.x) % this.tileCount.x,
            y: (this.snake[0].y + this.direction.y + this.tileCount.y) % this.tileCount.y,
            type: 'head',
            color: '#45a049',
            age: 0,
            lastDirection: { ...this.direction }
        };

        // Update existing segments
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

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            this.speed = Math.max(50, this.speed - 2);
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

        // Draw snake
        this.snake.forEach(segment => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 2;
            
            // Draw segment
            this.ctx.fillStyle = segment.color || '#4CAF50';
            this.ctx.fillRect(x, y, size, size);
            
            // Draw direction arrow if lastDirection exists
            if (segment.lastDirection) {
                this.ctx.fillStyle = '#ffffff';
                const centerX = x + size/2;
                const centerY = y + size/2;
                const arrowSize = size/3;
                
                this.ctx.beginPath();
                if (segment.lastDirection.x === 1) {
                    this.ctx.moveTo(centerX + arrowSize/2, centerY);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
                } else if (segment.lastDirection.x === -1) {
                    this.ctx.moveTo(centerX - arrowSize/2, centerY);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
                } else if (segment.lastDirection.y === 1) {
                    this.ctx.moveTo(centerX, centerY + arrowSize/2);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY - arrowSize/2);
                } else if (segment.lastDirection.y === -1) {
                    this.ctx.moveTo(centerX, centerY - arrowSize/2);
                    this.ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
                    this.ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
                }
                this.ctx.closePath();
                this.ctx.fill();
            }
        });

        // Draw food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
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
        
        this.snake = [{
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head',
            color: '#45a049',
            age: 0,
            lastDirection: { x: 0, y: 0 }
        }];
        
        this.direction = { x: 1, y: 0 };
        this.score = 0;
        this.speed = 150;
        this.isGameOver = false;
        this.isWaiting = false;
        this.food = this.generateFood();
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
            x: Math.floor(this.canvas.width / this.gridSize),
            y: Math.floor(this.canvas.height / this.gridSize)
        };
        
        const scaleX = this.tileCount.x / oldTileCount.x;
        const scaleY = this.tileCount.y / oldTileCount.y;
        
        this.snake = this.snake.map(segment => ({
            ...segment,
            x: Math.floor(segment.x * scaleX),
            y: Math.floor(segment.y * scaleY)
        }));
        
        this.food = {
            x: Math.floor(this.food.x * scaleX),
            y: Math.floor(this.food.y * scaleY)
        };
        
        this.draw();
    }
}

// Initialize the game
const game = new SnakeGame(); 