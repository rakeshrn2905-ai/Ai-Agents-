// 3D build story v2: why you need a shed, how the base really goes in, and why it keeps growing.
// ONE structure; every addition has a reason, is attached, and stays on screen to the end.
// Units are metres, y is up, lawn top is y = 0, the cut face of the ground is at z = +6.
export async function setup({ THREE, camera, ep }) {
  const caps = await (await fetch(`/${ep}/caps_raw.json`)).json();
  const T = caps.map((c) => c.start), duration = caps[caps.length - 1].end + 2.0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const ramp = (t, t0, d) => clamp((t - t0) / d);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const scene = new THREE.Scene();
  const tex = (w, h, draw, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const shadowy = (m) => { m.castShadow = m.receiveShadow = true; return m; };
  const box = (w, h, d, m, x = 0, y = 0, z = 0, parent = scene) => { const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); b.position.set(x, y, z); parent.add(b); return b; };
  const cyl = (r, h, m, x, y, z, parent = scene, seg = 16) => { const b = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m)); b.position.set(x, y, z); parent.add(b); return b; };
  const tube = (a, b, r, m, parent) => { const d = b.clone().sub(a), L = d.length(); const c = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), m));
    c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); parent.add(c); return c; };
  const rnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

  // ---------- sky, sun from the left (so next door's tree shades the shed), clouds ----------
  scene.background = tex(8, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3F9FE8'); g.addColorStop(1, '#A9D8F5'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#ffffff', '#9fbf7a', 1.15));
  const sun = new THREE.DirectionalLight('#fff3d2', 2.6); sun.position.set(-40, 45, -6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 }); scene.add(sun);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12), new THREE.MeshBasicMaterial({ color: '#FFE89A' })); sunDisc.position.set(-80, 90, -12); scene.add(sunDisc);
  for (const [x, y, z, s] of [[-30, 40, -70, 10], [25, 52, -90, 13], [55, 30, -50, 9], [10, 70, -80, 9], [60, 60, 30, 10]]) for (const [dx, k] of [[0, 1], [0.9, 0.7], [-0.9, 0.75]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(s * k, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); c.scale.y = 0.55; c.position.set(x + dx * s, y, z); scene.add(c); }

  // ---------- ground block, dug-out base area at the cut face ----------
  const soilM = mat('#ffffff', { map: tex(256, 256, (c, w, h) => { c.fillStyle = '#B4562A'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { c.fillStyle = ['#A44A22', '#C0612F', '#98421E'][i % 3]; c.beginPath(); c.arc(rnd(i) * w, rnd(i + 999) * h, 1.5 + (i % 4), 0, 7); c.fill(); } }, 10, 4) });
  const lawnM = mat('#ffffff', { map: tex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#62BE45' : '#74CE55'; c.fillRect(i * 32, 0, 32, h); } }, 7, 1) });
  const block = (x0, x1, y0, y1, z0, z1, top = lawnM) => box(x1 - x0, y1 - y0, z1 - z0, [soilM, soilM, top, soilM, soilM, soilM], (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const HX = 1.9, HZ0 = 2.9, HZ1 = 6, HD = 0.3;
  block(-16, 16, -8, -HD, -16, 6); block(-16, -HX, -HD, 0, -16, 6); block(HX, 16, -HD, 0, -16, 6); block(-HX, HX, -HD, 0, -16, HZ0);
  const plug = block(-HX, HX, -HD, 0, HZ0, HZ1);
  const pegG = new THREE.Group(); scene.add(pegG); const pegM = mat('#E9D9BE'), strM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const [x, z] of [[-HX, HZ0], [HX, HZ0], [-HX, HZ1 - 0.05], [HX, HZ1 - 0.05]]) cyl(0.04, 0.5, pegM, x, 0.2, z, pegG, 8);
  for (const [x, z, w, d] of [[0, HZ0, 2 * HX, 0.02], [0, HZ1 - 0.05, 2 * HX, 0.02], [-HX, (HZ0 + HZ1) / 2, 0.02, HZ1 - HZ0], [HX, (HZ0 + HZ1) / 2, 0.02, HZ1 - HZ0]]) { const sm = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), strM); sm.position.set(x, 0.3, z); pegG.add(sm); }

  // ---------- your house and garage, with the car filling the garage ----------
  const roofTile = mat('#E0633A');
  const gable = (w, d, h, m, x, y, z, parent = scene) => { const r = shadowy(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.05, h, 4), m)); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, d / w); r.position.set(x, y + h / 2, z); parent.add(r); return r; };
  box(5.5, 5, 6, mat('#EADBC2'), 12.6, 2.5, -7); gable(5.5, 6, 2.4, roofTile, 12.6, 5, -7);
  for (const wx of [11.3, 13.9]) for (const wy of [1.6, 3.7]) box(1.1, 1.0, 0.1, mat('#5AA8E0'), wx, wy, -3.98); box(1.0, 2.1, 0.1, mat('#7A4A2A'), 12.6, 1.05, -3.98);
  const GX = 7.3; box(0.25, 2.8, 6, mat('#D9CBB0'), GX - 2.2, 1.4, -7); box(0.25, 2.8, 6, mat('#D9CBB0'), GX + 2.2, 1.4, -7); box(4.65, 2.8, 0.25, mat('#D9CBB0'), GX, 1.4, -9.9);
  box(4.8, 0.3, 6.2, mat('#8E949A'), GX, 2.95, -7); box(4.4, 0.6, 0.15, mat('#C9CFD4'), GX, 2.5, -4.0);   // flat roof + door up
  const carG = new THREE.Group(); carG.position.set(GX, 0, -6.6); scene.add(carG);
  box(1.85, 0.75, 4.3, mat('#D9303A', { roughness: 0.35 }), 0, 0.62, 0, carG); box(1.6, 0.6, 2.2, mat('#D9303A', { roughness: 0.35 }), 0, 1.28, -0.2, carG);
  box(1.5, 0.48, 0.05, mat('#9FD8F0', { roughness: 0.2 }), 0, 1.3, 0.92, carG); for (const [x, z] of [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]]) { const w = cyl(0.33, 0.25, mat('#2A2622'), x, 0.33, z, carG); w.rotation.z = Math.PI / 2; }
  for (const x of [-0.6, 0.6]) box(0.3, 0.14, 0.05, mat('#FFF4C2'), x, 0.72, 2.16, carG);

  // ---------- next door: fence, house and their tall tree (the tree is there from frame 1) ----------
  for (let z = -15.5; z < 6; z += 1.0) { box(0.08, 1.2, 0.95, mat('#B9814A'), -4.6, 0.6, z + 0.5); }
  const nh = new THREE.Group(); nh.position.set(-11.5, 0, -9); scene.add(nh); box(6, 5, 5.5, mat('#D9E3EC'), 0, 2.5, 0, nh); gable(6, 5.5, 2.4, mat('#4E7FB8'), 0, 5, 0, nh);
  const TX = -7.2, TZ = 3.6; cyl(0.6, 15, mat('#7A4A2A'), TX, 7.5, TZ, scene, 10);
  for (const [dx, dy, dz, r] of [[0, 17.4, 0, 3.4], [1.9, 16.0, 0.8, 2.5], [-1.8, 16.2, -0.6, 2.6], [0.3, 19.3, 0.2, 2.3], [-0.6, 14.9, 1.4, 2.0]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat('#3E9A4A')); l.position.set(TX + dx, dy, TZ + dz); l.castShadow = true; scene.add(l); }
  for (const [x, z, s] of [[13, 3, 1], [-13, 0, 1.1], [14, -14, 0.9]]) { cyl(0.22 * s, 2 * s, mat('#7A4A2A'), x, s, z); const l = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 10, 8), mat('#4DAA56')); l.position.set(x, 2.8 * s, z); l.castShadow = true; scene.add(l); }

  // ---------- props ----------
  const greenM = mat('#2E9A4E', { roughness: 0.45 }), blackM = mat('#23262B'), steelM = mat('#C9CFD4', { metalness: 0.5, roughness: 0.35 });
  function makeMower() { const g = new THREE.Group();
    box(0.62, 0.16, 0.72, greenM, 0, 0.25, 0, g); box(0.66, 0.08, 0.76, mat('#257E40'), 0, 0.16, 0, g);           // deck + skirt
    cyl(0.17, 0.2, mat('#3B3F46'), 0, 0.43, -0.05, g); cyl(0.12, 0.06, blackM, 0, 0.56, -0.05, g); cyl(0.04, 0.1, mat('#E0A63A'), 0.12, 0.5, 0.1, g);   // engine
    box(0.5, 0.36, 0.4, mat('#4A5058', { roughness: 0.95 }), 0, 0.34, -0.55, g);                                      // grass bag
    for (const x of [-0.24, 0.24]) tube(V(x, 0.3, -0.36), V(x, 1.0, -0.95), 0.022, blackM, g); tube(V(-0.26, 1.0, -0.95), V(0.26, 1.0, -0.95), 0.025, blackM, g);
    for (const [x, z, r] of [[-0.33, 0.27, 0.1], [0.33, 0.27, 0.1], [-0.33, -0.27, 0.12], [0.33, -0.27, 0.12]]) { const w = cyl(r, 0.07, blackM, x, r, z, g); w.rotation.z = Math.PI / 2; const hb = cyl(r * 0.45, 0.08, steelM, x * 1.03, r, z, g); hb.rotation.z = Math.PI / 2; }
    return g; }
  function makeBike(col) { const g = new THREE.Group(), fm = mat(col, { roughness: 0.35 });
    const RH = V(-0.48, 0.34, 0), FH = V(0.5, 0.34, 0), BB = V(0, 0.28, 0), ST = V(-0.12, 0.8, 0), HT = V(0.36, 0.82, 0), HB = V(0.4, 0.66, 0);
    for (const c of [RH, FH]) { const w = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.032, 8, 28), blackM)); w.position.copy(c); g.add(w);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; tube(c, V(c.x + Math.cos(a) * 0.31, c.y + Math.sin(a) * 0.31, 0), 0.006, steelM, g); } cyl(0.04, 0.1, steelM, c.x, c.y, 0, g).rotation.x = Math.PI / 2; }
    tube(BB, ST, 0.028, fm, g); tube(ST, HT, 0.026, fm, g); tube(BB, HB, 0.03, fm, g); tube(BB, RH, 0.02, fm, g); tube(ST, RH, 0.018, fm, g); tube(HT, FH, 0.022, steelM, g);
    box(0.24, 0.05, 0.11, blackM, ST.x - 0.04, ST.y + 0.09, 0, g); tube(ST, V(ST.x - 0.03, ST.y + 0.07, 0), 0.016, steelM, g);
    tube(HT, V(HT.x + 0.04, HT.y + 0.12, 0), 0.018, steelM, g); tube(V(HT.x + 0.04, HT.y + 0.12, -0.24), V(HT.x + 0.04, HT.y + 0.12, 0.24), 0.018, blackM, g);
    const ring = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 18), steelM)); ring.position.copy(BB); g.add(ring);
    return g; }
  function makeToolbox() { const g = new THREE.Group(); box(0.5, 0.28, 0.25, mat('#D9303A', { roughness: 0.4 }), 0, 0.14, 0, g); tube(V(-0.15, 0.28, 0), V(-0.15, 0.36, 0), 0.015, blackM, g); tube(V(0.15, 0.28, 0), V(0.15, 0.36, 0), 0.015, blackM, g); tube(V(-0.15, 0.36, 0), V(0.15, 0.36, 0), 0.02, blackM, g); return g; }
  function makeRake() { const g = new THREE.Group(); tube(V(0, 0, 0), V(0, 1.5, 0), 0.02, mat('#B9814A'), g); box(0.4, 0.04, 0.04, steelM, 0, 0.02, 0, g); for (let i = 0; i < 8; i++) tube(V(-0.18 + i * 0.05, 0.02, 0), V(-0.18 + i * 0.05, -0.08, 0.03), 0.006, steelM, g); return g; }
  const giftBox = (w, col, x, y, z, parent) => { box(w, w * 0.8, w, mat(col), x, y + w * 0.4, z, parent); box(w + 0.01, w * 0.8 + 0.01, 0.06, mat('#E0A63A'), x, y + w * 0.4, z, parent); box(0.06, w * 0.8 + 0.01, w + 0.01, mat('#E0A63A'), x, y + w * 0.4, z, parent); };
  const chair = (x, z, parent, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); box(0.5, 0.05, 0.5, mat(col), 0, 0.45, 0, g); box(0.5, 0.55, 0.05, mat(col), 0, 0.72, -0.24, g); for (const [a, b] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) tube(V(a, 0, b), V(a, 0.45, b), 0.02, steelM, g); return g; };

  // the pile of garden stuff next to the garage, plus the screwdriver in the grass
  const PILE = V(6.6, 0, -2.0);
  const mower = makeMower(); scene.add(mower);
  const bikes = [makeBike('#E0453A'), makeBike('#2D6FCC')]; bikes.forEach((b) => scene.add(b));
  const toolbox = makeToolbox(); scene.add(toolbox); const rake = makeRake(); scene.add(rake);
  const sd = new THREE.Group(); sd.position.set(-3.1, 0.05, 5.2); sd.rotation.y = 0.6; scene.add(sd);
  box(0.36, 0.09, 0.09, mat('#E0453A'), 0, 0, 0, sd); box(0.34, 0.03, 0.03, steelM, 0.34, 0, 0, sd);

  // ---------- the base layers ----------
  const hardM = mat('#ffffff', { map: tex(128, 128, (c, w, h) => { c.fillStyle = '#8E949A'; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = ['#6E747A', '#A9AFB5', '#7C8288'][i % 3]; c.fillRect(rnd(i) * w, rnd(i + 7) * h, 4 + (i % 4), 3 + (i % 3)); } }, 2, 2) });
  const hardcore = box(2 * HX, 0.18, HZ1 - HZ0, hardM, 0, -HD + 0.09, (HZ0 + HZ1) / 2);
  const tamper = new THREE.Group(); scene.add(tamper); box(0.7, 0.12, 0.5, mat('#E0A63A'), 0, 0.06, 0, tamper); box(0.35, 0.35, 0.3, mat('#3B3F46'), 0, 0.3, 0, tamper); tube(V(0, 0.4, -0.1), V(0, 1.1, -0.7), 0.025, blackM, tamper);
  const sand = box(2 * HX, 0.06, HZ1 - HZ0, mat('#E8CF8A'), 0, -HD + 0.21, (HZ0 + HZ1) / 2);
  const slabs = []; const SX = 4, SZ = 3, sw = 2 * HX / SX, sdp = (HZ1 - HZ0) / SZ;
  for (let i = 0; i < SX; i++) for (let k = 0; k < SZ; k++) slabs.push(box(sw - 0.04, 0.08, sdp - 0.04, mat((i + k) % 2 ? '#C9C4BC' : '#D6D1C8'), -HX + sw * (i + 0.5), 0.02, HZ0 + sdp * (k + 0.5)));
  const level = new THREE.Group(); scene.add(level); box(1.2, 0.06, 0.06, mat('#E0A63A'), 0, 0, 0, level); box(0.14, 0.04, 0.05, mat('#7FE0A0', { emissive: '#2A8A4A' }), 0, 0.02, 0.01, level);
  const SLAB_TOP = 0.06;
  const W = 3.0, D = 2.5, CX = 0, CZ = (HZ0 + HZ1) / 2;
  const bearers = []; for (const dx of [-1.25, 0, 1.25]) bearers.push(box(0.12, 0.12, D, mat('#9B6B3E'), CX + dx, SLAB_TOP + 0.06, CZ));
  const FLOOR = SLAB_TOP + 0.12, floorDeck = box(W, 0.06, D, mat('#C9965E'), CX, FLOOR + 0.03, CZ);
  const airM = new THREE.MeshBasicMaterial({ color: '#BFE6F5', transparent: true, opacity: 0.95 });
  const airs = []; for (let i = 0; i < 10; i++) { const a = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), airM); a.rotation.z = -Math.PI / 2; scene.add(a); airs.push(a); }

  // ---------- the shed: floors with a see-through front wall when we look inside ----------
  const FH = 2.4, BASE = FLOOR + 0.06, NF = 6;
  const woodTex = tex(128, 128, (c, w, h) => { c.fillStyle = '#B9814A'; c.fillRect(0, 0, w, h); c.fillStyle = '#9A6838'; for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 2, h); });
  const wallM = mat('#ffffff', { map: woodTex }), trimM = mat('#F4EDE0'), winM = mat('#7FC8F0', { roughness: 0.3 }), doorM = mat('#3E7A4A');
  const floors = [];
  for (let f = 0; f < NF; f++) { const g = new THREE.Group(); g.position.set(CX, BASE + f * FH, CZ); scene.add(g);
    const front = mat('#ffffff', { map: woodTex, transparent: true }), fronts = new THREE.Group(); g.add(fronts);
    box(W, FH, 0.08, front, 0, FH / 2, D / 2 - 0.04, g); box(W, FH, 0.08, wallM, 0, FH / 2, -D / 2 + 0.04, g); box(0.08, FH, D, wallM, -W / 2 + 0.04, FH / 2, 0, g); box(0.08, FH, D, wallM, W / 2 - 0.04, FH / 2, 0, g);
    box(W, 0.06, D, mat('#C9965E'), 0, 0.03, 0, g); box(W + 0.06, 0.1, D + 0.06, trimM, 0, FH - 0.05, 0, g);
    if (f === 0) { box(0.9, 1.9, 0.06, doorM, -0.6, 0.95, D / 2 + 0.02, fronts); box(0.8, 0.6, 0.05, winM, 0.75, 1.45, D / 2 + 0.02, fronts); }
    else { box(0.8, 0.7, 0.05, winM, -0.65, 1.35, D / 2 + 0.02, fronts); box(0.8, 0.7, 0.05, winM, 0.65, 1.35, D / 2 + 0.02, fronts); }
    floors.push({ g, front, fronts, items: new THREE.Group() }); g.add(floors[f].items); }
  // contents of each floor (inside, visible when the front goes see-through)
  const shelf = (x, parent) => { box(0.9, 0.05, 0.35, mat('#9B6B3E'), x, 1.2, -0.95, parent); box(0.9, 0.05, 0.35, mat('#9B6B3E'), x, 0.6, -0.95, parent); };
  shelf(0.7, floors[0].items); cyl(0.12, 0.25, mat('#2D6FCC'), 0.5, 1.35, -0.95, floors[0].items); cyl(0.09, 0.2, mat('#E0A63A'), 0.9, 1.33, -0.95, floors[0].items);
  // floor 1: bikes hang on the back wall
  const bikeHooks = [V(-0.75, 1.2, -0.95), V(0.75, 1.2, -0.95)];
  // floor 2: Christmas decorations
  const xmas = new THREE.Group(); floors[2].items.add(xmas);
  giftBox(0.6, '#D9303A', -0.9, 0.06, -0.6, xmas); giftBox(0.5, '#2E9A4E', -0.2, 0.06, -0.7, xmas); giftBox(0.45, '#D9303A', 0.5, 0.06, -0.65, xmas); giftBox(0.5, '#2E9A4E', 1.0, 0.06, -0.5, xmas); giftBox(0.4, '#D9303A', -0.85, 0.54, -0.6, xmas);
  const ctree = shadowy(new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 10), mat('#2E7D3E'))); ctree.position.set(0.3, 0.7, 0.3); xmas.add(ctree);
  // floor 3: camping gear and the paddling pool
  const camp = new THREE.Group(); floors[3].items.add(camp);
  const tent = cyl(0.25, 1.1, mat('#3E9A4A'), -0.8, 0.31, -0.6, camp); tent.rotation.z = Math.PI / 2;
  const pool = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.2, 12, 28), mat('#5CC1EC', { roughness: 0.4 }))); pool.rotation.x = Math.PI / 2; pool.rotation.y = 0.15; pool.position.set(0.45, 0.85, -0.65); pool.rotation.x = 0.2; camp.add(pool);
  box(0.6, 0.5, 0.4, mat('#E0A63A'), -0.8, 0.31, 0.3, camp);
  // floors 4-5: they fill up too
  const fill4 = new THREE.Group(); floors[4].items.add(fill4); chair(-0.8, -0.5, fill4, '#E0453A'); chair(-0.2, -0.5, fill4, '#2D6FCC'); box(0.7, 0.6, 0.5, mat('#C9A46A'), 0.8, 0.36, -0.6, fill4); box(0.5, 0.4, 0.5, mat('#C9A46A'), 0.8, 0.86, -0.6, fill4);
  const fill5 = new THREE.Group(); floors[5].items.add(fill5); box(0.6, 0.5, 0.5, mat('#C9A46A'), -0.9, 0.31, -0.6, fill5); box(0.6, 0.5, 0.5, mat('#D6B47A'), -0.25, 0.31, -0.6, fill5); giftBox(0.45, '#7A5BC8', 0.5, 0.06, -0.6, fill5); cyl(0.2, 0.9, mat('#E0A63A'), 1.05, 0.51, -0.7, fill5);
  // stairs zig-zag through every floor (seen through the fronts)
  const stairsG = new THREE.Group(); stairsG.position.set(CX, BASE, CZ); scene.add(stairsG);
  for (let f = 0; f < 4; f++) for (let s = 0; s < 10; s++) box(0.6, 0.06, 0.26, mat('#8F5F33'), 1.1, f * FH + 0.12 + s * 0.24, (f % 2 ? 0.95 : -0.95) * (1 - s / 9 * 2) * 0.55 + (f % 2 ? 0 : 0), stairsG);
  const carry = makeToolbox(); carry.scale.setScalar(1.3); scene.add(carry);
  // roof with solar panels on top of the highest floor
  const roofG = new THREE.Group(); scene.add(roofG);
  const pitch = 0.42, slopeL = (D / 2 + 0.25) / Math.cos(pitch), roofM = mat('#5A606A');
  for (const s of [-1, 1]) { const r = box(W + 0.4, 0.08, slopeL, roofM, 0, Math.sin(pitch) * slopeL / 2, s * (D / 2 + 0.25) / 2, roofG); r.rotation.x = s * pitch; }
  const panelM = mat('#2D4FA8', { roughness: 0.25, metalness: 0.3 }), panels = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const p = box(0.85, 0.04, slopeL - 0.35, panelM, -0.95 + i * 0.95, Math.sin(pitch) * slopeL / 2 + 0.07, s * (D / 2 + 0.25) / 2, roofG); p.rotation.x = s * pitch; panels.push(p); }

  // the tree's shadow on the roof (made explicit so it reads on a phone): a dark leafy patch that sits on the panels
  const shadeTex = tex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(10,30,15,1)';
    for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(40 + rnd(i) * 176, 40 + rnd(i + 50) * 176, 26 + rnd(i + 90) * 30, 0, 7); c.fill(); } });
  const shadeM = new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, opacity: 0, depthWrite: false });
  const shadePatch = new THREE.Mesh(new THREE.PlaneGeometry(W + 1.2, D + 1.4), shadeM); shadePatch.rotation.x = -Math.PI / 2; shadePatch.position.y = Math.sin(pitch) * slopeL + 0.18; roofG.add(shadePatch);
  // ---------- extension on the right for the mower ----------
  const EXW = 1.6, extG = new THREE.Group(); extG.position.set(CX + W / 2 + EXW / 2, BASE, CZ); scene.add(extG);
  box(EXW, 2.0, D, wallM, 0, 1.0, 0, extG); const exr = box(EXW + 0.2, 0.08, D + 0.3, roofM, 0, 2.1, 0, extG); exr.rotation.z = -0.12;
  const exDoor = box(1.1, 1.6, 0.06, doorM, 0, 0.8, D / 2 + 0.03, extG);

  // ---------- lift on the outside (left side), lamp shows power ----------
  const LX = CX - W / 2 - 0.62, liftG = new THREE.Group(); liftG.position.set(LX, BASE, CZ); scene.add(liftG);
  const shaftM = mat('#C9CFD4', { metalness: 0.4, roughness: 0.4 }), posts = [];
  for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) posts.push(box(0.08, 1, 0.08, shaftM, dx, 0.5, dz, liftG));
  const carL = new THREE.Group(); liftG.add(carL); box(0.9, 1.9, 0.9, mat('#E0A63A'), 0, 0.95, 0, carL); box(0.5, 1.2, 0.04, winM, 0, 1.1, 0.47, carL);
  const lampM = new THREE.MeshBasicMaterial({ color: '#35D07F' }); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), lampM); lamp.position.set(0, 2.05, 0.4); carL.add(lamp);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1, 1.05), new THREE.MeshStandardMaterial({ color: '#BFE6F5', transparent: true, opacity: 0.16, depthWrite: false })); liftG.add(glass);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), blackM); liftG.add(cable);

  // ---------- floors over time: shed, room on top, Christmas, camping, then +2 to clear the tree ----------
  const floorsAt = (t) => ease(ramp(t, T[5] + 0.2, 1.0)) + ease(ramp(t, T[7] + 1.4, 1.0)) + ease(ramp(t, T[8] + 1.3, 1.0)) + ease(ramp(t, T[9] + 1.6, 1.0)) + 2 * ease(ramp(t, T[13] + 1.4, 2.6));
  const powerOn = (t) => (t > T[11] + 2.6 && t < T[12] + 3.4) || t > T[13] + 4.2;

  // ---------- camera: one continuous, slow flight through keyframes ----------
  const K = [
    [0, [5.0, 2.0, 4.2], [7.2, 1.0, -5.0]], [T[1] + 0.8, [8.6, 2.8, 4.8], [6.8, 0.5, -1.6]],
    [T[2] + 0.4, [3.6, 4.6, 11.5], [0.2, 0.0, 4.2]], [T[2] + 3.4, [2.6, 3.0, 9.4], [0, -0.1, 4.4]],
    [T[3] + 3.0, [2.2, 2.2, 8.4], [0, -0.1, 4.4]], [T[4] + 3.4, [3.4, 1.5, 8.2], [0, 0.1, 4.3]],
    [T[5] + 1.8, [5.4, 3.0, 11.0], [0.3, 1.2, 4.4]], [T[6] + 3.6, [7.8, 2.8, 10.8], [1.6, 0.9, 4.4]],
    [T[7] + 2.6, [5.6, 4.8, 12.8], [0.4, 2.6, 4.4]], [T[8] + 2.6, [4.6, 6.6, 14.6], [0.2, 4.2, 4.4]],
    [T[9] + 2.8, [3.6, 8.2, 16.6], [0.1, 5.6, 4.4]], [T[10] + 3.0, [2.4, 6.4, 15.2], [0.2, 4.6, 4.4]],
    [T[10] + 5.4, [-8.5, 8.6, 17.0], [-1.2, 5.6, 4.4]], [T[11] + 2.8, [-4.0, 15.0, 13.0], [-0.2, 9.6, 4.2]],
    [T[12] + 2.6, [-9.5, 15.5, 15.5], [-2.6, 11.4, 3.8]], [T[12] + 5.2, [-7.5, 16.5, 15.0], [-1.2, 10.8, 4.2]],
    [T[13] + 4.4, [-10.0, 19.5, 20.0], [-1.0, 13.4, 4.2]], [T[14] + 2.2, [5.0, 14.0, 19.0], [0.0, 12.2, 4.4]],
    [T[15] + 3.0, [17.0, 15.0, 33.0], [2.5, 7.5, -0.5]], [T[15] + 4.2, [14.0, 9.0, 24.0], [-1.0, 3.0, 3.5]],
    [duration, [-1.9, 1.0, 7.1], [-3.1, 0.05, 5.2]],
  ];
  const posC = new THREE.CatmullRomCurve3(K.map((k) => V(...k[1])), false, 'centripetal'), lookC = new THREE.CatmullRomCurve3(K.map((k) => V(...k[2])), false, 'centripetal');
  const camAt = (t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const f = ease((t - K[i][0]) / (K[i + 1][0] - K[i][0])), u = (i + f) / (K.length - 1);
    camera.position.copy(posC.getPoint(u)); camera.lookAt(lookC.getPoint(u)); };

  // ---------- one word at a time ----------
  const words = [];
  for (const c of caps) { const ws = c.text.split(/\s+/), wsum = ws.reduce((a, w) => a + w.length + 2, 0); let t = c.start;
    for (const w of ws) { const d = (c.end - c.start) * (w.length + 2) / wsum; words.push({ t0: t, t1: t + d, w: w.replace(/[.,?]$/g, '') }); t += d; } }
  const wordAt = (t) => { for (const w of words) if (t >= w.t0 && t < w.t1 + 0.06) return w.w; return ''; };
  const dropIn = (m, y, p) => { m.visible = p > 1e-6; m.position.y = y + (1 - back(p)) * 2.0; };
  const path = (pts, p) => { const n = pts.length - 1, s = clamp(p) * n, i = Math.min(n - 1, Math.floor(s)), f = ease(s - i); return pts[i].clone().lerp(pts[i + 1], f); };

  function frame(t) {
    const n = floorsAt(t), top = BASE + n * FH;
    // pegs and string go in, then the turf lifts out
    pegG.visible = t > T[2] + 1.2; pegG.scale.y = pegG.visible ? back(ramp(t, T[2] + 1.2, 0.5)) : 0.001;
    const dig = ramp(t, T[2] + 2.4, 1.4); plug.visible = dig < 1; plug.position.set(dig * dig * 6, -HD / 2 + Math.sin(dig * Math.PI) * 0.7, (HZ0 + HZ1) / 2); plug.rotation.z = -dig * 0.5;
    // hardcore poured, a tamper packs it down, sand, slabs, a spirit level checks them
    const hc = ramp(t, T[3] + 0.3, 0.6); hardcore.visible = hc > 0; hardcore.scale.y = Math.max(0.001, hc < 1 ? hc * 1.6 : lerp(1.6, 1, ease(ramp(t, T[3] + 1.2, 1.2)))); hardcore.position.y = -HD + 0.09 * hardcore.scale.y;
    tamper.visible = t > T[3] + 1.0 && t < T[3] + 2.6; tamper.position.set(-1.2 + ramp(t, T[3] + 1.0, 1.6) * 2.4, -HD + 0.18 * hardcore.scale.y + Math.abs(Math.sin(t * 30)) * 0.05, (HZ0 + HZ1) / 2);
    const sp = ease(ramp(t, T[3] + 2.6, 0.6)); sand.visible = sp > 0; sand.scale.y = Math.max(0.001, sp);
    slabs.forEach((s, i) => dropIn(s, 0.02, ramp(t, T[3] + 3.2 + i * 0.12, 0.35)));
    level.visible = t > T[3] + 4.7 && t < T[4] + 0.2; level.position.set(lerp(-1, 1, ramp(t, T[3] + 4.7, 1.0)), SLAB_TOP + 0.06, (HZ0 + HZ1) / 2);
    // bearers, air flowing under, floor deck
    bearers.forEach((b, i) => dropIn(b, SLAB_TOP + 0.06, ramp(t, T[4] + 0.3 + i * 0.35, 0.45)));
    const air = t > T[4] + 2.0 && t < T[5]; airs.forEach((a, i) => { a.visible = air; const ph = (t * 0.55 + i / 10) % 1; a.position.set(CX - 2 + ph * 4, SLAB_TOP + 0.06, CZ - 1.05 + (i % 5) * 0.52); });
    dropIn(floorDeck, FLOOR + 0.03, ramp(t, T[4] + 4.3, 0.5));
    // floors and roof
    floors.forEach((F, f) => { const p = clamp(n - f); F.g.visible = p > 0.001; F.g.scale.y = Math.max(0.001, p); });
    roofG.visible = t > T[5] + 1.0; roofG.position.set(CX, Math.max(top, BASE + 0.1), CZ); roofG.scale.setScalar(roofG.visible ? back(ramp(t, T[5] + 1.0, 0.6)) : 0.001);
    // see-through fronts: which floor are we looking into?
    const look = (f, t0, t1) => ramp(t, t0, 0.35) * (1 - ramp(t, t1, 0.35));
    const seeAll = look(0, T[10] + 0.2, T[10] + 3.6);
    const see = [look(0, T[5] + 1.4, T[6] + 0.6), look(1, T[7] + 2.0, T[8] + 0.6), look(2, T[8] + 1.8, T[9] + 0.6), look(3, T[9] + 2.1, T[10] + 0.1), look(4, T[14] + 0.3, T[15] + 0.6), look(5, T[14] + 0.3, T[15] + 0.6)];
    floors.forEach((F, f) => { const s = Math.max(see[f] || 0, f < 4 ? seeAll : 0); F.front.opacity = 1 - s * 0.85; F.front.depthWrite = s < 0.02; F.fronts.visible = s < 0.5; });
    // the pile: toolbox + rake go into the shed, mower rolls to the extension, bikes go up to floor 1
    const door = V(CX - 0.6, SLAB_TOP, CZ + D / 2 + 0.6);
    const tb = ramp(t, T[5] + 1.6, 1.3); toolbox.position.copy(path([V(PILE.x + 0.4, 0, PILE.z + 0.6), door, V(CX + 0.7, BASE + 0.62, CZ - 0.95)], tb));
    rake.position.copy(path([V(PILE.x + 1.0, 0, PILE.z - 0.2), door, V(CX - 1.2, BASE + 0.1, CZ - 0.95)], ramp(t, T[5] + 1.8, 1.3)));
    const mp = ramp(t, T[6] + 0.1, 1.3), bump = t > T[6] + 1.4 && t < T[6] + 2.0 ? Math.sin((t - T[6] - 1.4) * 24) * 0.06 * (1 - (t - T[6] - 1.4) / 0.6) : 0;
    const ex = back(ramp(t, T[6] + 2.2, 0.9)); extG.visible = t > T[6] + 2.2; extG.scale.set(Math.max(0.001, ex), 1, 1); extG.position.x = CX + W / 2 + EXW / 2 * ex;
    const park = ramp(t, T[6] + 3.1, 1.0); exDoor.visible = park < 0.35 || park >= 1;
    mower.position.copy(park > 0 ? path([V(CX + 0.4, SLAB_TOP, CZ + D / 2 + 0.75), V(CX + W / 2 + EXW / 2, SLAB_TOP, CZ + D / 2 + 0.75), V(CX + W / 2 + EXW / 2, BASE, CZ - 0.1)], park) : path([PILE.clone(), V(CX + 0.4, SLAB_TOP, CZ + D / 2 + 0.75)], mp));
    mower.position.x += bump; mower.rotation.y = park > 0.5 ? Math.PI : (mp < 1 ? -Math.PI / 2 - 0.4 : Math.PI);
    bikes.forEach((b, i) => { const p = ramp(t, T[7] + 0.2 + i * 0.3, 1.1), up = ramp(t, T[7] + 2.4 + i * 0.25, 1.0);
      const start = V(PILE.x - 1.2 - i * 0.2, 0, PILE.z + 0.9 + i * 0.5), atDoor = V(CX - 0.6 + i * 0.5, SLAB_TOP, CZ + D / 2 + 0.7), hook = bikeHooks[i].clone().add(V(CX, BASE + FH, CZ));
      b.position.copy(up > 0 ? path([atDoor, V(atDoor.x, BASE + FH, CZ + 0.2), hook], up) : path([start, atDoor], p));
      b.rotation.y = up > 0 ? 0 : (p > 0 && p < 1 ? 2.3 : (p >= 1 ? 0 : 1.1)); b.rotation.z = up > 0.6 ? lerp(0, 0, up) : 0; });
    // Christmas, camping: drop into their floors
    xmas.visible = t > T[8] + 1.8; xmas.position.y = (1 - back(ramp(t, T[8] + 1.8, 0.6))) * 1.2;
    camp.visible = t > T[9] + 2.1; camp.position.y = (1 - back(ramp(t, T[9] + 2.1, 0.6))) * 1.2;
    fill4.visible = fill5.visible = t > T[14] + 0.9; fill4.position.y = fill5.position.y = (1 - back(ramp(t, T[14] + 0.9, 0.6))) * 1.2;
    // stairs: a box makes the long climb up three flights
    stairsG.visible = seeAll > 0.05 || t < T[10]; stairsG.visible = seeAll > 0.05;
    const cp = ramp(t, T[10] + 0.5, 3.0); carry.visible = t > T[10] + 0.5 && t < T[10] + 3.6;
    const fl = Math.min(2.999, cp * 3), fi = Math.floor(fl), fr = fl - fi; carry.position.set(CX + 1.1, BASE + fi * FH + fr * FH + 0.15, CZ + (fi % 2 ? 0.95 : -0.95) * (1 - fr * 2) * 0.55);
    // the lift is bolted on; its shaft always reaches the roof
    const lp = ramp(t, T[10] + 3.8, 0.8); liftG.visible = t > T[10] + 3.8; liftG.position.x = LX - (1 - back(lp)) * 2.5;
    const shaftH = Math.max(2.2, top - BASE + 0.2); posts.forEach((p) => { p.scale.y = shaftH; p.position.y = shaftH / 2; }); glass.scale.y = shaftH; glass.position.y = shaftH / 2;
    const on = powerOn(t); lampM.color.set(on || t < T[11] ? '#35D07F' : '#E0453A');
    if (frame.carY === undefined) frame.carY = 0; if (frame.lastT === undefined || t < frame.lastT) { frame.carY = 0; frame.phase = 0; }
    const levels = Math.max(1, Math.floor(n + 0.01)); if (on) frame.phase = (frame.phase || 0) + (t - (frame.lastT ?? t)) * 0.28; frame.lastT = t;
    const cyc = frame.phase % 2, lv = cyc < 1 ? cyc : 2 - cyc; carL.position.y = ease(lv) * (levels - 1) * FH;
    cable.scale.y = Math.max(0.1, shaftH - carL.position.y - 1.9); cable.position.y = shaftH - cable.scale.y / 2;
    // solar panels drop onto the roof (the tree shades them by itself until the roof clears it)
    panels.forEach((p, i) => { const st = T[11] + 1.6 + i * 0.18; p.visible = t > st; p.scale.setScalar(p.visible ? back(ramp(t, st, 0.35)) : 0.001); });
    const shaded = ease(ramp(t, T[12] + 0.9, 1.4)) * (1 - ease(ramp(t, T[13] + 2.8, 1.2)));
    shadeM.opacity = shaded * 0.62; shadePatch.position.x = (1 - ease(ramp(t, T[12] + 0.9, 1.4))) * -2.5 + ease(ramp(t, T[13] + 2.8, 1.2)) * -1.0;
    panelM.color.set('#2D4FA8').lerp(new THREE.Color('#0E1424'), shaded); panelM.emissive.set(on && t > T[13] ? '#1E44B0' : '#000000');
    camAt(t);
    return { word: wordAt(t), wm: '@TimeSketch' };
  }
  return { scene, duration, frame };
}
