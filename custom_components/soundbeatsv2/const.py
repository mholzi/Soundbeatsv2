"""Constants for the Soundbeats integration."""
from typing import Final

DOMAIN: Final = "soundbeatsv2"

# Configuration
CONF_MEDIA_PLAYER: Final = "media_player"
CONF_TIMER_SECONDS: Final = "timer_seconds"
CONF_MAX_TEAMS: Final = "max_teams"

# Defaults
DEFAULT_TIMER_SECONDS: Final = 30
DEFAULT_MAX_TEAMS: Final = 5
MIN_TIMER_SECONDS: Final = 5
MAX_TIMER_SECONDS: Final = 300

# Game constants
POINTS_EXACT_YEAR: Final = 10
POINTS_WITHIN_3_YEARS: Final = 5
POINTS_WITHIN_5_YEARS: Final = 2
POINTS_EXACT_WITH_BET: Final = 20
POINTS_WRONG_WITH_BET: Final = 0

# Storage keys
STORAGE_KEY_HIGHSCORES: Final = "highscores"
STORAGE_KEY_GAME_STATE: Final = "game_state"
STORAGE_VERSION: Final = 1

# WebSocket event types
EVENT_GAME_STATE_CHANGED: Final = f"{DOMAIN}_game_state_changed"
EVENT_TIMER_UPDATE: Final = f"{DOMAIN}_timer_update"
EVENT_ROUND_ENDED: Final = f"{DOMAIN}_round_ended"
EVENT_GAME_ENDED: Final = f"{DOMAIN}_game_ended"

# Attributes
ATTR_GAME_ID: Final = "game_id"
ATTR_TEAMS: Final = "teams"
ATTR_CURRENT_ROUND: Final = "current_round"
ATTR_TIMER_REMAINING: Final = "timer_remaining"
ATTR_ROUND_ACTIVE: Final = "round_active"
ATTR_CURRENT_SONG: Final = "current_song"
ATTR_SCORES: Final = "scores"