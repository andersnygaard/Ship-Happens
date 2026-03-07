# Ship Happens - Game Design Specification

## Vision

A modern, humorous take on the classic "Ports of Call" (1986) — not a copy, but a reimagining for the web era. The game captures the spirit of the original shipping simulation while adding contemporary humor, modern world events, and a fresh visual style.

## Platform & Technology

- **Platform**: Web-based (browser)
- **Rendering**: Three.js for 3D graphics
- **Visual style**: Sprite-based aesthetics inspired by the original game, rendered in a modern 3D environment

## Core Design Principles

- **Turn-based gameplay**: The game progresses in rounds/turns, not real-time
- **Multiplayer**: The original supported up to 7 players taking turns (numbered 1-7 on the time bar)
- **Humor first**: The game should be funny — absurd situations, witty dialogue, satirical commentary
- **Modern world**: While the mechanics are inspired by the 80s original, the world reflects today

---

## Game Flow (from original analysis)

```
Game Start
  → Choose company name and player name (addressed as "shipowner [Name]")
  → Choose home port (from grid of ~30 world ports, 3 columns)
  → Receive starting capital ($4-5 million, may vary)
  → Visit Ship Broker → Buy first ship (christen with "MS [Name]", set deposit %)
  → Main game loop begins

Main Game Loop (turn-based, up to 7 players)
  → World Map view (Mercator projection with ports marked)
  → Press START ACTION to advance simulation
     → Button changes to STOP ACTION (red) while simulation runs
  → Travel phase (time passes in weeks, fuel consumed)
     → Sea voyage animation (ship on ocean with birds, waves)
     → Random events during travel (storms, emergencies, out of fuel)
  → Arrive at port → Port departure screen
     → Choose: "steer by hand" (free, manual minigame) or "use tug's help" (paid, assisted)
     → Port Maneuvering minigame (if steering by hand)
  → Port Operations menu (Captain's Orders)
  → Repeat
```

---

## Screens & Interfaces

### 1. World Map / Globe

- Mercator-projection world map with green landmasses, brown mountains, blue ocean, white polar ice
- "Ports of Call" title text in top-left corner
- Ports marked as selectable destinations (small dots on map)
- Ship icons showing current positions and routes
- Simulation clock at bottom: numbered markers 1-7 (days of week), WEEKS counter, YRS counter
- Player number indicators (1-7) for multiplayer — active player highlighted
- Right sidebar with three large icon buttons stacked vertically:
  - **GLOBE** — globe wireframe icon, return to world map
  - **OFFICE** — building/ship icon, company management
  - **SHIP BROKER** — cargo vessel icon, buy/sell ships
- **START ACTION** button (bottom-left, neutral color) to advance simulation
  - Changes to **STOP ACTION** (red, stop-sign style) while simulation is running
- Event/message dialogs overlay the map when triggered (white dialog box with decorative border)

### 2. Office (Company Management)

- First-person perspective of captain's office interior:
  - Large wooden executive desk with laptop/computer and papers
  - World map painting on back wall (mirrors the navigation map)
  - Potted plant, wall clock, skylights
  - Gray/beige walls with darker lower paneling
- Top status bar: company name, ship count, total capital (Million$)
- Four action buttons at bottom:
  - **OK** — confirm/exit
  - **Info** — company information
  - **Action** — take actions
  - **Status** — view ship/company status (labeled "Status 1" suggesting per-ship status)
- News/messages system:
  - Office neglect penalty: "You have neglected your office and someone took a dip into the till. Amount missing: $503,000"
  - Event notifications addressed personally ("To shipowner [Name]:")
  - Financial reports

### 3. Ship Broker

- **Entry screen**: Pixel-art illustration of broker office entrance
  - Brick building with large dark wooden double doors (open)
  - Red carpet leading to an elevator with indicator lights (5 dots)
  - Sign above elevator: "KLEIN & ULRICH LTD. SHIPBROKERS" (developer Easter egg — Rolf-Dieter Klein & Martin Ulrich)
  - Fluorescent ceiling lights in lobby
- **Ship browsing**: 2-3 ships visible per page, stacked vertically (largest/most expensive at top)
  - Ship illustration (side-view profile, visually distinct per type/size)
  - Price label ("Million$: X.X")
  - **BUY** and **INFO** buttons per ship
  - **Elevator** button at bottom-left for scrolling through inventory
- **Ship purchase/christening flow**:
  - Select ship → "Welcome shipowner" message
  - Christen the ship: "MS [player-entered name]"
  - Set deposit percentage (default shown, player can adjust)
  - "100% deposit to your debit. Mortgage: 0%. Do you want to deposit more? How much: __ %"
  - OK to confirm
- **Insufficient funds**: Sarcastic rejection dialog: "Do us a favor, will you? Try to get some cash before you try to buy something next time!"

### 4. Ship Specification Sheet

When clicking INFO on a ship, a detail screen shows:
- **Upper half**: Large detailed side-view ship illustration on black background
- **Lower half**: Specifications text panel with stats

| Stat | Format | Example | Description |
|------|--------|---------|-------------|
| Ship type | Text | RORO/LOLO | Roll-On/Roll-Off, Lift-On/Lift-Off designation |
| Capacity | Number + BRT | 40,000 BRT | Brutto Register Tonnen (Gross Register Tonnage) |
| Price | Million$: X.X | Million$: 46.4 | Purchase price in millions |
| Engine power | Number + hp | 40,000 hp | Horsepower |
| Length | l=Xm | l=250m | Ship length in meters |
| Beam | b=Xm | b=32m | Ship width in meters |
| Deposit | X% | 40% | Minimum down payment (varies per ship) |
| Max speed | vmax = Xkn | vmax = 23kn | Top speed in knots |
| Fuel at max speed | Xt/day | 134t/day | Daily fuel consumption at max speed |
| Bunker capacity | Xt | 6,000t | Maximum fuel tank in tonnes |
| Daily operating costs | $X.- | $12,000.- | Crew, maintenance per day |

Ship price range observed: $1.0M to $60.0M+ across different vessel types and sizes.

### 5. Port Operations (Captain's Orders)

Upon arriving at a port, the player sees a four-quadrant layout on a riveted metallic/industrial background:

**Top-left — Ship status panel (clipboard/paper style):**
- Company name
- Ship name
- Origin port ("From: Karachi")
- Current cargo type (e.g. "Agric. Produce")
- Voyage result/profit (e.g. "Result: $156,794")
- Bank balance (e.g. "$1.6 million")
- Ship condition (e.g. "77%")
- Fuel level (e.g. "10091t")

**Top-right — Port view (porthole frame):**
- Circular/octagonal porthole window with metallic riveted frame
- Unique painted skyline/harbor illustration for each port
- Port name and country (e.g. "London, United Kingdom")
- Time of day varies per port (London shown at night, New York daytime)

**Bottom-right — Port information (dark panel, yellow text):**
- Population (national, e.g. "Pop. 56.518.000" for UK)
- Language(s) (e.g. "English")
- Number of ships (e.g. "2,068 Ships")
- Total cargo capacity (e.g. "24.140.368 tdw")
- Available cargo types (e.g. "Machinery", "Equipm.", "Machines agricoles")

**Bottom-left — Captain's Orders menu (clipboard style):**
- **REPAIR** — restore ship condition
- **REFUEL** — fill fuel tanks
- **CHARTER** — browse and accept freight contracts
- **LAY UP** — put ship in storage
- **LOAD** — load accepted cargo

### 5b. Port Departure Screen

When leaving port, before the maneuvering minigame:
- Side-view illustration of the ship at dock
- Ship name and captain displayed in title bar ("MS Water-test, captain Moby")
- Three action buttons:
  - **"cast off!"** — leave port
  - **"steer by hand"** — manual harbor maneuvering (free)
  - **"use tug's help"** — assisted docking/undocking (costs money, easier)

### 6. Repair Interface

- **Left side**: Dramatic front/bow-view illustration of ship in dry dock, propped on supports in enclosed dock facility
- **Right side**: Info/input panel (dark background, white text):
  - "Your ship has docked."
  - Current condition: "State: 59%"
  - Cost per percentage point: "Costs: $27,290 per %" (varies by port — also seen $31,770 per %)
  - Maximum repair cost: "Maximum: $1,118,890" (pre-calculated for full repair)
  - Text input field: "Repair how many percent? [41] %"
- **OK** and **cancel** buttons at bottom center
- Cost is linear: total = percentage points × cost per point (math verified across screenshots)

### 7. Charter / Freight Contract Screen

**Two-column selection layout:**
- **Left column — Destination list**: Vertical list of port names on colored bars
  - Blue = unselected, Red = currently selected
  - Some entries in lighter purple/blue = possibly unavailable
- **Right column — Cargo type list**: Vertical list of cargo types
  - Same color coding (blue/red/purple)
  - **Ballast** always available (empty repositioning voyage, no revenue)

**Contract details panel (bottom-left, white on blue with orange border):**
| Field | Label | Example |
|-------|-------|---------|
| Rate | Rate | $2,446,034 |
| Delivery deadline | Del. | 42 days |
| Penalty | Pen. | $271,781 |
| Distance | Dist | 11,885 nm |

**OK** and **cancel** buttons at bottom corners.

- Penalty is roughly 11% of rate ($271,781 / $2,446,034)
- Payment correlates with distance (shorter routes pay less: e.g. 6,808nm → $1,860,822)
- Not all destination/cargo combinations are available — some entries grayed out
- Different ports offer different charter options (cargo types vary by port)

### 8. Port Maneuvering Minigame

- Top-down bird's-eye view of harbor and surrounding coastline
- Ship sprite (white or red/brown) that player must steer into a **green outlined rectangle** (target docking berth)
- Mouse-based steering controls

**HUD elements:**
- **Hourglass timer** (red-bordered panel with "TIME" label): Sand visually flows from top to bottom — real-time animated countdown
- **Speed/throttle gauge** (far right): Green vertical bar chart with black bar indicators — possibly dual indicators for speed/rudder or port/starboard engine. White arrow at top may show heading/rudder position
- **Damage/health bar** (top-center, visible in some ports): Horizontal bar with red fill — collisions during maneuvering cause ship damage
- **Speed dots** (bottom edge): Row of ~10 small circles indicating thrust level
- **Port name** displayed in top-right corner

**Harbor environments per port:**
- **Rio de Janeiro**: Tropical setting with palm trees, parks, narrow channels, cranes, warehouses, trucks on roads
- **Rotterdam**: Large open basin (reflects real-world largest European port), lock/canal structures, storage tanks, container areas
- **Hamburg**: Open layout with central pier, industrial structures, cranes, bollards, mooring equipment
- **Marseille**: Industrial silos/storage tanks, relatively open waterway, dock infrastructure
- **Lagos**: Narrow parallel channels (hardest layout), warehouses, cranes — requires precise control
- **Karachi**: Storage tanks, warehouses, cranes, long piers, tight harbor entrance
- **Polar/Arctic routes**: Icebergs replace islands as obstacles (3D faceted crystal style, significantly larger than green islands)
- **Island routes**: Green irregular island shapes scattered as obstacles across open water

Each port has unique geometry, difficulty level, and visual character (tropical vegetation, industrial structures, etc.)

### 9. Random Events During Travel

**Weather events:**
- Full-screen stormy seascape illustration (dark blues/grays, ominous atmosphere)
- Title bar shows "MS [Ship Name], captain [Captain Name]"
- Alert dialog: "Attention! There's hard weather ahead! Beaufort 9, storm."
- Beaufort scale used for severity (Beaufort 9 = storm, 75-88 km/h winds)
- Player choice (two buttons):
  - **"pass through"** — risk damage, save time
  - **"round"** — safe detour, costs extra time ("time to round: 10 days")

**Emergency events:**
- Visual: Person in yellow life raft waving on open ocean
- Dialog: "There seems to be an emergency." with ship name and captain in title bar
- OK button to acknowledge — presumably leads to rescue decision

**Out of fuel event:**
- Narrative text addressed to player: "To shipowner [Name]. Your ship's out of fuel. A most friendly captain has hauled in your tow rope. He tugs you to your destination for a bargain 1 Million $."
- Towing cost: $1,000,000 (20% of starting capital — severe penalty)

**Financial events:**
- Office neglect/embezzlement: "To shipowner [Name]: You have neglected your office and someone took a dip into the till. Amount missing: $503,000"
- Encourages regular office visits

**Sea voyage animation:**
- Between events, a sailing scene is shown: ship on ocean with stylized waves, birds flying overhead, hazy sky
- Atmospheric pixel art conveying the vastness of ocean travel

### 10. Port Skyline Gallery

- Asset sheet with ~36 unique city skyline illustrations arranged in 3-column grid
- All skylines viewed from the water (player arriving by ship perspective)
- Time of day varies: most daytime, London at night, some at sunset/dusk
- High-quality Amiga-era pixel art with good color depth
- Distinctive landmarks visible:
  - Sydney: Opera House & Harbour Bridge
  - New York: Manhattan skyline with skyscrapers, sailboat in harbor
  - London: Big Ben & Houses of Parliament illuminated at night, reflected in Thames
  - San Francisco: Golden Gate Bridge
  - Hong Kong: Harbor skyline with junk boat
  - Tokyo/Yokohama: Mount Fuji with cityscape
  - Hamburg: Church spires, European waterfront
  - New York: Skyscrapers, waterfront
  - Various: Domes/minarets (Middle Eastern/Indian ports), Mediterranean hillside cities, tropical ports, snow-capped mountain ports

---

## Core Game Systems

### Financial System

| Mechanic | Details |
|----------|---------|
| Starting capital | $4-5 million (may vary or be configurable) |
| Currency | US Dollars, displayed as "Million$: X.X" with decimal |
| Ship prices | $1.0-60.0+ million range (small freighters to large RORO/LOLO) |
| Ship deposits | Percentage-based, varies per ship (e.g. 40%). Lower deposit = mortgage with ongoing payments |
| Mortgage system | "100% deposit to your debit. Mortgage: 0%." — player chooses deposit amount, rest is mortgaged |
| Repair costs | Per percentage point, varies by port ($27,290 - $31,770 per % observed) |
| Freight revenue | Contract-based, $1.8-2.4+ million per delivery (correlates with distance) |
| Late penalties | Fixed amount per contract (~11% of rate) |
| Daily operating costs | Per ship, per day (e.g. $12,000/day for large vessels) |
| Fuel costs | Per ton purchased |
| Towing penalty | $1,000,000 if ship runs out of fuel at sea |
| Embezzlement | Random event for office neglect, $503,000 stolen |
| Voyage profit | Tracked per delivery ("Result: $156,794") |

### Ship Management

| Stat | Range | Unit |
|------|-------|------|
| Ship name | "MS [Name]" | Player-chosen at purchase, prefixed with MS (Motor Ship) |
| Captain | Named per ship | Individual identity (e.g. "captain Moby") |
| Condition | 0-100% | Percentage, degrades over time/voyages |
| Fuel level | 0 to bunker capacity | Tons (t) |
| Cargo capacity | Varies by ship | BRT (Brutto Register Tonnen) / tdw |
| Speed | Varies by ship | Knots (kn), shown as "vmax = Xkn" |
| Fuel consumption | At max speed | Tons/day (e.g. 134t/day for 6000t bunker = ~44.7 days range) |
| Engine power | Varies | Horsepower (hp) |
| Dimensions | Length × Beam | Meters (e.g. l=250m, b=32m) |
| Ship type | Category | e.g. RORO/LOLO (Roll-On/Roll-Off, Lift-On/Lift-Off) |

### Time System

- Simulation clock with numbered markers 1-7 (days of week) and counters for WEEKS and YRS
- Player presses START ACTION to advance time; button becomes STOP ACTION while running
- Year counter tracking game progression (observed: "41 WEEKS, 2 YRS")
- Delivery deadlines measured in days (e.g. "Del. 42 days")
- Travel time based on distance and speed (e.g. 11,885nm at 23kn max)
- Weather detours add extra days (e.g. "time to round: 10 days")
- Time is the original game's 1986 Cold War era setting (ports show "West Germany")

### Cargo Types (from original)

- Agricultural Produce
- Chemicals
- Electronics
- Machinery
- Equipment
- Metalware
- Plastics Products
- Textiles
- Ballast (empty/no cargo)

### Ports (from original, ~30 total)

Full port list from home port selection screen (3-column grid):

| Column 1 | Column 2 | Column 3 |
|-----------|----------|----------|
| Alexandria | Jebel Dhanna | Point Hope |
| Basrah | Karachi | Rio de Janeiro |
| Buenos Aires | Lagos | Rotterdam |
| Calcutta | Lima | San Francisco |
| Cape Town | London | Singapore |
| Dar-es-Salaam | Marseilles | Sydney |
| Hamburg | Monrovia | Tokyo |
| Hong Kong | New York | Vancouver |
| Houston | Panama | |
| | Pearl Harbor | |
| | Piraeus | |

**Port attributes:**
- Unique skyline illustration (viewed from water, through porthole frame)
- Unique harbor layout (for maneuvering minigame, varying difficulty)
- Country name (e.g. "West Germany", "U.S.A.", "United Kingdom", "France")
- Population (national, not city — e.g. UK: 56,518,000; USA: 238,749,000; W.Germany: 60,940,000)
- Language(s) (e.g. English, German, French)
- Number of ships (e.g. London: 2,068; New York: 6,441; Hamburg: 1,813)
- Cargo capacity in tdw (e.g. London: 24,140,368; New York: 29,139,826; Hamburg: 9,519,256)
- Available cargo types (e.g. "Machinery", "Equipm.", "Machines agricoles")
- Repair cost rate (varies by port)
- Larger ports (more ships/tdw) likely offer more charter opportunities

---

## Modern Elements (Ship Happens additions)

### World Events & Situations
- War zones and conflict areas affecting shipping routes and risk
- Sanctions and trade embargoes blocking certain ports
- Piracy hotspots (Gulf of Aden, Strait of Malacca)
- Canal blockages (Suez, Panama)
- Climate events affecting routes (Arctic ice melt opening new routes)

### Political Satire
- Satirical portrayals of world leaders and their impact on trade
- Incompetent politicians creating absurd trade policies
- Trump-style tariff chaos, erratic sanctions, tweet-driven market swings
- Other world leaders with their own comedic quirks affecting gameplay
- UN resolutions that make no practical sense
- Brexit-style trade complications

### Humor Examples
- Ridiculous cargo descriptions ("500 tons of artisanal beard oil to Brooklyn")
- Absurd port events ("The mayor has declared war on seagulls — port closed")
- Ship names generated with puns
- News ticker with satirical headlines
- Crew complaints and mutiny threats over WiFi quality
- NPC dialogues with personality ("Try to get some cash before you try to buy something next time!")

---

## Visual Style (Original Game Reference)

The original game used high-quality Amiga-era 16-bit pixel art with realistic perspective:

- **UI theme**: Riveted metallic/industrial steel texture (copper/brown tone) — nautical ship-bridge aesthetic
- **Porthole framing**: City skylines viewed through circular/octagonal porthole with riveted frame
- **Clipboard metaphor**: Captain's orders displayed on a paper clipboard pinned to a board
- **Office interior**: First-person perspective, wooden desk, world map, potted plant, laptop, realistic lighting
- **Ship broker**: Brick building entrance with elevator, red carpet, "KLEIN & ULRICH LTD." sign
- **Ship illustrations**: Detailed side-view profiles for broker, front/bow view for dry dock repair
- **Port skylines**: ~36 unique painted cityscapes, all viewed from water, with recognizable landmarks
- **Harbor minigame**: Top-down pixel art with detailed infrastructure (cranes, tanks, trees, trucks, bollards)
- **Sea scenes**: Atmospheric seascapes — stormy for weather events, calm for voyage animations
- **Color coding**: Blue for unselected UI elements, red for selected/active, yellow for info text

## Visual Style (Ship Happens — Modern)

- Sprite-based characters and objects, reminiscent of the original pixel art
- Three.js 3D world with 2D sprite overlays
- Retro-modern aesthetic: pixel art meets modern rendering
- Animated water, weather effects, day/night cycle
- Unique port skylines with recognizable landmarks
- Ship profile illustrations for broker/info screens
- Indoor scenes for office and broker (desk, brick walls, carpet)

### Asset Generation

- **Sprite generation**: DALL-E 3 (OpenAI) for generating game sprites and visual assets
- API key provided by user at runtime (not stored in code or config)
- Prompt engineering to maintain consistent pixel art style across all generated assets

## Original Game Localization

The original game was localized into multiple languages (English, French, German observed in screenshots). UI labels, port descriptions, and cargo types were translated. German number formatting uses periods as thousand separators (e.g. "60.940.000").

## Reference Material

Original game screenshots available in `.docs/screenshots/` (image01–image41).

### Screenshot Index

| Image | Content |
|-------|---------|
| image01 | Port maneuvering — Rio de Janeiro |
| image02 | World map / main navigation (41 weeks, 2 years) |
| image03 | Title screen — "PORTS OF CALL" by Klein & Ulrich |
| image04 | Port arrival — London (Company: Froholt, Ship: Titanic II) |
| image05 | Port maneuvering — Rotterdam |
| image06 | Port arrival — New York (Company: KK, Ship: TH1) |
| image07 | Random event — office embezzlement ($503,000) |
| image08 | Office / company HQ screen |
| image09 | Port skyline gallery (~36 cities, sprite sheet) |
| image10 | Random event — sea rescue emergency |
| image11 | Ship purchase / christening screen |
| image12 | World map / main navigation (0 weeks, 0 years) |
| image13 | Ship broker — browsing ships ($1.0M, $2.0M) |
| image14 | Ship repair — dry dock (State: 59%, $31,770/%) |
| image15 | Insufficient funds dialog (sarcastic rejection) |
| image16 | Ship purchase — christening and deposit |
| image17 | Ship broker — expensive ships ($12M, $35M, $60M) |
| image18 | Ship info — RORO/LOLO specifications |
| image19 | Ship broker — affordable ships ($3.8M, $4.7M) |
| image20 | Port maneuvering — island/coastal navigation |
| image21 | Port maneuvering — iceberg navigation (polar route) |
| image22 | Sea voyage animation — ship on ocean |
| image23 | Ship info — RORO/LOLO detail (duplicate data of image18) |
| image24 | Charter screen — Karachi, Plastics ($2,446,034) |
| image25 | Charter screen — Cape Town, Chemicals ($1,860,822) |
| image26 | Home port selection — 30 port grid |
| image27 | Random event — out of fuel, towing ($1,000,000) |
| image28 | Port departure — insufficient funds + steer options |
| image29 | Port arrival — Marseille (French localization) |
| image30 | Port maneuvering — Marseilles |
| image31 | Port maneuvering — Rio de Janeiro |
| image32 | Port maneuvering — Hamburg |
| image33 | Port maneuvering — Rotterdam |
| image34 | Port maneuvering — Lagos (narrow channels, damage bar) |
| image35 | Port maneuvering — Rotterdam (duplicate of image33) |
| image36 | Port arrival — Hamburg, West Germany |
| image37 | Port arrival — New York, U.S.A. |
| image38 | Ship broker — entrance/lobby with elevator |
| image39 | Ship repair — dry dock (State: 59%, $27,290/%) |
| image40 | Random event — storm (Beaufort 9, pass through/round) |
| image41 | Port maneuvering — Karachi (storage tanks, cranes) |
