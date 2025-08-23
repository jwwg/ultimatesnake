import { Position, Direction, SnakeSegment, FoodItem, GameConfig, CardSuit, CardRank, SegmentType, Hand, Card, PokerHandType, PokerHandScore, PokerHandAnimation } from './types.js';
import { defaultConfig } from './config.js';
import { SnakeRenderer } from './SnakeRenderer.js';
import { PokerHandEvaluator } from './PokerHandEvaluator.js';
import { FoodManager } from './FoodManager.js';
import { SnakeManager } from './SnakeManager.js';
import { GameState } from './GameState.js';
import { BirdManager } from './BirdManager.js';
import { achievementManager } from './achievements.js';
import { AchievementsUI } from './src/achievementsUI.js';
import { JokerDialog, JokerOption } from './src/jokerDialog.js';

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
    gameState: GameState;
    private pokerHandEvaluator: PokerHandEvaluator;
    private birdManager: BirdManager;
    private scoreElement: HTMLElement;
    private highScoreElement: HTMLElement;
    private multiplierElement: HTMLElement;
    private handsCompletedElement: HTMLElement;
    private cardsElement: HTMLElement;
    private achievementsUI: AchievementsUI;
    private jokerDialog: JokerDialog;
    private lastCollidedFood?: FoodItem;

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
        
        this.achievementsUI = new AchievementsUI(achievementManager);
        this.jokerDialog = new JokerDialog();
        this.birdManager = new BirdManager(this.tileCount, {
            birdSpeed: this.config.birdSpeed,
            birdWidth: this.config.birdWidth,
            birdHeight: this.config.birdHeight,
            gridSize: this.config.gridSize
        }, achievementManager, this.achievementsUI);
        this.gameState = new GameState();
        this.pokerHandEvaluator = new PokerHandEvaluator();
        
        // Set up callback for when hand becomes full
        this.gameState.setOnHandFullCallback(() => {
            const pokerScore = this.pokerHandEvaluator.evaluatePokerHand(this.gameState.getHand());
            const finalMultiplier = this.gameState.getMultiplier(this.snakeManager.getSnake().length);
            this.handleHandScored(pokerScore, finalMultiplier, this.lastCollidedFood);
            this.lastCollidedFood = undefined; // Clear after use
        });
        
        // Set up callback for when new food spawns
        this.foodManager.setOnFoodSpawnCallback((food: FoodItem) => {
            const { startX, startY, endX, endY } = this.calculateThrowingAnimation(food);
            this.gameState.addFoodSpawnAnimation({
                food,
                startTime: Date.now(),
                duration: 1200, // 1.2 second throwing animation
                startX,
                startY,
                endX,
                endY
            });
        });
        
        // Set up callback for when food animation completes
        this.gameState.setOnFoodReadyCallback((food: FoodItem) => {
            this.foodManager.addFoodToArray(food);
        });
        

        // Initialize score display elements
        this.scoreElement = document.getElementById('score')!;
        this.highScoreElement = document.getElementById('highScore')!;
        this.multiplierElement = document.getElementById('multiplier')!;
        this.handsCompletedElement = document.getElementById('handsCompleted')!;
        this.cardsElement = document.getElementById('cards')!;

        this.setupEventListeners();
        this.updateScoreDisplay();
        this.updateHandsCompletedDisplay();
        this.updateCardsDisplay();
        this.draw();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('playPauseIcon')?.addEventListener('click', () => this.handlePlayPauseClick());
        window.addEventListener('resize', () => this.handleResize());
    }

    private handlePlayPauseClick(): void {
        if (this.gameState.isWaitingState() || this.gameState.isGameOverState()) {
            this.startGame();
        } else if (!this.gameState.isGameOverState()) {
            this.togglePause();
        }
    }

    private updatePlayPauseIcon(): void {
        const playPauseIcon = document.getElementById('playPauseIcon') as HTMLElement;
        if (playPauseIcon) {
            if (this.gameState.isWaitingState()) {
                playPauseIcon.textContent = 'GO!';
            } else if (this.gameState.isPausedState()) {
                playPauseIcon.textContent = 'PAUSED';
            } else {
                playPauseIcon.textContent = 'GO!';
            }
        }
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (this.gameState.isWaitingState() || this.gameState.isGameOverState()) {
            this.startGame();
            return;
        }

        // Don't handle pause/space key if joker dialog is open
        if ((event.key === 'p' || event.key === 'P' || event.key === ' ') && this.jokerDialog.isDialogOpen()) {
            return;
        }

        if (event.key === 'p' || event.key === 'P' || event.key === ' ') {
            this.togglePause();
            return;
        }

        if (this.gameState.isPausedState()) return;

        const newDirection: Direction = { x: 0, y: 0 };

        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.snakeManager.getDirection().y !== 1) newDirection.y = -1;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.snakeManager.getDirection().y !== -1) newDirection.y = 1;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.snakeManager.getDirection().x !== 1) newDirection.x = -1;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.snakeManager.getDirection().x !== -1) newDirection.x = 1;
                break;
        }

        if (newDirection.x !== 0 || newDirection.y !== 0) {
            this.snakeManager.setDirection(newDirection);
        }
    }

    private updateScoreDisplay(): void {
        this.scoreElement.textContent = this.gameState.getScore().toFixed(0).toString();
        this.highScoreElement.textContent = this.gameState.getHighScore().toFixed(0).toString();
        this.updateMultiplierDisplay();
    }

    private updateMultiplierDisplay(): void {
        this.multiplierElement.textContent = `${this.gameState.getMultiplier(this.snakeManager.getSnake().length).toFixed(2)}x`;
    }

    private updateHandsCompletedDisplay(): void {
        const handsCompleted = this.gameState.getHandsPlayed();
        this.handsCompletedElement.textContent = `${handsCompleted}/${this.gameState.getMaxHands()}`;
        
        // Add warning class if cards are low
        if (handsCompleted == this.gameState.getMaxHands() - 1) {
            this.handsCompletedElement.classList.add('warning');
        } else {
            this.handsCompletedElement.classList.remove('warning');
        }
    }

    private updateCardsDisplay(): void {
        const remainingCards = this.foodManager.getRemainingCards();
        this.cardsElement.textContent = remainingCards.toString();
        
        // Add warning class if cards are low
        if (remainingCards <= this.LOW_CARDS_WARNING_THRESHOLD) {
            this.cardsElement.classList.add('warning');
        } else {
            this.cardsElement.classList.remove('warning');
        }
    }

    private handleHandScored(pokerScore: PokerHandScore, finalMultiplier: number, food?: FoodItem): void {
        const finalScore = pokerScore.score * finalMultiplier;
        this.gameState.addScore(finalScore);
        this.updateScoreDisplay();
        
        // Check for achievements
        achievementManager.checkAchievement(pokerScore.type);
        this.achievementsUI.checkNewAchievements();
        
        // Store last hand score details with the cards used in the hand
        this.gameState.setLastHandScore({
            type: pokerScore.type,
            baseScore: pokerScore.score,
            lengthMultiplier: finalMultiplier,
            finalScore,
            cards: pokerScore.cards
        });
        
        // Create animation at the last card's position (or center if no food provided)
        this.gameState.addPokerHandAnimation({
            type: pokerScore.type,
            score: finalScore,
            x: food ? food.x : this.tileCount.x / 2,
            y: food ? food.y : this.tileCount.y / 2,
            startTime: Date.now()
        });
        
        // Spawn birds when a hand is completed
        this.birdManager.spawnBird();
        
        // Clear the hand after scoring
        this.gameState.clearHand();
        this.updateHandsCompletedDisplay();
        
        // Increment hands played and check if game should end
        this.gameState.incrementHandsPlayed();
        if (this.gameState.hasReachedMaxHands()) {
            this.gameOver('hands');
        }
    }

    private async handleJokerCollision(food: FoodItem): Promise<void> {
        // Pause the game
        this.gameState.togglePause();
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // Get the last card from the player's hand for context
        const hand = this.gameState.getHand();
        const lastCard = hand.cards.length > 0 ? hand.cards[hand.cards.length - 1] : null;
        
        // Check which options are available
        const availableOptions = this.getAvailableJokerOptions(lastCard);
        
        // Show joker dialog with available options
        const option = await this.jokerDialog.showJokerDialog(lastCard, availableOptions);
        
        // Handle the selected option
        await this.handleJokerOption(option, lastCard);
        
        // Resume the game
        this.gameState.togglePause();
        this.gameLoop = window.setInterval(() => {
            this.update();
            this.draw();
        }, this.speed);
        
        // Remove the joker card and grow snake
        this.foodManager.removeFoodAt(food);
        this.snakeManager.grow();
    }

    private getAvailableJokerOptions(lastCard: Card | null): { sameSuit: boolean; rankPlusOne: boolean; reshuffle: boolean } {
        const sameSuit = !!(lastCard && lastCard.suit !== 'joker' && this.foodManager.hasCardOfSuit(lastCard.suit));
        const rankPlusOne = !!(lastCard && lastCard.suit !== 'joker' && this.foodManager.hasCardOfRank(this.getNextRank(lastCard.rank)));
        const reshuffle = true; // Reshuffle is always available
        
        return { sameSuit, rankPlusOne, reshuffle };
    }

    private async handleJokerOption(option: JokerOption, lastCard: Card | null): Promise<void> {
        switch (option.id) {
            case 'same-suit':
                if (lastCard && lastCard.suit !== 'joker') {
                    const newCard = this.foodManager.addCardOfSuit(lastCard.suit);
                    if (newCard) {
                        const handPos = this.calculateHandPosition(this.gameState.getHand().cards.length);
                        // Start from top-left of game area (not the very corner)
                        this.gameState.addCardToHand(newCard, 50, 50, handPos.x, handPos.y);
                    }
                }
                break;
                
            case 'rank-plus-one':
                if (lastCard && lastCard.suit !== 'joker') {
                    const nextRank = this.getNextRank(lastCard.rank);
                    const newCard = this.foodManager.addCardOfRank(nextRank);
                    if (newCard) {
                        const handPos = this.calculateHandPosition(this.gameState.getHand().cards.length);
                        // Start from top-left of game area (not the very corner)
                        this.gameState.addCardToHand(newCard, 50, 50, handPos.x, handPos.y);
                    }
                }
                break;
                
            case 'reshuffle':
                this.foodManager.reshuffleDeck();
                break;
        }
    }

    private getNextRank(rank: CardRank): CardRank {
        const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const currentIndex = ranks.indexOf(rank);
        const nextIndex = (currentIndex + 1) % ranks.length;
        return ranks[nextIndex];
    }

    private calculateHandPosition(cardIndex: number): { x: number; y: number } {
        const cardWidth = 60;
        const cardHeight = 90;
        const padding = 10;
        const startX = (this.canvas.width - (cardWidth * 5 + padding * 4)) / 2;
        const startY = this.tileCount.y * this.config.gridSize + 20;
        
        return {
            x: startX + (cardWidth + padding) * cardIndex,
            y: startY
        };
    }

    private calculateThrowingAnimation(food: FoodItem): { startX: number; startY: number; endX: number; endY: number } {
        const endX = food.x * this.config.gridSize;
        const endY = food.y * this.config.gridSize;
        
        // Calculate the furthest corner from the food position
        const startX = endX < this.canvas.width / 2 ? this.canvas.width : 0;
        const startY = endY < this.canvas.height / 2 ? this.canvas.height : 0;
        
        return { startX, startY, endX, endY };
    }

    private handleRegularCardCollision(food: FoodItem): void {
        // Calculate score based on snake length and card rank
        const rankValue = this.config.scorePerFood;
        const lengthBonus = Math.floor(this.snakeManager.getSnake().length * this.config.scoreLengthMultiplier);
        this.gameState.addScore(rankValue + lengthBonus);
        this.updateScoreDisplay();

        // Add card to hand if there's space
        const handPos = this.calculateHandPosition(this.gameState.getHand().cards.length);
        this.gameState.addCardToHand({
            suit: food.suit,
            rank: food.rank
        }, food.x * this.config.gridSize, food.y * this.config.gridSize, handPos.x, handPos.y);

        // Check if hand is full and evaluate poker hand (will be checked in updateCardDrawAnimations)
        // The hand evaluation will happen when the animation completes
        // Store the food item for the callback
        this.lastCollidedFood = food;
        
        // Grow snake
        this.snakeManager.grow();
        
        // Remove food
        this.foodManager.removeFoodAt(food);
        
        // Remove the unnecessary game loop restart
        // The game loop should continue running at the same speed
    }

    private update(): void {
        if (this.gameState.isGameOverState() || this.gameState.isWaitingState() || this.gameState.isPausedState()) return;

        // Update cards remaining display
        this.updateHandsCompletedDisplay();
        this.updateCardsDisplay();

        // Check if deck is empty
        if (this.foodManager.getIsDeckEmpty()) {
            this.gameOver('deck');
            return;
        }

        // Update birds
        this.birdManager.update();

        // Update multiplier deduction
        this.gameState.increaseMultiplierDeduction(this.config.multiplierDeductionRate);
        this.updateMultiplierDisplay();

        // Check for bird collision with snake head
        const snakeHead = this.snakeManager.getSnake()[0];
        const hitBird = this.birdManager.checkCollision(snakeHead);
        if (hitBird) {
            this.gameState.addExplosionAnimation(hitBird.x + hitBird.width / 2, hitBird.y + hitBird.height / 2);
            this.gameState.increaseMultiplierExponent(this.config.maxMultiplierExponent);
            this.updateScoreDisplay();
        }

        // Update food
        this.foodManager.update(this.snakeManager.getSnakePositions());

        // Update animations
        this.gameState.updatePokerHandAnimations();
        this.gameState.updateExplosionAnimations();
        this.gameState.updateCardDrawAnimations();
        this.gameState.updateFoodSpawnAnimations();

        // Move snake and check for collision
        const { newHead, collision } = this.snakeManager.move();
        if (collision) {
            this.gameOver();
            return;
        }

        // Check for food collision
        const food = this.foodManager.getFoods().find(f => f.x === newHead.x && f.y === newHead.y);
        if (food) {
            // Check if it's a joker card
            if (food.suit === 'joker') {
                this.handleJokerCollision(food);
            } else {
                // Handle regular card collision
                this.handleRegularCardCollision(food);
            }
        }
    }

    private draw(): void {
        if (this.gameState.isGameOverState()) return;
        
        // Show start screen if game is in waiting state
        if (this.gameState.isWaitingState()) {
            this.renderer.drawStartScreen();
            return;
        }
        
        const hand = this.gameState.getHand();
        const lastHandScore = this.gameState.getLastHandScore();
        const highestHandScore = this.gameState.getHighestHandScore();
        
        const handWithScore: Hand & { 
            lastHandScore?: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; cards: Card[] };
            highestHandScore?: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; setAt: number; cards: Card[] };
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
            this.birdManager.getBirds(),
            this.gameState.getExplosionAnimations(),
            this.gameState.getCardDrawAnimations(),
            this.gameState.getFoodSpawnAnimations(),
            this.gameState.getMultiplierExponent()
        );
        
        if (this.gameState.isPausedState()) this.renderer.drawPaused();
    }

    private gameOver(reason: 'collision' | 'deck' | 'hands' = 'collision'): void {
        this.gameState.setGameOver();
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        const highestHandScore = this.gameState.getHighestHandScore();
        const newlyUnlocked = achievementManager.getNewlyUnlocked();
        this.renderer.drawGameOver(
            this.gameState.getScore(),
            highestHandScore ? {
                type: highestHandScore.type,
                baseScore: highestHandScore.baseScore,
                lengthMultiplier: highestHandScore.lengthMultiplier,
                finalScore: highestHandScore.finalScore,
                cards: highestHandScore.cards
            } : undefined,
            reason === 'deck' ? 'Game Over - Deck Empty!' : reason === 'hands' ? 'Game Over - Max Hands Reached!' : undefined,
            this.gameState.isNewHighScoreSet(),
            newlyUnlocked
        );
        achievementManager.clearNewlyUnlocked();
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
        
        // Set up callback for when new food spawns
        this.foodManager.setOnFoodSpawnCallback((food: FoodItem) => {
            const { startX, startY, endX, endY } = this.calculateThrowingAnimation(food);
            this.gameState.addFoodSpawnAnimation({
                food,
                startTime: Date.now(),
                duration: 1200, // 1.2 second throwing animation
                startX,
                startY,
                endX,
                endY
            });
        });
        
        // Set up callback for when food animation completes
        this.gameState.setOnFoodReadyCallback((food: FoodItem) => {
            this.foodManager.addFoodToArray(food);
        });
        
        // Start generating food
        this.foodManager.startGeneratingFood();
        
        this.birdManager.reset();
        this.updateScoreDisplay();
        this.updateHandsCompletedDisplay();
        this.updateCardsDisplay();
        this.updatePlayPauseIcon();
        this.startCountdown();
    }

    private startCountdown(): void {
        let count = 2;
        
        // Show the first countdown number immediately
        this.renderer.drawCountdown(count);
        
        const countdownInterval = setInterval(() => {
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                this.gameState.setWaiting(false);
                this.updatePlayPauseIcon();
                this.gameLoop = window.setInterval(() => {
                    this.update();
                    this.draw();
                }, this.speed);
            } else {
                this.renderer.drawCountdown(count);
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
        
        // Set up callback for when new food spawns
        this.foodManager.setOnFoodSpawnCallback((food: FoodItem) => {
            const { startX, startY, endX, endY } = this.calculateThrowingAnimation(food);
            this.gameState.addFoodSpawnAnimation({
                food,
                startTime: Date.now(),
                duration: 1200, // 1.2 second throwing animation
                startX,
                startY,
                endX,
                endY
            });
        });
        
        // Set up callback for when food animation completes
        this.gameState.setOnFoodReadyCallback((food: FoodItem) => {
            this.foodManager.addFoodToArray(food);
        });
        
        // Only start generating food if game is not in waiting state
        if (!this.gameState.isWaitingState()) {
            this.foodManager.startGeneratingFood();
        }
        
        this.draw();
    }

    private togglePause(): void {
        if (this.gameState.isGameOverState() || this.gameState.isWaitingState()) return;
        
        this.gameState.togglePause();
        this.updatePlayPauseIcon();
        
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

    turn(direction: 'up' | 'down' | 'left' | 'right'): void {
        if (this.gameState.isPausedState() || this.gameState.isGameOverState() || this.gameState.isWaitingState()) return;

        const currentDirection = this.snakeManager.getDirection();
        const newDirection = { x: 0, y: 0 };

        switch (direction) {
            case 'up':
                if (currentDirection.y !== 1) newDirection.y = -1;
                break;
            case 'down':
                if (currentDirection.y !== -1) newDirection.y = 1;
                break;
            case 'left':
                if (currentDirection.x !== 1) newDirection.x = -1;
                break;
            case 'right':
                if (currentDirection.x !== -1) newDirection.x = 1;
                break;
        }

        if (newDirection.x !== 0 || newDirection.y !== 0) {
            this.snakeManager.setDirection(newDirection);
        }
    }
} 