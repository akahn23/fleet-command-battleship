export interface Soundscape {
  setEnabled(on: boolean): void;
  playHit(): void;
  playSink(): void;
  dispose(): void;
}

export function isSoundAvailable(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia('(pointer: coarse)').matches;
}

type AudioContextFactory = () => AudioContext;

const SILENCE_LEVEL = 0.0001;

export function createSoundscape(
  ctxFactory: AudioContextFactory = () => new AudioContext(),
): Soundscape {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let effectsBus: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let enabled = false;
  let disposed = false;
  let unavailable = false;
  let noteTimer: number | undefined;
  let suspendTimer: number | undefined;
  let visibilityListener: (() => void) | null = null;
  const droneNodes: OscillatorNode[] = [];

  const rampMaster = (value: number, duration: number) => {
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + duration);
  };

  const stopScheduling = () => {
    if (noteTimer !== undefined) window.clearTimeout(noteTimer);
    noteTimer = undefined;
  };

  const suspendAfterFade = () => {
    if (suspendTimer !== undefined) window.clearTimeout(suspendTimer);
    suspendTimer = window.setTimeout(() => {
      suspendTimer = undefined;
      if (context && (!enabled || document.hidden)) void context.suspend().catch(() => {});
    }, 200);
  };

  const playNote = () => {
    if (!enabled || !context || !musicBus || context.state !== 'running') return;
    const now = context.currentTime;
    const notes = [146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66];
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const delay = context.createDelay(1);
    const feedback = context.createGain();
    const wet = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)]!, now);
    envelope.gain.setValueAtTime(SILENCE_LEVEL, now);
    envelope.gain.linearRampToValueAtTime(0.16, now + 0.025);
    envelope.gain.exponentialRampToValueAtTime(SILENCE_LEVEL, now + 1.2);
    delay.delayTime.value = 0.32;
    feedback.gain.value = 0.18;
    wet.gain.value = 0.18;
    oscillator.connect(envelope);
    envelope.connect(musicBus);
    envelope.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(musicBus);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      delay.disconnect();
      feedback.disconnect();
      wet.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + 1.25);
  };

  const scheduleNote = () => {
    if (!enabled || !context || context.state !== 'running') return;
    const delay = 1600 + Math.random() * 1600;
    noteTimer = window.setTimeout(() => {
      noteTimer = undefined;
      playNote();
      scheduleNote();
    }, delay);
  };

  const initialize = (ctx: AudioContext) => {
    context = ctx;
    master = ctx.createGain();
    musicBus = ctx.createGain();
    effectsBus = ctx.createGain();
    master.gain.value = 0;
    musicBus.gain.value = 0.05;
    effectsBus.gain.value = 0.22;
    master.connect(ctx.destination);
    musicBus.connect(master);
    effectsBus.connect(master);

    const lowpass = ctx.createBiquadFilter();
    const droneGain = ctx.createGain();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;
    droneGain.gain.value = 0.09;
    lowpass.connect(droneGain);
    droneGain.connect(musicBus);

    for (const [frequency, detune] of [
      [73.42, -3],
      [110, 3],
    ]) {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency!;
      oscillator.detune.value = detune!;
      oscillator.connect(lowpass);
      oscillator.start();
      droneNodes.push(oscillator);
    }

    const swell = ctx.createOscillator();
    const swellDepth = ctx.createGain();
    swell.type = 'sine';
    swell.frequency.value = 0.1;
    swellDepth.gain.value = 0.035;
    swell.connect(swellDepth);
    swellDepth.connect(droneGain.gain);
    swell.start();
    droneNodes.push(swell);

    const bufferLength = Math.ceil(ctx.sampleRate * 0.55);
    noiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noise.length; index += 1) noise[index] = Math.random() * 2 - 1;

    visibilityListener = () => {
      if (document.hidden) {
        stopScheduling();
        rampMaster(0, 0.2);
        suspendAfterFade();
      } else if (enabled) {
        void resume();
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
  };

  const ensureContext = (): AudioContext | null => {
    if (context) return context;
    if (unavailable || disposed) return null;
    try {
      initialize(ctxFactory());
      return context;
    } catch {
      unavailable = true;
      return null;
    }
  };

  const resume = async () => {
    const ctx = ensureContext();
    if (!ctx || disposed) return;
    if (suspendTimer !== undefined) window.clearTimeout(suspendTimer);
    suspendTimer = undefined;
    try {
      await ctx.resume();
    } catch {
      return;
    }
    if (enabled && !document.hidden) {
      rampMaster(1, 0.2);
      scheduleNote();
    }
  };

  const playEffect = (kind: 'hit' | 'sink') => {
    if (!enabled || !context || !effectsBus || !noiseBuffer || context.state !== 'running') return;
    const duration = kind === 'sink' ? 0.525 : 0.35;
    const now = context.currentTime;
    const filter = context.createBiquadFilter();
    const noiseEnvelope = context.createGain();
    const source = context.createBufferSource();
    const thump = context.createOscillator();
    const thumpEnvelope = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);
    noiseEnvelope.gain.setValueAtTime(SILENCE_LEVEL, now);
    noiseEnvelope.gain.linearRampToValueAtTime(1, now + 0.012);
    noiseEnvelope.gain.exponentialRampToValueAtTime(SILENCE_LEVEL, now + duration);
    source.buffer = noiseBuffer;
    source.connect(filter);
    filter.connect(noiseEnvelope);
    noiseEnvelope.connect(effectsBus);
    thump.type = 'sine';
    thump.frequency.setValueAtTime(kind === 'sink' ? 70 : 90, now);
    thump.frequency.exponentialRampToValueAtTime(kind === 'sink' ? 35 : 45, now + duration);
    thumpEnvelope.gain.setValueAtTime(SILENCE_LEVEL, now);
    thumpEnvelope.gain.linearRampToValueAtTime(0.75, now + 0.012);
    thumpEnvelope.gain.exponentialRampToValueAtTime(SILENCE_LEVEL, now + duration);
    thump.connect(thumpEnvelope);
    thumpEnvelope.connect(effectsBus);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      noiseEnvelope.disconnect();
    };
    thump.onended = () => {
      thump.disconnect();
      thumpEnvelope.disconnect();
    };
    source.start(now);
    source.stop(now + duration);
    thump.start(now);
    thump.stop(now + duration);
  };

  return {
    setEnabled(on) {
      if (disposed) return;
      enabled = on;
      if (!on) {
        stopScheduling();
        rampMaster(0, 0.2);
        if (context) suspendAfterFade();
        return;
      }
      void resume();
    },
    playHit() {
      playEffect('hit');
    },
    playSink() {
      playEffect('sink');
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      enabled = false;
      stopScheduling();
      if (suspendTimer !== undefined) window.clearTimeout(suspendTimer);
      suspendTimer = undefined;
      if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener);
      for (const oscillator of droneNodes) {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {
          continue;
        }
      }
      if (context) void context.close().catch(() => {});
      context = null;
    },
  };
}
