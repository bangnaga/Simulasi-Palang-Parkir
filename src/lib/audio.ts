// Web Audio API Sound Synthesizer for Barrier Gate Simulation

class SoundController {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private motorOscillator: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // High pitched pleasant RFID beep
  public playRfidBeep(success: boolean = true) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      if (success) {
        // Double pleasant chime
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(1760, now); // A6
        osc.frequency.setValueAtTime(2637, now + 0.08); // E7
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Low error buzz
        const now = ctx.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Audio context fallback
    }
  }

  // Click sound when vehicle passes over inductive loop wire detector
  public playLoopDetectorClick(active: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(active ? 880 : 440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // Electric Motor whirr sound during gate open/close
  public startMotorSound(durationSec: number = 1.2) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.stopMotorSound();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + durationSec * 0.3);
      osc.frequency.setValueAtTime(180, now + durationSec * 0.7);
      osc.frequency.exponentialRampToValueAtTime(90, now + durationSec);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gain.gain.setValueAtTime(0.06, now + durationSec - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec);

      this.motorOscillator = osc;
      this.motorGain = gain;
    } catch {}
  }

  public stopMotorSound() {
    if (this.motorOscillator) {
      try {
        this.motorOscillator.stop();
        this.motorOscillator.disconnect();
      } catch {}
      this.motorOscillator = null;
    }
  }

  // Warning alarm sound if safety anti-crush is triggered
  public playWarningAlarm() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(950, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
}

export const soundManager = new SoundController();
