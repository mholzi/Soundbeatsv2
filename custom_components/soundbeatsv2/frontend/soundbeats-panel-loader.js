// Load the Soundbeats panel web component
import './soundbeats-panel.js';

// Register the custom panel with Home Assistant
if (!customElements.get('soundbeats-panel')) {
    console.log('Soundbeats panel loader: Waiting for registration...');
    // The component self-registers in soundbeats-panel.js
} else {
    console.log('Soundbeats panel already registered');
}