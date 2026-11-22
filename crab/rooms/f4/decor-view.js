/* A small photo studio for the desk decorations: one hidden WebGL renderer that can draw any item, turned to any angle,
   into any 2D canvas. The shop's cards use it for their turning previews; decor/view.html uses it to inspect a model up close.
   (2026-11-21) */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function makeStudio({ base = 'decor/', px = 320 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(px, px, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55; pm.dispose();
  const key = new THREE.DirectionalLight(0xffd9a6, 2.6); key.position.set(-2.2, 3.2, 2.6); scene.add(key);          // the desk lamp's side
  const rim = new THREE.DirectionalLight(0x9fb4ff, 1.5); rim.position.set(2.4, 1.6, -2.6); scene.add(rim);           // the window's side
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2e5c, 0.5));
  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 50);
  const turn = new THREE.Group(); scene.add(turn);
  const loader = new GLTFLoader(); const cache = new Map();
  const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();

  function load(it) {
    if (!cache.has(it.id)) cache.set(it.id, loader.loadAsync(base + it.file).then((g) => {
      const root = g.scene; box.setFromObject(root); box.getSize(size); box.getCenter(mid);
      const fit = { size: size.clone(), mid: mid.clone(), wide: !it.whole && size.x > size.y * 2.2 };   // `whole` in the catalog: always show all of it
      root.traverse((o) => { if (!o.isMesh || !o.material) return; if (o.material.emissiveIntensity > 1) o.material.emissiveIntensity = Math.min(o.material.emissiveIntensity, 5); if (o.material.transparent) { o.material.depthWrite = false; o.renderOrder = 2; } });
      return { root, fit };
    }));
    return cache.get(it.id);
  }
  // draw `it` into a 2D canvas, turned by `angle` (radians); wide things (the garland) are shown from a little to one side, close on a few bulbs
  async function shoot(it, canvas, angle = 0, { zoom = 1 } = {}) {
    const { root, fit } = await load(it);
    turn.clear(); turn.add(root); turn.rotation.y = fit.wide ? Math.sin(angle) * 0.35 : angle;
    const w = canvas.width, h = canvas.height;
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    const r = fit.wide ? fit.size.y * 1.15 : Math.max(fit.size.y, fit.size.x, fit.size.z) * 0.62;
    const d = r / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / zoom / Math.min(1, cam.aspect);
    const tgt = fit.wide ? mid.set(fit.mid.x - fit.size.x * 0.12, fit.mid.y - fit.size.y * 0.1, fit.mid.z) : mid.copy(fit.mid);
    cam.position.set(tgt.x + d * 0.22, tgt.y + d * 0.2, tgt.z + d * 0.955); cam.lookAt(tgt);
    renderer.render(scene, cam);
    const g = canvas.getContext('2d'); g.clearRect(0, 0, w, h); g.drawImage(renderer.domElement, 0, 0);
  }
  return { load, shoot, renderer, scene };
}
