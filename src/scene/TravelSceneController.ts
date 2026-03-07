/**
 * TravelSceneController — Coordinates the Three.js scene during sea voyages.
 *
 * When a voyage is active the controller:
 *   - Moves the ship model forward through the ocean
 *   - Applies storm weather effects (darker sky, rougher waves)
 *   - Tracks voyage progress for the HUD
 *
 * Designed to be driven from the animation loop in main.ts.
 */

import type { OceanScene } from "./OceanScene";
import type { ShipModel } from "./ShipModel";
import type { SkySystem } from "./SkySystem";

export interface VoyageInfo {
  shipName: string;
  originName: string;
  destinationName: string;
  distanceNm: number;
  travelDays: number;
}

export class TravelSceneController {
  private active = false;
  private voyageInfo: VoyageInfo | null = null;

  /** 0-1, how far through the voyage we are */
  private progress = 0;
  /** Current simulated day counter */
  private dayCounter = 0;
  /** Whether a storm is currently happening */
  private stormActive = false;

  /** Ship forward speed (units per second along -Z) */
  private readonly shipSpeed = 1.5;

  /** Accumulated Z offset applied to the ship while travelling */
  private shipZOffset = 0;

  /** Base ship position (so we can reset after voyage) */
  private shipBaseZ = 0;

  /** Listeners notified when progress/day updates occur */
  private onUpdate: ((progress: number, day: number) => void) | null = null;
  private onStormChange: ((active: boolean) => void) | null = null;

  constructor(
    private ocean: OceanScene,
    private shipModel: ShipModel,
    private skySystem: SkySystem,
  ) {
    this.shipBaseZ = this.shipModel.group.position.z;
  }

  /** Start a new voyage animation. */
  startVoyage(info: VoyageInfo): void {
    this.active = true;
    this.voyageInfo = info;
    this.progress = 0;
    this.dayCounter = 0;
    this.stormActive = false;
    this.shipZOffset = 0;
    this.shipModel.group.position.z = this.shipBaseZ;
    this.ocean.setWeatherIntensity(1.0);
    this.skySystem.setStormFactor(0);
  }

  /** Stop the voyage animation and reset. */
  stopVoyage(): void {
    this.active = false;
    this.voyageInfo = null;
    this.stormActive = false;
    this.shipModel.group.position.z = this.shipBaseZ;
    this.ocean.setWeatherIntensity(1.0);
    this.skySystem.setStormFactor(0);
  }

  /** Whether a voyage animation is running. */
  isActive(): boolean {
    return this.active;
  }

  /** Get current voyage info. */
  getVoyageInfo(): VoyageInfo | null {
    return this.voyageInfo;
  }

  /** Get current progress 0-1. */
  getProgress(): number {
    return this.progress;
  }

  /** Get current day counter. */
  getDayCounter(): number {
    return this.dayCounter;
  }

  /** Set voyage progress externally (e.g. from TravelScreen event processing). */
  setProgress(p: number): void {
    this.progress = Math.max(0, Math.min(1, p));
    if (this.voyageInfo) {
      this.dayCounter = Math.floor(this.progress * this.voyageInfo.travelDays);
    }
  }

  /** Activate or deactivate storm visuals. */
  setStorm(active: boolean): void {
    if (this.stormActive === active) return;
    this.stormActive = active;

    if (active) {
      this.ocean.setWeatherIntensity(2.5);
      this.skySystem.setStormFactor(0.7);
    } else {
      this.ocean.setWeatherIntensity(1.0);
      this.skySystem.setStormFactor(0);
    }

    if (this.onStormChange) {
      this.onStormChange(active);
    }
  }

  /** Register a callback for progress/day updates. */
  onProgressUpdate(cb: (progress: number, day: number) => void): void {
    this.onUpdate = cb;
  }

  /** Register a callback for storm state changes. */
  onStormStateChange(cb: (active: boolean) => void): void {
    this.onStormChange = cb;
  }

  /**
   * Call every frame from the animation loop.
   * @param delta — seconds since last frame
   */
  update(delta: number): void {
    if (!this.active || !this.voyageInfo) return;

    // Move ship forward (negative Z is forward in this scene)
    this.shipZOffset -= this.shipSpeed * delta;

    // Wrap the Z position so the ship stays in the visible ocean area
    // The ocean is 120 units wide, so wrap at -60 back to +60
    if (this.shipZOffset < -60) {
      this.shipZOffset += 120;
    }

    this.shipModel.group.position.z = this.shipBaseZ + this.shipZOffset;

    // Notify listeners
    if (this.onUpdate) {
      this.onUpdate(this.progress, this.dayCounter);
    }
  }
}
