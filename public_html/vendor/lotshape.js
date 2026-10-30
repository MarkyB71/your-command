// Resource globe – real shape (Mark, 29 Oct 2026). Paints the lot levels onto the game's own 3D model
// of the rock (the file the player added on the Asteroids page, kept only in their browser).
// How lots sit on the model (influence-client src/game/scene/asteroid/helpers/LotGeometry.js):
// a lot's point is its spiral position (SDK getLotPosition) × the rock's stretch, pushed out to the surface.
// So a point p on the model belongs to the lot nearest to normalize(p ÷ stretch).
// Stretch (influence-client src/lib/asteroidConfig.js + lib/math/Seed.js, CC BY-NC 4.0 per Chris, Unstoppable Games):
// seed = sha256(bytes32("influence") ‖ uint256(asteroid id)); v = unit vector of seed hex [0:4],[4:8],[8:12];
// stretch = 1 − v × 0.45 × (1 − (radius m ÷ 376,000)²).
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';

const GA = Math.PI * (3 - Math.sqrt(5));

export async function stretchFor(id, radiusKm) {
  const b = new Uint8Array(64);
  b.set(new TextEncoder().encode('influence'), 0);
  let v = BigInt(id);
  for (let i = 63; i >= 32 && v > 0n; i--) { b[i] = Number(v & 255n); v >>= 8n; }
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', b));
  const hex = [...h].map((x) => x.toString(16).padStart(2, '0')).join('');
  const x = parseInt(hex.substr(0, 4), 16), y = parseInt(hex.substr(4, 4), 16), z = parseInt(hex.substr(8, 4), 16);
  const L = Math.hypot(x, y, z) || 1, mod = 0.45 * (1 - Math.pow((radiusKm * 1000) / 376000, 2));
  return new THREE.Vector3(1 - (x / L) * mod, 1 - (y / L) * mod, 1 - (z / L) * mod);
}

// nearest lot to a unit direction, using bands of the spiral
function lotFinder(n) {
  const P = new Float32Array((n + 1) * 3);
  for (let i = 1; i <= n; i++) {
    const y = 1 - ((i - 1) / Math.max(1, n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = GA * (i - 1);
    P[i * 3] = r * Math.cos(th); P[i * 3 + 1] = y; P[i * 3 + 2] = r * Math.sin(th);
  }
  const K = Math.max(1, Math.floor(Math.sqrt(n) / 2)), band = (y) => Math.min(K - 1, Math.max(0, Math.floor(((1 - y) / 2) * K)));
  const B = Array.from({ length: K }, () => []);
  for (let i = 1; i <= n; i++) B[band(P[i * 3 + 1])].push(i);
  const BI = B.map((a) => Int32Array.from(a));
  return {
    P, K, BI, band,
    near(x, y, z) {
      const k = band(y);
      let best = 1, bd = -2;
      for (let q = Math.max(0, k - 1); q <= Math.min(K - 1, k + 1); q++) {
        const a = BI[q];
        for (let j = 0; j < a.length; j++) {
          const i = a[j], d = P[i * 3] * x + P[i * 3 + 1] * y + P[i * 3 + 2] * z;
          if (d > bd) { bd = d; best = i; }
        }
      }
      return best;
    },
  };
}


// el: box to draw in. buf: the glTF/glb file. o: {stretch, n, onHover(lot|0, x, y), spin}
export function show(el, buf, o) {
  const W = () => el.clientWidth || 600, H = () => el.clientHeight || 600;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, W() / H(), 1, 1e9);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); scene.add(sun);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.autoRotate = !!o.spin; ctl.autoRotateSpeed = 0.2;
  const F = lotFinder(o.n), st = o.stretch;
  let stopped = false, ro = null, meshes = [], lotOf = [], cols = [], dirs = [], nbs = null, marks = null, size = 1, R = 1, focus = null, mine = {};
  const lotSurf = new Float32Array((o.n + 1) * 3), lotBest = new Float32Array(o.n + 1).fill(-2);

  const api = {
    stop() {
      stopped = true; api.dead = true; if (ro) ro.disconnect(); ctl.dispose();
      scene.traverse((x) => {
        if (x.geometry) x.geometry.dispose();
        if (x.material) [].concat(x.material).forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
      });
      renderer.dispose(); el.innerHTML = '';
    },
    setSpin(v) { wantSpin = !!v; ctl.autoRotate = wantSpin && !over; },
    // vals: Float32Array of lot levels; fn(level) → [r,g,b] 0..1 (game colours); my: {lot: name}
    // soft (All resources): each point blends the lots around it, so the rock reads as a smooth heat map
    paint(vals, fn, my, myCol, soft) {
      const LC = new Float32Array((o.n + 1) * 3);
      for (let i = 1; i <= o.n; i++) { const q = fn(vals[i]); for (let a = 0; a < 3; a++) LC[i * 3 + a] = Math.pow(q[a], 2.2); } // linear for three.js
      if (soft && !nbs) nbs = neighbours();
      meshes.forEach((m, k) => {
        const lo = lotOf[k], c = cols[k], A = c.array;
        if (soft) {
          const NL = nbs[k].L, NW = nbs[k].W;
          for (let i = 0; i < lo.length; i++) {
            let r = 0, g = 0, b = 0;
            for (let j = i * NB; j < i * NB + NB; j++) { const l = NL[j], w = NW[j]; if (!w) break; r += LC[l * 3] * w; g += LC[l * 3 + 1] * w; b += LC[l * 3 + 2] * w; }
            A[i * 3] = r; A[i * 3 + 1] = g; A[i * 3 + 2] = b;
          }
        } else {
          for (let i = 0; i < lo.length; i++) { const l = lo[i]; A[i * 3] = LC[l * 3]; A[i * 3 + 1] = LC[l * 3 + 1]; A[i * 3 + 2] = LC[l * 3 + 2]; }
        }
        c.needsUpdate = true;
      });
      mine = my || {};
      if (marks) { scene.remove(marks); marks.geometry.dispose(); marks = null; }
      const ids = Object.keys(mine).map(Number).filter((i) => i >= 1 && i <= o.n && lotBest[i] > -2);
      if (ids.length) {
        const pos = new Float32Array(ids.length * 3);
        ids.forEach((i, j) => { for (let a = 0; a < 3; a++) pos[j * 3 + a] = lotSurf[i * 3 + a] * 1.004; });
        const cl = new Float32Array(ids.length * 3), cc = new THREE.Color();
        ids.forEach((i, j) => { cc.set((myCol && myCol[i]) || '#ffd24a'); cl[j * 3] = cc.r; cl[j * 3 + 1] = cc.g; cl[j * 3 + 2] = cc.b; });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
        marks = new THREE.Points(g, new THREE.PointsMaterial({ map: ring(), vertexColors: true, size: 14, sizeAttenuation: false, transparent: true, depthWrite: false }));
        scene.add(marks);
      }
    },
    // turn the view to face a lot
    face(i) { if (i && lotBest[i] > -2) focus = new THREE.Vector3(lotSurf[i * 3], lotSurf[i * 3 + 1], lotSurf[i * 3 + 2]).normalize(); ctl.autoRotate = false; },
  };

  const NB = 8;
  function neighbours() {
    const sp = Math.sqrt((4 * Math.PI) / o.n), sig = sp * 0.75, cmin = Math.cos(sp * 2.2), K = F.K;
    return dirs.map((dr, mi) => {
      const cnt = dr.length / 3, L = new Uint32Array(cnt * NB), W = new Float32Array(cnt * NB), tl = [], tw = [];
      for (let v = 0; v < cnt; v++) {
        const x = dr[v * 3], y = dr[v * 3 + 1], z = dr[v * 3 + 2], bk = F.band(y);
        tl.length = 0; tw.length = 0;
        for (let q = Math.max(0, bk - 3); q <= Math.min(K - 1, bk + 3); q++) {
          const a = F.BI[q];
          for (let j = 0; j < a.length; j++) {
            const i = a[j], d = F.P[i * 3] * x + F.P[i * 3 + 1] * y + F.P[i * 3 + 2] * z;
            if (d < cmin) continue;
            const ang = Math.acos(Math.min(1, d)), w = Math.exp(-(ang * ang) / (2 * sig * sig));
            if (tl.length < NB) { tl.push(i); tw.push(w); }
            else { let m = 0; for (let t = 1; t < NB; t++) if (tw[t] < tw[m]) m = t; if (w > tw[m]) { tl[m] = i; tw[m] = w; } }
          }
        }
        let s = 0; for (let t = 0; t < tw.length; t++) s += tw[t];
        if (!s) { tl.length = 0; tl.push(lotOf[mi][v]); tw.length = 0; tw.push(1); s = 1; }
        for (let t = 0; t < tl.length; t++) { L[v * NB + t] = tl[t]; W[v * NB + t] = tw[t] / s; }
      }
      return { L, W };
    });
  }

  function ring() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 7; x.beginPath(); x.arc(32, 32, 24, 0, 7); x.stroke();
    const t = new THREE.CanvasTexture(c); return t;
  }

  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', () => { ctl.autoRotate = false; wantSpin = false; focus = null; });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!meshes.length || !o.onHover) return;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, cam);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) { o.onHover(0); return; }
    const p = hit.point.clone().divide(st).normalize();
    o.onHover(F.near(p.x, p.y, p.z), e.clientX - r.left, e.clientY - r.top);
  });
  // spin pauses while the pointer is over the rock, so lots can be hovered (Mark)
  let wantSpin = !!o.spin, over = false;
  renderer.domElement.addEventListener('pointerenter', () => { over = true; ctl.autoRotate = false; });
  renderer.domElement.addEventListener('pointerleave', () => { over = false; ctl.autoRotate = wantSpin; if (o.onHover) o.onHover(0); });

  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', (gltf) => {
      if (stopped) return;
      const obj = gltf.scene;
      obj.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      obj.traverse((m) => {
        if (!m.isMesh || !m.geometry || !m.geometry.attributes.position) return;
        const pa = m.geometry.attributes.position, lo = new Uint32Array(pa.count), dr = new Float32Array(pa.count * 3);
        for (let i = 0; i < pa.count; i++) {
          v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld);
          const len = v.length(); if (len > R) R = len;
          const ux = v.x / st.x, uy = v.y / st.y, uz = v.z / st.z, L = Math.hypot(ux, uy, uz) || 1;
          const k = F.near(ux / L, uy / L, uz / L); lo[i] = k; dr[i * 3] = ux / L; dr[i * 3 + 1] = uy / L; dr[i * 3 + 2] = uz / L;
          const d = (F.P[k * 3] * ux + F.P[k * 3 + 1] * uy + F.P[k * 3 + 2] * uz) / L;
          if (d > lotBest[k]) { lotBest[k] = d; lotSurf[k * 3] = v.x; lotSurf[k * 3 + 1] = v.y; lotSurf[k * 3 + 2] = v.z; }
        }
        const c = new THREE.BufferAttribute(new Float32Array(pa.count * 3), 3);
        m.geometry.setAttribute('color', c);
        if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
        [].concat(m.material).forEach((x) => x && x.dispose && x.dispose());
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
        // rich lots glow a little even on the dark side
        mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * 0.85;').replace('#include <color_fragment>', 'diffuseColor.rgb = vec3(0.05) + vColor.rgb * 0.25;'); };
        m.material = mat;
        meshes.push(m); lotOf.push(lo); cols.push(c); dirs.push(dr);
      });
      if (!meshes.length) { api.stop(); reject(new Error('no shape in this file')); return; }
      scene.add(obj);
      size = R * 2;
      cam.near = size / 1000; cam.far = size * 100; cam.position.set(0, R * 0.5, R * 3.4); cam.updateProjectionMatrix();
      ctl.minDistance = R * 1.2; ctl.maxDistance = R * 8; ctl.update();
      ro = new ResizeObserver(() => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); });
      ro.observe(el);
      const loop = () => {
        if (stopped || !el.isConnected) { if (!stopped) api.stop(); return; }
        if (focus) { // ease the camera round to the picked lot
          const d = cam.position.length(), want = focus.clone().multiplyScalar(d);
          cam.position.lerp(want, 0.08).setLength(d);
          if (cam.position.distanceTo(want) < d * 0.01) focus = null;
        }
        sun.position.copy(cam.position).add(new THREE.Vector3(R, R, 0));
        ctl.update(); renderer.render(scene, cam); requestAnimationFrame(loop);
      };
      loop();
      resolve(api);
    }, (err) => { api.stop(); reject(err); });
  });
}
