import { Hand, PokerHandType, PokerHandAnimation, Card, ExplosionAnimation } from './types.js';

export class GameState {
    private score: number = 0;
    private highScore: number = 0;
    private isGameOver: boolean = false;
    private isWaiting: boolean = true;
    private isPaused: boolean = false;
    private isNewHighScore: boolean = false;
    private hand: Hand = { cards: [], maxSize: 5 };
    private pokerHandAnimations: PokerHandAnimation[] = [];
    private explosionAnimations: ExplosionAnimation[] = [];
    private lastHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number } | null = null;
    private highestHandScore: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number; setAt: number } | null = null;
    private multiplierExponent: number = 1;
    private multiplierDeduction: number = 0;
    private scoreLengthMultiplier: number = 1;

    constructor() {
        this.highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
    }

    getScore(): number {
        return this.score;
    }

    getHighScore(): number {
        return Number(localStorage.getItem('snakeHighScore')) || 0;
    }

    setHighScore(highScore: number): void {
        localStorage.setItem('snakeHighScore', highScore.toString());
    }

    getHand(): Hand {
        return this.hand;
    }

    getPokerHandAnimations(): PokerHandAnimation[] {
        return this.pokerHandAnimations;
    }

    getExplosionAnimations(): ExplosionAnimation[] {
        return this.explosionAnimations;
    }

    getLastHandScore() {
        return this.lastHandScore;
    }

    getHighestHandScore() {
        return this.highestHandScore;
    }

    getMultiplierExponent(): number {
        return this.multiplierExponent;
    }

    getMultiplier(snakeLength: number) {
        return snakeLength * this.scoreLengthMultiplier * this.multiplierExponent - this.multiplierDeduction;
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
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.isNewHighScore = true;
            this.setHighScore(this.highScore);
        }
    }

    isNewHighScoreSet(): boolean {
        return this.isNewHighScore;
    }

    setWaiting(waiting: boolean): void {
        this.isWaiting = waiting;
    }

    togglePause(): void {
        this.isPaused = !this.isPaused;
    }

    reset(scoreLengthMultiplier: number): void {
        this.score = 0;
        this.highScore = this.getHighScore();
        this.isGameOver = false;
        this.isWaiting = true;
        this.isPaused = false;
        this.isNewHighScore = false;
        this.hand = { cards: [], maxSize: 5 };
        this.lastHandScore = null;
        this.highestHandScore = null;
        this.pokerHandAnimations = [];
        this.explosionAnimations = [];
        this.multiplierExponent = 1;
        this.multiplierDeduction = 0;
        this.scoreLengthMultiplier = scoreLengthMultiplier;
    }

    increaseMultiplierExponent(maxValue: number): void {
        this.multiplierExponent = Math.min(this.multiplierExponent + 1, maxValue);
    }

    resetMultiplierExponent(): void {
        this.multiplierExponent = 1;
    }

    addExplosionAnimation(x: number, y: number): void {
        const particles = [];
        const colors = ['#FF0000', '#FFA500', '#FFFF00', '#FFD700'];
        
        // Create 20 particles in a circular pattern
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 1 + Math.random(); // Reduced speed for smaller radius
            particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        this.explosionAnimations.push({
            x,
            y,
            startTime: Date.now(),
            particles
        });
    }

    updateExplosionAnimations(): void {
        const now = Date.now();
        this.explosionAnimations = this.explosionAnimations.filter(animation => {
            const age = now - animation.startTime;
            return age < 1000; // Explosion lasts 1 second
        });
    }
} 