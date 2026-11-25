(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.__agCsClaudeFmCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const CLAUDE_FM_VIDEO_ID = 'tRsQsTMvPNg';
  const CLAUDE_FM_WATCH_URL = 'https://www.youtube.com/live/tRsQsTMvPNg';
  const LIVE_BG_MODES = ['claude-fm', 'youtube', 'ripple', 'off'];
  const AUDIO_SOURCES = ['youtube', 'synth'];

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
        sky: paletteName === 'obsidian' ? '#eaecf0' : '#ECEAE0',
        glyphInk: '#1B1B18',
        glyphMuted: '#68655C',
        glyphWind: '#4B4942',
        cliff: '#151513',
        cliffPocket: '#3D3B35',
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
      };
    }
    if (paletteName === 'obsidian') {
      return {
        sky: '#13161d',
        glyphInk: '#98a6be',
        glyphMuted: '#58647d',
        glyphWind: '#798aa6',
        cliff: '#06080d',
        cliffPocket: '#2b3446',
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
      };
    }
    // Claude charcoal dark / host dark
    return {
      sky: '#191816',
      glyphInk: '#9c968a',
      glyphMuted: '#534e47',
      glyphWind: '#7d776c',
      cliff: '#0e0d0c',
      cliffPocket: '#2c2925',
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

  // Pre-authored asymmetric ASCII cloud clusters inspired by Claude FM
  const CLOUD_BANKS = [
    {
      xFrac: 0.44,
      yFrac: 0.04,
      speed: 0.35,
      rows: [
        '       .-""-.          ',
        '    .-(      )-.       ',
        '  .(  .:/  \\:.  ).     ',
        ' /   /  \\  /  \\   \\    ',
        '|   :  • )( •  :   |   ',
        ' \\  \\  /  \\  /  /     ',
        "  '._'-.__.-'_.'  <>   ",
        '      `--..--`         ',
      ],
    },
    {
      xFrac: 0.08,
      yFrac: 0.17,
      speed: 0.24,
      rows: [
        '     _.--.._           ',
        '  .-`  ::   `-.        ',
        ' /  .. /  \\ ..  \\      ',
        '(__.__.-==-.__.__)     ',
      ],
    },
    {
      xFrac: 0.67,
      yFrac: 0.19,
      speed: 0.28,
      rows: [
        '     .-.               ',
        '   ./ • \\  .-.         ',
        '  (  / \\ )/ • )        ',
        "   '._.-' '._.'  ..    ",
      ],
    },
    {
      xFrac: 0.87,
      yFrac: 0.06,
      speed: 0.19,
      rows: [
        '  .--.                 ',
        ' ( :: )-.              ',
        "  '--'._.'             ",
      ],
    },
    {
      xFrac: 0.36,
      yFrac: 0.28,
      speed: 0.21,
      rows: [
        '  .-=-.   ..  -=≡-     ',
        ' (  •  )-.__.-.        ',
      ],
    },
  ];

  // 22x17 pixel-art matrix for Clawd traveler (facing right)
  // Legend:
  // '.' transparent
  // 'O' bedroll (#B38046)
  // 'P' backpack (#7E522B)
  // 'D' dark leather / strap / staff outline (#4E3118)
  // 'S' walking staff (#5C3B1E)
  // 'B' terracotta body (#D97757)
  // 'R' terracotta shade (#BD6347)
  // 'E' eye (#111110)
  // 'H' headphones band/shell (only when audioActive)
  // 'Q' headphone earpad accent (only when audioActive)
  const MASCOT_BASE = [
    '.....OOOOOOOOO........',
    '....ODDDDDDDDDO.......',
    '...PPBBBBBBBBBBBB.....',
    '..PPDBBBBBBBBBBBBR....',
    '..PPDBBBBBBBBEBBBE....',
    '..PPDBBBBBBBBEBBBE....',
    '..PPDBBBBBBBBBBBBBB...',
    '..PPDBBBBBBBBBBBBBBB..',
    '..PPDBBBBBBBBBBBBRR...',
    '...PDRRRRRRRRRRRRR....',
    '....RBBBBBBBBBBBBR....',
    '......................',
  ];

  const LEG_FRAMES = [
    [
      '.....BB..BB...BB..BB..',
      '.....RR..RR...RR..RR..',
      '.....DD..DD...DD..DD..',
    ],
    [
      '....BB...BB..BB...BB..',
      '....RR....RR.RR....RR.',
      '....DD....DD.DD....DD.',
    ],
    [
      '.....BB..BB...BB..BB..',
      '.....RR..RR...RR..RR..',
      '.....DD..DD...DD..DD..',
    ],
    [
      '......BB..BB..BB..BB..',
      '.....RR..RR....RR..RR.',
      '.....DD..DD....DD..DD.',
    ],
  ];

  const WIND_GLYPHS = ['/', '=', '≡', '-', '<', '>', '.', ' '];
  const RIDGE_DENSE = ['█', '#', 'X', 'x', '<', '>', '•'];

  function createClaudeFmScene(canvas, opts = {}) {
    let palette = resolveClaudeFmPalette(opts.palette || 'claude', opts.isDark);
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
      if (typeof opts.reducedMotion === 'function') return Boolean(opts.reducedMotion());
      return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    function drawCharCell(col, row, ch, color, alpha, cellW, cellH) {
      if (!ctx || !ch || ch === ' ') return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillText(ch, col * cellW, row * cellH);
    }

    function drawMascot(timeSec) {
      if (!ctx || width <= 0 || height <= 0) return;
      const walkCycle = Math.floor((timeSec * 4.2) % 4);
      const bobPx = walkCycle === 1 || walkCycle === 3 ? -1 : 0;
      const blinkPhase = timeSec % 4.6;
      const isBlinking = blinkPhase > 4.42;

      // Integer pixel scale proportional to canvas height
      const px = Math.max(2, Math.min(7, Math.floor(height / 145)));
      const spriteW = 22 * px;
      const spriteH = 15 * px;
      const baseX = Math.round(width * 0.5 - spriteW * 0.5 + pointerX * 6);
      const baseY = Math.round(height * 0.635 - spriteH + bobPx * px + pointerY * 3);

      const colorMap = {
        O: palette.bedroll,
        P: palette.pack,
        D: palette.packDark,
        S: palette.staff,
        B: palette.mascotBody,
        R: palette.mascotShade,
        E: isBlinking ? palette.mascotBody : palette.mascotEye,
        H: palette.headphones,
        Q: palette.headphonePad,
      };

      ctx.globalAlpha = 1;
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

      // Draw 4 animated legs below torso (rows 11..13)
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

      // Walking staff in front right hand
      const staffSwivel = walkCycle === 1 ? 1 : walkCycle === 3 ? -1 : 0;
      const staffX = baseX + (20 + staffSwivel) * px;
      const staffTop = baseY + 5 * px;
      for (let sy = 0; sy < 10; sy++) {
        ctx.fillStyle = sy === 0 ? palette.packDark : palette.staff;
        ctx.fillRect(staffX, staffTop + sy * px, px, px);
      }

      // Optional headphones + floating musical notes when Claude FM audio is active
      if (audioActive) {
        // Headband arch + earcup over head
        ctx.fillStyle = palette.headphones;
        for (let c = 9; c <= 14; c++) {
          ctx.fillRect(baseX + c * px, baseY - px, px, px);
        }
        ctx.fillRect(baseX + 8 * px, baseY, px, 3 * px);
        ctx.fillRect(baseX + 15 * px, baseY, px, 2 * px);
        ctx.fillStyle = palette.headphonePad;
        ctx.fillRect(baseX + 8 * px, baseY + 3 * px, 2 * px, 3 * px);

        // Two drifting pixel music notes rising gently from headphones
        ctx.font = `bold ${Math.max(11, px * 3)}px ${fontFamily}`;
        ctx.textBaseline = 'top';
        const noteGlyphs = ['♪', '♫'];
        for (let n = 0; n < 2; n++) {
          const phase = (timeSec * 0.42 + n * 0.5) % 1;
          const ny = baseY - (3 + phase * 11) * px;
          const nx = baseX + (7 - phase * 4 + Math.sin(timeSec * 2.5 + n) * 1.4) * px;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.92;
          ctx.fillStyle = palette.noteInk;
          ctx.fillText(noteGlyphs[n], Math.round(nx), Math.round(ny));
        }
        ctx.globalAlpha = 1;
      }
    }

    function renderFrame(timeSec = 0) {
      if (!ctx || width <= 0 || height <= 0) return;
      const t = Number.isFinite(timeSec) ? timeSec : 0;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      // 1. Solid Sky Fill
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.sky;
      ctx.fillRect(0, 0, width, height);

      const cellW = DEFAULT_CELL_W;
      const cellH = DEFAULT_CELL_H;
      const cols = Math.ceil(width / cellW) + 1;
      const rows = Math.ceil(height / cellH) + 1;

      ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`;
      ctx.textBaseline = 'top';

      // Parallax offsets (slow left-to-right / right-to-left continuous side-scroll)
      const skyShiftCols = t * 0.55 - pointerX * 1.2;
      const ridgeShiftCols = t * 1.35 - pointerX * 2.5;
      const fgShiftCols = t * 3.1 - pointerX * 4.5;

      // 2. Layer 1 — Drifting ASCII Cloud Clusters (Sky 0%..38%)
      for (let b = 0; b < CLOUD_BANKS.length; b++) {
        const bank = CLOUD_BANKS[b];
        const cloudRowStart = Math.floor(rows * bank.yFrac);
        const rawCol = bank.xFrac * cols - skyShiftCols * bank.speed;
        const wrapSpan = cols + 28;
        const cloudColStart = (((rawCol % wrapSpan) + wrapSpan) % wrapSpan) - 14;
        for (let r = 0; r < bank.rows.length; r++) {
          const line = bank.rows[r];
          const rr = cloudRowStart + r;
          if (rr < 0 || rr >= rows * 0.42) continue;
          for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (ch === ' ') continue;
            const cc = Math.round(cloudColStart + c);
            if (cc < 0 || cc >= cols) continue;
            const twinkle = hash2(cc + Math.floor(t * 1.4), rr * 17) < 0.08;
            drawCharCell(
              cc,
              rr,
              twinkle && (ch === '.' || ch === ':') ? '•' : ch,
              palette.glyphInk,
              ch === '.' || ch === ':' || ch === '`' ? 0.45 : 0.72,
              cellW,
              cellH
            );
          }
        }
      }

      // 3. Layer 2 & 3 — Midground ASCII Ridges & Wind-Rippled Central Clearing
      const valleyLeft = Math.floor(cols * 0.28);
      const valleyRight = Math.floor(cols * 0.62);
      const shelfEndCol = Math.floor(cols * 0.26);
      const shelfTopRow = Math.floor(rows * 0.49);
      const shelfBotRow = Math.floor(rows * 0.55);
      const fgBaseRow = Math.floor(rows * 0.645);

      // Clean expired interactive wind gusts
      while (gusts.length > 0 && t - gusts[0].bornSec > 2.2) {
        gusts.shift();
      }

      for (let c = 0; c < cols; c++) {
        const worldC = c + ridgeShiftCols;
        const nHorizon = fbm1(worldC * 0.045, 7);

        // Left slope (0..31%), open center plateau (28..62%), higher right terraced ridge (60..100%)
        let ridgeRow;
        if (c < cols * 0.31) {
          const slopeT = c / (cols * 0.31);
          ridgeRow = Math.floor(rows * (0.37 + slopeT * 0.1 + (nHorizon - 0.5) * 0.08));
        } else if (c <= cols * 0.60) {
          ridgeRow = Math.floor(rows * (0.48 + (nHorizon - 0.5) * 0.07));
        } else {
          const riseT = Math.min(1, (c - cols * 0.60) / (cols * 0.40));
          ridgeRow = Math.floor(rows * (0.46 - riseT * 0.12 + (nHorizon - 0.5) * 0.11));
        }

        const inCenterClearing = c >= valleyLeft && c <= valleyRight;

        for (let r = ridgeRow; r < Math.min(rows, fgBaseRow + 4); r++) {
          // Protruding horizontal cliff shelf on left side (x 0..26%, y 49..55%)
          if (c <= shelfEndCol && r >= shelfTopRow && r <= shelfBotRow) {
            const edgeNoise = hash2(Math.floor(worldC), r);
            if (r > shelfTopRow || edgeNoise > 0.22) {
              drawCharCell(c, r, edgeNoise < 0.14 ? '#' : '█', palette.cliff, 0.96, cellW, cellH);
              continue;
            }
          }

          const depth = r - ridgeRow;
          const tex = valueNoise2(worldC * 0.22, r * 0.35, 13);

          if (inCenterClearing && r >= Math.floor(rows * 0.46)) {
            // Light airy grass/mist glyphs sweeping gently in left-to-right wind waves
            const windWave = Math.sin(c * 0.17 - t * 2.35 + r * 0.45);
            let gustBoost = 0;
            for (let g = 0; g < gusts.length; g++) {
              const gu = gusts[g];
              const age = t - gu.bornSec;
              const dx = c * cellW - gu.x;
              const dy = r * cellH - gu.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const front = age * 260;
              if (Math.abs(dist - front) < 42) {
                gustBoost = Math.max(gustBoost, (1 - age / 2.2) * 0.9);
              }
            }
            const activity = windWave * 0.5 + 0.5 + gustBoost;
            if (activity > 0.68 || (r > Math.floor(rows * 0.59) && tex > 0.32)) {
              const wIdx = Math.floor((tex * 5 + t * 1.8 + c * 0.15) % (WIND_GLYPHS.length - 1));
              const glyph = WIND_GLYPHS[Math.max(0, wIdx)];
              drawCharCell(
                c,
                r,
                glyph,
                gustBoost > 0.25 ? palette.accent : palette.glyphWind,
                Math.min(0.88, 0.28 + activity * 0.35),
                cellW,
                cellH
              );
            }
          } else {
            // Terraced dense ASCII ridges on left & right flanks
            let ch = ' ';
            let alpha = 0.82;
            if (depth <= 1 && tex > 0.26) {
              ch = tex > 0.54 ? '█' : tex > 0.38 ? '#' : 'X';
            } else if (depth <= 4 && tex > 0.34) {
              ch = RIDGE_DENSE[Math.floor((tex * 17 + r) % RIDGE_DENSE.length)];
            } else if (tex > 0.44) {
              ch = tex > 0.76 ? '#' : tex > 0.58 ? 'x' : hash2(Math.floor(worldC), r) < 0.5 ? '<' : '>';
              alpha = 0.64;
            } else if (tex > 0.32) {
              ch = '•';
              alpha = 0.45;
            }
            if (ch !== ' ') {
              drawCharCell(c, r, ch, ch === '█' || ch === '#' ? palette.cliff : palette.glyphInk, alpha, cellW, cellH);
            }
          }
        }
      }

      // 4. Ambient Drifting ASCII Sky/Valley Motes
      for (let m = 0; m < 18; m++) {
        const mx = ((hash2(m, 91) * width + t * (10 + (m % 5) * 3)) % (width + 20)) - 10;
        const my = (hash2(m, 137) * height * 0.62) + Math.sin(t * 0.9 + m) * 6;
        ctx.globalAlpha = 0.28 + 0.25 * Math.sin(t * 1.4 + m * 2.1);
        ctx.fillStyle = palette.glyphMuted;
        ctx.fillText(m % 3 === 0 ? '•' : '.', Math.round(mx), Math.round(my));
      }

      // 5. Layer 4 — Pixel-Art Clawd Traveler Sprite
      drawMascot(t);

      // 6. Layer 5 — Faster Parallax Jagged Foreground Cliff Silhouettes (y = 66%..100%)
      for (let c = 0; c < cols; c++) {
        const worldFg = c + fgShiftCols;
        const spireNoise = fbm1(worldFg * 0.14, 101);
        const microSpike = hash2(Math.floor(worldFg), 211);
        // Keep a slight valley dip right under Clawd's feet while keeping jagged spires left/right & base
        const centerDist = Math.abs(c / cols - 0.5);
        const centerDip = Math.max(0, 1 - centerDist * 4.5) * 0.05;
        const spireTopRow = Math.floor(
          rows * (0.67 + centerDip + (1 - spireNoise) * 0.13 - (microSpike > 0.72 ? 0.045 : 0))
        );

        for (let r = spireTopRow; r < rows; r++) {
          const pocket = valueNoise2(worldFg * 0.38, r * 0.52, 307);
          const belowFloor = r >= Math.floor(rows * 0.85);
          if (belowFloor) {
            if (pocket > 0.76) {
              drawCharCell(c, r, '#', palette.cliffPocket, 0.9, cellW, cellH);
            } else {
              ctx.globalAlpha = 1;
              ctx.fillStyle = palette.cliff;
              ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            }
          } else if (pocket > 0.72) {
            drawCharCell(c, r, pocket > 0.85 ? 'X' : '#', palette.cliff, 0.88, cellW, cellH);
          } else {
            ctx.globalAlpha = 1;
            ctx.fillStyle = palette.cliff;
            ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
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
      setAudioActive,
      setFontFamily,
      dispose,
    };
  }

  // Zero-dependency Web Audio Lo-Fi Ambient Synth ("music for thinking and building")
  // Used when user selects "Synth" or as automatic fallback if YouTube embed is blocked offline/by CSP.
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

    // Warm jazz lo-fi progression: Fmaj9 -> Em7 -> Dm9 -> Cmaj9
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

      // Gentle pentatonic Rhodes bell accent
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
    normalizeLiveBackground,
    normalizeAudioSource,
    clampVolume,
    buildYouTubeEmbedUrl,
    buildYouTubeCommand,
    resolveClaudeFmPalette,
    createClaudeFmScene,
    createAmbientSynthEngine,
  };
});
