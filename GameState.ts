import { Hand, PokerHandType, PokerHandAnimation, Card } from './types.js';

export class GameState {
    private score: number = 0;
    private highScore: number = 0;
    private isGameOver: boolean = false;
    private isWaiting: boolean = true;
    private isPaused: boolean = false;
    private hand: Hand = { cards: [], maxSize: 5 };
    private pokerHandAnimations: PokerHandAnimation[] = [];
    private lastHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number } | null = null;
    private highestHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; setAt: number } | null = null;

    constructor() {
        this.highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
    }

    getScore(): number {
        return this.score;
    }

    getHighScore(): number {
        return this.highScore;
    }

    getHand(): Hand {
        return this.hand;
    }

    getPokerHandAnimations(): PokerHandAnimation[] {
        return this.pokerHandAnimations;
    }

    getLastHandScore() {
        return this.lastHandScore;
    }

    getHighestHandScore() {
        return this.highestHandScore;
    }

    isGameOverState(): boolean {
        return this.isGameOver;
    }

    isWaitingState(): boolean {
        return this.isWaiting;
    }

    isPausedState(): boolean {
        return this.isPaused;
    }

    addScore(points: number): void {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
    }

    addCardToHand(card: Card): void {
        if (this.hand.cards.length < this.hand.maxSize) {
            this.hand.cards.push(card);
        }
    }

    clearHand(): void {
        this.hand.cards = [];
    }

    addPokerHandAnimation(animation: PokerHandAnimation): void {
        this.pokerHandAnimations.push(animation);
    }

    updatePokerHandAnimations(): void {
        const currentTime = Date.now();
        this.pokerHandAnimations = this.pokerHandAnimations.filter(
            anim => currentTime - anim.startTime < 2000
        );
    }

    setLastHandScore(score: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number }): void {
        this.lastHandScore = score;
        if (!this.highestHandScore || score.finalScore > this.highestHandScore.finalScore) {
            this.highestHandScore = { 
                ...score,
                setAt: Date.now()
            };
        }
    }

    setGameOver(): void {
        this.isGameOver = true;
    }

    setWaiting(waiting: boolean): void {
        this.isWaiting = waiting;
    }

    togglePause(): void {
        this.isPaused = !this.isPaused;
    }

    reset(): void {
        this.score = 0;
        this.isGameOver = false;
        this.isWaiting = true;
        this.isPaused = false;
        this.hand = { cards: [], maxSize: 5 };
        this.lastHandScore = null;
        this.highestHandScore = null;
        this.pokerHandAnimations = [];
    }
} 