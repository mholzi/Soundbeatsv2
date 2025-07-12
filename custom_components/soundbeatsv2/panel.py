"""Panel registration for Soundbeats."""
import logging

_LOGGER = logging.getLogger(__name__)

PANEL_URL = """
data:text/html,
<!DOCTYPE html>
<html>
<head>
    <title>Soundbeats</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script type="module" src="/soundbeatsv2_files/soundbeats-panel.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--primary-font-family, "Roboto", sans-serif);
            background-color: var(--primary-background-color, #fafafa);
            color: var(--primary-text-color, #212121);
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="loading">Loading Soundbeats...</div>
    </div>
    <soundbeats-panel></soundbeats-panel>
</body>
</html>
""".strip()


def get_panel_url():
    """Get the panel URL."""
    return PANEL_URL