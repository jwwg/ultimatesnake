# Poker Serpent

A modern twist on the classic Snake game, combining elements of poker and strategic gameplay.

## Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm start
```
5. Open your browser and navigate to `http://localhost:3000`

## Game Rules

### Basic Controls
- Use arrow keys to control the snake's direction
- Collect cards to grow your snake and build poker hands
- Avoid colliding with your own body

### Card Collection
- Each food item is a playing card
- Collecting a card:
  - Grows your snake by one segment
  - Adds the card to your hand
  - Increases your score based on the card's rank (A=14, K=13, Q=12, J=11, 10-2=face value)
  - Cards disappear after 10 seconds if not collected

### Special Cards
- **Ace (A)**: Transforms your snake's head into a ram. When in ram mode, you can break through your own body, cutting off segments after the collision point and earning bonus points.
- **Diamonds (♦)**: Makes your snake's head speedy, increasing movement speed temporarily.

### Poker Hands
- Your hand can hold up to 5 cards
- When your hand is full, it's automatically evaluated for poker hands
- Scoring for poker hands:
  - Royal Flush: 1000 points
  - Straight Flush: 800 points
  - Four of a Kind: 700 points
  - Full House: 600 points
  - Flush: 500 points
  - Straight: 400 points
  - Three of a Kind: 300 points
  - Two Pair: 200 points
  - Pair: 100 points
  - High Card: 50 points

### Scoring
- Base score from card ranks
- Bonus points for poker hands
- Extra points for ram collisions (scales with segments cut off)
- Length bonus (0.5 points per segment)

### Game Over
The game ends when:
- Your snake collides with itself (unless in ram mode)
- The snake's head goes off the screen

## Tips
- Try to collect cards quickly before they expire
- Use the ram ability strategically to cut off unwanted segments
- Plan your path to maximize poker hand possibilities
- Watch for the pulsing effect on cards that are about to expire 



## TODO
- ~~end game after 5 hands~~
- ~~fix high score~~
- animate on hand complete
- ~~remove extra card texts~~
- clean up score header
- show cards used for hand in card detail summary
- rebalance scoring
- achievemebts
  - for each hand
  - for completing 5 hands
- help screen

