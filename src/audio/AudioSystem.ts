/**
 * AudioSystem — Singleton audio manager using Web Audio API.
 *
 * Uses lazy initialization: the AudioContext is created on the first
 * user interaction to comply with browser autoplay policies.
 */

import { SoundGenerator } from "./SoundGenerator";

export type SoundName =
  | "uiClick"
  | "shipHorn"
  | "coinSound"
  | "successChime"
  | "failureSound";

export class AudioSystem {
  private static instance: AudioSystem | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private generator: SoundGenerator | null = null;
  private muted = false;
  private volume = 1.0;
  private initialized = false;
  private oceanAmbiance: { stop: () => void } | null = null;
  private stormWind: { stop: () => void } | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /** Get the singleton instance. */
  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  /**
   * Initialize the audio context. Must be called from a user interaction
   * event handler (click, keydown, etc.) to satisfy browser autoplay policies.
   */
  init(): void {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    this.generator = new SoundGenerator(this.ctx, this.masterGain);
    this.initialized = true;
  }

  /** Ensure the context is initialized before playing sounds. */
  private ensureInit(): boolean {
    if (!this.initialized || !this.ctx || !this.generator || !this.masterGain) {
      return false;
    }
    // Resume suspended context (browsers may suspend it)
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return true;
  }

  /**
   * Play a named sound effect.
   * @param soundName — The sound to play.
   */
  play(soundName: SoundName): void {
    if (this.muted || !this.ensureInit()) return;

    switch (soundName) {
      case "uiClick":
        this.generator!.generateUIClick();
        break;
      case "shipHorn":
        this.generator!.generateShipHorn();
        break;
      case "coinSound":
        this.generator!.generateCoinSound();
        break;
      case "successChime":
        this.generator!.generateSuccessChime();
        break;
      case "failureSound":
        this.generator!.generateFailureSound();
        break;
    }
  }

  /**
   * Start ocean ambiance (looping background sound).
   * Only one instance plays at a time.
   */
  startOceanAmbiance(): void {
    if (this.muted || !this.ensureInit()) return;
    if (this.oceanAmbiance) return; // already playing

    this.oceanAmbiance = this.generator!.generateOceanAmbiance();
  }

  /** Stop ocean ambiance. */
  stopOceanAmbiance(): void {
    if (this.oceanAmbiance) {
      this.oceanAmbiance.stop();
      this.oceanAmbiance = null;
    }
  }

  /**
   * Start storm wind sound (looping).
   * Only one instance plays at a time.
   */
  startStormWind(): void {
    if (this.muted || !this.ensureInit()) return;
    if (this.stormWind) return;

    this.stormWind = this.generator!.generateStormWind();
  }

  /** Stop storm wind sound. */
  stopStormWind(): void {
    if (this.stormWind) {
      this.stormWind.stop();
      this.stormWind = null;
    }
  }

  /**
   * Set master volume (0-1).
   */
  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /** Get current volume (0-1). */
  getVolume(): number {
    return this.volume;
  }

  /** Toggle mute on/off. Returns the new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;

    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }

    // Stop ambient sounds when muting
    if (this.muted) {
      this.stopOceanAmbiance();
      this.stopStormWind();
    }

    return this.muted;
  }

  /** Check if audio is currently muted. */
  isMuted(): boolean {
    return this.muted;
  }
}
