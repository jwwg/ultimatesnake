import { PokerHandType } from '../types.js';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlockedAt?: number;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
    high_card: {
        id: 'high_card',
        title: 'High Card',
        description: 'Better than nothing'
    },
    royal_flush: {
        id: 'royal_flush',
        title: 'Royal Flush',
        description: 'Score your first Royal Flush'
    },
    straight_flush: {
        id: 'straight_flush',
        title: 'Straight Flush',
        description: 'Score your first Straight Flush'
    },
    four_of_a_kind: {
        id: 'four_of_a_kind',
        title: 'Four of a Kind',
        description: 'Score your first Four of a Kind'
    },
    full_house: {
        id: 'full_house',
        title: 'Full House',
        description: 'Score your first Full House'
    },
    flush: {
        id: 'flush',
        title: 'Flush',
        description: 'Score your first Flush'
    },
    straight: {
        id: 'straight',
        title: 'Straight',
        description: 'Score your first Straight'
    },
    three_of_a_kind: {
        id: 'three_of_a_kind',
        title: 'Three of a Kind',
        description: 'Score your first Three of a Kind'
    },
    two_pair: {
        id: 'two_pair',
        title: 'Two Pair',
        description: 'Score your first Two Pair'
    },
    pair: {
        id: 'pair',
        title: 'Pair',
        description: 'Score your first Pair'
    }
};

export class AchievementManager {
    private static readonly STORAGE_KEY = 'snake_achievements';
    private achievements: Record<string, Achievement>;
    private newlyUnlocked: Achievement[] = [];

    constructor() {
        this.achievements = this.loadAchievements();
    }

    private loadAchievements(): Record<string, Achievement> {
        const stored = localStorage.getItem(AchievementManager.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return { ...ACHIEVEMENTS };
    }

    private saveAchievements(): void {
        localStorage.setItem(AchievementManager.STORAGE_KEY, JSON.stringify(this.achievements));
    }

    checkAchievement(handType: PokerHandType): void {
        const achievement = this.achievements[handType];
        if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = Date.now();
            this.newlyUnlocked.push(achievement);
            this.saveAchievements();
        }
    }

    getNewlyUnlocked(): Achievement[] {
        return [...this.newlyUnlocked];
    }

    clearNewlyUnlocked(): void {
        this.newlyUnlocked = [];
    }

    getAllAchievements(): Achievement[] {
        return Object.values(this.achievements);
    }
}

export const achievementManager = new AchievementManager(); 