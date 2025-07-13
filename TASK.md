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

## Completed Tasks
(Completed tasks will be moved here with completion date)