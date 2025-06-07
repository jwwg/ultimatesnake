import { POKER_HAND_SCORES } from '../PokerHandEvaluator.js';
import { PokerHandType } from '../types.js';

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