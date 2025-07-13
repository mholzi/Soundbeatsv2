# Soundbeats Tasks

## Current Task - 2025-07-13
**Fix Soundbeats Dashboard Visibility and WebSocket Issues**

### Problem Summary:
- Panel is not appearing in the sidebar after configuration
- WebSocket connection errors in iframe context
- Using iframe panel instead of custom panel with web component

### Root Causes Identified:
1. Panel registration is missing after config entry setup
2. Iframe panels don't have proper access to WebSocket connections
3. Current implementation uses iframe instead of proper web component panel

### Implementation Strategy:
- [x] Fix panel registration in __init__.py after config entry setup
- [x] Convert from iframe panel to custom web component panel
- [x] Ensure WebSocket connection is properly accessible in panel context
- [x] Fix event name consistency between frontend and backend
- [ ] Test sidebar visibility and WebSocket functionality

## Discovered During Work
- Created soundbeats-panel-loader.js to ensure proper module loading
- Fixed WebSocket event names to use consistent domain prefix (soundbeatsv2)
- Removed unnecessary iframe panel HTML file dependency

## Current Task - 2025-07-13
**Fix 5 Major Bugs in Soundbeats Game Panel**

### Bugs to Fix:
1. Timer not working (only updates on full state changes)
2. Cannot scroll dashboard (multiple overflow:hidden declarations)
3. Cover art missing (not getting artwork from media player entity)
4. Cannot add guesses (user team assignment not working)
5. Team name boxes timing (should only be editable before game starts)

### Implementation Strategy:
- [ ] Fix timer by listening to timerUpdate events in soundbeats-panel.js
- [ ] Fix scrolling by adjusting CSS overflow properties
- [ ] Add media player entity state to cover art display
- [ ] Fix user team assignment and round_active state
- [ ] Update team name editing logic based on game state

## Completed Tasks
(Completed tasks will be moved here with completion date)