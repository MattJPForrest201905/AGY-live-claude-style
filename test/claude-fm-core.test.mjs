import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fmCore = require('../claude-fm-core.js');

function createMockCtx() {
  const ops = [];
  return {
    ops,
    globalAlpha: 1,
    fillStyle: '',
    font: '',
    textBaseline: 'top',
    imageSmoothingEnabled: true,
    save() { ops.push(['save']); },
    restore() { ops.push(['restore']); },
    setTransform(...args) { ops.push(['setTransform', ...args]); },
    fillRect(x, y, w, h) { ops.push(['fillRect', this.fillStyle, x, y, w, h]); },
    fillText(ch, x, y) { ops.push(['fillText', ch, this.fillStyle, x, y]); },
  };
}

function createMockCanvas(ctx) {
  return {
    width: 0,
    height: 0,
    style: {},
    getContext(type) { return type === '2d' ? ctx : null; },
  };
}

test('normalization helpers and YouTube embed URL / command builders stay accurate', () => {
  assert.equal(fmCore.CLAUDE_FM_VIDEO_ID, 'tRsQsTMvPNg');
  assert.equal(fmCore.CLAUDE_FM_WATCH_URL, 'https://www.youtube.com/live/tRsQsTMvPNg');

  assert.equal(fmCore.normalizeLiveBackground('claude-fm'), 'claude-fm');
  assert.equal(fmCore.normalizeLiveBackground('youtube'), 'youtube');
  assert.equal(fmCore.normalizeLiveBackground('ripple'), 'ripple');
  assert.equal(fmCore.normalizeLiveBackground('off'), 'off');
  assert.equal(fmCore.normalizeLiveBackground('unknown'), 'claude-fm');
  assert.equal(fmCore.normalizeLiveBackground(undefined, false), 'off');

  assert.equal(fmCore.normalizeAudioSource('synth'), 'synth');
  assert.equal(fmCore.normalizeAudioSource('youtube'), 'youtube');
  assert.equal(fmCore.normalizeAudioSource('bogus'), 'youtube');

  assert.equal(fmCore.clampVolume(-10), 0);
  assert.equal(fmCore.clampVolume(150), 100);
  assert.equal(fmCore.clampVolume('abc'), 55);
  assert.equal(fmCore.clampVolume(72.6), 73);

  const url = fmCore.buildYouTubeEmbedUrl({ autoplay: true, mute: true, origin: 'https://example.com' });
  assert.ok(url.startsWith('https://www.youtube-nocookie.com/embed/tRsQsTMvPNg?'));
  assert.ok(url.includes('autoplay=1'));
  assert.ok(url.includes('mute=1'));
  assert.ok(url.includes('enablejsapi=1'));
  assert.ok(url.includes('playlist=tRsQsTMvPNg'));
  assert.ok(url.includes('origin=https%3A%2F%2Fexample.com'));

  const cmd = JSON.parse(fmCore.buildYouTubeCommand('setVolume', [42]));
  assert.deepEqual(cmd, { event: 'command', func: 'setVolume', args: [42] });
});

test('resolveClaudeFmPalette provides authentic parchment light and obsidian/claude dark palettes', () => {
  const light = fmCore.resolveClaudeFmPalette('claude', false);
  assert.equal(light.sky, '#ECEAE0');
  assert.equal(light.mascotBody, '#D97757');
  assert.equal(light.cliff, '#151513');

  const obsDark = fmCore.resolveClaudeFmPalette('obsidian', true);
  assert.equal(obsDark.sky, '#13161d');
  assert.equal(obsDark.mascotBody, '#D97757');
  assert.equal(obsDark.accent, '#4D6BFE');

  const claudeDark = fmCore.resolveClaudeFmPalette('claude', true);
  assert.equal(claudeDark.sky, '#191816');
  assert.equal(claudeDark.accent, '#D97757');
});

test('createClaudeFmScene renders ASCII landscape, Clawd sprite, headphones on audioActive, gusts, and handles zero-size & reduced motion', () => {
  const ctx = createMockCtx();
  const canvas = createMockCanvas(ctx);
  let reduced = false;
  const scene = fmCore.createClaudeFmScene(canvas, {
    palette: 'claude',
    isDark: false,
    audioActive: false,
    reducedMotion: () => reduced,
  });

  // Zero-size resilience
  scene.resize(0, 0, 1);
  assert.doesNotThrow(() => scene.renderFrame(0));
  assert.equal(ctx.ops.length, 0);

  // Full 16:9 viewport render
  scene.resize(960, 540, 2);
  assert.equal(canvas.width, 1920);
  assert.equal(canvas.height, 1080);

  scene.renderFrame(1.25);
  const skyFill = ctx.ops.find((op) => op[0] === 'fillRect' && op[1] === '#ECEAE0');
  assert.ok(skyFill, 'sky fills with Claude FM parchment #ECEAE0');

  const mascotPixel = ctx.ops.find((op) => op[0] === 'fillRect' && op[1] === '#D97757');
  assert.ok(mascotPixel, 'renders terracotta Clawd traveler body');

  const cliffPixel = ctx.ops.find((op) => op[0] === 'fillRect' && op[1] === '#151513');
  assert.ok(cliffPixel, 'renders foreground #151513 silhouettes');

  const textOps = ctx.ops.filter((op) => op[0] === 'fillText').map((op) => op[1]);
  assert.ok(textOps.length > 50, 'renders ASCII cloud/terrain glyphs');
  assert.equal(textOps.includes('♪'), false, 'no music notes when audioActive is false');

  // Audio active adds headphones & music notes
  ctx.ops.length = 0;
  scene.setAudioActive(true);
  const audioTextOps = ctx.ops.filter((op) => op[0] === 'fillText').map((op) => op[1]);
  assert.ok(audioTextOps.includes('♪') || audioTextOps.includes('♫'), 'renders music notes when audioActive is true');

  // Wind gust and pause/resume controls
  assert.equal(scene.isPaused(), false);
  scene.pause();
  assert.equal(scene.isPaused(), true);
  scene.triggerGust(400, 300);
  scene.resume();
  assert.equal(scene.isPaused(), false);

  // Reduced motion respects static frame mode
  reduced = true;
  assert.doesNotThrow(() => scene.start());
  assert.doesNotThrow(() => scene.dispose());
});

test('createClaudeFmScene tolerates null 2D context gracefully', () => {
  const nullCanvas = { width: 0, height: 0, style: {}, getContext: () => null };
  const scene = fmCore.createClaudeFmScene(nullCanvas);
  assert.doesNotThrow(() => {
    scene.resize(800, 600, 1);
    scene.start();
    scene.triggerGust(10, 10);
    scene.setPalette('obsidian', true);
    scene.setAudioActive(true);
    scene.pause();
    scene.resume();
    scene.dispose();
  });
});

test('createAmbientSynthEngine plays, adjusts volume/mute, pauses, disposes, and degrades safely without AudioContext', () => {
  // No AudioContext available
  const noopSynth = fmCore.createAmbientSynthEngine({});
  assert.equal(noopSynth.play(), false);
  assert.doesNotThrow(() => {
    noopSynth.setVolume(80);
    noopSynth.setMuted(true);
    noopSynth.pause();
    noopSynth.dispose();
  });

  // Mocked Web Audio API
  let closed = false;
  const createdOscs = [];
  class MockAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 0;
      this.destination = {};
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    close() {
      closed = true;
      return Promise.resolve();
    }
    createBiquadFilter() {
      return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect() {}, disconnect() {} };
    }
    createGain() {
      return {
        gain: {
          value: 0,
          cancelScheduledValues() {},
          setTargetAtTime(v) { this.value = v; },
          setValueAtTime(v) { this.value = v; },
          linearRampToValueAtTime(v) { this.value = v; },
        },
        connect() {},
        disconnect() {},
      };
    }
    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: { value: 0 },
        detune: { value: 0 },
        started: false,
        stopped: false,
        connect() {},
        start() { this.started = true; },
        stop() { this.stopped = true; },
        disconnect() {},
      };
      createdOscs.push(osc);
      return osc;
    }
  }

  const synth = fmCore.createAmbientSynthEngine({ AudioContext: MockAudioContext });
  assert.equal(synth.play(), true);
  assert.equal(synth.isPlaying(), true);
  assert.ok(createdOscs.length >= 5, 'schedules polyphonic Rhodes chord voices');
  synth.setVolume(30);
  assert.equal(synth.getVolume(), 30);
  synth.setMuted(true);
  assert.equal(synth.isMuted(), true);
  synth.pause();
  assert.equal(synth.isPlaying(), false);
  synth.dispose();
  assert.equal(closed, true);
});
