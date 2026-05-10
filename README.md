# dashy

> Quiet-luxury 4×4 dashboard with Clock, Weather, Tasks, and HTTP Trigger widgets.

![dashy screenshot](/dashy-screenshot.png)

## Features

- **4×4 grid** — fixed viewport-filling layout, no scrolling
- **3 widget tiers** — compact (1×1), standard (2–8 area), expanded (9+ area)
- **Clock** — analog SVG face + digital 12h time + date + greeting; configurable timezone
- **Weather** — current conditions + forecast; OpenWeatherMap-backed with mock fallback
- **Tasks** — checklist with progress bar; auto-removal after configurable delay
- **Actions** — fire arbitrary HTTP requests from user-configured trigger buttons
- **Persistent** — layout, backgrounds, grid settings, and widget configs saved to localStorage
- **Canvas controls** — 9 background colors, grid line style/weight, noise overlay
- **Edit mode** — add, remove, resize, and rearrange widgets freely (overlap blocked)
- **Quiet Luxury aesthetic** — Bone White canvas, Playfair Display + Inter typography, spring-based micro-interactions
- **Cursor auto-hide** — hides after 5s idle (pauses in edit mode)

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Build | Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| Grid | react-grid-layout v2 |
| Icons | @phosphor-icons/react |
| Data | @tanstack/react-query |
| Fonts | Playfair Display + Inter (Google Fonts) |
| Weather | OpenWeatherMap API |

## Getting Started

```sh
npm install
npm run dev
```

Starts on port 4200 with automatic fallback if taken.

### Build for production

```sh
npm run build
npm run preview   # serve the built app locally
```

## Usage

1. Open the app in your browser.
2. Click the **pencil** icon (bottom-right) to enter edit mode.
3. Click the **Plus** icon to add widgets (one of each type allowed).
4. Resize and rearrange tiles by dragging handles.
5. Click the **Gear** icon on any widget to configure it.
6. Click the **Palette** icon (bottom-right, edit mode) to change background, grid, and noise.
7. All state persists automatically.

## Widgets

| Widget | Compact (1×1) | Standard (2–8) | Expanded (9+) |
|--------|---------------|-----------------|---------------|
| **Clock** | Analog clock face | + digital time + date | + greeting |
| **Weather** | Temp + icon | + location + 3-day forecast | + feelsLike/humidity/wind/pressure + 5-day forecast |
| **Tasks** | Done/total count + progress bar | Checklist (5 items) with inline add | Full list + inline add |
| **Actions** | Count + first trigger name | Scrollable list with method/status | 2-column card grid |

## Configuration

### Weather
- Default city: Calgary
- API key stored in browser — set your own in the Weather Gear modal, or use the built-in key
- Falls back to mock data on fetch failure

### Tasks
- Remove completed tasks: Never / Instantly / After 1h / After 1d
- Tasks are fully controlled from the Dashboard — all state saved to localStorage

### Actions (Triggers)
- Each trigger has: label, URL, HTTP method, optional headers and body
- Fires browser `fetch()` directly — CORS-dependent
- Demo triggers pointing at `httpbin.org` included by default

### Canvas
| Option | Values |
|--------|--------|
| Background | Bone, Blush, Cream, Peach, Sage, Sky, Lavender, Charcoal, Navy |
| Grid line style | Solid, Dashed, Dotted, Hidden |
| Grid line weight | Thin (0.5px), Normal (1px) |
| Noise overlay | On / Off (2.5% opacity, multiply blend) |

## Keyboard

- `Escape` — close any open settings modal

## Data Persistence

All state is stored in `localStorage` under two keys:

- `monolith_dashboard_state` — widgets, layout, background, grid, noise settings
- `monolith_owm_key` — optional OpenWeatherMap API key override

No backend or server-side storage required.

## License

MIT
