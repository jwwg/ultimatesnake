export interface JokerOption {
    id: string;
    title: string;
    description: string;
}

export class JokerDialog {
    private dialog: HTMLDivElement | null = null;
    private resolvePromise: ((option: JokerOption) => void) | null = null;
    private escapeHandler: ((event: KeyboardEvent) => void) | null = null;
    private optionButtons: HTMLButtonElement[] = [];
    private selectedIndex: number = 0;

    showJokerDialog(lastCard: { suit: string; rank: string } | null, availableOptions?: { sameSuit: boolean; rankPlusOne: boolean; reshuffle: boolean }): Promise<JokerOption> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.createDialog(lastCard, availableOptions);
        });
    }

    private createDialog(lastCard: { suit: string; rank: string } | null, availableOptions?: { sameSuit: boolean; rankPlusOne: boolean; reshuffle: boolean }): void {
        // Remove existing dialog if any
        this.removeDialog();

        // Reset state
        this.optionButtons = [];
        this.selectedIndex = 0;

        // Create dialog container
        this.dialog = document.createElement('div');
        this.dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        // Create dialog content
        const content = document.createElement('div');
        content.style.cssText = `
            background-color: #2c3e50;
            border: 3px solid #ff6b35;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'JOKER !';
        title.style.cssText = `
            color: #ff6b35;
            margin: 0 0 20px 0;
            font-size: 28px;
            font-weight: bold;
        `;
        content.appendChild(title);

        // Create description
        const description = document.createElement('p');
        description.textContent = 'Choose one:';
        description.style.cssText = `
            margin: 0 0 25px 0;
            font-size: 18px;
            color: #ecf0f1;
        `;
        content.appendChild(description);

        // Create options
        const options: JokerOption[] = [
            {
                id: 'same-suit',
                title: 'Same Suit',
                description: lastCard && lastCard.suit !== 'joker' ? `Add a card of ${lastCard.suit} suit` : 'Add a card of the same suit as your last card'
            },
            {
                id: 'rank-plus-one',
                title: 'Rank + 1',
                description: lastCard && lastCard.suit !== 'joker' ? `Add a card with rank ${this.getNextRank(lastCard.rank)}` : 'Add a card with rank + 1 from your last card'
            },
            {
                id: 'reshuffle',
                title: 'Reshuffle',
                description: 'Put all cards back in the deck and shuffle'
            }
        ];

        const optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;

        options.forEach((option, index) => {
            const isAvailable = availableOptions ? 
                (option.id === 'same-suit' ? availableOptions.sameSuit :
                 option.id === 'rank-plus-one' ? availableOptions.rankPlusOne :
                 availableOptions.reshuffle) : true;
            
            const optionButton = document.createElement('button');
            optionButton.style.cssText = `
                background-color: ${isAvailable ? '#34495e' : '#2c3e50'};
                border: 2px solid ${isAvailable ? '#ff6b35' : '#7f8c8d'};
                border-radius: 10px;
                padding: 15px;
                color: ${isAvailable ? 'white' : '#95a5a6'};
                cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                transition: all 0.3s ease;
                font-size: 16px;
                text-align: left;
                opacity: ${isAvailable ? '1' : '0.6'};
            `;

            if (isAvailable) {
                optionButton.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; color: #ff6b35;">${option.title}</div>
                    <div style="font-size: 14px; color: #bdc3c7;">${option.description}</div>
                `;
                
                optionButton.addEventListener('mouseenter', () => {
                    this.setSelectedIndex(index);
                });

                optionButton.addEventListener('mouseleave', () => {
                    // Don't change selection on mouse leave to maintain keyboard focus
                });

                optionButton.addEventListener('click', () => {
                    this.selectOption(option);
                });

                // Add to buttons array for keyboard navigation
                this.optionButtons.push(optionButton);
            } else {
                // Add disabled text to the description
                optionButton.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; color: #95a5a6;">${option.title}</div>
                    <div style="font-size: 14px; color: #7f8c8d;">${option.description}</div>
                    <div style="font-size: 12px; color: #e74c3c; margin-top: 5px;">(Not available)</div>
                `;
            }

            optionsContainer.appendChild(optionButton);
        });

        content.appendChild(optionsContainer);

        // Add keyboard controls instruction
        const keyboardInstruction = document.createElement('div');
        keyboardInstruction.style.cssText = `
            margin-top: 20px;
            padding: 10px;
            background-color: #34495e;
            border-radius: 8px;
            font-size: 14px;
            color: #bdc3c7;
            border: 1px solid #ff6b35;
        `;
        keyboardInstruction.innerHTML = `
            <strong>Keyboard Controls:</strong><br>
            ↑↓ Arrow keys or W/S to navigate • Space to select
        `;
        content.appendChild(keyboardInstruction);

        this.dialog.appendChild(content);
        document.body.appendChild(this.dialog);

        // Add keyboard event listener
        this.escapeHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.selectOption(options[0]); // Default to first option
            } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
                event.preventDefault();
                this.moveSelection(-1);
            } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
                event.preventDefault();
                this.moveSelection(1);
            } else if (event.key === ' ') {
                event.preventDefault();
                const selectedOption = options[this.selectedIndex];
                if (selectedOption) {
                    this.selectOption(selectedOption);
                }
            }
        };
        document.addEventListener('keydown', this.escapeHandler);

        this.dialog.addEventListener('click', (event) => {
            if (event.target === this.dialog) {
                this.selectOption(options[0]); // Default to first option
            }
        });

        // Set initial selection
        this.updateSelection();
    }

    private moveSelection(direction: number): void {
        if (this.optionButtons.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex + direction + this.optionButtons.length) % this.optionButtons.length;
        this.updateSelection();
    }

    private setSelectedIndex(index: number): void {
        if (index >= 0 && index < this.optionButtons.length) {
            this.selectedIndex = index;
            this.updateSelection();
        }
    }

    private updateSelection(): void {
        this.optionButtons.forEach((button, index) => {
            if (index === this.selectedIndex) {
                button.style.backgroundColor = '#ff6b35';
                button.style.transform = 'scale(1.02)';
                button.style.borderColor = '#ff6b35';
            } else {
                button.style.backgroundColor = '#34495e';
                button.style.transform = 'scale(1)';
                button.style.borderColor = '#ff6b35';
            }
        });
    }

    private getNextRank(rank: string): string {
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const currentIndex = ranks.indexOf(rank);
        const nextIndex = (currentIndex + 1) % ranks.length;
        return ranks[nextIndex];
    }

    private selectOption(option: JokerOption): void {
        if (this.resolvePromise) {
            this.resolvePromise(option);
            this.resolvePromise = null;
        }
        this.removeDialog();
    }

    private removeDialog(): void {
        if (this.dialog) {
            // Remove escape key listener
            if (this.escapeHandler) {
                document.removeEventListener('keydown', this.escapeHandler);
                this.escapeHandler = null;
            }
            
            document.body.removeChild(this.dialog);
            this.dialog = null;
        }
    }
}
