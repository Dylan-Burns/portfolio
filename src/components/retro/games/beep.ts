/** Minimal WebAudio blip generator for the arcade. Muted by default and persisted,
 *  so the site stays silent until a visitor opts in. Safe to call on the server (no-op). */

const MUTE_KEY = "burnsos.muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    // default to muted: only "0" means the visitor explicitly turned sound on
    return window.localStorage.getItem(MUTE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* best-effort */
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function blip(freq: number, durMs: number, type: OscillatorType, gain: number): void {
  if (isMuted()) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
  osc.start(t);
  osc.stop(t + durMs / 1000 + 0.02);
}

export const sfx = {
  paddle: () => blip(440, 50, "square", 0.05),
  wall: () => blip(300, 38, "square", 0.04),
  score: () => blip(660, 130, "sawtooth", 0.045),
  eat: () => blip(540, 55, "square", 0.05),
  die: () => blip(150, 320, "sawtooth", 0.06),
  select: () => blip(620, 45, "square", 0.045),
  start: () => blip(500, 90, "square", 0.045),
};
