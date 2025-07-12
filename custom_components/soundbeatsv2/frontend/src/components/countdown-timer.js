import { LitElement, html, css } from 'https://unpkg.com/lit@2.7.4?module';

class CountdownTimer extends LitElement {
    static get properties() {
        return {
            timeRemaining: { type: Number },
            totalTime: { type: Number },
            active: { type: Boolean },
        };
    }
    
    static get styles() {
        return css`
            :host {
                display: block;
                --timer-size: 200px;
            }
            
            .timer-container {
                position: relative;
                width: var(--timer-size);
                height: var(--timer-size);
                margin: 0 auto;
            }
            
            .timer-background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .timer-ring {
                transform: rotate(-90deg);
                transform-origin: 50% 50%;
            }
            
            .timer-ring-background {
                stroke: rgba(255, 255, 255, 0.3);
                stroke-width: 8;
                fill: none;
            }
            
            .timer-ring-progress {
                stroke: #fff;
                stroke-width: 8;
                fill: none;
                stroke-dasharray: 628; /* 2 * PI * 100 */
                stroke-dashoffset: calc(628 * (1 - var(--progress, 0)));
                transition: stroke-dashoffset 1s linear;
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
            }
            
            .timer-ring-progress.warning {
                stroke: #ff9800;
                filter: drop-shadow(0 0 10px rgba(255, 152, 0, 0.7));
            }
            
            .timer-ring-progress.danger {
                stroke: #f44336;
                filter: drop-shadow(0 0 15px rgba(244, 67, 54, 0.8));
                animation: pulse-danger 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes pulse-danger {
                from { stroke-width: 8; }
                to { stroke-width: 12; }
            }
            
            .timer-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: white;
            }
            
            .timer-text {
                font-size: 3rem;
                font-weight: bold;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
            }
            
            .timer-text.warning {
                color: #ff9800;
                animation: scale-warning 0.5s ease-in-out infinite alternate;
            }
            
            .timer-text.danger {
                color: #f44336;
                animation: scale-danger 0.3s ease-in-out infinite alternate;
            }
            
            @keyframes scale-warning {
                from { transform: scale(1); }
                to { transform: scale(1.1); }
            }
            
            @keyframes scale-danger {
                from { transform: scale(1); }
                to { transform: scale(1.2); }
            }
            
            .timer-label {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-top: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .timer-status {
                font-size: 1.2rem;
                font-weight: bold;
                color: #4caf50;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .timer-expired {
                color: #f44336;
                animation: flash 1s infinite;
            }
            
            @keyframes flash {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.5; }
            }
            
            @media (max-width: 768px) {
                :host {
                    --timer-size: 150px;
                }
                
                .timer-text {
                    font-size: 2rem;
                }
                
                .timer-label {
                    font-size: 0.8rem;
                }
            }
            
            .inactive-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(2px);
            }
            
            .waiting-text {
                color: white;
                font-size: 1.1rem;
                text-align: center;
                font-weight: 500;
            }
        `;
    }
    
    constructor() {
        super();
        this.timeRemaining = 0;
        this.totalTime = 30;
        this.active = false;
    }
    
    render() {
        const progress = this.totalTime > 0 ? this.timeRemaining / this.totalTime : 0;
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Determine warning states
        const warningThreshold = Math.max(10, this.totalTime * 0.2);
        const dangerThreshold = Math.max(5, this.totalTime * 0.1);
        
        let ringClass = '';
        let textClass = '';
        
        if (this.active && this.timeRemaining > 0) {
            if (this.timeRemaining <= dangerThreshold) {
                ringClass = 'danger';
                textClass = 'danger';
            } else if (this.timeRemaining <= warningThreshold) {
                ringClass = 'warning';
                textClass = 'warning';
            }
        }
        
        return html`
            <div class="timer-container" style="--progress: ${progress}">
                <div class="timer-background"></div>
                
                <svg class="timer-ring" viewBox="0 0 200 200">
                    <circle
                        class="timer-ring-background"
                        cx="100"
                        cy="100"
                        r="90"
                    />
                    <circle
                        class="timer-ring-progress ${ringClass}"
                        cx="100"
                        cy="100"
                        r="90"
                    />
                </svg>
                
                <div class="timer-content">
                    ${this.renderTimerContent(timeDisplay, textClass)}
                </div>
                
                ${!this.active ? html`
                    <div class="inactive-overlay">
                        <div class="waiting-text">
                            ${this.timeRemaining === 0 ? 'Waiting for next round...' : 'Round paused'}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderTimerContent(timeDisplay, textClass) {
        if (!this.active && this.timeRemaining === 0) {
            return html`
                <div class="timer-status">Ready</div>
                <div class="timer-label">Next Round</div>
            `;
        }
        
        if (this.timeRemaining === 0 && this.active) {
            return html`
                <div class="timer-status timer-expired">Time's Up!</div>
                <div class="timer-label">Answers Locked</div>
            `;
        }
        
        return html`
            <div class="timer-text ${textClass}">${timeDisplay}</div>
            <div class="timer-label">
                ${this.active ? 'Time Remaining' : 'Paused'}
            </div>
        `;
    }
    
    updated(changedProperties) {
        super.updated(changedProperties);
        
        // Add sound effects or haptic feedback here if needed
        if (changedProperties.has('timeRemaining')) {
            const warningThreshold = Math.max(10, this.totalTime * 0.2);
            const dangerThreshold = Math.max(5, this.totalTime * 0.1);
            
            // Could trigger browser vibration API on mobile
            if (this.timeRemaining === dangerThreshold && this.active) {
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
            
            // Could play audio warnings (disabled for now as per requirements)
            // if (this.timeRemaining === 10 && this.active) {
            //     // Play warning sound
            // }
        }
    }
}

customElements.define('countdown-timer', CountdownTimer);