/**
 * ROCKFALL AI — Web Audio API Industrial Sound Synthesizer
 * Provides audible safety sirens, status chimes, and tactile audio feedback.
 */

class IndustrialAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.isSirenPlaying = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.4;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.4;
    }
    if (this.isMuted && this.isSirenPlaying) {
      this.stopSiren();
    }
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  playSafeChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual harmonious tone: 523.25 Hz (C5) and 659.25 Hz (E5)
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn('Safe chime error:', e);
    }
  }

  playHighRiskKlaxon() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Play a 3-burst emergency alert pulse
      const now = this.ctx.currentTime;
      for (let burst = 0; burst < 3; burst++) {
        const burstStart = now + burst * 0.38;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        
        // Pitch drop from 880Hz to 440Hz (tactical alarm)
        osc.frequency.setValueAtTime(880, burstStart);
        osc.frequency.linearRampToValueAtTime(520, burstStart + 0.22);
        
        gain.gain.setValueAtTime(0.28, burstStart);
        gain.gain.exponentialRampToValueAtTime(0.01, burstStart + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(burstStart);
        osc.stop(burstStart + 0.26);
      }
    } catch (e) {
      console.warn('Hazard klaxon error:', e);
    }
  }

  startContinuousSiren() {
    if (this.isMuted || this.isSirenPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isSirenPlaying = true;
    this.playHighRiskKlaxon();
    this.sirenInterval = setInterval(() => {
      if (this.isSirenPlaying && !this.isMuted) {
        this.playHighRiskKlaxon();
      } else {
        this.stopSiren();
      }
    }, 1800);
  }

  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }
}

window.soundSystem = new IndustrialAudioSystem();
