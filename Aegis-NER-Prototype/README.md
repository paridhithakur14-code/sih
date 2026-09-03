# Aegis NER — Landslide Early Warning Prototype

A responsive HTML, CSS and JavaScript prototype for an AI-enabled landslide risk monitoring and early-warning platform for North East India.

## Included files

- `index.html` — dashboard structure and content
- `styles.css` — complete responsive dashboard design
- `app.js` — map interactions, AI risk simulator, reports, alerts and language selection
- `sw.js` — offline caching service worker

## Run locally

Because the project uses a service worker, run it through a local server instead of double-clicking `index.html`.

### VS Code Live Server

1. Open the `Aegis-NER-Prototype` folder in VS Code.
2. Install the **Live Server** extension if it is not installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Python alternative

Run this command inside the project folder:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Prototype capabilities

- Interactive NER landslide risk map
- Explainable AI-style risk forecast panel
- Rainfall, soil moisture, slope and historical-event simulation
- Road connectivity and emergency priority monitoring
- Geo-tagged field report workflow
- Offline report queue demonstration
- Multilingual alert selection with 32 language options
- Responsive desktop and mobile layouts

## Important

The risk values, sensor readings and alerts in this version are simulated for demonstration. A production system should connect to verified weather, satellite, sensor and government datasets and use a validated prediction model.
