"""Config flow for Soundbeats integration."""
import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.components.media_player import DOMAIN as MEDIA_PLAYER_DOMAIN
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector
from homeassistant.helpers.entity_registry import async_entries_for_config_entry, async_get

from .const import (
    CONF_MEDIA_PLAYER,
    CONF_TIMER_SECONDS,
    DEFAULT_TIMER_SECONDS,
    DOMAIN,
    MAX_TIMER_SECONDS,
    MIN_TIMER_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


async def validate_input(hass: HomeAssistant, data: dict[str, Any]) -> dict[str, str]:
    """Validate the user input allows us to connect."""
    errors = {}
    
    # Validate media player exists
    if CONF_MEDIA_PLAYER in data:
        media_player = data[CONF_MEDIA_PLAYER]
        if not hass.states.get(media_player):
            errors[CONF_MEDIA_PLAYER] = "media_player_not_found"
    
    return errors


class SoundbeatsConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Soundbeats."""
    
    VERSION = 1
    
    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors = {}
        
        if user_input is not None:
            errors = await validate_input(self.hass, user_input)
            
            if not errors:
                # Check if already configured
                await self.async_set_unique_id(DOMAIN)
                self._abort_if_unique_id_configured()
                
                return self.async_create_entry(
                    title="Soundbeats Music Trivia",
                    data=user_input,
                )
        
        # Get list of media players
        media_players = [
            state.entity_id
            for state in self.hass.states.async_all()
            if state.domain == MEDIA_PLAYER_DOMAIN
        ]
        
        schema = vol.Schema({
            vol.Optional(CONF_MEDIA_PLAYER): selector.EntitySelector(
                selector.EntitySelectorConfig(
                    domain=MEDIA_PLAYER_DOMAIN,
                )
            ),
            vol.Optional(
                CONF_TIMER_SECONDS, 
                default=DEFAULT_TIMER_SECONDS
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=MIN_TIMER_SECONDS,
                    max=MAX_TIMER_SECONDS,
                    mode=selector.NumberSelectorMode.SLIDER,
                    unit_of_measurement="seconds",
                )
            ),
        })
        
        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )
    
    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Get the options flow for this handler."""
        return SoundbeatsOptionsFlow(config_entry)


class SoundbeatsOptionsFlow(config_entries.OptionsFlow):
    """Handle options flow for Soundbeats."""
    
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry
    
    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        
        schema = vol.Schema({
            vol.Optional(
                CONF_MEDIA_PLAYER,
                default=self.config_entry.options.get(
                    CONF_MEDIA_PLAYER,
                    self.config_entry.data.get(CONF_MEDIA_PLAYER, "")
                ),
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(
                    domain=MEDIA_PLAYER_DOMAIN,
                )
            ),
            vol.Optional(
                CONF_TIMER_SECONDS,
                default=self.config_entry.options.get(
                    CONF_TIMER_SECONDS,
                    self.config_entry.data.get(CONF_TIMER_SECONDS, DEFAULT_TIMER_SECONDS)
                ),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=MIN_TIMER_SECONDS,
                    max=MAX_TIMER_SECONDS,
                    mode=selector.NumberSelectorMode.SLIDER,
                    unit_of_measurement="seconds",
                )
            ),
        })
        
        return self.async_show_form(
            step_id="init",
            data_schema=schema,
        )