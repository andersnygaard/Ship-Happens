/**
 * SaveLoadDialog — Modal dialog for saving and loading games.
 * Shows 3 save slots with metadata, supports save mode (with overwrite confirmation)
 * and load mode.
 */

import type { FullGameState } from "../../game/GameState";
import {
  save,
  load,
  deleteSave,
  getSaveMetadata,
  MANUAL_SLOT_COUNT,
  type SaveMetadata,
} from "../../game/SaveSystem";

export type SaveLoadMode = "save" | "load";

export interface SaveLoadDialogCallbacks {
  /** Called when a game state is loaded from a slot. */
  onLoad: (state: FullGameState) => void;
  /** Called when the dialog is closed. */
  onClose: () => void;
}

/**
 * Create and show the save/load dialog as a modal overlay.
 * @param mode — "save" or "load"
 * @param gameState — The current game state (used for saving; may be null in load-only mode)
 * @param callbacks — Callbacks for load and close actions
 * @returns The overlay element (appended to document.body)
 */
export function createSaveLoadDialog(
  mode: SaveLoadMode,
  gameState: FullGameState | null,
  callbacks: SaveLoadDialogCallbacks,
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "save-load-dialog panel panel-riveted";

  // Title
  const title = document.createElement("h3");
  title.className = "save-load-title heading-copper";
  title.textContent = mode === "save" ? "Save Game" : "Load Game";
  dialog.appendChild(title);

  // Slots container
  const slotsContainer = document.createElement("div");
  slotsContainer.className = "save-load-slots";

  for (let slot = 1; slot <= MANUAL_SLOT_COUNT; slot++) {
    slotsContainer.appendChild(
      buildSlotElement(slot, mode, gameState, callbacks, overlay),
    );
  }

  dialog.appendChild(slotsContainer);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary save-load-close-btn";
  closeBtn.textContent = "Cancel";
  closeBtn.addEventListener("click", () => {
    overlay.remove();
    callbacks.onClose();
  });
  dialog.appendChild(closeBtn);

  overlay.appendChild(dialog);

  // Close on background click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      callbacks.onClose();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

/** Build a single slot element showing metadata or "Empty Slot". */
function buildSlotElement(
  slot: number,
  mode: SaveLoadMode,
  gameState: FullGameState | null,
  callbacks: SaveLoadDialogCallbacks,
  overlay: HTMLElement,
): HTMLElement {
  const metadata = getSaveMetadata(slot);
  const slotEl = document.createElement("div");
  slotEl.className = "save-slot" + (metadata ? " save-slot-filled" : " save-slot-empty");

  // Slot header
  const header = document.createElement("div");
  header.className = "save-slot-header";
  header.textContent = `Slot ${slot}`;
  slotEl.appendChild(header);

  if (metadata) {
    slotEl.appendChild(buildMetadataDisplay(metadata));
  } else {
    const emptyLabel = document.createElement("div");
    emptyLabel.className = "save-slot-empty-label";
    emptyLabel.textContent = "Empty Slot";
    slotEl.appendChild(emptyLabel);
  }

  // Action area
  const actions = document.createElement("div");
  actions.className = "save-slot-actions";

  if (mode === "save" && gameState) {
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary save-slot-btn";
    saveBtn.textContent = metadata ? "Overwrite" : "Save Here";
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (metadata) {
        showOverwriteConfirmation(slot, gameState, callbacks, overlay);
      } else {
        save(slot, gameState);
        overlay.remove();
        callbacks.onClose();
      }
    });
    actions.appendChild(saveBtn);

    if (metadata) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger save-slot-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSave(slot);
        // Refresh dialog
        overlay.remove();
        createSaveLoadDialog(mode, gameState, callbacks);
      });
      actions.appendChild(deleteBtn);
    }
  } else if (mode === "load") {
    if (metadata) {
      const loadBtn = document.createElement("button");
      loadBtn.className = "btn btn-primary save-slot-btn";
      loadBtn.textContent = "Load";
      loadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const loadedState = load(slot);
        if (loadedState) {
          overlay.remove();
          callbacks.onLoad(loadedState);
        }
      });
      actions.appendChild(loadBtn);
    }
  }

  slotEl.appendChild(actions);
  return slotEl;
}

/** Build metadata display for a filled slot. */
function buildMetadataDisplay(metadata: SaveMetadata): HTMLElement {
  const info = document.createElement("div");
  info.className = "save-slot-info";

  const companyEl = document.createElement("div");
  companyEl.className = "save-slot-company";
  companyEl.textContent = metadata.companyName;

  const detailsEl = document.createElement("div");
  detailsEl.className = "save-slot-details data-display";

  const balanceStr = `$${(metadata.balance / 1_000_000).toFixed(1)}M`;
  const shipsStr = `${metadata.shipCount} ship${metadata.shipCount !== 1 ? "s" : ""}`;
  const weeksStr = `Week ${metadata.weeksPlayed}`;

  detailsEl.textContent = `${balanceStr} | ${shipsStr} | ${weeksStr}`;

  const dateEl = document.createElement("div");
  dateEl.className = "save-slot-date";
  const saveDate = new Date(metadata.saveDate);
  dateEl.textContent = `Saved: ${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}`;

  info.appendChild(companyEl);
  info.appendChild(detailsEl);
  info.appendChild(dateEl);

  return info;
}

/** Show an overwrite confirmation inline. */
function showOverwriteConfirmation(
  slot: number,
  gameState: FullGameState,
  callbacks: SaveLoadDialogCallbacks,
  overlay: HTMLElement,
): void {
  // Create a confirmation overlay on top
  const confirmOverlay = document.createElement("div");
  confirmOverlay.className = "ship-info-overlay";

  const confirmDialog = document.createElement("div");
  confirmDialog.className = "save-load-confirm panel panel-riveted";

  const msg = document.createElement("p");
  msg.className = "save-load-confirm-msg";
  msg.textContent = `Overwrite save in Slot ${slot}? This cannot be undone.`;
  confirmDialog.appendChild(msg);

  const btnRow = document.createElement("div");
  btnRow.className = "save-load-confirm-btns";

  const yesBtn = document.createElement("button");
  yesBtn.className = "btn btn-danger";
  yesBtn.textContent = "Overwrite";
  yesBtn.addEventListener("click", () => {
    save(slot, gameState);
    confirmOverlay.remove();
    overlay.remove();
    callbacks.onClose();
  });

  const noBtn = document.createElement("button");
  noBtn.className = "btn btn-secondary";
  noBtn.textContent = "Cancel";
  noBtn.addEventListener("click", () => {
    confirmOverlay.remove();
  });

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  confirmDialog.appendChild(btnRow);

  confirmOverlay.appendChild(confirmDialog);
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) confirmOverlay.remove();
  });

  document.body.appendChild(confirmOverlay);
}
