/**
 * QOVA sound engine. Everything is synthesised with Web Audio, no files.
 * Off by default; turned on only by a click (browsers require a gesture).
 */
type Voice = "tick" | "tap" | "chime" | "whoosh" | "ping" | "swoosh" | "key";

class SoundEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  drone: { stop: () => void } | null = null;
  on = false;
  last: Record<string, number> = {};

  private ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.75;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    this.ctx = ctx; this.master = master; this.analyser = analyser;
    return ctx;
  }

  async enable() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    this.on = true;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(0.9, ctx.currentTime, 0.15);
    this.startDrone();
    this.play("chime");
  }

  disable() {
    if (!this.ctx || !this.master) { this.on = false; return; }
    this.play("tap");
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(0.0001, t + 0.08, 0.12);
    setTimeout(() => { this.drone?.stop(); this.drone = null; }, 700);
    this.on = false;
  }

  /** A quiet, slowly breathing pad so the equalizer has something to show. */
  private startDrone() {
    const ctx = this.ctx!; if (this.drone) return;
    const out = ctx.createGain(); out.gain.value = 0;
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 420; filter.Q.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    const oscs = [110, 164.81, 220.5].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 1 ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = (i - 1) * 6; o.connect(filter); o.start(); return o; });
    filter.connect(out); out.connect(this.master!);
    lfo.start();
    out.gain.setTargetAtTime(0.022, ctx.currentTime, 1.2);
    this.drone = { stop: () => { const t = ctx.currentTime; out.gain.setTargetAtTime(0, t, 0.2); setTimeout(() => { oscs.forEach((o) => o.stop()); lfo.stop(); }, 900); } };
  }

  private env(g: GainNode, t: number, peak: number, a: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private tone(freq: number, type: OscillatorType, t: number, peak: number, a: number, d: number, glideTo?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + a + d);
    const g = ctx.createGain(); this.env(g, t, peak, a, d);
    o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + a + d + 0.05);
  }

  private noise(t: number, dur: number, peak: number, from: number, to: number, q = 0.8) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0); for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); this.env(g, t, peak, dur * 0.35, dur * 0.65);
    src.connect(f); f.connect(g); g.connect(this.master!); src.start(t); src.stop(t + dur);
  }

  play(v: Voice) {
    if (!this.on || !this.ctx) return;
    const now = performance.now();
    const gap = v === "tick" ? 45 : v === "key" ? 30 : 80;
    if (now - (this.last[v] || 0) < gap) return;
    this.last[v] = now;
    const t = this.ctx.currentTime + 0.005;
    switch (v) {
      case "tick": this.tone(2400, "sine", t, 0.035, 0.002, 0.04); break;
      case "key": this.tone(1800, "square", t, 0.012, 0.001, 0.03); this.noise(t, 0.03, 0.02, 4000, 2500, 2); break;
      case "tap": this.tone(520, "sine", t, 0.11, 0.004, 0.09, 380); this.noise(t, 0.04, 0.03, 3000, 1500, 1.5); break;
      case "chime": [880, 1318.5, 1760].forEach((f, i) => this.tone(f, "sine", t + i * 0.07, 0.07, 0.006, 0.7)); break;
      case "ping": this.tone(1567.98, "sine", t, 0.1, 0.004, 0.9); this.tone(2093, "sine", t + 0.09, 0.07, 0.004, 1.1); this.tone(3135.96, "sine", t + 0.09, 0.02, 0.004, 0.6); break;
      case "whoosh": this.noise(t, 0.45, 0.07, 300, 2600, 0.7); break;
      case "swoosh": this.noise(t, 0.6, 0.08, 2400, 280, 0.6); this.tone(180, "sine", t, 0.05, 0.02, 0.5, 90); break;
    }
  }

  levels(out: Uint8Array) { if (this.analyser) this.analyser.getByteFrequencyData(out as Parameters<AnalyserNode["getByteFrequencyData"]>[0]); }
}

let engine: SoundEngine | null = null;
export function sound() { if (!engine) engine = new SoundEngine(); return engine; }
export type { Voice };
