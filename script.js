const year = document.querySelector("#year");
const entryGate = document.querySelector("[data-entry-gate]");
const entryHold = document.querySelector("[data-entry-hold]");
const cursorLight = document.querySelector(".cursor-light");
const cursorRing = document.querySelector(".cursor-ring");
const cursorFlowCanvas = null;
const emailLink = document.querySelector("[data-copy-email]");
const tiltItems = document.querySelectorAll("[data-tilt]");
const revealItems = document.querySelectorAll("[data-reveal]");
const magneticItems = document.querySelectorAll("[data-magnetic]");
const interactiveItems = document.querySelectorAll("a, button, input, [data-tilt]");
const sectionItems = document.querySelectorAll("[data-section]");
const orbitDots = document.querySelectorAll("[data-orbit-dot]");
const shaderCanvas = document.querySelector(".shader-field");
const themeHourInput = document.querySelector("#theme-hour");
const themeTimeOutput = document.querySelector("[data-theme-time]");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointer = {
  x: 0.5,
  y: 0.45,
  px: 0,
  py: 0,
  speed: 0,
  hasMoved: false,
};
const cursorState = {
  dotX: window.innerWidth * 0.5,
  dotY: window.innerHeight * 0.45,
  outlineX: window.innerWidth * 0.5,
  outlineY: window.innerHeight * 0.45,
  angle: 0,
  stretch: 0,
  visible: false,
};
let cursorWarpLayer = null;
let cursorWarpContent = null;
let entryHoldFrame = 0;
let entryProgress = 0;
let entryIsHolding = false;
let entryIsComplete = false;
let entryLastTime = 0;
const entryHoldDuration = 2300;
const entryReleaseDuration = 1450;
const entryMeterLength = 314.16;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const x = clamp((value - start) / (end - start));
  return x * x * (3 - 2 * x);
};
const mix = (a, b, amount) => a + (b - a) * amount;
const mixRgb = (a, b, amount) => a.map((channel, index) => mix(channel, b[index], amount));
const rgb = (color) => `rgb(${color.map((channel) => Math.round(channel)).join(", ")})`;
const rgba = (color, alpha) =>
  `rgba(${color.map((channel) => Math.round(channel)).join(", ")}, ${alpha})`;
const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
};

const themeKeyframes = {
  day: {
    css: {
      pageBg: [242, 239, 231],
      surface: [255, 255, 250, 0.8],
      surfaceStrong: [255, 255, 250, 0.94],
      text: [9, 10, 13],
      muted: [79, 83, 93],
      line: [9, 10, 13, 0.22],
      accent: [0, 87, 255],
      accentStrong: [6, 21, 168],
      coral: [255, 43, 109],
      sun: [214, 255, 0],
      mint: [0, 209, 167],
      headerBg: [255, 255, 250, 0.84],
      cursorGlow: [0, 87, 255, 0.22],
    },
    shader: {
      sky: ["#f7f5ef", "#dfe4f5", "#ffe1eb", "#f2efe7"],
      glow: [[214, 255, 0], 0.34, [255, 43, 109], 0.18],
      body: [[214, 255, 0], 0.76, [255, 43, 109], 0.6],
      ground: [
        [9, 10, 13, 0.24],
        [0, 87, 255, 0.14],
        [242, 239, 231, 0.1],
      ],
      grid: [0, 87, 255],
      lanes: [0, 209, 167],
      haze: [[255, 43, 109], 0.22, [0, 87, 255], 0.18],
      bodyScale: 0.22,
      bodyY: 0.66,
      starAlpha: 0.12,
      starCount: 42,
      sunAlpha: 1,
      moonAlpha: 0,
    },
  },
  dusk: {
    css: {
      pageBg: [17, 12, 29],
      surface: [29, 21, 43, 0.72],
      surfaceStrong: [41, 31, 60, 0.9],
      text: [255, 247, 232],
      muted: [203, 191, 216],
      line: [255, 247, 232, 0.2],
      accent: [124, 92, 255],
      accentStrong: [201, 189, 255],
      coral: [255, 76, 76],
      sun: [255, 212, 0],
      mint: [0, 240, 181],
      headerBg: [17, 12, 29, 0.82],
      cursorGlow: [124, 92, 255, 0.24],
    },
    shader: {
      sky: ["#110c1d", "#211a38", "#4f2144", "#181126"],
      glow: [[255, 212, 0], 0.46, [124, 92, 255], 0.28],
      body: [[255, 212, 0], 0.82, [255, 76, 76], 0.68],
      ground: [
        [9, 6, 18, 0.42],
        [124, 92, 255, 0.2],
        [17, 12, 29, 0.16],
      ],
      grid: [124, 92, 255],
      lanes: [0, 240, 181],
      haze: [[255, 76, 76], 0.28, [124, 92, 255], 0.24],
      bodyScale: 0.23,
      bodyY: 0.66,
      starAlpha: 0.22,
      starCount: 86,
      sunAlpha: 1,
      moonAlpha: 0,
    },
  },
  night: {
    css: {
      pageBg: [3, 5, 10],
      surface: [11, 15, 25, 0.76],
      surfaceStrong: [16, 22, 36, 0.92],
      text: [248, 251, 255],
      muted: [168, 176, 199],
      line: [248, 251, 255, 0.18],
      accent: [0, 163, 255],
      accentStrong: [167, 231, 255],
      coral: [255, 43, 214],
      sun: [245, 255, 0],
      mint: [0, 255, 157],
      headerBg: [3, 5, 10, 0.82],
      cursorGlow: [0, 163, 255, 0.28],
    },
    shader: {
      sky: ["#03050a", "#071021", "#1c1338", "#05070d"],
      glow: [[245, 255, 0], 0.22, [0, 163, 255], 0.22],
      body: [[245, 255, 0], 0.82, [255, 43, 214], 0.68],
      ground: [
        [0, 2, 8, 0.48],
        [0, 163, 255, 0.2],
        [3, 5, 10, 0.24],
      ],
      grid: [0, 163, 255],
      lanes: [0, 255, 157],
      haze: [[255, 43, 214], 0.18, [0, 163, 255], 0.18],
      bodyScale: 0.14,
      bodyY: 0.58,
      starAlpha: 0.44,
      starCount: 150,
      sunAlpha: 0,
      moonAlpha: 1,
    },
  },
};

const blendKeyframes = (from, to, amount) => {
  const left = themeKeyframes[from];
  const right = themeKeyframes[to];
  const blendCss = {};

  Object.keys(left.css).forEach((key) => {
    const a = left.css[key];
    const b = right.css[key];
    blendCss[key] = a.map((value, index) => mix(value, b[index], amount));
  });

  return {
    css: blendCss,
    shader: {
      sky: left.shader.sky.map((color, index) =>
        rgb(mixRgb(hexToRgb(color), hexToRgb(right.shader.sky[index]), amount)),
      ),
      glow: [
        mixRgb(left.shader.glow[0], right.shader.glow[0], amount),
        mix(left.shader.glow[1], right.shader.glow[1], amount),
        mixRgb(left.shader.glow[2], right.shader.glow[2], amount),
        mix(left.shader.glow[3], right.shader.glow[3], amount),
      ],
      body: [
        mixRgb(left.shader.body[0], right.shader.body[0], amount),
        mix(left.shader.body[1], right.shader.body[1], amount),
        mixRgb(left.shader.body[2], right.shader.body[2], amount),
        mix(left.shader.body[3], right.shader.body[3], amount),
      ],
      ground: left.shader.ground.map((stop, index) => {
        const other = right.shader.ground[index];
        return [
          ...mixRgb(stop.slice(0, 3), other.slice(0, 3), amount),
          mix(stop[3], other[3], amount),
        ];
      }),
      grid: mixRgb(left.shader.grid, right.shader.grid, amount),
      lanes: mixRgb(left.shader.lanes, right.shader.lanes, amount),
      haze: [
        mixRgb(left.shader.haze[0], right.shader.haze[0], amount),
        mix(left.shader.haze[1], right.shader.haze[1], amount),
        mixRgb(left.shader.haze[2], right.shader.haze[2], amount),
        mix(left.shader.haze[3], right.shader.haze[3], amount),
      ],
      bodyScale: mix(left.shader.bodyScale, right.shader.bodyScale, amount),
      bodyY: mix(left.shader.bodyY, right.shader.bodyY, amount),
      starAlpha: mix(left.shader.starAlpha, right.shader.starAlpha, amount),
      starCount: Math.round(mix(left.shader.starCount, right.shader.starCount, amount)),
      sunAlpha: mix(left.shader.sunAlpha, right.shader.sunAlpha, amount),
      moonAlpha: mix(left.shader.moonAlpha, right.shader.moonAlpha, amount),
    },
  };
};

const getThemeState = (hour) => {
  if (hour < 5.5) {
    return blendKeyframes("night", "night", 0);
  }

  if (hour < 7.5) {
    return blendKeyframes("night", "day", smoothstep(5.5, 7.5, hour));
  }

  if (hour < 15.5) {
    return blendKeyframes("day", "day", 0);
  }

  if (hour < 18.25) {
    return blendKeyframes("day", "dusk", smoothstep(15.5, 18.25, hour));
  }

  if (hour < 21) {
    return blendKeyframes("dusk", "night", smoothstep(18.25, 21, hour));
  }

  return blendKeyframes("night", "night", 0);
};

const getThemeName = (hour) => {
  const state = getThemeState(hour);
  if (hour < 5.5) return "night";
  if (hour < 7.5) return state.shader.moonAlpha > 0.55 ? "night" : "day";
  if (hour < 15.5) return "day";
  if (hour < 21) return "dusk";
  return "night";
};

const getReadableColors = (hour) => {
  if (hour < 5.5) {
    return themeKeyframes.night.css;
  }

  if (hour < 7.5) {
    const amount = smoothstep(5.5, 7.5, hour);
    return {
      text: mixRgb(themeKeyframes.night.css.text, themeKeyframes.day.css.text, amount),
      muted: mixRgb(themeKeyframes.night.css.muted, themeKeyframes.day.css.muted, amount),
      line: [
        ...mixRgb(themeKeyframes.night.css.line.slice(0, 3), themeKeyframes.day.css.line.slice(0, 3), amount),
        mix(themeKeyframes.night.css.line[3], themeKeyframes.day.css.line[3], amount),
      ],
    };
  }

  if (hour < 15.5) {
    return themeKeyframes.day.css;
  }

  if (hour < 18.25) {
    const amount = smoothstep(15.5, 18.25, hour);
    return {
      text: mixRgb(themeKeyframes.day.css.text, themeKeyframes.dusk.css.text, amount),
      muted: mixRgb(themeKeyframes.day.css.muted, themeKeyframes.dusk.css.muted, amount),
      line: [
        ...mixRgb(themeKeyframes.day.css.line.slice(0, 3), themeKeyframes.dusk.css.line.slice(0, 3), amount),
        mix(themeKeyframes.day.css.line[3], themeKeyframes.dusk.css.line[3], amount),
      ],
    };
  }

  if (hour < 21) {
    const amount = smoothstep(18.25, 21, hour);
    return {
      text: mixRgb(themeKeyframes.dusk.css.text, themeKeyframes.night.css.text, amount),
      muted: mixRgb(themeKeyframes.dusk.css.muted, themeKeyframes.night.css.muted, amount),
      line: [
        ...mixRgb(themeKeyframes.dusk.css.line.slice(0, 3), themeKeyframes.night.css.line.slice(0, 3), amount),
        mix(themeKeyframes.dusk.css.line[3], themeKeyframes.night.css.line[3], amount),
      ],
    };
  }

  return themeKeyframes.night.css;
};

const getEntryTransitionColor = () => {
  const readableText = getReadableColors(selectedHour).text;
  const accentMix = themeState.css.accent;
  return rgb(mixRgb(readableText, accentMix, 0.16));
};

const getDiagonalStripeColor = () => {
  const alpha = mix(0.08, 0.018, smoothstep(18.25, 21, selectedHour));
  return rgba(themeState.css.coral, alpha);
};

const getBackdropState = () => {
  const nightAmount = smoothstep(18.25, 21, selectedHour);
  const gridColor = [
    ...mixRgb([21, 25, 29], [230, 225, 215], nightAmount),
    mix(0.032, 0.018, nightAmount),
  ];

  return {
    gridLine: rgba(gridColor.slice(0, 3), gridColor[3]),
    gridSize: `${mix(42, 34, nightAmount).toFixed(2)}px`,
    ambientGlow: rgba(themeState.css.accent, 0.1 * nightAmount),
    ambientTop: rgba(themeState.css.pageBg, mix(0.38, 0.1, nightAmount)),
    ambientBottom: rgba(themeState.css.pageBg, mix(0.56, 0.22, nightAmount)),
  };
};

const getSystemHour = () => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};

const getInitialTheme = () => {
  const params = new URLSearchParams(window.location.search);
  const hasForcedHour = params.has("hour");
  const forcedHour = hasForcedHour ? Number(params.get("hour")) : NaN;
  const forcedTheme = params.get("theme");

  if (hasForcedHour && Number.isFinite(forcedHour) && forcedHour >= 0 && forcedHour < 24) {
    return {
      followsSystemTime: false,
      hour: forcedHour,
    };
  }

  if (forcedTheme === "day") {
    return {
      followsSystemTime: false,
      hour: 12,
    };
  }

  if (forcedTheme === "dusk") {
    return {
      followsSystemTime: false,
      hour: 17,
    };
  }

  if (forcedTheme === "night") {
    return {
      followsSystemTime: false,
      hour: 22,
    };
  }

  return {
    followsSystemTime: true,
    hour: getSystemHour(),
  };
};

const initialTheme = getInitialTheme();
let followsSystemTime = initialTheme.followsSystemTime;
let selectedHour = initialTheme.hour;
let visualTheme = getThemeName(selectedHour);
let themeState = getThemeState(selectedHour);

const applyVisualTheme = () => {
  themeState = getThemeState(selectedHour);
  visualTheme = getThemeName(selectedHour);
  const readableColors = getReadableColors(selectedHour);
  const backdropState = getBackdropState();
  document.body.classList.remove("theme-day", "theme-dusk", "theme-night");
  document.body.classList.add(`theme-${visualTheme}`);
  document.body.style.setProperty("--page-bg", rgb(themeState.css.pageBg));
  document.body.style.setProperty("--surface", rgba(themeState.css.surface.slice(0, 3), themeState.css.surface[3]));
  document.body.style.setProperty(
    "--surface-strong",
    rgba(themeState.css.surfaceStrong.slice(0, 3), themeState.css.surfaceStrong[3]),
  );
  document.body.style.setProperty("--text", rgb(readableColors.text));
  document.body.style.setProperty("--muted", rgb(readableColors.muted));
  document.body.style.setProperty("--line", rgba(readableColors.line.slice(0, 3), readableColors.line[3]));
  document.body.style.setProperty("--entry-transition-color", getEntryTransitionColor());
  document.body.style.setProperty("--diagonal-stripe", getDiagonalStripeColor());
  document.body.style.setProperty("--grid-line", backdropState.gridLine);
  document.body.style.setProperty("--grid-size", backdropState.gridSize);
  document.body.style.setProperty("--ambient-glow", backdropState.ambientGlow);
  document.body.style.setProperty("--ambient-top", backdropState.ambientTop);
  document.body.style.setProperty("--ambient-bottom", backdropState.ambientBottom);
  document.body.style.setProperty("--accent", rgb(themeState.css.accent));
  document.body.style.setProperty("--accent-strong", rgb(themeState.css.accentStrong));
  document.body.style.setProperty("--coral", rgb(themeState.css.coral));
  document.body.style.setProperty("--sun", rgb(themeState.css.sun));
  document.body.style.setProperty("--mint", rgb(themeState.css.mint));
  document.body.style.setProperty(
    "--header-bg",
    rgba(themeState.css.headerBg.slice(0, 3), themeState.css.headerBg[3]),
  );
  document.body.style.setProperty(
    "--cursor-glow",
    rgba(themeState.css.cursorGlow.slice(0, 3), themeState.css.cursorGlow[3]),
  );

  if (themeTimeOutput) {
    const totalMinutes = Math.round(selectedHour * 60) % (24 * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    themeTimeOutput.textContent = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
};

if (themeHourInput) {
  themeHourInput.valueAsNumber = selectedHour;
  themeHourInput.addEventListener("input", () => {
    followsSystemTime = false;
    selectedHour = themeHourInput.valueAsNumber;
    applyVisualTheme();
  });
  window.setTimeout(() => {
    themeHourInput.valueAsNumber = selectedHour;
    applyVisualTheme();
  }, 0);
}

applyVisualTheme();

window.setInterval(() => {
  if (!followsSystemTime) return;

  selectedHour = getSystemHour();
  if (themeHourInput) {
    themeHourInput.valueAsNumber = selectedHour;
  }
  applyVisualTheme();
}, 30000);

if (finePointer.matches) {
  document.documentElement.classList.add("has-fine-pointer");
}

if (entryGate && entryHold) {
  document.documentElement.classList.add("is-entry-locked");
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const setEntryProgress = (progress) => {
  entryProgress = clamp(progress);
  entryHold?.style.setProperty("--entry-progress", entryProgress.toFixed(4));
  entryHold?.style.setProperty("--entry-dot-scale", (0.82 + entryProgress * 0.24).toFixed(3));
  entryHold?.style.setProperty("--entry-meter-offset", `${(entryMeterLength * (1 - entryProgress)).toFixed(2)}px`);

  const progressRing = entryHold?.querySelector(".entry-hold-progress");
  progressRing?.style.setProperty("stroke-dashoffset", `${(entryMeterLength * (1 - entryProgress)).toFixed(2)}px`);

  entryHold?.querySelectorAll(".entry-hold-orbit").forEach((orbit, index, orbits) => {
    const orbitProgress = clamp(entryProgress * orbits.length - index);
    const easedProgress = orbitProgress * orbitProgress * (3 - 2 * orbitProgress);
    const orbitScale = 1.08 + index * 0.18 + easedProgress * 0.13;

    orbit.style.setProperty("--orbit-alpha", easedProgress.toFixed(3));
    orbit.style.setProperty("--orbit-scale", orbitScale.toFixed(3));
  });
};

const enterSite = () => {
  if (entryIsComplete) return;

  entryIsComplete = true;
  entryIsHolding = false;
  window.cancelAnimationFrame(entryHoldFrame);
  entryHoldFrame = 0;
  setEntryProgress(1);
  entryHold?.classList.remove("is-holding");
  entryGate?.classList.add("is-complete");

  window.setTimeout(() => {
    document.documentElement.classList.remove("is-entry-locked");
    entryGate?.classList.add("is-hidden");
  }, 2400);

  window.setTimeout(() => entryGate?.remove(), 3200);
};

const stopEntryHold = () => {
  if (entryIsComplete || entryGate?.classList.contains("is-hidden")) return;

  entryIsHolding = false;
  entryHold?.classList.remove("is-holding");
};

const tickEntryHold = () => {
  const now = Date.now();
  const delta = Math.min(240, now - entryLastTime || 16);
  entryLastTime = now;

  if (entryIsHolding) {
    setEntryProgress(entryProgress + delta / entryHoldDuration);
  } else {
    setEntryProgress(entryProgress - delta / entryReleaseDuration);
  }

  if (entryProgress >= 1) {
    enterSite();
    return;
  }

  if (!entryIsComplete) {
    entryHoldFrame = window.requestAnimationFrame(tickEntryHold);
  }
};

const startEntryHold = (event) => {
  if (!entryGate || entryIsComplete || entryGate.classList.contains("is-hidden")) return;
  if (entryIsHolding) return;

  event.preventDefault();
  entryIsHolding = true;
  entryHold?.classList.add("is-holding");
  if (event.pointerId !== undefined) {
    entryHold.setPointerCapture?.(event.pointerId);
  }
};

if (entryHold) {
  setEntryProgress(0);
  entryHoldFrame = window.requestAnimationFrame(tickEntryHold);
  entryHold.addEventListener("pointerdown", startEntryHold);
  entryHold.addEventListener("pointerup", stopEntryHold);
  entryHold.addEventListener("pointercancel", stopEntryHold);
  entryHold.addEventListener("mousedown", startEntryHold);
  window.addEventListener("pointerup", stopEntryHold);
  window.addEventListener("pointercancel", stopEntryHold);
  window.addEventListener("mouseup", stopEntryHold);
  entryHold.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      entryIsHolding = true;
      entryHold.classList.add("is-holding");
    }
  });
  entryHold.addEventListener("keyup", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      stopEntryHold();
    }
  });
}

const portfolioReveal = document.querySelector("[data-portfolio-reveal]");
const portfolioInner = document.querySelector("[data-portfolio-inner]");
const workSection = document.querySelector("#work");
const workHeading = workSection?.querySelector(".section-heading");
const portfolioSnapTargetProgress = 0.72;

if (portfolioReveal && portfolioInner) {
  const clothDisplacement = document.querySelector("#cloth-warp-filter feDisplacementMap");
  let portfolioSnapTimer = 0;
  let portfolioIsSnapping = false;
  let lastPortfolioScrollY = window.scrollY;
  let portfolioScrollDirection = 1;

  const updatePortfolioReveal = () => {
    const rect = portfolioReveal.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const totalScroll = rect.height - viewportH;

    if (totalScroll <= 0) return;

    const scrolled = -rect.top;
    const progress = clamp(scrolled / totalScroll);

    const easedEntry = smoothstep(0, 0.16, progress);
    const easedScale = smoothstep(0.03, portfolioSnapTargetProgress, progress);
    const easedCenter = smoothstep(0.08, portfolioSnapTargetProgress, progress);
    const easedSettle = smoothstep(0.52, portfolioSnapTargetProgress, progress);

    const clothEnergy = 1 - easedSettle;

    const scale = mix(0.32, 1.04, easedScale);
    const x = mix(-34, 0, easedCenter);
    const y = mix(11, 0, easedCenter);
    const rotate = mix(-7, 0, easedCenter);
    const opacity = mix(0.18, 1, easedEntry);
    const radius = mix(44, 28, smoothstep(0.45, portfolioSnapTargetProgress, progress));

    const displacementScale = clothEnergy * clothEnergy * 46;

    if (clothDisplacement) {
      clothDisplacement.setAttribute("scale", displacementScale.toFixed(1));
    }

    portfolioInner.style.setProperty("--reveal-scale", scale.toFixed(4));
    portfolioInner.style.setProperty("--reveal-x", `${x.toFixed(2)}vw`);
    portfolioInner.style.setProperty("--reveal-y", `${y.toFixed(2)}vh`);
    portfolioInner.style.setProperty("--reveal-rotate", `${rotate.toFixed(2)}deg`);
    portfolioInner.style.setProperty("--reveal-opacity", opacity.toFixed(4));
    portfolioInner.style.setProperty("--reveal-radius", `${radius.toFixed(1)}px`);

    if (progress >= portfolioSnapTargetProgress - 0.01) {
      portfolioInner.classList.add("is-full");
    } else {
      portfolioInner.classList.remove("is-full");
    }
  };

  const getPortfolioScrollState = () => {
    const rect = portfolioReveal.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const totalScroll = rect.height - viewportH;

    if (totalScroll <= 0) return null;

    const progress = clamp(-rect.top / totalScroll);
    const documentTop = window.scrollY + rect.top;

    return { rect, totalScroll, progress, documentTop };
  };

  const getWorkHeadingTop = () => {
    const target = workHeading || workSection;
    if (!target) return 0;

    const header = document.querySelector(".site-header");
    const offset = header ? header.getBoundingClientRect().height + 16 : 0;
    const rect = target.getBoundingClientRect();

    return Math.max(0, window.scrollY + rect.top - offset);
  };

  const snapPortfolioReveal = () => {
    portfolioSnapTimer = 0;

    if (portfolioIsSnapping || prefersReducedMotion.matches) return;

    const state = getPortfolioScrollState();
    if (!state) return;

    const { rect, totalScroll, progress, documentTop } = state;
    const isWithinReveal = rect.top < window.innerHeight * 0.86 && rect.bottom > window.innerHeight * 0.18;
    const isScrollingDown = portfolioScrollDirection >= 0;
    const isBetweenStops = isScrollingDown
      ? progress > 0.015 && progress < 0.82
      : progress > -0.14 && progress < 0.82;

    if (!isWithinReveal || !isBetweenStops) return;

    const targetTop = isScrollingDown
      ? documentTop + totalScroll * portfolioSnapTargetProgress
      : getWorkHeadingTop();

    if (Math.abs(window.scrollY - targetTop) < 24) return;

    portfolioIsSnapping = true;
    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      portfolioIsSnapping = false;
    }, 520);
  };

  const schedulePortfolioSnap = () => {
    if (portfolioSnapTimer) {
      window.clearTimeout(portfolioSnapTimer);
    }
    portfolioSnapTimer = window.setTimeout(snapPortfolioReveal, 140);
  };

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    portfolioScrollDirection = currentScrollY >= lastPortfolioScrollY ? 1 : -1;
    lastPortfolioScrollY = currentScrollY;
    updatePortfolioReveal();
    schedulePortfolioSnap();
  }, { passive: true });
  window.addEventListener("resize", updatePortfolioReveal);
  updatePortfolioReveal();
}

const setupCursorWarpLayer = () => {
  if (!finePointer.matches || cursorWarpLayer) return;

  cursorWarpLayer = document.createElement("div");
  cursorWarpLayer.className = "cursor-warp-layer";
  cursorWarpLayer.setAttribute("aria-hidden", "true");
  cursorWarpLayer.style.setProperty("--warp-scroll-y", `${window.scrollY}px`);

  cursorWarpContent = document.createElement("div");
  cursorWarpContent.className = "cursor-warp-content";

  document.querySelectorAll(".site-header, main, .footer").forEach((node) => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    clone.querySelectorAll("a, button, input, textarea, select").forEach((element) => {
      element.setAttribute("tabindex", "-1");
    });
    cursorWarpContent.append(clone);
  });

  cursorWarpLayer.append(cursorWarpContent);
  document.body.append(cursorWarpLayer);
};

let flowPushPoint = null;

const updateSpot = (event, item) => {
  const rect = item.getBoundingClientRect();
  item.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  item.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
};

const updateScrollProgress = () => {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maxScroll);
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  if (cursorWarpLayer) {
    cursorWarpLayer.style.setProperty("--warp-scroll-y", `${window.scrollY}px`);
  }
};

const setActiveSection = (sectionId) => {
  orbitDots.forEach((dot) => {
    dot.classList.toggle("is-active", dot.dataset.orbitDot === sectionId);
  });
};

updateScrollProgress();
setActiveSection("home");
setupCursorWarpLayer();

window.addEventListener("pointermove", (event) => {
  const dx = pointer.hasMoved ? event.clientX - pointer.px : 0;
  const dy = pointer.hasMoved ? event.clientY - pointer.py : 0;
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = event.clientY / window.innerHeight;
  pointer.speed = Math.min(1, Math.hypot(dx, dy) / 52);
  pointer.px = event.clientX;
  pointer.py = event.clientY;
  pointer.hasMoved = true;
  document.documentElement.style.setProperty("--hero-shift-x", `${((0.5 - pointer.x) * 1).toFixed(3)}rem`);
  document.documentElement.style.setProperty("--hero-shift-y", `${((0.5 - pointer.y) * 0.8).toFixed(3)}rem`);

  if (cursorLight) {
    cursorLight.style.setProperty("--x", `${event.clientX}px`);
    cursorLight.style.setProperty("--y", `${event.clientY}px`);
  }

  if (cursorRing) {
    cursorState.dotX = event.clientX;
    cursorState.dotY = event.clientY;
    cursorState.angle = Math.atan2(dy, dx);
    cursorState.stretch = Math.max(cursorState.stretch * 0.62, pointer.speed);
    cursorState.visible = true;
    cursorRing.style.setProperty("--dot-x", `${event.clientX}px`);
    cursorRing.style.setProperty("--dot-y", `${event.clientY}px`);
  }

  if (cursorWarpLayer) {
    cursorWarpLayer.style.setProperty("--warp-x", `${event.clientX}px`);
    cursorWarpLayer.style.setProperty("--warp-y", `${event.clientY}px`);
    cursorWarpLayer.style.setProperty("--warp-angle", `${cursorState.angle}rad`);
    cursorWarpLayer.style.setProperty("--warp-stretch", (1 + pointer.speed * 0.28).toFixed(3));
    cursorWarpLayer.classList.add("is-visible");
  }

  flowPushPoint?.(event.clientX, event.clientY, pointer.speed);
});

tiltItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    item.style.setProperty("--ry", `${x * 9}deg`);
    item.style.setProperty("--rx", `${y * -9}deg`);
    updateSpot(event, item);
  });

  item.addEventListener("pointerleave", () => {
    item.style.setProperty("--rx", "0deg");
    item.style.setProperty("--ry", "0deg");
  });
});

magneticItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (!finePointer.matches) return;

    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`;
    updateSpot(event, item);
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });

  item.addEventListener("pointerdown", () => {
    item.classList.remove("is-rippling");
    void item.offsetWidth;
    item.classList.add("is-rippling");
  });
});

interactiveItems.forEach((item) => {
  item.addEventListener("pointerenter", () => cursorRing?.classList.add("is-active"));
  item.addEventListener("pointerleave", () => cursorRing?.classList.remove("is-active"));
});

window.addEventListener("pointerdown", () => cursorRing?.classList.add("is-pressed"));
window.addEventListener("pointerup", () => cursorRing?.classList.remove("is-pressed"));
window.addEventListener("pointercancel", () => cursorRing?.classList.remove("is-pressed"));
window.addEventListener("blur", () => {
  cursorRing?.classList.remove("is-pressed");
  cursorWarpLayer?.classList.remove("is-visible");
});
document.addEventListener("pointerleave", () => cursorWarpLayer?.classList.remove("is-visible"));

const animateCursor = () => {
  if (cursorRing && finePointer.matches) {
    const follow = cursorState.visible ? 0.105 : 1;
    cursorState.outlineX = mix(cursorState.outlineX, cursorState.dotX, follow);
    cursorState.outlineY = mix(cursorState.outlineY, cursorState.dotY, follow);
    cursorState.stretch *= 0.88;

    const stretch = clamp(cursorState.stretch, 0, 1);
    const scaleX = 1 + stretch * 0.72;
    const scaleY = 1 - stretch * 0.34;

    cursorRing.style.setProperty("--outline-x", `${cursorState.outlineX}px`);
    cursorRing.style.setProperty("--outline-y", `${cursorState.outlineY}px`);
    cursorRing.style.setProperty("--cursor-angle", `${cursorState.angle}rad`);
    cursorRing.style.setProperty("--cursor-scale-x", scaleX.toFixed(3));
    cursorRing.style.setProperty("--cursor-scale-y", scaleY.toFixed(3));

    if (cursorWarpLayer) {
      const cursorSize = cursorRing.classList.contains("is-active") ? 66 : 50;
      cursorWarpLayer.style.setProperty("--warp-x", `${cursorState.outlineX}px`);
      cursorWarpLayer.style.setProperty("--warp-y", `${cursorState.outlineY}px`);
      cursorWarpLayer.style.setProperty("--warp-angle", `${cursorState.angle}rad`);
      cursorWarpLayer.style.setProperty("--warp-scale-x", scaleX.toFixed(3));
      cursorWarpLayer.style.setProperty("--warp-scale-y", scaleY.toFixed(3));
      cursorWarpLayer.style.setProperty("--warp-size", `${cursorSize}px`);
    }
  }

  window.requestAnimationFrame(animateCursor);
};

animateCursor();

window.addEventListener("scroll", () => {
  updateScrollProgress();
}, { passive: true });
window.addEventListener("resize", () => {
  updateScrollProgress();
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry?.target.dataset.section) {
        setActiveSection(visibleEntry.target.dataset.section);
      }
    },
    { threshold: [0.28, 0.46, 0.64] },
  );

  sectionItems.forEach((section) => sectionObserver.observe(section));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (emailLink) {
  emailLink.addEventListener("click", async () => {
    const email = "3484768630@qq.com";

    try {
      await navigator.clipboard.writeText(email);
      emailLink.classList.add("is-copied");
      window.setTimeout(() => emailLink.classList.remove("is-copied"), 1200);
    } catch {
      emailLink.classList.remove("is-copied");
    }
  });
}

if (cursorFlowCanvas && finePointer.matches) {
  const flowContext = cursorFlowCanvas.getContext("2d", { alpha: true });
  const reduceFlowMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const trail = [];
  const brush = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    lastX: 0,
    lastY: 0,
    speed: 0,
    active: false,
  };
  let flowWidth = 0;
  let flowHeight = 0;
  let flowScale = 1;
  let lastFlowTime = 0;
  let idleFrames = 0;

  const resizeFlowCanvas = () => {
    flowScale = Math.min(window.devicePixelRatio || 1, 2);
    flowWidth = window.innerWidth;
    flowHeight = window.innerHeight;
    cursorFlowCanvas.width = Math.floor(flowWidth * flowScale);
    cursorFlowCanvas.height = Math.floor(flowHeight * flowScale);
    cursorFlowCanvas.style.width = `${flowWidth}px`;
    cursorFlowCanvas.style.height = `${flowHeight}px`;
    flowContext.setTransform(flowScale, 0, 0, flowScale, 0, 0);
  };

  flowPushPoint = (x, y, speed) => {
    const targetJump = brush.active ? Math.hypot(x - brush.targetX, y - brush.targetY) / 46 : 0;
    brush.targetX = x;
    brush.targetY = y;
    brush.speed = Math.max(brush.speed * 0.72, speed, Math.min(1, targetJump), 0.16);

    if (!brush.active) {
      brush.x = x;
      brush.y = y;
      brush.lastX = x;
      brush.lastY = y;
      brush.active = true;
    }
  };

  const flowColor = (index, alpha) => {
    const hue = 178 + Math.sin(index * 0.74) * 78 + Math.cos(index * 0.31) * 42;
    return `hsla(${Math.round(hue)}, 92%, 72%, ${alpha})`;
  };

  const addFlowSample = (x, y, speed, time) => {
    const prev = trail.at(-1);
    const angle = prev ? Math.atan2(y - prev.y, x - prev.x) : 0;
    const energy = clamp(speed, 0.16, 0.92);
    const phase = Math.sin(x * 0.018 + y * 0.013 + time * 0.002);

    trail.push({
      x,
      y,
      angle,
      born: time,
      life: 760 + energy * 520,
      width: 22 + energy * 34,
      energy,
      phase,
    });

    while (trail.length > 74) {
      trail.shift();
    }
  };

  const getAliveTrail = (time) => {
    const aliveTrail = [];

    for (let i = trail.length - 1; i >= 0; i -= 1) {
      if ((time - trail[i].born) / trail[i].life >= 1) {
        trail.splice(i, 1);
      } else {
        aliveTrail.unshift(trail[i]);
      }
    }

    return aliveTrail;
  };

  const drawOilFilmBand = (alivePoints, time, pass) => {
    if (alivePoints.length < 2) return;

    for (let i = 1; i < alivePoints.length; i += 1) {
      const prev = alivePoints[i - 1];
      const point = alivePoints[i];
      const progress = clamp((time - point.born) / point.life);
      const ageFade = Math.pow(1 - progress, 1.45);
      const alpha = ageFade * (0.08 + point.energy * 0.11) * pass.alpha;
      const segmentAngle = Math.atan2(point.y - prev.y, point.x - prev.x);
      const normalX = Math.cos(segmentAngle + Math.PI / 2);
      const normalY = Math.sin(segmentAngle + Math.PI / 2);
      const shimmer = Math.sin(time * 0.004 + point.phase + i * 0.52) * pass.ripple;
      const offset = pass.offset + shimmer;
      const startX = prev.x + normalX * offset;
      const startY = prev.y + normalY * offset;
      const endX = point.x + normalX * offset;
      const endY = point.y + normalY * offset;
      const midX = (startX + endX) / 2 + normalX * shimmer * 0.42;
      const midY = (startY + endY) / 2 + normalY * shimmer * 0.42;

      const gradient = flowContext.createLinearGradient(
        startX - normalX * point.width,
        startY - normalY * point.width,
        endX + normalX * point.width,
        endY + normalY * point.width,
      );
      gradient.addColorStop(0, flowColor(i + pass.hueShift, alpha * 0.25));
      gradient.addColorStop(0.36, `hsla(${Math.round(260 + Math.sin(point.phase) * 38)}, 92%, 78%, ${alpha})`);
      gradient.addColorStop(0.68, `hsla(${Math.round(55 + Math.cos(point.phase) * 28)}, 98%, 76%, ${alpha * 0.72})`);
      gradient.addColorStop(1, flowColor(i + pass.hueShift + 4, alpha * 0.22));

      flowContext.beginPath();
      flowContext.moveTo(startX, startY);
      flowContext.quadraticCurveTo(midX, midY, endX, endY);
      flowContext.lineWidth = Math.max(1, point.width * pass.width * ageFade);
      flowContext.strokeStyle = gradient;
      flowContext.stroke();
    }
  };

  const drawOilFilmSkin = (alivePoints, time) => {
    if (alivePoints.length < 3) return;

    flowContext.save();
    flowContext.globalCompositeOperation = "source-over";
    flowContext.lineCap = "round";
    flowContext.lineJoin = "round";

    flowContext.filter = "blur(18px)";
    drawOilFilmBand(alivePoints, time, { width: 1.75, alpha: 0.36, offset: 0, ripple: 9, hueShift: 0 });

    flowContext.filter = "blur(6px)";
    drawOilFilmBand(alivePoints, time, { width: 0.88, alpha: 0.52, offset: 0, ripple: 5, hueShift: 3 });

    flowContext.filter = "none";
    drawOilFilmBand(alivePoints, time, { width: 0.18, alpha: 0.48, offset: -8, ripple: 2.5, hueShift: 8 });
    drawOilFilmBand(alivePoints, time, { width: 0.14, alpha: 0.4, offset: 9, ripple: 2.5, hueShift: 14 });

    flowContext.restore();
  };

  const drawCursorFlow = (time = 0) => {
    const delta = Math.min(34, time - lastFlowTime || 16);
    lastFlowTime = time;

    flowContext.globalCompositeOperation = "source-over";
    flowContext.clearRect(0, 0, flowWidth, flowHeight);

    if (brush.active) {
      const easing = 1 - Math.pow(0.0018, delta / 1000);
      const prevX = brush.x;
      const prevY = brush.y;
      brush.x = mix(brush.x, brush.targetX, easing);
      brush.y = mix(brush.y, brush.targetY, easing);

      const distance = Math.hypot(brush.x - brush.lastX, brush.y - brush.lastY);
      const samples = Math.min(8, Math.ceil(distance / 9));

      for (let i = 1; i <= samples; i += 1) {
        const amount = i / samples;
        const x = mix(brush.lastX, brush.x, amount);
        const y = mix(brush.lastY, brush.y, amount);
        addFlowSample(x, y, brush.speed, time - (samples - i) * 10);
      }

      brush.lastX = brush.x;
      brush.lastY = brush.y;
      brush.speed *= 0.88;

      if (Math.hypot(brush.targetX - brush.x, brush.targetY - brush.y) < 0.35 && brush.speed < 0.02) {
        idleFrames += 1;
      } else {
        idleFrames = 0;
      }

      if (idleFrames > 80) {
        brush.active = false;
        idleFrames = 0;
      }
    }

    drawOilFilmSkin(getAliveTrail(time), time);

    if (!reduceFlowMotion.matches) {
      window.requestAnimationFrame(drawCursorFlow);
    }
  };

  resizeFlowCanvas();
  drawCursorFlow();
  window.addEventListener("resize", resizeFlowCanvas);
}

if (shaderCanvas) {
  const context = shaderCanvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let deviceScale = 1;

  const resizeCanvas = () => {
    deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    shaderCanvas.width = Math.floor(width * deviceScale);
    shaderCanvas.height = Math.floor(height * deviceScale);
    shaderCanvas.style.width = `${width}px`;
    shaderCanvas.style.height = `${height}px`;
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  };

  const drawField = (time = 0) => {
    const seconds = time * 0.001;
    const palette = themeState.shader;
    context.clearRect(0, 0, width, height);

    const horizon = height * 0.48 + (pointer.y - 0.5) * 18;
    const vanishingX = width * (0.5 + (pointer.x - 0.5) * 0.06);
    const scroll = (seconds * 42) % 72;

    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, palette.sky[0]);
    sky.addColorStop(0.34, palette.sky[1]);
    sky.addColorStop(0.53, palette.sky[2]);
    sky.addColorStop(1, palette.sky[3]);
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    const haze = context.createRadialGradient(
      width * 0.52,
      horizon * 0.72,
      0,
      width * 0.52,
      horizon * 0.72,
      Math.max(width, height) * 0.58,
    );
    haze.addColorStop(0, rgba(palette.haze[0], palette.haze[1]));
    haze.addColorStop(0.38, rgba(palette.haze[2], palette.haze[3]));
    haze.addColorStop(1, "rgba(120, 143, 153, 0)");
    context.fillStyle = haze;
    context.fillRect(0, 0, width, height);

    const starCount = palette.starCount;
    for (let i = 0; i < starCount; i += 1) {
      const starSeed = Math.sin(i * 91.73) * 10000;
      const x = (starSeed - Math.floor(starSeed)) * width;
      const y = ((Math.sin(i * 47.11) * 10000) % 1) * horizon * 0.7;
      const twinkle = palette.starAlpha + Math.sin(seconds * 0.8 + i) * 0.06;
      context.fillStyle = `rgba(248, 245, 236, ${twinkle})`;
      const starSize = palette.moonAlpha > 0.5 && i % 9 === 0 ? 2.1 : 1.4;
      context.fillRect(x, Math.abs(y), starSize, starSize);
    }

    const bodyX = width * 0.5 + (pointer.x - 0.5) * 24;
    const bodyY = horizon * palette.bodyY;
    const bodyRadius = Math.min(width, height) * palette.bodyScale;
    const sunGlow = context.createRadialGradient(bodyX, bodyY, 0, bodyX, bodyY, bodyRadius * 1.8);
    sunGlow.addColorStop(0, rgba(palette.glow[0], palette.glow[1]));
    sunGlow.addColorStop(0.5, rgba(palette.glow[2], palette.glow[3]));
    sunGlow.addColorStop(1, "rgba(176, 127, 139, 0)");
    context.fillStyle = sunGlow;
    context.fillRect(0, 0, width, horizon);

    context.save();
    context.beginPath();
    context.rect(0, 0, width, horizon);
    context.clip();
    context.beginPath();
    context.arc(bodyX, bodyY, bodyRadius, 0, Math.PI * 2);
    context.clip();
    if (palette.sunAlpha > 0.02) {
      context.globalAlpha = palette.sunAlpha;
      const sun = context.createLinearGradient(0, bodyY - bodyRadius, 0, bodyY + bodyRadius);
      sun.addColorStop(0, rgba(palette.body[0], palette.body[1]));
      sun.addColorStop(1, rgba(palette.body[2], palette.body[3]));
      context.fillStyle = sun;
      context.fillRect(bodyX - bodyRadius, bodyY - bodyRadius, bodyRadius * 2, bodyRadius * 2);

      for (let stripe = -bodyRadius; stripe < bodyRadius; stripe += 14) {
        const phase = Math.sin(seconds * 0.9 + stripe * 0.08) * 2;
        context.fillStyle = "rgba(217, 214, 208, 0.48)";
        context.fillRect(bodyX - bodyRadius, bodyY + stripe + phase, bodyRadius * 2, 7);
      }
    }

    if (palette.moonAlpha > 0.02) {
      context.globalAlpha = palette.moonAlpha;
      const moon = context.createLinearGradient(0, bodyY - bodyRadius, 0, bodyY + bodyRadius);
      moon.addColorStop(0, rgba(palette.body[0], palette.body[1]));
      moon.addColorStop(1, rgba(palette.body[2], palette.body[3]));
      context.fillStyle = moon;
      context.fillRect(bodyX - bodyRadius, bodyY - bodyRadius, bodyRadius * 2, bodyRadius * 2);
      context.globalCompositeOperation = "destination-out";
      context.globalAlpha = palette.moonAlpha;
      context.beginPath();
      context.arc(bodyX + bodyRadius * 0.42, bodyY - bodyRadius * 0.24, bodyRadius * 0.92, 0, Math.PI * 2);
      context.fill();
      context.globalCompositeOperation = "source-over";
    }

    context.globalAlpha = 1;
    context.restore();

    context.fillStyle = palette.moonAlpha > 0.55 ? "rgba(230, 225, 215, 0.16)" : "rgba(70, 78, 84, 0.22)";
    context.fillRect(0, horizon - 1, width, 2);

    const ground = context.createLinearGradient(0, horizon, 0, height);
    ground.addColorStop(0, rgba(palette.ground[0].slice(0, 3), palette.ground[0][3]));
    ground.addColorStop(0.48, rgba(palette.ground[1].slice(0, 3), palette.ground[1][3]));
    ground.addColorStop(1, rgba(palette.ground[2].slice(0, 3), palette.ground[2][3]));
    context.fillStyle = ground;
    context.fillRect(0, horizon, width, height - horizon);

    context.lineCap = "round";
    context.lineJoin = "round";

    for (let i = 0; i < 18; i += 1) {
      const depth = i * 42 + scroll;
      const t = depth / 760;
      const y = horizon + t * t * (height - horizon + 260);
      const alpha = Math.max(0, 0.42 - t * 0.24);

      context.beginPath();
      for (let x = -width; x <= width * 2; x += 42) {
        const perspective = (x - vanishingX) * (0.14 + t * 2.3);
        const wave =
          Math.sin(x * 0.014 + seconds * 1.2 + i * 0.75) * 16 * t +
          Math.sin(x * 0.031 - seconds * 0.9) * 8 * t;
        const px = vanishingX + perspective;
        const py = y + wave;

        if (x === -width) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
      }

      context.lineWidth = 1.4 + t * 2;
      context.strokeStyle = rgba(palette.grid, alpha);
      context.stroke();
    }

    for (let lane = -8; lane <= 8; lane += 1) {
      context.beginPath();

      for (let step = 0; step <= 40; step += 1) {
        const t = step / 40;
        const y = horizon + t * t * (height - horizon + 260);
        const laneOffset = lane * 52;
        const terrainWave = Math.sin(t * 18 + seconds * 0.8 + lane) * 10 * t;
        const px = vanishingX + laneOffset * (0.12 + t * 2.35) + terrainWave;
        const py = y + Math.cos(lane * 0.7 + seconds) * 3 * t;

        if (step === 0) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
      }

      const laneAlpha = lane === 0 ? 0.34 : 0.18;
      context.lineWidth = lane === 0 ? 2 : 1.3;
      context.strokeStyle = rgba(palette.lanes, laneAlpha);
      context.stroke();
    }

    for (let i = 0; i < 26; i += 1) {
      const seed = Math.sin(i * 37.3) * 10000;
      const t = ((seed - Math.floor(seed) + seconds * 0.035) % 1) * 0.9 + 0.1;
      const side = i % 2 === 0 ? -1 : 1;
      const x = vanishingX + side * (width * 0.12 + (i % 7) * 44) * (0.2 + t * 1.8);
      const y = horizon + t * t * (height - horizon + 180);
      const size = 10 + t * 18;

      context.fillStyle =
        i % 3 === 0
          ? palette.moonAlpha > 0.5 ? rgba(palette.grid, 0.1) : rgba(palette.body[0], 0.08)
          : i % 3 === 1
            ? rgba(palette.lanes, 0.08)
            : rgba(palette.grid, 0.08);
      context.fillRect(x, y, size, size);
    }

    const glow = context.createRadialGradient(
      pointer.x * width,
      pointer.y * height,
      0,
      pointer.x * width,
      pointer.y * height,
      Math.max(width, height) * 0.44,
    );
    glow.addColorStop(0, palette.moonAlpha > 0.5 ? rgba(palette.grid, 0.14) : "rgba(248, 245, 236, 0.3)");
    glow.addColorStop(0.5, palette.moonAlpha > 0.5 ? rgba(palette.grid, 0.08) : rgba(palette.lanes, 0.08));
    glow.addColorStop(1, rgba(palette.lanes, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    if (!reduceMotion.matches) {
      window.requestAnimationFrame(drawField);
    }
  };

  resizeCanvas();
  drawField();
  window.addEventListener("resize", resizeCanvas);
}
