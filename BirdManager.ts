import { Bird, Position, GameConfig } from './types.js';
import { AchievementManager, BIRD_CATCH_ACHIEVEMENT_ID } from './achievements.js';
import { AchievementsUI } from './src/achievementsUI.js';

interface BirdManagerConfig {
    birdSpeed: number;
    birdWidth: number;
    birdHeight: number;
    gridSize: number;
}

export class BirdManager {
    private birds: Bird[] = [];
    private readonly config: BirdManagerConfig;
    private readonly tileCount: { x: number; y: number };
    private readonly achievementManager: AchievementManager;
    private readonly achievementsUI: AchievementsUI;

    constructor(
        tileCount: { x: number; y: number }, 
        config: BirdManagerConfig, 
        achievementManager: AchievementManager,
        achievementsUI: AchievementsUI
    ) {
        this.tileCount = tileCount;
        this.config = config;
        this.achievementManager = achievementManager;
        this.achievementsUI = achievementsUI;
    }

    spawnBird(): void {
        const y = Math.floor(Math.random() * this.tileCount.y);
        const gridY = y * this.config.gridSize;
        const centeredY = gridY + (this.config.gridSize - this.config.birdHeight) / 2;
        
        this.birds.push({
            x: -this.config.birdWidth,
            y: centeredY,
            speed: this.config.birdSpeed,
            width: this.config.birdWidth,
            height: this.config.birdHeight
        });
    }

    update(): void {
        this.birds = this.birds.filter(bird => {
            bird.x += bird.speed;
            return bird.x < this.tileCount.x * this.config.gridSize;
        });
    }

    checkCollision(snakeHead: Position): Bird | null {
        const headX = snakeHead.x * this.config.gridSize;
        const headY = snakeHead.y * this.config.gridSize;
        
        const hitBird = this.birds.find(bird => (
            headX < bird.x + bird.width &&
            headX + this.config.gridSize > bird.x &&
            headY < bird.y + bird.height &&
            headY + this.config.gridSize > bird.y
        ));

        if (hitBird) {
            this.birds = this.birds.filter(bird => bird !== hitBird);
            this.achievementManager.checkAchievement(BIRD_CATCH_ACHIEVEMENT_ID);
            this.achievementsUI.checkNewAchievements();
            return hitBird;
        }

        return null;
    }

    getBirds(): Bird[] {
        return this.birds;
    }

    reset(): void {
        this.birds = [];
    }
}
