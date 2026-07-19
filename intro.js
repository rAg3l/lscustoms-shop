// LS CUSTOMS — cinematic WebGL intro v8
// Forged particle wheel -> camera dive -> particle tunnel -> brand lockup.
(function () {
  "use strict";

  const overlay = document.getElementById("intro");
  const canvas = document.getElementById("intro-canvas");
  if (!overlay || !canvas) return;

  function closeIntro(instant) {
    if (typeof finishIntro === "function") finishIntro(overlay, instant);
    else if (instant) overlay.remove();
    else {
      overlay.classList.add("fade");
      setTimeout(() => overlay.remove(), 1100);
    }
  }

  const reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { closeIntro(true); return; }

  const W = Math.max(window.innerWidth || 0, 1);
  const H = Math.max(window.innerHeight || 0, 1);
  if (W <= 1 || H <= 1) { closeIntro(true); return; }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) { closeIntro(true); return; }

  const vertexSource = `
    precision highp float;
    attribute vec4 aSeed;
    attribute vec2 aTarget;
    uniform float uTime;
    uniform float uAspect;
    uniform float uDpr;
    varying float vAlpha;
    varying float vEnergy;

    const float PI = 3.14159265359;
    const float TAU = 6.28318530718;

    float ease(float x) {
      x = clamp(x, 0.0, 1.0);
      return x * x * (3.0 - 2.0 * x);
    }

    float hash(float n) {
      return fract(sin(n * 91.3458) * 47453.5453);
    }

    vec3 wheel(float t) {
      float group = aSeed.y;
      float outer = 1.0 - step(0.52, group);
      float inner = step(0.52, group) * (1.0 - step(0.72, group));
      float spoke = step(0.72, group);
      float rawAngle = aSeed.x * TAU;
      float spokeId = floor(aSeed.x * 12.0);
      float spokeAngle = spokeId * TAU / 12.0 + (aSeed.z - 0.5) * 0.055;
      float spokeRadius = 0.23 + fract(aSeed.x * 23.73 + aSeed.w) * 0.52;
      float ringRadius = outer * (0.735 + (aSeed.z - 0.5) * 0.055) +
        inner * (0.225 + (aSeed.z - 0.5) * 0.045);
      float radius = ringRadius + spoke * spokeRadius;
      float angle = mix(rawAngle, spokeAngle, spoke);

      // Paired spokes bend like a modern forged rim rather than a flat star.
      angle += spoke * sin((radius - 0.22) * 4.4) * 0.19 * sign(aSeed.w - 0.5);
      float breathe = 1.0 + sin(t * 1.55 + aSeed.w * TAU) * 0.012;
      vec3 p = vec3(cos(angle) * radius * breathe,
                    sin(angle) * radius * breathe,
                    (aSeed.z - 0.5) * (0.10 + outer * 0.13));

      // Slow showroom rotation and a slight three-quarter camera angle.
      float ry = -0.22 + sin(t * 0.42) * 0.10;
      float cosy = cos(ry), siny = sin(ry);
      p = vec3(p.x * cosy + p.z * siny, p.y, -p.x * siny + p.z * cosy);
      float rz = -0.11 + t * 0.055;
      float cosz = cos(rz), sinz = sin(rz);
      p.xy = vec2(p.x * cosz - p.y * sinz, p.x * sinz + p.y * cosz);
      // Keep the full forged silhouette visible in a portrait Telegram viewport.
      p *= min(1.0, uAspect * 1.15);
      p.x /= uAspect;
      return p;
    }

    vec3 tunnel(float t) {
      float speed = max(t - 2.35, 0.0);
      float z = fract(aSeed.z + aSeed.w * 0.19 - speed * (0.22 + aSeed.y * 0.035));
      float nearZ = max(0.045, z);
      float angle = aSeed.x * TAU + sin(aSeed.w * 18.0 + t) * 0.18;
      float radius = 0.23 + aSeed.y * 0.50 + sin(aSeed.x * 31.0 + t * 1.7) * 0.045;
      float perspective = 0.20 / nearZ;
      vec2 p = vec2(cos(angle), sin(angle)) * radius * perspective;
      p.x /= uAspect;
      return vec3(p, 1.0 - z);
    }

    void main() {
      float t = uTime;
      vec3 rim = wheel(min(t, 3.2));
      vec3 flight = tunnel(t);

      float dive = ease((t - 2.35) / 1.55);
      float burst = sin(dive * PI) * (0.18 + aSeed.z * 0.30);
      vec2 burstDir = normalize(rim.xy + vec2(0.0001));
      vec2 world = mix(rim.xy, flight.xy, dive) + burstDir * burst;

      float gather = ease((t - 5.55) / 3.05);
      float inv = 1.0 - gather;
      float angle = aSeed.w * TAU + gather * (8.0 + aSeed.z * 5.0);
      float helix = sin(gather * PI) * inv * (0.17 + aSeed.y * 0.36);
      vec2 vortex = vec2(cos(angle), sin(angle)) * helix;
      world = mix(world, aTarget, gather) + vortex;

      // A compression shock makes the final lockup feel physical.
      float compression = exp(-pow((t - 5.48) * 3.4, 2.0));
      world += normalize(world + vec2(0.0001)) * compression * 0.075 * (0.4 + aSeed.z);
      gl_Position = vec4(world, 0.0, 1.0);

      float reveal = ease((t - 0.18 - aSeed.w * 0.65) / 1.15);
      float wheelPulse = 0.58 + 0.42 * sin(t * 2.4 + aSeed.w * 21.0);
      float tunnelBoost = mix(1.0, 1.5 + flight.z * 1.7, dive * inv);
      float finalDensity = ease((t - 7.65) / 0.75);
      float scan = exp(-pow((aTarget.x - (t - 8.15) * 1.35 + 1.2) * 8.0, 2.0));
      gl_PointSize = (1.05 + aSeed.z * 1.65 + finalDensity * 0.80 + scan * 1.45) *
        uDpr * tunnelBoost;
      vAlpha = reveal * mix((0.28 + aSeed.z * 0.64) * wheelPulse,
                            0.90 + scan * 0.10, gather);
      vEnergy = max(max(dive * flight.z, compression), scan);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying float vAlpha;
    varying float vEnergy;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = length(p) * 2.0;
      float core = 1.0 - smoothstep(0.02, 0.42, d);
      float halo = 1.0 - smoothstep(0.16, 1.0, d);
      float alpha = (core + halo * (0.24 + vEnergy * 0.20)) * vAlpha;
      if (alpha < 0.012) discard;
      gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) { closeIntro(true); return; }
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    closeIntro(true);
    return;
  }

  // Text is used only as a destination map; every visible pixel remains a particle.
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const mc = mask.getContext("2d", { willReadFrequently: true });
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = '800 100px "JetBrains Mono", monospace';
  const measured = probe.measureText("LS CUSTOMS").width || 610;
  const titleSize = Math.min(170, Math.max(43, (W * 0.91 / measured) * 100));
  const shopSize = titleSize * 0.45;
  const cx = W * 0.5;
  const cy = H * 0.5;
  mc.fillStyle = "#fff";
  mc.textAlign = "center";
  mc.textBaseline = "middle";
  mc.font = `800 ${titleSize}px "JetBrains Mono", monospace`;
  mc.fillText("LS CUSTOMS", cx, cy - titleSize * 0.36);
  mc.font = `700 ${shopSize}px "JetBrains Mono", monospace`;
  mc.fillText("S H O P", cx, cy + titleSize * 0.56);

  const bitmap = mc.getImageData(0, 0, W, H).data;
  const px = [];
  const py = [];
  const step = W < 560 ? 1 : 2;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (bitmap[(y * W + x) * 4 + 3] > 42) {
        px.push(x);
        py.push(y);
      }
    }
  }
  if (!px.length) { gl.deleteProgram(program); closeIntro(true); return; }

  const count = W * H < 310000 ? 26000 : 32000;
  const seeds = new Float32Array(count * 4);
  const targets = new Float32Array(count * 2);
  function hash(n) {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }
  for (let i = 0; i < count; i++) {
    const s4 = i * 4;
    seeds[s4] = hash(i + 1);
    seeds[s4 + 1] = hash(i + 1013);
    seeds[s4 + 2] = hash(i + 2039);
    seeds[s4 + 3] = hash(i + 4099);
    const pick = (i * 7919) % px.length;
    const t2 = i * 2;
    targets[t2] = (px[pick] / W) * 2 - 1 + (hash(i + 12007) - 0.5) * 0.0018;
    targets[t2 + 1] = 1 - (py[pick] / H) * 2 + (hash(i + 16001) - 0.5) * 0.0018;
  }

  function bindAttribute(name, size, data) {
    const location = gl.getAttribLocation(program, name);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    return buffer;
  }

  gl.useProgram(program);
  const seedBuffer = bindAttribute("aSeed", 4, seeds);
  const targetBuffer = bindAttribute("aTarget", 2, targets);
  const timeLocation = gl.getUniformLocation(program, "uTime");
  gl.uniform1f(gl.getUniformLocation(program, "uAspect"), W / H);
  gl.uniform1f(gl.getUniformLocation(program, "uDpr"), dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.003, 0.006, 0.012, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let started = -1;
  let done = false;
  const END = 10.35;

  function dispose() {
    gl.deleteBuffer(seedBuffer);
    gl.deleteBuffer(targetBuffer);
    gl.deleteProgram(program);
  }

  function frame(now) {
    if (done) return;
    if (started < 0) started = now;
    const t = Math.min((now - started) / 1000, END);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLocation, t);
    gl.drawArrays(gl.POINTS, 0, count);
    if (t >= END) {
      done = true;
      dispose();
      closeIntro(false);
      return;
    }
    requestAnimationFrame(frame);
  }

  overlay.addEventListener("click", () => {
    if (!done) {
      done = true;
      dispose();
      closeIntro(false);
    }
  }, { once: true });

  requestAnimationFrame(frame);
}());
