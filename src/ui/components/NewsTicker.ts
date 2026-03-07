/**
 * NewsTicker — Scrolling news headline component for the world map.
 * Displays satirical shipping news headlines in a horizontal scrolling ticker.
 */

import { NEWS_HEADLINES, pickRandomN } from "../../data/humorTexts";

export class NewsTicker {
  private container: HTMLElement;
  private tickerTrack: HTMLElement;
  private headlines: string[];
  private animationFrame: number | null = null;

  constructor() {
    this.container = document.createElement("div");
    this.container.className = "news-ticker";

    // Pick a randomized subset of headlines to display
    this.headlines = pickRandomN(NEWS_HEADLINES, 10);

    this.tickerTrack = document.createElement("div");
    this.tickerTrack.className = "news-ticker-track";

    this.buildContent();
    this.container.appendChild(this.tickerTrack);
  }

  private buildContent(): void {
    // Build the ticker text with separator dots
    const tickerText = this.headlines
      .map((h) => `\u00a0\u00a0\u00a0\u2022 ${h}`)
      .join("\u00a0\u00a0\u00a0");

    // Duplicate content for seamless loop
    const span1 = document.createElement("span");
    span1.className = "news-ticker-content";
    span1.textContent = tickerText;

    const span2 = document.createElement("span");
    span2.className = "news-ticker-content";
    span2.textContent = tickerText;

    this.tickerTrack.appendChild(span1);
    this.tickerTrack.appendChild(span2);
  }

  /** Attach the ticker to a parent element. */
  attach(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  /** Get the DOM element. */
  getElement(): HTMLElement {
    return this.container;
  }

  /** Remove the ticker and clean up. */
  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.container.remove();
  }
}
