/**
 * EventDialog — Reusable dialog component for travel event notifications.
 * Shows event description and choice buttons. Returns the chosen action via callback.
 */

import type { TravelEvent } from "../../game/EventSystem";

export interface EventDialogOptions {
  /** The travel event to display. */
  event: TravelEvent;
  /** Callback invoked when the player makes a choice. */
  onChoice: (choiceId: string) => void;
}

export class EventDialog {
  private overlay: HTMLElement;

  constructor(private options: EventDialogOptions) {
    this.overlay = document.createElement("div");
    this.overlay.className = "event-dialog-overlay";
  }

  /** Render the dialog and append it to the given parent. */
  show(parent: HTMLElement): void {
    this.overlay.innerHTML = "";

    const panel = document.createElement("div");
    panel.className = "event-dialog panel panel-riveted";

    // Title
    const title = document.createElement("h2");
    title.className = "event-dialog-title heading-copper";
    title.textContent = this.options.event.title;
    panel.appendChild(title);

    // Description
    const desc = document.createElement("p");
    desc.className = "event-dialog-description";
    desc.textContent = this.options.event.description;
    panel.appendChild(desc);

    // Choice buttons
    const btnContainer = document.createElement("div");
    btnContainer.className = "event-dialog-buttons";

    for (const choice of this.options.event.choices) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary event-dialog-btn";
      btn.textContent = choice.label;
      btn.addEventListener("click", () => {
        this.options.onChoice(choice.id);
      });
      btnContainer.appendChild(btn);
    }

    panel.appendChild(btnContainer);
    this.overlay.appendChild(panel);
    parent.appendChild(this.overlay);
  }

  /** Remove the dialog from the DOM. */
  hide(): void {
    this.overlay.remove();
  }
}
