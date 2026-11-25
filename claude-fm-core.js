(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.__agCsClaudeFmCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const CLAUDE_FM_VIDEO_ID = 'tRsQsTMvPNg';
  const CLAUDE_FM_WATCH_URL = 'https://www.youtube.com/live/tRsQsTMvPNg';
  const LIVE_BG_MODES = ['claude-fm', 'youtube', 'ripple', 'off'];
  const AUDIO_SOURCES = ['youtube', 'synth'];
  const CLAUDE_FM_SCENES = ['auto', 'valley', 'rainy-city', 'alpine-stars', 'ocean-lighthouse', 'sakura-trail'];
  const SCENE_CYCLE_ORDER = ['valley', 'rainy-city', 'alpine-stars', 'ocean-lighthouse', 'sakura-trail'];
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

  function resolveClaudeFmPalette(paletteName, isDark) {
    const dark = Boolean(isDark);
    if (!dark) {
      // Authentic warm parchment Claude FM daylight palette (matches tRsQsTMvPNg)
      return {
        isDark: false,
        sky: paletteName === 'obsidian' ? '#eaecf0' : '#ECEAE0',
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
      };
    }
    if (paletteName === 'obsidian') {
      return {
        isDark: true,
        sky: '#13161d',
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
      };
    }
    // Claude charcoal dark / host dark (exact match to --ag-cs-canvas #191919)
    return {
      isDark: true,
      sky: '#191919',
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
    };
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
  const PETAL_GLYPHS = ['❀', '✿', '*', '·', '•'];

  const CITY_TOWERS = [
    { xFrac: 0.02, w: 9, hFrac: 0.30, spire: true },
    { xFrac: 0.10, w: 12, hFrac: 0.42, spire: false },
    { xFrac: 0.20, w: 8, hFrac: 0.26, spire: false },
    { xFrac: 0.27, w: 11, hFrac: 0.36, spire: true },
    { xFrac: 0.62, w: 10, hFrac: 0.33, spire: false },
    { xFrac: 0.71, w: 13, hFrac: 0.45, spire: true },
    { xFrac: 0.83, w: 9, hFrac: 0.31, spire: false },
    { xFrac: 0.91, w: 11, hFrac: 0.38, spire: true },
  ];

  const TORII_ART = [
    '  ╤═══════════╤  ',
    ' ═╬═══════════╬═ ',
    '  ║   ┌───┐   ║  ',
    '  ║   │   │   ║  ',
    '  ║   │   │   ║  ',
    '  ║   │   │   ║  ',
  ];

  const LIGHTHOUSE_ART = [
    '   /\\   ',
    '  [◉◉]  ',
    '  ║██║  ',
    '  ║░░║  ',
    '  ║██║  ',
    '  ║░░║  ',
    ' ╔████╗ ',
  ];

  const CRESCENT_MOON = [
    "  _.-' ",
    " /  .' ",
    "|  |   ",
    " \\  '. ",
    "  '-._ ",
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
    let disposed = false;
    const gusts = []; // { x, y, bornSec, strength }

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
      ctx.globalAlpha = alpha * baseAlpha;
      ctx.fillStyle = color;
      ctx.fillText(ch, col * cellW, row * cellH);
    }

    function drawClouds(t, cols, rows, skyShiftCols, cellW, cellH, baseAlpha, maxRowFrac = 0.42) {
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
            const inHeadlineZone = cc >= cols * 0.22 && cc <= cols * 0.78 && rr <= rows * 0.20;
            const cloudAlpha = (ch === '.' || ch === ':' || ch === '`' ? 0.45 : 0.72) * (inHeadlineZone ? 0.2 : 1);
            drawCharCell(
              cc,
              rr,
              twinkle && (ch === '.' || ch === ':') ? '•' : ch,
              palette.glyphInk,
              cloudAlpha,
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
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
        const centerDip = Math.max(0, 1 - centerDist * 4.5) * 0.032;
        const spireTopRow = Math.floor(
          rows * (startFrac + centerDip + (1 - spireNoise) * 0.075 - (microSpike > 0.72 ? 0.028 : 0))
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

    function drawMascot(timeSec, sceneId, baseAlpha = 1) {
      if (!ctx || width <= 0 || height <= 0) return;
      const walkCycle = Math.floor((timeSec * 4.2) % 4);
      const bobPx = walkCycle === 1 || walkCycle === 3 ? -1 : 0;
      const blinkPhase = timeSec % 4.6;
      const isBlinking = blinkPhase > 4.42;

      const px = Math.max(2, Math.min(4, Math.floor(height / 195)));
      const spriteW = 22 * px;
      const spriteH = 14 * px;
      const baseX = Math.round(width * 0.5 - spriteW * 0.5 + pointerX * 6);
      const baseY = Math.round(height * 0.855 - spriteH + bobPx * px + pointerY * 3);

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

      const legRows = LEG_FRAMES[walkCycle];
      for (let lr = 0; lr < legRows.length; lr++) {
        const rowStr = legRows[lr];
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch === '.') continue;
          ctx.fillStyle = colorMap[ch];
          ctx.fillRect(baseX + c * px, baseY + (11 + lr) * px, px, px);
        }
      }

      // Scene-specific gear for Clawd traveler
      if (sceneId === 'rainy-city') {
        // Pixel umbrella held in front right hand
        const uCenterX = baseX + 14 * px;
        const uCanopyY = baseY - 7 * px;
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
      } else {
        // Classic walking staff
        const staffSwivel = walkCycle === 1 ? 1 : walkCycle === 3 ? -1 : 0;
        const staffX = baseX + (20 + staffSwivel) * px;
        const staffTop = baseY + 5 * px;
        for (let sy = 0; sy < 9; sy++) {
          ctx.fillStyle = sy === 0 ? palette.packDark : palette.staff;
          ctx.fillRect(staffX, staffTop + sy * px, px, px);
        }
        if (sceneId === 'alpine-stars' || sceneId === 'ocean-lighthouse' || sceneId === 'sakura-trail') {
          // Warm glowing lantern hanging from staff tip
          ctx.fillStyle = palette.packDark;
          ctx.fillRect(staffX + px, staffTop, 2 * px, px);
          ctx.fillRect(staffX + 2 * px, staffTop + px, px, px);
          ctx.globalAlpha = 0.25 * baseAlpha;
          ctx.fillStyle = palette.lanternGlow;
          ctx.fillRect(staffX, staffTop + px, 5 * px, 5 * px);
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = palette.lanternGlow;
          ctx.fillRect(staffX + px, staffTop + 2 * px, 3 * px, 3 * px);
          ctx.fillStyle = palette.packDark;
          ctx.fillRect(staffX + px, staffTop + 5 * px, 3 * px, px);
        }
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
        ctx.fillStyle = palette.headphonePad;
        ctx.fillRect(baseX + 8 * px, baseY + 3 * px, 2 * px, 3 * px);

        ctx.font = `bold ${Math.max(11, px * 3)}px ${fontFamily}`;
        ctx.textBaseline = 'top';
        const noteGlyphs = ['♪', '♫'];
        for (let n = 0; n < 2; n++) {
          const phase = (timeSec * 0.42 + n * 0.5) % 1;
          const ny = baseY - (3 + phase * 9) * px;
          const nx = baseX + (7 - phase * 4 + Math.sin(timeSec * 2.5 + n) * 1.4) * px;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.92 * baseAlpha;
          ctx.fillStyle = palette.noteInk;
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
        if (Math.abs(dist - front) < 44) {
          gustBoost = Math.max(gustBoost, (1 - age / 2.2) * 0.9);
        }
      }
      return gustBoost;
    }

    function renderValleyScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShiftCols = t * 0.55 - pointerX * 1.2;
      const ridgeShiftCols = t * 1.35 - pointerX * 2.5;
      const fgShiftCols = t * 3.1 - pointerX * 4.5;

      drawClouds(t, cols, rows, skyShiftCols, cellW, cellH, baseAlpha);

      const valleyLeft = Math.floor(cols * 0.27);
      const valleyRight = Math.floor(cols * 0.65);
      const shelfEndCol = Math.floor(cols * 0.19);
      const shelfTopRow = Math.floor(rows * 0.54);
      const shelfBotRow = Math.floor(rows * 0.59);
      const fgBaseRow = Math.floor(rows * 0.855);
      const midColor = palette.valleyMid || palette.cliff;
      const windScale = palette.isDark ? 1 : 0.42;
      const texScale = palette.isDark ? 1 : 0.55;

      for (let c = 0; c < cols; c++) {
        const worldC = c + ridgeShiftCols;
        const nHorizon = fbm1(worldC * 0.045, 7);
        let ridgeRow;
        if (c < cols * 0.30) {
          const slopeT = c / (cols * 0.30);
          ridgeRow = Math.floor(rows * (0.42 + slopeT * 0.09 + (nHorizon - 0.5) * 0.06));
        } else if (c <= cols * 0.60) {
          ridgeRow = Math.floor(rows * (0.50 + (nHorizon - 0.5) * 0.06));
        } else {
          const riseT = Math.min(1, (c - cols * 0.60) / (cols * 0.40));
          ridgeRow = Math.floor(rows * (0.49 - riseT * 0.08 + (nHorizon - 0.5) * 0.09));
        }
        const inCenterClearing = c >= valleyLeft && c <= valleyRight;

        for (let r = ridgeRow; r < Math.min(rows, fgBaseRow + 3); r++) {
          if (c <= shelfEndCol && r >= shelfTopRow && r <= shelfBotRow) {
            const edgeNoise = hash2(Math.floor(worldC), r);
            if (r > shelfTopRow || edgeNoise > 0.2) {
              drawCharCell(c, r, edgeNoise < 0.14 ? '#' : '█', midColor, palette.isDark ? 0.82 : 0.48, cellW, cellH, baseAlpha);
              continue;
            }
          }
          const depth = r - ridgeRow;
          const tex = valueNoise2(worldC * 0.22, r * 0.35, 13);

          if (inCenterClearing && r >= Math.floor(rows * 0.50)) {
            const windWave = Math.sin(c * 0.16 - t * 2.25 + r * 0.42);
            const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
            const activity = windWave * 0.5 + 0.5 + gustBoost;
            const valleyDepth = (r - Math.floor(rows * 0.50)) / Math.max(1, fgBaseRow - Math.floor(rows * 0.50));
            if (activity > 0.42 || valleyDepth > 0.35 || tex > 0.38) {
              const wIdx = Math.floor((tex * 6 + t * 1.65 + c * 0.18 + r * 0.25) % WIND_GLYPHS.length);
              const glyph = WIND_GLYPHS[Math.max(0, wIdx)];
              const glyphColor =
                gustBoost > 0.25
                  ? palette.accent
                  : glyph === 'X' && valleyDepth > 0.45 && palette.isDark
                  ? palette.glyphInk
                  : palette.glyphWind;
              drawCharCell(
                c,
                r,
                glyph,
                glyphColor,
                Math.min(0.86, 0.28 + valleyDepth * 0.28 + activity * 0.26) * windScale,
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

      for (let m = 0; m < 18; m++) {
        const mx = ((hash2(m, 91) * width + t * (10 + (m % 5) * 3)) % (width + 20)) - 10;
        const my = (hash2(m, 137) * height * 0.52) + Math.sin(t * 0.9 + m) * 6;
        ctx.globalAlpha = (0.28 + 0.25 * Math.sin(t * 1.4 + m * 2.1)) * baseAlpha;
        ctx.fillStyle = palette.glyphMuted;
        ctx.fillText(m % 3 === 0 ? '•' : '.', Math.round(mx), Math.round(my));
      }

      drawMascot(t, 'valley', baseAlpha);
      drawForegroundSpires(t, cols, rows, fgShiftCols, cellW, cellH, baseAlpha, {
        startFrac: 0.855,
        fill: palette.valleyFg,
        pocket: palette.valleyFgPocket,
      });
    }

    function renderRainyCityScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.3 - pointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.34);

      const streetRow = Math.floor(rows * 0.855);
      const parallax = pointerX * 2.5;

      // Distant background skyline silhouettes
      for (let c = 0; c < cols; c++) {
        const bNoise = hash2(Math.floor((c + t * 0.15) / 6), 55);
        const topRow = Math.floor(rows * (0.48 + bNoise * 0.18));
        if (c > cols * 0.28 && c < cols * 0.68) continue;
        for (let r = topRow; r < streetRow; r++) {
          drawCharCell(c, r, '▓', palette.cliffPocket, 0.32, cellW, cellH, baseAlpha);
        }
      }

      // Main skyscrapers on left and right flanks with warm lit windows
      for (let b = 0; b < CITY_TOWERS.length; b++) {
        const tw = CITY_TOWERS[b];
        const startC = Math.floor(tw.xFrac * cols - parallax);
        const topR = Math.floor(rows * (0.84 - tw.hFrac));
        if (tw.spire) {
          const spireC = startC + Math.floor(tw.w / 2);
          for (let sr = Math.max(2, topR - 3); sr < topR; sr++) {
            drawCharCell(spireC, sr, '|', palette.glyphInk, 0.72, cellW, cellH, baseAlpha);
          }
          if (Math.sin(t * 2.4 + b) > 0.1) {
            drawCharCell(spireC, Math.max(1, topR - 4), '•', palette.windowGlow, 0.92, cellW, cellH, baseAlpha);
          }
        }
        for (let c = startC; c < startC + tw.w; c++) {
          if (c < 0 || c >= cols) continue;
          const isEdge = c === startC || c === startC + tw.w - 1;
          for (let r = topR; r < streetRow; r++) {
            if (!isEdge && (c - startC) % 2 === 1 && (r - topR) % 2 === 1 && r > topR) {
              const winHash = hash2(c * 13 + b, r * 17);
              const flicker = hash2(c + Math.floor(t * 0.25), r) < 0.08;
              const lit = (winHash > 0.56) !== flicker;
              drawCharCell(c, r, lit ? '▪' : '▫', lit ? palette.windowGlow : palette.cliffPocket, lit ? 0.92 : 0.45, cellW, cellH, baseAlpha);
            } else {
              drawCharCell(c, r, '█', palette.cliff, 0.92, cellW, cellH, baseAlpha);
            }
          }
        }
      }

      // Wet street reflections & puddle ripples along y = 79%..85.5%
      for (let c = 0; c < cols; c++) {
        for (let r = Math.floor(rows * 0.79); r < streetRow; r++) {
          const splash = hash2(c + Math.floor(t * 5), r * 29) > 0.94;
          const wave = Math.sin(c * 0.4 + t * 3 + r) > 0.65;
          if (splash || wave) {
            drawCharCell(c, r, splash ? 'o' : '~', palette.rainInk, splash ? 0.78 : 0.42, cellW, cellH, baseAlpha);
          }
        }
      }

      // Slanting animated rain streaks across the whole frame
      const rainCols = Math.ceil(cols * 0.7);
      for (let i = 0; i < rainCols; i++) {
        const rx = ((hash2(i, 71) * width - t * (95 + (i % 4) * 20)) % width + width) % width;
        const ry = ((hash2(i, 113) * height + t * (260 + (i % 5) * 35)) % (height * 0.86));
        const rc = Math.floor(rx / cellW);
        const rr = Math.floor(ry / cellH);
        const gustBoost = computeGustBoost(rc, rr, t, cellW, cellH);
        drawCharCell(rc, rr, gustBoost > 0.2 ? '|' : '/', palette.rainInk, Math.min(0.85, 0.36 + (i % 3) * 0.14 + gustBoost * 0.4), cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'rainy-city', baseAlpha);

      // Wet dark foreground pavement & curb blocks (y = 85.5%..100%)
      for (let c = 0; c < cols; c++) {
        for (let r = streetRow; r < rows; r++) {
          const puddle = valueNoise2(c * 0.35 + t * 0.4, r * 0.6, 89);
          if (r === streetRow && c % 4 === 0) {
            drawCharCell(c, r, '═', palette.glyphMuted, 0.65, cellW, cellH, baseAlpha);
          } else {
            ctx.globalAlpha = baseAlpha;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            if (r > streetRow + 1 && puddle > 0.8) {
              drawCharCell(c, r, '~', palette.cliffPocket, 0.6, cellW, cellH, baseAlpha);
            }
          }
        }
      }
    }

    function renderAlpineStarsScene(t, cols, rows, cellW, cellH, baseAlpha) {
      // Twinkling ASCII starfield
      const starCount = Math.max(48, Math.floor(cols * 0.55));
      for (let s = 0; s < starCount; s++) {
        const sc = Math.floor(hash2(s, 11) * cols);
        const sr = Math.floor(hash2(s, 29) * rows * 0.50);
        const pulse = Math.sin(t * (1.8 + (s % 4) * 0.7) + s * 1.7);
        const glyph = s % 7 === 0 ? '✦' : s % 3 === 0 ? '*' : pulse > 0.2 ? '·' : '.';
        const inHeadlineZone = sc >= cols * 0.22 && sc <= cols * 0.78 && sr <= rows * 0.16;
        drawCharCell(
          sc,
          sr,
          glyph,
          palette.starInk,
          (0.35 + (pulse * 0.5 + 0.5) * 0.6) * (inHeadlineZone ? 0.25 : 1),
          cellW,
          cellH,
          baseAlpha
        );
      }

      // Shooting star periodic streak
      const meteorPhase = (t * 0.22) % 1;
      if (meteorPhase < 0.25) {
        const mp = meteorPhase / 0.25;
        const mc = Math.floor(cols * (0.22 + mp * 0.28));
        const mr = Math.floor(rows * (0.08 + mp * 0.16));
        drawCharCell(mc, mr, '✦', palette.moonInk, 0.95, cellW, cellH, baseAlpha);
        drawCharCell(mc - 1, mr - 1, '\\', palette.moonInk, 0.65, cellW, cellH, baseAlpha);
        drawCharCell(mc - 2, mr - 1, '-', palette.moonInk, 0.35, cellW, cellH, baseAlpha);
      }

      // Crescent moon in upper-right sky
      const moonC = Math.floor(cols * 0.80 - pointerX * 1.5);
      const moonR = Math.floor(rows * 0.08);
      for (let r = 0; r < CRESCENT_MOON.length; r++) {
        const line = CRESCENT_MOON[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] !== ' ') {
            drawCharCell(moonC + c, moonR + r, line[c], palette.moonInk, 0.92, cellW, cellH, baseAlpha);
          }
        }
      }

      // Geometric layered alpine mountain peaks
      const fgStartRow = Math.floor(rows * 0.855);
      const mShift = t * 0.65 - pointerX * 2.2;
      const peaks = [
        { center: 0.14, halfW: 0.22, topFrac: 0.34 },
        { center: 0.30, halfW: 0.16, topFrac: 0.45 },
        { center: 0.70, halfW: 0.18, topFrac: 0.42 },
        { center: 0.87, halfW: 0.22, topFrac: 0.32 },
      ];
      for (let c = 0; c < cols; c++) {
        const xFrac = ((c + mShift * 0.15) / cols);
        let peakRow = Math.floor(rows * 0.62);
        for (let p = 0; p < peaks.length; p++) {
          const pk = peaks[p];
          const dist = Math.abs(xFrac - pk.center);
          if (dist < pk.halfW) {
            const h = pk.topFrac + (dist / pk.halfW) * (0.68 - pk.topFrac);
            peakRow = Math.min(peakRow, Math.floor(rows * h));
          }
        }
        for (let r = peakRow; r < fgStartRow; r++) {
          const d = r - peakRow;
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          if (r >= Math.floor(rows * 0.63) && c > cols * 0.26 && c < cols * 0.68) {
            // Soft alpine mist floor under Clawd
            const mist = Math.sin(c * 0.2 - t * 1.9 + r * 0.5);
            if (mist > 0.2 || gustBoost > 0.2) {
              drawCharCell(c, r, mist > 0.65 ? '=' : '·', gustBoost > 0.2 ? palette.lanternGlow : palette.glyphWind, 0.48 + gustBoost * 0.4, cellW, cellH, baseAlpha);
            }
          } else if (d === 0) {
            drawCharCell(c, r, c % 2 === 0 ? '^' : '▲', palette.starInk, 0.86, cellW, cellH, baseAlpha);
          } else if (d <= 3) {
            drawCharCell(c, r, (c + r) % 2 === 0 ? '/' : '\\', palette.glyphInk, 0.72, cellW, cellH, baseAlpha);
          } else {
            drawCharCell(c, r, d % 3 === 0 ? '#' : 'X', palette.cliff, 0.78, cellW, cellH, baseAlpha);
          }
        }
      }

      drawMascot(t, 'alpine-stars', baseAlpha);

      // Foreground jagged pine silhouettes (y = 85.5%..100%)
      const fgShift = t * 2.5 - pointerX * 4;
      for (let c = 0; c < cols; c++) {
        const treeCol = Math.floor(c + fgShift);
        const mod = ((treeCol % 5) + 5) % 5;
        const treeHeight = Math.floor(hash2(Math.floor(treeCol / 5), 409) * 4);
        const centerClear = Math.abs(c / cols - 0.5) < 0.11 ? 2 : 0;
        const spireR = Math.floor(rows * 0.86) + centerClear - (mod === 2 ? treeHeight : mod === 1 || mod === 3 ? Math.max(0, treeHeight - 2) : 0);
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

    function renderOceanLighthouseScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.45 - pointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.36);

      // Drifting ASCII seabirds
      for (let g = 0; g < 4; g++) {
        const gc = Math.floor((((0.18 + g * 0.14) * cols + t * (1.2 + g * 0.25)) % (cols + 6)) - 3);
        const gr = Math.floor(rows * (0.14 + (g % 2) * 0.07) + Math.sin(t * 2 + g) * 1.2);
        drawCharCell(gc, gr, Math.sin(t * 4 + g) > 0 ? 'v' : '^', palette.glyphInk, 0.7, cellW, cellH, baseAlpha);
      }

      // Sweeping diagonal lighthouse beam always projecting leftward over open night sky
      const lhCol = Math.floor(cols * 0.82 - pointerX * 2);
      const lhTopRow = Math.floor(rows * 0.34);
      const elev = -0.14 + Math.sin(t * 0.65) * 0.09;
      const beamSpan = Math.floor(cols * (0.48 + 0.14 * Math.cos(t * 0.65)));
      for (let hr = lhTopRow - 1; hr <= lhTopRow + 3; hr++) {
        for (let hc = lhCol + 1; hc <= lhCol + 6; hc++) {
          if (hr >= 0 && hc >= 0 && hc < cols) {
            drawCharCell(hc, hr, '·', palette.beamInk, 0.34, cellW, cellH, baseAlpha);
          }
        }
      }
      for (let step = 2; step < beamSpan; step++) {
        const bc = lhCol + 2 - step;
        if (bc < 0 || bc >= cols) continue;
        const centerR = Math.round(lhTopRow + 1 + step * elev);
        const halfSpread = Math.max(0, Math.floor(step / 9));
        for (let r = centerR - halfSpread; r <= centerR + halfSpread; r++) {
          if (r < 1 || r >= Math.floor(rows * 0.56)) continue;
          const distFade = Math.max(0.12, 0.62 - (step / Math.max(1, beamSpan)) * 0.5);
          drawCharCell(bc, r, step % 3 === 0 ? ':' : step % 2 === 0 ? '/' : '.', palette.beamInk, distFade, cellW, cellH, baseAlpha);
        }
      }

      // Rocky headland + tall ASCII lighthouse on right flank
      const seaStartRow = Math.floor(rows * 0.56);
      const pierTopRow = Math.floor(rows * 0.855);
      for (let r = 0; r < LIGHTHOUSE_ART.length; r++) {
        const line = LIGHTHOUSE_ART[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] === ' ') continue;
          const isLantern = r === 1;
          drawCharCell(lhCol + c, lhTopRow + r, line[c], isLantern ? palette.beamInk : palette.glyphInk, isLantern ? 0.98 : 0.9, cellW, cellH, baseAlpha);
        }
      }
      const cliffBaseR = lhTopRow + LIGHTHOUSE_ART.length;
      for (let c = lhCol - 8; c < cols; c++) {
        if (c < 0) continue;
        const slope = c < lhCol ? Math.floor((lhCol - c) * 0.85) : 0;
        for (let r = cliffBaseR + slope; r < pierTopRow; r++) {
          drawCharCell(c, r, (c + r) % 4 === 0 ? '#' : '█', palette.cliff, 0.88, cellW, cellH, baseAlpha);
        }
      }

      // Layered rolling ASCII ocean waves (y = 56%..85.5%)
      for (let r = seaStartRow; r < pierTopRow; r++) {
        const depth = (r - seaStartRow) / Math.max(1, pierTopRow - seaStartRow);
        const speed = 1.4 + depth * 2.2;
        for (let c = 0; c < cols; c++) {
          if (c >= lhCol - 4 && r >= cliffBaseR + Math.max(0, lhCol - c)) continue;
          const waveVal = Math.sin(c * 0.24 - t * speed + r * 0.85);
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          const shimmer = hash2(c + Math.floor(t * 2.2), r * 19) > 0.92;
          if (waveVal > 0.05 || shimmer || gustBoost > 0.2) {
            const wGlyph = shimmer ? '·' : WAVE_GLYPHS[Math.abs(Math.floor(c + r + t * 2)) % WAVE_GLYPHS.length];
            drawCharCell(
              c,
              r,
              wGlyph,
              shimmer ? palette.beamInk : gustBoost > 0.2 ? palette.accent : palette.waterInk,
              shimmer ? 0.82 : Math.min(0.82, 0.34 + depth * 0.36 + gustBoost * 0.4),
              cellW,
              cellH,
              baseAlpha
            );
          }
        }
      }

      drawMascot(t, 'ocean-lighthouse', baseAlpha);

      // Continuous ASCII coastal pier deck, pilings & dark water reflections (y = 85.5%..100%)
      for (let c = 0; c < cols; c++) {
        const isPiling = ((c + Math.floor(t * 1.5)) % 12 + 12) % 12 < 2;
        for (let r = pierTopRow; r < rows; r++) {
          if (r === pierTopRow) {
            ctx.globalAlpha = 0.85 * baseAlpha;
            ctx.fillStyle = palette.pierDeck;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, 4);
            drawCharCell(c, r, c % 4 === 0 ? '+' : '=', palette.pierDeck, 0.85, cellW, cellH, baseAlpha);
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

    function renderSakuraTrailScene(t, cols, rows, cellW, cellH, baseAlpha) {
      const skyShift = t * 0.42 - pointerX * 1.2;
      drawClouds(t, cols, rows, skyShift, cellW, cellH, baseAlpha, 0.38);

      const fgStartRow = Math.floor(rows * 0.855);
      const ridgeShift = t * 0.9 - pointerX * 2.2;

      // Soft rolling hills + shrine torii gate silhouette on right ridge
      for (let c = 0; c < cols; c++) {
        const nHill = fbm1((c + ridgeShift) * 0.04, 73);
        const hillRow = Math.floor(rows * (0.50 + (nHill - 0.5) * 0.08));
        for (let r = hillRow; r < fgStartRow; r++) {
          const inClearing = c > cols * 0.22 && c < cols * 0.72;
          const gustBoost = computeGustBoost(c, r, t, cellW, cellH);
          if (inClearing && r >= Math.floor(rows * 0.52)) {
            const breeze = Math.sin(c * 0.15 - t * 2.0 + r * 0.4);
            if (breeze > 0.48 || r > Math.floor(rows * 0.75) || gustBoost > 0.2) {
              drawCharCell(
                c,
                r,
                breeze > 0.72 ? '=' : '-',
                gustBoost > 0.2 ? palette.petalInk : palette.glyphWind,
                (0.46 + gustBoost * 0.4) * (palette.isDark ? 1 : 0.48),
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

      // Stylized ASCII Torii gate on clear right midground crest (outside centered Analytics card)
      const toriiC = Math.floor(cols * 0.84 - pointerX * 1.8);
      const toriiR = Math.floor(rows * 0.48) - TORII_ART.length;
      for (let r = 0; r < TORII_ART.length; r++) {
        const line = TORII_ART[r];
        for (let c = 0; c < line.length; c++) {
          if (line[c] === ' ') continue;
          drawCharCell(toriiC + c, toriiR + r, line[c], palette.toriiInk, 0.95, cellW, cellH, baseAlpha);
        }
      }

      // Framing sakura branches on left & right upper corners
      for (let c = 0; c < Math.floor(cols * 0.18); c++) {
        const bRow = Math.floor(rows * (0.14 + Math.sin(c * 0.22) * 0.05));
        drawCharCell(c, bRow, c % 3 === 0 ? '✿' : '~', c % 3 === 0 ? palette.petalInk : palette.roofInk, 0.84, cellW, cellH, baseAlpha);
        if (hash2(c, 99) > 0.45) {
          drawCharCell(c, bRow + 1, '❀', palette.petalAlt, 0.78, cellW, cellH, baseAlpha);
        }
      }
      for (let c = Math.floor(cols * 0.82); c < cols; c++) {
        const bRow = Math.floor(rows * (0.12 + Math.cos((cols - c) * 0.24) * 0.045));
        drawCharCell(c, bRow, c % 3 === 0 ? '✿' : '~', c % 3 === 0 ? palette.petalInk : palette.roofInk, 0.84, cellW, cellH, baseAlpha);
        if (hash2(c, 107) > 0.45) {
          drawCharCell(c, bRow + 1, '❀', palette.petalAlt, 0.78, cellW, cellH, baseAlpha);
        }
      }

      // Drifting sakura petals across the breeze
      const petalCount = Math.max(36, Math.floor(cols * 0.35));
      for (let p = 0; p < petalCount; p++) {
        const pxPos = ((hash2(p, 151) * width + t * (28 + (p % 4) * 9)) % (width + 20)) - 10;
        const pyPos = ((hash2(p, 223) * height * 0.86 + t * (16 + (p % 3) * 6) + Math.sin(t * 2 + p) * 14) % (height * 0.86));
        const pc = Math.floor(pxPos / cellW);
        const pr = Math.floor(pyPos / cellH);
        const gustBoost = computeGustBoost(pc, pr, t, cellW, cellH);
        const glyph = PETAL_GLYPHS[p % PETAL_GLYPHS.length];
        drawCharCell(pc, pr, glyph, p % 2 === 0 ? palette.petalInk : palette.petalAlt, Math.min(0.95, 0.62 + gustBoost * 0.3), cellW, cellH, baseAlpha);
      }

      drawMascot(t, 'sakura-trail', baseAlpha);
      drawForegroundSpires(t, cols, rows, t * 2.2 - pointerX * 4, cellW, cellH, baseAlpha, {
        startFrac: 0.855,
        fill: palette.sakuraFg,
        pocket: palette.sakuraFgPocket,
      });
    }

    function renderSceneById(sceneId, t, cols, rows, cellW, cellH, baseAlpha) {
      if (baseAlpha <= 0.01) return;
      ctx.globalAlpha = baseAlpha;
      ctx.fillStyle = palette.sky;
      ctx.fillRect(0, 0, width, height);

      if (sceneId === 'rainy-city') {
        renderRainyCityScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'alpine-stars') {
        renderAlpineStarsScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'ocean-lighthouse') {
        renderOceanLighthouseScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else if (sceneId === 'sakura-trail') {
        renderSakuraTrailScene(t, cols, rows, cellW, cellH, baseAlpha);
      } else {
        renderValleyScene(t, cols, rows, cellW, cellH, baseAlpha);
      }
    }

    function renderFrame(timeSec = 0) {
      if (!ctx || width <= 0 || height <= 0) return;
      const t = Number.isFinite(timeSec) ? timeSec : 0;

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
      if (userPaused) renderFrame(elapsedSec);
    }

    function setPointerOffset(nx, ny) {
      pointerX = Math.max(-1, Math.min(1, Number(nx) || 0));
      pointerY = Math.max(-1, Math.min(1, Number(ny) || 0));
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
    resolveClaudeFmPalette,
    createClaudeFmScene,
    createAmbientSynthEngine,
  };
});
