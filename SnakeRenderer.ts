import { Position, Direction, SnakeSegment, FoodItem, GameConfig, FoodType, SegmentType } from './types.js';

export class SnakeRenderer {
    readonly foodColors = {
        red: '#ff0000',
        blue: '#0000ff',
        orange: '#ffa500'
    } as const;

    readonly segmentColors = {
        normal: '#4CAF50',
        ram: '#0000ff',
        speedy: '#ffa500',
        head: '#45a049'
    } as const;

    private destructionAnimations: { segment: SnakeSegment; startTime: number }[] = [];
    private readonly destructionDuration = 2000; // Animation duration in milliseconds (2 seconds)

    constructor(
        readonly canvas: HTMLCanvasElement,
        readonly ctx: CanvasRenderingContext2D,
        readonly config: GameConfig
    ) {}

    draw(snake: SnakeSegment[], foods: FoodItem[], isGameOver: boolean): void {
        if (isGameOver) return;

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawSnake(snake);
        this.drawFood(foods);
        this.drawDestructionAnimations();
    }

    addDestructionAnimation(segment: SnakeSegment): void {
        this.destructionAnimations.push({
            segment: { ...segment },
            startTime: Date.now()
        });
    }

    private drawDestructionAnimations(): void {
        const currentTime = Date.now();
        this.destructionAnimations = this.destructionAnimations.filter(animation => {
            const elapsed = currentTime - animation.startTime;
            if (elapsed >= this.destructionDuration) return false;

            const progress = elapsed / this.destructionDuration;
            const x = animation.segment.x * this.config.gridSize;
            const y = animation.segment.y * this.config.gridSize;
            const size = this.config.gridSize - 2;

            // Flash effect with higher contrast
            const alpha = Math.abs(Math.sin(progress * Math.PI * 4)) * (1 - progress);
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.fillRect(x, y, size, size);

            // Draw a cross with higher contrast
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, y + 2);
            this.ctx.lineTo(x + size - 2, y + size - 2);
            this.ctx.moveTo(x + size - 2, y + 2);
            this.ctx.lineTo(x + 2, y + size - 2);
            this.ctx.stroke();

            // Add a glow effect
            this.ctx.shadowColor = 'red';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
            this.ctx.fillRect(x - 5, y - 5, size + 10, size + 10);
            this.ctx.shadowBlur = 0;

            return true;
        });
    }

    drawSnake(snake: SnakeSegment[]): void {
        snake.forEach(segment => {
            const x = segment.x * this.config.gridSize;
            const y = segment.y * this.config.gridSize;
            const size = this.config.gridSize - 2;
            
            if (segment.type === 'head')
                this.drawSnakeHead(segment, x, y, size);
            else
                this.drawSnakeBody(segment, x, y, size);
            
            if (segment.lastDirection)
                this.drawDirectionLines(segment, x, y, size);
        });
    }

    drawSnakeHead(segment: SnakeSegment, x: number, y: number, size: number): void {
        if (segment.type === 'ram')
            this.drawRamHead(segment, x, y, size);
        else {
            this.ctx.strokeStyle = this.segmentColors[segment.type];
            this.ctx.lineWidth = 2;
            const arrowLength = size * this.config.segmentScale;
            const arrowWidth = size * this.config.segmentScale;
            const centerX = x + size/2;
            const centerY = y + size/2;
            
            this.ctx.beginPath();
            if (segment.lastDirection?.x === 1)
                this.drawRightArrow(x, centerY, arrowLength, arrowWidth);
            else if (segment.lastDirection?.x === -1)
                this.drawLeftArrow(x, centerY, arrowLength, arrowWidth, size);
            else if (segment.lastDirection?.y === 1)
                this.drawDownArrow(centerX, y, arrowLength, arrowWidth);
            else if (segment.lastDirection?.y === -1)
                this.drawUpArrow(centerX, y, arrowLength, arrowWidth, size);
            this.ctx.stroke();
        }
    }

    drawRamHead(segment: SnakeSegment, x: number, y: number, size: number): void {
        const centerX = x + size/2;
        const centerY = y + size/2;
        const hornLength = size * 0.4;
        const hornWidth = size * 0.2;
        
        // Draw the main head shape
        this.ctx.strokeStyle = this.segmentColors.ram;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size/2 - 2, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw horns based on direction
        this.ctx.beginPath();
        if (segment.lastDirection?.x === 1) {
            // Right-facing horns
            this.ctx.moveTo(centerX + size/4, centerY - size/4);
            this.ctx.lineTo(centerX + size/2 + hornLength, centerY - size/4 - hornWidth);
            this.ctx.moveTo(centerX + size/4, centerY + size/4);
            this.ctx.lineTo(centerX + size/2 + hornLength, centerY + size/4 + hornWidth);
        } else if (segment.lastDirection?.x === -1) {
            // Left-facing horns
            this.ctx.moveTo(centerX - size/4, centerY - size/4);
            this.ctx.lineTo(centerX - size/2 - hornLength, centerY - size/4 - hornWidth);
            this.ctx.moveTo(centerX - size/4, centerY + size/4);
            this.ctx.lineTo(centerX - size/2 - hornLength, centerY + size/4 + hornWidth);
        } else if (segment.lastDirection?.y === 1) {
            // Down-facing horns
            this.ctx.moveTo(centerX - size/4, centerY + size/4);
            this.ctx.lineTo(centerX - size/4 - hornWidth, centerY + size/2 + hornLength);
            this.ctx.moveTo(centerX + size/4, centerY + size/4);
            this.ctx.lineTo(centerX + size/4 + hornWidth, centerY + size/2 + hornLength);
        } else if (segment.lastDirection?.y === -1) {
            // Up-facing horns
            this.ctx.moveTo(centerX - size/4, centerY - size/4);
            this.ctx.lineTo(centerX - size/4 - hornWidth, centerY - size/2 - hornLength);
            this.ctx.moveTo(centerX + size/4, centerY - size/4);
            this.ctx.lineTo(centerX + size/4 + hornWidth, centerY - size/2 - hornLength);
        }
        this.ctx.stroke();

        // Draw eyes
        this.ctx.fillStyle = this.segmentColors.ram;
        const eyeSize = size * 0.15;
        if (segment.lastDirection?.x === 1) {
            this.ctx.beginPath();
            this.ctx.arc(centerX + size/4, centerY - size/6, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(centerX + size/4, centerY + size/6, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (segment.lastDirection?.x === -1) {
            this.ctx.beginPath();
            this.ctx.arc(centerX - size/4, centerY - size/6, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(centerX - size/4, centerY + size/6, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (segment.lastDirection?.y === 1) {
            this.ctx.beginPath();
            this.ctx.arc(centerX - size/6, centerY + size/4, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(centerX + size/6, centerY + size/4, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (segment.lastDirection?.y === -1) {
            this.ctx.beginPath();
            this.ctx.arc(centerX - size/6, centerY - size/4, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(centerX + size/6, centerY - size/4, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawSnakeBody(segment: SnakeSegment, x: number, y: number, size: number): void {
        if (segment.type === 'speedy') {
            this.ctx.fillStyle = this.segmentColors.speedy;
            this.ctx.fillRect(x, y, size, size);
        } else {
            this.ctx.strokeStyle = this.segmentColors[segment.type];
            this.ctx.lineWidth = 1;
            const segmentLength = size * this.config.segmentScale;
            const segmentWidth = size * this.config.segmentScale;
            const centerX = x + size/2;
            const centerY = y + size/2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - segmentLength/2, centerY - segmentWidth/2);
            this.ctx.lineTo(centerX + segmentLength/2, centerY - segmentWidth/2);
            this.ctx.lineTo(centerX + segmentLength/2, centerY + segmentWidth/2);
            this.ctx.lineTo(centerX - segmentLength/2, centerY + segmentWidth/2);
            this.ctx.lineTo(centerX - segmentLength/2, centerY - segmentWidth/2);
            this.ctx.stroke();
        }
    }

    drawDirectionLines(segment: SnakeSegment, x: number, y: number, size: number): void {
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 1;
        const convergence = segment.convergence || 3;
        
        if (segment.lastDirection?.x === 1 || segment.lastDirection?.x === -1)
            this.drawHorizontalDirectionLines(x, y, size, convergence, segment.lastDirection.x);
        else if (segment.lastDirection?.y === 1 || segment.lastDirection?.y === -1)
            this.drawVerticalDirectionLines(x, y, size, convergence, segment.lastDirection.y);
    }

    drawHorizontalDirectionLines(x: number, y: number, size: number, convergence: number, direction: number): void {
        const offsetLeft = direction === 1 ? 0 : convergence;
        const offsetRight = direction === 1 ? convergence : 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + offsetLeft);
        this.ctx.lineTo(x + size, y + offsetRight);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size - offsetLeft);
        this.ctx.lineTo(x + size, y + size - offsetRight);
        this.ctx.stroke();
    }

    drawVerticalDirectionLines(x: number, y: number, size: number, convergence: number, direction: number): void {
        const offsetTop = direction === 1 ? 0 : convergence;
        const offsetBottom = direction === 1 ? convergence : 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + offsetTop, y);
        this.ctx.lineTo(x + offsetBottom, y + size);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + size - offsetTop, y);
        this.ctx.lineTo(x + size - offsetBottom, y + size);
        this.ctx.stroke();
    }

    drawRightArrow(x: number, centerY: number, arrowLength: number, arrowWidth: number): void {
        this.ctx.moveTo(x, centerY - arrowWidth/2);
        this.ctx.lineTo(x + arrowLength, centerY - arrowWidth/2);
        this.ctx.lineTo(x + arrowLength, centerY + arrowWidth/2);
        this.ctx.lineTo(x, centerY + arrowWidth/2);
        this.ctx.lineTo(x, centerY - arrowWidth/2);
    }

    drawLeftArrow(x: number, centerY: number, arrowLength: number, arrowWidth: number, size: number): void {
        this.ctx.moveTo(x + size, centerY - arrowWidth/2);
        this.ctx.lineTo(x + size - arrowLength, centerY - arrowWidth/2);
        this.ctx.lineTo(x + size - arrowLength, centerY + arrowWidth/2);
        this.ctx.lineTo(x + size, centerY + arrowWidth/2);
        this.ctx.lineTo(x + size, centerY - arrowWidth/2);
    }

    drawDownArrow(centerX: number, y: number, arrowLength: number, arrowWidth: number): void {
        this.ctx.moveTo(centerX - arrowWidth/2, y);
        this.ctx.lineTo(centerX - arrowWidth/2, y + arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y);
        this.ctx.lineTo(centerX - arrowWidth/2, y);
    }

    drawUpArrow(centerX: number, y: number, arrowLength: number, arrowWidth: number, size: number): void {
        this.ctx.moveTo(centerX - arrowWidth/2, y + size);
        this.ctx.lineTo(centerX - arrowWidth/2, y + size - arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + size - arrowLength);
        this.ctx.lineTo(centerX + arrowWidth/2, y + size);
        this.ctx.lineTo(centerX - arrowWidth/2, y + size);
    }

    drawFood(foods: FoodItem[]): void {
        foods.forEach(food => {
            this.ctx.fillStyle = this.foodColors[food.type];
            this.ctx.fillRect(
                food.x * this.config.gridSize,
                food.y * this.config.gridSize,
                this.config.gridSize - 2,
                this.config.gridSize - 2
            );
        });
    }

    drawGameOver(score: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    drawCountdown(count: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(count.toString(), this.canvas.width / 2, this.canvas.height / 2);
    }
} 