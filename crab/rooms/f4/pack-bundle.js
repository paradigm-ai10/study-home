// The cloth bundle the crab carries. Works with any three.js instance: makeBundle(THREE, { fill })
// fill 0..1: how much has been packed. Origin is the bottom centre; units are the crab model's (body is 1.5 wide).
export function makeBundle(THREE, { fill = 0.5, cloth = '#FF6B57', dot = '#FFF4E0', poke = true } = {}) {
  const g = new THREE.Group(); g.name = 'bundle';
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = cloth; x.fillRect(0, 0, 256, 256); x.fillStyle = dot;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i * 32 + (j % 2 ? 16 : 0) + 8, j * 32 + 16, 4.2, 0, 7); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
  const r = 0.2 + 0.3 * fill;
  const geo = new THREE.SphereGeometry(1, 40, 28); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
    const lump = 1 + fill * 0.09 * (Math.sin(X * 5.1 + 1) * Math.cos(Z * 4.3) + Math.sin(Y * 6.2 + Z * 3));   // things inside push the cloth out
    X *= lump * 1.08; Z *= lump * 0.96; Y *= 0.86 * lump; if (Y < -0.5) Y = -0.5 - (Y + 0.5) * 0.15;          // sits flat
    const pinch = Math.max(0, Y - 0.45); X *= 1 - pinch * 0.9; Z *= 1 - pinch * 0.9;                           // gathered at the knot
    p.setXYZ(i, X, Y + 0.5, Z);
  }
  geo.computeVertexNormals();
  const sack = new THREE.Mesh(geo, mat); sack.scale.setScalar(r); sack.castShadow = true; g.add(sack);
  const earGeo = new THREE.ConeGeometry(0.34, 0.8, 14, 1).translate(0, 0.4, 0);
  [-1, 1].forEach((s) => { const e = new THREE.Mesh(earGeo, mat); e.scale.set(r * 0.9, r * 0.9, r * 0.45); e.position.set(s * r * 0.1, r * 1.22, 0); e.rotation.z = -s * 0.75; e.castShadow = true; g.add(e); });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat); knot.scale.setScalar(r); knot.position.y = r * 1.26; g.add(knot);
  if (poke && fill > 0.55) {                                                                                    // corners of what is inside
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: '#FFC857', roughness: 0.8 }));
    note.scale.setScalar(r); note.position.set(-r * 0.62, r * 1.02, r * 0.3); note.rotation.set(0.2, 0.3, 0.6); note.castShadow = true; g.add(note);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.3, 16), new THREE.MeshStandardMaterial({ color: '#FFF4E0', roughness: 0.8 }));
    roll.scale.setScalar(r); roll.position.set(r * 0.55, r * 1.05, -r * 0.1); roll.rotation.set(0.2, 0, -0.7); roll.castShadow = true; g.add(roll);
  }
  g.userData.r = r;
  return g;
}

// The same cloth lying open on the desk after unpacking (world units; lies on y = 0).
export function makeCloth(THREE, { r = 1.0, cloth = '#FF6B57', dot = '#FFF4E0' } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = cloth; x.fillRect(0, 0, 256, 256); x.fillStyle = dot;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i * 32 + (j % 2 ? 16 : 0) + 8, j * 32 + 16, 4.2, 0, 7); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4);
  const geo = new THREE.PlaneGeometry(2, 2, 24, 24).rotateX(-Math.PI / 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const X = p.getX(i), Z = p.getZ(i); const d = Math.max(Math.abs(X), Math.abs(Z)); p.setY(i, 0.015 + 0.035 * d * d * (1 + Math.sin(X * 7) * Math.cos(Z * 6))); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide })); m.scale.set(r, r, r * 0.8); m.receiveShadow = true; m.castShadow = true; m.name = 'cloth';
  return m;
}
