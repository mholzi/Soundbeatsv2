import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';

class SoundbeatsScoreboard extends LitElement {
    static get properties() {
        return {
            teams: { type: Array, hasChanged: () => true }, // Force change detection for complex arrays
            currentRound: { type: Number },
            highscore: { type: Object, hasChanged: () => true }, // Force change detection for complex objects
            showLastRoundScores: { type: Boolean },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
            }
            
            .scoreboard-container {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .scoreboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .scoreboard-title {
                font-size: 1.3rem;
                font-weight: bold;
                color: white;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .round-info {
                font-size: 0.9rem;
                opacity: 0.8;
                color: white;
            }
            
            .teams-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .team-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .team-item:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
            
            .team-item.rank-1 {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
                border-color: rgba(255, 215, 0, 0.5);
            }
            
            .team-item.rank-2 {
                background: linear-gradient(135deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1));
                border-color: rgba(192, 192, 192, 0.5);
            }
            
            .team-item.rank-3 {
                background: linear-gradient(135deg, rgba(205, 127, 50, 0.3), rgba(205, 127, 50, 0.1));
                border-color: rgba(205, 127, 50, 0.5);
            }
            
            .team-rank {
                font-size: 1.1rem;
                font-weight: bold;
                width: 30px;
                text-align: center;
                color: white;
            }
            
            .team-rank.rank-1 { color: #ffd700; }
            .team-rank.rank-2 { color: #c0c0c0; }
            .team-rank.rank-3 { color: #cd7f32; }
            
            .team-info {
                flex: 1;
                margin-left: 12px;
            }
            
            .team-name {
                font-weight: 600;
                color: white;
                margin-bottom: 2px;
                font-size: 1rem;
            }
            
            .team-details {
                font-size: 0.8rem;
                opacity: 0.7;
                color: white;
            }
            
            .team-score {
                text-align: right;
                color: white;
            }
            
            .score-main {
                font-size: 1.4rem;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .score-average {
                font-size: 0.8rem;
                opacity: 0.7;
            }
            
            .last-round-score {
                font-size: 0.9rem;
                color: #4caf50;
                font-weight: 600;
            }
            
            .highscore-section {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .highscore-title {
                font-size: 1rem;
                font-weight: 600;
                color: white;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .highscore-entry {
                background: rgba(255, 215, 0, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 0.9rem;
            }
            
            .highscore-team {
                font-weight: 600;
                color: #ffd700;
            }
            
            .highscore-score {
                color: white;
                opacity: 0.9;
            }
            
            .empty-state {
                text-align: center;
                padding: 24px;
                color: white;
                opacity: 0.6;
            }
            
            .trophy-icon {
                font-size: 1.2rem;
            }
            
            .score-change {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 10px;
                background: rgba(76, 175, 80, 0.2);
                color: #4caf50;
                margin-left: 8px;
            }
            
            @media (max-width: 768px) {
                .scoreboard-container {
                    padding: 16px;
                }
                
                .team-item {
                    padding: 10px 12px;
                }
                
                .team-name {
                    font-size: 0.9rem;
                }
                
                .score-main {
                    font-size: 1.2rem;
                }
            }
            
            .loading-skeleton {
                height: 60px;
                background: linear-gradient(90deg, 
                    rgba(255, 255, 255, 0.1) 25%, 
                    rgba(255, 255, 255, 0.2) 50%, 
                    rgba(255, 255, 255, 0.1) 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
    }
    
    constructor() {
        super();
        this.teams = [];
        this.currentRound = 0;
        this.highscore = null;
        this.showLastRoundScores = false;
    }
    
    render() {
        if (!this.teams || this.teams.length === 0) {
            return html`
                <div class="scoreboard-container">
                    ${this.renderHeader()}
                    <div class="empty-state">
                        No teams yet. Waiting for game to start...
                    </div>
                </div>
            `;
        }
        
        const sortedTeams = this.getSortedTeams();
        
        return html`
            <div class="scoreboard-container">
                ${this.renderHeader()}
                <ul class="teams-list">
                    ${sortedTeams.map((team, index) => this.renderTeamItem(team, index + 1))}
                </ul>
                ${this.renderHighscore()}
            </div>
        `;
    }
    
    renderHeader() {
        return html`
            <div class="scoreboard-header">
                <h3 class="scoreboard-title">
                    <span class="trophy-icon">🏆</span>
                    Leaderboard
                </h3>
                <div class="round-info">
                    Round ${this.currentRound}
                </div>
            </div>
        `;
    }
    
    renderTeamItem(team, rank) {
        const averageScore = this.currentRound > 0 ? 
            (team.score / this.currentRound).toFixed(1) : '0.0';
        
        return html`
            <li class="team-item rank-${rank <= 3 ? rank : ''}">
                <div class="team-rank rank-${rank <= 3 ? rank : ''}">
                    ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </div>
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-details">
                        Avg: ${averageScore} pts/round
                        ${this.renderCurrentGuess(team)}
                    </div>
                </div>
                <div class="team-score">
                    <div class="score-main">${team.score}</div>
                    <div class="score-average">pts</div>
                </div>
            </li>
        `;
    }
    
    renderCurrentGuess(team) {
        if (team.current_guess) {
            return html`
                <br>
                Guess: ${team.current_guess}${team.has_bet ? ' 💰' : ''}
            `;
        }
        return '';
    }
    
    renderHighscore() {
        if (!this.highscore) {
            return '';
        }
        
        return html`
            <div class="highscore-section">
                <div class="highscore-title">
                    <span class="trophy-icon">⭐</span>
                    Round ${this.currentRound} Record
                </div>
                <div class="highscore-entry">
                    <span class="highscore-team">${this.highscore.team_name}</span>
                    <span class="highscore-score">
                        ${this.highscore.score_per_round.toFixed(1)} pts/round
                        (${this.highscore.rounds_played} rounds)
                    </span>
                </div>
            </div>
        `;
    }
    
    getSortedTeams() {
        return [...this.teams].sort((a, b) => {
            // Primary sort: by total score (descending)
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            
            // Secondary sort: by team name (ascending)
            return a.name.localeCompare(b.name);
        });
    }
    
    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Add celebration animation for score changes
        if (changedProperties.has('teams') && changedProperties.get('teams')) {
            const oldTeams = changedProperties.get('teams');
            const newTeams = this.teams;
            
            // Check for score increases and animate
            oldTeams.forEach((oldTeam, index) => {
                const newTeam = newTeams.find(t => t.id === oldTeam.id);
                if (newTeam && newTeam.score > oldTeam.score) {
                    this.animateScoreIncrease(newTeam.id);
                }
            });
        }
    }
    
    animateScoreIncrease(teamId) {
        // Could add celebration animations here
        // For now, we'll use CSS transitions which are already defined
        // Removed manual requestUpdate - Lit will auto-update when properties change
    }
}

customElements.define('soundbeats-scoreboard', SoundbeatsScoreboard);