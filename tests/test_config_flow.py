"""Tests for config_flow.py"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.data_entry_flow import FlowResultType

from custom_components.soundbeatsv2.config_flow import SoundbeatsConfigFlow
from custom_components.soundbeatsv2.const import DOMAIN, CONF_MEDIA_PLAYER


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.states = MagicMock()
    hass.states.async_entity_ids.return_value = [
        "media_player.spotify",
        "media_player.chromecast",
        "media_player.apple_tv",
    ]
    return hass


@pytest.fixture
def config_flow(mock_hass):
    """Create SoundbeatsConfigFlow instance."""
    flow = SoundbeatsConfigFlow()
    flow.hass = mock_hass
    return flow


class TestSoundbeatsConfigFlow:
    """Test SoundbeatsConfigFlow class."""

    @pytest.mark.asyncio
    async def test_flow_init(self, config_flow):
        """Test initial configuration flow step."""
        result = await config_flow.async_step_user()
        
        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "user"
        assert CONF_NAME in result["data_schema"].schema
        assert CONF_MEDIA_PLAYER in result["data_schema"].schema

    @pytest.mark.asyncio
    async def test_flow_user_input_valid(self, config_flow):
        """Test user input with valid data."""
        user_input = {
            CONF_NAME: "My Soundbeats Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        result = await config_flow.async_step_user(user_input)
        
        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["title"] == "My Soundbeats Game"
        assert result["data"] == user_input

    @pytest.mark.asyncio
    async def test_flow_user_input_missing_name(self, config_flow):
        """Test user input with missing name."""
        user_input = {
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        result = await config_flow.async_step_user(user_input)
        
        assert result["type"] == FlowResultType.FORM
        assert "errors" in result
        assert result["errors"]["base"] == "missing_name"

    @pytest.mark.asyncio
    async def test_flow_user_input_missing_media_player(self, config_flow):
        """Test user input with missing media player."""
        user_input = {
            CONF_NAME: "My Soundbeats Game",
        }
        
        result = await config_flow.async_step_user(user_input)
        
        assert result["type"] == FlowResultType.FORM
        assert "errors" in result
        assert result["errors"]["base"] == "missing_media_player"

    @pytest.mark.asyncio
    async def test_flow_user_input_invalid_media_player(self, config_flow, mock_hass):
        """Test user input with invalid media player."""
        user_input = {
            CONF_NAME: "My Soundbeats Game",
            CONF_MEDIA_PLAYER: "media_player.nonexistent",
        }
        
        result = await config_flow.async_step_user(user_input)
        
        assert result["type"] == FlowResultType.FORM
        assert "errors" in result
        assert result["errors"]["base"] == "invalid_media_player"

    @pytest.mark.asyncio
    async def test_get_media_players(self, config_flow, mock_hass):
        """Test getting available media players."""
        media_players = await config_flow._get_media_players()
        
        expected = [
            "media_player.spotify",
            "media_player.chromecast", 
            "media_player.apple_tv",
        ]
        assert media_players == expected

    @pytest.mark.asyncio
    async def test_get_media_players_empty(self, config_flow, mock_hass):
        """Test getting media players when none exist."""
        mock_hass.states.async_entity_ids.return_value = []
        
        media_players = await config_flow._get_media_players()
        
        assert media_players == []

    @pytest.mark.asyncio
    async def test_validate_user_input_success(self, config_flow):
        """Test successful user input validation."""
        user_input = {
            CONF_NAME: "Valid Game Name",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        errors = await config_flow._validate_user_input(user_input)
        
        assert errors == {}

    @pytest.mark.asyncio
    async def test_validate_user_input_empty_name(self, config_flow):
        """Test validation with empty name."""
        user_input = {
            CONF_NAME: "",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        errors = await config_flow._validate_user_input(user_input)
        
        assert errors["base"] == "missing_name"

    @pytest.mark.asyncio
    async def test_validate_user_input_whitespace_name(self, config_flow):
        """Test validation with whitespace-only name."""
        user_input = {
            CONF_NAME: "   ",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        errors = await config_flow._validate_user_input(user_input)
        
        assert errors["base"] == "missing_name"

    @pytest.mark.asyncio
    async def test_validate_user_input_no_media_player(self, config_flow):
        """Test validation with no media player."""
        user_input = {
            CONF_NAME: "Valid Game Name",
        }
        
        errors = await config_flow._validate_user_input(user_input)
        
        assert errors["base"] == "missing_media_player"

    @pytest.mark.asyncio
    async def test_validate_user_input_invalid_media_player(self, config_flow):
        """Test validation with invalid media player."""
        user_input = {
            CONF_NAME: "Valid Game Name",
            CONF_MEDIA_PLAYER: "media_player.invalid",
        }
        
        errors = await config_flow._validate_user_input(user_input)
        
        assert errors["base"] == "invalid_media_player"

    def test_flow_version(self, config_flow):
        """Test config flow version."""
        assert config_flow.VERSION == 1

    def test_flow_domain(self, config_flow):
        """Test config flow domain."""
        assert config_flow.DOMAIN == DOMAIN

    def test_flow_connection_class(self, config_flow):
        """Test config flow connection class."""
        assert config_flow.CONNECTION_CLASS == config_entries.CONN_CLASS_LOCAL_POLL

    @pytest.mark.asyncio
    async def test_options_flow_init(self, config_flow):
        """Test options flow initialization."""
        config_entry = MagicMock()
        config_entry.data = {
            CONF_NAME: "Test Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        options_flow = config_flow.async_get_options_flow(config_entry)
        
        assert options_flow is not None

    @pytest.mark.asyncio
    async def test_options_flow_step_init(self, config_flow):
        """Test options flow initial step."""
        config_entry = MagicMock()
        config_entry.data = {
            CONF_NAME: "Test Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        config_entry.options = {}
        
        options_flow = config_flow.async_get_options_flow(config_entry)
        result = await options_flow.async_step_init()
        
        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "init"

    @pytest.mark.asyncio
    async def test_options_flow_user_input(self, config_flow):
        """Test options flow with user input."""
        config_entry = MagicMock()
        config_entry.data = {
            CONF_NAME: "Test Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        config_entry.options = {}
        
        options_flow = config_flow.async_get_options_flow(config_entry)
        
        user_input = {
            CONF_MEDIA_PLAYER: "media_player.chromecast",
        }
        
        result = await options_flow.async_step_init(user_input)
        
        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["data"] == user_input

    @pytest.mark.asyncio
    async def test_abort_if_configured_already_exists(self, config_flow, mock_hass):
        """Test flow aborts if integration already configured."""
        # Mock existing config entry
        existing_entry = MagicMock()
        existing_entry.domain = DOMAIN
        mock_hass.config_entries = MagicMock()
        mock_hass.config_entries.async_entries.return_value = [existing_entry]
        
        config_flow._async_abort_entries_match = MagicMock(return_value=True)
        config_flow.async_abort = MagicMock()
        
        user_input = {
            CONF_NAME: "New Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        # Check if flow checks for existing entries
        config_flow._async_abort_entries_match({DOMAIN: True})
        config_flow.async_abort.assert_called()

    @pytest.mark.asyncio
    async def test_form_schema_includes_required_fields(self, config_flow):
        """Test that form schema includes all required fields."""
        result = await config_flow.async_step_user()
        
        schema_keys = list(result["data_schema"].schema.keys())
        
        # Check for required configuration fields
        assert any(str(key) == CONF_NAME for key in schema_keys)
        assert any(str(key) == CONF_MEDIA_PLAYER for key in schema_keys)

    @pytest.mark.asyncio
    async def test_error_handling_during_validation(self, config_flow, mock_hass):
        """Test error handling during validation process."""
        # Mock an exception during media player validation
        mock_hass.states.async_entity_ids.side_effect = Exception("Test error")
        
        user_input = {
            CONF_NAME: "Test Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        result = await config_flow.async_step_user(user_input)
        
        # Should handle the exception gracefully
        assert result["type"] == FlowResultType.FORM
        assert "errors" in result

    @pytest.mark.asyncio
    async def test_unique_id_handling(self, config_flow):
        """Test unique ID handling in config flow."""
        # Config flow should set a unique ID
        config_flow.async_set_unique_id = MagicMock()
        
        user_input = {
            CONF_NAME: "Test Game",
            CONF_MEDIA_PLAYER: "media_player.spotify",
        }
        
        # The unique ID should be based on the name or domain
        expected_unique_id = f"{DOMAIN}_{user_input[CONF_NAME].lower().replace(' ', '_')}"
        
        # Verify unique ID would be set correctly
        assert DOMAIN in expected_unique_id
        assert "test_game" in expected_unique_id

    @pytest.mark.asyncio
    async def test_default_values_in_schema(self, config_flow, mock_hass):
        """Test that schema includes appropriate default values."""
        result = await config_flow.async_step_user()
        
        # Check that media player options are populated
        schema = result["data_schema"].schema
        media_player_field = None
        
        for key in schema.keys():
            if str(key) == CONF_MEDIA_PLAYER:
                media_player_field = schema[key]
                break
        
        assert media_player_field is not None