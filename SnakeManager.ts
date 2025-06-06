import { SnakeSegment, Direction, Position, SegmentType } from './types.js';

export class SnakeManager {
    private snake: SnakeSegment[] = [];
    private direction: Direction = { x: 0, y: 0 };
    private readonly tileCount: { x: number; y: number };

    constructor(tileCount: { x: number; y: number }, initialLength: number) {
        this.tileCount = tileCount;
        this.initializeSnake(initialLength);
    }

    private initializeSnake(initialLength: number): void {
        const head = this.createInitialSnakeHead();
        this.snake = [head];
        
        for (let i = 1; i < initialLength; i++) {
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

        // Set initial direction to right
        this.direction = { x: 1, y: 0 };
    }

    private createInitialSnakeHead(): SnakeSegment {
        return {
            x: Math.floor(this.tileCount.x / 2),
            y: Math.floor(this.tileCount.y / 2),
            type: 'head' as SegmentType,
            age: 0,
            lastDirection: { x: 1, y: 0 },
            convergence: 3,
            nextSegment: undefined
        };
    }

    getDirection(): Direction {
        return { ...this.direction };
    }

    setDirection(newDirection: Direction): void {
        // Prevent 180-degree turns
        if (this.direction.x === -newDirection.x || this.direction.y === -newDirection.y) {
            return;
        }
        this.direction = newDirection;
    }

    move(): { newHead: Position; collision: boolean } {
        const lastConvergence = this.snake[0].convergence || 3;
        const convergenceChange = Math.random() < 0.5 ? -1 : 1;
        const newConvergence = Math.max(1, Math.min(5, lastConvergence + convergenceChange));

        // Calculate new head position
        const newHeadX = (this.snake[0].x + this.direction.x + this.tileCount.x) % this.tileCount.x;
        const newHeadY = (this.snake[0].y + this.direction.y + this.tileCount.y) % this.tileCount.y;
        const newHead: Position = { x: newHeadX, y: newHeadY };

        // Check for collision
        const collision = this.checkCollision(newHead);

        if (!collision) {
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
        }

        return { newHead, collision };
    }

    private checkCollision(head: Position): boolean {
        const collisionIndex = this.snake.findIndex(segment => segment.x === head.x && segment.y === head.y);
        if (collisionIndex === -1) return false;

        // If the head is a ram type, destroy segments after collision point
        if (this.snake[0].type === 'ram') {
            this.snake = this.snake.slice(0, collisionIndex);
            return false;
        }

        return true;
    }

    grow(): void {
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
    }

    getSnake(): SnakeSegment[] {
        return this.snake;
    }

    getHeadPosition(): Position {
        return { x: this.snake[0].x, y: this.snake[0].y };
    }

    getSnakePositions(): Position[] {
        return this.snake.map(segment => ({ x: segment.x, y: segment.y }));
    }

    reset(initialLength: number): void {
        this.direction = { x: 1, y: 0 }; // Set initial direction to right
        this.initializeSnake(initialLength);
    }
} 