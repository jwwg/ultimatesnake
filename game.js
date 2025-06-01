class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // Fixed cell size
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.gridSize),
            y: Math.floor(this.canvas.height / this.gridSize)
        };
        this.snake = [{x: Math.floor(this.tileCount.x / 2), y: Math.floor(this.tileCount.y / 2)}];
        this.food = this.generateFood();
        this.direction = {x: 0, y: 0};
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameLoop = null;
        this.speed = 150;
        this.isGameOver = false;
        this.isWaiting = true;

        this.setupEventListeners();
        this.updateHighScore();
        this.draw(); // Draw initial state
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const oldTileCount = { ...this.tileCount };
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.gridSize),
            y: Math.floor(this.canvas.height / this.gridSize)
        };
        
        // Scale snake and food positions to new grid
        const scaleX = this.tileCount.x / oldTileCount.x;
        const scaleY = this.tileCount.y / oldTileCount.y;
        
        this.snake = this.snake.map(segment => ({
            x: Math.floor(segment.x * scaleX),
            y: Math.floor(segment.y * scaleY)
        }));
        
        this.food = {
            x: Math.floor(this.food.x * scaleX),
            y: Math.floor(this.food.y * scaleY)
        };
        
        this.draw();
    }

    handleKeyPress(event) {
        if (this.isWaiting) {
            this.startGame();
            return;
        }

        const key = event.key;
        const newDirection = {x: 0, y: 0};

        switch(key) {
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

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    update() {
        if (this.isGameOver || this.isWaiting) return;

        const head = {
            x: (this.snake[0].x + this.direction.x + this.tileCount.x) % this.tileCount.x,
            y: (this.snake[0].y + this.direction.y + this.tileCount.y) % this.tileCount.y
        };

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            // Adjust speed more gradually
            this.speed = Math.max(50, this.speed - 2);
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            }
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        if (this.isGameOver) return; // Don't draw if game is over

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach((segment, index) => {
            if (index === 0) this.ctx.fillStyle = '#45a049';
            else this.ctx.fillStyle = '#4CAF50';
            
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
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

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
        }
    }

    updateHighScore() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);
        this.draw(); // Draw the game state first
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    startGame() {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.snake = [{x: Math.floor(this.tileCount.x / 2), y: Math.floor(this.tileCount.y / 2)}];
        this.direction = {x: 1, y: 0}; // Start moving right
        this.score = 0;
        this.speed = 150;
        this.isGameOver = false;
        this.isWaiting = false;
        this.food = this.generateFood();
        this.updateScore();
        
        this.startCountdown();
    }

    startCountdown() {
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
                this.gameLoop = setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            }
        }, 1000);
    }
}

// Initialize the game
const game = new SnakeGame(); 