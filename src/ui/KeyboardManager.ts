/**
 * KeyboardManager — Global keyboard shortcut handler with context-aware shortcuts.
 *
 * Supports both global shortcuts (active on all screens) and screen-specific
 * shortcuts (active only when a particular screen is displayed).
 * Automatically ignores keypresses when the user is typing in input fields.
 */

import type { ScreenManager, ScreenId } from "./ScreenManager";

/** Context for a shortcut: either a specific screen or "global" for all screens. */
type ShortcutContext = ScreenId | "global";

interface ShortcutEntry {
  key: string;
  context: ShortcutContext;
  callback: () => void;
  description?: string;
}

export class KeyboardManager {
  private shortcuts: ShortcutEntry[] = [];
  private screenManager: ScreenManager;
  private enabled = true;
  private boundHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(screenManager: ScreenManager) {
    this.screenManager = screenManager;
  }

  /**
   * Register a keyboard shortcut.
   * @param key — The key to listen for (case-insensitive, matched against e.key).
   * @param context — "global" for all screens, or a ScreenId for screen-specific shortcuts.
   * @param callback — Function to call when the shortcut is triggered.
   * @param description — Optional human-readable description of the shortcut.
   */
  registerShortcut(
    key: string,
    context: ShortcutContext,
    callback: () => void,
    description?: string,
  ): void {
    this.shortcuts.push({ key: key.toLowerCase(), context, callback, description });
  }

  /** Start listening for keyboard events. */
  enable(): void {
    this.enabled = true;

    if (this.boundHandler) return; // already listening

    this.boundHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener("keydown", this.boundHandler);
  }

  /** Stop listening for keyboard events. */
  disable(): void {
    this.enabled = false;

    if (this.boundHandler) {
      document.removeEventListener("keydown", this.boundHandler);
      this.boundHandler = null;
    }
  }

  /** Handle a keydown event. */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Don't trigger shortcuts when user is typing in an input field
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    // Also skip if the element is contenteditable
    if ((e.target as HTMLElement)?.isContentEditable) return;

    const pressedKey = e.key.toLowerCase();
    const activeScreen = this.screenManager.getActiveScreenId();

    // Find matching shortcuts — screen-specific shortcuts take priority over global
    let matched: ShortcutEntry | undefined;

    // First, try screen-specific match
    if (activeScreen) {
      matched = this.shortcuts.find(
        (s) => s.key === pressedKey && s.context === activeScreen,
      );
    }

    // Fall back to global match
    if (!matched) {
      matched = this.shortcuts.find(
        (s) => s.key === pressedKey && s.context === "global",
      );
    }

    if (matched) {
      e.preventDefault();
      matched.callback();
    }
  }
}
