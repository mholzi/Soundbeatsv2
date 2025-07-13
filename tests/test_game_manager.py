"""Tests for game_manager.py"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import asyncio

from custom_components.soundbeatsv2.game_manager import (
    GameManager,
    Team,
    GameState,
    HighscoreEntry,
    HighscoreTracker,
    POINTS_EXACT,
    POINTS_CLOSE,
    POINTS_BET_MULTIPLIER,
)


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.config_entries = MagicMock()
    hass.bus = MagicMock()
    hass.bus.async_fire = AsyncMock()
    return hass


@pytest.fixture
def mock_config_entry():
    """Mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry"
    entry.data = {}
    return entry


@pytest.fixture
def game_manager(mock_hass, mock_config_entry):
    """Create GameManager instance."""
    return GameManager(mock_hass, mock_config_entry)


@pytest.fixture
def sample_teams():
    """Create sample teams."""
    return [
        Team(id="team_0", name="Team Alpha", score=0),
        Team(id="team_1", name="Team Beta", score=0),
        Team(id="team_2", name="Team Gamma", score=0),
    ]


@pytest.fixture
def sample_song():
    """Create sample song data."""
    return {
        "id": 1,
        "url": "https://open.spotify.com/track/sample",
        "year": 1985,
        "song": "Test Song",
        "artist": "Test Artist",
        "playlist_ids": ["default"],
    }


class TestTeam:
    """Test Team class."""

    def test_team_creation(self):
        """Test team creation with defaults."""
        team = Team(id="test_id", name="Test Team")
        assert team.id == "test_id"
        assert team.name == "Test Team"
        assert team.score == 0
        assert team.current_guess is None
        assert team.has_bet is False
        assert team.assigned_user is None

    def test_team_with_custom_values(self):
        """Test team creation with custom values."""
        team = Team(
            id="custom_id",
            name="Custom Team",
            score=100,
            current_guess=1990,
            has_bet=True,
            assigned_user="user123",
        )
        assert team.score == 100
        assert team.current_guess == 1990
        assert team.has_bet is True
        assert team.assigned_user == "user123"


class TestGameState:
    """Test GameState class."""

    def test_game_state_creation(self, sample_teams):
        """Test game state creation."""
        state = GameState(teams=sample_teams, current_song={"year": 1985})
        assert state.active is True
        assert len(state.teams) == 3
        assert state.current_round == 1
        assert state.current_song["year"] == 1985
        assert state.timer_seconds == 30

    def test_game_state_defaults(self):
        """Test game state with defaults."""
        state = GameState()
        assert state.active is False
        assert state.teams == []
        assert state.current_round == 0


class TestHighscoreTracker:
    """Test HighscoreTracker class."""

    def test_highscore_tracker_creation(self):
        """Test highscore tracker creation."""
        tracker = HighscoreTracker()
        assert tracker.entries == []

    def test_add_entry(self):
        """Test adding highscore entry."""
        tracker = HighscoreTracker()
        entry = HighscoreEntry(
            game_id="test_game",
            round_number=1,
            team_name="Test Team",
            score=100,
            timestamp=datetime.now(),
        )
        tracker.add_entry(entry)
        assert len(tracker.entries) == 1
        assert tracker.entries[0].team_name == "Test Team"

    def test_get_highscores_for_round(self):
        """Test getting highscores for specific round."""
        tracker = HighscoreTracker()
        now = datetime.now()
        
        # Add entries for different rounds
        tracker.add_entry(HighscoreEntry("game1", 1, "Team A", 100, now))
        tracker.add_entry(HighscoreEntry("game1", 2, "Team A", 150, now))
        tracker.add_entry(HighscoreEntry("game2", 1, "Team B", 80, now))
        
        round_1_scores = tracker.get_highscores_for_round(1)
        assert len(round_1_scores) == 2
        assert round_1_scores[0].score == 100  # Team A, round 1
        assert round_1_scores[1].score == 80   # Team B, round 1


class TestGameManager:
    """Test GameManager class."""

    @pytest.mark.asyncio
    async def test_new_game_creation(self, game_manager, mock_hass):
        """Test creating a new game."""
        with patch("uuid.uuid4") as mock_uuid:
            mock_uuid.return_value.hex = "test_game_id"
            
            game_id = await game_manager.new_game(
                team_names=["Team 1", "Team 2"],
                playlist_id="default",
                timer_seconds=30,
            )
            
            assert game_id == "test_game_id"
            assert game_manager.current_state.active is True
            assert len(game_manager.current_state.teams) == 2
            assert game_manager.current_state.teams[0].name == "Team 1"
            assert game_manager.current_state.playlist_id == "default"

    @pytest.mark.asyncio
    async def test_submit_guess_exact_match(self, game_manager, sample_song):
        """Test submitting exact year guess."""
        # Setup game
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        
        # Submit exact guess
        result = await game_manager.submit_guess("team_0", 1985)
        
        assert result["success"] is True
        assert game_manager.current_state.teams[0].current_guess == 1985
        assert game_manager.current_state.teams[0].has_bet is False

    @pytest.mark.asyncio
    async def test_submit_guess_with_bet(self, game_manager, sample_song):
        """Test submitting guess with bet."""
        # Setup game
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        
        # Submit guess with bet
        result = await game_manager.submit_guess("team_0", 1985, has_bet=True)
        
        assert result["success"] is True
        assert game_manager.current_state.teams[0].has_bet is True

    @pytest.mark.asyncio
    async def test_submit_guess_invalid_team(self, game_manager):
        """Test submitting guess for invalid team."""
        await game_manager.new_game(["Team 1"], "default")
        
        result = await game_manager.submit_guess("invalid_team", 1985)
        
        assert result["success"] is False
        assert "not found" in result["error"]

    @pytest.mark.asyncio
    async def test_calculate_score_exact_match(self, game_manager, sample_song):
        """Test score calculation for exact match."""
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        await game_manager.submit_guess("team_0", 1985)
        
        score = game_manager._calculate_score("team_0")
        assert score == POINTS_EXACT

    @pytest.mark.asyncio
    async def test_calculate_score_close_match(self, game_manager, sample_song):
        """Test score calculation for close match."""
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        await game_manager.submit_guess("team_0", 1984)  # Off by 1
        
        score = game_manager._calculate_score("team_0")
        assert score == POINTS_CLOSE

    @pytest.mark.asyncio
    async def test_calculate_score_with_bet_exact(self, game_manager, sample_song):
        """Test score calculation with bet for exact match."""
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        await game_manager.submit_guess("team_0", 1985, has_bet=True)
        
        score = game_manager._calculate_score("team_0")
        expected = POINTS_EXACT * POINTS_BET_MULTIPLIER
        assert score == expected

    @pytest.mark.asyncio
    async def test_calculate_score_with_bet_wrong(self, game_manager, sample_song):
        """Test score calculation with bet for wrong answer."""
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        await game_manager.submit_guess("team_0", 1990, has_bet=True)  # Wrong
        
        score = game_manager._calculate_score("team_0")
        assert score == -POINTS_EXACT  # Penalty for wrong bet

    @pytest.mark.asyncio
    async def test_end_round_updates_scores(self, game_manager, sample_song):
        """Test that ending a round updates team scores."""
        # Setup game with multiple teams
        await game_manager.new_game(["Team 1", "Team 2"], "default")
        game_manager.current_state.current_song = sample_song
        
        # Submit guesses
        await game_manager.submit_guess("team_0", 1985)  # Exact
        await game_manager.submit_guess("team_1", 1984)  # Close
        
        # End round
        result = await game_manager.end_round()
        
        assert result["success"] is True
        assert game_manager.current_state.teams[0].score == POINTS_EXACT
        assert game_manager.current_state.teams[1].score == POINTS_CLOSE
        assert game_manager.current_state.current_round == 2

    @pytest.mark.asyncio
    async def test_end_round_saves_highscores(self, game_manager, sample_song):
        """Test that ending a round saves highscores."""
        await game_manager.new_game(["Team 1"], "default")
        game_manager.current_state.current_song = sample_song
        await game_manager.submit_guess("team_0", 1985)
        
        # Mock the save method
        with patch.object(game_manager, "_save_state") as mock_save:
            await game_manager.end_round()
            mock_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_highscores_for_round(self, game_manager):
        """Test getting highscores for specific round."""
        # Add some test highscores
        now = datetime.now()
        game_manager.highscore_tracker.add_entry(
            HighscoreEntry("game1", 1, "Team A", 100, now)
        )
        game_manager.highscore_tracker.add_entry(
            HighscoreEntry("game2", 1, "Team B", 80, now)
        )
        
        highscores = await game_manager.get_highscores(round_number=1)
        
        assert len(highscores) == 2
        assert highscores[0]["team_name"] == "Team A"
        assert highscores[0]["score"] == 100

    @pytest.mark.asyncio
    async def test_concurrent_guess_submission(self, game_manager, sample_song):
        """Test concurrent guess submissions are handled safely."""
        await game_manager.new_game(["Team 1", "Team 2"], "default")
        game_manager.current_state.current_song = sample_song
        
        # Submit guesses concurrently
        tasks = [
            game_manager.submit_guess("team_0", 1985),
            game_manager.submit_guess("team_1", 1990),
        ]
        
        results = await asyncio.gather(*tasks)
        
        assert all(result["success"] for result in results)
        assert game_manager.current_state.teams[0].current_guess == 1985
        assert game_manager.current_state.teams[1].current_guess == 1990

    @pytest.mark.asyncio
    async def test_assign_user_to_team(self, game_manager):
        """Test assigning user to team."""
        await game_manager.new_game(["Team 1"], "default")
        
        result = await game_manager.assign_user_to_team("team_0", "user123")
        
        assert result["success"] is True
        assert game_manager.current_state.teams[0].assigned_user == "user123"

    @pytest.mark.asyncio
    async def test_assign_user_invalid_team(self, game_manager):
        """Test assigning user to invalid team."""
        await game_manager.new_game(["Team 1"], "default")
        
        result = await game_manager.assign_user_to_team("invalid_team", "user123")
        
        assert result["success"] is False

    @pytest.mark.asyncio
    async def test_get_game_state(self, game_manager):
        """Test getting current game state."""
        await game_manager.new_game(["Team 1"], "default")
        
        state = await game_manager.get_game_state()
        
        assert state["active"] is True
        assert len(state["teams"]) == 1
        assert state["teams"][0]["name"] == "Team 1"

    @pytest.mark.asyncio
    async def test_reset_game(self, game_manager):
        """Test resetting game state."""
        await game_manager.new_game(["Team 1"], "default")
        
        result = await game_manager.reset_game()
        
        assert result["success"] is True
        assert game_manager.current_state.active is False
        assert len(game_manager.current_state.teams) == 0

    def test_year_difference_calculation(self, game_manager):
        """Test year difference calculation helper."""
        # Test exact match
        assert game_manager._get_year_difference(1985, 1985) == 0
        
        # Test close matches
        assert game_manager._get_year_difference(1985, 1984) == 1
        assert game_manager._get_year_difference(1985, 1986) == 1
        
        # Test far matches
        assert game_manager._get_year_difference(1985, 1980) == 5
        assert game_manager._get_year_difference(1985, 1990) == 5