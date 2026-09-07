# dashy

> Quiet-luxury 4×4 dashboard with Clock, Weather, Tasks, and HTTP Trigger widgets.

![dashy screenshot](https://github.com/rh1thmm/Dashy/blob/main/public/dashy-screenshot.png?raw=true)

## Features

- **4×4 grid** — fixed viewport-filling layout, no scrolling
- **3 widget tiers** — compact (1×1), standard (2–8 area), expanded (9+ area)
- **Clock** — analog SVG face + digital 12h time + date + greeting; configurable timezone
- **Weather** — current conditions + 3-day forecast; powered by wttr.in (no API key needed)
- **Tasks** — checklist with progress bar; auto-removal after configurable delay
- **Actions** — fire arbitrary HTTP requests from user-configured trigger buttons
- **Docker** — live local Docker engine and container status, refreshed every 30 seconds
- **Training** — scheduled workout reminders, a persistent session timer, rest days, and workout streaks
- **Persistent** — layout, backgrounds, grid settings, and widget configs saved to a local SQLite database
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
| Weather | wttr.in |

## Run locally

```sh
git clone https://github.com/rh1thmm/dashy.git
cd dashy
npm install
npm run build
./start
```

Dashy starts on port 4200. Use `PORT=3000 ./start` to change the port. The `./start` launcher builds automatically when `dist/` is missing.

### Development

```sh
npm run dev
```

## Usage

1. Open the app in your browser.
2. Click the **pencil** icon (bottom-right) to enter edit mode.
3. Click the **Plus** icon to add widgets (one of each type allowed).
4. Resize and rearrange tiles by dragging handles.
5. Click the **Settings** icon (bottom-right, edit mode) to configure widgets, themes, canvas controls, and saved data.
7. All state persists automatically.

## Widgets

| Widget | Compact (1×1) | Standard (2–8) | Expanded (9+) |
|--------|---------------|-----------------|---------------|
| **Clock** | Analog clock face | + digital time + date | + greeting |
| **Weather** | Temp + icon | + location + 3-day forecast | + feelsLike/humidity/wind/pressure + 3-day forecast |
| **Tasks** | Done/total count + progress bar | Checklist (5 items) with inline add | Full list + inline add |
| **Actions** | Count + first trigger name | Scrollable list with method/status | 2-column card grid |
| **Docker** | Running-container count | Engine summary + containers | Expanded container list |
| **Training** | Today’s plan/timer + streak | Session controls + weekly progress | Weekly progress + recent sessions |

## Configuration

### Weather
- Default city: Calgary — choose an unambiguous city and country in Settings
- Powered by wttr.in (no API key required)

### Tasks
- Remove completed tasks: Never / Instantly / After 1h / After 1d
- Tasks are fully controlled from the Dashboard — all state saved to SQLite

### Actions (Triggers)
- Each trigger has: label, URL, HTTP method, optional headers and body
- Fires browser `fetch()` directly — CORS-dependent
- Demo triggers pointing at `httpbin.org` included by default

### Docker
- Reads the local Docker socket first, then the Docker CLI, refreshing every 30 seconds
- If direct Docker access is unavailable, Dashy tries `sudo -n docker` (passwordless sudo only)
- Interactive sudo passwords cannot be requested from a web widget. Use the `docker` group, rootless Docker, a reachable `DOCKER_HOST`, or a narrowly scoped passwordless sudo rule for Docker.

### Training
- Set a reminder time and configure each weekday as a named workout or rest day
- The in-app reminder repeats every 15 minutes until the scheduled workout starts (optional)
- Start, pause, and end sessions; elapsed time and checkpoints survive refreshes
- Streaks count consecutive completed workout days while ignoring scheduled rest days

### Appearance
| Option | Values |
|--------|--------|
| Colors | Custom canvas, tile, ink, muted ink, and grid colors |
| Grid line style | Solid, Dashed, Dotted, Hidden |
| Grid line weight | Thin (0.5px), Normal (1px) |
| Noise overlay | On / Off (2.5% opacity, multiply blend) |

## Data Persistence

Dashy stores all dashboard state in SQLite at `~/.dashy/dashy.sqlite`, created automatically the first time `./start` or `npm run dev` starts. Set `DASHY_DATA_DIR` to place the database elsewhere. Existing `localStorage` state is imported once on upgrade and then removed from the browser.

The built-in SQLite driver requires Node.js 22.5 or newer. The data directory and database are restricted to the current user because widget configuration can contain sensitive request headers.

## License

MIT
