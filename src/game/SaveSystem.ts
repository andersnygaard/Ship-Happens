/**
 * SaveSystem — Manages save/load game state via localStorage.
 * Supports 3 manual save slots (1-3) and 1 auto-save slot (0).
 */

import {
  type FullGameState,
  serializeGameState,
  deserializeGameState,
  getPlayerSummary,
  getActivePlayer,
} from "./GameState";

/** Metadata stored alongside a save for display in the UI. */
export interface SaveMetadata {
  companyName: string;
  balance: number;
  shipCount: number;
  saveDate: string;
  weeksPlayed: number;
}

/** A full save entry: serialized game state + metadata. */
interface SaveEntry {
  gameStateJson: string;
  metadata: SaveMetadata;
}

const SAVE_KEY_PREFIX = "ship-happens-save-";
const AUTO_SAVE_SLOT = 0;
const SLOT_COUNT = 3;

/** Get the localStorage key for a given slot. */
function getSlotKey(slot: number): string {
  return `${SAVE_KEY_PREFIX}${slot}`;
}

/** Build metadata from a game state. */
function buildMetadata(gameState: FullGameState): SaveMetadata {
  const player = getActivePlayer(gameState);
  const summary = getPlayerSummary(player);
  return {
    companyName: summary.companyName,
    balance: summary.balance,
    shipCount: summary.shipCount,
    saveDate: new Date().toISOString(),
    weeksPlayed: gameState.time.week + (gameState.time.year - 1) * 52,
  };
}

/**
 * Save a game state to a specific slot.
 * @param slot — Slot number (0 = auto-save, 1-3 = manual saves).
 * @param gameState — The current full game state.
 */
export function save(slot: number, gameState: FullGameState): void {
  const entry: SaveEntry = {
    gameStateJson: serializeGameState(gameState),
    metadata: buildMetadata(gameState),
  };
  localStorage.setItem(getSlotKey(slot), JSON.stringify(entry));
}

/**
 * Load a game state from a specific slot.
 * @param slot — Slot number (0 = auto-save, 1-3 = manual saves).
 * @returns The deserialized game state, or null if slot is empty/invalid.
 */
export function load(slot: number): FullGameState | null {
  const raw = localStorage.getItem(getSlotKey(slot));
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as SaveEntry;
    return deserializeGameState(entry.gameStateJson);
  } catch (e) {
    console.error(`Failed to load save slot ${slot}:`, e);
    return null;
  }
}

/**
 * Delete a save from a specific slot.
 * @param slot — Slot number (0 = auto-save, 1-3 = manual saves).
 */
export function deleteSave(slot: number): void {
  localStorage.removeItem(getSlotKey(slot));
}

/**
 * Get metadata for a specific save slot without loading the full state.
 * @param slot — Slot number (0 = auto-save, 1-3 = manual saves).
 * @returns The save metadata, or null if slot is empty.
 */
export function getSaveMetadata(slot: number): SaveMetadata | null {
  const raw = localStorage.getItem(getSlotKey(slot));
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as SaveEntry;
    return entry.metadata;
  } catch {
    return null;
  }
}

/**
 * Auto-save the game state to slot 0.
 * @param gameState — The current full game state.
 */
export function autoSave(gameState: FullGameState): void {
  save(AUTO_SAVE_SLOT, gameState);
}

/**
 * Check if an auto-save exists.
 */
export function hasAutoSave(): boolean {
  return getSaveMetadata(AUTO_SAVE_SLOT) !== null;
}

/**
 * Load the auto-save.
 */
export function loadAutoSave(): FullGameState | null {
  return load(AUTO_SAVE_SLOT);
}

/** The number of manual save slots available. */
export const MANUAL_SLOT_COUNT = SLOT_COUNT;

/** The auto-save slot index. */
export const AUTO_SAVE_SLOT_INDEX = AUTO_SAVE_SLOT;
