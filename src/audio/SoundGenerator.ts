/**
 * SoundGenerator — Procedural sound generation using Web Audio API.
 *
 * All sounds are generated programmatically using oscillators, noise buffers,
 * and filters. No external audio files are needed.
 */

export class SoundGenerator {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  /**
   * Ocean ambiance — filtered white noise (bandpass ~200-800Hz, low volume).
   * Returns the source node so it can be stopped externally.
   */
  generateOceanAmbiance(): { source: AudioBufferSourceNode; stop: () => void } {
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Bandpass filter to shape the noise into ocean-like sound
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 500;
    bandpass.Q.value = 0.5;

    // LFO to modulate the volume for a wave-like effect
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.06;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // slow modulation

    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 0.03;

    lfo.connect(lfoDepth);
    lfoDepth.connect(lfoGain.gain);

    source.connect(bandpass);
    bandpass.connect(lfoGain);
    lfoGain.connect(this.masterGain);

    source.start();
    lfo.start();

    return {
      source,
      stop: () => {
        source.stop();
        lfo.stop();
      },
    };
  }

  /**
   * Ship horn — low frequency oscillator (150Hz, short duration, slight pitch bend).
   */
  generateShipHorn(): void {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(145, now + 0.8);
    osc.frequency.linearRampToValueAtTime(148, now + 1.5);

    // Second oscillator for richness
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(151, now);
    osc2.frequency.linearRampToValueAtTime(146, now + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.setValueAtTime(0.15, now + 1.0);
    gain.gain.linearRampToValueAtTime(0, now + 1.8);

    // Low-pass filter for muffled horn sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 1.8);
    osc2.stop(now + 1.8);
  }

  /**
   * UI click — very short high-frequency blip (800Hz, 50ms).
   */
  generateUIClick(): void {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Storm wind — filtered white noise with LFO modulation.
   * Returns a stop function for cleanup.
   */
  generateStormWind(): { stop: () => void } {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Bandpass for wind-like character
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 800;
    bandpass.Q.value = 1.0;

    // LFO for gusting effect
    const volumeGain = this.ctx.createGain();
    volumeGain.gain.value = 0.15;

    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.3;

    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 0.08;

    lfo.connect(lfoDepth);
    lfoDepth.connect(volumeGain.gain);

    source.connect(bandpass);
    bandpass.connect(volumeGain);
    volumeGain.connect(this.masterGain);

    source.start();
    lfo.start();

    return {
      stop: () => {
        source.stop();
        lfo.stop();
      },
    };
  }

  /**
   * Coin/money sound — two quick high notes (1000Hz + 1200Hz, 100ms each).
   */
  generateCoinSound(): void {
    const now = this.ctx.currentTime;

    // First note
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 1000;

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.1);

    // Second note
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 1200;

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.2);
  }

  /**
   * Success chime — ascending three notes.
   */
  generateSuccessChime(): void {
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      const startTime = now + i * duration;
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration * 2);
    });
  }

  /**
   * Failure sound — descending two notes.
   */
  generateFailureSound(): void {
    const now = this.ctx.currentTime;
    const notes = [440, 330]; // A4, E4
    const duration = 0.2;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      const startTime = now + i * duration;
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration * 2);
    });
  }
}
