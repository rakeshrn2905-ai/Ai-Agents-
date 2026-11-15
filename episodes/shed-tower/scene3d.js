// 3D build story: the garden shed that keeps growing. ONE structure; every addition is attached and stays to the end.
// Units are metres, y is up, lawn top is y = 0, the cut face of the ground is at z = +6.
export async function setup({ THREE, camera, ep }) {
  const caps = await (await fetch(`/${ep}/caps_raw.json`)).json();
  const T = caps.map((c) => c.start), duration = caps[caps.length - 1].end + 2.0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const ramp = (t, t0, d) => clamp((t - t0) / d);

  const scene = new THREE.Scene();
  const tex = (w, h, draw, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
  const box = (w, h, d, m, x = 0, y = 0, z = 0, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const cyl = (r, h, m, x, y, z, parent = scene, seg = 14) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const rnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

  // ---------- sky, light, clouds ----------
  scene.background = tex(8, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3F9FE8'); g.addColorStop(1, '#A9D8F5'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#ffffff', '#9fbf7a', 1.2));
  const sun = new THREE.DirectionalLight('#fff3d2', 2.5); sun.position.set(-25, 60, 35); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 70, bottom: -20, near: 1, far: 250 }); scene.add(sun);
  for (const [x, y, z, s] of [[-40, 40, -70, 10], [20, 55, -90, 13], [50, 30, -60, 9], [-60, 62, -50, 11], [10, 75, -80, 9]]) for (const [dx, k] of [[0, 1], [0.9, 0.7], [-0.9, 0.75]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(s * k, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); c.scale.y = 0.55; c.position.set(x + dx * s, y, z); scene.add(c); }

  // ---------- ground block with a dug-out base area at the cut face ----------
  const soilM = mat('#ffffff', { map: tex(256, 256, (c, w, h) => { c.fillStyle = '#B4562A'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { c.fillStyle = ['#A44A22', '#C0612F', '#98421E'][i % 3]; c.beginPath(); c.arc(rnd(i) * w, rnd(i + 999) * h, 1.5 + (i % 4), 0, 7); c.fill(); } }, 10, 4) });
  const lawnM = mat('#ffffff', { map: tex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#62BE45' : '#74CE55'; c.fillRect(i * 32, 0, 32, h); } }, 7, 1) });
  const block = (x0, x1, y0, y1, z0, z1, top = lawnM) => box(x1 - x0, y1 - y0, z1 - z0, [soilM, soilM, top, soilM, soilM, soilM], (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const HX = 1.9, HZ0 = 2.9, HZ1 = 6, HD = 0.3;                 // the base area: x -1.9..1.9, z 2.9..6, dug 0.3 deep
  block(-16, 16, -8, -HD, -16, 6);
  block(-16, -HX, -HD, 0, -16, 6); block(HX, 16, -HD, 0, -16, 6); block(-HX, HX, -HD, 0, -16, HZ0);
  const plug = block(-HX, HX, -HD, 0, HZ0, HZ1);                 // turf that gets dug out
  // pegs and string marking out the base (there from frame 1)
  const pegM = mat('#E9D9BE'), strM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const [x, z] of [[-HX, HZ0], [HX, HZ0], [-HX, HZ1 - 0.05], [HX, HZ1 - 0.05]]) cyl(0.04, 0.5, pegM, x, 0.2, z, scene, 8);
  for (const [x, z, w, d] of [[0, HZ0, 2 * HX, 0.02], [0, HZ1 - 0.05, 2 * HX, 0.02], [-HX, (HZ0 + HZ1) / 2, 0.02, HZ1 - HZ0], [HX, (HZ0 + HZ1) / 2, 0.02, HZ1 - HZ0]]) { const sm = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), strM); sm.position.set(x, 0.3, z); scene.add(sm); }

  // the neighbour's house and their big tree (the tree is there from frame 1)
  const house = new THREE.Group(); house.position.set(9, 0, -9); scene.add(house);
  box(8, 5, 6, mat('#E9D9BE'), 0, 2.5, 0, house); const hr = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3, 4), mat('#E0633A')); hr.rotation.y = Math.PI / 4; hr.scale.set(1, 1, 0.78); hr.position.y = 6.5; hr.castShadow = true; house.add(hr);
  for (const wx of [-2.4, 2.4]) for (const wy of [1.6, 3.8]) box(1.3, 1.2, 0.1, mat('#5AA8E0'), wx, wy, 3.02, house);
  const TREE = [-6.5, 0, -2.5];
  cyl(0.55, 10, mat('#7A4A2A'), TREE[0], 5, TREE[2], scene, 10);
  for (const [dx, dy, dz, r] of [[0, 11, 0, 3.6], [1.8, 9.6, 0.6, 2.6], [-1.7, 9.8, -0.5, 2.7], [0.3, 13, 0.2, 2.6]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat('#3E9A4A')); l.position.set(TREE[0] + dx, dy, TREE[2] + dz); l.castShadow = true; scene.add(l); }
  for (const [x, z, s] of [[12, 3, 1], [-13, -12, 1.1], [13, -14, 0.9]]) { cyl(0.22 * s, 2 * s, mat('#7A4A2A'), x, s, z); const l = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 10, 8), mat('#4DAA56')); l.position.set(x, 2.8 * s, z); l.castShadow = true; scene.add(l); }
  // the screwdriver, lying in the grass the whole time
  const sd = new THREE.Group(); sd.position.set(-3.1, 0.05, 5.2); sd.rotation.y = 0.6; scene.add(sd);
  box(0.36, 0.09, 0.09, mat('#E0453A'), 0, 0, 0, sd); box(0.34, 0.03, 0.03, mat('#C9CFD4', { metalness: 0.6, roughness: 0.3 }), 0.34, 0, 0, sd);

  // ---------- the base layers ----------
  const hardM = mat('#ffffff', { map: tex(128, 128, (c, w, h) => { c.fillStyle = '#8E949A'; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = ['#6E747A', '#A9AFB5', '#7C8288'][i % 3]; c.fillRect(rnd(i) * w, rnd(i + 7) * h, 4 + (i % 4), 3 + (i % 3)); } }, 2, 2) });
  const hardcore = box(2 * HX, 0.18, HZ1 - HZ0, hardM, 0, -HD + 0.09, (HZ0 + HZ1) / 2);
  const sand = box(2 * HX, 0.06, HZ1 - HZ0, mat('#E8CF8A'), 0, -HD + 0.21, (HZ0 + HZ1) / 2);
  const slabs = []; const SX = 4, SZ = 3, sw = 2 * HX / SX, sdp = (HZ1 - HZ0) / SZ;
  for (let i = 0; i < SX; i++) for (let k = 0; k < SZ; k++) slabs.push(box(sw - 0.04, 0.08, sdp - 0.04, mat((i + k) % 2 ? '#C9C4BC' : '#D6D1C8'), -HX + sw * (i + 0.5), -0.02 + 0.04, HZ0 + sdp * (k + 0.5)));
  const SLAB_TOP = 0.06;
  // the shed footprint sits on the slabs
  const W = 3.0, D = 2.5, CX = 0, CZ = (HZ0 + HZ1) / 2;          // shed 3.0 x 2.5
  const bearers = []; for (const dx of [-1.25, 0, 1.25]) bearers.push(box(0.12, 0.12, D, mat('#9B6B3E'), CX + dx, SLAB_TOP + 0.06, CZ));
  const FLOOR = SLAB_TOP + 0.12, floorDeck = box(W, 0.06, D, mat('#C9965E'), CX, FLOOR + 0.03, CZ);
  const airM = new THREE.MeshBasicMaterial({ color: '#BFE6F5', transparent: true, opacity: 0.9 });
  const airs = []; for (let i = 0; i < 8; i++) { const a = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), airM); a.rotation.z = -Math.PI / 2; scene.add(a); airs.push(a); }

  // ---------- the shed: floors stack, roof + panels always on top ----------
  const FH = 2.4, BASE = FLOOR + 0.06;
  const woodTex = tex(128, 128, (c, w, h) => { c.fillStyle = '#B9814A'; c.fillRect(0, 0, w, h); c.fillStyle = '#9A6838'; for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 2, h); });
  const wallM = mat('#ffffff', { map: woodTex }), trimM = mat('#F4EDE0'), winM = mat('#7FC8F0', { roughness: 0.3 }), doorM = mat('#3E7A4A');
  const MAXF = 26, floors = [];
  for (let f = 0; f < MAXF; f++) { const g = new THREE.Group(); g.position.set(CX, BASE + f * FH, CZ); scene.add(g);
    box(W, FH, D, wallM, 0, FH / 2, 0, g); box(W + 0.06, 0.1, D + 0.06, trimM, 0, FH - 0.05, 0, g);
    if (f === 0) { box(0.9, 1.9, 0.06, doorM, -0.6, 0.95, D / 2 + 0.02, g); box(0.07, 0.07, 0.04, mat('#E0A63A'), -0.25, 1.0, D / 2 + 0.06, g); box(0.8, 0.6, 0.05, winM, 0.75, 1.4, D / 2 + 0.02, g); }
    else { box(0.8, 0.7, 0.05, winM, -0.65, 1.3, D / 2 + 0.02, g); box(0.8, 0.7, 0.05, winM, 0.65, 1.3, D / 2 + 0.02, g); }
    floors.push(g); }
  // stairs (seen through the open side while the walls go see-through)
  const stairsG = new THREE.Group(); stairsG.position.set(CX, BASE, CZ); scene.add(stairsG);
  for (let s = 0; s < 10; s++) box(0.9, 0.24, 0.32, mat('#8F5F33'), 0.9, 0.12 + s * 0.24, -1.0 + s * 0.22, stairsG);
  // roof (pitched) with solar panels; sits on top of the highest floor
  const roofG = new THREE.Group(); scene.add(roofG);
  const pitch = 0.42, slopeL = (D / 2 + 0.25) / Math.cos(pitch);
  const roofM = mat('#5A606A');
  for (const s of [-1, 1]) { const r = box(W + 0.4, 0.08, slopeL, roofM, 0, Math.sin(pitch) * slopeL / 2, s * (D / 2 + 0.25) / 2, roofG); r.rotation.x = s * pitch; }
  box(W, Math.tan(pitch) * D / 2, 0.06, mat('#B9814A'), 0, Math.tan(pitch) * D / 4, D / 2 - 0.03, roofG).scale.set(1, 1, 1);
  const panelM = mat('#2D4FA8', { roughness: 0.25, metalness: 0.3 }), panels = [];
  for (let i = 0; i < 3; i++) { const p = box(0.85, 0.04, slopeL - 0.3, panelM, -0.95 + i * 0.95, Math.sin(pitch) * slopeL / 2 + 0.07, (D / 2 + 0.25) / 2, roofG); p.rotation.x = pitch; panels.push(p); }
  // panel wings that grow out from the top ("more panels need more roof")
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); roofG.add(w); w.position.set(s * (W / 2 + 0.1), 0.05, 0);
    box(0.1, 0.1, 0.1, mat('#8E9AA6'), 0, 0, 0, w); for (let i = 0; i < 4; i++) box(0.9, 0.05, 1.9, panelM, s * (0.55 + i * 0.95), 0.05, 0, w); wings.push({ w, s }); }

  // ---------- extension (+x side), lawnmower, bikes ----------
  const EXW = 1.8, extG = new THREE.Group(); extG.position.set(CX + W / 2 + EXW / 2, BASE, CZ); scene.add(extG);
  box(EXW, 2.0, D, wallM, 0, 1.0, 0, extG); const exr = box(EXW + 0.2, 0.08, D + 0.3, roofM, 0, 2.12, 0, extG); exr.rotation.z = 0.12;
  box(1.2, 1.6, 0.06, doorM, 0, 0.8, D / 2 + 0.02, extG);
  const mower = new THREE.Group(); scene.add(mower);
  box(0.6, 0.28, 0.75, mat('#35B56A'), 0, 0.26, 0, mower); for (const [x, z] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) { const w = cyl(0.1, 0.07, mat('#2A2622'), x, 0.1, z, mower, 12); w.rotation.z = Math.PI / 2; }
  const hd = box(0.05, 0.05, 0.9, mat('#2A2622'), -0.22, 0.65, 0.65, mower); hd.rotation.x = 0.9; const hd2 = box(0.05, 0.05, 0.9, mat('#2A2622'), 0.22, 0.65, 0.65, mower); hd2.rotation.x = 0.9; box(0.5, 0.05, 0.05, mat('#2A2622'), 0, 0.98, 0.98, mower);
  const bike = (x, col) => { const g = new THREE.Group(); g.position.set(x, 0, CZ + D / 2 + 0.55); scene.add(g);
    for (const dx of [-0.42, 0.42]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), mat('#2A2622')); r.position.set(dx, 0.32, 0); r.castShadow = true; g.add(r); }
    const f = box(0.85, 0.06, 0.06, mat(col), 0, 0.55, 0, g); f.rotation.z = 0.1; box(0.06, 0.4, 0.06, mat(col), 0.2, 0.62, 0, g); box(0.25, 0.06, 0.12, mat('#2A2622'), -0.1, 0.8, 0, g); box(0.06, 0.06, 0.5, mat('#2A2622'), 0.38, 0.9, 0, g); return g; };
  const bikes = [bike(-1.1, '#E0453A'), bike(-0.25, '#2D6FCC')];

  // ---------- lift on the outside (-x side): shaft grows with the building ----------
  const LX = CX - W / 2 - 0.6, liftG = new THREE.Group(); liftG.position.set(LX, BASE, CZ); scene.add(liftG);
  const shaftM = mat('#C9CFD4', { metalness: 0.4, roughness: 0.4 }), posts = [];
  for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { const p = box(0.08, 1, 0.08, shaftM, dx, 0.5, dz, liftG); posts.push(p); }
  const car = box(0.9, 1.9, 0.9, mat('#E0A63A'), 0, 0.95, 0, liftG); box(0.5, 1.2, 0.04, winM, 0, 1.1, 0.47, car.parent === liftG ? car : liftG);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1, 1.05), new THREE.MeshStandardMaterial({ color: '#BFE6F5', transparent: true, opacity: 0.18, depthWrite: false })); liftG.add(glass);

  // ---------- timeline of the building ----------
  // number of floors (continuous) - 1 shed; 2 for the bikes; 6 to clear the tree; 12; then 24
  const floorsAt = (t) => { let n = 0;
    n += ease(ramp(t, T[3] + 0.2, 1.2));                      // the shed itself
    n += ease(ramp(t, T[5] + 1.2, 0.8));                      // second floor
    n += 4 * ease(ramp(t, T[8] + 1.6, 1.8));                  // above the tree
    n += 6 * ease(ramp(t, T[9] + 0.3, 4.6));                  // longer lift, more panels...
    n += 12 * ease(ramp(t, T[10] - 0.2, 2.6));                // so you keep going
    return n; };

  // ---------- camera: one continuous flight (orbit params interpolated) ----------
  // [t, azimuth (deg, 0 = in front), distance, height, lookY]
  const K = [
    [0, 20, 9.5, 4.2, -0.2], [T[1] + 2.5, 14, 6.6, 2.2, 0.0], [T[2] + 2.5, 24, 5.6, 1.2, 0.2],
    [T[3] + 1.6, 30, 9.5, 3.4, 1.4], [T[4] + 2.0, 40, 11, 3.6, 1.4], [T[5] + 2.2, 28, 12.5, 5.2, 2.6],
    [T[6] + 2.8, -35, 13, 6.0, 3.0], [T[7] + 2.6, -10, 13, 9.5, 4.2], [T[8] + 2.0, -42, 21, 11, 7.5],
    [T[9] + 4.0, -20, 40, 22, 18], [T[10] + 0.8, 10, 52, 30, 26], [T[11] + 2.2, 30, 78, 38, 30], [duration, 45, 92, 42, 32],
  ];
  const vals = (t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], f = ease((t - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((v, j) => lerp(v, b[j + 1], f)); };
  const camAt = (t) => { const [az, dist, h, ly] = vals(t), r = az * Math.PI / 180;
    camera.position.set(CX + Math.sin(r) * dist, h, CZ + Math.cos(r) * dist); camera.lookAt(CX, ly, CZ - 0.4); };

  // ---------- one word at a time ----------
  const words = [];
  for (const c of caps) { const ws = c.text.split(/\s+/), wsum = ws.reduce((a, w) => a + w.length + 2, 0); let t = c.start;
    for (const w of ws) { const d = (c.end - c.start) * (w.length + 2) / wsum; words.push({ t0: t, t1: t + d, w: w.replace(/[.,?]$/g, '') }); t += d; } }
  const wordAt = (t) => { for (const w of words) if (t >= w.t0 && t < w.t1 + 0.06) return w.w; return ''; };
  const dropIn = (m, y, p) => { m.visible = p > 1e-6; m.position.y = y + (1 - back(p)) * 2.5; };

  function frame(t) {
    // 0: dig out the turf
    const dig = ramp(t, 0, 1.9); plug.visible = dig < 1; plug.position.set(dig * dig * 6, -HD / 2 + Math.sin(dig * Math.PI) * 0.7, (HZ0 + HZ1) / 2); plug.rotation.z = -dig * 0.5;
    // 1: hardcore packed down, sand, slabs one by one
    const hc = ramp(t, T[1] + 0.3, 0.6); hardcore.visible = hc > 0; hardcore.scale.y = Math.max(0.001, hc < 1 ? hc * 1.6 : lerp(1.6, 1, ease(ramp(t, T[1] + 1.0, 0.6)))); hardcore.position.y = -HD + 0.09 * hardcore.scale.y;
    const sp = ease(ramp(t, T[1] + 2.1, 0.6)); sand.visible = sp > 0; sand.scale.y = Math.max(0.001, sp);
    slabs.forEach((s, i) => dropIn(s, 0.02, ramp(t, T[1] + 3.0 + i * 0.18, 0.35)));
    // 2: bearers, air flowing under, floor deck
    bearers.forEach((b, i) => dropIn(b, SLAB_TOP + 0.06, ramp(t, T[2] + 0.2 + i * 0.25, 0.4)));
    const air = t > T[2] + 1.6 && t < T[3]; airs.forEach((a, i) => { a.visible = air; const ph = (t * 0.7 + i / 8) % 1; a.position.set(CX - 2 + ph * 4, SLAB_TOP + 0.06, CZ - 1 + (i % 4) * 0.62); });
    dropIn(floorDeck, FLOOR + 0.03, ramp(t, T[2] + 3.0, 0.5));
    // floors + roof
    const n = floorsAt(t), top = BASE + n * FH;
    floors.forEach((g, f) => { const p = clamp(n - f); g.visible = p > 0.001; g.scale.y = Math.max(0.001, p); });
    roofG.visible = t > T[3] + 1.0; roofG.position.set(CX, Math.max(top, BASE + 0.1), CZ); roofG.scale.setScalar(roofG.visible ? back(ramp(t, T[3] + 1.0, 0.6)) : 0.001);
    // 4: mower rolls up, bumps the door, extension grows, mower parks inside the doorway
    const mp = ease(ramp(t, T[4] - 0.2, 1.2)), bump = t > T[4] + 1.0 && t < T[4] + 1.5 ? Math.sin((t - T[4] - 1.0) * 25) * 0.08 * (1 - (t - T[4] - 1.0) * 2) : 0;
    const ex = back(ramp(t, T[4] + 1.6, 0.8)); extG.visible = t > T[4] + 1.6; extG.scale.set(Math.max(0.001, ex), 1, 1); extG.position.x = CX + W / 2 + EXW / 2 * ex;
    const park = ease(ramp(t, T[4] + 2.4, 0.7));
    mower.visible = t > T[4] - 0.2; mower.position.set(lerp(lerp(5, 1.0, mp), CX + W / 2 + EXW / 2, park) + bump, SLAB_TOP, lerp(CZ + D / 2 + 0.7, CZ + D / 2 + 0.35, park)); mower.rotation.y = Math.PI;
    // 5: bikes arrive
    bikes.forEach((b, i) => { const p = ease(ramp(t, T[5] + 0.1 + i * 0.3, 0.7)); b.visible = p > 0; b.position.x = lerp(-6, i ? -0.25 : -1.1, p); });
    // 6: stairs fill the ground floor (walls go see-through to show them), then the lift is bolted on
    const see = ramp(t, T[6] + 0.1, 0.3) * (1 - ramp(t, T[6] + 2.3, 0.4));
    wallM.transparent = see > 0.01; wallM.opacity = 1 - see * 0.65; wallM.depthWrite = see < 0.01;
    stairsG.visible = t > T[6] + 0.1; stairsG.children.forEach((s, i) => { s.scale.y = Math.max(0.001, back(ramp(t, T[6] + 0.3 + i * 0.07, 0.3))); });
    const lp = ramp(t, T[6] + 2.2, 0.6); liftG.visible = t > T[6] + 2.2; liftG.position.x = LX - (1 - back(lp)) * 2;
    const shaftH = Math.max(2.2, top - BASE + 0.2); posts.forEach((p) => { p.scale.y = shaftH; p.position.y = shaftH / 2; }); glass.scale.y = shaftH; glass.position.y = shaftH / 2;
    const levels = Math.max(1, Math.floor(n)), cyc = (t * 0.22) % 2, lv = cyc < 1 ? cyc : 2 - cyc; car.position.y = 0.95 + ease(lv) * (levels - 1) * FH;
    // 7: solar panels drop onto the roof; 8: the tree shades them until the building clears it
    panels.forEach((p, i) => { p.visible = t > T[7] + 1.0 + i * 0.3; p.scale.setScalar(p.visible ? back(ramp(t, T[7] + 1.0 + i * 0.3, 0.35)) : 0.001); });
    const shade = ease(ramp(t, T[8] + 0.2, 0.6)) * (1 - ease(clamp((top - 14.5) / 1.5)));
    panelM.color.set('#2D4FA8').lerp(new THREE.Color('#141C33'), shade); panelM.emissive = panelM.emissive || new THREE.Color(); panelM.emissive.set(shade < 0.05 && t > T[8] ? '#0E2A6A' : '#000000');
    // 9: more panels need more roof - wings fold out from the top
    wings.forEach(({ w, s }) => { const p = back(ramp(t, T[9] + 2.6, 0.9)); w.visible = t > T[9] + 2.6; w.scale.set(Math.max(0.001, p), 1, 1); });
    camAt(t);
    return { word: wordAt(t), wm: '@TimeSketch' };
  }
  return { scene, duration, frame };
}
