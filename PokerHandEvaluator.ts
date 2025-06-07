import { Card, CardRank, Hand, PokerHandScore, PokerHandType } from './types.js';

export const POKER_HAND_SCORES: Record<PokerHandType, number> = {
    royal_flush: 5120,
    straight_flush: 2560,
    four_of_a_kind: 1280,
    full_house: 640,
    flush: 320,
    straight: 160,
    three_of_a_kind: 80,
    two_pair: 40,
    pair: 20,
    high_card: 10
};

export class PokerHandEvaluator {
    evaluatePokerHand(hand: Hand): PokerHandScore {
        const cards = [...hand.cards];
        const ranks = cards.map(card => this.getCardValue(card.rank));
        const suits = cards.map(card => card.suit);
        
        // Sort cards by rank
        cards.sort((a, b) => this.getCardValue(b.rank) - this.getCardValue(a.rank));
        ranks.sort((a, b) => b - a);

        // Check for flush
        const isFlush = suits.every(suit => suit === suits[0]);

        // Check for straight
        const isStraight = ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] - 1);

        // Check for royal flush
        if (isFlush && isStraight && ranks[0] === 14) {
            return { type: 'royal_flush', score: POKER_HAND_SCORES.royal_flush, cards };
        }

        // Check for straight flush
        if (isFlush && isStraight) {
            return { type: 'straight_flush', score: POKER_HAND_SCORES.straight_flush, cards };
        }

        // Count occurrences of each rank
        const rankCounts = new Map<number, number>();
        ranks.forEach(rank => rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1));
        const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

        // Check for four of a kind
        if (counts[0] === 4) {
            return { type: 'four_of_a_kind', score: POKER_HAND_SCORES.four_of_a_kind, cards };
        }

        // Check for full house
        if (counts[0] === 3 && counts[1] === 2) {
            return { type: 'full_house', score: POKER_HAND_SCORES.full_house, cards };
        }

        // Check for flush
        if (isFlush) {
            return { type: 'flush', score: POKER_HAND_SCORES.flush, cards };
        }

        // Check for straight
        if (isStraight) {
            return { type: 'straight', score: POKER_HAND_SCORES.straight, cards };
        }

        // Check for three of a kind
        if (counts[0] === 3) {
            return { type: 'three_of_a_kind', score: POKER_HAND_SCORES.three_of_a_kind, cards };
        }

        // Check for two pair
        if (counts[0] === 2 && counts[1] === 2) {
            return { type: 'two_pair', score: POKER_HAND_SCORES.two_pair, cards };
        }

        // Check for pair
        if (counts[0] === 2) {
            return { type: 'pair', score: POKER_HAND_SCORES.pair, cards };
        }

        // High card
        return { type: 'high_card', score: POKER_HAND_SCORES.high_card, cards };
    }

    private getCardValue(rank: CardRank): number {
        switch (rank) {
            case 'A': return 14;
            case 'K': return 13;
            case 'Q': return 12;
            case 'J': return 11;
            default: return parseInt(rank);
        }
    }
} 