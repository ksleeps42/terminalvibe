/**
 * Audio Synthesizer for Terminal Vibe
 * Uses Web Audio API to generate notification sounds
 */

class AudioSynthesizer {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.3;
  }

  /**
   * Initialize or resume the audio context
   * Must be called after user interaction due to browser policies
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Create a gain node with the current volume
   */
  createGain() {
    const ctx = this.init();
    const gainNode = ctx.createGain();
    gainNode.gain.value = this.volume;
    return gainNode;
  }

  /**
   * Play a "singing bowl" tone for needs-attention alerts
   * Two harmonious sine waves with gentle decay
   */
  playAttentionTone() {
    if (!this.isEnabled) return;

    const ctx = this.init();
    const now = ctx.currentTime;

    // Create oscillators for harmonic tones (A4 and E5 - perfect fifth)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator(); // Sub-harmonic

    // Master gain
    const masterGain = ctx.createGain();

    // Individual gains for layering
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

    // Lowpass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.Q.setValueAtTime(0.7, now);

    // Frequencies: A4, E5, A3 (octave below)
    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(659.25, now);
    osc3.frequency.setValueAtTime(220, now);

    // Waveforms
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';

    // Envelope - gentle attack, long decay
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    // Individual gains for mixing
    gain1.gain.setValueAtTime(0.6, now);
    gain2.gain.setValueAtTime(0.4, now);
    gain3.gain.setValueAtTime(0.3, now);

    // Connect: oscillators -> individual gains -> filter -> master -> output
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 2.5);
    osc2.stop(now + 2.5);
    osc3.stop(now + 2.5);
  }

  /**
   * Play a pleasant three-note "ready" chime
   * C5-E5-G5 major arpeggio
   */
  playReadyTone() {
    if (!this.isEnabled) return;

    const ctx = this.init();
    const now = ctx.currentTime;

    // C5, E5, G5 - C major chord arpeggio
    const notes = [523.25, 659.25, 783.99];
    const noteDelay = 0.12;
    const noteDuration = 0.6;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Use sine wave for clean tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Highpass to remove rumble
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, now);

      // Timing for this note
      const noteStart = now + (i * noteDelay);

      // Envelope
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, noteStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      // Connect
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Play
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }

  /**
   * Play a subtle "working" tick/pulse sound
   * Used sparingly when status changes to working
   */
  playWorkingTone() {
    if (!this.isEnabled) return;

    const ctx = this.init();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Short blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);

    // Quick attack and decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable audio
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  getEnabled() {
    return this.isEnabled;
  }

  /**
   * Play sound based on status
   */
  playStatusSound(status) {
    switch (status) {
      case 'needs-attention':
        this.playAttentionTone();
        break;
      case 'ready':
        this.playReadyTone();
        break;
      case 'working':
        this.playWorkingTone();
        break;
      default:
        break;
    }
  }
}

// Export singleton instance
export const audioSynth = new AudioSynthesizer();
export default audioSynth;
