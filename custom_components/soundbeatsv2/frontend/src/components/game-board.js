import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';
import './team-controls.js';
import './song-reveal.js';

class GameBoard extends LitElement {
    static get properties() {
        return {
            gameState: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            isAdmin: { type: Boolean },
            userTeamId: { type: String },
            gameService: { type: Object },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
                height: 100%;
            }
            
            .game-board-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 20px;
                overflow: visible;
            }
            
            .round-info {
                background: rgba(0, 0, 0, 0.2);
                padding: 16px 24px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                text-align: center;
            }
            
            .round-title {
                font-size: 1.5rem;
                font-weight: bold;
                color: white;
                margin: 0 0 8px 0;
            }
            
            .round-subtitle {
                font-size: 1rem;
                color: rgba(255, 255, 255, 0.8);
                margin: 0;
            }
            
            .game-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
                overflow: visible;
            }
            
            .teams-section {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
            }
            
            .teams-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 16px;
                padding: 8px;
            }
            
            @media (max-width: 768px) {
                .teams-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .round-info {
                    padding: 12px 16px;
                }
                
                .round-title {
                    font-size: 1.3rem;
                }
            }
            
            .song-section {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                padding: 24px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                text-align: center;
            }
            
            .waiting-message {
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.1rem;
                text-align: center;
                padding: 40px 20px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .instructions {
                background: rgba(33, 150, 243, 0.2);
                border: 1px solid rgba(33, 150, 243, 0.5);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                color: white;
            }
            
            .instructions-title {
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .instructions-list {
                margin: 0;
                padding-left: 20px;
                line-height: 1.6;
            }
            
            .status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.8);
                margin-top: 8px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4caf50;
                animation: pulse 2s infinite;
            }
            
            .status-dot.waiting {
                background: #ff9800;
            }
            
            .status-dot.ended {
                background: #f44336;
                animation: none;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .admin-notice {
                background: rgba(156, 39, 176, 0.2);
                border: 1px solid rgba(156, 39, 176, 0.5);
                padding: 12px 16px;
                border-radius: 8px;
                color: white;
                text-align: center;
                font-size: 0.9rem;
                margin-bottom: 16px;
            }
            
            .results-section {
                background: rgba(76, 175, 80, 0.2);
                border: 1px solid rgba(76, 175, 80, 0.5);
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 20px;
            }
            
            .results-title {
                font-size: 1.2rem;
                font-weight: bold;
                color: white;
                margin-bottom: 16px;
                text-align: center;
            }
            
            .team-results {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
            }
            
            .team-result {
                background: rgba(255, 255, 255, 0.1);
                padding: 12px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .team-result-name {
                font-weight: 600;
                color: white;
            }
            
            .team-result-score {
                font-weight: bold;
                color: #4caf50;
            }
            
            .team-result-guess {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.8);
            }
        `;
    }
    
    constructor() {
        super();
        this.gameState = null;
        this.isAdmin = false;
        this.userTeamId = null;
        this.gameService = null;
    }
    
    connectedCallback() {
        super.connectedCallback();
        // Removed forced update listener - Lit will auto-update when gameState property changes
    }
    
    render() {
        if (!this.gameState || !this.gameState.active) {
            return this.renderWaitingForGame();
        }
        
        return html`
            <div class="game-board-container">
                ${this.renderRoundInfo()}
                ${this.renderInstructions()}
                ${this.renderGameContent()}
            </div>
        `;
    }
    
    renderWaitingForGame() {
        return html`
            <div class="waiting-message">
                <h2>🎵 Ready to Play!</h2>
                <p>Waiting for an admin to start a new game...</p>
                ${this.isAdmin ? html`
                    <div class="admin-notice">
                        You're an admin! Use the controls in the sidebar to start a new game.
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderRoundInfo() {
        const statusText = this.getStatusText();
        const statusClass = this.getStatusClass();
        
        return html`
            <div class="round-info">
                <h2 class="round-title">Round ${this.gameState.current_round}</h2>
                <p class="round-subtitle">${statusText}</p>
                <div class="status-indicator">
                    <span class="status-dot ${statusClass}"></span>
                    ${this.getDetailedStatus()}
                </div>
            </div>
        `;
    }
    
    renderInstructions() {
        if (this.gameState.round_active || this.gameState.current_song) {
            return '';
        }
        
        return html`
            <div class="instructions">
                <div class="instructions-title">
                    ℹ️ How to Play
                </div>
                <ul class="instructions-list">
                    <li>Listen to the music snippet when it starts playing</li>
                    <li>Guess the release year using the slider</li>
                    <li>Optionally place a bet to double your points (or lose them all!)</li>
                    <li>Submit your guess before time runs out</li>
                    <li>Scoring: Exact year = 10pts, ±3 years = 5pts, ±5 years = 2pts</li>
                </ul>
            </div>
        `;
    }
    
    renderGameContent() {
        return html`
            <div class="game-content">
                ${this.renderSongSection()}
                ${this.renderTeamsSection()}
            </div>
        `;
    }
    
    renderSongSection() {
        if (this.gameState.current_song && !this.gameState.round_active) {
            // Show song reveal after round ends
            return html`
                <song-reveal 
                    .song=${this.gameState.current_song}
                    .lastRoundResults=${this.getLastRoundResults()}
                ></song-reveal>
            `;
        }
        
        if (this.gameState.round_active) {
            return html`
                <div class="song-section">
                    <h3>🎵 Listen carefully and make your guess!</h3>
                    <p>The song is playing... Can you guess the year?</p>
                    ${!this.isAdmin ? html`
                        <p><small>Song details will be revealed when time expires</small></p>
                    ` : ''}
                </div>
            `;
        }
        
        return '';
    }
    
    renderTeamsSection() {
        const controllableTeams = this.getControllableTeams();
        
        return html`
            <div class="teams-section">
                <div class="teams-grid">
                    ${controllableTeams.map(team => html`
                        <team-controls
                            .team=${team}
                            .gameState=${this.gameState}
                            .gameService=${this.gameService}
                            .isAdmin=${this.isAdmin}
                            .canControl=${this.canControlTeam(team.id)}
                        ></team-controls>
                    `)}
                </div>
            </div>
        `;
    }
    
    getControllableTeams() {
        if (this.isAdmin) {
            // Admin can see all teams
            return this.gameState.teams || [];
        }
        
        // Non-admin users only see their assigned team
        if (this.userTeamId) {
            const userTeam = this.gameState.teams?.find(t => t.id === this.userTeamId);
            return userTeam ? [userTeam] : [];
        }
        
        // If no team assigned, show all teams but read-only
        return this.gameState.teams || [];
    }
    
    canControlTeam(teamId) {
        if (this.isAdmin) {
            return true;
        }
        
        return this.userTeamId === teamId;
    }
    
    getStatusText() {
        if (this.gameState.round_active) {
            return 'Round in progress - Make your guesses!';
        }
        
        if (this.gameState.current_song) {
            return 'Round complete - Waiting for next round';
        }
        
        if (this.gameState.current_round === 0) {
            return 'Game ready - Waiting for first round to start';
        }
        
        return 'Waiting for next round to start';
    }
    
    getStatusClass() {
        if (this.gameState.round_active) {
            return 'active';
        }
        
        if (this.gameState.current_song) {
            return 'ended';
        }
        
        return 'waiting';
    }
    
    getDetailedStatus() {
        const guessCount = this.gameState.teams?.filter(t => t.current_guess !== null).length || 0;
        const totalTeams = this.gameState.teams?.length || 0;
        
        if (this.gameState.round_active) {
            return `${guessCount}/${totalTeams} teams have submitted guesses`;
        }
        
        if (this.gameState.current_song) {
            return 'Admin can advance to next round';
        }
        
        return 'Waiting for admin to start round';
    }
    
    getLastRoundResults() {
        if (!this.gameState.teams) return [];
        
        return this.gameState.teams.map(team => ({
            name: team.name,
            guess: team.current_guess,
            has_bet: team.has_bet,
            // Would be calculated based on the last round data
            points_earned: 0, // This would come from the backend
        }));
    }
}

customElements.define('game-board', GameBoard);