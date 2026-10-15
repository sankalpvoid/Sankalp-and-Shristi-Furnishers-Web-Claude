// Offline render engine (three.js in headless Chromium).
// Soft shadows + ambient occlusion are produced by accumulating many jittered shadow-mapped
// light samples (sun cone, window area light) into a float buffer, then tone-mapping.
import * as THREE from "three";

export async function renderScene(spec) {
  const { width, height, build, sunSamples = 36, skySamples = 44, aoSamples = 44, fillSamples = 6, exposure: expo = 1, grain = 0.012, vignette = 0.18, shadowRes = 3072 } = spec;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const floatBlend = !!renderer.extensions.get("EXT_float_blend");
  const accType = floatBlend ? THREE.FloatType : THREE.HalfFloatType;

  const world = build(THREE);
  const { scene, camera, lights } = world;
  const frameRT = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const mkAcc = () => new THREE.WebGLRenderTarget(width, height, { type: accType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const accSun = mkAcc(), accSky = mkAcc(), accFill = mkAcc(), accAO = mkAcc();

  // additive blit
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: null } },
    vertexShader: "varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.,1.); }",
    fragmentShader: "uniform sampler2D t; varying vec2 v; void main(){ gl_FragColor=vec4(texture2D(t,v).rgb,1.); }",
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    depthTest: false, depthWrite: false, transparent: true,
  });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat));
  renderer.setRenderTarget(accSun); renderer.setClearColor(0x000000, 1); renderer.clear();
  renderer.setRenderTarget(accSky); renderer.clear();
  renderer.setRenderTarget(accFill); renderer.clear();
  renderer.setRenderTarget(accAO); renderer.clear();

  // lights
  const dl = new THREE.DirectionalLight(0xffffff, 0);
  dl.castShadow = true;
  const sc = dl.shadow.camera; const R = lights.shadowRadius || 9;
  sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 0.5; sc.far = R * 4;
  dl.shadow.mapSize.set(shadowRes, shadowRes);
  dl.shadow.bias = -0.0003; dl.shadow.normalBias = 0.015;
  scene.add(dl); scene.add(dl.target);
  dl.target.position.copy(lights.target || new THREE.Vector3(0, 0.6, 0));
  const amb = new THREE.AmbientLight(lights.fillColor || 0xfff1e0, 0);
  const hemi = new THREE.HemisphereLight(lights.skyFill || 0xdfe8ff, lights.groundFill || 0xc9b79a, 0);
  scene.add(amb, hemi);

  let seed = (spec.seed || 1) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const jitter = () => camera.setViewOffset(width, height, rnd() - 0.5, rnd() - 0.5, width, height);

  function pass(acc) {
    jitter();
    renderer.setRenderTarget(frameRT); renderer.setClearColor(0x000000, 1); renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(acc);
    quadMat.uniforms.t.value = frameRT.texture;
    renderer.autoClear = false; renderer.render(quadScene, quadCam); renderer.autoClear = true;
  }
  const setLight = (dir, color, intensity) => {
    dl.position.copy(dl.target.position).addScaledVector(dir, R * 2);
    dl.color.set(color); dl.intensity = intensity;
  };
  const tmp = new THREE.Vector3();
  // fill frames (no directional)
  dl.intensity = 0; amb.intensity = lights.fillIntensity ?? 0.5; hemi.intensity = lights.hemiIntensity ?? 0.4;
  dl.castShadow = false;
  for (let i = 0; i < fillSamples; i++) pass(accFill);
  dl.castShadow = true; amb.intensity = 0; hemi.intensity = 0;
  // sun samples
  for (let i = 0; i < sunSamples; i++) {
    const a = lights.sunAngle ?? 0.03;
    tmp.copy(lights.sunDir).add(new THREE.Vector3((rnd() - 0.5) * a * 2, (rnd() - 0.5) * a * 2, (rnd() - 0.5) * a * 2)).normalize();
    setLight(tmp, lights.sunColor, lights.sunIntensity);
    pass(accSun);
    if (spec.onProgress) spec.onProgress("sun", i + 1, sunSamples);
  }
  // sky / window area-light samples
  for (let i = 0; i < skySamples; i++) {
    lights.skySample(rnd, tmp);
    setLight(tmp, lights.skyColor, lights.skyIntensity);
    pass(accSky);
    if (spec.onProgress) spec.onProgress("sky", i + 1, skySamples);
  }
  // ambient-occlusion samples: cosine-weighted directions over the upper hemisphere (soft contact shadows)
  for (let i = 0; i < aoSamples; i++) {
    const u1 = rnd(), u2 = rnd(), r = Math.sqrt(u1), ph = 6.2831853 * u2;
    tmp.set(r * Math.cos(ph), Math.sqrt(Math.max(0.02, 1 - u1)), r * Math.sin(ph)).normalize();
    setLight(tmp, lights.aoColor || 0xf2f4ff, lights.aoIntensity ?? 1.6);
    pass(accAO);
    if (spec.onProgress) spec.onProgress("ao", i + 1, aoSamples);
  }
  renderer.setRenderTarget(null);

  const read = (rt) => { const b = new Float32Array(width * height * 4); renderer.readRenderTargetPixels(rt, 0, 0, width, height, b); return b; };
  const F = read(accFill), S = read(accSun), K = read(accSky), A = read(accAO);
  const exposure = (lights.__exposure || 1) * expo;
  const out = new Uint8ClampedArray(width * height * 4);
  const aces = (x) => { x *= 0.6; return Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))); };
  const srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  const grade = lights.grade || { r: 1, g: 1, b: 1 };
  const nf = 1 / Math.max(1, fillSamples), ns = 1 / Math.max(1, sunSamples), nk = 1 / Math.max(1, skySamples), na = 1 / Math.max(1, aoSamples);
  // grain: cheap hash noise
  let h = 123456789;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const vx = (x / width - 0.5) * 2, vy = (y / height - 0.5) * 2;
      const vig = 1 - vignette * (vx * vx * 0.6 + vy * vy * 0.9);
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const g = (h / 0x7fffffff - 0.5) * grain;
      const fy = height - 1 - y; // flip (readPixels is bottom-up)
      const j = (fy * width + x) * 4;
      const lum = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        let v = (F[j + c] * nf + S[j + c] * ns + K[j + c] * nk + A[j + c] * na) * exposure * vig * [grade.r, grade.g, grade.b][c];
        v = srgb(aces(v));
        v = v < 0.5 ? 0.5 * Math.pow(v * 2, 1.12) : 1 - 0.5 * Math.pow((1 - v) * 2, 1.12); // gentle S-curve
        lum[c] = v + g;
      }
      const L = lum[0] * 0.2126 + lum[1] * 0.7152 + lum[2] * 0.0722, sat = lights.saturation ?? 1.1;
      for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, (L + (lum[c] - L) * sat) * 255));
      out[i + 3] = 255;
    }
  }
  const c2 = document.createElement("canvas"); c2.width = width; c2.height = height;
  c2.getContext("2d").putImageData(new ImageData(out, width, height), 0, 0);
  renderer.dispose();
  return c2.toDataURL("image/png");
}
