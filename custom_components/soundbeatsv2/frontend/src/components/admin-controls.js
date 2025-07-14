import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';

class AdminControls extends LitElement {
    static get properties() {
        return {
            gameState: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            gameService: { type: Object },
            loading: { type: Boolean, state: true },
            selectedPlaylist: { type: String, state: true },
            teamCount: { type: Number, state: true },
            timerSeconds: { type: Number, state: true },
            showNewGameForm: { type: Boolean, state: true },
            currentVolume: { type: Number, state: true },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .admin-panel {
                background: rgba(156, 39, 176, 0.1);
                border: 1px solid rgba(156, 39, 176, 0.3);
                border-radius: 12px;
                padding: 20px;
                backdrop-filter: blur(10px);
            }
            
            .admin-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(156, 39, 176, 0.3);
            }
            
            .admin-title {
                font-size: 1.2rem;
                font-weight: bold;
                color: #e1bee7;
                margin: 0;
            }
            
            .admin-controls {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .control-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: white;
                margin-bottom: 4px;
            }
            
            .form-input {
                padding: 10px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #9c27b0;
                background: rgba(255, 255, 255, 0.15);
            }
            
            .form-input::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }
            
            .form-select {
                padding: 10px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1rem;
                cursor: pointer;
            }
            
            .form-select option {
                background: #424242;
                color: white;
            }
            
            .slider-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .slider {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
                -webkit-appearance: none;
                appearance: none;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #9c27b0;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #9c27b0;
                cursor: pointer;
                border: none;
            }
            
            .slider-value {
                font-size: 1rem;
                font-weight: bold;
                color: white;
                min-width: 60px;
                text-align: center;
                background: rgba(0, 0, 0, 0.3);
                padding: 6px 10px;
                border-radius: 6px;
            }
            
            .button {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-decoration: none;
            }
            
            .button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .button:hover:not(:disabled) {
                transform: translateY(-2px);
            }
            
            .button-primary {
                background: linear-gradient(135deg, #9c27b0, #ba68c8);
                color: white;
            }
            
            .button-primary:hover:not(:disabled) {
                background: linear-gradient(135deg, #8e24aa, #ab47bc);
                box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
            }
            
            .button-success {
                background: linear-gradient(135deg, #4caf50, #66bb6a);
                color: white;
            }
            
            .button-success:hover:not(:disabled) {
                background: linear-gradient(135deg, #45a049, #5cb85c);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            }
            
            .button-warning {
                background: linear-gradient(135deg, #ff9800, #ffb74d);
                color: white;
            }
            
            .button-warning:hover:not(:disabled) {
                background: linear-gradient(135deg, #f57400, #ffa726);
                box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
            }
            
            .button-danger {
                background: linear-gradient(135deg, #f44336, #e57373);
                color: white;
            }
            
            .button-danger:hover:not(:disabled) {
                background: linear-gradient(135deg, #d32f2f, #ef5350);
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
            }
            
            .button-secondary {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
            }
            
            .button-secondary:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .game-status {
                background: rgba(33, 150, 243, 0.2);
                border: 1px solid rgba(33, 150, 243, 0.5);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
            }
            
            .status-title {
                font-weight: bold;
                color: #64b5f6;
                margin-bottom: 4px;
            }
            
            .status-text {
                color: white;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            
            @media (max-width: 768px) {
                .controls-grid {
                    grid-template-columns: 1fr;
                }
                
                .admin-panel {
                    padding: 16px;
                }
            }
            
            .new-game-form {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .form-row {
                display: flex;
                gap: 12px;
                align-items: end;
            }
            
            .form-field {
                flex: 1;
            }
            
            .media-controls {
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-top: 16px;
            }
            
            .media-title {
                font-size: 0.9rem;
                font-weight: bold;
                color: #ffb74d;
                margin-bottom: 8px;
            }
            
            .volume-control {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
            }
            
            .volume-label {
                font-size: 0.8rem;
                color: white;
                min-width: 60px;
            }
        `;
    }
    
    constructor() {
        super();
        this.gameState = null;
        this.gameService = null;
        this.loading = false;
        this.selectedPlaylist = 'default';
        this.teamCount = 3;
        this.timerSeconds = 30;
        this.showNewGameForm = false;
        this.currentVolume = 0.7; // Track current volume
    }
    
    render() {
        return html`
            <div class="admin-panel">
                <div class="admin-header">
                    <span>👑</span>
                    <h3 class="admin-title">Game Master Controls</h3>
                </div>
                
                ${this.renderGameStatus()}
                ${this.renderControls()}
            </div>
        `;
    }
    
    renderGameStatus() {
        if (!this.gameState?.active) {
            return html`
                <div class="game-status">
                    <div class="status-title">No Active Game</div>
                    <div class="status-text">Start a new game to begin playing</div>
                </div>
            `;
        }
        
        const statusText = this.getGameStatusText();
        
        return html`
            <div class="game-status">
                <div class="status-title">Game Active - Round ${this.gameState.current_round}</div>
                <div class="status-text">${statusText}</div>
            </div>
        `;
    }
    
    renderControls() {
        if (!this.gameState?.active) {
            return this.renderNewGameControls();
        }
        
        return html`
            <div class="admin-controls">
                ${this.renderRoundControls()}
                ${this.renderMediaControls()}
                ${this.renderGameManagement()}
            </div>
        `;
    }
    
    renderNewGameControls() {
        if (!this.showNewGameForm) {
            return html`
                <button 
                    class="button button-primary"
                    @click=${() => this.showNewGameForm = true}
                    ?disabled=${this.loading}
                >
                    🎮 Start New Game
                </button>
            `;
        }
        
        return html`
            <div class="new-game-form">
                <div class="control-group">
                    <label class="control-label">Playlist</label>
                    <select 
                        class="form-select"
                        .value=${this.selectedPlaylist}
                        @change=${this.handlePlaylistChange}
                    >
                        <option value="default">Default Mix</option>
                        <option value="80s">80s Hits</option>
                        <option value="90s">90s Classics</option>
                        <option value="2000s">2000s Pop</option>
                        <option value="rock">Rock Anthems</option>
                        <option value="pop">Pop Favorites</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Teams (${this.teamCount})</label>
                    <div class="slider-container">
                        <input 
                            type="range"
                            class="slider"
                            min="1"
                            max="5"
                            .value=${this.teamCount}
                            @input=${this.handleTeamCountChange}
                        />
                        <div class="slider-value">${this.teamCount}</div>
                    </div>
                </div>
                
                <div class="control-group">
                    <label class="control-label">Timer (${this.timerSeconds}s)</label>
                    <div class="slider-container">
                        <input 
                            type="range"
                            class="slider"
                            min="10"
                            max="120"
                            step="5"
                            .value=${this.timerSeconds}
                            @input=${this.handleTimerChange}
                        />
                        <div class="slider-value">${this.timerSeconds}s</div>
                    </div>
                </div>
                
                <div class="controls-grid">
                    <button 
                        class="button button-success"
                        @click=${this.startNewGame}
                        ?disabled=${this.loading}
                    >
                        ${this.loading ? html`
                            <div class="loading-spinner"></div>
                            Starting...
                        ` : 'Start Game'}
                    </button>
                    
                    <button 
                        class="button button-secondary"
                        @click=${() => this.showNewGameForm = false}
                        ?disabled=${this.loading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }
    
    renderRoundControls() {
        const canStartRound = !this.gameState.round_active && !this.gameState.current_song;
        const canNextRound = !this.gameState.round_active && this.gameState.current_song;
        
        return html`
            <div class="control-group">
                <label class="control-label">Round Management</label>
                
                ${canStartRound ? html`
                    <button 
                        class="button button-success"
                        @click=${this.startRound}
                        ?disabled=${this.loading}
                    >
                        ${this.loading ? html`
                            <div class="loading-spinner"></div>
                            Starting...
                        ` : html`
                            🎵 Start Round ${this.gameState.current_round + 1}
                        `}
                    </button>
                ` : ''}
                
                ${canNextRound ? html`
                    <button 
                        class="button button-warning"
                        @click=${this.nextRound}
                        ?disabled=${this.loading}
                    >
                        ⏭️ Next Round
                    </button>
                ` : ''}
                
                ${this.gameState.round_active ? html`
                    <div class="status-text">
                        Round ${this.gameState.current_round} in progress...
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderMediaControls() {
        return html`
            <div class="media-controls">
                <div class="media-title">🎵 Media Player</div>
                
                <div class="controls-grid">
                    <button 
                        class="button button-secondary"
                        @click=${() => this.mediaControl('pause')}
                        ?disabled=${this.loading}
                    >
                        ⏸️ Pause
                    </button>
                    
                    <button 
                        class="button button-secondary"
                        @click=${() => this.mediaControl('play')}
                        ?disabled=${this.loading}
                    >
                        ▶️ Resume
                    </button>
                    
                    <button 
                        class="button button-secondary"
                        @click=${() => this.mediaControl('stop')}
                        ?disabled=${this.loading}
                    >
                        ⏹️ Stop
                    </button>
                </div>
                
                <div class="volume-control">
                    <span class="volume-label">Volume:</span>
                    <input 
                        type="range"
                        class="slider"
                        min="0"
                        max="1"
                        step="0.1"
                        .value=${this.currentVolume}
                        @input=${this.handleVolumeChange}
                    />
                    <div class="slider-value">${Math.round(this.currentVolume * 100)}%</div>
                </div>
            </div>
        `;
    }
    
    renderGameManagement() {
        return html`
            <div class="control-group">
                <label class="control-label">Game Management</label>
                
                <button 
                    class="button button-danger"
                    @click=${this.endGame}
                    ?disabled=${this.loading}
                >
                    🏁 End Game
                </button>
            </div>
        `;
    }
    
    getGameStatusText() {
        if (this.gameState.round_active) {
            const guessCount = this.gameState.teams?.filter(t => t.current_guess !== null).length || 0;
            const totalTeams = this.gameState.teams?.length || 0;
            return `Round in progress. ${guessCount}/${totalTeams} teams have submitted guesses.`;
        }
        
        if (this.gameState.current_song) {
            return 'Round completed. Ready to advance to next round.';
        }
        
        return 'Ready to start next round.';
    }
    
    handlePlaylistChange(event) {
        this.selectedPlaylist = event.target.value;
    }
    
    handleTeamCountChange(event) {
        this.teamCount = parseInt(event.target.value);
    }
    
    handleTimerChange(event) {
        this.timerSeconds = parseInt(event.target.value);
    }
    
    handleVolumeChange(event) {
        const volume = parseFloat(event.target.value);
        this.currentVolume = volume; // Update tracked volume
        this.mediaControl('volume', { volume_level: volume });
    }
    
    async startNewGame() {
        if (!this.gameService || this.loading) return;
        
        try {
            this.loading = true;
            
            await this.gameService.newGame(
                this.teamCount,
                this.selectedPlaylist,
                this.timerSeconds
            );
            
            this.showNewGameForm = false;
            
        } catch (error) {
            console.error('Failed to start new game:', error);
            this.showError('Failed to start game: ' + error.message);
        } finally {
            this.loading = false;
        }
    }
    
    async startRound() {
        if (!this.gameService || this.loading) return;
        
        try {
            this.loading = true;
            
            // Get a random song for the round
            const song = await this.gameService.getRandomSong(this.selectedPlaylist);
            await this.gameService.startRound(song);
            
        } catch (error) {
            console.error('Failed to start round:', error);
            this.showError('Failed to start round: ' + error.message);
        } finally {
            this.loading = false;
        }
    }
    
    async nextRound() {
        if (!this.gameService || this.loading) return;
        
        try {
            this.loading = true;
            await this.gameService.nextRound();
        } catch (error) {
            console.error('Failed to advance round:', error);
            this.showError('Failed to advance round: ' + error.message);
        } finally {
            this.loading = false;
        }
    }
    
    async mediaControl(action, params = {}) {
        if (!this.gameService) return;
        
        try {
            console.log('Media control action:', action, params);
            await this.gameService.mediaControl(action, params);
        } catch (error) {
            console.error('Media control failed:', error);
            this.showError('Media control failed: ' + error.message);
        }
    }
    
    async endGame() {
        if (!this.gameService || this.loading) return;
        
        if (!confirm('Are you sure you want to end the current game? This will reset all scores.')) {
            return;
        }
        
        try {
            this.loading = true;
            await this.gameService.endGame();
        } catch (error) {
            console.error('Failed to end game:', error);
            this.showError('Failed to end game: ' + error.message);
        } finally {
            this.loading = false;
        }
    }
    
    showError(message) {
        // Could implement a toast notification system
        alert(message);
    }
}

customElements.define('admin-controls', AdminControls);