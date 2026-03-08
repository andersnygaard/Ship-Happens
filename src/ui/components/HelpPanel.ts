/**
 * HelpPanel — Slide-in overlay panel with game guide, keyboard shortcuts,
 * and help sections. Toggled with the H key or the help button.
 *
 * Sections:
 *   1. Getting Started
 *   2. Controls & Keyboard Shortcuts
 *   3. Economy
 *   4. Ship Management
 *   5. Port Operations
 *   6. Maneuvering
 */

export class HelpPanel {
  private overlay: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private isOpen = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  /** Toggle the help panel open/closed. */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Open the help panel. */
  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    // Create overlay backdrop
    this.overlay = document.createElement("div");
    this.overlay.className = "help-overlay";
    this.overlay.addEventListener("click", () => this.close());

    // Create panel
    this.panel = document.createElement("div");
    this.panel.className = "help-panel";

    // Header
    const header = document.createElement("div");
    header.className = "help-panel-header";

    const title = document.createElement("h2");
    title.className = "help-panel-title";
    title.textContent = "Captain's Guide";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary help-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Close (Esc)";
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.panel.appendChild(header);

    // Content
    const content = document.createElement("div");
    content.className = "help-panel-content";

    content.appendChild(this.buildSection("Getting Started", this.gettingStartedContent()));
    content.appendChild(this.buildSection("Controls & Keyboard Shortcuts", this.controlsContent()));
    content.appendChild(this.buildSection("Economy", this.economyContent()));
    content.appendChild(this.buildSection("Ship Management", this.shipManagementContent()));
    content.appendChild(this.buildSection("Captain Traits", this.captainTraitsContent()));
    content.appendChild(this.buildSection("Port Operations", this.portOperationsContent()));
    content.appendChild(this.buildSection("Maneuvering", this.maneuveringContent()));

    this.panel.appendChild(content);

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.panel);

    // Slide-in animation
    requestAnimationFrame(() => {
      this.overlay?.classList.add("help-overlay-visible");
      this.panel?.classList.add("help-panel-visible");
    });

    // Keyboard handler for Esc to close
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    };
    document.addEventListener("keydown", this.boundKeyHandler);
  }

  /** Close the help panel. */
  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.overlay?.classList.remove("help-overlay-visible");
    this.panel?.classList.remove("help-panel-visible");

    // Remove after transition
    const overlay = this.overlay;
    const panel = this.panel;
    setTimeout(() => {
      overlay?.remove();
      panel?.remove();
    }, 300);

    this.overlay = null;
    this.panel = null;

    if (this.boundKeyHandler) {
      document.removeEventListener("keydown", this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
  }

  /** Whether the panel is currently open. */
  getIsOpen(): boolean {
    return this.isOpen;
  }

  // ── Section Builder ──────────────────────────────────────────────────

  private buildSection(title: string, contentHtml: string): HTMLElement {
    const section = document.createElement("div");
    section.className = "help-section";

    const heading = document.createElement("h3");
    heading.className = "help-section-title";
    heading.textContent = title;

    const body = document.createElement("div");
    body.className = "help-section-body";
    body.innerHTML = contentHtml;

    section.appendChild(heading);
    section.appendChild(body);
    return section;
  }

  // ── Content Sections ─────────────────────────────────────────────────

  private gettingStartedContent(): string {
    return `
      <ol>
        <li><strong>Buy a ship</strong> — Visit the Ship Broker to purchase your first vessel.</li>
        <li><strong>Accept a charter</strong> — Dock at a port and take a freight contract.</li>
        <li><strong>Load cargo</strong> — Load the contracted cargo onto your ship.</li>
        <li><strong>Set sail</strong> — Select a destination on the world map and click Start Action.</li>
        <li><strong>Arrive &amp; deliver</strong> — Navigate into the harbor and deliver your cargo for payment.</li>
      </ol>
      <p>Repeat the cycle to grow your shipping empire!</p>
    `;
  }

  private controlsContent(): string {
    return `
      <table class="help-shortcuts-table">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>H</kbd></td><td>Toggle this help panel</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Close help / cancel</td></tr>
          <tr><td><kbd>1</kbd></td><td>Port: Repair ship</td></tr>
          <tr><td><kbd>2</kbd></td><td>Port: Refuel</td></tr>
          <tr><td><kbd>3</kbd></td><td>Port: Accept charter</td></tr>
          <tr><td><kbd>4</kbd></td><td>Port: Lay up / reactivate ship</td></tr>
          <tr><td><kbd>5</kbd></td><td>Port: Load cargo</td></tr>
        </tbody>
      </table>
      <p>Click on ports on the world map to select a travel destination.</p>
    `;
  }

  private economyContent(): string {
    return `
      <ul>
        <li><strong>Starting capital</strong> — You begin with limited funds. Spend wisely.</li>
        <li><strong>Charter revenue</strong> — Accept freight contracts and deliver cargo to earn money.</li>
        <li><strong>Operating costs</strong> — Ships cost money daily for crew, insurance, and maintenance.</li>
        <li><strong>Fuel costs</strong> — Refueling at ports is a major expense. Plan routes efficiently.</li>
        <li><strong>Repair costs</strong> — Neglected ships deteriorate. Regular repairs prevent breakdowns.</li>
        <li><strong>Bankruptcy</strong> — If your balance drops too low, the game is over!</li>
      </ul>
    `;
  }

  private shipManagementContent(): string {
    return `
      <ul>
        <li><strong>Ship condition</strong> — Ships degrade during voyages. Keep condition above 50% to avoid problems.</li>
        <li><strong>Fuel management</strong> — Always ensure you have enough fuel for the journey. Running out at sea is costly.</li>
        <li><strong>Cargo capacity (tdw)</strong> — Each ship has a maximum deadweight tonnage. Larger ships carry more but cost more to operate.</li>
        <li><strong>Lay up</strong> — Ships not in use can be laid up to reduce operating costs.</li>
        <li><strong>Multiple ships</strong> — As your company grows, manage a fleet of vessels.</li>
      </ul>
    `;
  }

  private captainTraitsContent(): string {
    return `
      <p>Each captain is assigned a personality trait when you purchase a ship. Traits add flavor and occasionally influence crew events during voyages.</p>
      <ul>
        <li><strong>Cautious</strong> — Safety-conscious captain. Tends to attract events involving risk assessment and careful planning.</li>
        <li><strong>Reckless</strong> — Bold and daring. More likely to see events about unauthorized modifications and crew shenanigans.</li>
        <li><strong>Frugal</strong> — Penny-pinching by nature. Cost-related crew complaints are more common.</li>
        <li><strong>Superstitious</strong> — Believes in omens and rituals. May trigger superstition-themed events at sea.</li>
        <li><strong>Charismatic</strong> — A natural leader. Crew morale events tend to have a social angle.</li>
        <li><strong>Strict Disciplinarian</strong> — Runs a tight ship. Expects order, which sometimes leads to pushback from the crew.</li>
      </ul>
      <p>During voyages, crew events present you with two choices — each with minor consequences such as small costs, delays, or condition changes. Neither option is always best, so choose wisely!</p>
    `;
  }

  private portOperationsContent(): string {
    return `
      <ul>
        <li><strong>Repair</strong> — Restore your ship's condition. Cost depends on damage level.</li>
        <li><strong>Refuel</strong> — Fill up your fuel tanks. Prices vary by port.</li>
        <li><strong>Charter</strong> — Browse available freight contracts. Consider distance, payment, and cargo type.</li>
        <li><strong>Lay Up</strong> — Put a ship in storage to save on daily costs. Reactivate when needed.</li>
        <li><strong>Load Cargo</strong> — Load accepted charter cargo onto your ship before departing.</li>
      </ul>
      <p>Use number keys <kbd>1</kbd>–<kbd>5</kbd> for quick access to port operations.</p>
    `;
  }

  private maneuveringContent(): string {
    return `
      <p>When arriving at a port, you must steer your ship into the harbor:</p>
      <ul>
        <li>Use <strong>arrow keys</strong> or <strong>on-screen controls</strong> to steer.</li>
        <li>Watch the <strong>time limit</strong> — dock before time runs out.</li>
        <li>Avoid hitting the harbor walls — collisions damage your ship.</li>
        <li>Successful docking earns a bonus; crashing costs repair money.</li>
      </ul>
    `;
  }
}

/** Singleton help panel instance. */
export const helpPanel = new HelpPanel();
