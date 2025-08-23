export interface Position {
    x: number;
    y: number;
}

export interface Direction {
    x: number;
    y: number;
}

export type SegmentType = 'normal' | 'ram' | 'speedy' | 'head';

export interface SnakeSegment extends Position {
    type: SegmentType;
    age?: number;
    lastDirection?: Direction;
    convergence?: number;
    nextSegment?: SnakeSegment;
}

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';

export interface Card {
    suit: CardSuit;
    rank: CardRank;
}

export interface Hand {
    cards: Card[];
    maxSize: number;
    lastHandScore?: {
        type: PokerHandType;
        baseScore: number;
        lengthMultiplier: number;
        finalScore: number;
        cards: Card[];
    };
    highestHandScore?: {
        type: PokerHandType;
        baseScore: number;
        lengthMultiplier: number;
        finalScore: number;
        setAt: number;
        cards: Card[];
    };
}

export interface FoodItem extends Position {
    createdAt: number;
    suit: CardSuit;
    rank: CardRank;
}

export interface Bird extends Position {
    speed: number;
    width: number;
    height: number;
}

export interface GameConfig {
    gridSize: number;
    segmentScale: number;
    maxFoodItems: number;
    minFoodInterval: number;
    maxFoodInterval: number;
    initialSpeed: number;
    minSpeed: number;
    speedDecrease: number;
    scorePerFood: number;
    ramRewardMultiplier: number;
    scoreLengthMultiplier: number;
    foodExpirationTime: number;
    initialSnakeLength: number;
    birdSpeed: number;
    birdWidth: number;
    birdHeight: number;
    maxMultiplierExponent: number;
    multiplierDeductionRate: number;
}

export type PokerHandType = 
    | 'royal_flush'
    | 'straight_flush'
    | 'four_of_a_kind'
    | 'full_house'
    | 'flush'
    | 'straight'
    | 'three_of_a_kind'
    | 'two_pair'
    | 'pair'
    | 'high_card';

export interface PokerHandScore {
    type: PokerHandType;
    score: number;
    cards: Card[];
}

export interface PokerHandAnimation {
    type: PokerHandType;
    score: number;
    x: number;
    y: number;
    startTime: number;
}

export interface ExplosionAnimation {
    x: number;
    y: number;
    startTime: number;
    particles: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        color: string;
    }[];
}

export interface CardDrawAnimation {
    card: Card;
    startTime: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
}

export interface FoodSpawnAnimation {
    food: FoodItem;
    startTime: number;
    duration: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface GameState {
    score: number;
    hand: Hand;
    isGameOver: boolean;
    isWaiting: boolean;
    isPaused: boolean;
    lastHandScore?: {
        type: PokerHandType;
        baseScore: number;
        lengthMultiplier: number;
        finalScore: number;
    };
    highestHandScore?: {
        type: PokerHandType;
        baseScore: number;
        lengthMultiplier: number;
        finalScore: number;
        setAt: number;
    };
    pokerHandAnimations: PokerHandAnimation[];
    multiplierExponent: number;
    explosionAnimations: ExplosionAnimation[];
    cardDrawAnimations: CardDrawAnimation[];
    foodSpawnAnimations: FoodSpawnAnimation[];
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlockedAt?: number;
} 