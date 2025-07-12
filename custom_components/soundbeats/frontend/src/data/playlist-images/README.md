# Playlist Cover Images

This directory contains cover art images for the music playlists used in Soundbeats.

## Required Images

The following playlist cover images should be added by the developer:

- `default.jpg` - Cover for the Default Mix playlist
- `80s.jpg` - Cover for the 80s Hits playlist  
- `90s.jpg` - Cover for the 90s Classics playlist
- `2000s.jpg` - Cover for the 2000s Pop playlist
- `rock.jpg` - Cover for the Rock Anthems playlist
- `pop.jpg` - Cover for the Pop Favorites playlist

## Image Specifications

- **Format**: JPG or PNG
- **Dimensions**: 300x300 pixels (square)
- **File size**: < 100KB each
- **Style**: Should match the game's visual theme

## Fallback

If images are not available, the frontend will fall back to:
1. CSS-generated gradients with playlist name
2. Default music note icons
3. Placeholder images via CSS

## Usage

These images are referenced in `playlists.json` and displayed in:
- Playlist selection dropdown
- Game setup interface  
- Background elements during gameplay