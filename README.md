# 🎵 Soundbeats - Music Trivia Game for Home Assistant

[![HACS Badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub Release](https://img.shields.io/github/release/mholzi/Soundbeatsv2.svg)](https://github.com/mholzi/Soundbeatsv2/releases)
[![License](https://img.shields.io/github/license/mholzi/Soundbeatsv2.svg)](LICENSE)

Transform your Home Assistant into an interactive music trivia party game! Soundbeats brings the excitement of music guessing games to your smart home with multi-team support, year guessing mechanics, and seamless Spotify integration.

## ✨ Features

### 🎮 Game Mechanics
- **Multi-team Support**: 1-5 teams competing simultaneously
- **Year Guessing**: Players guess the release year of songs
- **Betting System**: Double-or-nothing betting for brave players
- **Score Tracking**: Persistent highscores by round number
- **Flexible Rounds**: Manual progression allows for discussion and fun

### 🎵 Music Integration
- **Spotify Support**: Direct integration with Spotify media players
- **Smart Playback**: Automatic 30-second snippets with configurable start positions
- **Multiple Playlists**: Support for different music categories (80s, 90s, Party Songs, etc.)
- **Album Art Display**: Visual song identification via media player

### 👥 Multi-User Modes
- **Single Admin**: One person controls the game flow
- **Multi-User**: Each team assigned to specific users/devices
- **Permission System**: Role-based access to game controls

### 📱 Responsive UI
- **Mobile-First Design**: Touch-friendly interface for phones and tablets
- **TV Display**: Large text and buttons perfect for living room setups
- **Custom Theme**: Gaming-inspired glassmorphism design with smooth animations
- **Real-Time Updates**: WebSocket-powered live game state synchronization

## 🚀 Installation

### Via HACS (Recommended)

1. **Add Custom Repository**:
   - Open HACS in Home Assistant
   - Go to "Integrations"
   - Click the three dots menu and select "Custom repositories"
   - Add `https://github.com/mholzi/Soundbeatsv2` as Integration
   - Category: Integration

2. **Install Soundbeats**:
   - Search for "Soundbeats" in HACS
   - Click "Download"
   - Restart Home Assistant

3. **Add Integration**:
   - Go to Settings → Devices & Services
   - Click "Add Integration"
   - Search for "Soundbeats"
   - Follow the configuration flow

### Manual Installation

1. **Download Files**:
   ```bash
   cd /config/custom_components/
   git clone https://github.com/mholzi/Soundbeatsv2.git soundbeats
   ```

2. **Restart Home Assistant**

3. **Add Integration** via Settings → Devices & Services

## ⚙️ Configuration

### Prerequisites

- **Home Assistant 2023.9.0+**
- **Spotify Integration**: Set up Spotify in Home Assistant
- **Media Player**: Any compatible media player (Spotify, Chromecast, etc.)

### Setup Steps

1. **Configure Soundbeats**:
   - Name your game instance
   - Select your media player entity
   - Choose default playlist and timer settings

2. **Prepare Music Database**:
   - Add your song collection to `songs.json`
   - Create playlists in `playlists.json`
   - Include album art URLs for visual identification

3. **Access Game Panel**:
   - Look for "Soundbeats" in the Home Assistant sidebar
   - Start your first game!

## 🎯 How to Play

### Game Setup

1. **Create New Game**:
   - Enter team names (1-5 teams)
   - Select music playlist
   - Set round timer (15-60 seconds)

2. **Assign Teams** (Multi-user mode):
   - Each team member clicks "Join Team"
   - Admin can manually assign users to teams

### Gameplay

1. **Round Flow**:
   - Admin starts round → Music plays for 30 seconds
   - Teams submit year guesses and decide whether to bet
   - Admin ends round → Scores calculated and revealed
   - Admin proceeds to next round

2. **Scoring System**:
   - **Exact Match**: 10 points
   - **Close Match (±2 years)**: 5 points
   - **Wrong Answer**: 0 points
   - **Betting**: Double points if correct, lose 10 points if wrong

3. **Winning**:
   - Game continues until desired number of rounds
   - Highest cumulative score wins
   - Highscores saved for comparison across games

## 🔧 Advanced Configuration

### Custom Song Database

Create `frontend/src/data/songs.json`:

```json
[
  {
    "id": 1,
    "url": "https://open.spotify.com/track/your-track-id",
    "year": 1985,
    "song": "Take On Me",
    "artist": "a-ha",
    "playlist_ids": ["80s", "pop", "default"]
  }
]
```

### Custom Playlists

Create `frontend/src/data/playlists.json`:

```json
[
  {
    "id": "80s",
    "name": "80s Hits",
    "description": "Greatest hits from the 1980s",
    "song_ids": [1, 2, 3, 4, 5],
    "cover_image": "/local/soundbeats/80s-cover.jpg"
  }
]
```

### Environment Variables

Set in Home Assistant configuration:

```yaml
# configuration.yaml
soundbeats:
  default_timer: 30
  max_teams: 5
  enable_betting: true
  auto_advance: false
```

## 🎮 Game Modes

### Party Mode (Recommended)
- Large TV display for song information
- Mobile devices for team controls
- Voice announcement of scores
- Social gameplay with discussion between rounds

### Competitive Mode
- Strict timing and scoring
- Hidden guesses until round end
- Automatic progression
- Tournament-style brackets

### Family Mode
- Longer timers for discussion
- Simplified scoring (no betting)
- Age-appropriate music playlists
- Cooperative elements

## 📊 API Reference

### WebSocket Commands

```javascript
// Create new game
{
  "type": "soundbeats/new_game",
  "team_names": ["Team Alpha", "Team Beta"],
  "playlist_id": "80s",
  "timer_seconds": 30
}

// Submit guess
{
  "type": "soundbeats/submit_guess",
  "team_id": "team_0",
  "guess": 1985,
  "has_bet": true
}

// Control playback
{
  "type": "soundbeats/start_round"
}
```

### REST API Endpoints

```http
GET /api/soundbeats/state
GET /api/soundbeats/highscores?round=3
POST /api/soundbeats/reset
```

## 🐛 Troubleshooting

### Common Issues

**Music not playing**:
- Verify Spotify integration is working
- Check media player entity configuration
- Ensure Spotify URLs are valid and accessible

**Teams not updating**:
- Check WebSocket connection in browser dev tools
- Verify Home Assistant WebSocket API is accessible
- Restart integration if needed

**Scores not saving**:
- Check Home Assistant logs for errors
- Verify write permissions in config directory
- Ensure sufficient storage space

### Debug Mode

Enable debug logging in `configuration.yaml`:

```yaml
logger:
  default: info
  logs:
    custom_components.soundbeats: debug
```

### Performance Optimization

For large song databases (1000+ songs):
- Use SSD storage for faster JSON loading
- Consider splitting playlists by decade/genre
- Optimize images for web (WebP format recommended)
- Use CDN for album art if hosting remotely

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/mholzi/Soundbeatsv2.git
cd Soundbeatsv2

# Install dependencies
npm install
pip install -r requirements-test.txt

# Run tests
npm run test
pytest

# Build for production
npm run build
```

### Reporting Issues

Please use our [GitHub Issues](https://github.com/mholzi/Soundbeatsv2/issues) with:
- Home Assistant version
- Soundbeats version
- Detailed error description
- Relevant log entries

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Home Assistant community for the amazing platform
- Spotify for music integration capabilities
- Lit Element for modern web components
- All contributors and testers

## 🔗 Links

- [Home Assistant](https://www.home-assistant.io/)
- [HACS](https://hacs.xyz/)
- [Spotify Integration](https://www.home-assistant.io/integrations/spotify/)
- [Lit Element](https://lit.dev/)

---

**Made with ❤️ for the Home Assistant community**