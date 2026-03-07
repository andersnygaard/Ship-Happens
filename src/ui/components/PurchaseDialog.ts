/**
 * PurchaseDialog — Ship purchase/christening flow modal.
 * Steps: 1) Enter ship name (auto-prefixed "MS "), 2) Set deposit %, 3) Confirm purchase.
 */

import type { ShipSpec } from "../../data/types";

export interface PurchaseDialogCallbacks {
  /** Called when the player confirms purchase. Returns { shipName, depositPercent }. */
  onConfirm: (shipName: string, depositPercent: number) => void;
  /** Called when the player cancels. */
  onCancel: () => void;
}

/**
 * Create the purchase dialog modal overlay.
 * Shows christening input + deposit slider in a single dialog.
 */
export function createPurchaseDialog(
  spec: ShipSpec,
  playerBalance: number,
  callbacks: PurchaseDialogCallbacks,
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "purchase-dialog panel panel-riveted";

  // Title
  const title = document.createElement("h3");
  title.className = "purchase-dialog-title heading-copper";
  title.textContent = "Purchase Ship";
  dialog.appendChild(title);

  // Ship summary
  const summary = document.createElement("div");
  summary.className = "purchase-dialog-summary";
  summary.innerHTML = `
    <span class="purchase-ship-type">${spec.type} — ${spec.capacityBrt.toLocaleString()} BRT</span>
    <span class="purchase-ship-price data-display">Million$: ${spec.priceMillions.toFixed(1)}</span>
  `;
  dialog.appendChild(summary);

  // Christening section
  const christenSection = document.createElement("div");
  christenSection.className = "purchase-section";

  const christenLabel = document.createElement("label");
  christenLabel.className = "input-label";
  christenLabel.textContent = "Christen your ship";
  christenSection.appendChild(christenLabel);

  const nameRow = document.createElement("div");
  nameRow.className = "purchase-name-row";

  const prefix = document.createElement("span");
  prefix.className = "purchase-name-prefix data-display";
  prefix.textContent = "MS ";
  nameRow.appendChild(prefix);

  const nameInput = document.createElement("input");
  nameInput.className = "input purchase-name-input";
  nameInput.type = "text";
  nameInput.placeholder = "Enter ship name";
  nameInput.maxLength = 24;
  nameRow.appendChild(nameInput);

  christenSection.appendChild(nameRow);
  dialog.appendChild(christenSection);

  // Deposit section
  const depositSection = document.createElement("div");
  depositSection.className = "purchase-section";

  const depositLabel = document.createElement("label");
  depositLabel.className = "input-label";
  depositLabel.textContent = "Deposit percentage";
  depositSection.appendChild(depositLabel);

  const priceDollars = spec.priceMillions * 1_000_000;
  const minDeposit = spec.depositPercent;
  const maxDeposit = 100;

  const depositSlider = document.createElement("input");
  depositSlider.className = "purchase-deposit-slider";
  depositSlider.type = "range";
  depositSlider.min = String(minDeposit);
  depositSlider.max = String(maxDeposit);
  depositSlider.value = String(minDeposit);
  depositSlider.step = "1";
  depositSection.appendChild(depositSlider);

  const depositInfo = document.createElement("div");
  depositInfo.className = "purchase-deposit-info data-display";
  depositSection.appendChild(depositInfo);

  function updateDepositInfo(): void {
    const pct = parseInt(depositSlider.value, 10);
    const depositAmount = Math.round(priceDollars * (pct / 100));
    const mortgagePct = 100 - pct;
    depositInfo.textContent = `${pct}% deposit ($${(depositAmount / 1_000_000).toFixed(2)}M) — Mortgage: ${mortgagePct}%`;
  }

  depositSlider.addEventListener("input", updateDepositInfo);
  updateDepositInfo();

  dialog.appendChild(depositSection);

  // Balance display
  const balanceInfo = document.createElement("div");
  balanceInfo.className = "purchase-balance data-display";
  balanceInfo.textContent = `Your capital: $${(playerBalance / 1_000_000).toFixed(1)}M`;
  dialog.appendChild(balanceInfo);

  // Buttons
  const buttons = document.createElement("div");
  buttons.className = "purchase-dialog-buttons";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn btn-primary";
  confirmBtn.textContent = "CONFIRM PURCHASE";
  confirmBtn.addEventListener("click", () => {
    const shipName = nameInput.value.trim();
    if (!shipName) {
      nameInput.style.borderColor = "var(--color-danger)";
      nameInput.placeholder = "Please enter a name!";
      return;
    }
    const depositPercent = parseInt(depositSlider.value, 10);
    callbacks.onConfirm(shipName, depositPercent);
  });
  buttons.appendChild(confirmBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "CANCEL";
  cancelBtn.addEventListener("click", callbacks.onCancel);
  buttons.appendChild(cancelBtn);

  dialog.appendChild(buttons);

  overlay.appendChild(dialog);

  // Close on background click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      callbacks.onCancel();
    }
  });

  // Focus the name input after a tick (so it's in the DOM)
  setTimeout(() => nameInput.focus(), 50);

  return overlay;
}

/**
 * Create a simple message dialog (for success, failure, sarcastic rejection, etc.).
 */
export function createMessageDialog(
  title: string,
  message: string,
  onClose: () => void,
): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "ship-info-overlay";

  const dialog = document.createElement("div");
  dialog.className = "purchase-dialog message-dialog panel panel-riveted";

  const titleEl = document.createElement("h3");
  titleEl.className = "purchase-dialog-title heading-copper";
  titleEl.textContent = title;
  dialog.appendChild(titleEl);

  const messageEl = document.createElement("p");
  messageEl.className = "message-dialog-text";
  messageEl.textContent = message;
  dialog.appendChild(messageEl);

  const okBtn = document.createElement("button");
  okBtn.className = "btn btn-primary";
  okBtn.textContent = "OK";
  okBtn.addEventListener("click", onClose);
  dialog.appendChild(okBtn);

  overlay.appendChild(dialog);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      onClose();
    }
  });

  return overlay;
}
