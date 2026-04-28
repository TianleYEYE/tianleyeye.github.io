const year = document.querySelector("#year");
const cursorLight = document.querySelector(".cursor-light");
const emailLink = document.querySelector("[data-copy-email]");
const tiltItems = document.querySelectorAll("[data-tilt]");
const shaderCanvas = document.querySelector(".shader-field");
const themeHourInput = document.querySelector("#theme-hour");
const themeTimeOutput = document.querySelector("[data-theme-time]");
const pointer = {
  x: 0.5,
  y: 0.45,
};

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
      pageBg: [238, 233, 223],
      surface: [246, 244, 235, 0.68],
      surfaceStrong: [251, 249, 241, 0.84],
      text: [32, 42, 48],
      muted: [101, 113, 121],
      line: [32, 42, 48, 0.14],
      accent: [88, 125, 131],
      accentStrong: [56, 92, 99],
      coral: [185, 134, 120],
      sun: [196, 180, 125],
      mint: [136, 165, 154],
      headerBg: [246, 244, 235, 0.76],
      cursorGlow: [88, 125, 131, 0.18],
    },
    shader: {
      sky: ["#d9d5cf", "#c4c7ca", "#d1b9ad", "#e8e0d3"],
      glow: [[215, 169, 139], 0.56, [176, 127, 139], 0.24],
      body: [[216, 183, 132], 0.78, [174, 112, 132], 0.64],
      ground: [
        [63, 72, 82, 0.24],
        [89, 111, 118, 0.16],
        [226, 219, 206, 0.1],
      ],
      grid: [88, 125, 131],
      lanes: [136, 165, 154],
      haze: [[219, 176, 153], 0.4, [120, 143, 153], 0.2],
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
      pageBg: [233, 223, 213],
      surface: [242, 235, 226, 0.66],
      surfaceStrong: [248, 242, 233, 0.84],
      text: [35, 40, 48],
      muted: [104, 109, 120],
      line: [35, 40, 48, 0.16],
      accent: [103, 111, 143],
      accentStrong: [70, 77, 104],
      coral: [172, 117, 111],
      sun: [197, 170, 121],
      mint: [132, 153, 143],
      headerBg: [242, 235, 226, 0.78],
      cursorGlow: [172, 117, 111, 0.18],
    },
    shader: {
      sky: ["#b9b4bd", "#9ea7b5", "#b88f91", "#dac7b8"],
      glow: [[196, 151, 126], 0.68, [146, 103, 134], 0.28],
      body: [[205, 164, 110], 0.86, [150, 88, 125], 0.72],
      ground: [
        [49, 55, 70, 0.3],
        [82, 94, 111, 0.2],
        [210, 197, 184, 0.12],
      ],
      grid: [103, 111, 143],
      lanes: [132, 153, 143],
      haze: [[219, 176, 153], 0.42, [120, 143, 153], 0.22],
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
      pageBg: [18, 23, 32],
      surface: [31, 36, 47, 0.68],
      surfaceStrong: [38, 43, 55, 0.86],
      text: [230, 225, 215],
      muted: [169, 176, 184],
      line: [230, 225, 215, 0.17],
      accent: [132, 155, 181],
      accentStrong: [184, 199, 216],
      coral: [155, 115, 124],
      sun: [200, 194, 160],
      mint: [120, 148, 142],
      headerBg: [20, 24, 32, 0.78],
      cursorGlow: [132, 155, 181, 0.2],
    },
    shader: {
      sky: ["#10151f", "#171d2a", "#25273a", "#141922"],
      glow: [[196, 202, 190], 0.24, [132, 155, 181], 0.18],
      body: [[221, 220, 202], 0.86, [163, 176, 194], 0.72],
      ground: [
        [10, 13, 20, 0.44],
        [31, 42, 57, 0.3],
        [18, 23, 32, 0.2],
      ],
      grid: [132, 155, 181],
      lanes: [120, 148, 142],
      haze: [[132, 155, 181], 0.22, [89, 111, 142], 0.18],
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
  if (state.shader.moonAlpha > 0.55) return "night";
  if (state.shader.sunAlpha > 0.55 && hour >= 15.5) return "dusk";
  return "day";
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

  if (hour < 19.4) {
    return themeKeyframes.dusk.css;
  }

  if (hour < 20.4) {
    const amount = smoothstep(19.4, 20.4, hour);
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

const getInitialHour = () => {
  const params = new URLSearchParams(window.location.search);
  const forcedHour = Number(params.get("hour"));
  const forcedTheme = params.get("theme");

  if (Number.isFinite(forcedHour) && forcedHour >= 0 && forcedHour <= 23.75) {
    return forcedHour;
  }

  if (forcedTheme === "day") {
    return 12;
  }

  if (forcedTheme === "dusk") {
    return 17;
  }

  if (forcedTheme === "night") {
    return 22;
  }

  return new Date().getHours();
};

let selectedHour = getInitialHour();
let visualTheme = getThemeName(selectedHour);
let themeState = getThemeState(selectedHour);

const applyVisualTheme = () => {
  themeState = getThemeState(selectedHour);
  visualTheme = getThemeName(selectedHour);
  const readableColors = getReadableColors(selectedHour);
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
    const hour = Math.floor(selectedHour);
    const minutes = Math.round((selectedHour - hour) * 60);
    themeTimeOutput.textContent = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
};

if (themeHourInput) {
  themeHourInput.valueAsNumber = selectedHour;
  themeHourInput.addEventListener("input", () => {
    selectedHour = themeHourInput.valueAsNumber;
    applyVisualTheme();
  });
  window.setTimeout(() => {
    themeHourInput.valueAsNumber = selectedHour;
    applyVisualTheme();
  }, 0);
}

applyVisualTheme();

if (year) {
  year.textContent = String(new Date().getFullYear());
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = event.clientY / window.innerHeight;

  if (cursorLight) {
    cursorLight.style.setProperty("--x", `${event.clientX}px`);
    cursorLight.style.setProperty("--y", `${event.clientY}px`);
  }
});

tiltItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    item.style.setProperty("--ry", `${x * 9}deg`);
    item.style.setProperty("--rx", `${y * -9}deg`);
  });

  item.addEventListener("pointerleave", () => {
    item.style.setProperty("--rx", "0deg");
    item.style.setProperty("--ry", "0deg");
  });
});

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
          ? palette.moonAlpha > 0.5 ? "rgba(132, 155, 181, 0.1)" : "rgba(185, 134, 120, 0.08)"
          : i % 3 === 1
            ? "rgba(136, 165, 154, 0.08)"
            : "rgba(88, 125, 131, 0.08)";
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
    glow.addColorStop(0, palette.moonAlpha > 0.5 ? "rgba(132, 155, 181, 0.14)" : "rgba(248, 245, 236, 0.34)");
    glow.addColorStop(0.5, palette.moonAlpha > 0.5 ? "rgba(132, 155, 181, 0.08)" : "rgba(136, 165, 154, 0.08)");
    glow.addColorStop(1, "rgba(136, 165, 154, 0)");
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
