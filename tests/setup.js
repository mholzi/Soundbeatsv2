/**
 * Jest setup file for Soundbeats tests
 */

// Mock Home Assistant connection and APIs
global.mockHass = {
  connection: {
    sendMessagePromise: jest.fn(),
    subscribeEvents: jest.fn(),
  },
  user: {
    id: 'test-user',
    name: 'Test User',
    is_admin: true,
  },
  states: {
    'media_player.test': {
      state: 'idle',
      attributes: {
        volume_level: 0.5,
        source: 'Test Source',
        source_list: ['Test Source', 'Another Source'],
      },
    },
  },
  services: {
    async_call: jest.fn(),
  },
  data: {},
  config: {
    path: jest.fn().mockReturnValue('/test/path'),
  },
  http: {
    async_register_static_paths: jest.fn(),
  },
  bus: {
    async_fire: jest.fn(),
  },
};

// Mock WebSocket API responses
global.mockWebSocketResponses = {
  'soundbeatsv2/get_game_state': {
    active: false,
    game_id: null,
    teams: [],
    current_round: 0,
    round_active: false,
    timer_remaining: 0,
  },
  'soundbeatsv2/new_game': {
    success: true,
    game_id: 'test-game-123',
    teams: 3,
  },
  'soundbeatsv2/submit_guess': {
    success: true,
  },
  'soundbeatsv2/start_round': {
    success: true,
  },
  'soundbeatsv2/next_round': {
    success: true,
  },
};

// Mock fetch for loading JSON data
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([
      {
        id: 1,
        url: 'https://open.spotify.com/track/test',
        year: 1985,
        song: 'Test Song',
        artist: 'Test Artist',
        playlist_ids: ['default', 'test'],
      },
    ]),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock custom elements registry
global.customElements = {
  define: jest.fn(),
  get: jest.fn(),
  whenDefined: jest.fn().mockResolvedValue(),
};

// Mock DOM APIs
global.window = {
  ...global.window,
  location: {
    hash: '',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Mock navigator for vibration API
global.navigator = {
  ...global.navigator,
  vibrate: jest.fn(),
};

// Setup and teardown for each test
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  fetch.mockResolvedValue({
    json: () => Promise.resolve([]),
  });
  
  // Reset WebSocket mock responses
  mockHass.connection.sendMessagePromise.mockImplementation((message) => {
    const response = mockWebSocketResponses[message.type];
    return Promise.resolve(response || { success: true });
  });
});

afterEach(() => {
  // Clean up any side effects
  jest.restoreAllMocks();
});

// Helper functions for tests
global.testHelpers = {
  // Create a mock game state
  createMockGameState: (overrides = {}) => ({
    active: true,
    game_id: 'test-game-123',
    teams: [
      { id: 'team_0', name: 'Team 1', score: 0, current_guess: null, has_bet: false },
      { id: 'team_1', name: 'Team 2', score: 10, current_guess: 1985, has_bet: true },
    ],
    current_round: 1,
    round_active: false,
    timer_remaining: 0,
    timer_seconds: 30,
    playlist_id: 'default',
    ...overrides,
  }),
  
  // Create a mock song
  createMockSong: (overrides = {}) => ({
    id: 1,
    url: 'https://open.spotify.com/track/test',
    year: 1985,
    song: 'Test Song',
    artist: 'Test Artist',
    playlist_ids: ['default'],
    ...overrides,
  }),
  
  // Create a mock team
  createMockTeam: (overrides = {}) => ({
    id: 'team_0',
    name: 'Team 1',
    score: 0,
    current_guess: null,
    has_bet: false,
    assigned_user: null,
    ...overrides,
  }),
  
  // Simulate WebSocket events
  simulateWebSocketEvent: (eventType, data) => {
    const eventHandlers = mockHass.connection.subscribeEvents.mock.calls
      .filter(call => call[1] === eventType)
      .map(call => call[0]);
    
    eventHandlers.forEach(handler => {
      handler({ data });
    });
  },
  
  // Wait for next tick
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock Date.now for consistent timestamps
  mockDate: (timestamp) => {
    const mockNow = jest.spyOn(Date, 'now').mockReturnValue(timestamp);
    return mockNow;
  },
};