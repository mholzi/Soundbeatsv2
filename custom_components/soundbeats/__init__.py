"""Soundbeats Music Trivia Game Integration for Home Assistant."""
import logging
from typing import Any
import voluptuous as vol

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.websocket_api import async_register_command
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, CONF_MEDIA_PLAYER
from .game_manager import GameManager
from .websocket_api import (
    websocket_get_game_state,
    websocket_new_game,
    websocket_submit_guess,
    websocket_start_round,
    websocket_next_round,
    websocket_update_team_name,
    websocket_get_highscores,
    websocket_assign_user_to_team,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema({
            vol.Optional(CONF_MEDIA_PLAYER): cv.entity_id,
        })
    },
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Soundbeats component."""
    hass.data.setdefault(DOMAIN, {})
    
    # Register frontend files
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            "/soundbeats_files",
            hass.config.path("custom_components/soundbeats/frontend"),
            cache_headers=True
        )
    ])
    
    # Register custom panel
    async_register_built_in_panel(
        hass,
        component_name="soundbeats",
        sidebar_title="Soundbeats",
        sidebar_icon="mdi:music-note",
        frontend_url_path="soundbeats",
        config_panel_domain=DOMAIN,
        config={
            "version": "1.0.0",
        },
        require_admin=False,  # Allow non-admin users in multi-user mode
    )
    
    # Register WebSocket commands
    async_register_command(hass, websocket_get_game_state)
    async_register_command(hass, websocket_new_game)
    async_register_command(hass, websocket_submit_guess)
    async_register_command(hass, websocket_start_round)
    async_register_command(hass, websocket_next_round)
    async_register_command(hass, websocket_update_team_name)
    async_register_command(hass, websocket_get_highscores)
    async_register_command(hass, websocket_assign_user_to_team)
    
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Soundbeats from a config entry."""
    _LOGGER.debug("Setting up Soundbeats config entry: %s", entry.entry_id)
    
    # Initialize game manager
    game_manager = GameManager(hass, entry)
    
    # Store in hass data
    hass.data[DOMAIN][entry.entry_id] = {
        "game_manager": game_manager,
        "media_player": entry.data.get(CONF_MEDIA_PLAYER),
    }
    
    # Load stored state
    await game_manager.load_state()
    
    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.debug("Unloading Soundbeats config entry: %s", entry.entry_id)
    
    # Save state before unloading
    game_manager = hass.data[DOMAIN][entry.entry_id]["game_manager"]
    await game_manager.save_state()
    
    # Unload platforms
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)
    
    return unload_ok


async def async_migrate_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Migrate old entry."""
    _LOGGER.debug("Migrating Soundbeats config entry from version %s", config_entry.version)
    
    if config_entry.version == 1:
        # Future migration code here
        pass
    
    return True