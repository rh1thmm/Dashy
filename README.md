# dashy

Quiet-luxury 4×4 dashboard with Clock, Weather, Tasks, and HTTP Trigger widgets.

Stack: React 19 + Vite + TypeScript + Tailwind CSS v4 + react-grid-layout + @tanstack/react-query.

## Widgets

| Widget | Compact (1×1) | Standard (2–8 area) | Expanded (9+ area) |
|--------|---------------|---------------------|---------------------|
| Clock | Analog clock | + digital time + date | + greeting |
| Weather | Temp + icon | + location + 3d forecast | + feels/humidity/wind/pressure + 5d forecast |
| Tasks | Done/total count + progress | Checklist (5 items) | Full list + inline add |
| Actions | Count + first trigger | Scrollable trigger list | Grid cards with details |

## Setup

```sh
npm install
```

## Development

```sh
npm run dev
```

Starts on port 4200. Falls back automatically if taken.

## Build

```sh
npm run build
npm run preview   # serve the built app
```

## Configuration

### Weather
- Place Weather widget via the Plus button in edit mode
- Open Gear modal to set city and optionally override the OpenWeatherMap API key
- Default key is shared; set your own in the Gear modal (stored locally)

### Widgets
- Enter edit mode (bottom-right pencil button) to add, remove, resize, and rearrange widgets
- Each widget has a Gear button in edit mode for settings
- Layout and all configs persist automatically in localStorage

## Palette

Backgrounds: Bone, Blush, Cream, Peach, Sage, Sky, Lavender, Charcoal, Navy.

Grid: solid / dashed / dotted / hidden lines, thin or normal weight. Noise overlay optional.
