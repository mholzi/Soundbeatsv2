## FEATURE:

Fix the Soundbeats HACS integration dashboard visibility and WebSocket connection issues to ensure the game panel properly appears in the Home Assistant sidebar and functions correctly when accessed.

## EXAMPLES:

Current problematic behavior:

1. **Integration loads but no sidebar entry** - After configuring the integration through Devices & Services, no "Soundbeats" menu item appears in the sidebar
2. **WebSocket connection error** - When manually navigating to `/soundbeatsv2`, the page fails with: `Error: connection.sendMessagePromise is not a function`
3. **panel-simple.html:257** - Uses deprecated `connection.sendMessagePromise()` method
4. **websocket-service.js:79** - Also uses the deprecated WebSocket API method

Expected behavior after fix:

1. **Sidebar entry appears** - "Soundbeats" menu item with music note icon automatically appears after configuration
2. **Panel loads correctly** - Clicking the sidebar entry opens the game UI without errors
3. **WebSocket communication works** - Game can communicate with backend using proper Home Assistant WebSocket API
4. **Uses correct API** - Replace `sendMessagePromise` with `sendMessage` or proper WebSocket subscription pattern

## DOCUMENTATION:

- Home Assistant Frontend Development: https://developers.home-assistant.io/docs/frontend/
- Home Assistant WebSocket API: https://developers.home-assistant.io/docs/api/websocket/
- Custom Panel Development: https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
- HACS Integration Guidelines: https://www.hacs.xyz/docs/publish/integration/
- Home Assistant JavaScript API changes: https://developers.home-assistant.io/blog/2023/07/05/websocket-api-changes/

## OTHER CONSIDERATIONS:

- The `sendMessagePromise` method was deprecated in recent Home Assistant versions
- Need to use the correct WebSocket connection pattern for Home Assistant 2023.9.0+
- The panel registration in `__init__.py` must properly register both the static files and the panel configuration
- Consider using `subscribeMessage` for real-time updates instead of promise-based messaging
- Ensure the frontend JavaScript properly waits for the Home Assistant connection to be established
- The panel URL path must match between the registration and the frontend code
- Test on both desktop and mobile Home Assistant interfaces
- Verify the integration type is correct (should it be "integration" or "hub"?)