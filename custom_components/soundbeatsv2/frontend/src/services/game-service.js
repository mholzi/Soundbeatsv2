/**
 * Game service for managing game state and logic on the frontend
 */
export class GameService extends EventTarget {
    constructor(websocketService) {
        super();
        this.ws = websocketService;
        this.gameState = null;
        this.highscores = null;
        this.songs = null;
        this.playlists = null;
        
        // Set up WebSocket event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for WebSocket events and update local state
        this.ws.onGameStateChanged((event) => {
            this.handleGameStateChange(event.detail);
        });
        
        this.ws.onTimerUpdate((event) => {
            this.handleTimerUpdate(event.detail);
        });
        
        this.ws.onRoundEnded((event) => {
            this.handleRoundEnded(event.detail);
        });
        
        this.ws.onError((event) => {
            this.dispatchEvent(new CustomEvent('error', {
                detail: { message: event.detail.message }
            }));
        });
    }
    
    // State management
    
    async loadGameState() {
        try {
            const state = await this.ws.getGameState();
            this.gameState = state;
            
            this.dispatchEvent(new CustomEvent('stateChanged', {
                detail: this.gameState
            }));
            
            return this.gameState;
        } catch (error) {
            console.error('Failed to load game state:', error);
            throw error;
        }
    }
    
    async loadHighscores() {
        try {
            this.highscores = await this.ws.getHighscores();
            
            this.dispatchEvent(new CustomEvent('highscoresChanged', {
                detail: this.highscores
            }));
            
            return this.highscores;
        } catch (error) {
            console.error('Failed to load highscores:', error);
            throw error;
        }
    }
    
    async loadSongs() {
        if (this.songs) {
            return this.songs;
        }
        
        try {
            // Import song data
            const response = await fetch('/soundbeats_files/src/data/songs.json');
            this.songs = await response.json();
            return this.songs;
        } catch (error) {
            console.error('Failed to load songs:', error);
            // Return placeholder data if loading fails
            return this.getPlaceholderSongs();
        }
    }
    
    async loadPlaylists() {
        if (this.playlists) {
            return this.playlists;
        }
        
        try {
            // Import playlist data
            const response = await fetch('/soundbeats_files/src/data/playlists.json');
            this.playlists = await response.json();
            return this.playlists;
        } catch (error) {
            console.error('Failed to load playlists:', error);
            // Return placeholder data if loading fails
            return this.getPlaceholderPlaylists();
        }
    }
    
    // Game control methods
    
    async newGame(teamCount, playlistId, timerSeconds = 30) {
        try {
            const result = await this.ws.newGame(teamCount, playlistId, timerSeconds);
            
            // Reload game state after creating new game
            await this.loadGameState();
            
            return result;
        } catch (error) {
            console.error('Failed to start new game:', error);
            throw error;
        }
    }
    
    async startRound(song) {
        try {
            const result = await this.ws.startRound(song);
            
            // Update local state - immutable update
            if (this.gameState) {
                this.gameState = {
                    ...this.gameState,
                    round_active: true,
                    current_song: song,
                    timer_remaining: this.gameState.timer_seconds
                };
                
                this.dispatchEvent(new CustomEvent('stateChanged', {
                    detail: this.gameState
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Failed to start round:', error);
            throw error;
        }
    }
    
    async nextRound() {
        try {
            const result = await this.ws.nextRound();
            
            // Update local state - immutable update
            if (this.gameState) {
                this.gameState = {
                    ...this.gameState,
                    round_active: false,
                    current_song: null,
                    timer_remaining: 0,
                    // Reset team guesses using map for immutable update
                    teams: this.gameState.teams ? this.gameState.teams.map(team => ({
                        ...team,
                        current_guess: null,
                        has_bet: false
                    })) : this.gameState.teams
                };
                
                this.dispatchEvent(new CustomEvent('stateChanged', {
                    detail: this.gameState
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Failed to advance to next round:', error);
            throw error;
        }
    }
    
    async submitGuess(teamId, year, hasBet = false) {
        try {
            const result = await this.ws.submitGuess(teamId, year, hasBet);
            
            // Update local state optimistically - immutable update
            if (this.gameState && this.gameState.teams) {
                this.gameState = {
                    ...this.gameState,
                    teams: this.gameState.teams.map(team => 
                        team.id === teamId 
                            ? { ...team, current_guess: year, has_bet: hasBet }
                            : team
                    )
                };
                
                this.dispatchEvent(new CustomEvent('stateChanged', {
                    detail: this.gameState
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Failed to submit guess:', error);
            throw error;
        }
    }
    
    async updateTeamName(teamId, name) {
        try {
            const result = await this.ws.updateTeamName(teamId, name);
            
            // Update local state optimistically - immutable update
            if (this.gameState && this.gameState.teams) {
                this.gameState = {
                    ...this.gameState,
                    teams: this.gameState.teams.map(team => 
                        team.id === teamId 
                            ? { ...team, name: name }
                            : team
                    )
                };
                
                this.dispatchEvent(new CustomEvent('stateChanged', {
                    detail: this.gameState
                }));
            }
            
            return result;
        } catch (error) {
            console.error('Failed to update team name:', error);
            throw error;
        }
    }
    
    async assignUserToTeam(teamId, userId) {
        try {
            const result = await this.ws.assignUserToTeam(teamId, userId);
            
            // Reload state to get updated assignments
            await this.loadGameState();
            
            return result;
        } catch (error) {
            console.error('Failed to assign user to team:', error);
            throw error;
        }
    }
    
    async mediaControl(action, params = {}) {
        try {
            return await this.ws.mediaControl(action, params);
        } catch (error) {
            console.error('Media control failed:', error);
            throw error;
        }
    }
    
    async endGame() {
        try {
            // End the current game by creating a new game with 0 teams
            // This effectively resets the game state
            const result = await this.ws.newGame(0, 'default', 30);
            
            // Reload game state to get the updated (empty) state
            await this.loadGameState();
            
            return result;
        } catch (error) {
            console.error('Failed to end game:', error);
            throw error;
        }
    }
    
    // Song management
    
    async getRandomSong(playlistId = 'default') {
        const songs = await this.loadSongs();
        const playlists = await this.loadPlaylists();
        
        // Filter songs by playlist
        let availableSongs;
        if (playlistId === 'default' || !playlists[playlistId]) {
            availableSongs = songs;
        } else {
            availableSongs = songs.filter(song => 
                song.playlist_ids && song.playlist_ids.includes(playlistId)
            );
        }
        
        // Filter out already played songs
        if (this.gameState && this.gameState.played_song_ids) {
            availableSongs = availableSongs.filter(song => 
                !this.gameState.played_song_ids.includes(song.id)
            );
        }
        
        if (availableSongs.length === 0) {
            throw new Error('No more songs available in this playlist');
        }
        
        // Return random song
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        return availableSongs[randomIndex];
    }
    
    // Event handlers
    
    handleGameStateChange(data) {
        const oldState = this.gameState;
        this.gameState = { ...this.gameState, ...data };
        
        // Enhanced debug logging to verify state changes and UI reactivity
        console.log('GameState changed:', {
            oldReference: oldState,
            newReference: this.gameState,
            referenceChanged: oldState !== this.gameState, // Should be true
            dataReceived: data,
            oldActive: oldState?.active,
            newActive: this.gameState?.active,
            oldRoundActive: oldState?.round_active,
            newRoundActive: this.gameState?.round_active,
            oldCurrentRound: oldState?.current_round,
            newCurrentRound: this.gameState?.current_round,
            oldTeamsCount: oldState?.teams?.length,
            newTeamsCount: this.gameState?.teams?.length
        });
        
        this.dispatchEvent(new CustomEvent('stateChanged', {
            detail: this.gameState
        }));
    }
    
    handleTimerUpdate(data) {
        if (this.gameState && data.gameId === this.gameState.game_id) {
            // Create new object reference for immutable update
            this.gameState = {
                ...this.gameState,
                timer_remaining: data.timeRemaining
            };
            
            // Dispatch specific timer event
            this.dispatchEvent(new CustomEvent('timerUpdate', {
                detail: { timeRemaining: data.timeRemaining }
            }));
            
            // Trigger state change with new reference
            this.dispatchEvent(new CustomEvent('stateChanged', {
                detail: this.gameState
            }));
        }
    }
    
    handleRoundEnded(data) {
        if (this.gameState && data.gameId === this.gameState.game_id) {
            // Create new state with song info - immutable update
            this.gameState = {
                ...this.gameState,
                round_active: false,
                current_song: data.songInfo // Store complete song info including image_url
            };
            
            this.dispatchEvent(new CustomEvent('roundEnded', {
                detail: {
                    round: data.round,
                    actualYear: data.actualYear,
                    songInfo: data.songInfo,
                    roundScores: data.roundScores
                }
            }));
            
            // Trigger state change with new reference
            this.dispatchEvent(new CustomEvent('stateChanged', {
                detail: this.gameState
            }));
        }
    }
    
    // Utility methods
    
    getGameState() {
        return this.gameState;
    }
    
    getHighscores() {
        return this.highscores;
    }
    
    calculateScore(guess, actualYear, hasBet) {
        const difference = Math.abs(guess - actualYear);
        
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
    
    getPlaceholderSongs() {
        // Return placeholder songs if loading fails
        return [
            {
                id: 1,
                url: "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv",
                year: 1975,
                song: "Bohemian Rhapsody",
                artist: "Queen",
                playlist_ids: ["default", "rock"]
            },
            {
                id: 2,
                url: "https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5",
                year: 1982,
                song: "Billie Jean",
                artist: "Michael Jackson",
                playlist_ids: ["default", "80s", "pop"]
            },
            {
                id: 3,
                url: "https://open.spotify.com/track/4VqPOruhp5EdPBeR92t6lQ",
                year: 1991,
                song: "Smells Like Teen Spirit",
                artist: "Nirvana",
                playlist_ids: ["default", "90s", "rock"]
            }
        ];
    }
    
    getPlaceholderPlaylists() {
        // Return placeholder playlists if loading fails
        return {
            default: {
                id: "default",
                name: "Default Mix",
                description: "A mix of popular songs from all eras",
                image_url: "/soundbeats_files/src/data/playlist-images/default.jpg"
            },
            "80s": {
                id: "80s",
                name: "80s Hits",
                description: "Greatest hits from the 1980s",
                image_url: "/soundbeats_files/src/data/playlist-images/80s.jpg"
            },
            "90s": {
                id: "90s",
                name: "90s Classics",
                description: "Iconic songs from the 1990s",
                image_url: "/soundbeats_files/src/data/playlist-images/90s.jpg"
            },
            rock: {
                id: "rock",
                name: "Rock Anthems",
                description: "Classic rock songs across all decades",
                image_url: "/soundbeats_files/src/data/playlist-images/rock.jpg"
            },
            pop: {
                id: "pop",
                name: "Pop Favorites",
                description: "Popular mainstream hits",
                image_url: "/soundbeats_files/src/data/playlist-images/pop.jpg"
            }
        };
    }
    
    // Event listener helpers
    
    onStateChanged(callback) {
        this.addEventListener('stateChanged', callback);
        return () => this.removeEventListener('stateChanged', callback);
    }
    
    onTimerUpdate(callback) {
        this.addEventListener('timerUpdate', callback);
        return () => this.removeEventListener('timerUpdate', callback);
    }
    
    onRoundEnded(callback) {
        this.addEventListener('roundEnded', callback);
        return () => this.removeEventListener('roundEnded', callback);
    }
    
    onHighscoresChanged(callback) {
        this.addEventListener('highscoresChanged', callback);
        return () => this.removeEventListener('highscoresChanged', callback);
    }
    
    onError(callback) {
        this.addEventListener('error', callback);
        return () => this.removeEventListener('error', callback);
    }
}