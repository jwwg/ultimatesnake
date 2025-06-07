import { POKER_HANDS } from '../config.js';

export function initializeHelpDialog() {
    const helpDialog = document.getElementById('helpDialog');
    const helpIcon = document.getElementById('helpIcon');
    const closeHelpDialog = document.getElementById('closeHelpDialog');

    if (!helpDialog || !helpIcon || !closeHelpDialog) {
        console.error('Help dialog elements not found');
        return;
    }

    helpIcon.addEventListener('click', () => {
        helpDialog.classList.add('show');
    });

    closeHelpDialog.addEventListener('click', () => {
        helpDialog.classList.remove('show');
    });

    // Generate poker hands list
    const pokerHandsList = document.getElementById('pokerHandsList');
    if (!pokerHandsList) {
        console.error('Poker hands list element not found');
        return;
    }

    // Clear any existing content
    pokerHandsList.innerHTML = '';

    // Add the poker hands
    POKER_HANDS.forEach(hand => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${formatHandType(hand.type)} <span class="points">${hand.score} pts</span> 
            <div class="card-example">${formatCardExample(hand.example)}</div>
        `;
        pokerHandsList.appendChild(li);
    });
}

function formatHandType(type: string): string {
    return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatCardExample(example: string): string {
    return example.split(' ').map(card => {
        const [value, suit] = card.split('');
        const suitClass = getSuitClass(suit);
        return `${value}<span class="${suitClass}">${suit}</span>`;
    }).join(' ');
}

function getSuitClass(suit: string): string {
    switch (suit) {
        case '♠': return 'spade';
        case '♥': return 'heart';
        case '♦': return 'diamond';
        case '♣': return 'club';
        default: return '';
    }
} 