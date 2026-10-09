// 3D asteroid viewer for Influence Stock – shows a model the visitor added themselves (kept only in their browser).
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';

export function show(el, buf) {
  const W = () => el.clientWidth || 600, H = () => el.clientHeight || 400;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, W() / H(), 0.01, 1e7);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.6); sun.position.set(5, 2, 4); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x5fc3e4, 0.6); rim.position.set(-4, -1, -3); scene.add(rim);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.5;
  renderer.domElement.addEventListener('pointerdown', () => { ctl.autoRotate = false; });
  let stopped = false, ro = null;
  const stop = () => {
    stopped = true; if (ro) ro.disconnect(); ctl.dispose();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
    });
    renderer.dispose(); el.innerHTML = '';
  };
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', gltf => {
      if (stopped) return;
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3()).length() || 1;
      obj.position.sub(box.getCenter(new THREE.Vector3()));
      scene.add(obj);
      cam.near = size / 1000; cam.far = size * 100; cam.position.set(0, size * 0.2, size * 1.7); cam.updateProjectionMatrix();
      ctl.minDistance = size * 0.55; ctl.maxDistance = size * 6; ctl.update();
      ro = new ResizeObserver(() => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); });
      ro.observe(el);
      const loop = () => { if (stopped) return; ctl.update(); renderer.render(scene, cam); requestAnimationFrame(loop); };
      loop();
      resolve(stop);
    }, err => { stop(); reject(err); });
  });
}