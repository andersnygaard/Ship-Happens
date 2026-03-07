# Ship Happens

A modern web-based reimagining of "Ports of Call" (1986) — the classic shipping simulation game.

## Features

- **World Map** — Interactive canvas map with 30 real-world ports, pan/zoom, and click-to-select navigation
- **Ship Broker** — Browse and purchase from 10 ship classes ($1M coastal traders to $60M supertankers), with detailed specs
- **Ship Selling & Fleet Management** — Sell ships, manage a multi-vessel fleet
- **Office Screen** — Company dashboard with fleet overview, financial ledger, and bank balance
- **Port Operations** — Repair, refuel, charter freight contracts, lay up ships, and load cargo
- **Charter System** — Accept freight contracts between ports with varying cargo types and payouts
- **Port Maneuvering Minigame** — Steer your ship into harbor under time pressure with multiple harbor layouts
- **3D Ocean Scene** — Three.js rendered ocean with animated waves and ship model
- **Sea Voyage Animation** — Animated travel sequences between ports with route visualization
- **Ship Routes on Map** — Visual route lines between ports on the world map
- **Travel Events** — Random encounters and events during sea voyages
- **Economy & Game Balance** — Bank account, freight costs, fuel expenses, maintenance, and operating costs
- **Simulation Time** — Week and year progression driving the game forward
- **Multiplayer (Hot-Seat)** — Turn-based multiplayer on the same device
- **Save/Load System** — Persist and restore game state via local storage
- **Port Skyline Visuals** — Unique visual skylines for each port
- **Sound Effects** — Procedural audio via Web Audio API (ocean ambiance, UI sounds, engine sounds)
- **News Ticker** — Scrolling maritime news with humorous headlines
- **Tutorial & Help System** — In-game guide and help panel (press H)
- **Statistics & Leaderboard** — Track company performance metrics
- **Keyboard Shortcuts** — Full keyboard navigation for efficient play
- **Loading Screen & Transitions** — Smooth screen transitions with animated loading
- **Responsive Design** — Playable on desktop, tablet, and mobile
- **Game Over** — Win/lose conditions based on company performance

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How to Play

1. **Create your company** — Enter a company name, choose a starting port, and begin with seed capital.
2. **Buy a ship** — Visit the Ship Broker to purchase your first vessel.
3. **Accept contracts** — At port, use Charter to pick up freight contracts for delivery between ports.
4. **Load and sail** — Load cargo, then set sail for your destination via the world map.
5. **Maneuver into port** — When you arrive, steer your ship into the harbor in the maneuvering minigame.
6. **Manage your company** — Use the Office to monitor finances, repair ships, refuel, and grow your fleet.
7. **Expand** — Buy more ships, take on more contracts, and build a shipping empire.

## Tech Stack

- TypeScript
- Three.js (3D ocean/ship rendering)
- Vite (build tool)
- Vanilla DOM (UI — no frameworks)
- Web Audio API (procedural sounds)

## Controls

### Global
| Key | Action |
|-----|--------|
| `H` | Toggle help panel |
| `M` | Toggle mute |
| `Escape` | Close dialog / navigate back |

### World Map
| Key | Action |
|-----|--------|
| `S` | Start/stop voyage |
| `B` | Open Ship Broker |
| `O` | Open Office |

### Port Operations
| Key | Action |
|-----|--------|
| `1` | Repair |
| `2` | Refuel |
| `3` | Charter |
| `4` | Lay Up |
| `5` | Load |

### Maneuvering Minigame
| Key | Action |
|-----|--------|
| Arrow keys | Steer ship |
| Mouse | Click to set target heading |

## Building for Production

```bash
npm run build
```

Output is written to the `dist/` directory.

## Credits

Inspired by "Ports of Call" (1986) by Rolf-Dieter Klein & Martin Ulrich.
