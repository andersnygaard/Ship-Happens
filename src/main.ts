import * as THREE from 'three';
import { type FullGameState } from './game/GameState';
import { ScreenManager } from './ui/ScreenManager';
import { SetupScreen } from './ui/screens/SetupScreen';
import { WorldMapScreen } from './ui/screens/WorldMapScreen';
import { OfficeScreen } from './ui/screens/OfficeScreen';
import { ShipBrokerScreen } from './ui/screens/ShipBrokerScreen';
import { PortOperationsScreen } from './ui/screens/PortOperationsScreen';
import { TravelScreen } from './ui/screens/TravelScreen';
import { PortDepartureScreen } from './ui/screens/PortDepartureScreen';
import { ManeuveringScreen } from './ui/screens/ManeuveringScreen';

// Ship Happens - Main entry point
// Sets up a basic Three.js scene and initializes the UI screen system.

// ─── Three.js Scene ────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a3a5c); // Deep ocean blue

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

// Add a simple water plane to give the scene some visual content
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0x2a6496,
  side: THREE.DoubleSide,
});
const waterPlane = new THREE.Mesh(planeGeometry, planeMaterial);
waterPlane.rotation.x = -Math.PI / 2;
scene.add(waterPlane);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Add directional light (sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

// ─── UI Screen System ──────────────────────────────────────────────────────

const screenManager = new ScreenManager();

// Callback when a new game is created from the setup screen
function onGameCreated(state: FullGameState): void {
  console.log(
    "Game started!",
    `Player: ${state.players[0].name}`,
    `Company: ${state.players[0].companyName}`,
    `Home port: ${state.players[0].homePortId}`,
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

// Show the setup screen first
screenManager.showScreen("setup");
