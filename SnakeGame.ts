import { Position, Direction, SnakeSegment, FoodItem, GameConfig, CardSuit, CardRank, SegmentType, Hand, Card, PokerHandType, PokerHandScore, PokerHandAnimation } from './types.js';
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
    isPaused: boolean;
    lastFoodGeneration: number;
    renderer: SnakeRenderer;
    hand: Hand;
    private pokerHandAnimations: PokerHandAnimation[] = [];
    private lastHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number } | null = null;
    private highestHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; setAt: number } | null = null;

    private readonly pokerHandScores: Record<PokerHandType, number> = {
        royal_flush: 1000,
        straight_flush: 800,
        four_of_a_kind: 700,
        full_house: 600,
        flush: 500,
        straight: 400,
        three_of_a_kind: 300,
        two_pair: 200,
        pair: 100,
        high_card: 50
    };

    constructor(config: GameConfig = defaultConfig) {
        this.config = config;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        // Add extra height for the hand display
        this.canvas.height = this.canvas.height + 150; // Add 150px for hand display
        this.ctx = this.canvas.getContext('2d')!;
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor((this.canvas.height - 150) / this.config.gridSize) // Adjust y count to exclude hand area
        };
        
        // Initialize snake with configured number of segments
        const head = this.createInitialSnakeHead();
        this.snake = [head];
        for (let i = 1; i < this.config.initialSnakeLength; i++) {
            const segment: SnakeSegment = {
                x: head.x - i,
                y: head.y,
                type: 'normal' as SegmentType,
                age: i,
                lastDirection: { x: 1, y: 0 },
                convergence: 3,
                nextSegment: undefined
            };
            this.snake[i-1].nextSegment = segment;
            this.snake.push(segment);
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
        this.isPaused = false;
        this.renderer = new SnakeRenderer(this.canvas, this.ctx, this.config);
        this.hand = { cards: [], maxSize: 5 };

        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
    }

    private createInitialSnakeHead(): SnakeSegment {
        return {
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head' as SegmentType,
            age: 0,
            lastDirection: { x: 0, y: 0 },
            convergence: 3,
            nextSegment: undefined
        };
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startButton')?.addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton')?.addEventListener('click', () => this.togglePause());
        window.addEventListener('resize', () => this.handleResize());
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (this.isWaiting) {
            this.startGame();
            return;
        }

        if (event.key === 'p' || event.key === 'P') {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

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
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
                 (this.foods || []).some(f => f.x === food.x && f.y === food.y));
        return food;
    }

    private evaluatePokerHand(hand: Hand): PokerHandScore {
        const cards = [...hand.cards];
        const ranks = cards.map(card => this.getCardValue(card.rank));
        const suits = cards.map(card => card.suit);
        
        // Sort cards by rank
        cards.sort((a, b) => this.getCardValue(b.rank) - this.getCardValue(a.rank));
        ranks.sort((a, b) => b - a);

        // Check for flush
        const isFlush = suits.every(suit => suit === suits[0]);

        // Check for straight
        const isStraight = ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] - 1);

        // Check for royal flush
        if (isFlush && isStraight && ranks[0] === 14) {
            return { type: 'royal_flush', score: this.pokerHandScores.royal_flush, cards };
        }

        // Check for straight flush
        if (isFlush && isStraight) {
            return { type: 'straight_flush', score: this.pokerHandScores.straight_flush, cards };
        }

        // Count occurrences of each rank
        const rankCounts = new Map<number, number>();
        ranks.forEach(rank => rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1));
        const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

        // Check for four of a kind
        if (counts[0] === 4) {
            return { type: 'four_of_a_kind', score: this.pokerHandScores.four_of_a_kind, cards };
        }

        // Check for full house
        if (counts[0] === 3 && counts[1] === 2) {
            return { type: 'full_house', score: this.pokerHandScores.full_house, cards };
        }

        // Check for flush
        if (isFlush) {
            return { type: 'flush', score: this.pokerHandScores.flush, cards };
        }

        // Check for straight
        if (isStraight) {
            return { type: 'straight', score: this.pokerHandScores.straight, cards };
        }

        // Check for three of a kind
        if (counts[0] === 3) {
            return { type: 'three_of_a_kind', score: this.pokerHandScores.three_of_a_kind, cards };
        }

        // Check for two pair
        if (counts[0] === 2 && counts[1] === 2) {
            return { type: 'two_pair', score: this.pokerHandScores.two_pair, cards };
        }

        // Check for pair
        if (counts[0] === 2) {
            return { type: 'pair', score: this.pokerHandScores.pair, cards };
        }

        // High card
        return { type: 'high_card', score: this.pokerHandScores.high_card, cards };
    }

    private update(): void {
        if (this.isGameOver || this.isWaiting || this.isPaused) return;

        const currentTime = Date.now();
        
        // Remove expired food
        this.foods = this.foods.filter(food => 
            currentTime - food.createdAt < this.config.foodExpirationTime
        );

        if (this.foods.length < this.config.maxFoodItems && 
            currentTime - this.lastFoodGeneration > this.config.minFoodInterval &&
            Math.random() < 0.1) {
            this.foods.push(this.generateFood());
            this.lastFoodGeneration = currentTime;
        }

        // Remove expired animations
        this.pokerHandAnimations = this.pokerHandAnimations.filter(
            anim => currentTime - anim.startTime < 2000
        );

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
                currentSegment.nextSegment = i < this.snake.length - 1 ? this.snake[i + 1] : undefined;
            }
        }

        // Update head position and properties
        this.snake[0].x = newHeadX;
        this.snake[0].y = newHeadY;
        this.snake[0].lastDirection = { ...this.direction };
        this.snake[0].convergence = newConvergence;
        this.snake[0].nextSegment = this.snake[1];

        const foodIndex = this.foods.findIndex(food => newHeadX === food.x && newHeadY === food.y);
        if (foodIndex !== -1) {
            // Calculate score based on snake length and card rank
            const consumedFood = this.foods[foodIndex];
            const rankValue = this.config.scorePerFood;
            const lengthBonus = Math.floor(this.snake.length * this.config.scoreLengthMultiplier);
            this.score += rankValue + lengthBonus;
            this.updateScore();

            // Add card to hand if there's space
            if (this.hand.cards.length < this.hand.maxSize) {
                this.hand.cards.push({
                    suit: consumedFood.suit,
                    rank: consumedFood.rank
                });

                // Check if hand is full and evaluate poker hand
                if (this.hand.cards.length === this.hand.maxSize) {
                    const pokerScore = this.evaluatePokerHand(this.hand);
                    const lengthMultiplier = Math.floor(this.snake.length * this.config.scoreLengthMultiplier);
                    const finalScore = pokerScore.score * lengthMultiplier;
                    this.score += finalScore;
                    this.updateScore();
                    
                    // Store last hand score details
                    this.lastHandScore = {
                        type: pokerScore.type,
                        baseScore: pokerScore.score,
                        lengthMultiplier,
                        finalScore
                    };

                    // Update highest hand score if this one is higher
                    if (!this.highestHandScore || finalScore > this.highestHandScore.finalScore) {
                        this.highestHandScore = { 
                            ...this.lastHandScore,
                            setAt: Date.now()
                        };
                    }
                    
                    // Create animation at the last card's position
                    this.pokerHandAnimations.push({
                        type: pokerScore.type,
                        score: finalScore,
                        x: consumedFood.x,
                        y: consumedFood.y,
                        startTime: currentTime
                    });
                    
                    // Clear the hand after scoring
                    this.hand.cards = [];
                }
            }
            
            // Store the current head's type
            const currentHeadType = this.snake[0].type;
            
            // Set all segments to normal type
            for (let i = 0; i < this.snake.length; i++) {
                this.snake[i].type = 'normal' as SegmentType;
            }
            
            // Add new segment at the end
            const lastSegment = this.snake[this.snake.length - 1];
            const newSegment: SnakeSegment = {
                x: lastSegment.x,
                y: lastSegment.y,
                type: 'normal' as SegmentType,
                age: 0,
                lastDirection: lastSegment.lastDirection ? { ...lastSegment.lastDirection } : undefined,
                convergence: lastSegment.convergence,
                nextSegment: undefined
            };
            lastSegment.nextSegment = newSegment;
            this.snake.push(newSegment);

            // Set the head type
            this.snake[0].type = 'head' as SegmentType;
            
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

    private getCardValue(rank: CardRank): number {
        switch (rank) {
            case 'A': return 14;
            case 'K': return 13;
            case 'Q': return 12;
            case 'J': return 11;
            default: return parseInt(rank);
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
            const reward = Math.floor(segmentsCutOff * this.config.ramRewardMultiplier);
            this.score += reward;
            this.updateScore();
            return false;
        }

        return true;
    }

    private draw(): void {
        if (this.isGameOver) return;
        const handWithScore = { 
            ...this.hand, 
            lastHandScore: this.lastHandScore || undefined,
            highestHandScore: this.highestHandScore || undefined
        };
        this.renderer.draw(this.snake, this.foods, this.isGameOver, handWithScore, this.pokerHandAnimations);
        if (this.isPaused) this.renderer.drawPaused();
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
        this.renderer.drawGameOver(this.score, this.highestHandScore || undefined);
    }

    private startGame(): void {
        if (this.gameLoop) clearInterval(this.gameLoop);
        
        // Initialize snake with configured number of segments
        const head = this.createInitialSnakeHead();
        this.snake = [head];
        for (let i = 1; i < this.config.initialSnakeLength; i++) {
            const segment: SnakeSegment = {
                x: head.x - i,
                y: head.y,
                type: 'normal' as SegmentType,
                age: i,
                lastDirection: { x: 1, y: 0 },
                convergence: 3,
                nextSegment: undefined
            };
            this.snake[i-1].nextSegment = segment;
            this.snake.push(segment);
        }
        this.direction = { x: 1, y: 0 };
        this.score = 0;
        this.speed = this.config.initialSpeed;
        this.isGameOver = false;
        this.isWaiting = false;
        this.foods = [this.generateFood()];
        this.lastFoodGeneration = Date.now();
        this.hand = { cards: [], maxSize: 5 };
        this.lastHandScore = null;
        this.highestHandScore = null;
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
            y: Math.floor((this.canvas.height - 150) / this.config.gridSize) // Adjust y count to exclude hand area
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

    private isFoodExpiring(food: FoodItem): boolean {
        const currentTime = Date.now();
        const timeLeft = this.config.foodExpirationTime - (currentTime - food.createdAt);
        return timeLeft < 2000; // Show warning in last 2 seconds
    }

    private togglePause(): void {
        if (this.isGameOver || this.isWaiting) return;
        
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
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