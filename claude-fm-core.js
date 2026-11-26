(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.__agCsClaudeFmCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const CLAUDE_FM_VIDEO_ID = 'tRsQsTMvPNg';
  const CLAUDE_FM_WATCH_URL = 'https://www.youtube.com/live/tRsQsTMvPNg';
  const LIVE_BG_MODES = ['claude-fm', 'youtube', 'ripple', 'off'];
  const AUDIO_SOURCES = ['youtube', 'synth'];
  const CLAUDE_FM_SCENES = [
    'auto',
    'valley',
    'rainy-city',
    'alpine-stars',
    'ocean-lighthouse',
    'sakura-trail',
    'midnight-train',
    'desert-dunes',
    'cyber-harbor',
    'lantern-forest',
  ];
  const SCENE_CYCLE_ORDER = [
    'valley',
    'rainy-city',
    'alpine-stars',
    'ocean-lighthouse',
    'sakura-trail',
    'midnight-train',
    'desert-dunes',
    'cyber-harbor',
    'lantern-forest',
  ];
  const SCENE_CYCLE_SECONDS = 45;
  const SCENE_CROSSFADE_SECONDS = 1.5;

  const DEFAULT_CELL_W = 8;
  const DEFAULT_CELL_H = 15;
  const DEFAULT_FONT_SIZE = 11;
  const TARGET_FPS = 24;

  function normalizeLiveBackground(value, legacyHomeRipple) {
    if (typeof value === 'string' && LIVE_BG_MODES.includes(value)) return value;
    if (legacyHomeRipple === false && value === undefined) return 'off';
    return 'claude-fm';
  }

  function normalizeAudioSource(value) {
    return value === 'synth' ? 'synth' : 'youtube';
  }

  function normalizeScene(value) {
    if (typeof value === 'string' && CLAUDE_FM_SCENES.includes(value)) return value;
    return 'auto';
  }

  function resolveSceneAtTime(sceneMode, timeSec = 0) {
    const mode = normalizeScene(sceneMode);
    if (mode !== 'auto') {
      return { primary: mode, secondary: null, blend: 0 };
    }
    const t = Math.max(0, Number(timeSec) || 0);
    const total = SCENE_CYCLE_ORDER.length;
    const idx = Math.floor(t / SCENE_CYCLE_SECONDS) % total;
    const inCycle = t % SCENE_CYCLE_SECONDS;
    const fadeStart = SCENE_CYCLE_SECONDS - SCENE_CROSSFADE_SECONDS;
    if (inCycle > fadeStart) {
      const raw = Math.max(0, Math.min(1, (inCycle - fadeStart) / SCENE_CROSSFADE_SECONDS));
      const blend = raw * raw * (3 - 2 * raw);
      return {
        primary: SCENE_CYCLE_ORDER[idx],
        secondary: SCENE_CYCLE_ORDER[(idx + 1) % total],
        blend,
      };
    }
    return { primary: SCENE_CYCLE_ORDER[idx], secondary: null, blend: 0 };
  }

  function clampVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 55;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function buildYouTubeEmbedUrl(opts = {}) {
    const videoId = String(opts.videoId || CLAUDE_FM_VIDEO_ID).trim() || CLAUDE_FM_VIDEO_ID;
    const autoplay = opts.autoplay ? '1' : '0';
    const mute = opts.mute ? '1' : '0';
    const params = [
      `autoplay=${autoplay}`,
      `mute=${mute}`,
      'enablejsapi=1',
      'playsinline=1',
      'rel=0',
      'modestbranding=1',
      'controls=0',
      'disablekb=1',
      'fs=0',
      'iv_load_policy=3',
      'loop=1',
      `playlist=${encodeURIComponent(videoId)}`,
    ];
    if (opts.origin && /^https?:\/\//i.test(opts.origin)) {
      params.push(`origin=${encodeURIComponent(opts.origin)}`);
    }
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.join('&')}`;
  }

  function buildYouTubeCommand(func, args = []) {
    return JSON.stringify({
      event: 'command',
      func: String(func || ''),
      args: Array.isArray(args) ? args : [args],
    });
  }

  function buildYouTubeListeningMessage(id = 1) {
    const numericId = Number(id);
    return JSON.stringify({
      event: 'listening',
      id: Number.isFinite(numericId) ? numericId : 1,
      channel: 'widget',
    });
  }

  function resolveClaudeFmPalette(paletteName, isDark) {
    const dark = Boolean(isDark);
    if (!dark) {
      // Authentic warm parchment Claude FM daylight palette (matches tRsQsTMvPNg)
      return {
        isDark: false,
        sky: paletteName === 'obsidian' ? '#eaecf0' : '#ECEAE0',
        skyTop: paletteName === 'obsidian' ? '#dfe3ea' : '#E3E0D4',
        skyHorizon: paletteName === 'obsidian' ? '#f2f4f8' : '#F4F1E7',
        skyGlow: paletteName === 'obsidian' ? '#cfdcf6' : '#F6DEC1',
        glyphInk: '#1B1B18',
        glyphMuted: '#68655C',
        glyphWind: '#4B4942',
        cliff: '#151513',
        cliffPocket: '#3D3B35',
        valleyMid: '#A69F8F',
        valleyFg: '#8E8878',
        valleyFgPocket: '#B8B2A3',
        sakuraFg: '#C9B3AE',
        sakuraFgPocket: '#DFCCC7',
        toriiInk: '#C84B31',
        pierDeck: '#7D6F5D',
        pierPiling: '#5A4F42',
        mascotBody: '#D97757',
        mascotShade: '#BD6347',
        mascotEye: '#111110',
        bedroll: '#B38046',
        pack: '#7E522B',
        packDark: '#4E3118',
        staff: '#5C3B1E',
        scarfInk: paletteName === 'obsidian' ? '#4D6BFE' : '#C84B31',
        headphones: '#23221F',
        headphonePad: '#D97757',
        noteInk: '#1B1B18',
        accent: paletteName === 'obsidian' ? '#4D6BFE' : '#D97757',
        windowGlow: '#D97757',
        rainInk: paletteName === 'obsidian' ? '#3B6ECF' : '#4C5E73',
        starInk: '#3D3B35',
        moonInk: '#8B622F',
        lanternGlow: '#E89535',
        beamInk: '#C48A34',
        petalInk: '#D97757',
        petalAlt: '#C85E6E',
        umbrellaTop: '#D97757',
        umbrellaTrim: '#1B1B18',
        waterInk: '#4A5D70',
        roofInk: '#2E2B27',
        auroraA: '#3B8276',
        auroraB: '#4D6BFE',
        snowInk: '#4A515E',
        cabinGlow: '#E07B39',
        neonCyan: '#0C7A8C',
        neonPink: '#C4426C',
        neonAmber: '#D47824',
        visorGlow: '#19A8B8',
        duneSun: '#DE6F49',
        duneLight: '#C7A882',
        duneMid: '#A4835E',
        duneShade: '#6E543A',
        duneMist: '#C99A6B',
        trainBody: '#2A2825',
        trainLight: '#E8963C',
        bridgeInk: '#3D3A34',
        signalGlow: '#D95A40',
        bambooInk: '#3D5C43',
        bambooBright: '#5D8362',
        fireflyGlow: '#D68C24',
        lanternPaper: '#E57E45',
      };
    }
    if (paletteName === 'obsidian') {
      return {
        isDark: true,
        sky: '#13161d',
        skyTop: '#0b0e15',
        skyHorizon: '#1c2333',
        skyGlow: '#293757',
        glyphInk: '#98a6be',
        glyphMuted: '#58647d',
        glyphWind: '#798aa6',
        cliff: '#06080d',
        cliffPocket: '#2b3446',
        valleyMid: '#242d3e',
        valleyFg: '#080b12',
        valleyFgPocket: '#2b3446',
        sakuraFg: '#16121d',
        sakuraFgPocket: '#2e2438',
        toriiInk: '#EB785E',
        pierDeck: '#364155',
        pierPiling: '#181f2c',
        mascotBody: '#D97757',
        mascotShade: '#BD6347',
        mascotEye: '#111110',
        bedroll: '#C89254',
        pack: '#8B5A32',
        packDark: '#4A2D16',
        staff: '#744A26',
        scarfInk: '#6F8BFF',
        headphones: '#E6ECF7',
        headphonePad: '#4D6BFE',
        noteInk: '#8FA4FF',
        accent: '#4D6BFE',
        windowGlow: '#F2C166',
        rainInk: '#7FA6FF',
        starInk: '#DCE7FF',
        moonInk: '#F6E3A1',
        lanternGlow: '#FFC45C',
        beamInk: '#F6DC88',
        petalInk: '#F497A6',
        petalAlt: '#E89578',
        umbrellaTop: '#4D6BFE',
        umbrellaTrim: '#DCE7FF',
        waterInk: '#6E8EC2',
        roofInk: '#1E2534',
        auroraA: '#4EE2B8',
        auroraB: '#7C96FF',
        snowInk: '#D6E2F5',
        cabinGlow: '#FFC45C',
        neonCyan: '#4FE6E0',
        neonPink: '#FF6B9D',
        neonAmber: '#FFB85C',
        visorGlow: '#5FF7F0',
        duneSun: '#F08A5D',
        duneLight: '#B58A60',
        duneMid: '#7E5A3E',
        duneShade: '#3B281B',
        duneMist: '#D99562',
        trainBody: '#181F2D',
        trainLight: '#FFD073',
        bridgeInk: '#2B364C',
        signalGlow: '#FF785A',
        bambooInk: '#234036',
        bambooBright: '#528E76',
        fireflyGlow: '#B9F27C',
        lanternPaper: '#FF9D5C',
      };
    }
    // Claude charcoal dark / host dark (exact match to --ag-cs-canvas #191919)
    return {
      isDark: true,
      sky: '#191919',
      skyTop: '#121110',
      skyHorizon: '#24211D',
      skyGlow: '#362B22',
      glyphInk: '#9c968a',
      glyphMuted: '#534e47',
      glyphWind: '#7d776c',
      cliff: '#0e0d0c',
      cliffPocket: '#2c2925',
      valleyMid: '#2e2a25',
      valleyFg: '#100f0e',
      valleyFgPocket: '#2c2925',
      sakuraFg: '#1c1619',
      sakuraFgPocket: '#35282e',
      toriiInk: '#E37356',
      pierDeck: '#3b352e',
      pierPiling: '#221f1b',
      mascotBody: '#D97757',
      mascotShade: '#BD6347',
      mascotEye: '#111110',
      bedroll: '#C89254',
      pack: '#8B5A32',
      packDark: '#4A2D16',
      staff: '#744A26',
      scarfInk: '#E57E5C',
      headphones: '#F3EFE6',
      headphonePad: '#D97757',
      noteInk: '#E89578',
      accent: '#D97757',
      windowGlow: '#F0B35E',
      rainInk: '#9AB4D6',
      starInk: '#F3EFE6',
      moonInk: '#F4DC9A',
      lanternGlow: '#FFB952',
      beamInk: '#F5D57C',
      petalInk: '#F2A2AE',
      petalAlt: '#D97757',
      umbrellaTop: '#D97757',
      umbrellaTrim: '#F3EFE6',
      waterInk: '#7F94A8',
      roofInk: '#262320',
      auroraA: '#68C9A4',
      auroraB: '#E08C6A',
      snowInk: '#EAE4D7',
      cabinGlow: '#FFB952',
      neonCyan: '#62D4C9',
      neonPink: '#EE7688',
      neonAmber: '#F4B25B',
      visorGlow: '#7CEEE2',
      duneSun: '#E57F56',
      duneLight: '#B58D65',
      duneMid: '#7B5C41',
      duneShade: '#3A2A1E',
      duneMist: '#D98F62',
      trainBody: '#1E1B18',
      trainLight: '#FFC966',
      bridgeInk: '#3A332C',
      signalGlow: '#EB6F52',
      bambooInk: '#2A3F2F',
      bambooBright: '#608B68',
      fireflyGlow: '#DFD66E',
      lanternPaper: '#F29252',
    };
  }

  function hexToRgba(hex, alpha) {
    const clean = String(hex || '').replace('#', '');
    if (clean.length !== 6) return `rgba(217, 119, 87, ${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(217, 119, 87, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  // Deterministic integer hash in [0, 1)
  function hash2(a, b) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function valueNoise1(x, seed) {
    const x0 = Math.floor(x);
    const fx = x - x0;
    const s = fx * fx * (3 - 2 * fx);
    const a = hash2(x0, seed);
    const b = hash2(x0 + 1, seed);
    return a + (b - a) * s;
  }

  function fbm1(x, seed) {
    return (
      valueNoise1(x, seed) * 0.56 +
      valueNoise1(x * 2.13 + 7.4, seed + 19) * 0.29 +
      valueNoise1(x * 4.41 + 13.7, seed + 43) * 0.15
    );
  }

  function valueNoise2(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = hash2(x0 + seed * 31, y0);
    const n10 = hash2(x0 + 1 + seed * 31, y0);
    const n01 = hash2(x0 + seed * 31, y0 + 1);
    const n11 = hash2(x0 + 1 + seed * 31, y0 + 1);
    const top = n00 + (n10 - n00) * sx;
    const bot = n01 + (n11 - n01) * sx;
    return top + (bot - top) * sy;
  }

  // Pre-authored asymmetric slashed ASCII cloud clusters inspired by Claude FM (tRsQsTMvPNg)
  const CLOUD_BANKS = [
    {
      xFrac: 0.42,
      yFrac: 0.03,
      speed: 0.34,
      rows: [
        "          .-'/\\        ",
        "         /  | '|       ",
        "    ..'  /   :/ |      ",
        "   /  :   ..  | )      ",
        " .-|  /  /\\  /  /      ",
        " '--\\/--'//\\-'_/       ",
        "    '--'  \\  \\         ",
        "           '-'         ",
      ],
    },
    {
      xFrac: 0.56,
      yFrac: 0.11,
      speed: 0.29,
      rows: [
        "   ,-\\  /\\             ",
        "  </  \\/  \\            ",
        "   \\  /\\  /            ",
        "    '-\\/-'             ",
      ],
    },
    {
      xFrac: 0.07,
      yFrac: 0.14,
      speed: 0.24,
      rows: [
        "  .  -  _..--/         ",
        "   /((<\\   .:| \\       ",
        " </  /\\ \\  /\\  \\ /\\    ",
        "   '-/--\\-'--\\--'/     ",
      ],
    },
    {
      xFrac: 0.64,
      yFrac: 0.17,
      speed: 0.27,
      rows: [
        "      .>  --/          ",
        "   ./||| -/>  -/•      ",
        "  /-///-/.//-- <>--    ",
        "    ---/--             ",
      ],
    },
    {
      xFrac: 0.38,
      yFrac: 0.27,
      speed: 0.21,
      rows: [
        "  -// •   /  /-•/      ",
        " •/ //  //--/   /-/    ",
      ],
    },
    {
      xFrac: 0.87,
      yFrac: 0.05,
      speed: 0.19,
      rows: [
        "   --/-/               ",
        "  /•-•/-/ \\•           ",
        "  //  /-/              ",
      ],
    },
  ];

  // 22x14 pixel-art matrix for Clawd traveler (facing right, closely matched to tRsQsTMvPNg)
  const MASCOT_BASE = [
    '....DOOOOOOOD.........',
    '...DOODDOOOOD.........',
    '...PPDBBBBBBBBBBB.....',
    '..PPPDBBBBBBBBBBB.....',
    '..PPPDBBBBBBEBBBBE....',
    '..PPPDBBBBBBBBBBBB....',
    '..PPPDBBBBBBBBBBBBB...',
    '..PPPDBBBBBBBBBBBBB...',
    '..PPPDBBBBBBBBBBBBR...',
    '...PPDRRRRRRRRRRRR....',
    '....DRBBBBBBBBBBBR....',
  ];

  const LEG_FRAMES = [
    [
      '.....BB.BB...BB.BB....',
      '.....RR.RR...RR.RR....',
      '.....RR.RR...RR.RR....',
    ],
    [
      '....BB..BB..BB..BB....',
      '....RR...RR.RR...RR...',
      '....RR...RR.RR...RR...',
    ],
    [
      '.....BB.BB...BB.BB....',
      '.....RR.RR...RR.RR....',
      '.....RR.RR...RR.RR....',
    ],
    [
      '......BB.BB.BB..BB....',
      '.....RR..RR..RR..RR...',
      '.....RR..RR..RR..RR...',
    ],
  ];

  const WIND_GLYPHS = ['/', '=', '≡', '-', '<', '>', 'X', '/'];
  const RIDGE_DENSE = ['█', '#', 'X', 'x', '<', '>', '•'];
  const WAVE_GLYPHS = ['~', '≈', '∼', '-', '~', '≈'];
  const PETAL_GLYPHS = ['❀', '✿', '❁', '*', '·', '•'];

  const CITY_TOWERS = [
    { xFrac: 0.0, w: 6, hFrac: 0.36, spire: true, neon: 'cyan' },
    { xFrac: 0.055, w: 5, hFrac: 0.45, spire: false, neon: 'pink' },
    { xFrac: 0.14, w: 9, hFrac: 0.34, spire: true, neon: null },
    { xFrac: 0.24, w: 8, hFrac: 0.27, spire: false, neon: 'amber' },
    { xFrac: 0.68, w: 9, hFrac: 0.31, spire: false, neon: 'amber' },
    { xFrac: 0.79, w: 9, hFrac: 0.42, spire: true, neon: 'cyan' },
    { xFrac: 0.895, w: 5, hFrac: 0.38, spire: true, neon: 'amber' },
    { xFrac: 0.945, w: 6, hFrac: 0.46, spire: true, neon: 'pink' },
  ];

  const CYBER_TOWERS = [
    { xFrac: 0.0, w: 6, hFrac: 0.44, signCol: 3, tone: 'cyan' },
    { xFrac: 0.055, w: 5, hFrac: 0.33, signCol: 2, tone: 'pink' },
    { xFrac: 0.14, w: 9, hFrac: 0.29, signCol: 4, tone: 'amber' },
    { xFrac: 0.77, w: 9, hFrac: 0.31, signCol: 4, tone: 'amber' },
    { xFrac: 0.895, w: 5, hFrac: 0.45, signCol: 2, tone: 'cyan' },
    { xFrac: 0.945, w: 6, hFrac: 0.38, signCol: 3, tone: 'pink' },
  ];

  const TORII_ART = [
    ' ╤═══════╤ ',
    '═╬═══════╬═',
    ' ║ ┌───┐ ║ ',
    ' ║ │   │ ║ ',
    ' ║ │   │ ║ ',
  ];

  const LIGHTHOUSE_ART = [
    '  /\\  ',
    ' [◉◉] ',
    ' ║██║ ',
    ' ║░░║ ',
    ' ║██║ ',
    ' ║░░║ ',
    '╔████╗',
  ];

  const CRESCENT_MOON = [
    "  _.-' ",
    " /  .' ",
    "|  |   ",
    " \\  '. ",
    "  '-._ ",
  ];

  const FULL_MOON_ART = [
    '  .--.  ',
    ' /    \\ ',
    '|  ·   |',
    ' \\    / ',
    "  '--'  ",
  ];

  const ALPINE_CABIN_ART = [
    '   /\\   ',
    '  /  \\  ',
    ' ╔════╗ ',
    ' ║[▪] ║ ',
    ' ╚════╝ ',
  ];

  function createClaudeFmScene(canvas, opts = {}) {
    let palette = resolveClaudeFmPalette(opts.palette || 'claude', opts.isDark);
    let sceneMode = normalizeScene(opts.scene);
    let audioActive = Boolean(opts.audioActive);
    let userPaused = Boolean(opts.paused);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let fontFamily = opts.fontFamily || 'ui-monospace, Consolas, "Courier New", monospace';
    let rafId = 0;
    let lastDrawMs = 0;
    let elapsedSec = 0;
    let lastTickMs = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let lastWakeSec = -10;
    let mascotHopSec = -10;
    let lastMascotCenter = { x: 0, y: 0 };
    let disposed = false;
    const gusts = []; // { x, y, bornSec, strength }
    const gustSparks = []; // { x, y, vx, vy, bornSec, life, glyph, color }
    const pointerWake = []; // { x, y, bornSec }

    const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;

    function isReducedMotion() {
      return typeof opts.reducedMotion === 'function' ? Boolean(opts.reducedMotion()) : false;
    }

    function resize(w, h, nextDpr) {
      width = Math.max(0, Math.round(Number(w) || 0));
      height = Math.max(0, Math.round(Number(h) || 0));
      dpr = Math.max(1, Math.min(2, Number(nextDpr) || (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
      if (canvas) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        if (canvas.style) {
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
    }

    function drawCharCell(col, row, ch, color, alpha, cellW, cellH, baseAlpha = 1) {
      if (!ctx || !ch || ch === ' ') return;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * baseAlpha));
      ctx.fillStyle = color;
      ctx.fillText(ch, col * cellW, row * cellH);
    }

    function drawRadialGlow(cx, cy, radius, color, alpha, baseAlpha) {
      if (!ctx || typeof ctx.createRadialGradient !== 'function' || radius <= 0 || alpha <= 0) return;
      try {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, hexToRgba(color, alpha));
        grad.addColorStop(0.45, hexToRgba(color, alpha * 0.42));
        grad.addColorStop(1, hexToRgba(color, 0));
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      } catch {}
    }

    function drawSkyAtmosphere(sceneId, t, baseAlpha) {
      ctx.globalAlpha = baseAlpha;
      ctx.fillStyle = palette.sky;
      ctx.fillRect(0, 0, width, height);

      if (typeof ctx.createLinearGradient === 'function') {
        try {
          let topCol = palette.skyTop || palette.sky;
          let midCol = palette.sky;
          let botCol = palette.skyHorizon || palette.sky;
          let gradAlpha = palette.isDark ? 0.85 : 0.72;

          if (sceneId === 'desert-dunes') {
            topCol = palette.sky;
            midCol = palette.skyHorizon || palette.sky;
            botCol = palette.duneMist || palette.skyGlow || palette.skyHorizon;
            gradAlpha = palette.isDark ? 0.52 : 0.42;
          } else if (sceneId === 'cyber-harbor') {
            topCol = palette.skyTop || palette.sky;
            midCol = palette.sky;
            botCol = palette.skyGlow || palette.skyHorizon;
            gradAlpha = palette.isDark ? 0.9 : 0.55;
          } else if (sceneId === 'rainy-city') {
            const lp = t % 13.5;
            const flash = lp > 13.12 ? Math.sin(((lp - 13.12) / 0.38) * Math.PI) : 0;
            if (flash > 0.05) {
              ctx.globalAlpha = flash * (palette.isDark ? 0.14 : 0.1) * baseAlpha;
              ctx.fillStyle = palette.rainInk;
              ctx.fillRect(0, 0, width, height * 0.65);
            }
          }

          const grad = ctx.createLinearGradient(0, 0, 0, height * 0.88);
          grad.addColorStop(0, topCol);
          grad.addColorStop(0.55, midCol);
          grad.addColorStop(1, botCol);
          ctx.globalAlpha = gradAlpha * baseAlpha;
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height * 0.88);
        } catch {}
      }
      ctx.globalAlpha = baseAlpha;
    }

    function drawClouds(t, cols, rows, skyShiftCols, cellW, cellH, baseAlpha, maxRowFrac = 0.42, tintColor = null) {
      const ink = tintColor || palette.glyphInk;
      for (let b = 0; b < CLOUD_BANKS.length; b++) {
        const bank = CLOUD_BANKS[b];
        const cloudRowStart = Math.floor(rows * bank.yFrac);
        const rawCol = bank.xFrac * cols - skyShiftCols * bank.speed;
        const wrapSpan = cols + 28;
        const cloudColStart = (((rawCol % wrapSpan) + wrapSpan) % wrapSpan) - 14;
        for (let r = 0; r < bank.rows.length; r++) {
          const line = bank.rows[r];
          const rr = cloudRowStart + r;
          if (rr < 0 || rr >= rows * maxRowFrac) continue;
          for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (ch === ' ') continue;
            const cc = Math.round(cloudColStart + c);
            if (cc < 0 || cc >= cols) continue;
            const twinkle = hash2(cc + Math.floor(t * 1.4), rr * 17) < 0.08;
            const inHeadlineZone = cc >= cols * 0.22 && cc <= cols * 0.78 && rr <= rows * 0.2;
            const cloudAlpha = (ch === '.' || ch === ':' || ch === '`' ? 0.45 : 0.72) * (inHeadlineZone ? 0.2 : 1);
            drawCharCell(
              cc,
              rr,
              twinkle && (ch === '.' || ch === ':') ? '•' : ch,
              ink,
              cloudAlpha,
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
      }
    }

    function drawStarfield(t, cols, rows, cellW, cellH, baseAlpha, maxRowFrac = 0.5, countFrac = 0.55) {
      const starCount = Math.max(40, Math.floor(cols * countFrac));
      for (let s = 0; s < starCount; s++) {
        const sc = Math.floor(hash2(s, 11) * cols);
        const sr = Math.floor(hash2(s, 29) * rows * maxRowFrac);
        const pulse = Math.sin(t * (1.8 + (s % 4) * 0.7) + s * 1.7);
        const glyph = s % 7 === 0 ? '✦' : s % 3 === 0 ? '*' : pulse > 0.2 ? '·' : '.';
        const inHeadlineZone = sc >= cols * 0.22 && sc <= cols * 0.78 && sr <= rows * 0.17;
        drawCharCell(
          sc,
          sr,
          glyph,
          palette.starInk,
          (0.32 + (pulse * 0.5 + 0.5) * 0.62) * (inHeadlineZone ? 0.24 : 1),
          cellW,
          cellH,
          baseAlpha
        );
      }
    }

    function drawForegroundSpires(t, cols, rows, fgShiftCols, cellW, cellH, baseAlpha, optsOrStartFrac = 0.855) {
      const cfg =
        typeof optsOrStartFrac === 'object' && optsOrStartFrac !== null
          ? optsOrStartFrac
          : { startFrac: optsOrStartFrac };
      const startFrac = Number.isFinite(cfg.startFrac) ? cfg.startFrac : 0.855;
      const fill = cfg.fill || palette.valleyFg || palette.cliff;
      const pocketColor = cfg.pocket || palette.valleyFgPocket || palette.cliffPocket;
      for (let c = 0; c < cols; c++) {
        const worldFg = c + fgShiftCols;
        const spireNoise = fbm1(worldFg * 0.14, 101);
        const microSpike = hash2(Math.floor(worldFg), 211);
        const centerDist = Math.abs(c / cols - 0.5);
        const centerDip = Math.max(0, 1 - centerDist * 3.8) * 0.028;
        const flankRise = centerDist > 0.38 ? (centerDist - 0.38) * 0.18 : 0;
        const spireTopRow = Math.floor(
          rows * (startFrac + centerDip - flankRise + (1 - spireNoise) * 0.032 - (microSpike > 0.76 ? 0.018 : 0))
        );

        for (let r = spireTopRow; r < rows; r++) {
          const pocket = valueNoise2(worldFg * 0.38, r * 0.52, 307);
          const belowFloor = r >= Math.floor(rows * (startFrac + 0.08));
          if (belowFloor) {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = fill;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (pocket > 0.72 && hash2(Math.floor(worldFg), r * 3) > 0.48) {
              drawCharCell(c, r, pocket > 0.84 ? '·' : '#', pocketColor, 0.55, cellW, cellH, baseAlpha);
            }
          } else if (pocket > 0.72) {
            drawCharCell(c, r, pocket > 0.85 ? 'X' : '#', fill, palette.isDark ? 0.88 : 0.72, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = fill;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }
    }

    function drawPointerWake(t, baseAlpha) {
      if (pointerWake.length === 0) return;
      ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      for (let i = 0; i < pointerWake.length; i++) {
        const wk = pointerWake[i];
        const age = t - wk.bornSec;
        if (age < 0 || age > 0.9) continue;
        const life = 1 - age / 0.9;
        ctx.globalAlpha = life * 0.45 * baseAlpha;
        ctx.fillStyle = palette.accent;
        ctx.fillText(age < 0.35 ? '✦' : '·', Math.round(wk.x), Math.round(wk.y - age * 12));
      }
    }

    function drawGustSparks(t, baseAlpha) {
      if (gustSparks.length === 0) return;
      ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      for (let i = 0; i < gustSparks.length; i++) {
        const sp = gustSparks[i];
        const age = t - sp.bornSec;
        if (age < 0 || age > sp.life) continue;
        const frac = 1 - age / sp.life;
        const sx = Math.round(sp.x + sp.vx * age);
        const sy = Math.round(sp.y + sp.vy * age - Math.sin(age * 4) * 4);
        ctx.globalAlpha = Math.max(0, frac * 0.9) * baseAlpha;
        ctx.fillStyle = sp.color || palette.accent;
        ctx.fillText(sp.glyph, sx, sy);
      }
    }

    function getSparkSpec(sceneId) {
      if (sceneId === 'sakura-trail') return { glyphs: ['❀', '✿', '·'], color: palette.petalInk };
      if (sceneId === 'rainy-city') return { glyphs: ['/', '|', '·'], color: palette.rainInk };
      if (sceneId === 'alpine-stars') return { glyphs: ['✦', '*', '·'], color: palette.auroraA || palette.starInk };
      if (sceneId === 'ocean-lighthouse') return { glyphs: ['~', '·', '°'], color: palette.beamInk };
      if (sceneId === 'cyber-harbor') return { glyphs: ['◈', '◇', '+'], color: palette.neonCyan };
      if (sceneId === 'desert-dunes') return { glyphs: ['~', '>', '·'], color: palette.duneSun };
      if (sceneId === 'lantern-forest') return { glyphs: ['✦', '♦', '·'], color: palette.fireflyGlow };
      if (sceneId === 'midnight-train') return { glyphs: ['✦', '~', '·'], color: palette.trainLight };
      return { glyphs: ['/', '✦', '·'], color: palette.accent };
    }

    function drawMascot(timeSec, sceneId, baseAlpha = 1) {
      if (!ctx || width <= 0 || height <= 0) return;
      const walkCycle = Math.floor((timeSec * 4.4) % 4);
      const hopAge = timeSec - mascotHopSec;
      const isHopping = hopAge >= 0 && hopAge < 0.65;
      const px = Math.max(2, Math.min(4, Math.floor(height / 215)));
      const hopPx = isHopping ? Math.round(Math.sin((hopAge / 0.65) * Math.PI) * 5.5) : 0;
      const audioBounce = audioActive ? (Math.sin(timeSec * 4.1) > 0.35 ? -1 : 0) : 0;
      const bobPx = (walkCycle === 1 || walkCycle === 3 ? -1 : 0) + audioBounce - hopPx;
      const blinkPhase = timeSec % 4.6;
      const isBlinking = blinkPhase > 4.42;

      const spriteW = 22 * px;
      const spriteH = 14 * px;
      const wanderX = Math.sin(timeSec * 0.34) * 14;
      const baseX = Math.round(width * 0.5 - spriteW * 0.5 + wanderX + smoothPointerX * 6);
      const groundY = Math.round(height * 0.968 + smoothPointerY * 2);
      const baseY = Math.round(groundY - spriteH + bobPx * px);
      lastMascotCenter = { x: baseX + spriteW * 0.5, y: baseY + spriteH * 0.5 };

      // Ground contact shadow beneath Clawd
      const shadowScale = Math.max(0.55, 1 - hopPx * 0.08);
      const shadowW = Math.round(14 * px * shadowScale);
      ctx.globalAlpha = (palette.isDark ? 0.36 : 0.22) * shadowScale * baseAlpha;
      ctx.fillStyle = palette.cliff;
      ctx.fillRect(baseX + Math.round((spriteW - shadowW) * 0.5) + px, groundY - Math.max(1, Math.floor(px * 0.5)), shadowW, px);

      const hasLantern =
        sceneId === 'alpine-stars' ||
        sceneId === 'ocean-lighthouse' ||
        sceneId === 'sakura-trail' ||
        sceneId === 'midnight-train' ||
        sceneId === 'lantern-forest';

      // Fluttering scarf behind Clawd for outdoor wind scenes
      if (
        sceneId === 'valley' ||
        sceneId === 'ocean-lighthouse' ||
        sceneId === 'midnight-train' ||
        sceneId === 'desert-dunes'
      ) {
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = palette.scarfInk || palette.accent;
        const scarfWave1 = Math.round(Math.sin(timeSec * 6.5) * 0.8);
        const scarfWave2 = Math.round(Math.sin(timeSec * 6.5 - 1.1) * 1.1);
        ctx.fillRect(baseX + 3 * px, baseY + (7 + scarfWave1) * px, 2 * px, px);
        ctx.fillRect(baseX + 1 * px, baseY + (8 + scarfWave2) * px, 2 * px, px);
        ctx.fillRect(baseX, baseY + (8 + scarfWave2) * px, px, px);
      }

      const colorMap = {
        O: palette.bedroll,
        P: palette.pack,
        D: palette.packDark,
        S: palette.staff,
        B: palette.mascotBody,
        R: palette.mascotShade,
        E: isBlinking ? palette.mascotBody : palette.mascotEye,
      };

      ctx.globalAlpha = baseAlpha;
      for (let r = 0; r < MASCOT_BASE.length; r++) {
        const rowStr = MASCOT_BASE[r];
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch === '.') continue;
          const fill = colorMap[ch];
          if (!fill) continue;
          ctx.fillStyle = fill;
          ctx.fillRect(baseX + c * px, baseY + r * px, px, px);
        }
      }

      const legRows = LEG_FRAMES[isHopping ? 1 : walkCycle];
      for (let lr = 0; lr < legRows.length; lr++) {
        const rowStr = legRows[lr];
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch === '.') continue;
          ctx.fillStyle = colorMap[ch];
          ctx.fillRect(baseX + c * px, baseY + (11 + lr) * px, px, px);
        }
      }

      // Cyber Harbor glowing visor strip across Clawd's eyes
      if (sceneId === 'cyber-harbor' && !isBlinking) {
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = palette.visorGlow || palette.neonCyan;
        ctx.fillRect(baseX + 12 * px, baseY + 4 * px, 7 * px, px);
        drawRadialGlow(baseX + 15 * px, baseY + 4.5 * px, 10 * px, palette.visorGlow || palette.neonCyan, 0.25, baseAlpha);
      }

      // Scene-specific gear for Clawd traveler
      if (sceneId === 'rainy-city') {
        const uCenterX = baseX + 14 * px;
        const uCanopyY = baseY - 7 * px;
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = palette.staff;
        ctx.fillRect(uCenterX + 4 * px, uCanopyY + 3 * px, px, 11 * px);
        ctx.fillStyle = palette.umbrellaTop;
        for (let ux = -8; ux <= 8; ux++) {
          const curve = Math.floor((ux * ux) / 22);
          ctx.fillRect(uCenterX + (4 + ux) * px, uCanopyY + curve * px, px, 2 * px);
        }
        ctx.fillStyle = palette.umbrellaTrim;
        ctx.fillRect(uCenterX + 4 * px, uCanopyY - px, px, px);
        ctx.fillRect(uCenterX - 4 * px, uCanopyY + 3 * px, px, px);
        ctx.fillRect(uCenterX + 12 * px, uCanopyY + 3 * px, px, px);
        // Tiny water droplets dripping off umbrella canopy edges
        for (let d = 0; d < 2; d++) {
          const dropPhase = (timeSec * 1.9 + d * 0.5) % 1;
          const dx = d === 0 ? uCenterX - 4 * px : uCenterX + 12 * px;
          const dy = uCanopyY + (4 + dropPhase * 7) * px;
          ctx.globalAlpha = (1 - dropPhase) * 0.85 * baseAlpha;
          ctx.fillStyle = palette.rainInk;
          ctx.fillRect(dx, Math.round(dy), px, px);
        }
      } else {
        const staffSwivel = walkCycle === 1 ? 1 : walkCycle === 3 ? -1 : 0;
        const staffX = baseX + (20 + staffSwivel) * px;
        const staffTop = baseY + 5 * px;
        ctx.globalAlpha = baseAlpha;
        for (let sy = 0; sy < 9; sy++) {
          ctx.fillStyle = sy === 0 ? palette.packDark : palette.staff;
          ctx.fillRect(staffX, staffTop + sy * px, px, px);
        }
        if (hasLantern) {
          const swingX = Math.round(Math.sin(timeSec * 2.8) * 0.6) * px;
          const lCol = sceneId === 'lantern-forest' ? palette.lanternPaper || palette.lanternGlow : palette.lanternGlow;
          drawRadialGlow(staffX + 2.5 * px + swingX, staffTop + 3.5 * px, 10 * px, lCol, 0.28, baseAlpha);
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = palette.packDark;
          ctx.fillRect(staffX + px, staffTop, 2 * px, px);
          ctx.fillRect(staffX + 2 * px + swingX, staffTop + px, px, px);
          ctx.globalAlpha = 0.25 * baseAlpha;
          ctx.fillStyle = lCol;
          ctx.fillRect(staffX + swingX, staffTop + px, 5 * px, 5 * px);
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = lCol;
          ctx.fillRect(staffX + px + swingX, staffTop + 2 * px, 3 * px, 3 * px);
          ctx.fillStyle = palette.packDark;
          ctx.fillRect(staffX + px + swingX, staffTop + 5 * px, 3 * px, px);
        } else if (sceneId === 'cyber-harbor' || sceneId === 'desert-dunes') {
          const tipColor = sceneId === 'cyber-harbor' ? palette.neonCyan : palette.duneSun;
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = tipColor;
          ctx.fillRect(staffX, staffTop - px, px, 2 * px);
          drawRadialGlow(staffX + 0.5 * px, staffTop, 6 * px, tipColor, 0.24, baseAlpha);
        }
      }

      // Cold-air breath mist in alpine night
      if (sceneId === 'alpine-stars') {
        const bPhase = timeSec % 3.4;
        if (bPhase < 1.1) {
          const p = bPhase / 1.1;
          ctx.globalAlpha = Math.sin(p * Math.PI) * 0.65 * baseAlpha;
          ctx.fillStyle = palette.snowInk || palette.starInk;
          ctx.font = `${Math.max(10, px * 3)}px ${fontFamily}`;
          ctx.textBaseline = 'top';
          ctx.fillText(p < 0.5 ? '°' : '·', Math.round(baseX + (19 + p * 6) * px), Math.round(baseY + (5 - p * 3) * px));
        }
      }

      // Orbiting golden firefly companion in Lantern Forest
      if (sceneId === 'lantern-forest') {
        const fx = baseX + 10 * px + Math.cos(timeSec * 2.1) * 16 * px;
        const fy = baseY - 2 * px + Math.sin(timeSec * 3.4) * 5 * px;
        const pulse = 0.55 + 0.45 * Math.sin(timeSec * 5.2);
        drawRadialGlow(fx, fy, 6 * px, palette.fireflyGlow, 0.35 * pulse, baseAlpha);
        ctx.globalAlpha = pulse * baseAlpha;
        ctx.fillStyle = palette.fireflyGlow;
        ctx.fillRect(Math.round(fx), Math.round(fy), px, px);
      }

      // Hop reaction sparkle
      if (isHopping) {
        ctx.globalAlpha = Math.sin((hopAge / 0.65) * Math.PI) * 0.9 * baseAlpha;
        ctx.fillStyle = palette.accent;
        ctx.font = `bold ${Math.max(11, px * 3)}px ${fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.fillText('✦', Math.round(baseX + 18 * px), Math.round(baseY - 4 * px));
      }

      // Headphones + floating musical notes when audio playback is active
      if (audioActive) {
        const hpYOffset = sceneId === 'rainy-city' ? 0 : -px;
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = palette.headphones;
        for (let c = 9; c <= 14; c++) {
          ctx.fillRect(baseX + c * px, baseY + hpYOffset, px, px);
        }
        ctx.fillRect(baseX + 8 * px, baseY, px, 3 * px);
        ctx.fillRect(baseX + 15 * px, baseY, px, 2 * px);
        ctx.fillStyle = sceneId === 'cyber-harbor' ? palette.neonCyan : palette.headphonePad;
        ctx.fillRect(baseX + 8 * px, baseY + 3 * px, 2 * px, 3 * px);

        ctx.font = `bold ${Math.max(11, px * 3)}px ${fontFamily}`;
        ctx.textBaseline = 'top';
        const noteGlyphs = ['♪', '♫', '♩'];
        for (let n = 0; n < 3; n++) {
          const phase = (timeSec * 0.44 + n * 0.33) % 1;
          const ny = baseY - (3 + phase * 10) * px;
          const nx = baseX + (6 + n * 2 - phase * 4 + Math.sin(timeSec * 2.5 + n) * 1.4) * px;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.92 * baseAlpha;
          ctx.fillStyle = sceneId === 'cyber-harbor' ? palette.neonCyan : palette.noteInk;
          ctx.fillText(noteGlyphs[n], Math.round(nx), Math.round(ny));
        }
        ctx.globalAlpha = baseAlpha;
      }
    }

    function computeGustBoost(col, row, t, cellW, cellH) {
      let gustBoost = 0;
      for (let g = 0; g < gusts.length; g++) {
        const gu = gusts[g];
        const age = t - gu.bornSec;
        const dx = col * cellW - gu.x;
        const dy = row * cellH - gu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const front = age * 260;
        if (Math.abs(dist - front) < 46) {
          gustBoost = Math.max(gustBoost, (1 - age / 2.2) * 0.9);
        }
      }
      return gustBoost;
    }

    // -----------------------------------------------------------------------
    // 1. VALLEY (Elevated: 3-plane parallax mountains, horizon sun glow, bird V-flock, pollen)
    // -----------------------------------------------------------------------
    function renderValleyScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShiftCols = t * 0.55 - smoothPointerX * 1.2;
      const farShiftCols = t * 0.65 - smoothPointerX * 1.5;
      const ridgeShiftCols = t * 1.35 - smoothPointerX * 2.6;
      const fgShiftCols = t * 3.1 - smoothPointerX * 4.5;

      // Soft warm horizon bloom behind right valley crest
      drawRadialGlow(width * 0.78 - smoothPointerX * 8, height * 0.44, Math.min(width, height) * 0.28, palette.skyGlow || palette.accent, palette.isDark ? 0.24 : 0.45, baseAlpha);

      drawClouds(t, cols, rows, skyShiftCols, cellW, cellH, baseAlpha);

      // Soaring V-flock of 5 ASCII birds drifting along unobstructed sky flanks
      const flockAnchorC = Math.round(cols * 0.04 + Math.sin(t * 0.32) * 2);
      const flockAnchorR = Math.floor(rows * 0.07 + Math.sin(t * 0.45) * 1.1);
      const birdOffsets = [
        [0, 0],
        [-1, -1],
        [-1, 1],
        [3, -1],
        [4, 0],
      ];
      for (let b = 0; b < birdOffsets.length; b++) {
        const bc = Math.round(flockAnchorC + birdOffsets[b][0]);
        const br = Math.round(flockAnchorR + birdOffsets[b][1] + Math.sin(t * 1.8 + b) * 0.4);
        if (bc >= 0 && bc < cols && br >= 1 && br < rows * 0.35) {
          const flap = Math.sin(t * 4.2 + b * 1.1) > 0 ? 'v' : '^';
          drawCharCell(bc, br, flap, palette.glyphInk, 0.72, cellW, cellH, baseAlpha);
        }
      }

      // Distant far horizon ridge silhouette
      for (let c = 0; c < cols; c++) {
        const farN = fbm1((c + farShiftCols) * 0.03, 41);
        const farRow = Math.floor(rows * (0.37 + (farN - 0.5) * 0.09));
        if (c > cols * 0.24 && c < cols * 0.74 && farRow < rows * 0.43) continue;
        drawCharCell(c, farRow, c % 3 === 0 ? '^' : farN > 0.5 ? '/' : '\\', palette.glyphMuted, palette.isDark ? 0.34 : 0.25, cellW, cellH, baseAlpha);
      }

      const valleyLeft = Math.floor(cols * 0.22);
      const valleyRight = Math.floor(cols * 0.78);
      const shelfEndCol = Math.floor(cols * 0.12);
      const shelfTopRow = Math.floor(rows * 0.54);
      const shelfBotRow = Math.floor(rows * 0.59);
      const fgBaseRow = Math.floor(rows * 0.945);
      const midColor = palette.valleyMid || palette.cliff;
      const windScale = palette.isDark ? 1 : 0.46;
      const texScale = palette.isDark ? 1 : 0.55;

      for (let c = 0; c < cols; c++) {
        const worldC = c + ridgeShiftCols;
        const nHorizon = fbm1(worldC * 0.045, 7);
        let ridgeRow;
        if (c < cols * 0.3) {
          const slopeT = c / (cols * 0.3);
          ridgeRow = Math.floor(rows * (0.42 + slopeT * 0.09 + (nHorizon - 0.5) * 0.06));
        } else if (c <= cols * 0.6) {
          ridgeRow = Math.floor(rows * (0.5 + (nHorizon - 0.5) * 0.06));
        } else {
          const riseT = Math.min(1, (c - cols * 0.6) / (cols * 0.4));
          ridgeRow = Math.floor(rows * (0.49 - riseT * 0.08 + (nHorizon - 0.5) * 0.09));
        }
        const inCenterClearing = c >= valleyLeft && c <= valleyRight;

        for (let r = ridgeRow; r < Math.min(rows, fgBaseRow + 2); r++) {
          if (c <= shelfEndCol && r >= shelfTopRow && r <= shelfBotRow) {
            const edgeNoise = hash2(Math.floor(worldC), r);
            if (r > shelfTopRow || edgeNoise > 0.2) {
              drawCharCell(c, r, edgeNoise < 0.14 ? '#' : '█', midColor, palette.isDark ? 0.82 : 0.48, cellW, cellH, baseAlpha);
              continue;
            }
          }
          const depth = r - ridgeRow;
          const tex = valueNoise2(worldC * 0.22, r * 0.35, 13);

          if (inCenterClearing && r >= Math.floor(rows * 0.5)) {
            const inComposerBand = r >= Math.floor(rows * 0.68) && r <= Math.floor(rows * 0.84) && c >= cols * 0.14 && c <= cols * 0.86;
            const windWave = Math.sin(c * 0.16 - t * 2.4 + r * 0.42);
            const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
            const activity = windWave * 0.5 + 0.5 + gustBoost;
            const valleyDepth = (r - Math.floor(rows * 0.5)) / Math.max(1, fgBaseRow - Math.floor(rows * 0.5));
            if (activity > 0.42 || valleyDepth > 0.4 || tex > 0.4) {
              const wIdx = Math.floor((tex * 6 + t * 1.85 + c * 0.18 + r * 0.25) % WIND_GLYPHS.length);
              const glyph = WIND_GLYPHS[Math.max(0, wIdx)];
              const glyphColor =
                gustBoost > 0.25
                  ? palette.accent
                  : glyph === 'X' && valleyDepth > 0.5 && palette.isDark
                  ? palette.glyphInk
                  : palette.glyphWind;
              drawCharCell(
                c,
                r,
                glyph,
                glyphColor,
                Math.min(0.84, 0.26 + valleyDepth * 0.26 + activity * 0.24) * windScale * (inComposerBand ? 0.34 : 1),
                cellW,
                cellH,
                baseAlpha
              );
            }
          } else {
            let ch = ' ';
            let alpha = palette.isDark ? 0.78 : 0.42;
            let color = midColor;
            if (depth <= 1 && tex > 0.24) {
              ch = tex > 0.54 ? '█' : tex > 0.36 ? '#' : 'X';
            } else if (depth <= 4 && tex > 0.3) {
              ch = RIDGE_DENSE[Math.floor((tex * 17 + r) % RIDGE_DENSE.length)];
            } else if (tex > 0.4) {
              ch = tex > 0.72 ? '#' : tex > 0.54 ? 'x' : hash2(Math.floor(worldC), r) < 0.5 ? '<' : '>';
              color = ch === '#' ? midColor : palette.glyphInk;
              alpha = ch === '#' ? (palette.isDark ? 0.76 : 0.42) : 0.68 * texScale;
            } else if (tex > 0.24) {
              ch = hash2(Math.floor(worldC), r) < 0.6 ? '/' : '≡';
              color = palette.glyphInk;
              alpha = 0.48 * texScale;
            }
            if (ch !== ' ') {
              drawCharCell(c, r, ch, color, alpha, cellW, cellH, baseAlpha);
            }
          }
        }
      }

      // Drifting golden sunlit dust/pollen motes
      ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      for (let m = 0; m < 24; m++) {
        const mx = ((hash2(m, 91) * width + t * (12 + (m % 5) * 3.5)) % (width + 20)) - 10;
        const my = ((hash2(m, 137) * height * 0.75 - t * (4 + (m % 3) * 2) + height * 0.8) % (height * 0.86)) + Math.sin(t * 1.1 + m) * 7;
        const isWarm = m % 4 === 0;
        ctx.globalAlpha = (0.3 + 0.32 * Math.sin(t * 1.6 + m * 2.1)) * baseAlpha;
        ctx.fillStyle = isWarm ? palette.accent : palette.glyphMuted;
        ctx.fillText(isWarm ? '✦' : m % 3 === 0 ? '•' : '.', Math.round(mx), Math.round(my));
      }

      drawMascot(t, 'valley', baseAlpha);
      drawForegroundSpires(t, cols, rows, fgShiftCols, cellW, cellH, baseAlpha, {
        startFrac: 0.945,
        fill: palette.valleyFg,
        pocket: palette.valleyFgPocket,
      });
    }

    // -----------------------------------------------------------------------
    // 2. RAINY CITY (Elevated: skyline monorail train, rooftop steam, neon strips, lightning pulse, puddle ripples)
    // -----------------------------------------------------------------------
    function renderRainyCityScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.3 - smoothPointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.34);

      const streetRow = Math.floor(rows * 0.955);
      const viaductRow = Math.floor(rows * 0.88);
      const parallax = smoothPointerX * 2.5;

      // Distant background skyline silhouettes
      for (let c = 0; c < cols; c++) {
        const bNoise = hash2(Math.floor((c + t * 0.15) / 6), 55);
        const topRow = Math.floor(rows * (0.48 + bNoise * 0.18));
        if (c > cols * 0.16 && c < cols * 0.84) continue;
        for (let r = topRow; r < streetRow; r++) {
          drawCharCell(c, r, '▓', palette.cliffPocket, 0.34, cellW, cellH, baseAlpha);
        }
      }

      // Open lower elevated skyline viaduct + glowing passing commuter train cleanly below composer
      for (let c = 0; c < cols; c++) {
        drawCharCell(c, viaductRow, '═', palette.cliffPocket, 0.62, cellW, cellH, baseAlpha);
        if (c % 9 === 0) {
          for (let pr = viaductRow + 1; pr < streetRow; pr++) {
            drawCharCell(c, pr, '║', palette.cliffPocket, 0.36, cellW, cellH, baseAlpha);
          }
        }
      }
      const trainCycle = (t * 0.1 + 0.18) % 1;
      const trainHeadCol = Math.floor(-24 + trainCycle * (cols + 46));
      const trainArt = '══[▪▪▪]─[▪▪▪]─[▪▪▪]═>';
      drawRadialGlow((trainHeadCol + trainArt.length) * cellW, (viaductRow - 0.5) * cellH, 32, palette.windowGlow, 0.2, baseAlpha);
      for (let tc = 0; tc < trainArt.length; tc++) {
        const col = trainHeadCol + tc;
        if (col < 0 || col >= cols) continue;
        const ch = trainArt[tc];
        const isWin = ch === '▪' || ch === '>';
        drawCharCell(col, viaductRow - 1, ch, isWin ? palette.windowGlow : palette.cliff, isWin ? 0.95 : 0.88, cellW, cellH, baseAlpha);
      }

      // Main skyscrapers on left and right flanks with warm lit windows, neon strips, & rooftop steam
      for (let b = 0; b < CITY_TOWERS.length; b++) {
        const tw = CITY_TOWERS[b];
        const startC = Math.floor(tw.xFrac * cols - parallax);
        const topR = Math.floor(rows * (0.86 - tw.hFrac));
        const neonColor =
          tw.neon === 'cyan' ? palette.neonCyan : tw.neon === 'pink' ? palette.neonPink : tw.neon === 'amber' ? palette.neonAmber : null;

        if (tw.spire) {
          const spireC = startC + Math.floor(tw.w / 2);
          for (let sr = Math.max(2, topR - 3); sr < topR; sr++) {
            drawCharCell(spireC, sr, '|', palette.glyphInk, 0.72, cellW, cellH, baseAlpha);
          }
          if (Math.sin(t * 2.4 + b) > 0.1) {
            drawCharCell(spireC, Math.max(1, topR - 4), '•', palette.windowGlow, 0.92, cellW, cellH, baseAlpha);
          }
        } else if (b % 2 === 1) {
          for (let st = 0; st < 4; st++) {
            const phase = (t * 0.65 + st * 0.25 + b * 0.3) % 1;
            const sc = startC + 2 + Math.round(Math.sin(t * 1.8 + st) * 1);
            const sr = Math.floor(topR - 1 - phase * 4);
            if (sc >= 0 && sc < cols && sr >= 2) {
              drawCharCell(sc, sr, phase < 0.4 ? 's' : phase < 0.75 ? '~' : '·', palette.glyphMuted, (1 - phase) * 0.6, cellW, cellH, baseAlpha);
            }
          }
        }

        for (let c = startC; c < startC + tw.w; c++) {
          if (c < 0 || c >= cols) continue;
          const isEdge = c === startC || c === startC + tw.w - 1;
          const isNeonCol = neonColor && c === startC + tw.w - 2;
          for (let r = topR; r < streetRow; r++) {
            if (isNeonCol && r > topR + 2 && r < topR + 10) {
              const pulse = 0.65 + 0.3 * Math.sin(t * 3 + r * 0.5 + b);
              drawCharCell(c, r, r % 2 === 0 ? '◈' : '║', neonColor, pulse, cellW, cellH, baseAlpha);
            } else if (!isEdge && (c - startC) % 2 === 1 && (r - topR) % 2 === 1 && r > topR) {
              const winHash = hash2(c * 13 + b, r * 17);
              const flicker = hash2(c + Math.floor(t * 0.25), r) < 0.08;
              const lit = (winHash > 0.54) !== flicker;
              drawCharCell(c, r, lit ? '▪' : '▫', lit ? palette.windowGlow : palette.cliffPocket, lit ? 0.92 : 0.45, cellW, cellH, baseAlpha);
            } else {
              drawCharCell(c, r, '█', palette.cliff, 0.92, cellW, cellH, baseAlpha);
            }
          }
        }
      }

      // Wet street neon reflections & expanding concentric puddle splashes along y = 89%..95.5%
      for (let c = 0; c < cols; c++) {
        for (let r = Math.floor(rows * 0.89); r < streetRow; r++) {
          const splashSeed = hash2(c, r * 29);
          const splashTick = Math.floor(t * 5.2 + splashSeed * 9);
          const splash = hash2(c + splashTick, r * 29) > 0.935;
          const wave = Math.sin(c * 0.4 + t * 3.2 + r) > 0.6;
          const nearFlank = c < cols * 0.25 || c > cols * 0.75;
          if (splash) {
            const ringGlyph = splashTick % 3 === 0 ? '·' : splashTick % 3 === 1 ? 'o' : 'O';
            drawCharCell(c, r, ringGlyph, nearFlank && c % 3 === 0 ? palette.neonCyan : palette.rainInk, 0.82, cellW, cellH, baseAlpha);
          } else if (wave) {
            const reflColor = nearFlank && c % 4 === 0 ? palette.windowGlow : palette.rainInk;
            drawCharCell(c, r, '~', reflColor, 0.48, cellW, cellH, baseAlpha);
          }
        }
      }

      // Background fine drizzle + foreground slanting rain streaks
      const rainCols = Math.ceil(cols * 0.92);
      for (let i = 0; i < rainCols; i++) {
        const isBg = i % 3 === 0;
        const speedY = isBg ? 175 + (i % 4) * 20 : 275 + (i % 5) * 35;
        const speedX = isBg ? 55 : 102 + (i % 4) * 20;
        const rx = ((hash2(i, 71) * width - t * speedX) % width + width) % width;
        const ry = (hash2(i, 113) * height + t * speedY) % (height * 0.96);
        const rc = Math.floor(rx / cellW);
        const rr = Math.floor(ry / cellH);
        const gustBoost = computeGustBoost(rc, rr, t, cellW, cellH);
        const ch = gustBoost > 0.2 ? '|' : isBg ? ':' : '/';
        drawCharCell(
          rc,
          rr,
          ch,
          palette.rainInk,
          Math.min(0.92, (isBg ? 0.32 : 0.52) + (i % 3) * 0.14 + gustBoost * 0.4),
          cellW,
          cellH,
          baseAlpha
        );
      }

      drawMascot(t, 'rainy-city', baseAlpha);

      // Wet dark foreground pavement & curb blocks (y = 95.5%..100%)
      for (let c = 0; c < cols; c++) {
        for (let r = streetRow; r < rows; r++) {
          const puddle = valueNoise2(c * 0.35 + t * 0.4, r * 0.6, 89);
          if (r === streetRow && c % 4 === 0) {
            drawCharCell(c, r, '═', palette.glyphMuted, 0.68, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (r > streetRow && puddle > 0.78) {
              drawCharCell(c, r, puddle > 0.88 ? 'o' : '~', palette.cliffPocket, 0.62, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. ALPINE STARS (Elevated: Aurora Borealis, cabin with smoke, snowflakes, dual meteors)
    // -----------------------------------------------------------------------
    function renderAlpineStarsScene(t, cols, rows, cellW, cellH, baseAlpha) {
      // Twinkling starfield + diagonal Milky Way dust ribbon
      drawStarfield(t, cols, rows, cellW, cellH, baseAlpha, 0.52, 0.6);

      // Undulating Aurora Borealis curtains visible across top sky & outer mountain flanks
      const auroraMinR = Math.floor(rows * 0.02);
      const auroraMaxR = Math.floor(rows * 0.34);
      for (let c = 0; c < cols; c++) {
        const wave = Math.sin(c * 0.13 - t * 0.85) + Math.cos(c * 0.065 + t * 0.45) * 0.7;
        if (wave < -0.2) continue;
        const crestR = auroraMinR + Math.floor((wave + 0.25) * 2.4);
        const curtainH = 3 + Math.floor(fbm1(c * 0.15 + t * 0.3, 19) * 5);
        const inCenter = c >= cols * 0.14 && c <= cols * 0.86;
        for (let r = crestR; r < Math.min(auroraMaxR, crestR + curtainH); r++) {
          if (inCenter && r > rows * 0.11) continue;
          const fade = 1 - (r - crestR) / Math.max(1, curtainH);
          const glyph = r === crestR ? '·' : (c + r) % 3 === 0 ? '║' : (c + r) % 2 === 0 ? '│' : '░';
          const color = (c + Math.floor(t * 0.5)) % 8 < 5 ? palette.auroraA : palette.auroraB;
          drawCharCell(c, r, glyph, color, fade * (inCenter ? 0.42 : 0.68), cellW, cellH, baseAlpha);
        }
      }

      // Dual staggered shooting stars
      const meteors = [
        { speed: 0.22, offset: 0.0, startX: 0.02, startY: 0.04, dirX: 0.09 },
        { speed: 0.16, offset: 0.55, startX: 0.96, startY: 0.05, dirX: -0.08 },
      ];
      for (let m = 0; m < meteors.length; m++) {
        const mt = meteors[m];
        const ph = (t * mt.speed + mt.offset) % 1;
        if (ph < 0.22) {
          const mp = ph / 0.22;
          const mc = Math.floor(cols * (mt.startX + mp * mt.dirX));
          const mr = Math.floor(rows * (mt.startY + mp * 0.12));
          const tailDir = mt.dirX >= 0 ? -1 : 1;
          drawCharCell(mc, mr, '✦', palette.moonInk, 0.95, cellW, cellH, baseAlpha);
          drawCharCell(mc + tailDir, mr - 1, mt.dirX >= 0 ? '\\' : '/', palette.moonInk, 0.65, cellW, cellH, baseAlpha);
          drawCharCell(mc + tailDir * 2, mr - 1, '-', palette.moonInk, 0.35, cellW, cellH, baseAlpha);
        }
      }

      // Crescent moon clearly inside unobstructed upper-right sky corner
      const moonC = Math.floor(cols * 0.91 - smoothPointerX * 1.2);
      const moonR = Math.floor(rows * 0.035);
      drawRadialGlow((moonC + 3) * cellW, (moonR + 2.5) * cellH, 38, palette.moonInk, 0.26, baseAlpha);
      for (let r = 0; r < CRESCENT_MOON.length; r++) {
        const line = CRESCENT_MOON[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] !== ' ') {
            drawCharCell(moonC + c, moonR + r, line[c], palette.moonInk, 0.92, cellW, cellH, baseAlpha);
          }
        }
      }

      // Geometric layered alpine mountain peaks
      const fgStartRow = Math.floor(rows * 0.945);
      const mShift = t * 0.65 - smoothPointerX * 2.2;
      const peaks = [
        { center: 0.07, halfW: 0.14, topFrac: 0.34 },
        { center: 0.2, halfW: 0.15, topFrac: 0.45 },
        { center: 0.78, halfW: 0.16, topFrac: 0.42 },
        { center: 0.94, halfW: 0.15, topFrac: 0.32 },
      ];
      for (let c = 0; c < cols; c++) {
        const xFrac = (c + mShift * 0.15) / cols;
        let peakRow = Math.floor(rows * 0.74);
        for (let p = 0; p < peaks.length; p++) {
          const pk = peaks[p];
          const dist = Math.abs(xFrac - pk.center);
          if (dist < pk.halfW) {
            const h = pk.topFrac + (dist / pk.halfW) * (0.76 - pk.topFrac);
            peakRow = Math.min(peakRow, Math.floor(rows * h));
          }
        }
        for (let r = peakRow; r < fgStartRow; r++) {
          const d = r - peakRow;
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          if (r >= Math.floor(rows * 0.76) && c > cols * 0.14 && c < cols * 0.86) {
            const mist = Math.sin(c * 0.2 - t * 1.9 + r * 0.5);
            if (mist > 0.16 || gustBoost > 0.2) {
              drawCharCell(c, r, mist > 0.65 ? '=' : '·', gustBoost > 0.2 ? palette.lanternGlow : palette.glyphWind, 0.48 + gustBoost * 0.4, cellW, cellH, baseAlpha);
            }
          } else if (d === 0) {
            drawCharCell(c, r, c % 2 === 0 ? '^' : '▲', palette.snowInk || palette.starInk, 0.88, cellW, cellH, baseAlpha);
          } else if (d <= 3) {
            drawCharCell(c, r, (c + r) % 2 === 0 ? '/' : '\\', palette.glyphInk, 0.72, cellW, cellH, baseAlpha);
          } else {
            drawCharCell(c, r, d % 3 === 0 ? '#' : 'X', palette.cliff, 0.78, cellW, cellH, baseAlpha);
          }
        }
      }

      // Cozy glowing alpine cabin nestled cleanly in unobstructed left flank with rising chimney smoke
      const cabC = Math.floor(cols * 0.015 - smoothPointerX * 1.2);
      const cabR = Math.floor(rows * 0.72);
      drawRadialGlow((cabC + 4) * cellW, (cabR + 3) * cellH, 34, palette.cabinGlow || palette.lanternGlow, 0.3, baseAlpha);
      for (let r = 0; r < ALPINE_CABIN_ART.length; r++) {
        const line = ALPINE_CABIN_ART[r];
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === ' ') continue;
          const isWin = ch === '▪';
          drawCharCell(cabC + c, cabR + r, ch, isWin ? palette.cabinGlow : palette.glyphInk, isWin ? 0.98 : 0.88, cellW, cellH, baseAlpha);
        }
      }
      for (let s = 0; s < 5; s++) {
        const sp = (t * 0.45 + s * 0.2) % 1;
        const sx = cabC + 5 + Math.round(sp * 2 + Math.sin(t * 2 + s) * 0.8);
        const sy = Math.floor(cabR - 1 - sp * 4);
        if (sy > 2) {
          drawCharCell(sx, sy, sp < 0.4 ? 's' : sp < 0.75 ? '~' : '.', palette.glyphMuted, (1 - sp) * 0.65, cellW, cellH, baseAlpha);
        }
      }

      // Gentle drifting alpine snowflakes
      const snowCount = Math.max(28, Math.floor(cols * 0.3));
      for (let f = 0; f < snowCount; f++) {
        const fx = ((hash2(f, 51) * width + t * (16 + (f % 3) * 6) + Math.sin(t * 1.4 + f) * 14) % (width + 16)) - 8;
        const fy = (hash2(f, 97) * height * 0.95 + t * (28 + (f % 4) * 9)) % (height * 0.95);
        const fc = Math.floor(fx / cellW);
        const fr = Math.floor(fy / cellH);
        const gustBoost = computeGustBoost(fc, fr, t, cellW, cellH);
        drawCharCell(fc, fr, f % 3 === 0 ? '*' : f % 2 === 0 ? '·' : '°', palette.snowInk || palette.starInk, Math.min(0.92, 0.54 + gustBoost * 0.35), cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'alpine-stars', baseAlpha);

      // Foreground jagged pine silhouettes framing sides & subtle snowy trail under Clawd (y = 94.5%..100%)
      const fgShift = t * 2.5 - smoothPointerX * 4;
      for (let c = 0; c < cols; c++) {
        const treeCol = Math.floor(c + fgShift);
        const mod = ((treeCol % 5) + 5) % 5;
        const treeHeight = Math.floor(hash2(Math.floor(treeCol / 5), 409) * 3);
        const distC = Math.abs(c / cols - 0.5);
        const flankLift = distC > 0.36 ? Math.floor((distC - 0.36) * 10) : 0;
        const spireR = Math.floor(rows * 0.945) - flankLift - (mod === 2 ? treeHeight : mod === 1 || mod === 3 ? Math.max(0, treeHeight - 2) : 0);
        for (let r = spireR; r < rows; r++) {
          if (r === spireR && mod === 2) {
            drawCharCell(c, r, '^', palette.cliff, 0.95, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (r > spireR + 1 && hash2(treeCol, r) > 0.84) {
              drawCharCell(c, r, '#', palette.cliffPocket, 0.38, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 4. OCEAN LIGHTHOUSE (Elevated: lantern halo, sweeping sea reflection, sailboat, surf spray, pier lanterns)
    // -----------------------------------------------------------------------
    function renderOceanLighthouseScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.45 - smoothPointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.36);

      // Drifting ASCII seabirds in open top sky corners
      for (let g = 0; g < 4; g++) {
        const gc = Math.floor(cols * (g < 2 ? 0.03 + g * 0.04 : 0.90 + (g - 2) * 0.04) + Math.sin(t * 0.6 + g));
        const gr = Math.floor(rows * (0.06 + (g % 2) * 0.05) + Math.sin(t * 2 + g) * 0.8);
        drawCharCell(gc, gr, Math.sin(t * 4 + g) > 0 ? 'v' : '^', palette.glyphInk, 0.78, cellW, cellH, baseAlpha);
      }

      // Sweeping diagonal lighthouse beam + volumetric cone anchored cleanly in unobstructed right flank
      const lhCol = Math.floor(cols * 0.91 - smoothPointerX * 1.4);
      const lhTopRow = Math.floor(rows * 0.24);
      const sweepAng = Math.cos(t * 0.72);
      const elev = -0.2 + sweepAng * 0.07;
      const beamSpan = Math.floor(cols * (0.72 + 0.14 * Math.sin(t * 0.72)));
      const beamPulse = 0.8 + 0.2 * Math.sin(t * 0.72);
      const lanternPx = (lhCol + 3) * cellW;
      const lanternPy = (lhTopRow + 1.5) * cellH;

      drawRadialGlow(lanternPx, lanternPy, 52, palette.beamInk, 0.42 * beamPulse, baseAlpha);
      if (typeof ctx.beginPath === 'function' && typeof ctx.createLinearGradient === 'function') {
        try {
          const endX = lanternPx - beamSpan * cellW;
          const endY = lanternPy + beamSpan * elev * cellH;
          const coneHalfH = Math.max(26, beamSpan * 0.14 * cellH);
          const coneGrad = ctx.createLinearGradient(lanternPx, lanternPy, endX, endY);
          coneGrad.addColorStop(0, hexToRgba(palette.beamInk, (palette.isDark ? 0.34 : 0.28) * beamPulse));
          coneGrad.addColorStop(0.55, hexToRgba(palette.beamInk, (palette.isDark ? 0.14 : 0.11) * beamPulse));
          coneGrad.addColorStop(1, hexToRgba(palette.beamInk, 0));
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(lanternPx, lanternPy - 4);
          ctx.lineTo(endX, endY - coneHalfH);
          ctx.lineTo(endX, endY + coneHalfH);
          ctx.lineTo(lanternPx, lanternPy + 4);
          ctx.closePath();
          ctx.fill();
        } catch {}
      }
      for (let hr = lhTopRow - 1; hr <= lhTopRow + 3; hr++) {
        for (let hc = lhCol; hc <= lhCol + 5; hc++) {
          if (hr >= 0 && hc >= 0 && hc < cols) {
            drawCharCell(hc, hr, '·', palette.beamInk, 0.44 * beamPulse, cellW, cellH, baseAlpha);
          }
        }
      }
      for (let step = 1; step < beamSpan; step++) {
        const bc = lhCol + 1 - step;
        if (bc < 0 || bc >= cols) continue;
        const centerR = Math.round(lhTopRow + 1 + step * elev);
        const halfSpread = Math.max(0, Math.floor(step / 9));
        for (let r = centerR - halfSpread; r <= centerR + halfSpread; r++) {
          if (r < 0 || r >= Math.floor(rows * 0.56)) continue;
          const distFade = Math.max(0.22, 0.85 - (step / Math.max(1, beamSpan)) * 0.55);
          drawCharCell(bc, r, step % 4 === 0 ? '░' : step % 3 === 0 ? ':' : step % 2 === 0 ? '/' : '·', palette.beamInk, distFade, cellW, cellH, baseAlpha);
        }
      }

      // Rocky headland + tall ASCII lighthouse cleanly inside right margin
      const seaStartRow = Math.floor(rows * 0.56);
      const pierTopRow = Math.floor(rows * 0.955);
      for (let r = 0; r < LIGHTHOUSE_ART.length; r++) {
        const line = LIGHTHOUSE_ART[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] === ' ') continue;
          const isLantern = r === 1;
          drawCharCell(lhCol + c, lhTopRow + r, line[c], isLantern ? palette.beamInk : palette.glyphInk, isLantern ? 0.98 : 0.92, cellW, cellH, baseAlpha);
        }
      }
      const cliffBaseR = lhTopRow + LIGHTHOUSE_ART.length;
      for (let c = lhCol - 4; c < cols; c++) {
        if (c < 0) continue;
        const slope = c < lhCol ? Math.floor((lhCol - c) * 0.9) : 0;
        for (let r = cliffBaseR + slope; r < pierTopRow; r++) {
          drawCharCell(c, r, (c + r) % 4 === 0 ? '#' : '█', palette.cliff, 0.9, cellW, cellH, baseAlpha);
        }
      }

      // Crashing sea spray where ocean meets rocky cliff base
      for (let sp = 0; sp < 7; sp++) {
        const sprayPhase = (t * 1.4 + sp * 0.21) % 1;
        const sc = lhCol - 5 + (sp % 4);
        const sr = Math.floor(pierTopRow - 3 - Math.sin(sprayPhase * Math.PI) * 4);
        if (sc >= 0 && sc < cols && sr >= seaStartRow) {
          drawCharCell(sc, sr, sprayPhase < 0.4 ? '*' : '°', palette.starInk, (1 - sprayPhase) * 0.78, cellW, cellH, baseAlpha);
        }
      }

      // Synchronized sweeping beam shimmer path + layered ocean waves
      const sweepFocusCol = cols * (0.45 + Math.sin(t * 0.65) * 0.25);
      for (let r = seaStartRow; r < pierTopRow; r++) {
        const depth = (r - seaStartRow) / Math.max(1, pierTopRow - seaStartRow);
        const speed = 1.4 + depth * 2.2;
        for (let c = 0; c < cols; c++) {
          if (c >= lhCol - 2 && r >= cliffBaseR + Math.max(0, lhCol - c)) continue;
          const waveVal = Math.sin(c * 0.24 - t * speed + r * 0.85);
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          const inBeamSweep = Math.abs(c - sweepFocusCol) < 8 + depth * 10 && hash2(c + Math.floor(t * 3), r * 7) > 0.45;
          const shimmer = inBeamSweep || hash2(c + Math.floor(t * 2.2), r * 19) > 0.93;
          if (waveVal > 0.05 || shimmer || gustBoost > 0.2) {
            const wGlyph = shimmer ? '·' : WAVE_GLYPHS[Math.abs(Math.floor(c + r + t * 2)) % WAVE_GLYPHS.length];
            drawCharCell(
              c,
              r,
              wGlyph,
              shimmer ? palette.beamInk : gustBoost > 0.2 ? palette.accent : palette.waterInk,
              shimmer ? 0.86 : Math.min(0.84, 0.34 + depth * 0.36 + gustBoost * 0.4),
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
      }

      // Bobbing distant sailboat cleanly inside open left ocean flank
      const boatCol = Math.floor(cols * 0.02 + Math.sin(t * 0.55) * 1.4);
      const boatBob = Math.round(Math.sin(t * 2.1) * 0.6);
      const boatRow = Math.floor(rows * 0.68) + boatBob;
      const boatArt = ['  /| ', ' /_| ', '\\___/'];
      for (let br = 0; br < boatArt.length; br++) {
        const line = boatArt[br];
        for (let bc = 0; bc < line.length; bc++) {
          if (line[bc] !== ' ') {
            drawCharCell(boatCol + bc, boatRow + br, line[bc], palette.glyphInk, 0.86, cellW, cellH, baseAlpha);
          }
        }
      }
      if (Math.sin(t * 2.5) > 0) {
        drawCharCell(boatCol + 2, boatRow - 1, '•', palette.lanternGlow, 0.92, cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'ocean-lighthouse', baseAlpha);

      // Continuous ASCII coastal pier deck, bollard lanterns, pilings & dark water reflections (y = 95.5%..100%)
      for (let c = 0; c < cols; c++) {
        const isPiling = ((c + Math.floor(t * 1.5)) % 12 + 12) % 12 < 2;
        const isBollard = ((c + Math.floor(t * 1.5)) % 22 + 22) % 22 === 0 && Math.abs(c / cols - 0.5) > 0.12;
        if (isBollard) {
          drawCharCell(c, pierTopRow - 1, '♦', palette.lanternGlow, 0.95, cellW, cellH, baseAlpha);
          drawRadialGlow(c * cellW, (pierTopRow - 0.5) * cellH, 16, palette.lanternGlow, 0.24, baseAlpha);
        }
        for (let r = pierTopRow; r < rows; r++) {
          if (r === pierTopRow) {
            ctx.globalAlpha = 0.88 * baseAlpha;
            ctx.fillStyle = palette.pierDeck;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, 4);
            drawCharCell(c, r, c % 4 === 0 ? '+' : '=', palette.pierDeck, 0.88, cellW, cellH, baseAlpha);
          } else if (r === pierTopRow + 1) {
            drawCharCell(c, r, isPiling ? '#' : '-', palette.pierPiling, 0.82, cellW, cellH, baseAlpha);
          } else if (isPiling) {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.pierPiling;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          } else {
            const wWave = Math.sin(c * 0.28 - t * 2.5 + r * 0.9);
            const isRefl = c > cols * 0.68 && hash2(c + Math.floor(t * 2), r * 13) > 0.84;
            if (isRefl) {
              drawCharCell(c, r, '·', palette.beamInk, 0.58, cellW, cellH, baseAlpha);
            } else if (wWave > -0.15) {
              const glyph = wWave > 0.55 ? '~' : wWave > 0.15 ? '-' : '·';
              drawCharCell(c, r, glyph, palette.waterInk, 0.34 + Math.max(0, wWave) * 0.28, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 5. SAKURA TRAIL (Elevated: distant peak silhouette, swaying canopy boughs, glowing stone lanterns, rich petals & fireflies)
    // -----------------------------------------------------------------------
    function renderSakuraTrailScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.42 - smoothPointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.38);

      // Subtle misty distant sacred mountain crest inside open left margin
      const peakC = Math.floor(cols * 0.055 - smoothPointerX * 1.1);
      const peakR = Math.floor(rows * 0.38);
      for (let pr = 0; pr < 4; pr++) {
        const span = 2 + pr * 2;
        for (let pc = peakC - span; pc <= peakC + span; pc++) {
          if (pc < 0 || pc >= cols) continue;
          const isEdge = pc === peakC - span || pc === peakC + span;
          const ch = pr === 0 ? '─' : isEdge ? (pc < peakC ? '/' : '\\') : '·';
          drawCharCell(pc, peakR + pr, ch, pr < 2 ? palette.petalAlt : palette.glyphMuted, pr < 2 ? 0.52 : 0.32, cellW, cellH, baseAlpha);
        }
      }

      const fgStartRow = Math.floor(rows * 0.945);
      const ridgeShift = t * 0.9 - smoothPointerX * 2.2;

      for (let c = 0; c < cols; c++) {
        const nHill = fbm1((c + ridgeShift) * 0.04, 73);
        const hillRow = Math.floor(rows * (0.5 + (nHill - 0.5) * 0.08));
        for (let r = hillRow; r < fgStartRow; r++) {
          const inClearing = c > cols * 0.16 && c < cols * 0.84;
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          if (inClearing && r >= Math.floor(rows * 0.52)) {
            const inComposerBand = r >= Math.floor(rows * 0.68) && r <= Math.floor(rows * 0.84);
            const breeze = Math.sin(c * 0.15 - t * 2.1 + r * 0.4);
            if (breeze > 0.44 || r > Math.floor(rows * 0.86) || gustBoost > 0.2) {
              drawCharCell(
                c,
                r,
                breeze > 0.7 ? '=' : '-',
                gustBoost > 0.2 ? palette.petalInk : palette.glyphWind,
                (0.44 + gustBoost * 0.4) * (palette.isDark ? 1 : 0.48) * (inComposerBand ? 0.35 : 1),
                cellW,
                cellH,
                baseAlpha
              );
            }
          } else if (r - hillRow <= 2) {
            drawCharCell(
              c,
              r,
              (c + r) % 2 === 0 ? '#' : 'X',
              palette.isDark ? palette.glyphInk : palette.sakuraFgPocket,
              palette.isDark ? 0.68 : 0.34,
              cellW,
              cellH,
              baseAlpha
            );
          } else {
            drawCharCell(
              c,
              r,
              (c + r) % 3 === 0 ? 'x' : '.',
              palette.glyphMuted,
              palette.isDark ? 0.45 : 0.28,
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
      }

      // Stylized ASCII Torii gate cleanly inside right open margin + flanking stone toro lanterns
      const toriiC = Math.floor(cols * 0.895 - smoothPointerX * 1.2);
      const toriiR = Math.floor(rows * 0.52) - TORII_ART.length;
      for (let r = 0; r < TORII_ART.length; r++) {
        const line = TORII_ART[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] === ' ') continue;
          drawCharCell(toriiC + c, toriiR + r, line[c], palette.toriiInk, 0.96, cellW, cellH, baseAlpha);
        }
      }
      const stoneLanterns = [
        { c: Math.floor(cols * 0.04), r: Math.floor(rows * 0.74) },
        { c: Math.floor(cols * 0.93), r: Math.floor(rows * 0.86) },
      ];
      for (let l = 0; l < stoneLanterns.length; l++) {
        const lc = stoneLanterns[l].c;
        const lr = stoneLanterns[l].r;
        if (lc >= 1 && lc < cols - 1) {
          drawRadialGlow(lc * cellW, (lr + 1) * cellH, 18, palette.lanternGlow, 0.28, baseAlpha);
          drawCharCell(lc, lr, '┬', palette.glyphInk, 0.88, cellW, cellH, baseAlpha);
          drawCharCell(lc, lr + 1, '♦', palette.lanternGlow, 0.96, cellW, cellH, baseAlpha);
          drawCharCell(lc, lr + 2, '┴', palette.glyphInk, 0.88, cellW, cellH, baseAlpha);
        }
      }

      // Multi-tiered gently swaying sakura canopies framing left & right corners
      const sway = Math.sin(t * 1.15) * 0.45;
      for (let c = 0; c < Math.floor(cols * 0.14); c++) {
        const bRow = Math.floor(rows * (0.12 + Math.sin(c * 0.26 + sway) * 0.04));
        drawCharCell(c, bRow, c % 3 === 0 ? '✿' : '~', c % 3 === 0 ? palette.petalInk : palette.roofInk, 0.86, cellW, cellH, baseAlpha);
        if (hash2(c, 99) > 0.35) {
          drawCharCell(c, bRow + 1, c % 2 === 0 ? '❀' : '❁', palette.petalAlt, 0.8, cellW, cellH, baseAlpha);
        }
        if (c < cols * 0.09 && hash2(c, 131) > 0.45) {
          drawCharCell(c, bRow + 3, '✿', palette.petalInk, 0.7, cellW, cellH, baseAlpha);
        }
      }
      for (let c = Math.floor(cols * 0.86); c < cols; c++) {
        const bRow = Math.floor(rows * (0.1 + Math.cos((cols - c) * 0.26 - sway) * 0.04));
        drawCharCell(c, bRow, c % 3 === 0 ? '✿' : '~', c % 3 === 0 ? palette.petalInk : palette.roofInk, 0.86, cellW, cellH, baseAlpha);
        if (hash2(c, 107) > 0.35) {
          drawCharCell(c, bRow + 1, c % 2 === 0 ? '❀' : '❁', palette.petalAlt, 0.8, cellW, cellH, baseAlpha);
        }
        if (c > cols * 0.91 && hash2(c, 149) > 0.45) {
          drawCharCell(c, bRow + 3, '✿', palette.petalInk, 0.7, cellW, cellH, baseAlpha);
        }
      }

      // Drifting sakura petals
      const petalCount = Math.max(44, Math.floor(cols * 0.44));
      for (let p = 0; p < petalCount; p++) {
        const pxPos = ((hash2(p, 151) * width + t * (30 + (p % 4) * 9.5)) % (width + 20)) - 10;
        const pyPos = (hash2(p, 223) * height * 0.94 + t * (16 + (p % 3) * 6.5) + Math.sin(t * 2.1 + p) * 14) % (height * 0.94);
        const pc = Math.floor(pxPos / cellW);
        const pr = Math.floor(pyPos / cellH);
        const gustBoost = computeGustBoost(pc, pr, t, cellW, cellH);
        const glyph = PETAL_GLYPHS[p % PETAL_GLYPHS.length];
        drawCharCell(pc, pr, glyph, p % 2 === 0 ? palette.petalInk : palette.petalAlt, Math.min(0.95, 0.64 + gustBoost * 0.3), cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'sakura-trail', baseAlpha);
      drawForegroundSpires(t, cols, rows, t * 2.2 - smoothPointerX * 4, cellW, cellH, baseAlpha, {
        startFrac: 0.945,
        fill: palette.sakuraFg,
        pocket: palette.sakuraFgPocket,
      });
    }

    // -----------------------------------------------------------------------
    // 6. MIDNIGHT TRAIN (New: moonlit trestle bridge, illuminated express train, headlight cone, lake reflections)
    // -----------------------------------------------------------------------
    function renderMidnightTrainScene(t, cols, rows, cellW, cellH, baseAlpha) {
      drawStarfield(t, cols, rows, cellW, cellH, baseAlpha, 0.45, 0.5);
      drawClouds(t, cols, rows, t * 0.25 - smoothPointerX, cellW, cellH, baseAlpha, 0.3);

      // Glowing gibbous moon cleanly in unobstructed upper-left corner
      const moonC = Math.floor(cols * 0.015 - smoothPointerX * 1.1);
      const moonR = Math.floor(rows * 0.035);
      drawRadialGlow((moonC + 4) * cellW, (moonR + 2.5) * cellH, 42, palette.moonInk, 0.3, baseAlpha);
      for (let r = 0; r < FULL_MOON_ART.length; r++) {
        const line = FULL_MOON_ART[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] !== ' ') {
            drawCharCell(moonC + c, moonR + r, line[c], palette.moonInk, 0.94, cellW, cellH, baseAlpha);
          }
        }
      }

      const bridgeRow = Math.floor(rows * 0.875);
      const lakeBotRow = Math.floor(rows * 0.955);
      const mShift = t * 0.5 - smoothPointerX * 1.8;

      // Distant cedar mountain silhouettes framing flanks above the lake
      for (let c = 0; c < cols; c++) {
        const nM = fbm1((c + mShift) * 0.045, 29);
        const topR = Math.floor(rows * (0.5 + (nM - 0.5) * 0.1));
        if (c > cols * 0.12 && c < cols * 0.88) continue;
        for (let r = topR; r < bridgeRow - 1; r++) {
          const isCrest = r === topR;
          drawCharCell(c, r, isCrest ? '^' : (c + r) % 3 === 0 ? '#' : '▓', palette.cliff, isCrest ? 0.82 : 0.64, cellW, cellH, baseAlpha);
        }
      }

      // Blinking railway signal pole cleanly on open right abutment
      const sigC = Math.floor(cols * 0.94 - smoothPointerX * 1.4);
      for (let sr = bridgeRow - 6; sr < bridgeRow; sr++) {
        drawCharCell(sigC, sr, '║', palette.bridgeInk || palette.cliffPocket, 0.88, cellW, cellH, baseAlpha);
      }
      const sigOn = Math.sin(t * 4.5) > 0;
      drawCharCell(sigC - 1, bridgeRow - 6, '✕', sigOn ? palette.signalGlow : palette.glyphMuted, sigOn ? 0.95 : 0.45, cellW, cellH, baseAlpha);

      // Arched lakeside trestle bridge span cleanly below composer
      for (let c = 0; c < cols; c++) {
        const pierPeriod = ((c + 4) % 14 + 14) % 14;
        drawCharCell(c, bridgeRow, pierPeriod === 0 ? '╤' : '═', palette.bridgeInk || palette.glyphInk, 0.9, cellW, cellH, baseAlpha);
        if (pierPeriod === 0 || pierPeriod === 13) {
          for (let pr = bridgeRow + 1; pr < lakeBotRow; pr++) {
            drawCharCell(c, pr, pierPeriod === 0 ? '║' : '│', palette.bridgeInk || palette.cliffPocket, 0.72, cellW, cellH, baseAlpha);
          }
        } else if (pierPeriod <= 3 || pierPeriod >= 10) {
          drawCharCell(c, bridgeRow + 1, pierPeriod <= 3 ? '/' : '\\', palette.bridgeInk || palette.cliffPocket, 0.64, cellW, cellH, baseAlpha);
        }
      }

      // Gliding 5-car illuminated Midnight Express Train across the open trestle
      const locoLen = 7;
      const carPattern = '─[▪▪▪▪]';
      const trainStr = `═${carPattern}${carPattern}${carPattern}${carPattern}═╔════╗`;
      const span = cols + trainStr.length + 28;
      const trainStartCol = Math.floor(((t * 9.5 + 36) % span) - trainStr.length - 10);
      const locoCol = trainStartCol + trainStr.length - locoLen;

      // Headlight beam & ambient window glow
      drawRadialGlow((locoCol + locoLen + 2) * cellW, (bridgeRow - 1.5) * cellH, 42, palette.trainLight, 0.3, baseAlpha);
      for (let step = 1; step <= 11; step++) {
        const hc = locoCol + locoLen + step;
        if (hc >= cols) break;
        const fade = Math.max(0.08, 0.72 - step * 0.055);
        drawCharCell(hc, bridgeRow - 1, step < 4 ? '=' : '·', palette.trainLight, fade, cellW, cellH, baseAlpha);
        if (step > 3) drawCharCell(hc, bridgeRow - 2, '·', palette.trainLight, fade * 0.55, cellW, cellH, baseAlpha);
      }

      // Train steam trail floating behind the locomotive stack
      for (let st = 0; st < 6; st++) {
        const sp = (t * 1.1 + st * 0.16) % 1;
        const sc = Math.floor(locoCol + 3 - sp * 16);
        const sr = Math.floor(bridgeRow - 2 - sp * 2.5);
        if (sc >= 0 && sc < cols && sr >= Math.floor(rows * 0.83)) {
          drawCharCell(sc, sr, sp < 0.35 ? '°' : sp < 0.7 ? '~' : '·', palette.starInk, (1 - sp) * 0.55, cellW, cellH, baseAlpha);
        }
      }

      for (let i = 0; i < trainStr.length; i++) {
        const tc = trainStartCol + i;
        if (tc < 0 || tc >= cols) continue;
        const ch = trainStr[i];
        const isLit = ch === '▪' || ch === '╔' || ch === '╗';
        if (i >= trainStr.length - locoLen) {
          drawCharCell(tc, bridgeRow - 2, i === trainStr.length - 4 ? '╤' : '─', palette.trainBody || palette.cliff, 0.9, cellW, cellH, baseAlpha);
        } else if (ch === '[') {
          drawCharCell(tc, bridgeRow - 2, '┌', palette.trainBody || palette.cliff, 0.85, cellW, cellH, baseAlpha);
        } else if (ch === ']') {
          drawCharCell(tc, bridgeRow - 2, '┐', palette.trainBody || palette.cliff, 0.85, cellW, cellH, baseAlpha);
        } else if (ch === '▪') {
          drawCharCell(tc, bridgeRow - 2, '─', palette.trainBody || palette.cliff, 0.85, cellW, cellH, baseAlpha);
        }
        drawCharCell(tc, bridgeRow - 1, ch, isLit ? palette.trainLight : palette.trainBody || palette.cliff, isLit ? 0.98 : 0.9, cellW, cellH, baseAlpha);
      }

      // Tranquil dark lake below trestle + shimmering inverted golden window reflections
      for (let r = bridgeRow + 2; r < lakeBotRow; r++) {
        const depth = (r - bridgeRow) / Math.max(1, lakeBotRow - bridgeRow);
        for (let c = 0; c < cols; c++) {
          const underTrain = c >= trainStartCol && c < trainStartCol + trainStr.length && trainStr[c - trainStartCol] === '▪';
          const underMoon = Math.abs(c - (moonC + 4)) < 5;
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          const ripple = Math.sin(c * 0.25 - t * 1.9 + r * 0.7);
          if (underTrain && ripple > -0.25) {
            drawCharCell(c, r, ripple > 0.4 ? '=' : '~', palette.trainLight, 0.5 + (1 - depth) * 0.3, cellW, cellH, baseAlpha);
          } else if (underMoon && hash2(c + Math.floor(t * 2), r * 11) > 0.74) {
            drawCharCell(c, r, '·', palette.moonInk, 0.68, cellW, cellH, baseAlpha);
          } else if (ripple > 0.2 || gustBoost > 0.2) {
            drawCharCell(c, r, ripple > 0.65 ? '~' : '-', gustBoost > 0.2 ? palette.trainLight : palette.waterInk, 0.36 + gustBoost * 0.4, cellW, cellH, baseAlpha);
          }
        }
      }

      drawMascot(t, 'midnight-train', baseAlpha);

      // Foreground misty railway embankment & wooden ties (y = 95.5%..100%)
      const tieShift = Math.floor(t * 2.2 - smoothPointerX * 4);
      for (let c = 0; c < cols; c++) {
        const isTie = (((c + tieShift) % 6) + 6) % 6 < 2;
        for (let r = lakeBotRow; r < rows; r++) {
          if (r === lakeBotRow) {
            drawCharCell(c, r, isTie ? '═' : '-', palette.bridgeInk || palette.cliffPocket, 0.88, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (r > lakeBotRow && isTie && hash2(c, r) > 0.7) {
              drawCharCell(c, r, '#', palette.cliffPocket, 0.45, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 7. DESERT DUNES (New: layered sunset disc, 3 sculpted sand dunes, windblown sand crests, desert monoliths)
    // -----------------------------------------------------------------------
    function renderDesertDunesScene(t, cols, rows, cellW, cellH, baseAlpha) {
      // Stylized layered setting sun cleanly inside unobstructed right sky margin
      const sunCol = Math.floor(cols * 0.94 - smoothPointerX * 1.1);
      const sunRow = Math.floor(rows * 0.21);
      const sunRadC = 5;
      const sunRadR = 3;
      drawRadialGlow(sunCol * cellW, sunRow * cellH, 76, palette.duneSun, palette.isDark ? 0.34 : 0.44, baseAlpha);
      for (let sr = sunRow - sunRadR; sr <= sunRow + sunRadR; sr++) {
        if (sr < 1) continue;
        const dy = (sr - sunRow) / sunRadR;
        const span = Math.floor(sunRadC * Math.sqrt(Math.max(0, 1 - dy * dy)));
        for (let sc = sunCol - span; sc <= sunCol + span; sc++) {
          if (sc < 0 || sc >= cols) continue;
          const isSlice = sr > sunRow && sr % 2 === 0;
          drawCharCell(sc, sr, isSlice ? '═' : '░', palette.duneSun, isSlice ? 0.45 : 0.92, cellW, cellH, baseAlpha);
        }
      }

      drawClouds(t, cols, rows, t * 0.48 - smoothPointerX * 1.2, cellW, cellH, baseAlpha, 0.3, palette.duneMist);

      // Distant canyon monolith / arch silhouette cleanly inside unobstructed left flank
      const monoC = Math.floor(cols * 0.01 - smoothPointerX * 1.1);
      const monoTop = Math.floor(rows * 0.42);
      const monoArt = [' ╔════╗ ', ' ║    ║ ', '╔╝    ╚╗', '█      █'];
      for (let r = 0; r < monoArt.length; r++) {
        const line = monoArt[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] !== ' ') {
            drawCharCell(monoC + c, monoTop + r, '█', palette.duneShade, 0.62, cellW, cellH, baseAlpha);
          }
        }
      }

      // 3 layered parallax scrolling sand dunes sweeping into the open lower horizon
      const fgStartRow = Math.floor(rows * 0.945);
      const duneLayers = [
        { baseFrac: 0.6, ampFrac: 0.05, freq: 0.065, speed: 0.7, crest: palette.duneLight, body: palette.duneMid, seed: 11 },
        { baseFrac: 0.73, ampFrac: 0.065, freq: 0.055, speed: 1.3, crest: palette.duneLight, body: palette.duneMid, seed: 23 },
        { baseFrac: 0.87, ampFrac: 0.045, freq: 0.048, speed: 2.1, crest: palette.duneSun, body: palette.duneShade, seed: 37 },
      ];

      for (let layer = 0; layer < duneLayers.length; layer++) {
        const dl = duneLayers[layer];
        const shift = t * dl.speed - smoothPointerX * (1.8 + layer * 0.9);
        for (let c = 0; c < cols; c++) {
          const worldC = c + shift;
          const n = fbm1(worldC * dl.freq, dl.seed);
          const wave = Math.sin(worldC * dl.freq * 1.4 + layer * 1.7);
          const crestRow = Math.floor(rows * (dl.baseFrac + (wave * 0.55 + (n - 0.5)) * dl.ampFrac));
          const slopeRight = Math.cos(worldC * dl.freq * 1.4 + layer * 1.7) > 0;
          const endRow = layer === 2 ? fgStartRow : Math.min(fgStartRow, crestRow + 9);

          for (let r = crestRow; r < endRow; r++) {
            const depth = r - crestRow;
            const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
            if (depth === 0) {
              drawCharCell(c, r, wave > 0 ? '─' : '~', gustBoost > 0.2 ? palette.accent : dl.crest, 0.88, cellW, cellH, baseAlpha);
            } else if (depth <= 2) {
              drawCharCell(c, r, slopeRight ? '░' : '▒', dl.crest, 0.68 - depth * 0.08, cellW, cellH, baseAlpha);
            } else {
              const windGrain = Math.sin(c * 0.25 - t * 2.8 + r * 0.5);
              drawCharCell(
                c,
                r,
                windGrain > 0.55 ? '~' : slopeRight ? '·' : '▒',
                gustBoost > 0.2 ? palette.duneSun : dl.body,
                Math.min(0.84, 0.36 + (layer === 2 ? 0.24 : 0.1) + gustBoost * 0.35),
                cellW,
                cellH,
                baseAlpha
              );
            }
          }
        }
      }

      // Windblown desert sand ribbons & rising dusk dust motes
      const sandCount = Math.max(28, Math.floor(cols * 0.3));
      for (let s = 0; s < sandCount; s++) {
        const sx = ((hash2(s, 73) * width + t * (55 + (s % 4) * 16)) % (width + 20)) - 10;
        const sy = ((hash2(s, 127) * height * 0.45 + height * 0.48 + Math.sin(t * 2 + s) * 8) % (height * 0.48)) + height * 0.46;
        const sc = Math.floor(sx / cellW);
        const sr = Math.floor(sy / cellH);
        const gustBoost = computeGustBoost(sc, sr, t, cellW, cellH);
        drawCharCell(sc, sr, s % 3 === 0 ? '>' : s % 2 === 0 ? '~' : '·', palette.duneLight, Math.min(0.92, 0.48 + gustBoost * 0.4), cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'desert-dunes', baseAlpha);
      drawForegroundSpires(t, cols, rows, t * 2.7 - smoothPointerX * 4, cellW, cellH, baseAlpha, {
        startFrac: 0.945,
        fill: palette.duneShade,
        pocket: palette.duneMid,
      });
    }

    // -----------------------------------------------------------------------
    // 8. CYBER HARBOR (New: sliced synth-sun, scrolling holo towers, sky-trams, neon harbor reflections)
    // -----------------------------------------------------------------------
    function renderCyberHarborScene(t, cols, rows, cellW, cellH, baseAlpha) {
      drawStarfield(t, cols, rows, cellW, cellH, baseAlpha, 0.42, 0.45);

      // Sliced synthwave sun tucked cleanly inside open right sky flank
      const sunC = Math.floor(cols * 0.94 - smoothPointerX * 1.1);
      const sunR = Math.floor(rows * 0.2);
      drawRadialGlow(sunC * cellW, sunR * cellH, 74, palette.neonPink, 0.28, baseAlpha);
      for (let sr = sunR - 3; sr <= sunR + 3; sr++) {
        if (sr < 2) continue;
        const dy = (sr - sunR) / 3;
        const span = Math.floor(5 * Math.sqrt(Math.max(0, 1 - dy * dy)));
        if (sr > sunR && sr % 2 === 1) continue;
        for (let sc = sunC - span; sc <= sunC + span; sc++) {
          if (sc >= 0 && sc < cols) {
            drawCharCell(sc, sr, '▓', sr < sunR ? palette.neonAmber : palette.neonPink, 0.88, cellW, cellH, baseAlpha);
          }
        }
      }

      // Drifting illuminated sky-trams cruising across upper sky
      for (let tr = 0; tr < 2; tr++) {
        const dir = tr === 0 ? 1 : -1;
        const rawX = tr === 0 ? (t * 4.2) % (cols + 18) - 8 : cols + 8 - ((t * 3.4) % (cols + 18));
        const tramC = Math.floor(rawX);
        const tramR = Math.floor(rows * (0.06 + tr * 0.04));
        const art = dir > 0 ? '<═•═>' : '<═•═>';
        for (let k = 0; k < art.length; k++) {
          const cc = tramC + k;
          if (cc >= 0 && cc < cols && (cc < cols * 0.22 || cc > cols * 0.78)) {
            drawCharCell(cc, tramR, art[k], art[k] === '•' ? palette.neonCyan : palette.glyphMuted, art[k] === '•' ? 0.95 : 0.65, cellW, cellH, baseAlpha);
          }
        }
      }

      const harborStartRow = Math.floor(rows * 0.73);
      const deckRow = Math.floor(rows * 0.955);
      const parallax = smoothPointerX * 2.4;

      // Waterfront cyber skyscrapers with scrolling holo-sign columns
      for (let b = 0; b < CYBER_TOWERS.length; b++) {
        const tw = CYBER_TOWERS[b];
        const startC = Math.floor(tw.xFrac * cols - parallax);
        const topR = Math.floor(harborStartRow - rows * tw.hFrac);
        const toneColor = tw.tone === 'cyan' ? palette.neonCyan : tw.tone === 'pink' ? palette.neonPink : palette.neonAmber;

        // Antenna beacon
        const antC = startC + Math.floor(tw.w / 2);
        if (antC >= 0 && antC < cols && topR >= 3) {
          drawCharCell(antC, topR - 1, '|', palette.glyphMuted, 0.75, cellW, cellH, baseAlpha);
          if (Math.sin(t * 3.1 + b * 1.4) > 0) {
            drawCharCell(antC, topR - 2, '◈', toneColor, 0.95, cellW, cellH, baseAlpha);
          }
        }

        for (let c = startC; c < startC + tw.w; c++) {
          if (c < 0 || c >= cols) continue;
          const isSign = tw.signCol >= 0 && c === startC + tw.signCol;
          for (let r = topR; r < harborStartRow; r++) {
            if (isSign && r > topR + 1 && r < harborStartRow - 1) {
              const scrollIdx = Math.floor(r + t * 5.5 + b) % 4;
              const signCh = scrollIdx === 0 ? '◈' : scrollIdx === 1 ? '◇' : scrollIdx === 2 ? '╬' : '░';
              drawCharCell(c, r, signCh, toneColor, 0.94, cellW, cellH, baseAlpha);
            } else if ((c - startC) % 2 === 1 && (r - topR) % 2 === 1 && r > topR) {
              const lit = hash2(c * 7 + b, r * 11) > 0.58;
              drawCharCell(c, r, lit ? '▪' : '▓', lit ? palette.neonAmber : palette.cliff, lit ? 0.82 : 0.9, cellW, cellH, baseAlpha);
            } else {
              drawCharCell(c, r, '▓', palette.cliff, 0.92, cellW, cellH, baseAlpha);
            }
          }
        }
      }

      // Liquid neon harbor water catching scrolling holo & sun reflections
      for (let r = harborStartRow; r < deckRow; r++) {
        const depth = (r - harborStartRow) / Math.max(1, deckRow - harborStartRow);
        for (let c = 0; c < cols; c++) {
          const wave = Math.sin(c * 0.24 - t * (1.8 + depth * 2) + r * 0.8);
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          let reflColor = palette.waterInk;
          let reflStrength = 0;
          for (let b = 0; b < CYBER_TOWERS.length; b++) {
            const tw = CYBER_TOWERS[b];
            const signC = Math.floor(tw.xFrac * cols - parallax) + tw.signCol;
            if (tw.signCol >= 0 && Math.abs(c - signC) <= 1) {
              reflColor = tw.tone === 'cyan' ? palette.neonCyan : tw.tone === 'pink' ? palette.neonPink : palette.neonAmber;
              reflStrength = 0.72;
              break;
            }
          }
          if (Math.abs(c - sunC) <= 4 && hash2(c + Math.floor(t * 3), r * 5) > 0.45) {
            reflColor = palette.neonPink;
            reflStrength = 0.68;
          }
          if (wave > -0.1 || reflStrength > 0 || gustBoost > 0.2) {
            const glyph = gustBoost > 0.2 ? '◇' : reflStrength > 0 ? (wave > 0.2 ? '≡' : '=') : wave > 0.45 ? '≡' : '~';
            drawCharCell(
              c,
              r,
              glyph,
              gustBoost > 0.2 ? palette.neonCyan : reflColor,
              Math.min(0.9, (reflStrength || 0.36 + depth * 0.28) + gustBoost * 0.4),
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
      }

      // Rising holographic data motes
      for (let d = 0; d < 18; d++) {
        const dx = ((hash2(d, 61) * width + Math.sin(t + d) * 12) % width + width) % width;
        const dy = ((hash2(d, 109) * height * 0.7 - t * (18 + (d % 4) * 5)) % (height * 0.7) + height * 0.7) % (height * 0.7) + height * 0.14;
        const dc = Math.floor(dx / cellW);
        const dr = Math.floor(dy / cellH);
        drawCharCell(dc, dr, d % 2 === 0 ? '◇' : '+', d % 3 === 0 ? palette.neonCyan : palette.neonPink, 0.58, cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'cyber-harbor', baseAlpha);

      // Sleek waterfront promenade deck (y = 85.5%..100%)
      for (let c = 0; c < cols; c++) {
        for (let r = deckRow; r < rows; r++) {
          if (r === deckRow) {
            drawCharCell(c, r, c % 6 === 0 ? '◈' : '═', c % 6 === 0 ? palette.neonCyan : palette.neonPink, 0.85, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (r > deckRow + 1 && c % 8 === 0 && hash2(c, r) > 0.65) {
              drawCharCell(c, r, '≡', palette.cliffPocket, 0.45, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 9. LANTERN FOREST (New: swaying bamboo groves, rising sky lanterns with halos, firefly swarm)
    // -----------------------------------------------------------------------
    function renderLanternForestScene(t, cols, rows, cellW, cellH, baseAlpha) {
      drawStarfield(t, cols, rows, cellW, cellH, baseAlpha, 0.36, 0.4);

      const bridgeRow = Math.floor(rows * 0.955);

      // Swaying bamboo stalk silhouettes flanking left and right groves
      const stalks = [0.02, 0.055, 0.095, 0.16, 0.84, 0.905, 0.945, 0.98];
      for (let s = 0; s < stalks.length; s++) {
        const baseC = stalks[s] * cols - smoothPointerX * (s % 2 === 0 ? 2.4 : 1.5);
        const isFront = s % 2 === 0;
        const stalkColor = isFront ? palette.bambooBright : palette.bambooInk;
        const topR = Math.floor(rows * (isFront ? 0.06 : 0.18));
        for (let r = topR; r < bridgeRow; r++) {
          const heightFrac = Math.max(0, 1 - r / bridgeRow);
          const swayC = Math.round(baseC + Math.sin(t * 1.35 + s * 0.9) * heightFrac * 1.8);
          if (swayC < 0 || swayC >= cols) continue;
          const isNode = r % 5 === 0;
          drawCharCell(swayC, r, isNode ? '╬' : isFront ? '║' : '│', stalkColor, isFront ? 0.86 : 0.58, cellW, cellH, baseAlpha);
          if (isNode && r < bridgeRow - 6) {
            const leafDir = s % 2 === 0 ? 1 : -1;
            const lc = swayC + leafDir;
            if (lc >= 0 && lc < cols) {
              drawCharCell(lc, r, leafDir > 0 ? '╲' : '╱', stalkColor, isFront ? 0.74 : 0.5, cellW, cellH, baseAlpha);
              if (lc + leafDir >= 0 && lc + leafDir < cols) {
                drawCharCell(lc + leafDir, r + 1, '~', stalkColor, 0.52, cellW, cellH, baseAlpha);
              }
            }
          }
        }
      }

      // Soft forest floor mist across open lower clearing
      for (let c = Math.floor(cols * 0.1); c < Math.floor(cols * 0.9); c++) {
        for (let r = Math.floor(rows * 0.84); r < bridgeRow; r++) {
          const mist = Math.sin(c * 0.16 - t * 1.4 + r * 0.45);
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          if (mist > 0.35 || gustBoost > 0.2) {
            drawCharCell(c, r, mist > 0.65 ? '~' : '·', gustBoost > 0.2 ? palette.fireflyGlow : palette.bambooBright, 0.42 + gustBoost * 0.4, cellW, cellH, baseAlpha);
          }
        }
      }

      // Floating glowing paper sky-lanterns strictly inside open groves & lower mist lane (never clipped)
      const lanternSpecs = [
        { xFrac: 0.025, speed: 0.045, phase: 0.15, lowOnly: false },
        { xFrac: 0.065, speed: 0.036, phase: 0.58, lowOnly: false },
        { xFrac: 0.91, speed: 0.038, phase: 0.28, lowOnly: false },
        { xFrac: 0.95, speed: 0.044, phase: 0.67, lowOnly: false },
        { xFrac: 0.28, speed: 0.03, phase: 0.42, lowOnly: true },
        { xFrac: 0.71, speed: 0.034, phase: 0.75, lowOnly: true },
      ];
      for (let l = 0; l < lanternSpecs.length; l++) {
        const ls = lanternSpecs[l];
        const prog = (t * ls.speed + ls.phase) % 1;
        const lr = ls.lowOnly
          ? Math.floor(rows * (0.88 - Math.sin(t * 0.6 + l) * 0.025))
          : Math.floor(rows * (0.76 - prog * 0.66));
        const lc = Math.floor(ls.xFrac * cols + Math.sin(t * 0.9 + l * 1.7) * (ls.lowOnly ? 3.5 : 1.2) - smoothPointerX * 1.2);
        const fadeEdge = ls.lowOnly ? 0.95 : Math.sin(prog * Math.PI);
        if (fadeEdge <= 0.08 || lc < 1 || lc >= cols - 3 || lr < 2 || lr >= bridgeRow - 2) continue;
        drawRadialGlow((lc + 1.5) * cellW, (lr + 1) * cellH, 28, palette.lanternGlow, 0.32 * fadeEdge, baseAlpha);
        drawCharCell(lc, lr, '╔', palette.lanternPaper, 0.92 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 1, lr, '═', palette.lanternPaper, 0.92 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 2, lr, '╗', palette.lanternPaper, 0.92 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc, lr + 1, '║', palette.lanternPaper, 0.88 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 1, lr + 1, '♦', palette.lanternGlow, 0.98 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 2, lr + 1, '║', palette.lanternPaper, 0.88 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc, lr + 2, '╚', palette.lanternPaper, 0.82 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 1, lr + 2, '═', palette.lanternPaper, 0.82 * fadeEdge, cellW, cellH, baseAlpha);
        drawCharCell(lc + 2, lr + 2, '╝', palette.lanternPaper, 0.82 * fadeEdge, cellW, cellH, baseAlpha);
      }

      // Organic pulsing fireflies heavily visible across bamboo flanks & open lower boardwalk clearing
      const fireflyCount = Math.max(32, Math.floor(cols * 0.3));
      for (let f = 0; f < fireflyCount; f++) {
        let fx;
        let fy;
        if (f % 2 === 0) {
          // Open lower clearing band (y = 85%..95%)
          fx = ((hash2(f, 17) * width + Math.sin(t * (0.7 + (f % 3) * 0.25) + f * 2.1) * 32) % width + width) % width;
          fy = height * (0.85 + hash2(f, 43) * 0.095) + Math.cos(t * 1.4 + f) * 6;
        } else {
          // Open left & right bamboo flanks
          const onRight = f % 4 === 3;
          fx = width * (onRight ? 0.895 + hash2(f, 17) * 0.095 : 0.01 + hash2(f, 17) * 0.095) + Math.sin(t + f) * 8;
          fy = height * (0.1 + hash2(f, 43) * 0.78) + Math.cos(t * 0.9 + f) * 14;
        }
        const fc = Math.floor(fx / cellW);
        const fr = Math.floor(fy / cellH);
        const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * (2.4 + (f % 3)) + f * 1.9));
        if (pulse > 0.55) {
          drawRadialGlow(fx, fy, 14, palette.fireflyGlow, 0.25 * pulse, baseAlpha);
        }
        drawCharCell(fc, fr, pulse > 0.7 ? '✦' : '•', palette.fireflyGlow, pulse * 0.96, cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'lantern-forest', baseAlpha);

      // Foreground mossy forest boardwalk & water stream shimmer (y = 95.5%..100%)
      for (let c = 0; c < cols; c++) {
        for (let r = bridgeRow; r < rows; r++) {
          if (r === bridgeRow) {
            drawCharCell(c, r, c % 5 === 0 ? '╬' : '═', palette.pierDeck || palette.bambooInk, 0.88, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            const glint = Math.sin(c * 0.3 - t * 2.1 + r) > 0.7;
            if (r > bridgeRow && glint) {
              drawCharCell(c, r, '~', palette.bambooBright, 0.48, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    function renderSceneById(sceneId, t, cols, rows, cellW, cellH, baseAlpha) {
      if (baseAlpha <= 0.01) return;
      drawSkyAtmosphere(sceneId, t, baseAlpha);

      if (sceneId === 'rainy-city') {
        renderRainyCityScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'alpine-stars') {
        renderAlpineStarsScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'ocean-lighthouse') {
        renderOceanLighthouseScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'sakura-trail') {
        renderSakuraTrailScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'midnight-train') {
        renderMidnightTrainScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'desert-dunes') {
        renderDesertDunesScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'cyber-harbor') {
        renderCyberHarborScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'lantern-forest') {
        renderLanternForestScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else {
        renderValleyScene(t, cols, rows, cellW, cellH, baseAlpha);
      }

      drawPointerWake(t, baseAlpha);
      drawGustSparks(t, baseAlpha);
    }

    function renderFrame(timeSec = 0) {
      if (!ctx || width <= 0 || height <= 0) return;
      const t = Number.isFinite(timeSec) ? timeSec : 0;
      if (lastTickMs === 0) {
        smoothPointerX = pointerX;
        smoothPointerY = pointerY;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      const cellW = DEFAULT_CELL_W;
      const cellH = DEFAULT_CELL_H;
      const cols = Math.ceil(width / cellW) + 1;
      const rows = Math.ceil(height / cellH) + 1;

      ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
      ctx.textBaseline = 'top';

      while (gusts.length > 0 && t - gusts[0].bornSec > 2.2) {
        gusts.shift();
      }
      while (gustSparks.length > 0 && t - gustSparks[0].bornSec > gustSparks[0].life) {
        gustSparks.shift();
      }
      while (pointerWake.length > 0 && t - pointerWake[0].bornSec > 0.9) {
        pointerWake.shift();
      }

      const sel = resolveSceneAtTime(sceneMode, t);
      renderSceneById(sel.primary, t, cols, rows, cellW, cellH, 1);
      if (sel.secondary && sel.blend > 0.01) {
        renderSceneById(sel.secondary, t, cols, rows, cellW, cellH, sel.blend);
      }

      ctx.restore();
    }

    function loop(nowMs) {
      rafId = 0;
      if (disposed || userPaused || isReducedMotion()) return;
      if (!lastTickMs) lastTickMs = nowMs;
      const dtSec = Math.min(0.1, Math.max(0, (nowMs - lastTickMs) / 1000));
      lastTickMs = nowMs;
      elapsedSec += dtSec;

      const damp = Math.min(1, dtSec * 6.5);
      smoothPointerX += (pointerX - smoothPointerX) * damp;
      smoothPointerY += (pointerY - smoothPointerY) * damp;

      if (nowMs - lastDrawMs >= 1000 / TARGET_FPS) {
        lastDrawMs = nowMs;
        renderFrame(elapsedSec);
      }
      if (typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(loop);
      }
    }

    function start() {
      if (disposed) return;
      renderFrame(elapsedSec);
      if (userPaused || isReducedMotion()) return;
      if (!rafId && typeof requestAnimationFrame === 'function') {
        lastTickMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        rafId = requestAnimationFrame(loop);
      }
    }

    function pause() {
      userPaused = true;
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
      rafId = 0;
    }

    function resume() {
      userPaused = false;
      start();
    }

    function triggerGust(clientX, clientY) {
      if (isReducedMotion()) return;
      const x = Number.isFinite(Number(clientX)) ? Number(clientX) : width * 0.5;
      const y = Number.isFinite(Number(clientY)) ? Number(clientY) : height * 0.55;
      gusts.push({ x, y, bornSec: elapsedSec, strength: 1 });
      if (gusts.length > 6) gusts.shift();

      if (Math.hypot(x - lastMascotCenter.x, y - lastMascotCenter.y) <= 72) {
        mascotHopSec = elapsedSec;
      }

      const activeId = resolveSceneAtTime(sceneMode, elapsedSec).primary;
      const spec = getSparkSpec(activeId);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + (elapsedSec % 1);
        const speed = 36 + (i % 3) * 18;
        gustSparks.push({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed * 0.65 - 10,
          bornSec: elapsedSec,
          life: 1.25,
          glyph: spec.glyphs[i % spec.glyphs.length],
          color: spec.color,
        });
      }
      while (gustSparks.length > 48) gustSparks.shift();

      if (userPaused) renderFrame(elapsedSec);
    }

    function setPointerOffset(nx, ny) {
      const nextX = Math.max(-1, Math.min(1, Number(nx) || 0));
      const nextY = Math.max(-1, Math.min(1, Number(ny) || 0));
      if ((Math.abs(nextX - pointerX) > 0.06 || Math.abs(nextY - pointerY) > 0.06) && elapsedSec - lastWakeSec >= 0.08 && width > 0 && height > 0) {
        lastWakeSec = elapsedSec;
        pointerWake.push({
          x: (nextX * 0.5 + 0.5) * width,
          y: (nextY * 0.5 + 0.5) * height,
          bornSec: elapsedSec,
        });
        if (pointerWake.length > 6) pointerWake.shift();
      }
      pointerX = nextX;
      pointerY = nextY;
    }

    function setPalette(paletteName, isDark) {
      palette = resolveClaudeFmPalette(paletteName, isDark);
      renderFrame(elapsedSec);
    }

    function setScene(nextScene) {
      const normalized = normalizeScene(nextScene);
      if (normalized !== sceneMode) {
        sceneMode = normalized;
        renderFrame(elapsedSec);
      }
    }

    function setAudioActive(active) {
      const next = Boolean(active);
      if (next !== audioActive) {
        audioActive = next;
        renderFrame(elapsedSec);
      }
    }

    function setFontFamily(nextFont) {
      if (nextFont && typeof nextFont === 'string') {
        fontFamily = nextFont;
      }
    }

    function dispose() {
      disposed = true;
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
      rafId = 0;
      gusts.length = 0;
      gustSparks.length = 0;
      pointerWake.length = 0;
    }

    return {
      resize,
      renderFrame,
      start,
      pause,
      resume,
      isPaused: () => userPaused,
      triggerGust,
      setPointerOffset,
      setPalette,
      setScene,
      getScene: () => sceneMode,
      getActiveSceneId: () => resolveSceneAtTime(sceneMode, elapsedSec).primary,
      getElapsedSec: () => elapsedSec,
      setAudioActive,
      setFontFamily,
      dispose,
    };
  }

  // Zero-dependency Web Audio Lo-Fi Ambient Synth ("music for thinking and building")
  function createAmbientSynthEngine(win = typeof window !== 'undefined' ? window : globalThis) {
    let ctx = null;
    let masterGain = null;
    let filterNode = null;
    let chordTimer = null;
    let activeNodes = [];
    let playing = false;
    let muted = false;
    let volume = 55;
    let stepIndex = 0;

    const CHORDS = [
      [174.61, 220.0, 261.63, 329.63, 392.0],
      [164.81, 196.0, 246.94, 293.66, 392.0],
      [146.83, 174.61, 220.0, 261.63, 329.63],
      [130.81, 164.81, 196.0, 246.94, 293.66],
    ];
    const PLUCK_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];

    function ensureContext() {
      if (ctx) return true;
      const AudioCtor = win && (win.AudioContext || win.webkitAudioContext);
      if (typeof AudioCtor !== 'function') return false;
      try {
        ctx = new AudioCtor();
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 920;
        filterNode.Q.value = 0.7;

        masterGain = ctx.createGain();
        masterGain.gain.value = 0;
        filterNode.connect(masterGain);
        masterGain.connect(ctx.destination);
        return true;
      } catch {
        ctx = null;
        return false;
      }
    }

    function applyGain() {
      if (!ctx || !masterGain) return;
      const target = playing && !muted ? (volume / 100) * 0.16 : 0;
      const now = ctx.currentTime || 0;
      try {
        if (typeof masterGain.gain.cancelScheduledValues === 'function') {
          masterGain.gain.cancelScheduledValues(now);
        }
        if (typeof masterGain.gain.setTargetAtTime === 'function') {
          masterGain.gain.setTargetAtTime(target, now, 0.08);
        } else {
          masterGain.gain.value = target;
        }
      } catch {}
    }

    function clearStepNodes() {
      for (const n of activeNodes) {
        try {
          if (typeof n.stop === 'function') n.stop();
        } catch {}
        try {
          if (typeof n.disconnect === 'function') n.disconnect();
        } catch {}
      }
      activeNodes = [];
    }

    function scheduleChord() {
      if (!playing || !ctx || !filterNode) return;
      clearStepNodes();
      const chord = CHORDS[stepIndex % CHORDS.length];
      const now = ctx.currentTime || 0;

      for (let i = 0; i < chord.length; i++) {
        try {
          const osc = ctx.createOscillator();
          const voiceGain = ctx.createGain();
          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.value = chord[i];
          if ('detune' in osc && osc.detune) {
            osc.detune.value = (i % 2 === 0 ? 1 : -1) * 4;
          }
          const peak = i === 0 ? 0.28 : 0.15;
          if (typeof voiceGain.gain.setValueAtTime === 'function') {
            voiceGain.gain.setValueAtTime(0.0001, now);
            voiceGain.gain.linearRampToValueAtTime(peak, now + 0.45);
            voiceGain.gain.linearRampToValueAtTime(peak * 0.65, now + 4.2);
          } else {
            voiceGain.gain.value = peak;
          }
          osc.connect(voiceGain);
          voiceGain.connect(filterNode);
          osc.start(now);
          activeNodes.push(osc, voiceGain);
        } catch {}
      }

      try {
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.value = PLUCK_NOTES[(stepIndex * 3 + 1) % PLUCK_NOTES.length];
        if (typeof bellGain.gain.setValueAtTime === 'function') {
          bellGain.gain.setValueAtTime(0.0001, now + 0.8);
          bellGain.gain.linearRampToValueAtTime(0.09, now + 0.85);
          bellGain.gain.linearRampToValueAtTime(0.0001, now + 2.8);
        } else {
          bellGain.gain.value = 0.04;
        }
        bell.connect(bellGain);
        bellGain.connect(filterNode);
        bell.start(now + 0.8);
        activeNodes.push(bell, bellGain);
      } catch {}

      stepIndex++;
    }

    function play() {
      playing = true;
      if (!ensureContext()) return false;
      try {
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          ctx.resume().catch(() => {});
        }
      } catch {}
      applyGain();
      if (!chordTimer) {
        scheduleChord();
        chordTimer = setInterval(scheduleChord, 4400);
      }
      return true;
    }

    function pause() {
      playing = false;
      if (chordTimer) {
        clearInterval(chordTimer);
        chordTimer = null;
      }
      applyGain();
    }

    function setVolume(nextVol) {
      volume = clampVolume(nextVol);
      applyGain();
    }

    function setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      applyGain();
    }

    function dispose() {
      pause();
      clearStepNodes();
      try {
        if (filterNode && typeof filterNode.disconnect === 'function') filterNode.disconnect();
        if (masterGain && typeof masterGain.disconnect === 'function') masterGain.disconnect();
        if (ctx && typeof ctx.close === 'function') ctx.close().catch(() => {});
      } catch {}
      filterNode = null;
      masterGain = null;
      ctx = null;
    }

    return {
      play,
      pause,
      setVolume,
      setMuted,
      isPlaying: () => playing,
      getVolume: () => volume,
      isMuted: () => muted,
      dispose,
    };
  }

  return {
    CLAUDE_FM_VIDEO_ID,
    CLAUDE_FM_WATCH_URL,
    LIVE_BG_MODES,
    AUDIO_SOURCES,
    CLAUDE_FM_SCENES,
    SCENE_CYCLE_ORDER,
    SCENE_CYCLE_SECONDS,
    SCENE_CROSSFADE_SECONDS,
    normalizeLiveBackground,
    normalizeAudioSource,
    normalizeScene,
    resolveSceneAtTime,
    clampVolume,
    buildYouTubeEmbedUrl,
    buildYouTubeCommand,
    buildYouTubeListeningMessage,
    resolveClaudeFmPalette,
    createClaudeFmScene,
    createAmbientSynthEngine,
  };
});
