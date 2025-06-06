import { Position, Direction, SnakeSegment, FoodItem, GameConfig, CardSuit, CardRank, SegmentType, Hand, Card, PokerHandType, PokerHandScore, PokerHandAnimation } from './types.js';
import { defaultConfig } from './config.js';
import { SnakeRenderer } from './SnakeRenderer.js';
import { PokerHandEvaluator } from './PokerHandEvaluator.js';
import { FoodManager } from './FoodManager.js';
import { SnakeManager } from './SnakeManager.js';
import { GameState } from './GameState.js';
import { ArrowManager } from './ArrowManager.js';

export class SnakeGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    readonly config: GameConfig;
    tileCount: { x: number; y: number };
    gameLoop: number | null;
    speed: number;
    renderer: SnakeRenderer;
    private snakeManager: SnakeManager;
    private foodManager: FoodManager;
    private gameState: GameState;
    private pokerHandEvaluator: PokerHandEvaluator;
    private arrowManager: ArrowManager;

    constructor(config: GameConfig = defaultConfig) {
        this.config = config;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.canvas.height = this.canvas.height + 150;
        this.ctx = this.canvas.getContext('2d')!;
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor((this.canvas.height - 150) / this.config.gridSize)
        };
        
        this.speed = this.config.initialSpeed;
        this.gameLoop = null;
        this.renderer = new SnakeRenderer(this.canvas, this.ctx, this.config);
        
        this.snakeManager = new SnakeManager(this.tileCount, this.config.initialSnakeLength);
        this.foodManager = new FoodManager(this.tileCount, {
            maxFoodItems: this.config.maxFoodItems,
            minFoodInterval: this.config.minFoodInterval,
            foodExpirationTime: this.config.foodExpirationTime
        });
        this.arrowManager = new ArrowManager(this.tileCount, {
            arrowSpeed: this.config.arrowSpeed,
            arrowSpawnInterval: this.config.arrowSpawnInterval,
            arrowWidth: this.config.arrowWidth,
            arrowHeight: this.config.arrowHeight,
            gridSize: this.config.gridSize
        });
        this.gameState = new GameState();
        this.pokerHandEvaluator = new PokerHandEvaluator();

        this.setupEventListeners();
        this.draw();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startButton')?.addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton')?.addEventListener('click', () => this.togglePause());
        window.addEventListener('resize', () => this.handleResize());
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (this.gameState.isWaitingState()) {
            this.startGame();
            return;
        }

        if (event.key === 'p' || event.key === 'P') {
            this.togglePause();
            return;
        }

        if (this.gameState.isPausedState()) return;

        const newDirection: Direction = { x: 0, y: 0 };

        switch(event.key) {
            case 'ArrowUp':
                if (this.snakeManager.getDirection().y !== 1) newDirection.y = -1;
                break;
            case 'ArrowDown':
                if (this.snakeManager.getDirection().y !== -1) newDirection.y = 1;
                break;
            case 'ArrowLeft':
                if (this.snakeManager.getDirection().x !== 1) newDirection.x = -1;
                break;
            case 'ArrowRight':
                if (this.snakeManager.getDirection().x !== -1) newDirection.x = 1;
                break;
        }

        if (newDirection.x !== 0 || newDirection.y !== 0) {
            this.snakeManager.setDirection(newDirection);
        }
    }

    private update(): void {
        if (this.gameState.isGameOverState() || this.gameState.isWaitingState() || this.gameState.isPausedState()) return;

        // Update arrows
        this.arrowManager.update();

        // Check for arrow collision with snake head
        const snakeHead = this.snakeManager.getSnake()[0];
        const hitArrow = this.arrowManager.checkCollision(snakeHead);
        if (hitArrow) {
            this.gameState.addExplosionAnimation(hitArrow.x + hitArrow.width / 2, hitArrow.y + hitArrow.height / 2);
            this.gameState.increaseMultiplierExponent(this.config.maxMultiplierExponent);
        }

        // Update food
        this.foodManager.update(this.snakeManager.getSnakePositions());

        // Update animations
        this.gameState.updatePokerHandAnimations();
        this.gameState.updateExplosionAnimations();

        // Move snake and check for collision
        const { newHead, collision } = this.snakeManager.move();
        if (collision) {
            this.gameOver();
            return;
        }

        // Check for food collision
        const food = this.foodManager.getFoods().find(f => f.x === newHead.x && f.y === newHead.y);
        if (food) {
            // Calculate score based on snake length and card rank
            const rankValue = this.config.scorePerFood;
            const lengthBonus = Math.floor(this.snakeManager.getSnake().length * this.config.scoreLengthMultiplier);
            this.gameState.addScore(rankValue + lengthBonus);

            // Add card to hand if there's space
            this.gameState.addCardToHand({
                suit: food.suit,
                rank: food.rank
            });

            // Check if hand is full and evaluate poker hand
            if (this.gameState.getHand().cards.length === this.gameState.getHand().maxSize) {
                const pokerScore = this.pokerHandEvaluator.evaluatePokerHand(this.gameState.getHand());
                const lengthMultiplier = Math.floor(this.snakeManager.getSnake().length * this.config.scoreLengthMultiplier);
                const multiplierExponent = this.gameState.getMultiplierExponent();
                const finalScore = pokerScore.score * Math.pow(lengthMultiplier, multiplierExponent);
                this.gameState.addScore(finalScore);
                
                // Store last hand score details
                this.gameState.setLastHandScore({
                    type: pokerScore.type,
                    baseScore: pokerScore.score,
                    lengthMultiplier,
                    finalScore
                });
                
                // Create animation at the last card's position
                this.gameState.addPokerHandAnimation({
                    type: pokerScore.type,
                    score: finalScore,
                    x: food.x,
                    y: food.y,
                    startTime: Date.now()
                });
                
                // Clear the hand after scoring
                this.gameState.clearHand();
            }
            
            // Grow snake
            this.snakeManager.grow();
            
            // Remove food
            this.foodManager.removeFoodAt(food);
            
            // Increase speed
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

    private draw(): void {
        if (this.gameState.isGameOverState()) return;
        
        const hand = this.gameState.getHand();
        const lastHandScore = this.gameState.getLastHandScore();
        const highestHandScore = this.gameState.getHighestHandScore();
        
        const handWithScore: Hand & { 
            lastHandScore?: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number };
            highestHandScore?: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; setAt: number };
        } = {
            ...hand,
            lastHandScore: lastHandScore || undefined,
            highestHandScore: highestHandScore || undefined
        };
        
        this.renderer.draw(
            this.snakeManager.getSnake(),
            this.foodManager.getFoods(),
            this.gameState.isGameOverState(),
            handWithScore,
            this.gameState.getPokerHandAnimations(),
            this.arrowManager.getArrows(),
            this.gameState.getExplosionAnimations()
        );
        
        if (this.gameState.isPausedState()) this.renderer.drawPaused();
    }

    private gameOver(): void {
        this.gameState.setGameOver();
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.arrowManager.stopSpawning();
        
        this.draw();
        this.renderer.drawGameOver(this.gameState.getScore(), this.gameState.getHighestHandScore() || undefined);
    }

    private startGame(): void {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.snakeManager.reset(this.config.initialSnakeLength);
        this.gameState.reset();
        this.speed = this.config.initialSpeed;
        this.foodManager = new FoodManager(this.tileCount, {
            maxFoodItems: this.config.maxFoodItems,
            minFoodInterval: this.config.minFoodInterval,
            foodExpirationTime: this.config.foodExpirationTime
        });
        this.arrowManager.reset();
        
        this.startCountdown();
    }

    private startCountdown(): void {
        let count = 2;
        const countdownInterval = setInterval(() => {
            this.renderer.drawCountdown(count);
            
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                this.gameState.setWaiting(false);
                this.arrowManager.startSpawning();
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
            y: Math.floor((this.canvas.height - 150) / this.config.gridSize)
        };
        
        const scaleX = this.tileCount.x / oldTileCount.x;
        const scaleY = this.tileCount.y / oldTileCount.y;
        
        this.snakeManager = new SnakeManager(this.tileCount, this.config.initialSnakeLength);
        this.foodManager = new FoodManager(this.tileCount, {
            maxFoodItems: this.config.maxFoodItems,
            minFoodInterval: this.config.minFoodInterval,
            foodExpirationTime: this.config.foodExpirationTime
        });
        
        this.draw();
    }

    private togglePause(): void {
        if (this.gameState.isGameOverState() || this.gameState.isWaitingState()) return;
        
        this.gameState.togglePause();
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) pauseButton.textContent = this.gameState.isPausedState() ? 'Resume' : 'Pause';
        
        if (this.gameState.isPausedState()) {
            if (this.gameLoop) clearInterval(this.gameLoop);
            this.gameLoop = null;
        } else {
            this.gameLoop = window.setInterval(() => {
                this.update();
                this.draw();
            }, this.speed);
        }
        
        this.draw();
    }
} 