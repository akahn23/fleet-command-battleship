import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSoundscape, isSoundAvailable } from './soundscape';

class FakeParam {
  value = 0;
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }
  cancelScheduledValues() {}
}

class FakeNode {
  connect() {}
  disconnect() {}
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  detune = new FakeParam();
  onended: (() => void) | null = null;
  start() {}
  stop() {
    this.onended?.();
  }
}

class FakeBufferSource extends FakeNode {
  buffer: FakeBuffer | null = null;
  onended: (() => void) | null = null;
  start() {}
  stop() {
    this.onended?.();
  }
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
}

class FakeBuffer {
  private readonly data: Float32Array;
  constructor(length: number) {
    this.data = new Float32Array(length);
  }
  getChannelData() {
    return this.data;
  }
}

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 1000;
  destination = new FakeNode();
  bufferCount = 0;
  bufferSources: FakeBufferSource[] = [];
  suspendCount = 0;
  resumeCount = 0;
  closeCount = 0;
  createGain() {
    return new FakeGain();
  }
  createOscillator() {
    return new FakeOscillator();
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  createDelay() {
    return Object.assign(new FakeNode(), { delayTime: new FakeParam() });
  }
  createBuffer() {
    this.bufferCount += 1;
    return new FakeBuffer(550) as unknown as AudioBuffer;
  }
  createBufferSource() {
    const source = new FakeBufferSource();
    this.bufferSources.push(source);
    return source;
  }
  resume() {
    this.resumeCount += 1;
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.suspendCount += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close() {
    this.closeCount += 1;
    this.state = 'closed';
    return Promise.resolve();
  }
}

const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');

afterEach(() => {
  if (matchMediaDescriptor) Object.defineProperty(window, 'matchMedia', matchMediaDescriptor);
  else Reflect.deleteProperty(window, 'matchMedia');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('isSoundAvailable', () => {
  it('returns false for a coarse primary pointer', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    expect(isSoundAvailable()).toBe(false);
  });

  it('returns true for a fine primary pointer', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

    expect(isSoundAvailable()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(pointer: coarse)');
  });

  it('defaults to available when matchMedia is missing', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });

    expect(isSoundAvailable()).toBe(true);
  });
});

describe('createSoundscape', () => {
  it('does not create a context while disabled and lazily creates one when enabled', async () => {
    const context = new FakeAudioContext();
    const factory = vi.fn(() => context as unknown as AudioContext);
    const soundscape = createSoundscape(factory);

    soundscape.setEnabled(false);
    soundscape.playHit();
    expect(factory).not.toHaveBeenCalled();

    soundscape.setEnabled(true);
    await Promise.resolve();
    soundscape.playHit();
    soundscape.playSink();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(context.bufferCount).toBe(1);
    expect(context.bufferSources).toHaveLength(2);

    soundscape.dispose();
    expect(context.closeCount).toBe(1);
  });

  it('suspends the context after the disable fade and silently handles unavailable audio', async () => {
    vi.useFakeTimers();
    const context = new FakeAudioContext();
    const soundscape = createSoundscape(() => context as unknown as AudioContext);
    soundscape.setEnabled(true);
    await Promise.resolve();
    soundscape.setEnabled(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(context.suspendCount).toBe(1);
    soundscape.dispose();

    const unavailable = createSoundscape(() => {
      throw new Error('AudioContext unavailable');
    });
    expect(() => {
      unavailable.setEnabled(true);
      unavailable.playHit();
      unavailable.playSink();
    }).not.toThrow();
    unavailable.dispose();
  });

  it('suspends while hidden and resumes when the visible tab returns', async () => {
    vi.useFakeTimers();
    let hidden = false;
    const previous = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    const context = new FakeAudioContext();
    const soundscape = createSoundscape(() => context as unknown as AudioContext);

    soundscape.setEnabled(true);
    await Promise.resolve();
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(200);
    expect(context.suspendCount).toBe(1);

    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(context.resumeCount).toBe(2);
    soundscape.dispose();

    if (previous) Object.defineProperty(document, 'hidden', previous);
    else Reflect.deleteProperty(document, 'hidden');
  });
});
