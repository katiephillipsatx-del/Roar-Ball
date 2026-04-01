const CONSTANTS = {
  COURT_W: 15.24, // 50 feet
  COURT_L: 28.65, // 94 feet
  HOOP_H: 3.05, // 10 feet
  RIM_R: 0.23,
  DUNK_DIST: 2.8
};

// State
let scene, camera, renderer, clock;
let p1Team, p2Team, p1Idx, p2Idx, is2P;
let mode = 'MENU';
let players = [];
let ball, ballVel = new THREE.Vector3(), ballHolder = null;
let dt, t = 0;
let qtr = 1, timeClock = 720, shotClock = 24.0;
let courtBox; // For collisions
let controls = { w:0, a:0, s:0, d:0, space:0, shift:0, q:0, e:0, f:0, c:0, up:0, down:0, left:0, right:0, enter:0, ctrl:0, slash:0 };
let camMode = 'BROADCAST';
let p1CtrlPlayer = null, p2CtrlPlayer = null;
let shotMeterActive = false, shotMeterVal = 0, shotMeterDir = 1, shotShooter = null;
let floatingLabels = [];
let hoop1, hoop2;

// Init Three.js
function init3D() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x111111, 20, 60);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 16, 20);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  buildCourt();
  buildBall();

  clock = new THREE.Clock();
  animate();
}

function buildCourt() {
  const geo = new THREE.PlaneGeometry(CONSTANTS.COURT_W, CONSTANTS.COURT_L);
  const mat = new THREE.MeshStandardMaterial({ color: 0xeebb99, roughness: 0.8 });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Simple lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const centerLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-CONSTANTS.COURT_W/2, 0.01, 0),
    new THREE.Vector3(CONSTANTS.COURT_W/2, 0.01, 0)
  ]);
  scene.add(new THREE.Line(centerLine, lineMat));
}

function buildHoop(zPos, isTeam1) {
  const group = new THREE.Group();
  
  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, CONSTANTS.HOOP_H, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, CONSTANTS.HOOP_H/2, zPos + (isTeam1 ? -1 : 1));
  group.add(pole);

  // Backboard
  const bbGeo = new THREE.BoxGeometry(1.8, 1.2, 0.1);
  const bbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const bb = new THREE.Mesh(bbGeo, bbMat);
  bb.position.set(0, CONSTANTS.HOOP_H + 0.5, zPos);
  group.add(bb);

  // Rim
  const rimGeo = new THREE.TorusGeometry(CONSTANTS.RIM_R, 0.03, 8, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xff5500 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI/2;
  rim.position.set(0, CONSTANTS.HOOP_H, zPos + (isTeam1 ? 0.4 : -0.4));
  group.add(rim);

  scene.add(group);
  return { bb, rim, active: true };
}

function buildBall() {
  const geo = new THREE.SphereGeometry(0.24, 16, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });
  ball = new THREE.Mesh(geo, mat);
  ball.castShadow = true;
  scene.add(ball);
  ball.position.set(0, 0.24, 0);
}

// Player generator
function makePlayerMesh(pd, teamColor, isHome) {
  const group = new THREE.Group();
  
  // Scale by height
  const htInches = parseHeight(pd.ht);
  const scale = htInches / 78; // 6'6" is base (78")
  group.scale.setScalar(scale);

  // Base materials
  let skinCol = 0xddaa77;
  let jerseyCol = teamColor;
  let nameStr = pd.name;
  let numStr = pd.num || Math.floor(Math.random()*99);

  // Custom animal features (condensed)
  if(pd.type === 'Panther') skinCol = 0x111A0A; // Black panther
  else if(pd.type === 'Giraffe') { skinCol = 0xC8A46E; }
  else if(pd.type === 'Komodo' || pd.type === 'Alligator' || pd.type === 'Lizard') { skinCol = 0x4A8C3F; }
  else if(pd.type === 'Rhino' || pd.type === 'Gorilla' || pd.type === 'Bull' || pd.type === 'Moose' || pd.type === 'Walrus') { skinCol = 0x333333; }
  else if(pd.type === 'PolarBear' || pd.type === 'Ostrich') skinCol = 0xF5F5F5;
  else if(pd.type === 'PurpleBull') skinCol = 0x2E0A50;
  else if(pd.type === 'BlackMamba') skinCol = 0x1a1a1a;
  else if(pd.type === 'FireSalamander' || pd.type === 'Salamander') skinCol = 0x1A100B;

  // Body
  const isSnek = pd.type.includes('Mamba') || pd.type === 'Sidewinder';
  if(!isSnek) {
    const legGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.7, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: skinCol });
    const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.2, 0.35, 0);
    const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.2, 0.35, 0);
    group.add(legL); group.add(legR);
    group.legL = legL; group.legR = legR;

    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.38, 1.05, 16);
    // Squash the cylinder on the Z axis slightly so they aren't completely round
    bodyGeo.scale(1, 1, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({ color: jerseyCol });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.25, 0);
    group.add(body);

    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 10);
    const armMat = new THREE.MeshStandardMaterial({ color: skinCol });
    const armL = new THREE.Mesh(armGeo, armMat); armL.position.set(-0.55, 1.2, 0); armL.rotation.z = Math.PI / 10;
    const armR = new THREE.Mesh(armGeo, armMat); armR.position.set(0.55, 1.2, 0); armR.rotation.z = -Math.PI / 10;
    group.add(armL); group.add(armR);
  } else {
    // Snek body
    const snekGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5);
    const snekMat = new THREE.MeshStandardMaterial({ color: skinCol });
    const snek = new THREE.Mesh(snekGeo, snekMat);
    snek.position.set(0, 0.75, 0);
    group.add(snek);
  }

  // Head
  const headGeo = new THREE.SphereGeometry(pd.type === 'Ostrich' ? 0.26 : 0.42, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: skinCol });
  const head = new THREE.Mesh(headGeo, headMat);
  let headY = 2.0;

  if(pd.type === 'Giraffe') {
    // Add neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0), new THREE.MeshStandardMaterial({ color: skinCol }));
    neck.position.set(0, 2.2, 0.2);
    group.add(neck);
    headY = 2.8;
  }
  
  head.position.set(0, headY, 0);
  group.add(head);

  // Ground ring
  const ringGeo = new THREE.RingGeometry(0.6, 0.7, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: teamColor, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI/2;
  ring.position.y = 0.02;
  group.add(ring);
  group.ring = ring;
  group.ringMat = ringMat;

  // Custom data
  group.pd = pd;
  group.teamCol = teamColor;
  group.isHome = isHome;
  group.bench = false;
  group.vel = new THREE.Vector3();
  group.posTarget = new THREE.Vector3();

  return group;
}

function spawnTeam(team, isHome) {
  const group = [];
  for(let i=0; i<team.players.length; i++) {
    const pm = makePlayerMesh(team.players[i], team.color, isHome);
    // Bench the 6th player
    if(i === 5) {
      pm.bench = true;
      pm.position.set(isHome ? 7 : -7, 0.5, isHome ? 12 : -12);
    } else {
      pm.position.set(isHome ? -2 + i : 2 - i, 0, isHome ? 5 : -5);
    }
    scene.add(pm);
    group.push(pm);
  }
  return group;
}


function start2k26Game() {
  mode = 'GAME';
  init3D();
  hoop1 = buildHoop(-13, true);
  hoop2 = buildHoop(13, false);
  
  players = [...spawnTeam(p1Team, true), ...spawnTeam(p2Team, false)];
  p1CtrlPlayer = players[p1Idx];
  p2CtrlPlayer = is2P ? players[6 + p2Idx] : null;

  giveBall(p1CtrlPlayer);
}

function giveBall(p) {
  ballHolder = p;
  ball.position.set(0, 0, 0); // Relative to hand conceptually
}

function shootBall(player, isDunk) {
  if(!ballHolder) return;
  ballHolder = null;
  const targetHoop = player.isHome ? hoop2 : hoop1; // Shoot at opponent's hoop
  
  if(isDunk) {
    // Immediate score
    ball.position.copy(targetHoop.rim.position);
    score(player);
  } else {
    // Arc shot
    ballVel.set(0, 6, 0);
    const dir = targetHoop.rim.position.clone().sub(ball.position).normalize();
    ballVel.add(dir.multiplyScalar(8));
    shotShooter = player;
  }
}

function score(player) {
  // Add points
  if(player.isHome) {
    let el = document.getElementById('home-score');
    el.innerText = parseInt(el.innerText) + 2;
  } else {
    let el = document.getElementById('away-score');
    el.innerText = parseInt(el.innerText) + 2;
  }
  
  // Show floating label
  const fl = document.createElement('div');
  fl.className = 'float-label';
  fl.style.color = '#0f0';
  fl.innerText = 'BUCKET! +2 ✅';
  document.getElementById('labels').appendChild(fl);
  
  // Pos label in 2D
  const pr = player.position.clone();
  pr.y += 3;
  pr.project(camera);
  const x = (pr.x * .5 + .5) * window.innerWidth;
  const y = (pr.y * -.5 + .5) * window.innerHeight;
  fl.style.left = x + 'px';
  fl.style.top = y + 'px';
  setTimeout(()=>fl.remove(), 3000);
  
  // Give ball to other team
  const otherTeam = players.filter(p => p.isHome !== player.isHome && !p.bench);
  giveBall(otherTeam[0]); // Simple inbound
}

function updatePhysics(dt) {
  // Ball physics
  if(!ballHolder) {
    ball.position.addScaledVector(ballVel, dt);
    ballVel.y -= 9.8 * dt; // Gravity
    
    // Floor bounce
    if(ball.position.y < 0.24) {
      ball.position.y = 0.24;
      ballVel.y *= -0.6;
      ballVel.x *= 0.8;
      ballVel.z *= 0.8;
    }
    
    // Rim detection
    if(shotShooter && ball.position.y < CONSTANTS.HOOP_H && ballVel.y < 0) {
      const targetHoop = shotShooter.isHome ? hoop2 : hoop1;
      const dist = ball.position.distanceTo(targetHoop.rim.position);
      if(dist < CONSTANTS.RIM_R * 2) {
        // Hit Rim
        let made = Math.random() < (shotShooter.pd.sht / 12) + (shotMeterVal > 0.65 && shotMeterVal < 0.85 ? 0.3 : 0);
        if(made) {
          score(shotShooter);
          shotShooter = null;
        } else {
           // Miss bounce
           ballVel.y = 4;
           ballVel.x = (Math.random()-0.5)*5;
           ballVel.z = (Math.random()-0.5)*5;
           shotShooter = null;
        }
      }
    }
    
    // Loose ball pickup
    if(ball.position.y < 1.0) {
      players.forEach(p => {
        if(!p.bench && p.position.distanceTo(ball.position) < 1.0) {
          giveBall(p);
        }
      });
    }
  } else {
    // Dribble
    const handPos = ballHolder.position.clone();
    handPos.x += 0.5;
    handPos.y = 0.5 + Math.abs(Math.sin(t*10))*0.6; // Bounce
    ball.position.copy(handPos);
  }
}

function runAI(dt) {
  // Simple AI
  players.forEach(p => {
    if(p === p1CtrlPlayer || p === p2CtrlPlayer || p.bench) return;
    
    // Chase ball if loose
    if(!ballHolder) {
      const dir = ball.position.clone().sub(p.position).normalize();
      p.posTarget.copy(p.position).add(dir.multiplyScalar(2));
    } else {
      // Offense
      if(p.isHome === ballHolder.isHome) {
        // 5 out spacing
        // simplified
        p.posTarget.copy(p.position);
      } else {
        // Defense man to man
        const myIdx = players.indexOf(p) % 6;
        const oppIdx = myIdx + (p.isHome ? 6 : -6);
        const opp = players[oppIdx];
        if(opp && !opp.bench) {
           const dir = opp.position.clone().sub(ball.position).normalize();
           p.posTarget.copy(opp.position).sub(dir.multiplyScalar(1.5));
        }
      }
    }
    
    // Move to target
    const dist = p.position.distanceTo(p.posTarget);
    if(dist > 0.5) {
      const maxSpd = (p.pd.spd / 10) * 5;
      const dir = p.posTarget.clone().sub(p.position).normalize();
      p.vel.lerp(dir.multiplyScalar(maxSpd), 0.1);
    } else {
      p.vel.lerp(new THREE.Vector3(), 0.1);
    }
  });
}

function updateMovement(dt) {
  // P1 input
  if(p1CtrlPlayer && !p1CtrlPlayer.bench) {
    const spd = controls.shift ? 8 : 5;
    const input = new THREE.Vector3();
    if(controls.w) input.z -= 1;
    if(controls.s) input.z += 1;
    if(controls.a) input.x -= 1;
    if(controls.d) input.x += 1;
    input.normalize().multiplyScalar(spd);
    p1CtrlPlayer.vel.lerp(input, 0.2);
    
    if(controls.space && ballHolder === p1CtrlPlayer) {
      const targetHoop = p1CtrlPlayer.isHome ? hoop2 : hoop1;
      const dist = p1CtrlPlayer.position.distanceTo(targetHoop.rim.position);
      if(dist < CONSTANTS.DUNK_DIST && p1CtrlPlayer.pd.name !== 'Will Harris') {
        shootBall(p1CtrlPlayer, true);
        controls.space = 0; // reset
      } else {
        shotMeterActive = true;
        shotMeterVal += dt * shotMeterDir * 1.5;
        if(shotMeterVal > 1) { shotMeterVal = 1; shotMeterDir = -1; }
        if(shotMeterVal < 0) { shotMeterVal = 0; shotMeterDir = 1; }
        document.getElementById('shot-meter-ui').style.display = 'block';
        document.getElementById('shot-fill').style.height = (shotMeterVal*100)+'%';
      }
    } else if(!controls.space && shotMeterActive) {
      shootBall(p1CtrlPlayer, false);
      shotMeterActive = false;
      document.getElementById('shot-meter-ui').style.display = 'none';
      shotMeterVal = 0;
    }
  }

  // Apply velocities
  players.forEach(p => {
    if(!p.bench) p.position.addScaledVector(p.vel, dt);
    
    // Rings
    p.ring.visible = (p === p1CtrlPlayer || p === p2CtrlPlayer);
    if(p.ring.visible) p.ringMat.color.setHex(p === p1CtrlPlayer ? 0xffd700 : 0x00ff00);
  });
}

function updateCamera() {
  if(!p1CtrlPlayer) return;
  if(camMode === 'BROADCAST') {
    camera.position.lerp(new THREE.Vector3(ball.position.x, 10, 16), 0.1);
    camera.lookAt(ball.position.x, 0, 0);
  } else if(camMode === 'FOLLOW') {
    camera.position.lerp(p1CtrlPlayer.position.clone().add(new THREE.Vector3(0, 5, 8)), 0.1);
    camera.lookAt(p1CtrlPlayer.position);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if(mode !== 'GAME') return;
  dt = clock.getDelta();
  if(dt > 0.1) dt = 0.1;
  t += dt;

  // Timers
  if(timeClock > 0) timeClock -= dt;
  else if(qtr < 4) { qtr++; timeClock = 720; }
  else { mode = 'OVER'; app.setMode('OVER'); }
  
  const m = Math.floor(timeClock / 60);
  const s = Math.floor(timeClock % 60);
  document.getElementById('game-clock').innerText = `${m}:${s<10?'0':''}${s}`;
  document.getElementById('qtr-disp').innerText = qtr;
  
  if(ballHolder) shotClock -= dt;
  if(shotClock <= 0) {
    shotClock = 24.0;
    // Turnover
    const opps = players.filter(p => p.isHome !== ballHolder.isHome && !p.bench);
    if(opps.length) giveBall(opps[0]);
  }
  document.getElementById('shot-clock').innerText = shotClock.toFixed(1);

  runAI(dt);
  updateMovement(dt);
  updatePhysics(dt);
  updateCamera();
  renderer.render(scene, camera);
}

// Input bindings
window.addEventListener('keydown', e => {
  if(e.code==='KeyW') controls.w=1;
  if(e.code==='KeyS') controls.s=1;
  if(e.code==='KeyA') controls.a=1;
  if(e.code==='KeyD') controls.d=1;
  if(e.code==='Space') controls.space=1;
  if(e.code==='ShiftLeft') controls.shift=1;
  if(e.code==='KeyQ') {
    // Pass or switch def
    const myTeam = players.filter(p => (!p.bench && p.isHome === p1CtrlPlayer.isHome && p !== p1CtrlPlayer));
    if(ballHolder === p1CtrlPlayer && myTeam.length) {
       giveBall(myTeam[0]); p1CtrlPlayer = myTeam[0];
    } else if(myTeam.length) {
       p1CtrlPlayer = myTeam[Math.floor(Math.random()*myTeam.length)];
    }
  }
  if(e.code==='KeyF') {
    const sp = document.getElementById('sub-panel');
    sp.style.display = sp.style.display === 'block' ? 'none' : 'block';
    if(sp.style.display === 'block') renderSubPanel();
  }
  if(e.code==='KeyC') {
    camMode = camMode === 'BROADCAST' ? 'FOLLOW' : 'BROADCAST';
  }
});

window.addEventListener('keyup', e => {
  if(e.code==='KeyW') controls.w=0;
  if(e.code==='KeyS') controls.s=0;
  if(e.code==='KeyA') controls.a=0;
  if(e.code==='KeyD') controls.d=0;
  if(e.code==='Space') controls.space=0;
  if(e.code==='ShiftLeft') controls.shift=0;
});

function renderSubPanel() {
  ['t1', 't2'].forEach(t => {
     const isHome = t==='t1';
     const plrs = players.filter(p => p.isHome === isHome);
     const bench = plrs.find(p => p.bench);
     document.getElementById(`${t}-bench`).innerText = `Bench: ${bench.pd.name} (${bench.pd.type})`;
     const courtDiv = document.getElementById(`${t}-court`);
     courtDiv.innerHTML = '';
     plrs.filter(p => !p.bench).forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'sub-btn';
        btn.innerText = `Sub out ${p.pd.name}`;
        btn.onclick = () => {
           // Swap
           p.bench = true;
           p.position.set(isHome?7:-7, 0.5, isHome?12:-12);
           bench.bench = false;
           bench.position.set(0,0,0);
           if(p1CtrlPlayer === p) p1CtrlPlayer = bench;
           if(p2CtrlPlayer === p) p2CtrlPlayer = bench;
           renderSubPanel();
        };
        courtDiv.appendChild(btn);
     });
  });
}

