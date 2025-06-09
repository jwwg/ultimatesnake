# Poker Serpent

Snake has evolved and is now playing poker.

## Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository
3. Install dependencies:
```bash
npm install
```
4. Start the Vite development server:
```bash
npm run dev
```
5. Open your browser and navigate to `http://localhost:5173`

## Game Rules

### Basic Controls
- Use arrow keys to control the snake's direction
- Collect cards to grow your snake and build poker hands
- Avoid colliding with your own body
- Game ends after completing 5 poker hands

### Card Collection
- Collecting a card:
  - Grows your snake by one segment
  - Adds the card to your hand
  - Increases your score based on the card's rank (A=14, K=13, Q=12, J=11, 10-2=face value)
  - Cards disappear after 10 seconds if not collected
  - Watch for the pulsing effect on cards that are about to expire

### Poker Hands
- Your hand can hold up to 5 cards
- When your hand is full, it's automatically evaluated for poker hands
- Hand Requirements:
  - Royal Flush: A, K, Q, J, 10 of the same suit
  - Straight Flush: Five consecutive cards of the same suit
  - Four of a Kind: Four cards of the same rank
  - Full House: Three of a kind plus a pair
  - Flush: Five cards of the same suit
  - Straight: Five consecutive cards of any suit
  - Three of a Kind: Three cards of the same rank
  - Two Pair: Two different pairs
  - Pair: Two cards of the same rank
  - High Card: Highest card when no other hand is made

### Scoring System
- Base score from card ranks
- Bonus points for poker hands
- Length bonus (0.5 points per segment)
- High scores are tracked and displayed

### Game Over Conditions
The game ends when:
- Your snake collides with itself (unless in ram mode)
- The snake's head goes off the screen
- You complete 5 poker hands

### Tips for Success
- Collect cards quickly before they expire
- Use the ram ability strategically to cut off unwanted segments
- Plan your path to maximize poker hand possibilities
- Watch for the pulsing effect on cards that are about to expire
- Balance between collecting cards and building poker hands
- Use special cards (Ace and Diamonds) strategically

## TODO
- animate on hand complete



