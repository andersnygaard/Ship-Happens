/**
 * TurnTransition — Full-screen overlay displayed when switching between players.
 * Shows the new player's number, name, and company name.
 * Auto-dismisses after 2 seconds or on click.
 */

export interface TurnTransitionOptions {
  /** Player number (1-based). */
  playerNumber: number;
  /** Player name. */
  playerName: string;
  /** Company name. */
  companyName: string;
  /** Callback when the transition is dismissed. */
  onDismiss: () => void;
}

export class TurnTransition {
  private overlay: HTMLElement | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Show the turn transition overlay.
   * It auto-dismisses after 2 seconds or when the user clicks.
   */
  show(options: TurnTransitionOptions): void {
    // Remove any existing overlay
    this.dismiss();

    this.overlay = document.createElement("div");
    this.overlay.className = "turn-transition-overlay";

    const content = document.createElement("div");
    content.className = "turn-transition-content";

    // Player number badge
    const badge = document.createElement("div");
    badge.className = "turn-transition-badge";
    badge.textContent = String(options.playerNumber);
    content.appendChild(badge);

    // "Player X's Turn" heading
    const heading = document.createElement("h2");
    heading.className = "turn-transition-heading";
    heading.textContent = `Player ${options.playerNumber}'s Turn`;
    content.appendChild(heading);

    // Company name
    const company = document.createElement("div");
    company.className = "turn-transition-company";
    company.textContent = options.companyName;
    content.appendChild(company);

    // Player name
    const name = document.createElement("div");
    name.className = "turn-transition-name";
    name.textContent = options.playerName;
    content.appendChild(name);

    // Hint text
    const hint = document.createElement("div");
    hint.className = "turn-transition-hint";
    hint.textContent = "Click anywhere to continue";
    content.appendChild(hint);

    this.overlay.appendChild(content);

    // Dismiss on click
    this.overlay.addEventListener("click", () => {
      this.dismiss();
      options.onDismiss();
    });

    // Auto-dismiss after 2 seconds
    this.dismissTimer = setTimeout(() => {
      this.dismiss();
      options.onDismiss();
    }, 2000);

    document.body.appendChild(this.overlay);

    // Trigger fade-in animation
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.classList.add("visible");
      }
    });
  }

  /**
   * Remove the overlay from the DOM.
   */
  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
