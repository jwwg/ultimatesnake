import { Arrow, Position, GameConfig } from './types.js';

interface ArrowManagerConfig {
    arrowSpeed: number;
    arrowWidth: number;
    arrowHeight: number;
    gridSize: number;
}

export class ArrowManager {
    private arrows: Arrow[] = [];
    private readonly config: ArrowManagerConfig;
    private readonly tileCount: { x: number; y: number };

    constructor(tileCount: { x: number; y: number }, config: ArrowManagerConfig) {
        this.tileCount = tileCount;
        this.config = config;
    }

    spawnArrow(): void {
        const y = Math.floor(Math.random() * this.tileCount.y);
        const gridY = y * this.config.gridSize;
        const centeredY = gridY + (this.config.gridSize - this.config.arrowHeight) / 2;
        
        this.arrows.push({
            x: -this.config.arrowWidth,
            y: centeredY,
            speed: this.config.arrowSpeed,
            width: this.config.arrowWidth,
            height: this.config.arrowHeight
        });
    }

    update(): void {
        this.arrows = this.arrows.filter(arrow => {
            arrow.x += arrow.speed;
            return arrow.x < this.tileCount.x * this.config.gridSize;
        });
    }

    checkCollision(snakeHead: Position): Arrow | null {
        const headX = snakeHead.x * this.config.gridSize;
        const headY = snakeHead.y * this.config.gridSize;
        
        const hitArrow = this.arrows.find(arrow => (
            headX < arrow.x + arrow.width &&
            headX + this.config.gridSize > arrow.x &&
            headY < arrow.y + arrow.height &&
            headY + this.config.gridSize > arrow.y
        ));

        if (hitArrow) {
            this.arrows = this.arrows.filter(arrow => arrow !== hitArrow);
            return hitArrow;
        }

        return null;
    }

    getArrows(): Arrow[] {
        return this.arrows;
    }

    reset(): void {
        this.arrows = [];
    }
} 