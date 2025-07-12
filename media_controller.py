"""Media player controller for Soundbeats."""
import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from homeassistant.components.media_player import (
    DOMAIN as MEDIA_PLAYER_DOMAIN,
    SERVICE_MEDIA_PAUSE,
    SERVICE_MEDIA_PLAY,
    SERVICE_MEDIA_STOP,
    SERVICE_PLAY_MEDIA,
    SERVICE_SELECT_SOURCE,
    SERVICE_VOLUME_SET,
    MediaPlayerState,
    MediaType,
)
from homeassistant.const import (
    ATTR_ENTITY_ID,
    STATE_IDLE,
    STATE_OFF,
    STATE_PAUSED,
    STATE_PLAYING,
    STATE_UNAVAILABLE,
)
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


@dataclass
class PlaybackResult:
    """Result of a playback operation."""
    
    success: bool
    error: Optional[str] = None
    media_player_state: Optional[str] = None


class MediaController:
    """Controls media playback for the game."""
    
    def __init__(self, hass: HomeAssistant, media_player_entity_id: Optional[str] = None) -> None:
        """Initialize the media controller."""
        self.hass = hass
        self._media_player_entity_id = media_player_entity_id
        self._play_task: Optional[asyncio.Task] = None
        self._current_track_url: Optional[str] = None
        self._auto_pause_timer: Optional[asyncio.Task] = None
    
    async def set_media_player(self, entity_id: str) -> None:
        """Set the media player entity to use."""
        self._media_player_entity_id = entity_id
        _LOGGER.debug("Media player set to: %s", entity_id)
    
    async def play_snippet(
        self, 
        track_url: str, 
        duration: int = 30,
        start_position: int = 0
    ) -> PlaybackResult:
        """Play a music snippet for the specified duration."""
        if not self._media_player_entity_id:
            return PlaybackResult(
                success=False,
                error="No media player configured"
            )
        
        # Cancel any existing playback
        await self.stop_playback()
        
        # Check media player availability
        ready, error = await self._ensure_media_player_ready()
        if not ready:
            return PlaybackResult(success=False, error=error)
        
        try:
            # For Spotify, ensure a source is selected
            if "spotify" in self._media_player_entity_id.lower():
                source_selected = await self._ensure_spotify_source()
                if not source_selected:
                    return PlaybackResult(
                        success=False,
                        error="No Spotify device available"
                    )
            
            # Play the track
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_PLAY_MEDIA,
                {
                    ATTR_ENTITY_ID: self._media_player_entity_id,
                    "media_content_type": MediaType.MUSIC,
                    "media_content_id": track_url,
                },
                blocking=True,
            )
            
            self._current_track_url = track_url
            
            # Wait a moment for playback to start
            await asyncio.sleep(2)
            
            # Verify playback started
            state = self.hass.states.get(self._media_player_entity_id)
            if state and state.state != STATE_PLAYING:
                _LOGGER.warning(
                    "Media player not playing after play command. State: %s", 
                    state.state
                )
            
            # Schedule auto-pause after duration
            if duration > 0:
                self._auto_pause_timer = asyncio.create_task(
                    self._auto_pause_after(duration)
                )
            
            return PlaybackResult(
                success=True,
                media_player_state=state.state if state else None
            )
            
        except Exception as err:
            _LOGGER.error("Error playing media: %s", err)
            return PlaybackResult(
                success=False,
                error=f"Playback failed: {str(err)}"
            )
    
    async def pause_playback(self) -> PlaybackResult:
        """Pause current playback."""
        if not self._media_player_entity_id:
            return PlaybackResult(success=False, error="No media player configured")
        
        try:
            # Cancel auto-pause timer
            if self._auto_pause_timer:
                self._auto_pause_timer.cancel()
                self._auto_pause_timer = None
            
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_MEDIA_PAUSE,
                {ATTR_ENTITY_ID: self._media_player_entity_id},
                blocking=True,
            )
            
            return PlaybackResult(success=True)
            
        except Exception as err:
            _LOGGER.error("Error pausing media: %s", err)
            return PlaybackResult(
                success=False,
                error=f"Pause failed: {str(err)}"
            )
    
    async def resume_playback(self) -> PlaybackResult:
        """Resume paused playback."""
        if not self._media_player_entity_id:
            return PlaybackResult(success=False, error="No media player configured")
        
        try:
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_MEDIA_PLAY,
                {ATTR_ENTITY_ID: self._media_player_entity_id},
                blocking=True,
            )
            
            return PlaybackResult(success=True)
            
        except Exception as err:
            _LOGGER.error("Error resuming media: %s", err)
            return PlaybackResult(
                success=False,
                error=f"Resume failed: {str(err)}"
            )
    
    async def stop_playback(self) -> PlaybackResult:
        """Stop current playback."""
        if not self._media_player_entity_id:
            return PlaybackResult(success=True)
        
        try:
            # Cancel auto-pause timer
            if self._auto_pause_timer:
                self._auto_pause_timer.cancel()
                self._auto_pause_timer = None
            
            # Stop playback
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_MEDIA_STOP,
                {ATTR_ENTITY_ID: self._media_player_entity_id},
                blocking=True,
            )
            
            self._current_track_url = None
            return PlaybackResult(success=True)
            
        except Exception as err:
            _LOGGER.error("Error stopping media: %s", err)
            return PlaybackResult(
                success=False,
                error=f"Stop failed: {str(err)}"
            )
    
    async def set_volume(self, volume_level: float) -> PlaybackResult:
        """Set media player volume (0.0 to 1.0)."""
        if not self._media_player_entity_id:
            return PlaybackResult(success=False, error="No media player configured")
        
        # Clamp volume to valid range
        volume_level = max(0.0, min(1.0, volume_level))
        
        try:
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_VOLUME_SET,
                {
                    ATTR_ENTITY_ID: self._media_player_entity_id,
                    "volume_level": volume_level,
                },
                blocking=True,
            )
            
            return PlaybackResult(success=True)
            
        except Exception as err:
            _LOGGER.error("Error setting volume: %s", err)
            return PlaybackResult(
                success=False,
                error=f"Volume change failed: {str(err)}"
            )
    
    def get_current_state(self) -> Dict[str, Any]:
        """Get current media player state and attributes."""
        if not self._media_player_entity_id:
            return {
                "available": False,
                "entity_id": None,
            }
        
        state = self.hass.states.get(self._media_player_entity_id)
        if not state:
            return {
                "available": False,
                "entity_id": self._media_player_entity_id,
                "error": "Entity not found",
            }
        
        return {
            "available": state.state != STATE_UNAVAILABLE,
            "entity_id": self._media_player_entity_id,
            "state": state.state,
            "is_playing": state.state == STATE_PLAYING,
            "media_title": state.attributes.get("media_title"),
            "media_artist": state.attributes.get("media_artist"),
            "media_album": state.attributes.get("media_album_name"),
            "media_image_url": state.attributes.get("entity_picture"),
            "volume_level": state.attributes.get("volume_level"),
            "source": state.attributes.get("source"),
            "source_list": state.attributes.get("source_list", []),
        }
    
    async def _ensure_media_player_ready(self) -> tuple[bool, Optional[str]]:
        """Ensure media player is available and ready."""
        state = self.hass.states.get(self._media_player_entity_id)
        
        if not state:
            return False, "Media player entity not found"
        
        if state.state == STATE_UNAVAILABLE:
            return False, "Media player is unavailable"
        
        if state.state == STATE_OFF:
            # Try to turn on the media player
            try:
                await self.hass.services.async_call(
                    MEDIA_PLAYER_DOMAIN,
                    "turn_on",
                    {ATTR_ENTITY_ID: self._media_player_entity_id},
                    blocking=True,
                )
                # Wait for it to turn on
                await asyncio.sleep(2)
            except Exception as err:
                _LOGGER.warning("Could not turn on media player: %s", err)
        
        return True, None
    
    async def _ensure_spotify_source(self) -> bool:
        """Ensure a Spotify source is selected."""
        state = self.hass.states.get(self._media_player_entity_id)
        if not state:
            return False
        
        # Check if source is already selected
        current_source = state.attributes.get("source")
        if current_source:
            return True
        
        # Get available sources
        source_list = state.attributes.get("source_list", [])
        if not source_list:
            _LOGGER.warning("No Spotify sources available")
            return False
        
        # Select first available source
        try:
            await self.hass.services.async_call(
                MEDIA_PLAYER_DOMAIN,
                SERVICE_SELECT_SOURCE,
                {
                    ATTR_ENTITY_ID: self._media_player_entity_id,
                    "source": source_list[0],
                },
                blocking=True,
            )
            
            # Wait for source selection
            await asyncio.sleep(1)
            return True
            
        except Exception as err:
            _LOGGER.error("Error selecting Spotify source: %s", err)
            return False
    
    async def _auto_pause_after(self, duration: int) -> None:
        """Auto-pause playback after specified duration."""
        try:
            await asyncio.sleep(duration)
            await self.pause_playback()
            _LOGGER.debug("Auto-paused after %d seconds", duration)
        except asyncio.CancelledError:
            _LOGGER.debug("Auto-pause cancelled")
            
    def supports_spotify(self) -> bool:
        """Check if the current media player supports Spotify."""
        if not self._media_player_entity_id:
            return False
        
        return "spotify" in self._media_player_entity_id.lower()
    
    def supports_apple_music(self) -> bool:
        """Check if the current media player supports Apple Music."""
        if not self._media_player_entity_id:
            return False
        
        # Check for Music Assistant or Apple Music integration
        return any(x in self._media_player_entity_id.lower() 
                  for x in ["music_assistant", "apple", "airplay"])