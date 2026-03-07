import * as THREE from 'three';
import { type FullGameState } from './game/GameState';
import { autoSave } from './game/SaveSystem';
import { ScreenManager } from './ui/ScreenManager';
import { SetupScreen } from './ui/screens/SetupScreen';
import { WorldMapScreen } from './ui/screens/WorldMapScreen';
import { OfficeScreen } from './ui/screens/OfficeScreen';
import { ShipBrokerScreen } from './ui/screens/ShipBrokerScreen';
import { PortOperationsScreen } from './ui/screens/PortOperationsScreen';
import { TravelScreen } from './ui/screens/TravelScreen';
import { PortDepartureScreen } from './ui/screens/PortDepartureScreen';
import { ManeuveringScreen } from './ui/screens/ManeuveringScreen';
import { OceanScene } from './scene/OceanScene';
import { ShipModel } from './scene/ShipModel';
import { SkySystem } from './scene/SkySystem';
import { AudioSystem } from './audio/AudioSystem';
import { toast } from './ui/components/Toast';

// Ship Happens - Main entry point
// Sets up a Three.js scene with animated ocean, ship, and day/night cycle.

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
document.body.appendChild(renderer.domElement);

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
}

// Register all screens
screenManager.register("setup", new SetupScreen(screenManager, onGameCreated));
screenManager.register("worldmap", new WorldMapScreen(screenManager));
screenManager.register("office", new OfficeScreen(screenManager));
screenManager.register("shipbroker", new ShipBrokerScreen(screenManager));
screenManager.register("port-operations", new PortOperationsScreen(screenManager));
screenManager.register("travel", new TravelScreen(screenManager));
screenManager.register("port-departure", new PortDepartureScreen(screenManager));
screenManager.register("maneuvering", new ManeuveringScreen(screenManager));

// Auto-save when transitioning between screens (except setup)
const originalShowScreen = screenManager.showScreen.bind(screenManager);
screenManager.showScreen = (id) => {
  const state = screenManager.getGameState();
  if (state && id !== "setup") {
    autoSave(state);
  }

  // Play UI click sound on screen transitions
  const audio = AudioSystem.getInstance();
  audio.play("uiClick");

  originalShowScreen(id);
};

// Show the setup screen first
screenManager.showScreen("setup");
