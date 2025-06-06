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
    private scoreElement: HTMLElement;
    private highScoreElement: HTMLElement;
    private multiplierElement: HTMLElement;
    private cardsRemainingElement: HTMLElement;
    private readonly LOW_CARDS_WARNING_THRESHOLD = 5;

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
            arrowWidth: this.config.arrowWidth,
            arrowHeight: this.config.arrowHeight,
            gridSize: this.config.gridSize
        });
        this.gameState = new GameState();
        this.pokerHandEvaluator = new PokerHandEvaluator();

        // Initialize score display elements
        this.scoreElement = document.getElementById('score')!;
        this.highScoreElement = document.getElementById('highScore')!;
        this.multiplierElement = document.getElementById('multiplier')!;
        this.cardsRemainingElement = document.getElementById('cardsRemaining')!;

        this.setupEventListeners();
        this.updateScoreDisplay();
        this.updateCardsRemainingDisplay();
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

    private updateScoreDisplay(): void {
        this.scoreElement.textContent = this.gameState.getScore().toString();
        this.highScoreElement.textContent = this.gameState.getHighScore().toString();
        this.multiplierElement.textContent = `${this.gameState.getMultiplier(this.snakeManager.getSnake().length)}x`;
    }

    private updateCardsRemainingDisplay(): void {
        const remainingCards = this.foodManager.getRemainingCards();
        this.cardsRemainingElement.textContent = `Cards: ${remainingCards}`;
        
        // Add warning class if cards are low
        if (remainingCards <= this.LOW_CARDS_WARNING_THRESHOLD) {
            this.cardsRemainingElement.classList.add('warning');
        } else {
            this.cardsRemainingElement.classList.remove('warning');
        }
    }

    private update(): void {
        if (this.gameState.isGameOverState() || this.gameState.isWaitingState() || this.gameState.isPausedState()) return;

        // Update cards remaining display
        this.updateCardsRemainingDisplay();

        // Check if deck is empty
        if (this.foodManager.getIsDeckEmpty()) {
            this.gameOver('deck');
            return;
        }

        // Update arrows
        this.arrowManager.update();

        // Check for arrow collision with snake head
        const snakeHead = this.snakeManager.getSnake()[0];
        const hitArrow = this.arrowManager.checkCollision(snakeHead);
        if (hitArrow) {
            this.gameState.addExplosionAnimation(hitArrow.x + hitArrow.width / 2, hitArrow.y + hitArrow.height / 2);
            this.gameState.increaseMultiplierExponent(this.config.maxMultiplierExponent);
            this.updateScoreDisplay();
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
            this.updateScoreDisplay();

            // Add card to hand if there's space
            this.gameState.addCardToHand({
                suit: food.suit,
                rank: food.rank
            });

            // Check if hand is full and evaluate poker hand
            if (this.gameState.getHand().cards.length === this.gameState.getHand().maxSize) {
                const pokerScore = this.pokerHandEvaluator.evaluatePokerHand(this.gameState.getHand());
                const finalMultiplier = this.gameState.getMultiplier(this.snakeManager.getSnake().length);
                const finalScore = pokerScore.score * finalMultiplier;
                this.gameState.addScore(finalScore);
                this.updateScoreDisplay();
                
                // Store last hand score details
                this.gameState.setLastHandScore({
                    type: pokerScore.type,
                    baseScore: pokerScore.score,
                    lengthMultiplier: finalMultiplier,
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
                
                // Spawn arrows when a hand is completed
                this.arrowManager.spawnArrow();
                
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
            this.gameState.getExplosionAnimations(),
            this.gameState.getMultiplierExponent()
        );
        
        if (this.gameState.isPausedState()) this.renderer.drawPaused();
    }

    private gameOver(reason: 'collision' | 'deck' = 'collision'): void {
        this.gameState.setGameOver();
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.draw();
        this.renderer.drawGameOver(
            this.gameState.getScore(), 
            this.gameState.getHighestHandScore() || undefined,
            reason === 'deck' ? 'Game Over - Deck Empty!' : undefined
        );
    }

    private startGame(): void {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        this.snakeManager.reset(this.config.initialSnakeLength);
        this.gameState.reset(this.config.scoreLengthMultiplier);
        this.speed = this.config.initialSpeed;
        this.foodManager = new FoodManager(this.tileCount, {
            maxFoodItems: this.config.maxFoodItems,
            minFoodInterval: this.config.minFoodInterval,
            foodExpirationTime: this.config.foodExpirationTime
        });
        this.arrowManager.reset();
        this.updateScoreDisplay();
        this.updateCardsRemainingDisplay();
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