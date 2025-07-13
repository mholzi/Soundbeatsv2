"""Tests for media_controller.py"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncio

from custom_components.soundbeatsv2.media_controller import (
    MediaController,
    PlaybackResult,
    MediaPlayerError,
)


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.services = MagicMock()
    hass.services.async_call = AsyncMock()
    hass.states = MagicMock()
    return hass


@pytest.fixture
def mock_media_player_state():
    """Mock media player state."""
    state = MagicMock()
    state.state = "idle"
    state.attributes = {
        "volume_level": 0.5,
        "source": "Spotify",
        "source_list": ["Spotify", "Apple Music"],
        "media_title": "Test Song",
        "media_artist": "Test Artist",
        "media_album_name": "Test Album",
        "entity_picture": "/api/media_player_proxy/media_player.test/image",
    }
    return state


@pytest.fixture
def media_controller(mock_hass):
    """Create MediaController instance."""
    return MediaController(mock_hass, "media_player.test")


class TestMediaController:
    """Test MediaController class."""

    @pytest.mark.asyncio
    async def test_initialization(self, media_controller, mock_hass):
        """Test MediaController initialization."""
        assert media_controller.hass == mock_hass
        assert media_controller.media_player_entity == "media_player.test"
        assert media_controller._current_playback_task is None

    @pytest.mark.asyncio
    async def test_play_snippet_success(self, media_controller, mock_hass, mock_media_player_state):
        """Test successful snippet playback."""
        mock_hass.states.get.return_value = mock_media_player_state
        mock_media_player_state.state = "playing"
        
        result = await media_controller.play_snippet(
            "https://open.spotify.com/track/test",
            duration=30,
            start_position=0
        )
        
        assert isinstance(result, PlaybackResult)
        assert result.success is True
        assert result.duration == 30
        
        # Verify service calls
        mock_hass.services.async_call.assert_any_call(
            "media_player",
            "play_media",
            {
                "entity_id": "media_player.test",
                "media_content_id": "https://open.spotify.com/track/test",
                "media_content_type": "music",
            }
        )

    @pytest.mark.asyncio
    async def test_play_snippet_with_position(self, media_controller, mock_hass, mock_media_player_state):
        """Test snippet playback with start position."""
        mock_hass.states.get.return_value = mock_media_player_state
        mock_media_player_state.state = "playing"
        
        await media_controller.play_snippet(
            "https://open.spotify.com/track/test",
            duration=15,
            start_position=30
        )
        
        # Should call seek service
        mock_hass.services.async_call.assert_any_call(
            "media_player",
            "media_seek",
            {
                "entity_id": "media_player.test",
                "seek_position": 30,
            }
        )

    @pytest.mark.asyncio
    async def test_play_snippet_auto_pause(self, media_controller, mock_hass, mock_media_player_state):
        """Test that snippet automatically pauses after duration."""
        mock_hass.states.get.return_value = mock_media_player_state
        mock_media_player_state.state = "playing"
        
        # Use very short duration for testing
        with patch("asyncio.sleep") as mock_sleep:
            result = await media_controller.play_snippet(
                "https://open.spotify.com/track/test",
                duration=1
            )
            
            # Verify sleep was called with correct duration
            mock_sleep.assert_called_with(1)
            
            # Verify pause was called
            mock_hass.services.async_call.assert_any_call(
                "media_player",
                "media_pause",
                {"entity_id": "media_player.test"}
            )

    @pytest.mark.asyncio
    async def test_play_snippet_media_player_not_found(self, media_controller, mock_hass):
        """Test playback when media player doesn't exist."""
        mock_hass.states.get.return_value = None
        
        result = await media_controller.play_snippet("https://test.com/track")
        
        assert result.success is False
        assert "not found" in result.error

    @pytest.mark.asyncio
    async def test_play_snippet_timeout(self, media_controller, mock_hass, mock_media_player_state):
        """Test playback timeout handling."""
        mock_hass.states.get.return_value = mock_media_player_state
        # Keep state as idle to simulate timeout
        mock_media_player_state.state = "idle"
        
        with patch("asyncio.sleep"):
            result = await media_controller.play_snippet(
                "https://test.com/track",
                timeout=1
            )
            
            assert result.success is False
            assert "timeout" in result.error

    @pytest.mark.asyncio
    async def test_stop_playback(self, media_controller, mock_hass):
        """Test stopping current playback."""
        # Start a playback task
        mock_task = MagicMock()
        media_controller._current_playback_task = mock_task
        
        result = await media_controller.stop_playback()
        
        assert result["success"] is True
        mock_task.cancel.assert_called_once()
        mock_hass.services.async_call.assert_called_with(
            "media_player",
            "media_pause",
            {"entity_id": "media_player.test"}
        )

    @pytest.mark.asyncio
    async def test_stop_playback_no_active_task(self, media_controller, mock_hass):
        """Test stopping playback when no task is active."""
        result = await media_controller.stop_playback()
        
        assert result["success"] is True
        # Should still call pause
        mock_hass.services.async_call.assert_called_with(
            "media_player",
            "media_pause",
            {"entity_id": "media_player.test"}
        )

    @pytest.mark.asyncio
    async def test_set_volume(self, media_controller, mock_hass):
        """Test setting volume."""
        result = await media_controller.set_volume(0.8)
        
        assert result["success"] is True
        mock_hass.services.async_call.assert_called_with(
            "media_player",
            "volume_set",
            {
                "entity_id": "media_player.test",
                "volume_level": 0.8,
            }
        )

    @pytest.mark.asyncio
    async def test_set_volume_invalid_range(self, media_controller):
        """Test setting volume with invalid range."""
        # Test too low
        result = await media_controller.set_volume(-0.1)
        assert result["success"] is False
        
        # Test too high
        result = await media_controller.set_volume(1.1)
        assert result["success"] is False

    @pytest.mark.asyncio
    async def test_get_current_state(self, media_controller, mock_hass, mock_media_player_state):
        """Test getting current media player state."""
        mock_hass.states.get.return_value = mock_media_player_state
        
        state = await media_controller.get_current_state()
        
        assert state["state"] == "idle"
        assert state["volume_level"] == 0.5
        assert state["media_title"] == "Test Song"
        assert state["media_artist"] == "Test Artist"

    @pytest.mark.asyncio
    async def test_get_current_state_no_entity(self, media_controller, mock_hass):
        """Test getting state when entity doesn't exist."""
        mock_hass.states.get.return_value = None
        
        state = await media_controller.get_current_state()
        
        assert state["state"] == "unavailable"
        assert state["error"] == "Media player not found"

    @pytest.mark.asyncio
    async def test_select_source(self, media_controller, mock_hass):
        """Test selecting media source."""
        result = await media_controller.select_source("Spotify")
        
        assert result["success"] is True
        mock_hass.services.async_call.assert_called_with(
            "media_player",
            "select_source",
            {
                "entity_id": "media_player.test",
                "source": "Spotify",
            }
        )

    @pytest.mark.asyncio
    async def test_service_call_exception(self, media_controller, mock_hass):
        """Test handling of service call exceptions."""
        mock_hass.services.async_call.side_effect = Exception("Service error")
        
        result = await media_controller.set_volume(0.5)
        
        assert result["success"] is False
        assert "Service error" in result["error"]

    @pytest.mark.asyncio
    async def test_concurrent_playback_cancellation(self, media_controller, mock_hass, mock_media_player_state):
        """Test that new playback cancels previous playback."""
        mock_hass.states.get.return_value = mock_media_player_state
        mock_media_player_state.state = "playing"
        
        # Start first playback
        with patch("asyncio.sleep"):
            task1 = asyncio.create_task(
                media_controller.play_snippet("https://test1.com/track", duration=10)
            )
            await asyncio.sleep(0.1)  # Let it start
            
            # Start second playback - should cancel first
            task2 = asyncio.create_task(
                media_controller.play_snippet("https://test2.com/track", duration=10)
            )
            
            await asyncio.gather(task1, task2, return_exceptions=True)
            
            # First task should be cancelled
            assert task1.cancelled()

    @pytest.mark.asyncio
    async def test_get_available_sources(self, media_controller, mock_hass, mock_media_player_state):
        """Test getting available media sources."""
        mock_hass.states.get.return_value = mock_media_player_state
        
        sources = await media_controller.get_available_sources()
        
        assert sources == ["Spotify", "Apple Music"]

    @pytest.mark.asyncio
    async def test_get_available_sources_no_entity(self, media_controller, mock_hass):
        """Test getting sources when entity doesn't exist."""
        mock_hass.states.get.return_value = None
        
        sources = await media_controller.get_available_sources()
        
        assert sources == []

    @pytest.mark.asyncio
    async def test_play_snippet_invalid_url(self, media_controller):
        """Test playback with invalid URL."""
        result = await media_controller.play_snippet("")
        
        assert result.success is False
        assert "Invalid" in result.error

    @pytest.mark.asyncio
    async def test_playback_result_creation(self):
        """Test PlaybackResult creation."""
        # Success result
        result = PlaybackResult(success=True, duration=30)
        assert result.success is True
        assert result.duration == 30
        assert result.error is None
        
        # Error result
        result = PlaybackResult(success=False, error="Test error")
        assert result.success is False
        assert result.error == "Test error"

    @pytest.mark.asyncio
    async def test_wait_for_playback_state(self, media_controller, mock_hass, mock_media_player_state):
        """Test waiting for specific playback state."""
        mock_hass.states.get.return_value = mock_media_player_state
        
        # Test state already correct
        mock_media_player_state.state = "playing"
        success = await media_controller._wait_for_playback_state("playing", timeout=1)
        assert success is True
        
        # Test state change during wait
        mock_media_player_state.state = "idle"
        
        async def change_state():
            await asyncio.sleep(0.1)
            mock_media_player_state.state = "playing"
        
        with patch("asyncio.sleep", side_effect=[asyncio.sleep(0.05)]):
            task = asyncio.create_task(change_state())
            success = await media_controller._wait_for_playback_state("playing", timeout=1)
            await task
            assert success is True