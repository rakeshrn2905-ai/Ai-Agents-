// 3D build story: "You wanted a fence. You now own a stadium."
// Our own world and models (boxes, cylinders, spheres), one continuous camera, one word on screen at a time.
// Units are metres. y is up, the lawn is y = 0, the cut face of the ground is at z = +12.
export async function setup({ THREE, camera, ep }) {
  const caps = await (await fetch(`/${ep}/caps_raw.json`)).json();
  const T = caps.map((c) => c.start), duration = caps[caps.length - 1].end + 2.0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const back = (t) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const ramp = (t, t0, d) => clamp((t - t0) / d);

  // ---------- helpers ----------
  const scene = new THREE.Scene();
  const tex = (w, h, draw, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
  const box = (w, h, d, m, x = 0, y = 0, z = 0, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };
  const cyl = (r, h, m, x, y, z, parent = scene, seg = 14) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };

  // sky + light
  scene.background = tex(8, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3F9FE8'); g.addColorStop(1, '#A9D8F5'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#ffffff', '#9fbf7a', 1.25));
  const sun = new THREE.DirectionalLight('#fff3d2', 2.4); sun.position.set(-30, 55, 40); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 }); scene.add(sun);
  for (const [x, y, z, s] of [[-30, 34, -60, 9], [10, 40, -80, 12], [45, 30, -50, 8], [-55, 38, -40, 10]]) for (const [dx, k] of [[0, 1], [0.9, 0.7], [-0.9, 0.75]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(s * k, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); c.scale.y = 0.55; c.position.set(x + dx * s, y, z); scene.add(c); }

  // ---------- ground: a cut-out block with soil sides ----------
  const SOIL = tex(256, 256, (c, w, h) => { c.fillStyle = '#B4562A'; c.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { c.fillStyle = ['#A44A22', '#C0612F', '#98421E'][i % 3]; const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * w, y = (Math.sin(i * 78.233) * 12543.123 % 1 + 1) % 1 * h; c.beginPath(); c.arc(x, y, 1.5 + (i % 4), 0, 7); c.fill(); } }, 14, 5);
  const soilM = mat('#ffffff', { map: SOIL });
  const lawnTex = tex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#62BE45' : '#74CE55'; c.fillRect(i * 32, 0, 32, h); } }, 6.5, 1);
  const lawnM = mat('#ffffff', { map: lawnTex });
  const block = (x0, x1, y0, y1, z0, z1, top = lawnM) => box(x1 - x0, y1 - y0, z1 - z0, [soilM, soilM, top, soilM, soilM, soilM], (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const FX = 6, P0Z = 11.7, STEP = 1.93;                       // fence line x = 6; first post at the cut face
  block(-26, 26, -9, 0, -20, 11.4);
  block(-26, FX - 0.25, -9, 0, 11.4, 12); block(FX + 0.25, 26, -9, 0, 11.4, 12); block(FX - 0.25, FX + 0.25, -9, -0.6, 11.4, 12, soilM);
  const plug = block(FX - 0.25, FX + 0.25, -0.6, 0, 11.4, 12);   // the bit of ground you dig out
  const dirt = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.26, 10), mat('#B4562A')); dirt.position.set(FX - 0.8, 0.13, 11.5); dirt.castShadow = true; scene.add(dirt);

  // houses, trees
  const house = (x, z, wall, roof) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    box(8, 5, 6, mat(wall), 0, 2.5, 0, g); const r = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3, 4), mat(roof)); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.78); r.position.y = 6.5; r.castShadow = true; g.add(r);
    for (const wx of [-2.4, 2.4]) for (const wy of [1.6, 3.8]) box(1.3, 1.2, 0.1, mat('#5AA8E0'), wx, wy, 3.02, g); box(1.2, 2.2, 0.1, mat('#7A4A2A'), 0, 1.1, 3.02, g); return g; };
  house(-4, -15.5, '#E9D9BE', '#E0633A'); house(19, -14.5, '#D9E3EC', '#4E7FB8');
  for (const [x, z, s] of [[-22, -16, 1.2], [-23, 2, 1], [23, 6, 1.1], [12, -17, 0.9], [-12, -17.5, 1]]) { cyl(0.25 * s, 2 * s, mat('#7A4A2A'), x, s, z); const l = new THREE.Mesh(new THREE.SphereGeometry(1.7 * s, 10, 8), mat('#3E9A4A')); l.position.set(x, 3 * s, z); l.castShadow = true; scene.add(l); }

  // ---------- the fence ----------
  const woodTex = tex(64, 128, (c, w, h) => { c.fillStyle = '#B9814A'; c.fillRect(0, 0, w, h); c.fillStyle = '#8F5F33'; for (let y = 0; y < h; y += 16) c.fillRect(0, y, w, 3); });
  const woodM = mat('#ffffff', { map: woodTex }), postM = mat('#8F5F33'), concM = mat('#C9CDD2'), gravM = mat('#8E949A');
  const gravel = box(0.46, 0.1, 0.56, gravM, FX, -0.55, 11.7);
  const concrete = box(0.48, 0.5, 0.58, concM, FX, -0.25, 11.7);
  const N = 12, posts = [], panels = [], boards = [];
  for (let i = 0; i < N; i++) posts.push(box(0.12, 2.5, 0.12, postM, FX, 0.65, P0Z - i * STEP));
  for (let i = 0; i < N - 1; i++) { const zc = P0Z - (i + 0.5) * STEP; boards.push(box(0.06, 0.15, STEP - 0.12, concM, FX, 0.075, zc)); panels.push(box(0.06, 1.6, STEP - 0.12, woodM, FX, 0.95, zc)); }
  // net
  const netG = new THREE.Group(); scene.add(netG);
  const netTex = tex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(0, 0, 64, 64); }, 44, 12);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(N * STEP, 6), new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, opacity: 0.9 })); net.rotation.y = Math.PI / 2; net.position.set(FX, 5, P0Z - (N - 1) * STEP / 2); netG.add(net);
  for (let i = 0; i < N; i += 3) cyl(0.09, 8, mat('#E9EEF2'), FX, 4, P0Z - i * STEP, netG, 8); cyl(0.09, 8, mat('#E9EEF2'), FX, 4, P0Z - (N - 1) * STEP, netG, 8);
  // ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat('#ffffff', { roughness: 0.5 })); ball.castShadow = true; scene.add(ball);
  const arc = (p, a, b, h) => new THREE.Vector3(lerp(a[0], b[0], p), lerp(a[1], b[1], p) + Math.sin(p * Math.PI) * h, lerp(a[2], b[2], p));

  // ---------- dome ----------
  const DC = [-4, 0, 0], DR = 11.8, domeG = new THREE.Group(); domeG.position.set(...DC); scene.add(domeG);
  const hemi = new THREE.SphereGeometry(DR, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const glassM = new THREE.MeshBasicMaterial({ color: '#BFE6F5', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  const wireM = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95 });
  domeG.add(new THREE.Mesh(hemi, glassM)); domeG.add(new THREE.LineSegments(new THREE.WireframeGeometry(hemi), wireM));

  // ---------- sprinklers + floodlights ----------
  const sprG = new THREE.Group(); scene.add(sprG); const sprays = [];
  for (const [x, z] of [[-9, 6], [-9, 0], [-3, 3], [2, 7], [2, 0]]) { cyl(0.07, 0.4, mat('#5A606A'), x, 0.2, z, sprG, 8);
    const s = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#7FD0F5', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); s.rotation.x = Math.PI; s.position.set(x, 1.0, z); sprG.add(s); sprays.push(s); }
  const lightG = new THREE.Group(); scene.add(lightG); const lampM = mat('#FFF6C8', { emissive: '#FFE680', emissiveIntensity: 1.6 });
  for (const [x, z] of [[-12.5, 10.5], [-12.5, -3], [4.5, -3], [4.5, 10.5]]) { cyl(0.18, 10, mat('#8E9AA6'), x, 5, z, lightG, 8); box(2.2, 1.1, 0.4, lampM, x, 10.4, z, lightG).lookAt(-4, 0, 4); }

  // ---------- the team (box people, no faces) ----------
  const teamG = new THREE.Group(); scene.add(teamG); const players = [];
  for (let i = 0; i < 10; i++) { const g = new THREE.Group(); teamG.add(g); const col = i % 2 ? '#E0453A' : '#2D6FCC';
    box(0.5, 0.75, 0.3, mat(col), 0, 1.0, 0, g); box(0.2, 0.62, 0.22, mat('#2A2622'), -0.13, 0.31, 0, g); box(0.2, 0.62, 0.22, mat('#2A2622'), 0.13, 0.31, 0, g);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), mat('#F2C9A0')); h.position.y = 1.62; h.castShadow = true; g.add(h);
    players.push({ g, home: [-10 + (i % 5) * 3.2, 0, 1.5 + Math.floor(i / 5) * 5 + (i % 2) * 1.2] }); }

  // ---------- stands + scoreboard ----------
  const standG = new THREE.Group(); scene.add(standG); const tiers = [];
  const standM = [mat('#D9DEE3'), mat('#C9CFD6')], seatCols = ['#E0453A', '#2D6FCC', '#E0A63A', '#35B56A', '#FFFFFF'];
  const addTier = (k, x, z, w, d, rotY) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; standG.add(g);
    box(w, 1.1 * (k + 1), d, standM[k % 2], 0, 0.55 * (k + 1), 0, g);
    for (let i = 0; i < Math.floor(w / 0.9); i++) box(0.5, 0.5, 0.5, mat(seatCols[(i * 7 + k * 3) % 5]), -w / 2 + 0.6 + i * 0.9, 1.1 * (k + 1) + 0.25, 0, g);
    tiers.push({ g, k }); };
  for (let k = 0; k < 6; k++) { addTier(k, -14 - k * 1.5, 3.5, 15, 1.5, Math.PI / 2); addTier(k, 8 + k * 1.5, 3.5, 15, 1.5, -Math.PI / 2); addTier(k, -4, -5 - k * 1.5, 20, 1.5, 0); }
  const scoreTex = tex(512, 256, (c, w, h) => { c.fillStyle = '#14181F'; c.fillRect(0, 0, w, h); c.fillStyle = '#FFD45A'; c.font = '900 70px "Noto Sans", sans-serif'; c.textAlign = 'center'; c.fillText('HOME   AWAY', w / 2, 90); c.font = '900 120px "Noto Sans", sans-serif'; c.fillText('0  -  1', w / 2, 215); });
  const score = new THREE.Group(); score.position.set(-4, 0, -14.2); scene.add(score);
  cyl(0.25, 9, mat('#5A606A'), -3, 4.5, 0, score, 8); cyl(0.25, 9, mat('#5A606A'), 3, 4.5, 0, score, 8);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 0.5), [mat('#14181F'), mat('#14181F'), mat('#14181F'), mat('#14181F'), new THREE.MeshBasicMaterial({ map: scoreTex }), mat('#14181F')]); sb.position.set(0, 11, 0); sb.castShadow = true; score.add(sb);

  // ---------- camera: one continuous flight (Catmull-Rom through keyframes) ----------
  const K = [
    [T[0], [8.6, 1.3, 15.6], [6, -0.15, 11.7]], [T[0] + 2.6, [7.7, 0.9, 14.6], [6, -0.3, 11.7]],
    [T[1] + 2.4, [8.2, 1.7, 15.2], [6, 0.5, 11.7]], [T[2] + 2.2, [8.6, 1.2, 14.9], [6, 0.1, 11.7]],
    [T[3] + 0.6, [10.2, 2.0, 15.4], [6, 0.8, 10.8]], [T[3] + 3.8, [10.6, 2.3, 14.2], [6, 0.9, 10.6]],
    [T[4] + 2.0, [17, 8, 23], [4, 1, 2]], [T[5] + 1.5, [2, 4.5, 23], [3, 1.6, 3]],
    [T[6] + 3.0, [-7, 6.5, 25], [4, 3.2, 2]], [T[7] + 1.0, [-11, 8.5, 25], [1.5, 4, 2]],
    [T[8] + 2.0, [0, 13, 34], [-3, 3.5, 0]], [T[8] + 4.2, [-4, 6.5, 19], [-4, 0, 2.5]],
    [T[9] + 2.4, [5, 10, 28], [-4, 3.5, 0]], [T[10] + 3.5, [-2, 7.5, 25], [-3.5, 1, 3]],
    [T[11] + 2.6, [7, 18, 40], [-3, 4.5, -2]], [T[12] + 2.2, [17, 28, 52], [-3, 5, -3]], [duration, [-12, 36, 60], [-3, 5, -3]],
  ];
  const posC = new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
  const lookC = new THREE.CatmullRomCurve3(K.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
  const camAt = (t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const f = clamp((t - K[i][0]) / (K[i + 1][0] - K[i][0])), u = (i + f) / (K.length - 1);
    camera.position.copy(posC.getPoint(u)); camera.lookAt(lookC.getPoint(u)); };

  // ---------- one word at a time ----------
  const words = [];
  for (const c of caps) { const ws = c.text.split(/\s+/), wsum = ws.reduce((a, w) => a + w.length + 2, 0); let t = c.start;
    for (const w of ws) { const d = (c.end - c.start) * (w.length + 2) / wsum; words.push({ t0: t, t1: t + d, w: w.replace(/[.,]$/g, '') }); t += d; } }
  const wordAt = (t) => { for (const w of words) if (t >= w.t0 && t < w.t1 + 0.06) return w.w; return ''; };

  const dropIn = (m, y, p) => { m.visible = p > 0; m.position.y = y + (1 - back(p)) * 3.2; };

  function frame(t) {
    // 0: the hole
    const dig = ease(ramp(t, T[0] + 0.3, 1.6)); plug.scale.y = Math.max(0.001, 1 - dig); plug.position.y = -0.3 - dig * 0.3; plug.visible = dig < 1;
    dirt.scale.setScalar(Math.max(0.001, ease(ramp(t, T[0] + 0.4, 1.5)))); dirt.visible = t < T[4];
    // 1: gravel, post
    gravel.scale.y = Math.max(0.001, ease(ramp(t, T[1] + 0.4, 0.7))); gravel.visible = t > T[1] + 0.4;
    dropIn(posts[0], 0.65, ramp(t, T[1] + 2.3, 0.6));
    // 2: concrete rises round the post
    const cf = ease(ramp(t, T[2] + 0.5, 1.5)); concrete.visible = cf > 0; concrete.scale.y = Math.max(0.001, cf); concrete.position.y = -0.5 + 0.25 * cf;
    // 3: second post, gravel board, panel
    dropIn(posts[1], 0.65, ramp(t, T[3] - 0.2, 0.5));
    const bp = ease(ramp(t, T[3] + 0.3, 0.7)); boards[0].visible = bp > 0; boards[0].position.x = FX + (1 - bp) * 2.2;
    dropIn(panels[0], 0.95, ramp(t, T[3] + 3.2, 0.7));
    // 4: repeat along the garden
    for (let i = 2; i < N; i++) dropIn(posts[i], 0.65, ramp(t, T[4] + 0.1 + (i - 2) * 0.15, 0.4));
    for (let i = 1; i < N - 1; i++) { const p = ramp(t, T[4] + 0.3 + (i - 1) * 0.15, 0.4); boards[i].visible = p > 0; dropIn(panels[i], 0.95, p); }
    // 6: higher (to the 2 m limit), then the net
    const hi = ease(ramp(t, T[6] + 0.2, 0.8)), gate = t > T[10] + 1.6;
    panels.forEach((p, i) => { if (p.visible) { p.scale.y = 1 + hi * 0.16; p.position.y += hi * 0.13; } if (i === 5 && gate) p.visible = false; });
    posts.forEach((p) => { p.scale.y = 1 + hi * 0.12; });
    const np = back(ramp(t, T[6] + 2.6, 0.9)); netG.visible = t > T[6] + 2.6; netG.scale.y = Math.max(0.001, np);
    // ball: over the fence, over the net, and at the very end over the stands
    let b = new THREE.Vector3(12, 0.28, 4), sq = 0;
    if (t >= T[5] + 0.2 && t < T[7]) { const p = ramp(t, T[5] + 0.2, 1.1); b = p < 1 ? arc(p, [12, 0.5, 4], [1.5, 0.28, 5], 4.2) : arc(clamp((t - T[5] - 1.3) / 0.5), [1.5, 0.28, 5], [0, 0.28, 5.4], 0.9 * (t < T[5] + 1.8 ? 1 : 0)); }
    if (t >= T[7] - 0.3 && t < T[10] + 2.4) { const p = ramp(t, T[7] - 0.3, 1.3); b = p < 1 ? arc(p, [12, 0.5, 2], [-1, 0.28, 3], 10.5) : new THREE.Vector3(-1, 0.28, 3); }
    if (t >= T[10] + 2.4 && t < T[12] + 3.4) { const a = t * 2.2; b = new THREE.Vector3(-4 + Math.cos(a) * 3.5, 0.28 + Math.abs(Math.sin(t * 5)) * 0.7, 4 + Math.sin(a) * 2.4); }
    if (t >= T[12] + 3.4) { const p = ramp(t, T[12] + 3.4, 1.6); b = arc(p, [26, 2, 4], [-4, 0.28, 4], 17); }
    ball.position.copy(b); ball.visible = t > T[5] + 0.2; ball.rotation.x = t * 6;
    // 8: dome, and the lawn dies; 9: sprinklers bring it back
    const dp = back(ramp(t, T[8] + 0.5, 1.4)), fade = 1 - ease(ramp(t, T[11] + 0.1, 1.0)); domeG.visible = t > T[8] + 0.5 && fade > 0.01; domeG.scale.setScalar(Math.max(0.001, dp)); glassM.opacity = 0.16 * fade; wireM.opacity = 0.95 * fade;
    const dead = ease(ramp(t, T[8] + 3.0, 1.2)) * (1 - ease(ramp(t, T[9] + 0.5, 1.6))); lawnM.color.setRGB(lerp(1, 1.5, dead), lerp(1, 0.8, dead), lerp(1, 0.2, dead));
    const sp = ramp(t, T[9] + 0.3, 0.5); sprG.visible = sp > 0 && t < T[11]; sprays.forEach((s, i) => { s.rotation.y = t * 5 + i; s.scale.setScalar(0.8 + 0.25 * Math.sin(t * 9 + i)); });
    const lp = back(ramp(t, T[9] + 1.5, 0.8)); lightG.visible = t > T[9] + 1.5; lightG.scale.y = Math.max(0.001, lp);
    // 10: the team walks in through the gap in the fence
    players.forEach((pl, i) => { const p = ease(ramp(t, T[10] + 2.0 + i * 0.12, 1.1)); pl.g.visible = p > 0; const run = t > T[10] + 3.4 ? Math.sin(t * 3 + i) * 1.2 : 0;
      pl.g.position.set(lerp(6.4, pl.home[0], p) + run, Math.abs(Math.sin(t * 9 + i)) * 0.12, lerp(P0Z - 5.5 * STEP, pl.home[2], p) + Math.cos(t * 2.3 + i) * (p >= 1 ? 0.8 : 0)); pl.g.rotation.y = Math.sin(t * 2 + i); });
    // 11: seats, more seats, scoreboard
    tiers.forEach(({ g, k }) => { const t0 = T[11] + (k < 3 ? 0.2 : 1.1) + k * 0.12, p = back(ramp(t, t0, 0.5)); g.visible = t > t0; g.scale.y = Math.max(0.001, p); });
    const scp = back(ramp(t, T[11] + 2.1, 0.6)); score.visible = t > T[11] + 2.1; score.scale.y = Math.max(0.001, scp);
    camAt(t);
    return { word: wordAt(t), wm: '@TimeSketch' };
  }
  return { scene, duration, frame };
}
