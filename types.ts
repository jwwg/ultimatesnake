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

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: CardSuit;
    rank: CardRank;
}

export interface Hand {
    cards: Card[];
    maxSize: number;
}

export interface FoodItem extends Position {
    createdAt: number;
    suit: CardSuit;
    rank: CardRank;
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