/**
 * WebSocket service for real-time communication with Home Assistant backend
 */
export class WebSocketService extends EventTarget {
    constructor(hass) {
        super();
        this.hass = hass;
        this.connection = null;
        this.subscriptions = new Map();
        this.commandId = 1;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }
    
    async connect() {
        if (this.connected || !this.hass) {
            return;
        }
        
        try {
            this.connection = this.hass.connection;
            
            if (!this.connection) {
                throw new Error('No Home Assistant WebSocket connection available');
            }
            
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Subscribe to game state events
            this.subscribeToEvents();
            
            this.dispatchEvent(new CustomEvent('connected'));
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.connected = false;
            this.dispatchEvent(new CustomEvent('error', { 
                detail: { message: error.message } 
            }));
            
            // Attempt reconnection
            this.scheduleReconnect();
        }
    }
    
    async disconnect() {
        this.connected = false;
        
        // Unsubscribe from all events
        for (const [eventType, unsubscribe] of this.subscriptions) {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (error) {
                console.warn(`Error unsubscribing from ${eventType}:`, error);
            }
        }
        
        this.subscriptions.clear();
        this.dispatchEvent(new CustomEvent('disconnected'));
    }
    
    async sendCommand(type, data = {}) {
        if (!this.connected || !this.connection) {
            throw new Error('WebSocket not connected');
        }
        
        const message = {
            id: this.commandId++,
            type,
            ...data
        };
        
        try {
            const response = await this.connection.sendMessagePromise(message);
            return response;
        } catch (error) {
            console.error(`WebSocket command ${type} failed:`, error);
            throw new Error(`Command failed: ${error.message}`);
        }
    }
    
    subscribeToEvents() {
        // Subscribe to Soundbeats game state changes
        const unsubscribeGameState = this.connection.subscribeEvents(
            (event) => {
                this.handleGameStateEvent(event);
            },
            'soundbeats_game_state_changed'
        );
        this.subscriptions.set('game_state', unsubscribeGameState);
        
        // Subscribe to timer updates
        const unsubscribeTimer = this.connection.subscribeEvents(
            (event) => {
                this.handleTimerEvent(event);
            },
            'soundbeats_timer_update'
        );
        this.subscriptions.set('timer', unsubscribeTimer);
        
        // Subscribe to round ended events
        const unsubscribeRoundEnd = this.connection.subscribeEvents(
            (event) => {
                this.handleRoundEndEvent(event);
            },
            'soundbeats_round_ended'
        );
        this.subscriptions.set('round_end', unsubscribeRoundEnd);
    }
    
    handleGameStateEvent(event) {
        this.dispatchEvent(new CustomEvent('gameStateChanged', {
            detail: event.data
        }));
    }
    
    handleTimerEvent(event) {
        this.dispatchEvent(new CustomEvent('timerUpdate', {
            detail: {
                timeRemaining: event.data.timer_remaining,
                gameId: event.data.game_id
            }
        }));
    }
    
    handleRoundEndEvent(event) {
        this.dispatchEvent(new CustomEvent('roundEnded', {
            detail: {
                gameId: event.data.game_id,
                round: event.data.current_round,
                actualYear: event.data.actual_year,
                songInfo: event.data.song_info,
                roundScores: event.data.round_scores
            }
        }));
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.dispatchEvent(new CustomEvent('error', {
                detail: { message: 'Maximum reconnection attempts exceeded' }
            }));
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            if (!this.connected) {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.connect();
            }
        }, delay);
    }
    
    // Soundbeats-specific command methods
    
    async getGameState() {
        return await this.sendCommand('soundbeatsv2/get_game_state');
    }
    
    async newGame(teamCount, playlistId, timerSeconds = 30) {
        return await this.sendCommand('soundbeatsv2/new_game', {
            team_count: teamCount,
            playlist_id: playlistId,
            timer_seconds: timerSeconds
        });
    }
    
    async submitGuess(teamId, year, hasBet = false) {
        return await this.sendCommand('soundbeatsv2/submit_guess', {
            team_id: teamId,
            year: year,
            has_bet: hasBet
        });
    }
    
    async startRound(song) {
        return await this.sendCommand('soundbeatsv2/start_round', {
            song: song
        });
    }
    
    async nextRound() {
        return await this.sendCommand('soundbeatsv2/next_round');
    }
    
    async updateTeamName(teamId, name) {
        return await this.sendCommand('soundbeatsv2/update_team_name', {
            team_id: teamId,
            name: name
        });
    }
    
    async assignUserToTeam(teamId, userId) {
        return await this.sendCommand('soundbeatsv2/assign_user_to_team', {
            team_id: teamId,
            user_id: userId
        });
    }
    
    async getHighscores() {
        return await this.sendCommand('soundbeatsv2/get_highscores');
    }
    
    async mediaControl(action, params = {}) {
        return await this.sendCommand('soundbeatsv2/media_control', {
            action: action,
            ...params
        });
    }
    
    // Connection state helpers
    
    isConnected() {
        return this.connected;
    }
    
    getConnectionState() {
        return {
            connected: this.connected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }
    
    // Event handler helpers
    
    onGameStateChanged(callback) {
        this.addEventListener('gameStateChanged', callback);
        return () => this.removeEventListener('gameStateChanged', callback);
    }
    
    onTimerUpdate(callback) {
        this.addEventListener('timerUpdate', callback);
        return () => this.removeEventListener('timerUpdate', callback);
    }
    
    onRoundEnded(callback) {
        this.addEventListener('roundEnded', callback);
        return () => this.removeEventListener('roundEnded', callback);
    }
    
    onConnected(callback) {
        this.addEventListener('connected', callback);
        return () => this.removeEventListener('connected', callback);
    }
    
    onDisconnected(callback) {
        this.addEventListener('disconnected', callback);
        return () => this.removeEventListener('disconnected', callback);
    }
    
    onError(callback) {
        this.addEventListener('error', callback);
        return () => this.removeEventListener('error', callback);
    }
}