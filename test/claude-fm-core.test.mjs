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

test('normalization helpers, scene resolution, and YouTube URL/command builders stay accurate', () => {
  assert.equal(fmCore.CLAUDE_FM_VIDEO_ID, 'tRsQsTMvPNg');
  assert.equal(fmCore.CLAUDE_FM_WATCH_URL, 'https://www.youtube.com/live/tRsQsTMvPNg');
  assert.deepEqual(fmCore.CLAUDE_FM_SCENES, [
    'auto',
    'valley',
    'rainy-city',
    'alpine-stars',
    'ocean-lighthouse',
    'sakura-trail',
  ]);

  assert.equal(fmCore.normalizeLiveBackground('claude-fm'), 'claude-fm');
  assert.equal(fmCore.normalizeLiveBackground('youtube'), 'youtube');
  assert.equal(fmCore.normalizeLiveBackground('ripple'), 'ripple');
  assert.equal(fmCore.normalizeLiveBackground('off'), 'off');
  assert.equal(fmCore.normalizeLiveBackground('unknown'), 'claude-fm');
  assert.equal(fmCore.normalizeLiveBackground(undefined, false), 'off');

  assert.equal(fmCore.normalizeAudioSource('synth'), 'synth');
  assert.equal(fmCore.normalizeAudioSource('youtube'), 'youtube');
  assert.equal(fmCore.normalizeAudioSource('bogus'), 'youtube');

  for (const sc of fmCore.CLAUDE_FM_SCENES) {
    assert.equal(fmCore.normalizeScene(sc), sc);
  }
  assert.equal(fmCore.normalizeScene('invalid-scene'), 'auto');

  assert.deepEqual(fmCore.resolveSceneAtTime('rainy-city', 12), {
    primary: 'rainy-city',
    secondary: null,
    blend: 0,
  });
  assert.deepEqual(fmCore.resolveSceneAtTime('auto', 5), {
    primary: 'valley',
    secondary: null,
    blend: 0,
  });
  const fade = fmCore.resolveSceneAtTime('auto', 44.25);
  assert.equal(fade.primary, 'valley');
  assert.equal(fade.secondary, 'rainy-city');
  assert.ok(fade.blend > 0 && fade.blend < 1);
  assert.deepEqual(fmCore.resolveSceneAtTime('auto', 45), {
    primary: 'rainy-city',
    secondary: null,
    blend: 0,
  });

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
  assert.ok(light.petalInk && light.windowGlow && light.beamInk);

  const obsDark = fmCore.resolveClaudeFmPalette('obsidian', true);
  assert.equal(obsDark.sky, '#13161d');
  assert.equal(obsDark.mascotBody, '#D97757');
  assert.equal(obsDark.accent, '#4D6BFE');

  const claudeDark = fmCore.resolveClaudeFmPalette('claude', true);
  assert.equal(claudeDark.sky, '#191919');
  assert.equal(claudeDark.accent, '#D97757');
});

test('createClaudeFmScene renders all 5 distinct scenes, Clawd variants, auto crossfades, and gusts cleanly', () => {
  const ctx = createMockCtx();
  const canvas = createMockCanvas(ctx);
  let reduced = false;
  const scene = fmCore.createClaudeFmScene(canvas, {
    palette: 'claude',
    scene: 'valley',
    isDark: false,
    audioActive: false,
    reducedMotion: () => reduced,
  });

  // Zero-size resilience
  scene.resize(0, 0, 1);
  assert.doesNotThrow(() => scene.renderFrame(0));
  assert.equal(ctx.ops.length, 0);

  // Full 16:9 viewport render across all 5 scenes
  scene.resize(960, 540, 2);
  assert.equal(canvas.width, 1920);
  assert.equal(canvas.height, 1080);

  const expectedGlyphsByScene = {
    valley: (glyphs) => glyphs.includes('█') && (glyphs.includes('/') || glyphs.includes('≡')),
    'rainy-city': (glyphs) => glyphs.includes('▪') && glyphs.includes('/'),
    'alpine-stars': (glyphs) => glyphs.includes('✦') && glyphs.includes('^'),
    'ocean-lighthouse': (glyphs) => glyphs.includes('~') && glyphs.includes('◉'),
    'sakura-trail': (glyphs) => (glyphs.includes('❀') || glyphs.includes('✿')) && glyphs.includes('╤'),
  };

  for (const scId of fmCore.SCENE_CYCLE_ORDER) {
    ctx.ops.length = 0;
    scene.setScene(scId);
    assert.equal(scene.getScene(), scId);
    assert.equal(scene.getActiveSceneId(), scId);
    scene.renderFrame(1.25);

    const mascotPixel = ctx.ops.find((op) => op[0] === 'fillRect' && op[1] === '#D97757');
    assert.ok(mascotPixel, `renders terracotta Clawd traveler in ${scId}`);

    const textGlyphs = ctx.ops.filter((op) => op[0] === 'fillText').map((op) => op[1]);
    assert.ok(textGlyphs.length > 40, `renders rich ASCII scene glyphs in ${scId}`);
    assert.ok(expectedGlyphsByScene[scId](textGlyphs), `scene ${scId} renders its signature ASCII motifs`);
  }

  // Auto-cycle crossfade at t=44.25s blends valley -> rainy-city without throwing
  scene.setScene('auto');
  ctx.ops.length = 0;
  assert.doesNotThrow(() => scene.renderFrame(44.25));
  const fadeAlphas = ctx.ops.filter((op) => op[0] === 'fillRect').length;
  assert.ok(fadeAlphas > 10);

  // Audio active adds headphones & music notes
  scene.setScene('valley');
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
    scene.setScene('sakura-trail');
    scene.setAudioActive(true);
    scene.pause();
    scene.resume();
    scene.dispose();
  });
});

test('createAmbientSynthEngine plays, adjusts volume/mute, pauses, disposes, and degrades safely without AudioContext', () => {
  const noopSynth = fmCore.createAmbientSynthEngine({});
  assert.equal(noopSynth.play(), false);
  assert.doesNotThrow(() => {
    noopSynth.setVolume(80);
    noopSynth.setMuted(true);
    noopSynth.pause();
    noopSynth.dispose();
  });

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
