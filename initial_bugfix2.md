## FEATURE:

Fix multiple UI and functionality issues in the Soundbeats game panel including non-working timer, scrolling problems, missing cover art, disabled guess inputs, and team name editing controls appearing at wrong times.

## EXAMPLES:

Current problematic behavior:

1. **Timer not working** - Timer display shows but doesn't count down when round starts
2. **Cannot scroll dashboard** - Panel content is cut off and scrolling is disabled/not working
3. **Cover art missing** - Album/song cover art not visible for the last played song
4. **Cannot add guesses** - Input fields for year guesses are disabled or not accepting input
5. **Team name boxes timing** - Team name edit boxes showing during gameplay instead of only before first round

Expected behavior after fix:

1. **Timer counts down** - Timer starts at configured seconds and counts down to 0 during active rounds
2. **Scrollable panel** - Full panel content accessible via scrolling on all screen sizes
3. **Cover art displays** - Album artwork shows correctly for revealed songs
4. **Guess inputs work** - Teams can enter year guesses during active rounds
5. **Team names editable only initially** - Name inputs only show before game starts, locked during play

## DOCUMENTATION:

- Home Assistant Panel Development: https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
- Lit Element Documentation: https://lit.dev/docs/
- CSS Overflow and Scrolling: https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
- Home Assistant WebSocket Real-time Updates: https://developers.home-assistant.io/docs/api/websocket/
- JavaScript Timer/Interval Management: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
- Home Assistant Media Player Integration: https://developers.home-assistant.io/docs/core/entity/media-player/

## OTHER CONSIDERATIONS:

- Timer issues might be related to WebSocket event subscriptions or state management
- Scrolling problems could be CSS overflow settings or panel container constraints
- Cover art requires proper media player entity state access and image URL handling
- Input field state management needs to sync with game state (round active/inactive)
- Team name editing should be conditional based on game state (not started vs in progress)
- Consider mobile vs desktop viewport differences for scrolling behavior
- Ensure timer cleanup on component unmount to prevent memory leaks
- Media player entity might need specific attributes for artwork URLs
- Input validation for year guesses (4-digit years, numeric only)
- Consider accessibility for form inputs and timer announcements