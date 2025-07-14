import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';

class SongReveal extends LitElement {
    static get properties() {
        return {
            song: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            lastRoundResults: { type: Array, hasChanged: () => true }, // Force change detection for complex arrays
            showAnimation: { type: Boolean, state: true },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .reveal-container {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1));
                border: 2px solid rgba(76, 175, 80, 0.5);
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            
            .reveal-container.animated {
                animation: revealAnimation 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            @keyframes revealAnimation {
                0% {
                    transform: scale(0.8) rotateY(-90deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.05) rotateY(0deg);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1) rotateY(0deg);
                    opacity: 1;
                }
            }
            
            .reveal-header {
                margin-bottom: 24px;
            }
            
            .reveal-title {
                font-size: 2rem;
                font-weight: bold;
                color: white;
                margin: 0 0 8px 0;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .reveal-subtitle {
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.9);
                margin: 0;
            }
            
            .song-info {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .song-cover {
                width: 120px;
                height: 120px;
                border-radius: 12px;
                margin: 0 auto 16px;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                border: 2px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            }
            
            .song-cover img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 10px;
            }
            
            .song-title {
                font-size: 1.4rem;
                font-weight: bold;
                color: white;
                margin: 0 0 8px 0;
                line-height: 1.3;
            }
            
            .song-artist {
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.8);
                margin: 0 0 16px 0;
            }
            
            .song-year {
                font-size: 2rem;
                font-weight: bold;
                color: #4caf50;
                background: rgba(76, 175, 80, 0.2);
                padding: 8px 16px;
                border-radius: 8px;
                display: inline-block;
                border: 1px solid rgba(76, 175, 80, 0.3);
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .results-section {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .results-title {
                font-size: 1.3rem;
                font-weight: bold;
                color: white;
                margin: 0 0 16px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .team-results {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
            }
            
            .team-result {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .team-result:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .team-result.correct {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.1));
                border-color: rgba(76, 175, 80, 0.6);
            }
            
            .team-result.close {
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.3), rgba(255, 152, 0, 0.1));
                border-color: rgba(255, 152, 0, 0.6);
            }
            
            .team-result.wrong {
                background: linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(244, 67, 54, 0.1));
                border-color: rgba(244, 67, 54, 0.6);
            }
            
            .team-name {
                font-size: 1rem;
                font-weight: bold;
                color: white;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .team-guess {
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 4px;
            }
            
            .team-points {
                font-size: 1.2rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .points-earned {
                color: #4caf50;
            }
            
            .points-lost {
                color: #f44336;
            }
            
            .points-zero {
                color: rgba(255, 255, 255, 0.6);
            }
            
            .bet-indicator {
                background: rgba(255, 152, 0, 0.3);
                color: #ffb74d;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 0.7rem;
                font-weight: bold;
                border: 1px solid rgba(255, 152, 0, 0.5);
            }
            
            .accuracy-indicator {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .accuracy-exact {
                background: #4caf50;
                color: white;
            }
            
            .accuracy-close {
                background: #ff9800;
                color: white;
            }
            
            .accuracy-wrong {
                background: #f44336;
                color: white;
            }
            
            .difference-text {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 4px;
            }
            
            .celebration-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                overflow: hidden;
                border-radius: 16px;
            }
            
            .confetti {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ffd700;
                animation: confetti-fall 3s linear infinite;
            }
            
            .confetti:nth-child(2n) { background: #ff6b6b; animation-delay: -0.5s; }
            .confetti:nth-child(3n) { background: #4ecdc4; animation-delay: -1s; }
            .confetti:nth-child(4n) { background: #45b7d1; animation-delay: -1.5s; }
            .confetti:nth-child(5n) { background: #96ceb4; animation-delay: -2s; }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
            
            .no-results {
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                padding: 20px;
                font-style: italic;
            }
            
            @media (max-width: 768px) {
                .reveal-container {
                    padding: 20px;
                }
                
                .reveal-title {
                    font-size: 1.5rem;
                }
                
                .song-cover {
                    width: 100px;
                    height: 100px;
                }
                
                .song-title {
                    font-size: 1.2rem;
                }
                
                .song-year {
                    font-size: 1.5rem;
                }
                
                .team-results {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }
    
    constructor() {
        super();
        this.song = null;
        this.lastRoundResults = [];
        this.showAnimation = false;
    }
    
    connectedCallback() {
        super.connectedCallback();
        // Trigger animation after a short delay
        setTimeout(() => {
            this.showAnimation = true;
        }, 100);
        
        // Add confetti if there are correct guesses
        if (this.hasCorrectGuesses()) {
            this.addConfetti();
        }
    }
    
    render() {
        if (!this.song) {
            return html`<div>No song data available</div>`;
        }
        
        return html`
            <div class="reveal-container ${this.showAnimation ? 'animated' : ''}">
                ${this.renderHeader()}
                ${this.renderSongInfo()}
                ${this.renderResults()}
                ${this.hasCorrectGuesses() ? this.renderCelebration() : ''}
            </div>
        `;
    }
    
    renderHeader() {
        return html`
            <div class="reveal-header">
                <h2 class="reveal-title">🎵 Song Revealed!</h2>
                <p class="reveal-subtitle">Here's what was playing...</p>
            </div>
        `;
    }
    
    renderSongInfo() {
        // Use placeholder image if no album art is available
        const albumArt = this.song.image_url || 
                         `https://via.placeholder.com/120x120/333333/ffffff?text=♪`;
        
        return html`
            <div class="song-info">
                <div class="song-cover">
                    ${this.song.image_url ? html`
                        <img src="${albumArt}" alt="Album cover" />
                    ` : html`
                        🎵
                    `}
                </div>
                
                <div class="song-title">${this.song.song}</div>
                <div class="song-artist">by ${this.song.artist}</div>
                <div class="song-year">${this.song.year}</div>
            </div>
        `;
    }
    
    renderResults() {
        if (!this.lastRoundResults || this.lastRoundResults.length === 0) {
            return html`
                <div class="results-section">
                    <h3 class="results-title">
                        📊 Round Results
                    </h3>
                    <div class="no-results">
                        No team results available for this round
                    </div>
                </div>
            `;
        }
        
        return html`
            <div class="results-section">
                <h3 class="results-title">
                    📊 Round Results
                </h3>
                
                <div class="team-results">
                    ${this.lastRoundResults.map(result => this.renderTeamResult(result))}
                </div>
            </div>
        `;
    }
    
    renderTeamResult(result) {
        if (!result.guess) {
            return html`
                <div class="team-result wrong">
                    <div class="team-name">
                        ${result.name}
                        <span style="color: rgba(255, 255, 255, 0.6);">No Guess</span>
                    </div>
                    <div class="team-points points-zero">
                        0 points
                    </div>
                </div>
            `;
        }
        
        const difference = Math.abs(result.guess - this.song.year);
        const accuracy = this.getAccuracy(difference);
        const points = this.calculatePoints(difference, result.has_bet);
        
        return html`
            <div class="team-result ${accuracy}">
                <div class="accuracy-indicator accuracy-${accuracy}">
                    ${accuracy === 'exact' ? '🎯' : accuracy === 'close' ? '📍' : '❌'}
                </div>
                
                <div class="team-name">
                    ${result.name}
                    ${result.has_bet ? html`
                        <span class="bet-indicator">💰 BET</span>
                    ` : ''}
                </div>
                
                <div class="team-guess">
                    Guessed: ${result.guess}
                </div>
                
                <div class="difference-text">
                    ${difference === 0 ? 'Perfect!' : 
                      `${difference} year${difference !== 1 ? 's' : ''} off`}
                </div>
                
                <div class="team-points ${this.getPointsClass(points)}">
                    ${points > 0 ? '+' : ''}${points} points
                    ${points > 0 ? '🎉' : points < 0 ? '💔' : '😐'}
                </div>
            </div>
        `;
    }
    
    renderCelebration() {
        return html`
            <div class="celebration-overlay">
                ${Array.from({length: 20}, (_, i) => html`
                    <div 
                        class="confetti" 
                        style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 3}s;"
                    ></div>
                `)}
            </div>
        `;
    }
    
    getAccuracy(difference) {
        if (difference === 0) return 'exact';
        if (difference <= 5) return 'close';
        return 'wrong';
    }
    
    calculatePoints(difference, hasBet) {
        if (hasBet) {
            // With bet: exact or nothing
            return difference === 0 ? 20 : 0;
        } else {
            // Without bet: graduated points
            if (difference === 0) return 10;
            if (difference <= 3) return 5;
            if (difference <= 5) return 2;
            return 0;
        }
    }
    
    getPointsClass(points) {
        if (points > 0) return 'points-earned';
        if (points < 0) return 'points-lost';
        return 'points-zero';
    }
    
    hasCorrectGuesses() {
        return this.lastRoundResults?.some(result => 
            result.guess && Math.abs(result.guess - this.song.year) === 0
        ) || false;
    }
    
    addConfetti() {
        // Confetti is handled by CSS animations
        // This method could be extended to add more complex celebration effects
    }
}

customElements.define('song-reveal', SongReveal);