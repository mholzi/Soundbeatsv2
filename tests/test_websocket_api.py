"""Tests for websocket_api.py"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from custom_components.soundbeatsv2.websocket_api import (
    register_websocket_commands,
    async_handle_new_game,
    async_handle_get_game_state,
    async_handle_submit_guess,
    async_handle_start_round,
    async_handle_end_round,
    async_handle_next_round,
    async_handle_stop_playback,
    async_handle_set_volume,
    async_handle_select_source,
    async_handle_assign_user,
    async_handle_reset_game,
    async_handle_get_highscores,
)


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {
        "soundbeatsv2": {
            "test_entry": {
                "game_manager": MagicMock(),
                "media_controller": MagicMock(),
            }
        }
    }
    return hass


@pytest.fixture
def mock_connection():
    """Mock WebSocket connection."""
    connection = MagicMock()
    connection.user = MagicMock()
    connection.user.id = "test_user"
    connection.user.is_admin = True
    return connection


@pytest.fixture
def mock_game_manager():
    """Mock game manager."""
    manager = MagicMock()
    manager.new_game = AsyncMock(return_value="test_game_id")
    manager.get_game_state = AsyncMock(return_value={"active": False})
    manager.submit_guess = AsyncMock(return_value={"success": True})
    manager.start_round = AsyncMock(return_value={"success": True})
    manager.end_round = AsyncMock(return_value={"success": True})
    manager.next_round = AsyncMock(return_value={"success": True})
    manager.assign_user_to_team = AsyncMock(return_value={"success": True})
    manager.reset_game = AsyncMock(return_value={"success": True})
    manager.get_highscores = AsyncMock(return_value=[])
    return manager


@pytest.fixture
def mock_media_controller():
    """Mock media controller."""
    controller = MagicMock()
    controller.stop_playback = AsyncMock(return_value={"success": True})
    controller.set_volume = AsyncMock(return_value={"success": True})
    controller.select_source = AsyncMock(return_value={"success": True})
    return controller


class TestWebSocketCommands:
    """Test WebSocket command handlers."""

    @pytest.mark.asyncio
    async def test_register_websocket_commands(self, mock_hass):
        """Test WebSocket command registration."""
        mock_hass.components.websocket_api.async_register_command = MagicMock()
        
        register_websocket_commands(mock_hass)
        
        # Verify all commands are registered
        calls = mock_hass.components.websocket_api.async_register_command.call_args_list
        command_types = [call[0][0]["type"] for call in calls]
        
        expected_commands = [
            "soundbeatsv2/new_game",
            "soundbeatsv2/get_game_state",
            "soundbeatsv2/submit_guess",
            "soundbeatsv2/start_round",
            "soundbeatsv2/end_round",
            "soundbeatsv2/next_round",
            "soundbeatsv2/stop_playback",
            "soundbeatsv2/set_volume",
            "soundbeatsv2/select_source",
            "soundbeatsv2/assign_user",
            "soundbeatsv2/reset_game",
            "soundbeatsv2/get_highscores",
        ]
        
        for cmd in expected_commands:
            assert cmd in command_types

    @pytest.mark.asyncio
    async def test_new_game_success(self, mock_hass, mock_connection, mock_game_manager):
        """Test successful new game creation."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {
            "id": 1,
            "team_names": ["Team 1", "Team 2"],
            "playlist_id": "default",
            "timer_seconds": 30,
        }
        
        await async_handle_new_game(mock_hass, mock_connection, msg)
        
        mock_game_manager.new_game.assert_called_once_with(
            team_names=["Team 1", "Team 2"],
            playlist_id="default",
            timer_seconds=30,
        )
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_new_game_non_admin(self, mock_hass, mock_connection):
        """Test new game creation by non-admin user."""
        mock_connection.user.is_admin = False
        
        msg = {"id": 1, "team_names": ["Team 1"], "playlist_id": "default"}
        
        await async_handle_new_game(mock_hass, mock_connection, msg)
        
        # Should send error for non-admin
        mock_connection.send_error.assert_called_once()
        error_call = mock_connection.send_error.call_args[0]
        assert "Admin privileges required" in error_call[1]

    @pytest.mark.asyncio
    async def test_get_game_state(self, mock_hass, mock_connection, mock_game_manager):
        """Test getting current game state."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {"id": 1}
        
        await async_handle_get_game_state(mock_hass, mock_connection, msg)
        
        mock_game_manager.get_game_state.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_guess_success(self, mock_hass, mock_connection, mock_game_manager):
        """Test successful guess submission."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {
            "id": 1,
            "team_id": "team_0",
            "guess": 1985,
            "has_bet": True,
        }
        
        await async_handle_submit_guess(mock_hass, mock_connection, msg)
        
        mock_game_manager.submit_guess.assert_called_once_with(
            team_id="team_0",
            guess=1985,
            has_bet=True,
            user_id="test_user",
        )
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_guess_missing_params(self, mock_hass, mock_connection):
        """Test guess submission with missing parameters."""
        msg = {"id": 1, "team_id": "team_0"}  # Missing guess
        
        await async_handle_submit_guess(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_round_admin_only(self, mock_hass, mock_connection, mock_game_manager):
        """Test start round requires admin privileges."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_connection.user.is_admin = True
        
        msg = {"id": 1}
        
        await async_handle_start_round(mock_hass, mock_connection, msg)
        
        mock_game_manager.start_round.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_round_non_admin(self, mock_hass, mock_connection):
        """Test start round by non-admin user."""
        mock_connection.user.is_admin = False
        
        msg = {"id": 1}
        
        await async_handle_start_round(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()

    @pytest.mark.asyncio
    async def test_end_round_admin_only(self, mock_hass, mock_connection, mock_game_manager):
        """Test end round requires admin privileges."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_connection.user.is_admin = True
        
        msg = {"id": 1}
        
        await async_handle_end_round(mock_hass, mock_connection, msg)
        
        mock_game_manager.end_round.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_next_round_admin_only(self, mock_hass, mock_connection, mock_game_manager):
        """Test next round requires admin privileges."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_connection.user.is_admin = True
        
        msg = {"id": 1}
        
        await async_handle_next_round(mock_hass, mock_connection, msg)
        
        mock_game_manager.next_round.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_playback(self, mock_hass, mock_connection, mock_media_controller):
        """Test stopping media playback."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["media_controller"] = mock_media_controller
        
        msg = {"id": 1}
        
        await async_handle_stop_playback(mock_hass, mock_connection, msg)
        
        mock_media_controller.stop_playback.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_volume(self, mock_hass, mock_connection, mock_media_controller):
        """Test setting media volume."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["media_controller"] = mock_media_controller
        
        msg = {"id": 1, "volume": 0.8}
        
        await async_handle_set_volume(mock_hass, mock_connection, msg)
        
        mock_media_controller.set_volume.assert_called_once_with(0.8)
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_volume_missing_param(self, mock_hass, mock_connection):
        """Test setting volume without volume parameter."""
        msg = {"id": 1}  # Missing volume
        
        await async_handle_set_volume(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()

    @pytest.mark.asyncio
    async def test_select_source(self, mock_hass, mock_connection, mock_media_controller):
        """Test selecting media source."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["media_controller"] = mock_media_controller
        
        msg = {"id": 1, "source": "Spotify"}
        
        await async_handle_select_source(mock_hass, mock_connection, msg)
        
        mock_media_controller.select_source.assert_called_once_with("Spotify")
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_assign_user_to_team(self, mock_hass, mock_connection, mock_game_manager):
        """Test assigning user to team."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {"id": 1, "team_id": "team_0"}
        
        await async_handle_assign_user(mock_hass, mock_connection, msg)
        
        mock_game_manager.assign_user_to_team.assert_called_once_with(
            "team_0", "test_user"
        )
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_reset_game_admin_only(self, mock_hass, mock_connection, mock_game_manager):
        """Test game reset requires admin privileges."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_connection.user.is_admin = True
        
        msg = {"id": 1}
        
        await async_handle_reset_game(mock_hass, mock_connection, msg)
        
        mock_game_manager.reset_game.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_highscores(self, mock_hass, mock_connection, mock_game_manager):
        """Test getting highscores."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {"id": 1, "round_number": 3}
        
        await async_handle_get_highscores(mock_hass, mock_connection, msg)
        
        mock_game_manager.get_highscores.assert_called_once_with(round_number=3)
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_highscores_all_rounds(self, mock_hass, mock_connection, mock_game_manager):
        """Test getting highscores for all rounds."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        msg = {"id": 1}  # No round_number specified
        
        await async_handle_get_highscores(mock_hass, mock_connection, msg)
        
        mock_game_manager.get_highscores.assert_called_once_with(round_number=None)

    @pytest.mark.asyncio
    async def test_integration_not_loaded(self, mock_hass, mock_connection):
        """Test handling when integration is not loaded."""
        mock_hass.data = {}  # No soundbeatsv2 data
        
        msg = {"id": 1}
        
        await async_handle_get_game_state(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()
        error_call = mock_connection.send_error.call_args[0]
        assert "not loaded" in error_call[1]

    @pytest.mark.asyncio
    async def test_exception_handling(self, mock_hass, mock_connection, mock_game_manager):
        """Test exception handling in WebSocket commands."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_game_manager.get_game_state.side_effect = Exception("Test error")
        
        msg = {"id": 1}
        
        await async_handle_get_game_state(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()
        error_call = mock_connection.send_error.call_args[0]
        assert "Test error" in error_call[1]

    @pytest.mark.asyncio
    async def test_user_permission_check_multiple_teams(self, mock_hass, mock_connection, mock_game_manager):
        """Test user permission for team-specific actions."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        
        # Mock game state with assigned teams
        mock_game_state = {
            "teams": [
                {"id": "team_0", "assigned_user": "user1"},
                {"id": "team_1", "assigned_user": "test_user"},
            ]
        }
        mock_game_manager.get_game_state.return_value = mock_game_state
        
        # User should be able to submit guess for their assigned team
        msg = {"id": 1, "team_id": "team_1", "guess": 1985}
        
        await async_handle_submit_guess(mock_hass, mock_connection, msg)
        
        mock_game_manager.submit_guess.assert_called_once()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_user_permission_denied_wrong_team(self, mock_hass, mock_connection, mock_game_manager):
        """Test user permission denied for wrong team."""
        mock_hass.data["soundbeatsv2"]["test_entry"]["game_manager"] = mock_game_manager
        mock_connection.user.is_admin = False
        
        # Mock game state with assigned teams
        mock_game_state = {
            "teams": [
                {"id": "team_0", "assigned_user": "user1"},
                {"id": "team_1", "assigned_user": "user2"},
            ]
        }
        mock_game_manager.get_game_state.return_value = mock_game_state
        
        # User should NOT be able to submit guess for different team
        msg = {"id": 1, "team_id": "team_0", "guess": 1985}
        
        await async_handle_submit_guess(mock_hass, mock_connection, msg)
        
        mock_connection.send_error.assert_called_once()
        error_call = mock_connection.send_error.call_args[0]
        assert "not authorized" in error_call[1]