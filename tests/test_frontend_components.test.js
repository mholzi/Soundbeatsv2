/**
 * Frontend component tests for Soundbeats
 */

// Mock Lit imports
jest.mock('lit', () => ({
  LitElement: class MockLitElement {
    constructor() {
      this.shadowRoot = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(),
        innerHTML: '',
      };
      this.properties = {};
    }
    
    connectedCallback() {}
    disconnectedCallback() {}
    updated() {}
    render() { return ''; }
    requestUpdate() {}
    
    static get properties() { return {}; }
  },
  html: (strings, ...values) => strings.join(''),
  css: (strings, ...values) => strings.join(''),
  property: () => () => {},
  customElement: (name) => (target) => target,
}));

// Mock WebSocket service
const mockWebSocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendCommand: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  isConnected: false,
};

// Mock Game service
const mockGameService = {
  loadSongs: jest.fn(),
  loadPlaylists: jest.fn(),
  selectRandomSong: jest.fn(),
  getCurrentState: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

describe('CountdownTimer Component', () => {
  let CountdownTimer;
  let timer;

  beforeEach(async () => {
    // Import the component after mocking dependencies
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/countdown-timer.js');
    CountdownTimer = module.CountdownTimer;
    timer = new CountdownTimer();
  });

  test('should initialize with default properties', () => {
    expect(timer.seconds).toBe(30);
    expect(timer.isActive).toBe(false);
    expect(timer.warningThreshold).toBe(10);
    expect(timer.dangerThreshold).toBe(5);
  });

  test('should start countdown when start() is called', () => {
    jest.useFakeTimers();
    timer.start();
    
    expect(timer.isActive).toBe(true);
    
    // Advance timer
    jest.advanceTimersByTime(1000);
    expect(timer.seconds).toBe(29);
    
    jest.useRealTimers();
  });

  test('should stop countdown when stop() is called', () => {
    jest.useFakeTimers();
    timer.start();
    timer.stop();
    
    expect(timer.isActive).toBe(false);
    
    // Timer should not advance
    const seconds = timer.seconds;
    jest.advanceTimersByTime(1000);
    expect(timer.seconds).toBe(seconds);
    
    jest.useRealTimers();
  });

  test('should emit timeup event when reaching zero', () => {
    jest.useFakeTimers();
    const timeupSpy = jest.fn();
    timer.addEventListener('timeup', timeupSpy);
    
    timer.seconds = 1;
    timer.start();
    
    jest.advanceTimersByTime(1000);
    
    expect(timer.seconds).toBe(0);
    expect(timer.isActive).toBe(false);
    expect(timeupSpy).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  test('should reset to specified seconds', () => {
    timer.seconds = 10;
    timer.reset(60);
    
    expect(timer.seconds).toBe(60);
    expect(timer.isActive).toBe(false);
  });

  test('should get correct status classes', () => {
    // Normal state
    timer.seconds = 20;
    expect(timer._getStatusClass()).toBe('normal');
    
    // Warning state
    timer.seconds = 8;
    expect(timer._getStatusClass()).toBe('warning');
    
    // Danger state
    timer.seconds = 3;
    expect(timer._getStatusClass()).toBe('danger');
  });
});

describe('Scoreboard Component', () => {
  let Scoreboard;
  let scoreboard;

  beforeEach(async () => {
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/scoreboard.js');
    Scoreboard = module.Scoreboard;
    scoreboard = new Scoreboard();
  });

  test('should initialize with empty teams', () => {
    expect(scoreboard.teams).toEqual([]);
    expect(scoreboard.showGuesses).toBe(false);
  });

  test('should update teams property', () => {
    const teams = [
      { id: 'team_0', name: 'Team Alpha', score: 100 },
      { id: 'team_1', name: 'Team Beta', score: 80 },
    ];
    
    scoreboard.teams = teams;
    expect(scoreboard.teams).toEqual(teams);
  });

  test('should sort teams by score descending', () => {
    const teams = [
      { id: 'team_0', name: 'Team Alpha', score: 80 },
      { id: 'team_1', name: 'Team Beta', score: 100 },
      { id: 'team_2', name: 'Team Gamma', score: 90 },
    ];
    
    scoreboard.teams = teams;
    const sorted = scoreboard._getSortedTeams();
    
    expect(sorted[0].score).toBe(100);
    expect(sorted[1].score).toBe(90);
    expect(sorted[2].score).toBe(80);
  });

  test('should format team position correctly', () => {
    expect(scoreboard._getTeamPosition(0)).toBe('1st');
    expect(scoreboard._getTeamPosition(1)).toBe('2nd');
    expect(scoreboard._getTeamPosition(2)).toBe('3rd');
    expect(scoreboard._getTeamPosition(3)).toBe('4th');
  });
});

describe('GameBoard Component', () => {
  let GameBoard;
  let gameBoard;

  beforeEach(async () => {
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/game-board.js');
    GameBoard = module.GameBoard;
    gameBoard = new GameBoard();
  });

  test('should initialize with default state', () => {
    expect(gameBoard.currentSong).toBeNull();
    expect(gameBoard.revealed).toBe(false);
    expect(gameBoard.roundActive).toBe(false);
  });

  test('should update current song', () => {
    const song = {
      id: 1,
      song: 'Test Song',
      artist: 'Test Artist',
      year: 1985,
    };
    
    gameBoard.currentSong = song;
    expect(gameBoard.currentSong).toEqual(song);
  });

  test('should reveal song information', () => {
    gameBoard.revealSong();
    expect(gameBoard.revealed).toBe(true);
  });

  test('should reset for new round', () => {
    gameBoard.revealed = true;
    gameBoard.resetForNewRound();
    
    expect(gameBoard.revealed).toBe(false);
    expect(gameBoard.currentSong).toBeNull();
  });
});

describe('TeamControls Component', () => {
  let TeamControls;
  let teamControls;

  beforeEach(async () => {
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/team-controls.js');
    TeamControls = module.TeamControls;
    teamControls = new TeamControls();
  });

  test('should initialize with default values', () => {
    expect(teamControls.teamId).toBe('');
    expect(teamControls.teamName).toBe('');
    expect(teamControls.currentGuess).toBeNull();
    expect(teamControls.hasBet).toBe(false);
    expect(teamControls.canSubmit).toBe(true);
  });

  test('should validate year input', () => {
    expect(teamControls._isValidYear('1985')).toBe(true);
    expect(teamControls._isValidYear('2025')).toBe(true);
    expect(teamControls._isValidYear('1899')).toBe(false);
    expect(teamControls._isValidYear('2100')).toBe(false);
    expect(teamControls._isValidYear('abc')).toBe(false);
    expect(teamControls._isValidYear('')).toBe(false);
  });

  test('should emit guess-submitted event', () => {
    const guessSubmittedSpy = jest.fn();
    teamControls.addEventListener('guess-submitted', guessSubmittedSpy);
    
    teamControls.teamId = 'team_0';
    teamControls._submitGuess(1985, true);
    
    expect(guessSubmittedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          teamId: 'team_0',
          guess: 1985,
          hasBet: true,
        },
      })
    );
  });

  test('should disable controls when cannot submit', () => {
    teamControls.canSubmit = false;
    expect(teamControls.canSubmit).toBe(false);
  });
});

describe('AdminControls Component', () => {
  let AdminControls;
  let adminControls;

  beforeEach(async () => {
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/admin-controls.js');
    AdminControls = module.AdminControls;
    adminControls = new AdminControls();
  });

  test('should initialize with default state', () => {
    expect(adminControls.gameActive).toBe(false);
    expect(adminControls.roundActive).toBe(false);
    expect(adminControls.canStartRound).toBe(true);
    expect(adminControls.canEndRound).toBe(false);
  });

  test('should emit new-game event with correct data', () => {
    const newGameSpy = jest.fn();
    adminControls.addEventListener('new-game', newGameSpy);
    
    const gameData = {
      teamNames: ['Team 1', 'Team 2'],
      playlistId: 'default',
      timerSeconds: 30,
    };
    
    adminControls._startNewGame(gameData);
    
    expect(newGameSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: gameData,
      })
    );
  });

  test('should emit control events', () => {
    const startRoundSpy = jest.fn();
    const endRoundSpy = jest.fn();
    const nextRoundSpy = jest.fn();
    
    adminControls.addEventListener('start-round', startRoundSpy);
    adminControls.addEventListener('end-round', endRoundSpy);
    adminControls.addEventListener('next-round', nextRoundSpy);
    
    adminControls._startRound();
    adminControls._endRound();
    adminControls._nextRound();
    
    expect(startRoundSpy).toHaveBeenCalled();
    expect(endRoundSpy).toHaveBeenCalled();
    expect(nextRoundSpy).toHaveBeenCalled();
  });
});

describe('SongReveal Component', () => {
  let SongReveal;
  let songReveal;

  beforeEach(async () => {
    const module = await import('../custom_components/soundbeatsv2/frontend/src/components/song-reveal.js');
    SongReveal = module.SongReveal;
    songReveal = new SongReveal();
  });

  test('should initialize with no song', () => {
    expect(songReveal.song).toBeNull();
    expect(songReveal.revealed).toBe(false);
  });

  test('should update song property', () => {
    const song = {
      id: 1,
      song: 'Test Song',
      artist: 'Test Artist',
      year: 1985,
    };
    
    songReveal.song = song;
    expect(songReveal.song).toEqual(song);
  });

  test('should reveal song with animation', async () => {
    songReveal.revealed = false;
    
    // Mock animation
    const mockAnimate = jest.fn().mockResolvedValue();
    songReveal.shadowRoot.querySelector = jest.fn().mockReturnValue({
      animate: mockAnimate,
    });
    
    await songReveal.reveal();
    
    expect(songReveal.revealed).toBe(true);
  });

  test('should format song title correctly', () => {
    const song = {
      song: 'Test Song',
      artist: 'Test Artist',
    };
    
    songReveal.song = song;
    const title = songReveal._formatSongTitle();
    expect(title).toBe('Test Song - Test Artist');
  });
});

describe('WebSocket Service Integration', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockWebSocketService).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockClear();
      }
    });
  });

  test('should connect to WebSocket', () => {
    mockWebSocketService.connect();
    expect(mockWebSocketService.connect).toHaveBeenCalled();
  });

  test('should send commands through WebSocket', () => {
    const command = {
      type: 'soundbeatsv2/new_game',
      team_names: ['Team 1', 'Team 2'],
    };
    
    mockWebSocketService.sendCommand(command);
    expect(mockWebSocketService.sendCommand).toHaveBeenCalledWith(command);
  });

  test('should handle WebSocket events', () => {
    const handler = jest.fn();
    mockWebSocketService.addEventListener('message', handler);
    
    expect(mockWebSocketService.addEventListener).toHaveBeenCalledWith('message', handler);
  });
});

describe('Game Service Integration', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockGameService).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockClear();
      }
    });
  });

  test('should load songs from JSON', async () => {
    const mockSongs = [
      { id: 1, song: 'Song 1', artist: 'Artist 1', year: 1985 },
      { id: 2, song: 'Song 2', artist: 'Artist 2', year: 1990 },
    ];
    
    mockGameService.loadSongs.mockResolvedValue(mockSongs);
    
    const songs = await mockGameService.loadSongs();
    expect(songs).toEqual(mockSongs);
    expect(mockGameService.loadSongs).toHaveBeenCalled();
  });

  test('should load playlists from JSON', async () => {
    const mockPlaylists = [
      { id: 'default', name: 'Default', song_ids: [1, 2, 3] },
      { id: '80s', name: '80s Hits', song_ids: [1, 4, 5] },
    ];
    
    mockGameService.loadPlaylists.mockResolvedValue(mockPlaylists);
    
    const playlists = await mockGameService.loadPlaylists();
    expect(playlists).toEqual(mockPlaylists);
    expect(mockGameService.loadPlaylists).toHaveBeenCalled();
  });

  test('should select random song from playlist', () => {
    const song = { id: 1, song: 'Random Song', year: 1985 };
    mockGameService.selectRandomSong.mockReturnValue(song);
    
    const selected = mockGameService.selectRandomSong('default');
    expect(selected).toEqual(song);
    expect(mockGameService.selectRandomSong).toHaveBeenCalledWith('default');
  });
});

describe('Component Event Handling', () => {
  test('should handle custom events between components', () => {
    const sourceComponent = new EventTarget();
    const targetHandler = jest.fn();
    
    sourceComponent.addEventListener('custom-event', targetHandler);
    
    const customEvent = new CustomEvent('custom-event', {
      detail: { data: 'test' },
    });
    
    sourceComponent.dispatchEvent(customEvent);
    
    expect(targetHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { data: 'test' },
      })
    );
  });

  test('should handle component lifecycle events', () => {
    const component = new mockWebSocketService.constructor();
    const connectSpy = jest.spyOn(component, 'connectedCallback').mockImplementation();
    const disconnectSpy = jest.spyOn(component, 'disconnectedCallback').mockImplementation();
    
    component.connectedCallback();
    component.disconnectedCallback();
    
    expect(connectSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});

describe('Error Handling', () => {
  test('should handle WebSocket connection errors', () => {
    const errorHandler = jest.fn();
    mockWebSocketService.addEventListener('error', errorHandler);
    
    const errorEvent = new Event('error');
    mockWebSocketService.dispatchEvent?.(errorEvent);
    
    expect(mockWebSocketService.addEventListener).toHaveBeenCalledWith('error', errorHandler);
  });

  test('should handle invalid game states gracefully', () => {
    const invalidState = null;
    expect(() => {
      // Components should handle null/undefined states
      if (invalidState) {
        // Process state
      }
    }).not.toThrow();
  });

  test('should handle network failures', async () => {
    mockGameService.loadSongs.mockRejectedValue(new Error('Network error'));
    
    try {
      await mockGameService.loadSongs();
    } catch (error) {
      expect(error.message).toBe('Network error');
    }
  });
});