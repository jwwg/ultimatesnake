import { Position, Direction, SnakeSegment, FoodItem, GameConfig, CardSuit, CardRank, SegmentType, Hand, Card, PokerHandAnimation, PokerHandType, Arrow, ExplosionAnimation } from './types.js';

export class SnakeRenderer {
    readonly cardColors = {
        hearts: '#ff0000',
        diamonds: '#ff0000',
        clubs: '#000000',
        spades: '#000000'
    } as const;

    readonly segmentColors = {
        normal: '#4CAF50',
        ram: '#0000ff',
        speedy: '#ffa500',
        head: '#45a049'
    } as const;

    private destructionAnimations: { segment: SnakeSegment; startTime: number }[] = [];
    private readonly destructionDuration = 2000; // Animation duration in milliseconds (2 seconds)
    readonly tileCount: { x: number; y: number };

    constructor(
        readonly canvas: HTMLCanvasElement,
        readonly ctx: CanvasRenderingContext2D,
        readonly config: GameConfig
    ) {
        this.tileCount = {
            x: Math.floor(this.canvas.width / this.config.gridSize),
            y: Math.floor((this.canvas.height - 150) / this.config.gridSize)
        };
    }

    draw(
        snake: SnakeSegment[],
        foods: FoodItem[],
        isGameOver: boolean,
        hand: Hand,
        pokerHandAnimations: PokerHandAnimation[],
        arrows: Arrow[],
        explosionAnimations: ExplosionAnimation[],
        multiplierExponent: number
    ): void {
        if (isGameOver) return;

        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid border
        const gridWidth = this.tileCount.x * this.config.gridSize;
        const gridHeight = this.tileCount.y * this.config.gridSize;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, gridWidth, gridHeight);

        this.drawSnake(snake);
        this.drawFood(foods);
        this.drawDestructionAnimations();
        this.drawPokerHandAnimations(pokerHandAnimations);
        this.drawArrows(arrows);
        this.drawExplosionAnimations(explosionAnimations);
        this.drawHand(hand);
        this.drawLengthMultiplier(snake.length, multiplierExponent);
    }

    private drawArrows(arrows: Arrow[]): void {
        this.ctx.save();
        arrows.forEach(arrow => {
            // Draw arrow body (line)
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#FFFF00';
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(arrow.x, arrow.y + arrow.height / 2);
            this.ctx.lineTo(arrow.x + arrow.width - 15, arrow.y + arrow.height / 2);
            this.ctx.stroke();

            // Draw arrow head (triangle)
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.moveTo(arrow.x + arrow.width, arrow.y + arrow.height / 2);
            this.ctx.lineTo(arrow.x + arrow.width - 15, arrow.y + arrow.height / 2 - 7);
            this.ctx.lineTo(arrow.x + arrow.width - 15, arrow.y + arrow.height / 2 + 7);
            this.ctx.closePath();
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    private drawLengthMultiplier(snakeLength: number, multiplierExponent: number): void {
        const multiplier = Math.pow(this.config.scoreLengthMultiplier * snakeLength, multiplierExponent);
        this.ctx.fillStyle = '#ffff00'; // Bright yellow
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`x${multiplier.toFixed(2)}`, this.canvas.width - 10, 10);
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
        // Set up nextSegment references
        for (let i = 0; i < snake.length - 1; i++) {
            snake[i].nextSegment = snake[i + 1];
        }
        snake[snake.length - 1].nextSegment = undefined;

        snake.forEach(segment => {
            const x = segment.x * this.config.gridSize;
            const y = segment.y * this.config.gridSize;
            const size = this.config.gridSize - 2;
            
            if (segment.type === 'head')
                this.drawSnakeHead(segment, x, y, size);
            else
                this.drawSnakeBody(segment, x, y, size);
            
            //if (segment.lastDirection)
            //    this.drawDirectionLines(segment, x, y, size);
        });
    }

    drawSnakeHead(segment: SnakeSegment, x: number, y: number, size: number): void {
        if (segment.type === 'ram')
            this.drawRamHead(segment, x, y, size);
        else {
            this.ctx.fillStyle = this.segmentColors[segment.type];
            this.ctx.fillRect(x, y, size, size);

            // Draw connecting line to next segment if it exists
            if (segment.nextSegment) {
                const nextX = segment.nextSegment.x * this.config.gridSize;
                const nextY = segment.nextSegment.y * this.config.gridSize;
                const nextCenterX = nextX + size/2;
                const nextCenterY = nextY + size/2;
                const centerX = x + size/2;
                const centerY = y + size/2;

                // Calculate the shortest path considering wrapping
                let dx = nextCenterX - centerX;
                let dy = nextCenterY - centerY;

                // Check if we need to wrap horizontally
                if (Math.abs(dx) > this.canvas.width / 2) {
                    dx = dx > 0 ? dx - this.canvas.width : dx + this.canvas.width;
                }

                // Check if we need to wrap vertically
                if (Math.abs(dy) > this.canvas.height / 2) {
                    dy = dy > 0 ? dy - this.canvas.height : dy + this.canvas.height;
                }

                this.ctx.strokeStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX + dx, centerY + dy);
                this.ctx.stroke();
            }
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
            const segmentSize = size * this.config.segmentScale;
            const offset = (size - segmentSize) / 2;
            this.ctx.fillStyle = this.segmentColors.speedy;
            this.ctx.fillRect(x + offset, y + offset, segmentSize, segmentSize);
        } else {
            const segmentSize = size * this.config.segmentScale;
            const offset = (size - segmentSize) / 2;
            this.ctx.fillStyle = this.segmentColors[segment.type];
            this.ctx.fillRect(x + offset, y + offset, segmentSize, segmentSize);

            // Draw connecting line to next segment if it exists
            if (segment.nextSegment) {
                const nextX = segment.nextSegment.x * this.config.gridSize;
                const nextY = segment.nextSegment.y * this.config.gridSize;
                const nextCenterX = nextX + size/2;
                const nextCenterY = nextY + size/2;
                const centerX = x + size/2;
                const centerY = y + size/2;

                // Calculate the shortest path considering wrapping
                let dx = nextCenterX - centerX;
                let dy = nextCenterY - centerY;

                // Check if we need to wrap horizontally
                if (Math.abs(dx) > this.canvas.width / 2) {
                    dx = dx > 0 ? dx - this.canvas.width : dx + this.canvas.width;
                }

                // Check if we need to wrap vertically
                if (Math.abs(dy) > this.canvas.height / 2) {
                    dy = dy > 0 ? dy - this.canvas.height : dy + this.canvas.height;
                }

                this.ctx.strokeStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX + dx, centerY + dy);
                this.ctx.stroke();
            }
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
        const currentTime = Date.now();
        foods.forEach(food => {
            const timeLeft = this.config.foodExpirationTime - (currentTime - food.createdAt);
            const isExpiring = timeLeft < 2000;
            
            // Calculate pulsing effect for expiring food
            const pulseIntensity = isExpiring ? 
                Math.sin(currentTime / 100) * 0.3 + 0.7 : // Pulse between 0.4 and 1.0
                1;

            const x = food.x * this.config.gridSize;
            const y = food.y * this.config.gridSize;
            const size = this.config.gridSize - 2;

            // Draw card background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = pulseIntensity;
            this.ctx.fillRect(x, y, size, size);
            this.ctx.globalAlpha = 1;

            // Draw card border
            this.ctx.strokeStyle = this.cardColors[food.suit];
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);

            // Draw card content
            this.ctx.fillStyle = this.cardColors[food.suit];
            this.ctx.font = `${size * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(food.rank, x + size / 2, y + size * 0.3);
            
            // Draw suit symbol
            const suitSymbol = this.getSuitSymbol(food.suit);
            this.ctx.font = `${size * 0.5}px Arial`;
            this.ctx.fillText(suitSymbol, x + size / 2, y + size * 0.7);
        });
    }

    private getSuitSymbol(suit: CardSuit): string {
        switch (suit) {
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            case 'spades': return '♠';
        }
    }

    drawHand(hand: Hand): void {
        const cardWidth = 60;
        const cardHeight = 90;
        const padding = 10;
        const startX = (this.canvas.width - (cardWidth * hand.maxSize + padding * (hand.maxSize - 1))) / 2;
        const startY = this.tileCount.y * this.config.gridSize + 20; // Position hand below the grid

        // Draw poker table green background
        this.ctx.fillStyle = '#35654d'; // Classic poker table green
        this.ctx.fillRect(0, startY - 10, this.canvas.width, cardHeight + 40);

        // Draw last hand score if available
        if (hand.lastHandScore) {
            this.drawHandScoreDetails(hand.lastHandScore, 10, startY - 5, 'left', '#ffffff');
        }

        // Draw highest hand score if available
        if (hand.highestHandScore) {
            const currentTime = Date.now();
            const timeSinceSet = currentTime - hand.highestHandScore.setAt;
            const flashDuration = 1000; // 1 second
            
            let flashIntensity = 0;
            if (timeSinceSet < flashDuration) {
                flashIntensity = Math.sin(currentTime / 100) * 0.5 + 0.5; // Oscillate between 0 and 1
            }
            
            // Create a gradient between white and yellow based on flash intensity
            const flashColor = `rgb(255, ${255 - Math.floor(flashIntensity * 100)}, ${255 - Math.floor(flashIntensity * 100)})`;
            this.drawHandScoreDetails(hand.highestHandScore, this.canvas.width - 10, startY - 5, 'right', flashColor);
        }

        // Draw hand info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Hand: ${hand.cards.length}/${hand.maxSize} cards`, 10, startY + cardHeight + 15);

        // Draw each card in the hand
        hand.cards.forEach((card, index) => {
            const x = startX + (cardWidth + padding) * index;
            const y = startY;

            // Draw card background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Draw card content
            this.ctx.fillStyle = this.cardColors[card.suit];
            
            // Draw rank in top-left
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(card.rank, x + 5, y + 5);

            // Draw suit symbol in center
            const suitSymbol = this.getSuitSymbol(card.suit);
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(suitSymbol, x + cardWidth/2, y + cardHeight/2);

            // Draw rank in bottom-right (upside down)
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(card.rank, x + cardWidth - 5, y + cardHeight - 5);

            // Draw card index
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Card ${index + 1}`, x + cardWidth/2, y + cardHeight + 15);
        });

        // Draw empty card slots
        for (let i = hand.cards.length; i < hand.maxSize; i++) {
            const x = startX + (cardWidth + padding) * i;
            const y = startY;

            // Draw empty slot with a darker green
            this.ctx.fillStyle = '#2d5540'; // Slightly darker green for empty slots
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Draw plus symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('+', x + cardWidth/2, y + cardHeight/2);

            // Draw slot number
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Empty ${i + 1}`, x + cardWidth/2, y + cardHeight + 15);
        }
    }

    private drawHandScoreDetails(
        score: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number },
        x: number,
        y: number,
        align: 'left' | 'right' | 'center',
        color: string
    ): void {
        this.ctx.fillStyle = color;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        
        const prefix = align === 'left' ? '' : align === 'right' ? 'Highest ' : 'Best ';
        this.ctx.fillText(`${prefix}Hand Score:`, x, y);
        this.ctx.fillText(`Hand Type: ${score.type.replace('_', ' ').toUpperCase()}`, x, y + 20);
        this.ctx.fillText(`Base Score: ${score.baseScore}`, x, y + 40);
        this.ctx.fillText(`Length Multiplier: ${score.lengthMultiplier}`, x, y + 60);
        this.ctx.fillText(`Final Score: ${score.finalScore}`, x, y + 80);
    }

    drawGameOver(score: number, highestHandScore?: { type: PokerHandType; baseScore: number; lengthMultiplier: number; finalScore: number }): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 60);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);

        if (highestHandScore) {
            this.drawHandScoreDetails(
                highestHandScore,
                this.canvas.width / 2,
                this.canvas.height / 2 + 20,
                'center',
                '#ffffff'
            );
        }
    }

    drawCountdown(count: number): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(count.toString(), this.canvas.width / 2, this.canvas.height / 2);
    }

    drawPaused(): void {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press P or click Pause to resume', this.canvas.width / 2, this.canvas.height / 2 + 10);
    }

    drawPokerHandAnimations(pokerHandAnimations: PokerHandAnimation[]): void {
        const currentTime = Date.now();
        pokerHandAnimations.forEach(anim => {
            const elapsed = currentTime - anim.startTime;
            const progress = elapsed / 5000; // 5 seconds total
            if (progress >= 1) return;

            // Calculate position and opacity with smoother movement
            const y = anim.y - (progress * progress * 20); // Quadratic movement for smoother animation
            const opacity = 1 - (progress * progress); // Quadratic fade for smoother transition
            
            // Draw background with larger size
            const padding = 10;
            const width = this.config.gridSize * 2.5;
            const height = this.config.gridSize * 1.5;
            this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.8})`;
            this.ctx.fillRect(
                anim.x * this.config.gridSize - width/2,
                y * this.config.gridSize - height/2,
                width,
                height
            );

            // Draw text with larger font
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Draw hand type
            this.ctx.fillText(
                anim.type.replace('_', ' ').toUpperCase(),
                (anim.x + 0.5) * this.config.gridSize,
                y * this.config.gridSize
            );
            
            // Draw score with larger font
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(
                `+${anim.score}`,
                (anim.x + 0.5) * this.config.gridSize,
                y * this.config.gridSize + this.config.gridSize * 0.4
            );
        });
    }

    private drawExplosionAnimations(explosions: ExplosionAnimation[]): void {
        const now = Date.now();
        explosions.forEach(explosion => {
            const age = now - explosion.startTime;
            const progress = age / 1000; // 1 second duration
            
            explosion.particles.forEach(particle => {
                const x = explosion.x + particle.x + (particle.vx * age * 0.1);
                const y = explosion.y + particle.y + (particle.vy * age * 0.1);
                const size = 3 * (1 - progress);
                
                this.ctx.save();
                this.ctx.globalAlpha = 1 - progress;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });
        });
    }
} 