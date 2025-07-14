import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';

class TeamControls extends LitElement {
    static get properties() {
        return {
            team: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            gameState: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            gameService: { type: Object },
            isAdmin: { type: Boolean },
            canControl: { type: Boolean },
            localGuess: { type: Number, state: true },
            localBet: { type: Boolean, state: true },
            submitting: { type: Boolean, state: true },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .team-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 20px;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .team-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            }
            
            .team-card.disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .team-card.can-control {
                border-color: rgba(76, 175, 80, 0.5);
                background: rgba(76, 175, 80, 0.1);
            }
            
            .team-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .team-name {
                font-size: 1.2rem;
                font-weight: bold;
                color: white;
                margin: 0;
                flex: 1;
            }
            
            .team-name.editable {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                padding: 6px 10px;
                min-width: 120px;
            }
            
            .team-name.editable:focus {
                outline: none;
                border-color: #4caf50;
                background: rgba(255, 255, 255, 0.2);
            }
            
            .team-score {
                font-size: 1.1rem;
                font-weight: bold;
                color: #4caf50;
                background: rgba(76, 175, 80, 0.2);
                padding: 4px 12px;
                border-radius: 20px;
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .controls-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .guess-controls {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .control-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: white;
                margin-bottom: 8px;
                display: block;
            }
            
            .year-input-container {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .year-buttons {
                display: flex;
                gap: 4px;
            }
            
            .year-button {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .year-button:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .year-button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .year-slider {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
                transition: background 0.3s ease;
                -webkit-appearance: none;
                appearance: none;
            }
            
            .year-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #4caf50;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
            }
            
            .year-slider::-webkit-slider-thumb:hover {
                background: #66bb6a;
                transform: scale(1.1);
            }
            
            .year-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #4caf50;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            }
            
            .year-display {
                font-size: 1.3rem;
                font-weight: bold;
                color: white;
                min-width: 60px;
                text-align: center;
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .betting-section {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
            }
            
            .betting-info {
                flex: 1;
            }
            
            .betting-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: #ffb74d;
                margin-bottom: 4px;
            }
            
            .betting-description {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.3;
            }
            
            .bet-toggle {
                position: relative;
                width: 60px;
                height: 34px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 17px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-left: 12px;
            }
            
            .bet-toggle.active {
                background: #ff9800;
            }
            
            .bet-toggle:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .bet-toggle::after {
                content: '';
                position: absolute;
                top: 3px;
                left: 3px;
                width: 28px;
                height: 28px;
                background: white;
                border-radius: 50%;
                transition: transform 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .bet-toggle.active::after {
                transform: translateX(26px);
            }
            
            .submit-button {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(135deg, #4caf50, #66bb6a);
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .submit-button:hover:not(:disabled) {
                background: linear-gradient(135deg, #45a049, #5cb85c);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            }
            
            .submit-button:disabled {
                background: rgba(255, 255, 255, 0.2);
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .submit-button.submitting {
                background: #2196f3;
            }
            
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .current-guess {
                background: rgba(33, 150, 243, 0.2);
                border: 1px solid rgba(33, 150, 243, 0.5);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                color: white;
            }
            
            .guess-display {
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 4px;
            }
            
            .guess-meta {
                font-size: 0.8rem;
                opacity: 0.8;
            }
            
            .bet-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                color: #ff9800;
                font-weight: bold;
            }
            
            .readonly-indicator {
                background: rgba(158, 158, 158, 0.2);
                border: 1px solid rgba(158, 158, 158, 0.5);
                border-radius: 6px;
                padding: 8px 12px;
                text-align: center;
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 12px;
            }
            
            @media (max-width: 768px) {
                .team-card {
                    padding: 16px;
                }
                
                .year-input-container {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .year-display {
                    font-size: 1.1rem;
                    min-width: auto;
                }
            }
        `;
    }
    
    constructor() {
        super();
        this.team = null;
        this.gameState = null;
        this.gameService = null;
        this.isAdmin = false;
        this.canControl = false;
        this.localGuess = 2000;
        this.localBet = false;
        this.submitting = false;
    }
    
    connectedCallback() {
        super.connectedCallback();
        this.updateLocalValues();
    }
    
    updated(changedProperties) {
        super.updated(changedProperties);
        
        if (changedProperties.has('team') || changedProperties.has('gameState')) {
            this.updateLocalValues();
            // Removed manual requestUpdate - Lit will auto-update when properties change
        }
    }
    
    updateLocalValues() {
        if (this.team) {
            this.localGuess = this.team.current_guess || 2000;
            this.localBet = this.team.has_bet || false;
        }
    }
    
    render() {
        if (!this.team) {
            return html`<div>Loading team...</div>`;
        }
        
        const canInteract = this.canControl && this.gameState?.round_active;
        const hasSubmittedGuess = this.team.current_guess !== null;
        
        return html`
            <div class="team-card ${canInteract ? 'can-control' : ''} ${!canInteract ? 'disabled' : ''}">
                ${this.renderTeamHeader()}
                
                ${canInteract ? 
                    this.renderControls() : 
                    this.renderReadOnlyView(hasSubmittedGuess)
                }
            </div>
        `;
    }
    
    renderTeamHeader() {
        // Only allow editing before first round or when no game is active
        const isEditable = this.canControl && this.isAdmin && 
                          (!this.gameState?.active || this.gameState?.current_round === 0);
        
        return html`
            <div class="team-header">
                ${isEditable ? html`
                    <input 
                        type="text" 
                        class="team-name editable"
                        .value=${this.team.name}
                        @change=${this.handleNameChange}
                        @keydown=${this.handleNameKeydown}
                        placeholder="Team Name"
                    />
                ` : html`
                    <h3 class="team-name">${this.team.name}</h3>
                `}
                
                <div class="team-score">${this.team.score} pts</div>
            </div>
        `;
    }
    
    renderControls() {
        return html`
            <div class="controls-section">
                <div class="guess-controls">
                    <label class="control-label">Year Guess</label>
                    
                    <div class="year-input-container">
                        <div class="year-buttons">
                            <button 
                                class="year-button"
                                @click=${() => this.adjustYear(-10)}
                                ?disabled=${this.submitting}
                            >-10</button>
                            <button 
                                class="year-button"
                                @click=${() => this.adjustYear(-1)}
                                ?disabled=${this.submitting}
                            >-1</button>
                        </div>
                        
                        <input 
                            type="range"
                            class="year-slider"
                            min="1950"
                            max="2030"
                            .value=${this.localGuess}
                            @input=${this.handleYearChange}
                            ?disabled=${this.submitting}
                        />
                        
                        <div class="year-buttons">
                            <button 
                                class="year-button"
                                @click=${() => this.adjustYear(1)}
                                ?disabled=${this.submitting}
                            >+1</button>
                            <button 
                                class="year-button"
                                @click=${() => this.adjustYear(10)}
                                ?disabled=${this.submitting}
                            >+10</button>
                        </div>
                        
                        <div class="year-display">${this.localGuess}</div>
                    </div>
                </div>
                
                <div class="betting-section">
                    <div class="betting-info">
                        <div class="betting-label">💰 All-or-Nothing Bet</div>
                        <div class="betting-description">
                            Double your points for exact year, zero for wrong
                        </div>
                    </div>
                    
                    <button 
                        class="bet-toggle ${this.localBet ? 'active' : ''}"
                        @click=${this.toggleBet}
                        ?disabled=${this.submitting}
                        title="${this.localBet ? 'Remove bet' : 'Place bet'}"
                    ></button>
                </div>
                
                <button 
                    class="submit-button ${this.submitting ? 'submitting' : ''}"
                    @click=${this.submitGuess}
                    ?disabled=${this.submitting}
                >
                    ${this.submitting ? html`
                        <div style="display: flex; align-items: center; justify-content: center;">
                            <div class="loading-spinner"></div>
                            Submitting...
                        </div>
                    ` : html`
                        Submit Guess
                    `}
                </button>
            </div>
        `;
    }
    
    renderReadOnlyView(hasSubmittedGuess) {
        if (hasSubmittedGuess) {
            return html`
                <div class="current-guess">
                    <div class="guess-display">
                        ${this.team.current_guess}
                        ${this.team.has_bet ? html`
                            <span class="bet-indicator">💰 BET PLACED</span>
                        ` : ''}
                    </div>
                    <div class="guess-meta">
                        Guess submitted for this round
                    </div>
                </div>
            `;
        }
        
        if (!this.canControl) {
            return html`
                <div class="readonly-indicator">
                    ${this.gameState?.round_active ? 
                        'Waiting for team to submit guess...' : 
                        'No guess submitted this round'
                    }
                </div>
            `;
        }
        
        return html`
            <div class="readonly-indicator">
                Round not active
            </div>
        `;
    }
    
    adjustYear(delta) {
        const newYear = Math.max(1950, Math.min(2030, this.localGuess + delta));
        this.localGuess = newYear;
    }
    
    handleYearChange(event) {
        this.localGuess = parseInt(event.target.value);
    }
    
    toggleBet() {
        this.localBet = !this.localBet;
    }
    
    async handleNameChange(event) {
        const newName = event.target.value.trim();
        if (newName && newName !== this.team.name) {
            try {
                await this.gameService.updateTeamName(this.team.id, newName);
            } catch (error) {
                console.error('Failed to update team name:', error);
                // Reset the input value
                event.target.value = this.team.name;
            }
        }
    }
    
    handleNameKeydown(event) {
        if (event.key === 'Enter') {
            event.target.blur();
        }
    }
    
    async submitGuess() {
        if (this.submitting || !this.gameService) {
            return;
        }
        
        try {
            this.submitting = true;
            
            await this.gameService.submitGuess(
                this.team.id,
                this.localGuess,
                this.localBet
            );
            
            // Show success feedback
            this.showSuccessFeedback();
            
        } catch (error) {
            console.error('Failed to submit guess:', error);
            this.showErrorFeedback(error.message);
        } finally {
            this.submitting = false;
        }
    }
    
    showSuccessFeedback() {
        // Could add a toast notification or temporary visual feedback
        const button = this.shadowRoot.querySelector('.submit-button');
        if (button) {
            button.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
            button.textContent = 'Submitted!';
            
            setTimeout(() => {
                if (button) {
                    button.textContent = 'Submit Guess';
                    button.style.background = '';
                }
            }, 2000);
        }
    }
    
    showErrorFeedback(message) {
        // Could show error toast or temporary message
        const button = this.shadowRoot.querySelector('.submit-button');
        if (button) {
            button.style.background = 'linear-gradient(135deg, #f44336, #e57373)';
            button.textContent = 'Error - Try Again';
            
            setTimeout(() => {
                if (button) {
                    button.textContent = 'Submit Guess';
                    button.style.background = '';
                }
            }, 3000);
        }
    }
}

customElements.define('team-controls', TeamControls);