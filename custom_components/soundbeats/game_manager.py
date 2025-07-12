"""Game state management for Soundbeats."""
import asyncio
import json
import logging
import random
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_CURRENT_ROUND,
    ATTR_GAME_ID,
    ATTR_ROUND_ACTIVE,
    ATTR_SCORES,
    ATTR_TEAMS,
    ATTR_TIMER_REMAINING,
    DOMAIN,
    EVENT_GAME_STATE_CHANGED,
    EVENT_ROUND_ENDED,
    EVENT_TIMER_UPDATE,
    POINTS_EXACT_WITH_BET,
    POINTS_EXACT_YEAR,
    POINTS_WITHIN_3_YEARS,
    POINTS_WITHIN_5_YEARS,
    POINTS_WRONG_WITH_BET,
    STORAGE_KEY_GAME_STATE,
    STORAGE_KEY_HIGHSCORES,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)


@dataclass
class Team:
    """Team data model."""
    
    id: str
    name: str
    score: int = 0
    current_guess: Optional[int] = None
    has_bet: bool = False
    assigned_user: Optional[str] = None


@dataclass
class GameRound:
    """Game round data model."""
    
    round_number: int
    song_id: int
    team_guesses: Dict[str, int] = field(default_factory=dict)
    team_bets: Dict[str, bool] = field(default_factory=dict)
    team_scores: Dict[str, int] = field(default_factory=dict)
    actual_year: int = 0
    timestamp: datetime = field(default_factory=lambda: dt_util.now())


@dataclass
class GameState:
    """Game state data model."""
    
    game_id: str
    teams: List[Team]
    current_round: int
    rounds_played: List[GameRound]
    playlist_id: str
    played_song_ids: List[int]
    timer_seconds: int = 30
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: dt_util.now())


@dataclass
class HighscoreEntry:
    """Highscore entry data model."""
    
    team_name: str
    score_per_round: float
    rounds_played: int
    date: datetime
    playlist_id: str


@dataclass  
class HighscoreTracker:
    """Highscore tracking data model."""
    
    by_round: Dict[int, List[HighscoreEntry]] = field(default_factory=dict)
    all_time_best: Optional[HighscoreEntry] = None


class GameManager:
    """Manages game state and logic."""
    
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the game manager."""
        self.hass = hass
        self.entry = entry
        self._game_state: Optional[GameState] = None
        self._highscores: HighscoreTracker = HighscoreTracker()
        self._timer_task: Optional[asyncio.Task] = None
        self._timer_remaining: int = 0
        self._round_active: bool = False
        self._current_song: Optional[Dict[str, Any]] = None
        self._lock = asyncio.Lock()
        
        # Storage
        self._store_state = Store(
            hass, 
            STORAGE_VERSION, 
            f"{DOMAIN}.{entry.entry_id}.{STORAGE_KEY_GAME_STATE}"
        )
        self._store_highscores = Store(
            hass, 
            STORAGE_VERSION, 
            f"{DOMAIN}.{entry.entry_id}.{STORAGE_KEY_HIGHSCORES}"
        )
    
    async def load_state(self) -> None:
        """Load game state from storage."""
        try:
            # Load game state
            state_data = await self._store_state.async_load()
            if state_data:
                self._game_state = self._deserialize_game_state(state_data)
                _LOGGER.debug("Loaded game state: %s", self._game_state.game_id)
            
            # Load highscores
            highscore_data = await self._store_highscores.async_load()
            if highscore_data:
                self._highscores = self._deserialize_highscores(highscore_data)
                _LOGGER.debug("Loaded highscores")
        except Exception as err:
            _LOGGER.error("Error loading state: %s", err)
    
    async def save_state(self) -> None:
        """Save game state to storage."""
        try:
            # Save game state
            if self._game_state:
                await self._store_state.async_save(
                    self._serialize_game_state(self._game_state)
                )
            
            # Save highscores
            await self._store_highscores.async_save(
                self._serialize_highscores(self._highscores)
            )
        except Exception as err:
            _LOGGER.error("Error saving state: %s", err)
    
    async def new_game(
        self, team_count: int, playlist_id: str, timer_seconds: int = 30
    ) -> GameState:
        """Start a new game."""
        async with self._lock:
            # Stop any active timer
            if self._timer_task:
                self._timer_task.cancel()
            
            # Create teams
            teams = [
                Team(id=f"team_{i}", name=f"Team {i+1}") 
                for i in range(team_count)
            ]
            
            # Initialize game state
            self._game_state = GameState(
                game_id=str(uuid.uuid4()),
                teams=teams,
                current_round=0,
                rounds_played=[],
                playlist_id=playlist_id,
                played_song_ids=[],
                timer_seconds=timer_seconds,
                is_active=True,
            )
            
            self._round_active = False
            self._timer_remaining = 0
            
            # Save and broadcast
            await self.save_state()
            await self._broadcast_state_change("game_started")
            
            return self._game_state
    
    async def start_round(self, song: Dict[str, Any]) -> None:
        """Start a new round."""
        if not self._game_state or not self._game_state.is_active:
            raise ValueError("No active game")
        
        async with self._lock:
            # Increment round
            self._game_state.current_round += 1
            
            # Reset team guesses
            for team in self._game_state.teams:
                team.current_guess = None
                team.has_bet = False
            
            # Set current song
            self._current_song = song
            self._game_state.played_song_ids.append(song["id"])
            
            # Start timer
            self._round_active = True
            self._timer_remaining = self._game_state.timer_seconds
            self._timer_task = asyncio.create_task(self._run_timer())
            
            await self._broadcast_state_change("round_started")
    
    async def submit_guess(self, team_id: str, year: int, has_bet: bool) -> None:
        """Submit a team's guess."""
        if not self._round_active:
            raise ValueError("No active round")
        
        async with self._lock:
            team = self._get_team(team_id)
            if not team:
                raise ValueError(f"Team {team_id} not found")
            
            team.current_guess = year
            team.has_bet = has_bet
            
            await self._broadcast_state_change("guess_submitted", {
                "team_id": team_id,
                "year": year, 
                "has_bet": has_bet,
            })
    
    async def update_team_name(self, team_id: str, name: str) -> None:
        """Update a team's name."""
        async with self._lock:
            team = self._get_team(team_id)
            if not team:
                raise ValueError(f"Team {team_id} not found")
            
            team.name = name
            await self.save_state()
            await self._broadcast_state_change("team_updated", {"team_id": team_id})
    
    async def assign_user_to_team(self, team_id: str, user_id: str) -> None:
        """Assign a user to a team."""
        async with self._lock:
            team = self._get_team(team_id)
            if not team:
                raise ValueError(f"Team {team_id} not found")
            
            # Remove user from any other team
            for other_team in self._game_state.teams:
                if other_team.assigned_user == user_id:
                    other_team.assigned_user = None
            
            team.assigned_user = user_id
            await self.save_state()
            await self._broadcast_state_change("user_assigned", {
                "team_id": team_id,
                "user_id": user_id,
            })
    
    async def end_round(self) -> None:
        """End the current round and calculate scores."""
        if not self._round_active or not self._current_song:
            return
        
        async with self._lock:
            self._round_active = False
            
            # Cancel timer
            if self._timer_task:
                self._timer_task.cancel()
            
            # Create round record
            round_data = GameRound(
                round_number=self._game_state.current_round,
                song_id=self._current_song["id"],
                actual_year=self._current_song["year"],
            )
            
            # Calculate scores
            for team in self._game_state.teams:
                if team.current_guess is not None:
                    score = self.calculate_score(
                        team.current_guess,
                        self._current_song["year"],
                        team.has_bet
                    )
                    team.score += score
                    round_data.team_guesses[team.id] = team.current_guess
                    round_data.team_bets[team.id] = team.has_bet
                    round_data.team_scores[team.id] = score
            
            # Add round to history
            self._game_state.rounds_played.append(round_data)
            
            # Update highscores after each round
            await self._update_highscores()
            
            # Save state
            await self.save_state()
            
            # Broadcast round ended event
            self.hass.bus.async_fire(EVENT_ROUND_ENDED, {
                ATTR_GAME_ID: self._game_state.game_id,
                ATTR_CURRENT_ROUND: self._game_state.current_round,
                "actual_year": self._current_song["year"],
                "song_info": self._current_song,
                "round_scores": round_data.team_scores,
            })
            
            await self._broadcast_state_change("round_ended")
    
    async def next_round(self) -> None:
        """Prepare for next round (admin action)."""
        async with self._lock:
            self._current_song = None
            self._timer_remaining = 0
            await self._broadcast_state_change("ready_for_next_round")
    
    def calculate_score(self, guess: int, actual: int, has_bet: bool) -> int:
        """Calculate score based on guess accuracy and betting."""
        diff = abs(guess - actual)
        
        if has_bet:
            # With bet: exact or nothing
            return POINTS_EXACT_WITH_BET if diff == 0 else POINTS_WRONG_WITH_BET
        else:
            # Without bet: graduated points
            if diff == 0:
                return POINTS_EXACT_YEAR
            elif diff <= 3:
                return POINTS_WITHIN_3_YEARS
            elif diff <= 5:
                return POINTS_WITHIN_5_YEARS
            else:
                return 0
    
    def get_state(self) -> Dict[str, Any]:
        """Get current game state."""
        if not self._game_state:
            return {
                "active": False,
                "game_id": None,
            }
        
        return {
            "active": self._game_state.is_active,
            "game_id": self._game_state.game_id,
            "teams": [asdict(team) for team in self._game_state.teams],
            "current_round": self._game_state.current_round,
            "round_active": self._round_active,
            "timer_remaining": self._timer_remaining,
            "timer_seconds": self._game_state.timer_seconds,
            "playlist_id": self._game_state.playlist_id,
            "current_song": self._current_song if not self._round_active else None,
            "highscore_current_round": self._get_highscore_for_round(
                self._game_state.current_round
            ),
        }
    
    def get_filtered_state(self, user_id: str) -> Dict[str, Any]:
        """Get game state filtered for a specific user."""
        state = self.get_state()
        
        if not state["active"]:
            return state
        
        # Find user's team
        user_team_id = None
        for team in self._game_state.teams:
            if team.assigned_user == user_id:
                user_team_id = team.id
                break
        
        # Filter teams to only show user's team controls
        if user_team_id:
            state["user_team_id"] = user_team_id
            state["can_control_teams"] = [user_team_id]
        else:
            state["can_control_teams"] = []
        
        return state
    
    def get_highscores(self) -> Dict[str, Any]:
        """Get highscore data."""
        return {
            "all_time_best": asdict(self._highscores.all_time_best) 
                if self._highscores.all_time_best else None,
            "by_round": {
                str(round_num): [asdict(entry) for entry in entries]
                for round_num, entries in self._highscores.by_round.items()
            },
        }
    
    async def _run_timer(self) -> None:
        """Run the countdown timer."""
        try:
            while self._timer_remaining > 0 and self._round_active:
                await asyncio.sleep(1)
                self._timer_remaining -= 1
                
                # Broadcast timer update
                self.hass.bus.async_fire(EVENT_TIMER_UPDATE, {
                    ATTR_GAME_ID: self._game_state.game_id,
                    ATTR_TIMER_REMAINING: self._timer_remaining,
                })
            
            # Timer expired, end round
            if self._round_active:
                await self.end_round()
        except asyncio.CancelledError:
            pass
    
    async def _update_highscores(self) -> None:
        """Update highscores after a round."""
        if not self._game_state:
            return
        
        round_num = self._game_state.current_round
        
        # Calculate score per round for each team
        for team in self._game_state.teams:
            if round_num > 0:
                score_per_round = team.score / round_num
                
                entry = HighscoreEntry(
                    team_name=team.name,
                    score_per_round=score_per_round,
                    rounds_played=round_num,
                    date=dt_util.now(),
                    playlist_id=self._game_state.playlist_id,
                )
                
                # Update round-specific highscores
                if round_num not in self._highscores.by_round:
                    self._highscores.by_round[round_num] = []
                
                # Keep top 10 scores per round
                round_scores = self._highscores.by_round[round_num]
                round_scores.append(entry)
                round_scores.sort(key=lambda x: x.score_per_round, reverse=True)
                self._highscores.by_round[round_num] = round_scores[:10]
                
                # Update all-time best
                if (not self._highscores.all_time_best or 
                    score_per_round > self._highscores.all_time_best.score_per_round):
                    self._highscores.all_time_best = entry
    
    def _get_team(self, team_id: str) -> Optional[Team]:
        """Get team by ID."""
        if not self._game_state:
            return None
        
        for team in self._game_state.teams:
            if team.id == team_id:
                return team
        return None
    
    def _get_highscore_for_round(self, round_num: int) -> Optional[Dict[str, Any]]:
        """Get best highscore for a specific round number."""
        if round_num in self._highscores.by_round and self._highscores.by_round[round_num]:
            best = self._highscores.by_round[round_num][0]
            return asdict(best)
        return None
    
    @callback
    async def _broadcast_state_change(self, action: str, data: Optional[Dict] = None) -> None:
        """Broadcast game state change event."""
        event_data = {
            ATTR_GAME_ID: self._game_state.game_id if self._game_state else None,
            "action": action,
        }
        if data:
            event_data.update(data)
        
        self.hass.bus.async_fire(EVENT_GAME_STATE_CHANGED, event_data)
    
    def _serialize_game_state(self, state: GameState) -> Dict[str, Any]:
        """Serialize game state for storage."""
        data = asdict(state)
        # Convert datetime objects to ISO format
        data["created_at"] = state.created_at.isoformat()
        for round_data in data["rounds_played"]:
            round_data["timestamp"] = round_data["timestamp"].isoformat()
        return data
    
    def _deserialize_game_state(self, data: Dict[str, Any]) -> GameState:
        """Deserialize game state from storage."""
        # Convert ISO strings back to datetime
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        
        # Convert team dicts to Team objects
        data["teams"] = [Team(**team_data) for team_data in data["teams"]]
        
        # Convert round dicts to GameRound objects
        rounds = []
        for round_data in data["rounds_played"]:
            round_data["timestamp"] = datetime.fromisoformat(round_data["timestamp"])
            rounds.append(GameRound(**round_data))
        data["rounds_played"] = rounds
        
        return GameState(**data)
    
    def _serialize_highscores(self, highscores: HighscoreTracker) -> Dict[str, Any]:
        """Serialize highscores for storage."""
        data = {
            "all_time_best": asdict(highscores.all_time_best) 
                if highscores.all_time_best else None,
            "by_round": {},
        }
        
        # Convert datetime in all entries
        if data["all_time_best"]:
            data["all_time_best"]["date"] = data["all_time_best"]["date"].isoformat()
        
        for round_num, entries in highscores.by_round.items():
            data["by_round"][str(round_num)] = []
            for entry in entries:
                entry_dict = asdict(entry)
                entry_dict["date"] = entry.date.isoformat()
                data["by_round"][str(round_num)].append(entry_dict)
        
        return data
    
    def _deserialize_highscores(self, data: Dict[str, Any]) -> HighscoreTracker:
        """Deserialize highscores from storage."""
        highscores = HighscoreTracker()
        
        # Deserialize all-time best
        if data.get("all_time_best"):
            best_data = data["all_time_best"]
            best_data["date"] = datetime.fromisoformat(best_data["date"])
            highscores.all_time_best = HighscoreEntry(**best_data)
        
        # Deserialize by-round entries
        for round_str, entries in data.get("by_round", {}).items():
            round_num = int(round_str)
            highscores.by_round[round_num] = []
            for entry_data in entries:
                entry_data["date"] = datetime.fromisoformat(entry_data["date"])
                highscores.by_round[round_num].append(HighscoreEntry(**entry_data))
        
        return highscores