// 3D build story: "You didn't want a tumble dryer." A rotary washing line that becomes a wind tower.
// ONE structure; every step has a spoken reason, is attached to the last, and stays on screen to the end.
// Units are metres, y up, lawn top y = 0, the cut face of the ground is at z = +6. Wind blows from -x.
export async function setup({ THREE, camera, ep }) {
  const caps = await (await fetch(`/${ep}/caps_raw.json`)).json();
  const T = caps.map((c) => c.start), duration = caps[caps.length - 1].end + 2.0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const ramp = (t, t0, d) => clamp((t - t0) / d);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

  const scene = new THREE.Scene();
  const tex = (w, h, draw, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const sh = (m) => { m.castShadow = m.receiveShadow = true; return m; };
  const box = (w, h, d, m, x = 0, y = 0, z = 0, p = scene) => { const b = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); b.position.set(x, y, z); p.add(b); return b; };
  const cyl = (r, h, m, x, y, z, p = scene, seg = 16) => { const b = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m)); b.position.set(x, y, z); p.add(b); return b; };
  const tube = (a, b, r, m, p) => { const d = b.clone().sub(a), L = d.length(); const c = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), m));
    c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); p.add(c); return c; };
  const setTube = (c, a, b) => { const d = b.clone().sub(a), L = Math.max(0.001, d.length()); c.position.copy(a).addScaledVector(d, 0.5); c.scale.set(1, L, 1); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
  const unitTube = (r, m, p) => { const c = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), m)); p.add(c); return c; };

  // ---------- sky, sun, clouds ----------
  scene.background = tex(8, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3F9FE8'); g.addColorStop(1, '#A9D8F5'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#ffffff', '#9fbf7a', 1.2));
  const sun = new THREE.DirectionalLight('#fff3d2', 2.5); sun.position.set(-20, 50, 30); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 34, bottom: -30, near: 1, far: 160 }); scene.add(sun);
  const cloudM = new THREE.MeshBasicMaterial({ color: '#ffffff' }), clouds = [];
  for (const [x, y, z, s] of [[-30, 32, -60, 9], [20, 44, -80, 12], [50, 28, -50, 8], [-55, 50, -40, 10], [5, 62, -70, 9]]) { const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    for (const [dx, k] of [[0, 1], [0.9, 0.7], [-0.9, 0.75]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(s * k, 12, 8), cloudM); c.scale.y = 0.55; c.position.x = dx * s; g.add(c); } clouds.push(g); }
  const rainCloud = new THREE.Group(); scene.add(rainCloud); const rcM = mat('#8E9AA6', { roughness: 1 });
  for (const [dx, dy, r] of [[0, 0, 1.6], [1.4, -0.2, 1.2], [-1.4, -0.2, 1.3], [0.5, 0.6, 1.1]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), rcM); c.position.set(dx, dy, 0); rainCloud.add(c); }
  const drops = []; const dropM = new THREE.MeshBasicMaterial({ color: '#7FC8F0' });
  for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 4), dropM); scene.add(d); drops.push(d); }

  // ---------- ground block with the socket hole at the cut face ----------
  const soilM = mat('#ffffff', { map: tex(256, 256, (c, w, h) => { c.fillStyle = '#B4562A'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { c.fillStyle = ['#A44A22', '#C0612F', '#98421E'][i % 3]; c.beginPath(); c.arc(rnd(i) * w, rnd(i + 999) * h, 1.5 + (i % 4), 0, 7); c.fill(); } }, 10, 4) });
  const lawnM = mat('#ffffff', { map: tex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#62BE45' : '#74CE55'; c.fillRect(i * 32, 0, 32, h); } }, 7, 1) });
  const block = (x0, x1, y0, y1, z0, z1, top = lawnM) => box(x1 - x0, y1 - y0, z1 - z0, [soilM, soilM, top, soilM, soilM, soilM], (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const PX = 0, PZ = 5.75, HR = 0.2, HD = 0.45;               // the hole, right at the cut face so we see it in section
  block(-16, 16, -8, -HD, -16, 6); block(-16, PX - HR, -HD, 0, -16, 6); block(PX + HR, 16, -HD, 0, -16, 6); block(PX - HR, PX + HR, -HD, 0, -16, PZ - HR);
  const plug = block(PX - HR, PX + HR, -HD, 0, PZ - HR, 6);
  const spoil = sh(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.26, 10), mat('#B4562A'))); spoil.position.set(1.0, 0.13, 5.0); scene.add(spoil);

  // ---------- your house with back door, a window showing the damp room ----------
  const HXc = 0, HZc = -9.5;
  box(10, 6, 7, mat('#EADBC2'), HXc, 3, HZc); const roof = sh(new THREE.Mesh(new THREE.ConeGeometry(7.4, 2.8, 4), mat('#E0633A'))); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.7); roof.position.set(HXc, 7.4, HZc); scene.add(roof);
  const doorX = 2.6; box(1.1, 2.2, 0.1, mat('#3E7A4A'), doorX, 1.1, HZc + 3.52);
  // a glazed bay window in front of the wall: inside it a radiator covered in wet washing, the glass steamed up
  const WZ = HZc + 3.5, BAYD = 0.9;
  box(2.6, 0.12, BAYD, mat('#F4EDE0'), -1.6, 0.9, WZ + BAYD / 2); box(2.6, 0.12, BAYD, mat('#F4EDE0'), -1.6, 2.6, WZ + BAYD / 2);
  box(0.1, 1.7, BAYD, mat('#F4EDE0'), -2.85, 1.75, WZ + BAYD / 2); box(0.1, 1.7, BAYD, mat('#F4EDE0'), -0.35, 1.75, WZ + BAYD / 2);
  box(2.5, 1.6, 0.04, mat('#FFF4DC'), -1.6, 1.75, WZ + 0.03);                                      // inside wall (light)
  const rad = new THREE.Group(); rad.position.set(-1.6, 1.0, WZ + 0.2); scene.add(rad); box(1.8, 0.7, 0.12, mat('#FFFFFF'), 0, 0.42, 0, rad);
  for (let i = 0; i < 9; i++) box(0.04, 0.66, 0.14, mat('#E3E6EA'), -0.8 + i * 0.2, 0.42, 0.01, rad);
  const wet = []; for (let k = 0; k < 5; k++) { const c = box(k % 2 ? 0.3 : 0.18, k % 2 ? 0.34 : 0.44, 0.04, mat(['#E0453A', '#2D6FCC', '#F2C14E', '#35B56A', '#7A5BC8'][k]), -0.68 + k * 0.34, 0.62, 0.1, rad); wet.push(c); }
  const dripM = new THREE.MeshBasicMaterial({ color: '#7FC8F0' }); const drips = []; for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), dripM); rad.add(d); drips.push(d); }
  const winM = mat('#BFE6F5', { roughness: 0.15, transparent: true, opacity: 0.25 }); box(2.5, 1.6, 0.04, winM, -1.6, 1.75, WZ + BAYD);
  const steamTex = tex(256, 160, (c, w, h) => { c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.0)';
    c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { c.fillRect(20 + i * 26, 30 + (i % 3) * 20, 4, 120); } });
  const steamM = new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, opacity: 0.0, depthWrite: false }); const steam = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.6), steamM); steam.position.set(-1.6, 1.75, WZ + BAYD + 0.03); scene.add(steam);
  const sockIn = wet[0];
  for (const wx of [-3.4, 3.4]) box(1.2, 1.1, 0.1, mat('#5AA8E0'), wx, 4.3, HZc + 3.52); box(1.2, 1.1, 0.1, mat('#5AA8E0'), 0.2, 4.3, HZc + 3.52);
  // fence along the back and the left (it blocks the wind low down)
  const fenceM = mat('#B9814A'); for (let x = -15.5; x < 16; x += 1.0) box(0.95, 1.8, 0.08, fenceM, x + 0.5, 0.9, -15.6);
  for (let z = -15.5; z < 6; z += 1.0) box(0.08, 1.8, 0.95, fenceM, -15.6, 0.9, z + 0.5);
  for (const [x, z, s] of [[11, 2, 1], [-12, -3, 1.2], [12, -13, 0.9]]) { cyl(0.22 * s, 2 * s, mat('#7A4A2A'), x, s, z); const l = sh(new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 10, 8), mat('#4DAA56'))); l.position.set(x, 2.8 * s, z); scene.add(l); }
  // wind streaks (show how the wind behaves)
  const windM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }); const winds = [];
  for (let i = 0; i < 14; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), windM); scene.add(w); winds.push(w); }

  // ---------- socket + concrete ----------
  const steelM = mat('#C9CFD4', { metalness: 0.55, roughness: 0.3 }), concM = mat('#BFC3C8'), blackM = mat('#23262B');
  const socket = cyl(0.04, 0.42, mat('#2D6FCC'), PX, -0.2, PZ, scene, 12);
  const concrete = sh(new THREE.Mesh(new THREE.CylinderGeometry(HR - 0.01, HR - 0.01, 1, 18), concM)); scene.add(concrete);
  const level = new THREE.Group(); scene.add(level); box(0.5, 0.05, 0.05, mat('#E0A63A'), 0, 0, 0, level); box(0.1, 0.035, 0.05, mat('#7FE0A0', { emissive: '#2A8A4A' }), 0, 0.02, 0.01, level);

  // ---------- the drying unit: everything that later rides up the tower ----------
  // Built around a local origin at ground level; the whole group is lifted by `lift` metres in step 6.
  const unit = new THREE.Group(); unit.position.set(PX, 0, PZ - 2.2); scene.add(unit);
  // the rotary line: pole + 4 arms that open like an umbrella + square lines + washing
  const rot = new THREE.Group(); unit.add(rot); rot.position.set(0, 0, 2.2);
  const pole = cyl(0.035, 1.9, steelM, 0, 0.95, 0, rot, 10);
  const ARM = 1.25, armTubes = [], armTips = [];
  for (let k = 0; k < 4; k++) armTubes.push(unitTube(0.022, steelM, rot));
  const lineM = mat('#F4EDE0'), lines = []; for (let k = 0; k < 8; k++) lines.push(unitTube(0.008, lineM, rot));
  const clothes = []; const ccols = ['#E0453A', '#2D6FCC', '#F2C14E', '#FFFFFF', '#35B56A', '#7A5BC8', '#E0453A', '#2D6FCC'];
  for (let k = 0; k < 8; k++) { const c = box(k % 3 ? 0.36 : 0.22, k % 3 ? 0.42 : 0.36, 0.02, mat(ccols[k], { side: THREE.DoubleSide }), 0, 0, 0, rot); c.castShadow = true; clothes.push(c); }
  // the canopy roof on four posts (posts stand on the unit's deck later)
  const canopy = new THREE.Group(); unit.add(canopy); canopy.position.set(0, 0, 2.2);
  const postM = mat('#8E9AA6', { metalness: 0.3 }); const cPosts = [];
  for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) cPosts.push(cyl(0.06, 2.8, postM, x, 1.4, z, canopy, 8));
  const cRoof = box(3.6, 0.1, 3.6, mat('#2D6FCC', { roughness: 0.5 }), 0, 2.85, 0, canopy); box(3.7, 0.06, 3.7, mat('#F4EDE0'), 0, 2.78, 0, canopy);
  // the fan on a post
  const fanG = new THREE.Group(); unit.add(fanG); fanG.position.set(-1.25, 0, 3.0);
  cyl(0.04, 1.45, postM, 0, 0.72, 0, fanG, 8); const fanHead = new THREE.Group(); fanHead.position.set(0, 1.5, 0); fanG.add(fanHead); fanHead.rotation.y = Math.PI / 2 + 0.35;
  const cage = sh(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 6, 24), postM)); fanHead.add(cage); cyl(0.08, 0.16, blackM, 0, 0, -0.06, fanHead).rotation.x = Math.PI / 2;
  const blades = new THREE.Group(); fanHead.add(blades); for (let k = 0; k < 3; k++) { const b = box(0.08, 0.28, 0.02, mat('#F4EDE0'), 0, 0.15, 0, blades); b.position.set(Math.sin(k * 2.094) * 0.15, Math.cos(k * 2.094) * 0.15, 0); b.rotation.z = -k * 2.094; }
  // the long cable across the lawn (trip hazard), from the house to the fan
  const cableM = mat('#23262B'); const cableLong = new THREE.Group(); scene.add(cableLong);
  const cablePts = [V(doorX - 0.7, 0.03, HZc + 3.6), V(-0.5, 0.03, -2.0), V(1.5, 0.03, 0.0), V(-1.25, 0.03, PZ + 0.8 - 2.2 + 2.2 - 1.4)];
  for (let i = 0; i < cablePts.length - 1; i++) tube(cablePts[i], cablePts[i + 1], 0.025, cableM, cableLong);
  // the wind turbine on the canopy roof
  const turb = new THREE.Group(); canopy.add(turb); turb.position.set(0, 2.9, 0);
  cyl(0.06, 1.6, postM, 0, 0.8, 0, turb, 8); const nac = new THREE.Group(); nac.position.set(0, 1.65, 0); turb.add(nac); nac.rotation.y = Math.PI / 2;
  box(0.24, 0.2, 0.5, mat('#F4EDE0'), 0, 0, 0, nac); const rotor = new THREE.Group(); rotor.position.set(0, 0, 0.3); nac.add(rotor);
  for (let k = 0; k < 3; k++) { const b = box(0.1, 0.9, 0.03, mat('#FFFFFF'), 0, 0.45, 0, new THREE.Group()); const arm = new THREE.Group(); arm.rotation.z = k * 2.094; arm.add(b.parent); rotor.add(arm); }
  cyl(0.08, 0.12, mat('#E0453A'), 0, 0, 0.06, rotor).rotation.x = Math.PI / 2;
  const cableShort = unitTube(0.025, cableM, unit);
  // the net around the top
  const netTex = tex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(0, 0, 64, 64); }, 10, 4);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.8, 24, 1, true), new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); net.position.set(0, 1.4, 2.2); unit.add(net);
  // the tumble dryer at the top, plugged in
  const dryer = new THREE.Group(); unit.add(dryer); dryer.position.set(1.3, 0, 3.1);
  box(0.62, 0.86, 0.6, mat('#F7F7F4', { roughness: 0.4 }), 0, 0.43, 0, dryer); box(0.5, 0.12, 0.02, mat('#C9CFD4'), 0, 0.76, 0.31, dryer);
  const drum = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), mat('#7FC8F0', { roughness: 0.2, metalness: 0.2 }))); drum.rotation.x = Math.PI / 2; drum.position.set(0, 0.38, 0.31); dryer.add(drum);
  const ring = sh(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24), steelM)); ring.position.set(0, 0.38, 0.32); dryer.add(ring);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#35D07F' })); lamp.position.set(0.18, 0.76, 0.32); dryer.add(lamp);
  const dryerClothes = []; for (let k = 0; k < 3; k++) { const s = sh(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(ccols[k]))); dryer.add(s); dryerClothes.push(s); }
  const cableDryer = unitTube(0.02, cableM, unit);
  // the deck the unit stands on once it is lifted
  const deck = box(5.2, 0.16, 5.2, mat('#9AA3A8'), 0, -0.08, 2.2, unit);
  // ---------- the lattice tower (grows from the ground to the deck) ----------
  const towerG = new THREE.Group(); towerG.position.set(PX, 0, PZ); scene.add(towerG); const TW = 2.0, towerM = mat('#E0633A', { metalness: 0.2 });
  const legs = []; for (const [x, z] of [[-TW, -TW], [TW, -TW], [-TW, TW], [TW, TW]]) legs.push(unitTube(0.1, towerM, towerG));
  const braces = []; for (let i = 0; i < 14; i++) for (let s = 0; s < 4; s++) braces.push({ m: unitTube(0.05, towerM, towerG), i, s });
  // ---------- the pulley line from the back door to the top ----------
  const pulleyRope = unitTube(0.012, mat('#F4EDE0'), scene); const pulleyRope2 = unitTube(0.012, mat('#F4EDE0'), scene);
  const wheelTop = sh(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 18), steelM)); scene.add(wheelTop);
  const wheelDoor = sh(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 18), steelM)); scene.add(wheelDoor);
  const basket = new THREE.Group(); scene.add(basket); box(0.5, 0.32, 0.36, mat('#C9965E'), 0, -0.3, 0, basket); box(0.4, 0.12, 0.28, mat('#2D6FCC'), 0, -0.1, 0, basket); tube(V(0, 0, 0), V(0, -0.14, 0), 0.01, steelM, basket);
  // ---------- socks that blow away ----------
  const flyingSocks = []; for (let k = 0; k < 4; k++) { const s = box(0.14, 0.32, 0.03, mat(['#F2C14E', '#E0453A', '#35B56A', '#FFFFFF'][k]), 0, 0, 0); s.castShadow = true; flyingSocks.push(s); }

  // ---------- the lift of the whole unit ----------
  const TOP = 18;
  const liftAt = (t) => TOP * ease(ramp(t, T[9] + 0.2, 3.4));

  // ---------- camera: one continuous, slow flight ----------
  const K = [
    [0, [-0.8, 2.3, HZc + 12.0], [-1.5, 2.1, HZc + 4.2]], [T[1] + 1.8, [1.2, 3.0, HZc + 14.0], [-1.0, 1.9, HZc + 4.2]],
    [T[1] + 4.4, [3.0, 3.6, 10.5], [0.2, 0.6, 3.6]], [T[2] + 1.6, [1.6, 1.2, 8.6], [0, -0.15, 5.6]],
    [T[3] + 3.0, [1.2, 0.9, 7.9], [0, -0.1, 5.7]], [T[4] + 2.8, [3.0, 2.2, 9.6], [0, 1.2, 5.6]],
    [T[5] + 2.6, [5.2, 4.2, 11.2], [0, 1.8, 5.4]], [T[6] + 3.6, [4.2, 3.0, 10.4], [-0.6, 1.6, 5.6]],
    [T[7] + 3.4, [7.0, 6.6, 15.0], [0.2, 1.4, 1.0]], [T[7] + 6.0, [4.6, 5.6, 11.6], [0, 4.2, 5.2]],
    [T[8] + 4.0, [-8.0, 4.0, 14.0], [-1.0, 3.2, 3.0]], [T[9] + 3.4, [-10.0, 12.0, 22.0], [0, 12.0, 4.0]],
    [T[10] + 4.2, [16.0, 11.0, 18.0], [1.2, 9.0, -1.5]], [T[11] + 3.0, [6.0, 22.0, 13.5], [0, 20.0, 4.0]],
    [T[12] + 4.0, [7.5, 22.5, 13.5], [0.8, 19.2, 5.6]], [T[13] + 3.6, [11.0, 21.0, 16.0], [0.4, 19.0, 4.0]],
    [duration, [22.0, 26.0, 36.0], [0, 9.5, 0.0]],
  ];
  const posC = new THREE.CatmullRomCurve3(K.map((k) => V(...k[1])), false, 'centripetal'), lookC = new THREE.CatmullRomCurve3(K.map((k) => V(...k[2])), false, 'centripetal');
  const camAt = (t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const f = ease((t - K[i][0]) / (K[i + 1][0] - K[i][0])), u = (i + f) / (K.length - 1);
    camera.position.copy(posC.getPoint(u)); camera.lookAt(lookC.getPoint(u)); };

  // ---------- one word at a time ----------
  const words = [];
  for (const c of caps) { const ws = c.text.split(/\s+/), wsum = ws.reduce((a, w) => a + w.length + 2, 0); let t = c.start;
    for (const w of ws) { const d = (c.end - c.start) * (w.length + 2) / wsum; words.push({ t0: t, t1: t + d, w: w.replace(/[.,?]$/g, '') }); t += d; } }
  const wordAt = (t) => { for (const w of words) if (t >= w.t0 && t < w.t1 + 0.06) return w.w; return ''; };
  const pop = (m, t0, t, d = 0.45) => { m.visible = t > t0; const k = m.visible ? back(ramp(t, t0, d)) : 0.001; m.scale.setScalar(Math.max(0.001, k)); };

  function frame(t) {
    const lift = liftAt(t);
    // 0-1: damp room - steamy window, dripping sock
    steamM.opacity = 0.6 * ease(ramp(t, 0.2, 1.2)); drips.forEach((d, k) => { const ph = (t * 0.8 + k * 0.23) % 1; d.position.set(-0.68 + k * 0.34, 0.4 - ph * 0.45, 0.12); });
    // 2: dig the hole (turf + soil lifted out), drop in the socket
    const dig = ramp(t, T[2] + 0.2, 1.2); plug.visible = dig < 1; plug.position.set(PX + dig * dig * 1.2, -HD / 2 + Math.sin(dig * Math.PI) * 0.6, PZ - HR / 2 + 0.1); plug.rotation.z = -dig * 0.8;
    spoil.visible = t > T[2] + 0.8; spoil.scale.setScalar(spoil.visible ? ease(ramp(t, T[2] + 0.8, 0.8)) : 0.001);
    socket.visible = t > T[2] + 1.6; socket.position.y = -0.2 + (1 - back(ramp(t, T[2] + 1.6, 0.6))) * 1.2;
    // 3: concrete rises round the socket, level checks it
    const cf = ease(ramp(t, T[3] + 0.3, 1.6)); concrete.visible = cf > 0; concrete.scale.y = Math.max(0.001, cf * (HD - 0.06)); concrete.position.set(PX, -HD + cf * (HD - 0.06) / 2, PZ);
    level.visible = t > T[3] + 1.8 && t < T[4] + 0.2; level.position.set(PX, 0.03, PZ); level.rotation.y = Math.sin(t * 1.4) * 0.6;
    // 4: the line slots in and opens like an umbrella, washing goes out
    rot.visible = t > T[4] + 0.2; rot.position.y = (1 - back(ramp(t, T[4] + 0.2, 0.6))) * 1.4;
    const open = ease(ramp(t, T[4] + 1.0, 1.2)), sway = Math.sin(t * 2) * 0.06;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4 + t * 0.05; const tip = V(Math.cos(a) * ARM * open, 1.9 - 0.05 + (1 - open) * -0.9, Math.sin(a) * ARM * open); setTube(armTubes[k], V(0, 1.55, 0), V(tip.x, Math.max(tip.y, 1.0), tip.z)); armTips[k] = tip; }
    for (let k = 0; k < 8; k++) { const ring = k < 4 ? 1 : 0.6, a0 = (k % 4) * Math.PI / 2 + Math.PI / 4 + t * 0.05, a1 = a0 + Math.PI / 2; const y = 1.85;
      const p0 = V(Math.cos(a0) * ARM * ring * open, y, Math.sin(a0) * ARM * ring * open), p1 = V(Math.cos(a1) * ARM * ring * open, y, Math.sin(a1) * ARM * ring * open);
      lines[k].visible = open > 0.05; setTube(lines[k], p0, p1);
      const cl = clothes[k], show = t > T[4] + 2.2 + k * 0.12; cl.visible = show; const mid = p0.clone().lerp(p1, 0.5);
      const wind = (t > T[6] + 2.6 ? 0.6 : 0.08) + (t > T[11] && lift > 10 ? 0.4 : 0);
      cl.position.set(mid.x, y - 0.22, mid.z); cl.rotation.y = -Math.atan2(p1.z - p0.z, p1.x - p0.x); cl.rotation.x = Math.sin(t * 6 + k) * wind + sway; }
    // 5: rain cloud drifts over; drops soak the washing; then the canopy goes up and the rain bounces off
    const rainOn = t > T[5] + 0.3 && t < T[6] + 0.6; rainCloud.visible = t > T[5] && t < T[6] + 1.2;
    rainCloud.position.set(lerp(-14, 0, ease(ramp(t, T[5], 0.9))) + ease(ramp(t, T[6] + 0.2, 1.0)) * 16, 7.5, PZ);
    drops.forEach((d, i) => { d.visible = rainOn; const ph = (t * 1.6 + rnd(i)) % 1; const x = PX - 2 + rnd(i + 3) * 4, z = PZ - 2 + rnd(i + 7) * 4; const roofY = canopy.visible && t > T[5] + 1.8 ? 2.95 + lift : 0;
      d.position.set(x, lerp(7, roofY, ph), z); });
    pop(canopy, T[5] + 1.6, t, 0.6); canopy.scale.setScalar(1); canopy.visible = t > T[5] + 1.6; canopy.position.y = (1 - back(ramp(t, T[5] + 1.6, 0.7))) * 3;
    // 6: no breeze under the roof (wind streaks pass over the top), then the fan
    fanG.visible = t > T[6] + 2.2; fanG.scale.setScalar(fanG.visible ? back(ramp(t, T[6] + 2.2, 0.5)) : 0.001);
    const fanOn = (t > T[6] + 2.6 && t < T[7] + 1.4) || t > T[7] + 4.4; blades.rotation.z += 0; blades.rotation.z = fanOn ? t * 22 : 0;
    // 7: the long cable across the lawn, then a turbine on the roof replaces it with a short cable
    cableLong.visible = t > T[6] + 2.4 && t < T[7] + 4.2; cableLong.scale.set(1, 1, 1);
    turb.visible = t > T[7] + 3.4; turb.scale.setScalar(turb.visible ? back(ramp(t, T[7] + 3.4, 0.6)) : 0.001);
    cableShort.visible = t > T[7] + 4.2; setTube(cableShort, V(-1.25, 1.5, 3.0), V(-1.5, 2.85, 3.5));
    // 8-9: wind is blocked low down (streaks bend up over the fence + house); turbine barely turns; then the whole unit rises on the tower
    const spin = lift > 8 ? 9 : (t > T[8] ? 0.5 : 2.5); rotor.rotation.z = (frame.r = (frame.r || 0) + 0); rotor.rotation.z = t * spin;
    unit.position.y = lift;
    winds.forEach((w, i) => { const ph = (t * 0.35 + i / 14) % 1, x = lerp(-16, 16, ph); const yLow = 0.8 + (i % 4) * 0.5, over = Math.max(0, Math.sin(clamp((x + 16) / 18) * Math.PI)) * 3.4;
      const y = i < 7 ? (yLow + over) : (lift + 3.0 + (i % 3) * 0.7); w.visible = t > T[6] + 0.4 && (i < 7 || lift > 6); w.position.set(x, y, PZ - 3 + (i % 5) * 1.6); w.rotation.z = i < 7 ? Math.cos(clamp((x + 16) / 18) * Math.PI) * 0.6 : 0; });
    deck.visible = lift > 0.3;
    const tH = Math.max(0.001, lift); legs.forEach((l, i) => { const [x, z] = [[-TW, -TW], [TW, -TW], [-TW, TW], [TW, TW]][i]; l.visible = lift > 0.05; setTube(l, V(x, 0, z), V(x * 0.62, tH, z * 0.62)); });
    braces.forEach(({ m, i, s }) => { const y0 = i * 1.3, y1 = y0 + 1.3; m.visible = lift > y1; if (!m.visible) return; const w0 = TW * lerp(1, 0.62, y0 / TOP), w1 = TW * lerp(1, 0.62, y1 / TOP);
      const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]], a = c[s], b = c[(s + 1) % 4]; setTube(m, V(a[0] * w0, y0, a[1] * w0), V(b[0] * w1, y1, b[1] * w1)); });
    // 10: pulley line from the back door to the top, basket rides up
    const pl = t > T[10] + 1.6; pulleyRope.visible = pulleyRope2.visible = wheelTop.visible = wheelDoor.visible = basket.visible = pl;
    const topW = V(PX - 0.2, lift + 1.2, PZ - 2.4), doorW = V(doorX, 2.4, HZc + 3.75);
    wheelTop.position.copy(topW); wheelDoor.position.copy(doorW); wheelTop.rotation.y = wheelDoor.rotation.y = Math.atan2(topW.x - doorW.x, topW.z - doorW.z) + Math.PI / 2;
    const draw = ease(ramp(t, T[10] + 1.6, 1.2)); const ropeEnd = doorW.clone().lerp(topW, draw); setTube(pulleyRope, doorW, ropeEnd); setTube(pulleyRope2, doorW.clone().add(V(0, -0.3, 0)), doorW.clone().add(V(0, -0.3, 0)).lerp(topW.clone().add(V(0, -0.3, 0)), draw));
    const bp = ((t - T[10] - 2.8) * 0.16) % 2, bk = t < T[10] + 2.8 ? 0 : (bp < 1 ? bp : 2 - bp); basket.position.copy(doorW.clone().lerp(topW, ease(bk)));
    // 11: socks blow away, then the net goes up
    flyingSocks.forEach((s, k) => { const st = T[11] + 0.6 + k * 0.4, p = ramp(t, st, 3.5); s.visible = t > st && p < 1; s.position.set(PX + 1 + p * 18, lift + 1.7 + p * 4 + Math.sin(p * 9 + k) * 0.6, PZ + (k - 1.5) * 0.6); s.rotation.set(t * 4 + k, t * 3, t * 5); });
    net.visible = t > T[11] + 2.2; net.scale.set(1, net.visible ? Math.max(0.001, back(ramp(t, T[11] + 2.2, 0.7))) : 0.001, 1); net.position.y = 1.4 * net.scale.y;
    // 12-13: too much power - plug something in: the tumble dryer drops in, starts spinning
    dryer.visible = t > T[12] + 2.6; dryer.position.y = (1 - back(ramp(t, T[12] + 2.6, 0.6))) * 3;
    cableDryer.visible = t > T[12] + 3.2; setTube(cableDryer, V(-1.5, 2.85, 3.5), V(1.3, 0.5, 2.8).add(V(0, 0, 0.3)));
    const run = t > T[12] + 3.6; lamp.visible = run; drum.rotation.y = 0; dryerClothes.forEach((c, k) => { const a = t * 6 + k * 2.1; c.position.set(Math.cos(a) * 0.11, 0.38 + Math.sin(a) * 0.11, 0.25); c.visible = run; });
    clouds.forEach((c, i) => { c.position.x += 0; c.position.x = [-30, 20, 50, -55, 5][i] + t * 0.15; });
    camAt(t);
    return { word: wordAt(t), wm: '@TimeSketch' };
  }
  return { scene, duration, frame };
}
