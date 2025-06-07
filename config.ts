import { GameConfig } from './types';
import { POKER_HAND_SCORES } from './PokerHandEvaluator.js';
import { PokerHandType } from './types.js';

export interface PokerHandInfo {
    type: PokerHandType;
    score: number;
    example: string;
}

export const POKER_HANDS: PokerHandInfo[] = [
    {
        type: 'pair',
        score: POKER_HAND_SCORES.pair,
        example: 'A♠ A♥'
    },
    {
        type: 'two_pair',
        score: POKER_HAND_SCORES.two_pair,
        example: 'K♠ K♥ Q♦ Q♣'
    },
    {
        type: 'three_of_a_kind',
        score: POKER_HAND_SCORES.three_of_a_kind,
        example: 'J♠ J♥ J♦'
    },
    {
        type: 'straight',
        score: POKER_HAND_SCORES.straight,
        example: '5♠ 6♥ 7♦ 8♣ 9♠'
    },
    {
        type: 'flush',
        score: POKER_HAND_SCORES.flush,
        example: '2♠ 5♠ 7♠ 9♠ K♠'
    },
    {
        type: 'full_house',
        score: POKER_HAND_SCORES.full_house,
        example: '8♠ 8♥ 8♦ 2♣ 2♥'
    },
    {
        type: 'four_of_a_kind',
        score: POKER_HAND_SCORES.four_of_a_kind,
        example: '4♠ 4♥ 4♦ 4♣'
    },
    {
        type: 'straight_flush',
        score: POKER_HAND_SCORES.straight_flush,
        example: '10♠ J♠ Q♠ K♠ A♠'
    },
    {
        type: 'royal_flush',
        score: POKER_HAND_SCORES.royal_flush,
        example: '10♠ J♠ Q♠ K♠ A♠'
    }
];

export const defaultConfig: GameConfig = {
    gridSize: 40,
    segmentScale: 0.5,
    maxFoodItems: 5,
    minFoodInterval: 500,
    maxFoodInterval: 2000,
    initialSpeed: 200,
    minSpeed: 50,
    speedDecrease: 0,
    scorePerFood: 1, //just picking up cards shouldn't be worth much
    ramRewardMultiplier: 25, //should be high, so that its worth cutting off segments
    scoreLengthMultiplier: 0.5, //should be significantly less than ramRewardMultiplier
    foodExpirationTime: 10000, // Food disappears after 10 seconds
    initialSnakeLength: 2, // Initial number of snake segments
    arrowSpeed: 5, // Speed of the arrow moving across the screen
    arrowWidth: 40, // Width of the arrow
    arrowHeight: 20, // Height of the arrow
    maxMultiplierExponent: 10, // Maximum value for the multiplier exponent
    multiplierDeductionRate: 0.1 // Rate at which the multiplier deduction increases per second
}; 