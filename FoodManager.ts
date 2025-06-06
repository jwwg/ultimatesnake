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
    private deck: { suit: CardSuit; rank: CardRank }[] = [];
    private isDeckEmpty: boolean = false;

    constructor(tileCount: { x: number; y: number }, config: {
        maxFoodItems: number;
        minFoodInterval: number;
        foodExpirationTime: number;
    }) {
        this.tileCount = tileCount;
        this.config = config;
        this.initializeDeck();
        // Generate initial food
        this.foods = [this.generateFood([])];
    }

    private initializeDeck(): void {
        const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push({ suit, rank });
            }
        }
        
        // Shuffle the deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    private drawCard(): { suit: CardSuit; rank: CardRank } | null {
        if (this.deck.length === 0) {
            this.isDeckEmpty = true;
            return null;
        }
        return this.deck.pop()!;
    }

    generateFood(snakePositions: Position[]): FoodItem {
        const card = this.drawCard();
        if (!card) {
            throw new Error('No more cards in deck - game over');
        }

        let position: Position;
        do {
            position = {
                x: Math.floor(Math.random() * this.tileCount.x),
                y: Math.floor(Math.random() * this.tileCount.y)
            };
        } while (this.isPositionOccupied(position, snakePositions));
        
        return {
            ...position,
            createdAt: Date.now(),
            suit: card.suit,
            rank: card.rank
        };
    }

    private isPositionOccupied(position: Position, snakePositions: Position[]): boolean {
        return snakePositions.some(pos => pos.x === position.x && pos.y === position.y) ||
               this.foods.some(food => food.x === position.x && food.y === position.y);
    }

    private returnCardToDeck(card: { suit: CardSuit; rank: CardRank }): void {
        this.deck.push(card);
        // Shuffle the deck after adding a card back
        const lastCard = this.deck.pop()!;
        const randomIndex = Math.floor(Math.random() * this.deck.length);
        this.deck.splice(randomIndex, 0, lastCard);
    }

    update(snakePositions: Position[]): void {
        const currentTime = Date.now();
        
        // Remove expired food and return cards to deck
        const expiredFood = this.foods.filter(food => 
            currentTime - food.createdAt >= this.config.foodExpirationTime
        );
        
        this.foods = this.foods.filter(food => 
            currentTime - food.createdAt < this.config.foodExpirationTime
        );

        // Return expired cards to the deck
        for (const food of expiredFood) {
            this.returnCardToDeck({ suit: food.suit, rank: food.rank });
        }

        // Ensure there's at least one food item if we have cards left
        if (this.foods.length === 0 && !this.isDeckEmpty) {
            try {
                this.foods.push(this.generateFood(snakePositions));
                this.lastFoodGeneration = currentTime;
            } catch (error) {
                // Deck is empty, game over
                this.isDeckEmpty = true;
            }
            return;
        }

        // Generate new food if conditions are met and we have cards left
        if (!this.isDeckEmpty && 
            this.foods.length < this.config.maxFoodItems && 
            currentTime - this.lastFoodGeneration > this.config.minFoodInterval &&
            Math.random() < 0.1) {
            try {
                this.foods.push(this.generateFood(snakePositions));
                this.lastFoodGeneration = currentTime;
            } catch (error) {
                // Deck is empty, game over
                this.isDeckEmpty = true;
            }
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

    getIsDeckEmpty(): boolean {
        return this.isDeckEmpty;
    }

    getRemainingCards(): number {
        return this.deck.length;
    }
} 