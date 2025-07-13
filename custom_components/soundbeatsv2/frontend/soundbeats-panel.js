import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';
import './src/components/game-board.js';
import './src/components/scoreboard.js';
import './src/components/admin-controls.js';
import './src/components/countdown-timer.js';
import './src/services/websocket-service.js';
import './src/services/game-service.js';
import './src/styles/game-theme.js';
import './src/styles/animations.js';

class SoundbeatsPanel extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            panelConfig: { type: Object },
            gameState: { type: Object },
            connected: { type: Boolean },
            loading: { type: Boolean },
            error: { type: String },
            isAdmin: { type: Boolean },
            userTeamId: { type: String },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Roboto', sans-serif;
                color: white;
                overflow-y: auto;
                overflow-x: hidden;
            }
            
            .container {
                display: flex;
                flex-direction: column;
                height: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 16px;
                box-sizing: border-box;
                min-height: 0;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                background: rgba(0, 0, 0, 0.2);
                padding: 16px 24px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
            }
            
            .title {
                font-size: 2rem;
                font-weight: bold;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .title-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(45deg, #ff6b6b, #feca57);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4caf50;
                animation: pulse 2s infinite;
            }
            
            .status-indicator.disconnected {
                background: #f44336;
                animation: none;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .main-content {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 300px;
                gap: 24px;
                min-height: 0;
                overflow: visible;
            }
            
            @media (max-width: 768px) {
                .container {
                    height: auto;
                    min-height: 100vh;
                }
                
                .main-content {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr;
                    height: auto;
                }
                
                .container {
                    padding: 8px;
                }
                
                .header {
                    margin-bottom: 16px;
                    padding: 12px 16px;
                }
                
                .title {
                    font-size: 1.5rem;
                }
            }
            
            .game-area {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 24px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .sidebar {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .error-message {
                background: rgba(244, 67, 54, 0.2);
                border: 1px solid rgba(244, 67, 54, 0.5);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                text-align: center;
            }
            
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }
            
            .loading-content {
                text-align: center;
                color: white;
            }
            
            .loading-spinner {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .welcome-screen {
                text-align: center;
                padding: 48px 24px;
            }
            
            .welcome-title {
                font-size: 3rem;
                margin-bottom: 24px;
                background: linear-gradient(45deg, #ff6b6b, #feca57, #48cae4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .welcome-subtitle {
                font-size: 1.2rem;
                margin-bottom: 48px;
                opacity: 0.9;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 24px;
                margin-top: 48px;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 24px;
                border-radius: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .feature-icon {
                font-size: 3rem;
                margin-bottom: 16px;
            }
            
            .feature-title {
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .feature-description {
                opacity: 0.8;
                line-height: 1.4;
            }
        `;
    }
    
    constructor() {
        super();
        this.gameState = null;
        this.connected = false;
        this.loading = true;
        this.error = null;
        this.isAdmin = false;
        this.userTeamId = null;
        this.websocketService = null;
        this.gameService = null;
    }
    
    connectedCallback() {
        super.connectedCallback();
        this.initializeServices();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.websocketService) {
            this.websocketService.disconnect();
        }
    }
    
    set hass(value) {
        this._hass = value;
        if (value && !this.websocketService) {
            this.initializeServices();
        }
    }
    
    get hass() {
        return this._hass;
    }
    
    async initializeServices() {
        if (!this.hass) return;
        
        try {
            this.loading = true;
            this.error = null;
            
            // Check if user is admin
            this.isAdmin = this.hass.user?.is_admin || false;
            
            // Initialize WebSocket service
            this.websocketService = new (await import('./src/services/websocket-service.js')).WebSocketService(this.hass);
            
            // Initialize game service
            this.gameService = new (await import('./src/services/game-service.js')).GameService(this.websocketService);
            
            // Set up event listeners
            this.websocketService.addEventListener('connected', () => {
                this.connected = true;
                this.requestUpdate();
            });
            
            this.websocketService.addEventListener('disconnected', () => {
                this.connected = false;
                this.requestUpdate();
            });
            
            this.websocketService.addEventListener('error', (event) => {
                this.error = event.detail.message;
                this.loading = false;
                this.requestUpdate();
            });
            
            this.gameService.addEventListener('stateChanged', (event) => {
                this.gameState = event.detail;
                this.userTeamId = event.detail.user_team_id || null;
                this.loading = false;
                // Removed manual requestUpdate - Lit will auto-update when properties change
            });
            
            // Connect and load initial state
            await this.websocketService.connect();
            await this.gameService.loadGameState();
            
        } catch (error) {
            console.error('Failed to initialize services:', error);
            this.error = `Initialization failed: ${error.message}`;
            this.loading = false;
            this.requestUpdate();
        }
    }
    
    render() {
        if (this.loading) {
            return html`
                <div class="loading-overlay">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div>Loading Soundbeats...</div>
                    </div>
                </div>
            `;
        }
        
        return html`
            <div class="container">
                ${this.renderHeader()}
                ${this.error ? this.renderError() : this.renderMainContent()}
            </div>
        `;
    }
    
    renderHeader() {
        return html`
            <div class="header">
                <h1 class="title">
                    <div class="title-icon">🎵</div>
                    Soundbeats
                </h1>
                <div class="connection-status">
                    <div class="status-indicator ${this.connected ? '' : 'disconnected'}"></div>
                    ${this.connected ? 'Connected' : 'Disconnected'}
                </div>
            </div>
        `;
    }
    
    renderError() {
        return html`
            <div class="error-message">
                <strong>Error:</strong> ${this.error}
                <br><br>
                <button @click=${this.retry} class="retry-button">
                    Retry Connection
                </button>
            </div>
        `;
    }
    
    renderMainContent() {
        if (!this.gameState || !this.gameState.active) {
            return this.renderWelcomeScreen();
        }
        
        return html`
            <div class="main-content">
                <div class="game-area">
                    <game-board 
                        .gameState=${this.gameState}
                        .isAdmin=${this.isAdmin}
                        .userTeamId=${this.userTeamId}
                        .gameService=${this.gameService}
                    ></game-board>
                </div>
                <div class="sidebar">
                    <countdown-timer
                        .timeRemaining=${this.gameState.timer_remaining || 0}
                        .totalTime=${this.gameState.timer_seconds || 30}
                        .active=${this.gameState.round_active || false}
                    ></countdown-timer>
                    
                    <soundbeats-scoreboard
                        .teams=${this.gameState.teams || []}
                        .currentRound=${this.gameState.current_round || 0}
                        .highscore=${this.gameState.highscore_current_round}
                    ></soundbeats-scoreboard>
                    
                    ${this.isAdmin ? html`
                        <admin-controls
                            .gameState=${this.gameState}
                            .gameService=${this.gameService}
                        ></admin-controls>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderWelcomeScreen() {
        return html`
            <div class="game-area">
                <div class="welcome-screen">
                    <h2 class="welcome-title">Welcome to Soundbeats!</h2>
                    <p class="welcome-subtitle">
                        Turn your Home Assistant into the ultimate music trivia party game
                    </p>
                    
                    ${this.isAdmin ? html`
                        <admin-controls
                            .gameState=${this.gameState || { active: false }}
                            .gameService=${this.gameService}
                        ></admin-controls>
                    ` : html`
                        <p>Waiting for an admin to start a new game...</p>
                    `}
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <div class="feature-title">Year Guessing</div>
                            <div class="feature-description">
                                Guess the release year of songs and earn points based on accuracy
                            </div>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">💰</div>
                            <div class="feature-title">Betting System</div>
                            <div class="feature-description">
                                Place bets on your guesses to double your points or lose them all
                            </div>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">👥</div>
                            <div class="feature-title">Team Competition</div>
                            <div class="feature-description">
                                Compete with up to 5 teams and track scores in real-time
                            </div>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">🏆</div>
                            <div class="feature-title">Highscores</div>
                            <div class="feature-description">
                                Persistent leaderboards track the best performances by round
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async retry() {
        this.error = null;
        this.loading = true;
        this.requestUpdate();
        
        try {
            if (this.websocketService) {
                await this.websocketService.disconnect();
            }
            await this.initializeServices();
        } catch (error) {
            this.error = `Retry failed: ${error.message}`;
            this.loading = false;
            this.requestUpdate();
        }
    }
}

customElements.define('soundbeats-panel', SoundbeatsPanel);