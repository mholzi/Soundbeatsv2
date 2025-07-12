"""WebSocket API handlers for Soundbeats."""
import logging
from typing import Any, Dict

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv

from .const import CONF_MEDIA_PLAYER, DOMAIN
from .game_manager import GameManager
from .media_controller import MediaController

_LOGGER = logging.getLogger(__name__)


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/get_game_state",
    vol.Optional("config_entry_id"): str,
})
@callback
def websocket_get_game_state(
    hass: HomeAssistant, 
    connection: websocket_api.ActiveConnection, 
    msg: Dict[str, Any]
) -> None:
    """Handle get game state command."""
    # Get first available config entry if not specified
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"], 
                websocket_api.ERR_NOT_FOUND, 
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    # Get game manager
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
    
    # Check user permissions and get appropriate state
    user = connection.user
    if user and not user.is_admin:
        # Return filtered state for non-admin users
        state = game_manager.get_filtered_state(user.id)
    else:
        # Return full state for admin users
        state = game_manager.get_state()
    
    # Add media player state
    media_player_id = hass.data[DOMAIN][config_entry_id].get("media_player")
    if media_player_id:
        media_controller = MediaController(hass, media_player_id)
        state["media_player"] = media_controller.get_current_state()
    
    connection.send_result(msg["id"], state)


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/new_game",
    vol.Required("team_count"): vol.All(int, vol.Range(min=1, max=5)),
    vol.Required("playlist_id"): str,
    vol.Optional("timer_seconds", default=30): vol.All(int, vol.Range(min=5, max=300)),
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_new_game(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle new game command."""
    # Check admin permissions
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Admin access required to start new game"
        )
        return
    
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        
        game_state = await game_manager.new_game(
            team_count=msg["team_count"],
            playlist_id=msg["playlist_id"],
            timer_seconds=msg["timer_seconds"]
        )
        
        connection.send_result(msg["id"], {
            "success": True,
            "game_id": game_state.game_id,
            "teams": len(game_state.teams),
        })
        
    except Exception as err:
        _LOGGER.error("Error starting new game: %s", err)
        connection.send_error(
            msg["id"],
            "start_game_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/submit_guess",
    vol.Required("team_id"): str,
    vol.Required("year"): vol.All(int, vol.Range(min=1900, max=2030)),
    vol.Optional("has_bet", default=False): bool,
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_submit_guess(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle submit guess command."""
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        
        # Check if user can control this team
        user = connection.user
        if not user.is_admin:
            # For non-admin users, check team assignment
            state = game_manager.get_filtered_state(user.id)
            allowed_teams = state.get("can_control_teams", [])
            if msg["team_id"] not in allowed_teams:
                connection.send_error(
                    msg["id"],
                    websocket_api.ERR_UNAUTHORIZED,
                    "You can only control your assigned team"
                )
                return
        
        await game_manager.submit_guess(
            team_id=msg["team_id"],
            year=msg["year"],
            has_bet=msg["has_bet"]
        )
        
        connection.send_result(msg["id"], {"success": True})
        
    except ValueError as err:
        connection.send_error(
            msg["id"],
            "invalid_guess",
            str(err)
        )
    except Exception as err:
        _LOGGER.error("Error submitting guess: %s", err)
        connection.send_error(
            msg["id"],
            "submit_guess_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/start_round",
    vol.Required("song"): dict,
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_start_round(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle start round command."""
    # Check admin permissions
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Admin access required to start rounds"
        )
        return
    
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        
        # Start the round
        await game_manager.start_round(msg["song"])
        
        # Start music playback if media player is configured
        media_player_id = hass.data[DOMAIN][config_entry_id].get("media_player")
        if media_player_id:
            media_controller = MediaController(hass, media_player_id)
            result = await media_controller.play_snippet(
                track_url=msg["song"]["url"],
                duration=game_manager._game_state.timer_seconds
            )
            
            if not result.success:
                _LOGGER.warning("Failed to start music playback: %s", result.error)
        
        connection.send_result(msg["id"], {"success": True})
        
    except Exception as err:
        _LOGGER.error("Error starting round: %s", err)
        connection.send_error(
            msg["id"],
            "start_round_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/next_round",
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_next_round(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle next round command."""
    # Check admin permissions
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Admin access required to advance rounds"
        )
        return
    
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        await game_manager.next_round()
        
        connection.send_result(msg["id"], {"success": True})
        
    except Exception as err:
        _LOGGER.error("Error advancing to next round: %s", err)
        connection.send_error(
            msg["id"],
            "next_round_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/update_team_name",
    vol.Required("team_id"): str,
    vol.Required("name"): str,
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_update_team_name(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle update team name command."""
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        
        # Check if user can control this team
        user = connection.user
        if not user.is_admin:
            state = game_manager.get_filtered_state(user.id)
            allowed_teams = state.get("can_control_teams", [])
            if msg["team_id"] not in allowed_teams:
                connection.send_error(
                    msg["id"],
                    websocket_api.ERR_UNAUTHORIZED,
                    "You can only modify your assigned team"
                )
                return
        
        await game_manager.update_team_name(
            team_id=msg["team_id"],
            name=msg["name"]
        )
        
        connection.send_result(msg["id"], {"success": True})
        
    except Exception as err:
        _LOGGER.error("Error updating team name: %s", err)
        connection.send_error(
            msg["id"],
            "update_team_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/assign_user_to_team",
    vol.Required("team_id"): str,
    vol.Required("user_id"): str,
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_assign_user_to_team(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle assign user to team command."""
    # Check admin permissions
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Admin access required to assign users to teams"
        )
        return
    
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    try:
        game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
        
        await game_manager.assign_user_to_team(
            team_id=msg["team_id"],
            user_id=msg["user_id"]
        )
        
        connection.send_result(msg["id"], {"success": True})
        
    except Exception as err:
        _LOGGER.error("Error assigning user to team: %s", err)
        connection.send_error(
            msg["id"],
            "assign_user_failed",
            str(err)
        )


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/get_highscores",
    vol.Optional("config_entry_id"): str,
})
@callback
def websocket_get_highscores(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle get highscores command."""
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    game_manager: GameManager = hass.data[DOMAIN][config_entry_id]["game_manager"]
    highscores = game_manager.get_highscores()
    
    connection.send_result(msg["id"], highscores)


@websocket_api.websocket_command({
    vol.Required("type"): "soundbeatsv2/media_control",
    vol.Required("action"): vol.In(["play", "pause", "stop", "volume"]),
    vol.Optional("volume_level"): vol.All(float, vol.Range(min=0.0, max=1.0)),
    vol.Optional("config_entry_id"): str,
})
@websocket_api.async_response
async def websocket_media_control(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any]
) -> None:
    """Handle media control command."""
    # Check admin permissions
    if not connection.user.is_admin:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Admin access required for media control"
        )
        return
    
    # Get config entry
    config_entry_id = msg.get("config_entry_id")
    if not config_entry_id:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_error(
                msg["id"],
                websocket_api.ERR_NOT_FOUND,
                "No Soundbeats integration configured"
            )
            return
        config_entry_id = entries[0].entry_id
    
    if config_entry_id not in hass.data.get(DOMAIN, {}):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_NOT_FOUND,
            "Configuration entry not found"
        )
        return
    
    # Get media player
    media_player_id = hass.data[DOMAIN][config_entry_id].get("media_player")
    if not media_player_id:
        connection.send_error(
            msg["id"],
            "no_media_player",
            "No media player configured"
        )
        return
    
    try:
        media_controller = MediaController(hass, media_player_id)
        action = msg["action"]
        
        if action == "play":
            result = await media_controller.resume_playback()
        elif action == "pause":
            result = await media_controller.pause_playback()
        elif action == "stop":
            result = await media_controller.stop_playback()
        elif action == "volume":
            volume_level = msg.get("volume_level", 0.5)
            result = await media_controller.set_volume(volume_level)
        else:
            connection.send_error(
                msg["id"],
                "invalid_action",
                f"Unknown action: {action}"
            )
            return
        
        if result.success:
            connection.send_result(msg["id"], {"success": True})
        else:
            connection.send_error(
                msg["id"],
                "media_control_failed",
                result.error or "Unknown error"
            )
            
    except Exception as err:
        _LOGGER.error("Error controlling media: %s", err)
        connection.send_error(
            msg["id"],
            "media_control_failed",
            str(err)
        )