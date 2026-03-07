import * as THREE from 'three';
import { type FullGameState } from './game/GameState';
import { autoSave } from './game/SaveSystem';
import { ScreenManager, type GameScreen } from './ui/ScreenManager';
import { SetupScreen } from './ui/screens/SetupScreen';
import { WorldMapScreen } from './ui/screens/WorldMapScreen';
import { OfficeScreen } from './ui/screens/OfficeScreen';
import { ShipBrokerScreen } from './ui/screens/ShipBrokerScreen';
import { PortOperationsScreen } from './ui/screens/PortOperationsScreen';
import { TravelScreen } from './ui/screens/TravelScreen';
import { PortDepartureScreen } from './ui/screens/PortDepartureScreen';
import { ManeuveringScreen } from './ui/screens/ManeuveringScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { checkBankruptcy, checkOfficeNeglect, recordOfficeVisit } from './game/GameState';
import { OceanScene } from './scene/OceanScene';
import { ShipModel } from './scene/ShipModel';
import { SkySystem } from './scene/SkySystem';
import { AudioSystem } from './audio/AudioSystem';
import { toast } from './ui/components/Toast';
import { tutorialSystem } from './game/TutorialSystem';
import { TravelSceneController } from './scene/TravelSceneController';
import { KeyboardManager } from './ui/KeyboardManager';
import { helpPanel } from './ui/components/HelpPanel';

// Ship Happens - Main entry point
// Sets up a Three.js scene with animated ocean, ship, and day/night cycle.

// ─── Global Error Handler ─────────────────────────────────────────────────

window.addEventListener("error", (event) => {
  console.error("[Ship Happens] Uncaught error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[Ship Happens] Unhandled promise rejection:", event.reason);
});

// ─── Three.js Scene ────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Insert the canvas BEFORE the ui-overlay so it's behind it in DOM order.
// Also set explicit positioning and z-index to ensure the canvas stays behind
// the UI overlay regardless of DOM order.
const canvasEl = renderer.domElement;
canvasEl.style.position = "fixed";
canvasEl.style.top = "0";
canvasEl.style.left = "0";
canvasEl.style.zIndex = "1";

const uiOverlay = document.getElementById("ui-overlay");
if (uiOverlay) {
  document.body.insertBefore(canvasEl, uiOverlay);
} else {
  document.body.appendChild(canvasEl);
}

// ─── Animated Ocean ────────────────────────────────────────────────────────

const ocean = new OceanScene();
scene.add(ocean.mesh);

// ─── Ship Model ────────────────────────────────────────────────────────────

const ship = new ShipModel();
scene.add(ship.group);

// ─── Lighting ──────────────────────────────────────────────────────────────

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// ─── Sky / Day-Night Cycle ─────────────────────────────────────────────────

const skySystem = new SkySystem(scene, directionalLight, ambientLight);

/**
 * Set the time of day from game logic.
 * @param t — 0-1 value (0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk)
 */
export function setTimeOfDay(t: number): void {
  skySystem.setTimeOfDay(t);
}

// ─── Travel Scene Controller ──────────────────────────────────────────────

const travelSceneController = new TravelSceneController(ocean, ship, skySystem);

/**
 * Get the travel scene controller for use by TravelScreen.
 */
export function getTravelSceneController(): TravelSceneController {
  return travelSceneController;
}

// ─── Clock & Animation Loop ───────────────────────────────────────────────

const clock = new THREE.Clock();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Update animated ocean waves
  ocean.update(elapsed);

  // Make ship bob on waves
  ship.update(ocean, elapsed);

  // Advance day/night cycle (slow auto-advance)
  skySystem.update(delta);

  // Update travel animation (ship forward movement) when active
  travelSceneController.update(delta);

  renderer.render(scene, camera);
}

animate();

// ─── UI Screen System ──────────────────────────────────────────────────────

const screenManager = new ScreenManager();

// Callback when a new game is created from the setup screen
function onGameCreated(state: FullGameState): void {
  toast.show(
    `Game started with ${state.players.length} player(s)!`,
    "success",
  );
  // Reset tutorial for new game so first-time hints appear
  tutorialSystem.reset();
}

// Register all screens with error handling so one broken screen doesn't prevent others
const screenRegistrations: [string, () => GameScreen][] = [
  ["setup", () => new SetupScreen(screenManager, onGameCreated)],
  ["worldmap", () => new WorldMapScreen(screenManager)],
  ["office", () => new OfficeScreen(screenManager)],
  ["shipbroker", () => new ShipBrokerScreen(screenManager)],
  ["port-operations", () => new PortOperationsScreen(screenManager)],
  ["travel", () => new TravelScreen(screenManager)],
  ["port-departure", () => new PortDepartureScreen(screenManager)],
  ["maneuvering", () => new ManeuveringScreen(screenManager)],
  ["gameover", () => new GameOverScreen(screenManager)],
];

for (const [id, factory] of screenRegistrations) {
  try {
    screenManager.register(id as import('./ui/ScreenManager').ScreenId, factory());
  } catch (err) {
    console.error(`[Ship Happens] Failed to register screen "${id}":`, err);
  }
}

// Auto-save when transitioning between screens (except setup)
const originalShowScreen = screenManager.showScreen.bind(screenManager);
screenManager.showScreen = (id) => {
  const state = screenManager.getGameState();
  if (state && id !== "setup" && id !== "gameover") {
    autoSave(state);

    // Record office visit when navigating to the office screen
    if (id === "office") {
      recordOfficeVisit(state);
    }

    // Check for office neglect when navigating away from non-office screens
    if (id === "worldmap") {
      const neglectResult = checkOfficeNeglect(state);
      if (neglectResult && neglectResult.triggered) {
        toast.show(neglectResult.message, "error");
      }
    }

    // Update tutorial progress based on current game state
    tutorialSystem.checkAutoComplete(state);

    // Check for bankruptcy after any screen transition (except setup/gameover)
    if (checkBankruptcy(state)) {
      // Play UI click sound before redirecting to game over
      const audio = AudioSystem.getInstance();
      audio.play("uiClick");
      originalShowScreen("gameover");
      return;
    }
  }

  // Play UI click sound on screen transitions
  const audio = AudioSystem.getInstance();
  audio.play("uiClick");

  originalShowScreen(id);
};

// ─── Keyboard Shortcuts ──────────────────────────────────────────────────

const keyboardManager = new KeyboardManager(screenManager);

// Global: Escape — close dialog/modal or navigate back to world map
keyboardManager.registerShortcut("Escape", "global", () => {
  // Try to close any open dialog overlay first
  const overlay = document.querySelector(".ship-info-overlay");
  if (overlay) {
    overlay.remove();
    return;
  }

  // Close help panel if open
  if (helpPanel.getIsOpen()) {
    helpPanel.close();
    return;
  }

  // Navigate back to world map if on a sub-screen
  const active = screenManager.getActiveScreenId();
  if (active && active !== "worldmap" && active !== "setup" && active !== "gameover") {
    screenManager.showScreen("worldmap");
  }
});

// Global: H — toggle help panel
keyboardManager.registerShortcut("h", "global", () => {
  helpPanel.toggle();
});

// Global: M — toggle mute
keyboardManager.registerShortcut("m", "global", () => {
  const audio = AudioSystem.getInstance();
  const muted = audio.toggleMute();
  // Restart ocean ambiance if unmuted
  if (!muted) {
    audio.startOceanAmbiance();
  }
  // Update the mute button icon if visible
  const muteBtn = document.querySelector(".mute-btn") as HTMLButtonElement | null;
  if (muteBtn) {
    muteBtn.title = muted ? "Unmute" : "Mute";
    muteBtn.innerHTML = muted
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>`;
  }
  toast.show(muted ? "Audio muted" : "Audio unmuted", "info");
});

// World map: S — start/stop action
keyboardManager.registerShortcut("s", "worldmap", () => {
  const worldMap = screenManager.getScreen("worldmap") as WorldMapScreen | undefined;
  if (worldMap) {
    // Simulate clicking the start/stop action button
    const actionBtn = document.querySelector(".action-btn") as HTMLButtonElement | null;
    if (actionBtn) {
      actionBtn.click();
    }
  }
});

// World map: B — go to ship broker
keyboardManager.registerShortcut("b", "worldmap", () => {
  screenManager.showScreen("shipbroker");
});

// World map: O — go to office
keyboardManager.registerShortcut("o", "worldmap", () => {
  screenManager.showScreen("office");
});

// Port operations: 1-5 for quick actions (Repair, Refuel, Charter, Lay Up, Load)
for (let i = 1; i <= 5; i++) {
  keyboardManager.registerShortcut(String(i), "port-operations", () => {
    const buttons = document.querySelectorAll(".port-ops-order-btn") as NodeListOf<HTMLButtonElement>;
    const btn = buttons[i - 1];
    if (btn && !btn.disabled) {
      btn.click();
    }
  });
}

keyboardManager.enable();

// Remove the loading screen and show the setup screen.
// The setup screen is shown first so it's ready behind the loading overlay,
// then the loading screen fades out to reveal it.
try {
  screenManager.showScreen("setup");
  console.log("[Ship Happens] Setup screen shown successfully");
} catch (err) {
  console.error("[Ship Happens] Failed to show setup screen:", err);
}

const loadingScreen = document.getElementById("loading-screen");
if (loadingScreen) {
  loadingScreen.classList.add("fade-out");

  let loadingRemoved = false;
  const removeLoading = (): void => {
    if (loadingRemoved) return;
    loadingRemoved = true;
    loadingScreen.remove();
    console.log("[Ship Happens] Loading screen removed");
  };

  loadingScreen.addEventListener("animationend", removeLoading);
  // Fallback: remove loading screen after 1s even if animationend doesn't fire
  setTimeout(removeLoading, 1000);
} else {
  console.warn("[Ship Happens] Loading screen element not found");
}

// Final safety check: ensure the loading screen is always removed
setTimeout(() => {
  const fallbackLoading = document.getElementById("loading-screen");
  if (fallbackLoading) {
    console.warn("[Ship Happens] Forcing loading screen removal (safety fallback)");
    fallbackLoading.remove();
  }
}, 3000);
