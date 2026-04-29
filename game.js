console.log('%c ROARBALL v3 — 3D procedural characters ', 'background:#1aaa1a;color:white;font-size:14px');
// ===== CONSTANTS =====
const CONSTANTS = {
  COURT_W: 15.24, COURT_L: 28.65,
  HOOP_H: 3.05, RIM_R: 0.23,
  DUNK_DIST: 2.8, THREE_PT_DIST: 7.24,
  MID_DIST: 4.5, LAYUP_DIST: 2.5
};

// ===== STATE =====
let scene, camera, renderer, clock;
let p1Team, p2Team, p1Idx, p2Idx, is2P;
let mode = 'MENU';
let players = [];

let ball, ballVel = new THREE.Vector3(), ballHolder = null;
let dt, t = 0;
let qtr = 1, timeClock = 720, shotClock = 24.0;
let controls = { w:0, a:0, s:0, d:0, space:0, shift:0, q:0, e:0, f:0, c:0 };
let camMode = 'BROADCAST';
let p1CtrlPlayer = null, p2CtrlPlayer = null;
let shotMeterActive = false, shotMeterVal = 0, shotMeterDir = 1, shotShooter = null;
let hoop1, hoop2;
let momentumHome = 50, momentumAway = 50;
let shotPoints = 2, blockCooldown = 0;
let gamePhase = 'PLAYING';

// ===== AUDIO =====
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type, vol) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol || 0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function playSwish()  { playTone(880,0.15,'sine',0.2); setTimeout(()=>playTone(660,0.1,'sine',0.15),80); }
function playBounce() { playTone(120,0.12,'square',0.15); }
function playBuzzer() { playTone(200,0.6,'sawtooth',0.4); setTimeout(()=>playTone(180,0.4,'sawtooth',0.3),300); }
function playWhistle(){ playTone(1200,0.3,'sine',0.25); setTimeout(()=>playTone(1400,0.2,'sine',0.2),150); }
function playCrowdCheer(n) {
  for(let i=0;i<5;i++) setTimeout(()=>playTone(200+Math.random()*400,0.3,'sawtooth',(n||0.5)*0.1),i*60);
}

// ===== INIT 3D =====
function init3D() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x080810, 28, 68);
  scene.background = new THREE.Color(0x080810);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,14,22);
  camera.lookAt(0,0,0);

  renderer = new THREE.WebGLRenderer({canvas:document.getElementById('game-canvas'), antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  scene.add(new THREE.AmbientLight(0x222233, 1.0));
  for(const x of [-6,0,6]) for(const z of [-10,0,10]) {
    const pt = new THREE.PointLight(0xfff5ee, 0.55, 32);
    pt.position.set(x,12,z); scene.add(pt);
  }
  const makeSpot = (px,pz,tx,tz) => {
    const s = new THREE.SpotLight(0xffffff,1.4,22,Math.PI/8,0.3);
    s.position.set(px,10,pz); s.target.position.set(tx,3,tz);
    scene.add(s); scene.add(s.target);
  };
  makeSpot(0,-13,0,-13); makeSpot(0,13,0,13);

  buildCourt(); buildBall();
  clock = new THREE.Clock();
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });
  animate();
}

// ===== COURT =====
function buildCourt() {
  const W=CONSTANTS.COURT_W, L=CONSTANTS.COURT_L;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W,L,20,40),
    new THREE.MeshStandardMaterial({color:0xcc8844,roughness:0.55,metalness:0.05})
  );
  floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);

  // Board lines
  const bm = new THREE.LineBasicMaterial({color:0xbb7733,transparent:true,opacity:0.35});
  for(let z=-L/2;z<L/2;z+=0.18) {
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W/2,0.005,z),new THREE.Vector3(W/2,0.005,z)]),bm));
  }

  const lm = new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.85});
  const pm = new THREE.MeshBasicMaterial({color:0x884422,transparent:true,opacity:0.3,side:THREE.DoubleSide});

  function ln(pts) {
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p))), lm));
  }
  // Boundary
  ln([[-W/2,.01,-L/2],[W/2,.01,-L/2],[W/2,.01,L/2],[-W/2,.01,L/2],[-W/2,.01,-L/2]]);
  // Half-court
  ln([[-W/2,.01,0],[W/2,.01,0]]);
  // Center circle
  const cc=[];
  for(let a=0;a<=Math.PI*2+.01;a+=.1) cc.push([Math.cos(a)*1.83,.01,Math.sin(a)*1.83]);
  ln(cc);

  for(const side of [-1,1]) {
    const pz=side*(L/2-5.8);
    // Paint box + FT line
    ln([[-2.44,.01,side*L/2],[-2.44,.01,pz],[2.44,.01,pz],[2.44,.01,side*L/2]]);
    ln([[-2.44,.01,pz],[2.44,.01,pz]]);
    // FT circle
    const fc=[];
    for(let a=0;a<=Math.PI*2+.01;a+=.1) fc.push([Math.cos(a)*1.83,.01,pz+Math.sin(a)*1.83]);
    ln(fc);
    // Paint fill
    const pf=new THREE.Mesh(new THREE.PlaneGeometry(4.88,5.8),pm);
    pf.rotation.x=-Math.PI/2; pf.position.set(0,.006,side*(L/2-2.9)); scene.add(pf);
    // 3PT arc
    const hz=side*(L/2-1.575), r3=CONSTANTS.THREE_PT_DIST, a3=[];
    for(let a=-Math.PI*.55;a<=Math.PI*.55;a+=.04) {
      const x=Math.sin(a)*r3, z=hz-Math.cos(a)*r3*side;
      if(Math.abs(x)<=W/2) a3.push([x,.01,z]);
    }
    ln(a3);
    ln([[-W/2+0,.01,side*L/2],[-W/2+0,.01,hz-side*0.9]]);
    ln([[ W/2-0,.01,side*L/2],[ W/2+0,.01,hz-side*0.9]]);
    // Restricted arc
    const ra=[];
    for(let a=-Math.PI*.6;a<=Math.PI*.6;a+=.05) ra.push([Math.sin(a)*1.22,.01,hz-Math.cos(a)*1.22*side]);
    ln(ra);
  }

  // Center logo
  const clogo=new THREE.Mesh(new THREE.CircleGeometry(2.5,32),
    new THREE.MeshBasicMaterial({color:0x1a7a1a,transparent:true,opacity:0.2,side:THREE.DoubleSide}));
  clogo.rotation.x=-Math.PI/2; clogo.position.y=.007; scene.add(clogo);

  // Arena walls
  const wm=new THREE.MeshStandardMaterial({color:0x0d0d14,roughness:1});
  for(const [x,y,z,ww,wh,wd] of [
    [0,3,L/2+1.5,W+10,6,.5],[0,3,-L/2-1.5,W+10,6,.5],
    [W/2+1.5,3,0,.5,6,L+5],[-W/2-1.5,3,0,.5,6,L+5]
  ]) {
    const w=new THREE.Mesh(new THREE.BoxGeometry(ww,wh,wd),wm);
    w.position.set(x,y,z); scene.add(w);
  }
}

// ===== HOOP =====
function buildHoop(zPos, isTeam1) {
  const group = new THREE.Group();
  const side = isTeam1 ? -1 : 1;
  const mm = (c,mr,rough) => new THREE.MeshStandardMaterial({color:c,metalness:mr||0,roughness:rough||0.7});

  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,CONSTANTS.HOOP_H,8),mm(0x666666,.6,.4));
  pole.position.set(0,CONSTANTS.HOOP_H/2,zPos+side*1.2); group.add(pole);

  const bb=new THREE.Mesh(new THREE.BoxGeometry(1.83,1.07,.05),mm(0xffffff,0,.1));
  bb.material.transparent=true; bb.material.opacity=0.85;
  bb.position.set(0,CONSTANTS.HOOP_H+.45,zPos+side*.15); group.add(bb);

  const bsq=new THREE.Mesh(new THREE.PlaneGeometry(.59,.45),
    new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:.45,side:THREE.DoubleSide}));
  bsq.position.set(0,CONSTANTS.HOOP_H+.45,zPos+side*.12); group.add(bsq);

  const rim=new THREE.Mesh(new THREE.TorusGeometry(CONSTANTS.RIM_R,.025,8,28),mm(0xff5500,.7,.3));
  rim.rotation.x=Math.PI/2;
  rim.position.set(0,CONSTANTS.HOOP_H,zPos+side*(-.35)); group.add(rim);

  const netm=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.55});
  for(let i=0;i<12;i++) {
    const a=(i/12)*Math.PI*2;
    const net=new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a)*CONSTANTS.RIM_R,0,Math.sin(a)*CONSTANTS.RIM_R),
      new THREE.Vector3(Math.cos(a)*CONSTANTS.RIM_R*.45,-.44,Math.sin(a)*CONSTANTS.RIM_R*.45)
    ]),netm);
    net.position.copy(rim.position); group.add(net);
  }
  scene.add(group);
  return {bb,rim,active:true};
}

// ===== BALL =====
function buildBall() {
  ball=new THREE.Mesh(
    new THREE.SphereGeometry(.24,20,20),
    new THREE.MeshStandardMaterial({color:0xff6600,roughness:.55,metalness:.05})
  );
  ball.castShadow=true; ball.position.set(0,.24,0); scene.add(ball);
  const sm=new THREE.LineBasicMaterial({color:0x331100,transparent:true,opacity:.7});
  [[1,0,0],[0,1,0],[0,0,1]].forEach(ax=>{
    const pts=[];
    for(let a=0;a<=Math.PI*2;a+=.18) {
      pts.push(new THREE.Vector3(
        ax[0]?Math.sin(a)*.02:Math.cos(a)*.242,
        ax[1]?Math.sin(a)*.02:ax[0]?Math.cos(a)*.242:Math.sin(a)*.242,
        ax[2]?Math.sin(a)*.02:ax[0]?Math.sin(a)*.242:Math.cos(a)*.242
      ));
    }
    ball.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),sm));
  });
}


// ===== MAKE PLAYER MESH — 3D procedural character =====
function makePlayerMesh(pd, teamColor, isHome) {
  const h = parseHeight(pd.ht) * 0.0254; // player height in metres
  const group = new THREE.Group();

  // Jersey number canvas texture
  const nc = Object.assign(document.createElement('canvas'), {width:128,height:256});
  const nctx = nc.getContext('2d');
  nctx.fillStyle = '#' + teamColor.toString(16).padStart(6,'0');
  nctx.fillRect(0,0,128,256);
  nctx.fillStyle = 'rgba(255,255,255,0.92)'; nctx.font = 'bold 80px Arial';
  nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
  nctx.fillText(String(pd.num), 64, 128);

  const jerseyMat = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(nc) });
  const shortsMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(teamColor).multiplyScalar(0.6) });
  const skinMat   = new THREE.MeshLambertMaterial({ color: pd.skinColor  || 0xf0c090 });
  const animalMat = new THREE.MeshLambertMaterial({ color: pd.animalColor || 0xaa8855 });
  const shoeMat   = new THREE.MeshLambertMaterial({ color: 0x151515 });

  // Proportions — all relative to player height h, sum to ≈ h
  const shoeH  = h*.054, lLegH = h*.20, uLegH = h*.18, shortsH = h*.08;
  const torsoH = h*.24,  neckH = h*.03, headR = h*.11;
  const uArmH  = h*.16,  fArmH = h*.14;
  const legSep = h*.07,  legR  = h*.058, armR = h*.042;

  // Key Y positions (from ground)
  const hipY      = shoeH + lLegH + uLegH;
  const shortsYc  = hipY  + shortsH * .5;
  const torsoYc   = hipY  + shortsH + torsoH * .5;
  const shoulderY = hipY  + shortsH + torsoH;
  const neckYc    = shoulderY + neckH * .5;
  const headY     = shoulderY + neckH + headR;
  const shldrX    = h * .14; // shoulder half-width

  // Helper: create mesh, position, add to parent
  const put = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // Shoes
  for (const s of [-1,1])
    put(group, new THREE.BoxGeometry(legR*2.4, shoeH, legR*3.8), shoeMat, legSep*s, shoeH*.5, legR*.6);

  // Legs — nested groups so rotation.x swings the limb from the hip
  for (const s of [-1,1]) {
    const lg = new THREE.Group();
    lg.position.set(legSep*s, hipY, 0);
    group.add(lg);
    s < 0 ? (group.leftLegGroup = lg) : (group.rightLegGroup = lg);

    put(lg, new THREE.CylinderGeometry(legR*.85, legR*.70, uLegH, 8), skinMat, 0, -uLegH*.5, 0);
    put(lg, new THREE.SphereGeometry(legR*.72, 7, 7), skinMat, 0, -uLegH, 0); // knee sphere

    const kg = new THREE.Group();
    kg.position.y = -uLegH; lg.add(kg);
    s < 0 ? (group.leftKneeGroup = kg) : (group.rightKneeGroup = kg);

    put(kg, new THREE.CylinderGeometry(legR*.62, legR*.52, lLegH, 8), skinMat, 0, -lLegH*.5, 0);
    put(kg, new THREE.SphereGeometry(legR*.50, 6, 6), skinMat, 0, -lLegH, 0); // ankle
  }

  // Shorts + torso + neck
  put(group, new THREE.CylinderGeometry(h*.130, h*.115, shortsH, 12), shortsMat, 0, shortsYc, 0);
  put(group, new THREE.CylinderGeometry(h*.140, h*.100, torsoH,  12), jerseyMat, 0, torsoYc,  0);
  put(group, new THREE.CylinderGeometry(h*.040, h*.050, neckH,    8), skinMat,   0, neckYc,   0);

  // Arms — nested groups so rotation.x swings from the shoulder
  for (const s of [-1,1]) {
    const ag = new THREE.Group();
    ag.position.set(shldrX*s, shoulderY, 0);
    ag.rotation.z = s * .18; // natural outward droop
    group.add(ag);
    s < 0 ? (group.leftArmGroup = ag) : (group.rightArmGroup = ag);

    ag.add(new THREE.Mesh(new THREE.SphereGeometry(armR*1.1, 7, 7), skinMat)); // shoulder sphere
    put(ag, new THREE.CylinderGeometry(armR*.78, armR*.66, uArmH, 7), skinMat, 0, -uArmH*.5, 0);

    const eg = new THREE.Group(); eg.position.y = -uArmH; ag.add(eg);
    s < 0 ? (group.leftElbowGroup = eg) : (group.rightElbowGroup = eg);

    eg.add(new THREE.Mesh(new THREE.SphereGeometry(armR*.65, 6, 6), skinMat)); // elbow sphere
    put(eg, new THREE.CylinderGeometry(armR*.55, armR*.44, fArmH, 7), skinMat, 0, -fArmH*.5, 0);
    put(eg, new THREE.SphereGeometry(armR*.52, 6, 6), skinMat, 0, -fArmH, 0); // hand
  }

  // Head
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headR, 14, 14), animalMat);
  headMesh.position.set(0, headY, 0);
  group.add(headMesh);
  group.headMesh = headMesh;

  // Eyes (face local +z = player forward direction)
  for (const s of [-1,1]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(headR*.14,6,6),
      new THREE.MeshBasicMaterial({color:0xffffff}));
    ew.position.set(s*headR*.38, headY-headR*.05, headR*.88); group.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(headR*.10,5,5),
      new THREE.MeshBasicMaterial({color:0x111111}));
    ep.position.set(s*headR*.38, headY-headR*.05, headR*.93); group.add(ep);
  }

  // Animal-specific head features
  buildAnimalFeatures3D(group, pd.type, headY, headR, h, animalMat);

  // Ground ring — position indicator
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.55,.65,16),
    new THREE.MeshBasicMaterial({color:teamColor,side:THREE.DoubleSide,transparent:true,opacity:.7})
  );
  ring.rotation.x = -Math.PI/2; ring.position.y = .02; group.add(ring);

  group.pd=pd; group.teamCol=teamColor; group.isHome=isHome; group.bench=false;
  group.vel=new THREE.Vector3(); group.posTarget=new THREE.Vector3();
  group.animTimer=Math.random()*10;
  group.ring=ring; group.ringMat=ring.material;
  group.stamina=100; group.shotsMade=0; group.shotsAttempted=0; group.isHot=false; group.hotStreak=0;
  return group;
}

function spawnTeam(team, isHome) {
  const out=[];
  for(let i=0;i<team.players.length;i++) {
    const pm=makePlayerMesh(team.players[i],team.color,isHome);
    if(i===5){pm.bench=true;pm.position.set(isHome?8:-8,0,isHome?14:-14);}
    else pm.position.set(isHome?-2+i:2-i,0,isHome?6:-6);
    scene.add(pm); out.push(pm);
  }
  return out;
}

// ===== START GAME =====
function start2k26Game() {
  mode='GAME'; gamePhase='PLAYING';
  init3D();
  hoop1=buildHoop(-CONSTANTS.COURT_L/2, true);
  hoop2=buildHoop( CONSTANTS.COURT_L/2, false);

  players=[...spawnTeam(p1Team,true),...spawnTeam(p2Team,false)];
  p1CtrlPlayer=players[p1Idx]; p2CtrlPlayer=is2P?players[6+p2Idx]:null;
  updateHUDTeamInfo(); giveBall(p1CtrlPlayer);
}

function updateHUDTeamInfo() {
  document.getElementById('t2-name').innerText=p1Team.abbr;
  document.getElementById('t1-name').innerText=p2Team.abbr;
  document.getElementById('sb-home-dot').style.background='#'+p1Team.color.toString(16).padStart(6,'0');
  document.getElementById('sb-away-dot').style.background='#'+p2Team.color.toString(16).padStart(6,'0');
  document.getElementById('momentum-home-label').innerText=p1Team.abbr;
  document.getElementById('momentum-away-label').innerText=p2Team.abbr;
}

// ===== BALL / SCORING =====
function giveBall(p) {
  ballHolder=p; shotClock=24.0;
  if(p){
    const nm=p.pd.name.split(' ');
    document.getElementById('active-player-name').innerText=nm[0][0]+'. '+(nm[1]||nm[0]);
    document.getElementById('ind-num').innerText='#'+p.pd.num;
    document.getElementById('ind-type').innerText=p.pd.type.toUpperCase();
  }
}

function determineShotType(player) {
  const hoop=player.isHome?hoop2:hoop1;
  const dist=player.position.distanceTo(hoop.rim.position);
  if(dist<CONSTANTS.DUNK_DIST&&!player.pd.noDunk) return {type:'dunk',label:'DUNK',pts:2};
  if(dist<CONSTANTS.LAYUP_DIST) return {type:'layup',label:'LAYUP',pts:2};
  if(dist>CONSTANTS.THREE_PT_DIST) return {type:'3pt',label:'3PT',pts:3};
  return {type:'mid',label:'MID',pts:2};
}

function shootBall(player, isDunk) {
  if(!ballHolder) return;
  const st=determineShotType(player);
  ballHolder=null; player.shotsAttempted++;
  const tgt=player.isHome?hoop2:hoop1;
  if(isDunk) { ball.position.copy(tgt.rim.position); playSwish(); playCrowdCheer(.9); score(player,2,'SLAM! 💥'); return; }
  const dist=player.position.distanceTo(tgt.rim.position);
  const tof=Math.sqrt(dist)*.38;
  const dy=tgt.rim.position.y-ball.position.y;
  ballVel.set(
    (tgt.rim.position.x-ball.position.x)/tof,
    (dy/tof)+(9.8*tof/2)+3,
    (tgt.rim.position.z-ball.position.z)/tof
  );
  shotShooter=player; shotPoints=st.pts; playBounce();
}

function score(player, pts, label) {
  pts=pts||2; label=label||(pts===3?'THREE! +3 🔥':'BUCKET! +2 ✅');
  player.shotsMade++; player.hotStreak++;
  if(player.hotStreak>=3){ player.isHot=true; if(player===p1CtrlPlayer) document.getElementById('hot-indicator').classList.add('visible'); }
  document.getElementById(player.isHome?'home-score':'away-score').innerText=
    parseInt(document.getElementById(player.isHome?'home-score':'away-score').innerText)+pts;
  if(player.isHome) momentumHome=Math.min(100,momentumHome+8);
  else momentumAway=Math.min(100,momentumAway+8);
  updateMomentum();
  showFloatLabel(player,label,player.isHome?'#44ff88':'#ff8844');
  playSwish(); setTimeout(()=>playCrowdCheer(.65),100);
  const other=players.filter(p=>p.isHome!==player.isHome&&!p.bench);
  giveBall(other[0]);
}

function showFloatLabel(player, text, color) {
  const fl=document.createElement('div'); fl.className='float-label'; fl.style.color=color; fl.innerText=text;
  document.getElementById('labels').appendChild(fl);
  const pr=player.position.clone(); pr.y+=3; pr.project(camera);
  fl.style.left=((pr.x*.5+.5)*window.innerWidth)+'px';
  fl.style.top=((pr.y*-.5+.5)*window.innerHeight)+'px';
  setTimeout(()=>fl.remove(),2500);
}

function showShotQuality(q, c) {
  const el=document.getElementById('shot-quality');
  el.innerText=q; el.style.color=c; el.classList.remove('hidden');
  el.style.animation='none'; void el.offsetWidth; el.style.animation='';
  setTimeout(()=>el.classList.add('hidden'),1400);
}

function updateMomentum() {
  const pct=(momentumHome/(momentumHome+momentumAway))*100;
  const f=document.getElementById('momentum-fill');
  f.style.left='0'; f.style.width=pct+'%';
}

// ===== PHYSICS =====
function updatePhysics(dt) {
  if (!ballHolder) {
    ball.position.addScaledVector(ballVel,dt);
    ballVel.y-=9.8*dt;
    ball.rotation.x+=ballVel.z*dt*2; ball.rotation.z-=ballVel.x*dt*2;
    if(ball.position.y<.24){
      ball.position.y=.24;
      if(Math.abs(ballVel.y)>.5) playBounce();
      ballVel.y*=-.55; ballVel.x*=.78; ballVel.z*=.78;
    }
    // Rim check
    if(shotShooter){
      const th=shotShooter.isHome?hoop2:hoop1;
      const dist=ball.position.distanceTo(th.rim.position);
      if(ball.position.y<CONSTANTS.HOOP_H+.35&&ballVel.y<0&&dist<CONSTANTS.RIM_R*2.6){
        const perfect=shotMeterVal>.62&&shotMeterVal<.88;
        const pct=(shotShooter.pd.sht/10)*.65+(perfect?.28:0)+(shotShooter.isHot?.1:0)+
          ((shotShooter.isHome?momentumHome:momentumAway)>60?.05:0);
        if(Math.random()<pct){
          showShotQuality(perfect?'PERFECT! 🎯':'NICE!',perfect?'#00ff88':'#ffdd00');
          score(shotShooter,shotPoints,shotPoints===3?'THREE! +3 🔥':'BUCKET! +2 ✅');
        } else {
          shotShooter.hotStreak=0; shotShooter.isHot=false;
          if(shotShooter===p1CtrlPlayer) document.getElementById('hot-indicator').classList.remove('visible');
          showShotQuality('MISS','#ff4444');
          ballVel.y=4; ballVel.x=(Math.random()-.5)*6; ballVel.z=(Math.random()-.5)*6;
        }
        shotShooter=null; shotMeterVal=0;
      }
    }
    // Loose ball
    if(ball.position.y<1.2) {
      players.forEach(p=>{
        if(!p.bench&&p.position.distanceTo(ball.position)<1.1) giveBall(p);
      });
    }
    // Boundary
    const hw=CONSTANTS.COURT_W/2+1, hl=CONSTANTS.COURT_L/2+1;
    if(ball.position.x>hw){ball.position.x=hw;ballVel.x*=-.5;}
    if(ball.position.x<-hw){ball.position.x=-hw;ballVel.x*=-.5;}
    if(ball.position.z>hl){ball.position.z=hl;ballVel.z*=-.5;}
    if(ball.position.z<-hl){ball.position.z=-hl;ballVel.z*=-.5;}
  } else {
    const sm=(ballHolder===p1CtrlPlayer&&shotMeterActive);
    const off=sm?new THREE.Vector3(0,2.6,.35):new THREE.Vector3(.38,.6+Math.abs(Math.sin(t*14))*.55,.28);
    off.applyEuler(new THREE.Euler(0,ballHolder.rotation.y,0));
    ball.position.copy(ballHolder.position).add(off);
  }
}

// ===== AI =====
function runAI(dt) {
  players.forEach(p=>{
    if(p===p1CtrlPlayer||p===p2CtrlPlayer||p.bench) return;
    const myTeam=players.filter(x=>x.isHome===p.isHome&&!x.bench);
    const oppTeam=players.filter(x=>x.isHome!==p.isHome&&!x.bench);
    const myIdx=myTeam.indexOf(p);
    const hoopTgt=p.isHome?hoop2:hoop1;

    if(!ballHolder) {
      p.posTarget.copy(ball.position);
    } else if(p.isHome===ballHolder.isHome) {
      // 5-out spacing
      const angles=[0,Math.PI*.4,Math.PI*.8,Math.PI*1.2,Math.PI*1.6];
      const ang=angles[myIdx%5]+(p.isHome?0:Math.PI);
      const cx=0, cz=p.isHome?8:-8;
      p.posTarget.set(cx+Math.cos(ang)*4.5,0,cz+Math.sin(ang)*3);
      // AI shot attempt
      if(p===ballHolder){
        const dd=p.position.distanceTo(hoopTgt.rim.position);
        const nearDef=oppTeam.reduce((b,d)=>{const dd=d.position.distanceTo(p.position);return dd<b.d?{d:dd,p:d}:b},{d:Infinity,p:null});
        if(dd<CONSTANTS.THREE_PT_DIST+1&&nearDef.d>2.8&&Math.random()<.007){
          const st=determineShotType(p);
          if(Math.random()<(p.pd.sht/10)*.65){ballHolder=null;score(p,st.pts,st.pts===3?'AI THREE! +3':'AI BUCKET! +2');}
          else{ballHolder=null;ballVel.set((Math.random()-.5)*4,6,(p.isHome?-1:1)*5);}
        }
      }
    } else {
      // Man D
      const opp=oppTeam[myIdx<oppTeam.length?myIdx:0];
      if(opp){const d=ball.position.clone().sub(p.position).normalize();p.posTarget.copy(opp.position).sub(d.multiplyScalar(1.2));}
    }
    const toTgt=p.posTarget.clone().sub(p.position);
    const d=toTgt.length();
    if(d>.4) p.vel.lerp(toTgt.normalize().multiplyScalar((p.pd.spd/10)*4.5),.12);
    else p.vel.lerp(new THREE.Vector3(),.15);
  });
}

// ===== MOVEMENT =====
function updateMovement(dt) {
  if(p1CtrlPlayer&&!p1CtrlPlayer.bench){
    const spd=controls.shift?7.5:5;
    const inp=new THREE.Vector3(controls.d-controls.a,0,controls.s-controls.w);
    if(inp.length()>0) inp.normalize().multiplyScalar(spd);
    p1CtrlPlayer.vel.lerp(inp,.22);
    // Stamina
    const mv=inp.length()>0;
    p1CtrlPlayer.stamina=Math.max(0,Math.min(100,p1CtrlPlayer.stamina+(mv?(controls.shift?-12:-5):10)*dt));
    const sf=document.getElementById('stamina-fill');
    sf.style.width=p1CtrlPlayer.stamina+'%';
    const sc=p1CtrlPlayer.stamina;
    sf.style.background=sc>60?'linear-gradient(90deg,#00cc44,#44ff88)':sc>30?'linear-gradient(90deg,#cc8800,#ffbb00)':'linear-gradient(90deg,#cc2200,#ff4400)';
    // Shoot
    if(controls.space&&ballHolder===p1CtrlPlayer){
      const tgt=p1CtrlPlayer.isHome?hoop2:hoop1;
      const dist=p1CtrlPlayer.position.distanceTo(tgt.rim.position);
      if(dist<CONSTANTS.DUNK_DIST&&!p1CtrlPlayer.pd.noDunk){
        shootBall(p1CtrlPlayer,true); controls.space=0;
      } else {
        shotMeterActive=true;
        const st=determineShotType(p1CtrlPlayer); shotPoints=st.pts;
        document.getElementById('shot-type-label').innerText=st.label;
        document.getElementById('shot-pts').innerText='+'+st.pts;
        document.getElementById('shot-meter-ui').classList.remove('hidden');
        shotMeterVal+=dt*shotMeterDir*1.6;
        if(shotMeterVal>1){shotMeterVal=1;shotMeterDir=-1;}
        if(shotMeterVal<0){shotMeterVal=0;shotMeterDir=1;}
        document.getElementById('shot-fill').style.height=(shotMeterVal*100)+'%';
        document.getElementById('shot-tick').style.bottom=(shotMeterVal*100)+'%';
      }
    } else if(!controls.space&&shotMeterActive){
      shootBall(p1CtrlPlayer,false); shotMeterActive=false;
      document.getElementById('shot-meter-ui').classList.add('hidden');
    }
    // Block/Steal
    if(controls.e&&blockCooldown<=0){ attemptDefensivePlay(p1CtrlPlayer); blockCooldown=1.5; controls.e=0; }
    if(blockCooldown>0) blockCooldown-=dt;
  }

  players.forEach(p=>{
    if(!p.bench){
      p.position.addScaledVector(p.vel,dt);
      p.position.x=Math.max(-CONSTANTS.COURT_W/2,Math.min(CONSTANTS.COURT_W/2,p.position.x));
      p.position.z=Math.max(-CONSTANTS.COURT_L/2-1,Math.min(CONSTANTS.COURT_L/2+1,p.position.z));
    }
    p.ring.visible=(p===p1CtrlPlayer||p===p2CtrlPlayer);
    if(p.ring.visible){p.ringMat.opacity=.6+Math.sin(t*4)*.15;p.ringMat.color.setHex(p===p1CtrlPlayer?0xffd700:0x00ff88);}
    const spd=p.vel.length();
    if(spd>.3){
      let diff=Math.atan2(p.vel.x,p.vel.z)-p.rotation.y;
      while(diff<-Math.PI)diff+=Math.PI*2;while(diff>Math.PI)diff-=Math.PI*2;
      p.rotation.y+=diff*9*dt;
    } else if(ballHolder){
      const look=p.isHome===ballHolder?.isHome?(p.isHome?hoop2:hoop1).rim.position:ball.position;
      let diff=Math.atan2(look.x-p.position.x,look.z-p.position.z)-p.rotation.y;
      while(diff<-Math.PI)diff+=Math.PI*2;while(diff>Math.PI)diff-=Math.PI*2;
      p.rotation.y+=diff*4*dt;
    }
    p.animTimer+=dt*(spd>.4?spd*3.5:2.5);
    // Limb swing animation — rotate nested groups around pivot points
    if (p.leftLegGroup) {
      const mv = spd > 0.4;
      const amt = mv ? Math.min(spd * 0.09, 0.48) : 0.04;
      const sw  = Math.sin(p.animTimer * 8) * amt;
      // positive rotation.x = foot swings to -z (backward), so negate for forward swing
      p.leftLegGroup.rotation.x  = -sw;
      p.rightLegGroup.rotation.x =  sw;
      // Slight knee bend when leg is at the back of its swing
      p.leftKneeGroup.rotation.x  = mv ? Math.max(0,  sw) * 0.45 : 0;
      p.rightKneeGroup.rotation.x = mv ? Math.max(0, -sw) * 0.45 : 0;
      // Arms swing opposite to ipsilateral leg
      p.leftArmGroup.rotation.x  =  sw * 0.5;
      p.rightArmGroup.rotation.x = -sw * 0.5;
    }
    // Raise shooting arm when shot meter is active
    if (shotMeterActive && p === p1CtrlPlayer && p.rightArmGroup) {
      p.rightArmGroup.rotation.x = -1.85;
    }
  });
}

// ===== DEFENSIVE PLAY =====
function attemptDefensivePlay(def) {
  if(ballHolder&&ballHolder!==def&&ballHolder.isHome!==def.isHome){
    if(def.position.distanceTo(ballHolder.position)<1.8){
      if(Math.random()<(def.pd.def/10)*.35-(ballHolder.pd.drb/10)*.2+.1){
        giveBall(def); showFloatLabel(def,'STEAL! 🤚','#00aaff'); playWhistle();
        const d=def.isHome?10:-10;
        momentumHome=Math.max(0,Math.min(100,momentumHome+d));
        momentumAway=Math.max(0,Math.min(100,momentumAway-d));
        updateMomentum();
      } else showFloatLabel(def,'DENIED','#ff6644');
      return;
    }
  }
  if(shotShooter&&shotShooter.isHome!==def.isHome){
    if(def.position.distanceTo(shotShooter.position)<2.2){
      if(Math.random()<(def.pd.def/10)*.3+(def.pd.str/10)*.15-.15){
        shotShooter=null; ballHolder=null;
        ballVel.set((Math.random()-.5)*6,5,(Math.random()-.5)*6);
        showFloatLabel(def,'BLOCK! ✋','#00aaff'); playWhistle(); playCrowdCheer(.7);
      }
    }
  }
}

// ===== CAMERA =====
function updateCamera(dt) {
  if(!p1CtrlPlayer) return;
  if(camMode==='BROADCAST'){
    camera.position.lerp(new THREE.Vector3(ball.position.x*.4,14,20),dt*3);
    camera.lookAt(ball.position.x*.5,1,0);
  } else {
    const off=new THREE.Vector3(0,5,9).applyEuler(new THREE.Euler(0,p1CtrlPlayer.rotation.y,0));
    camera.position.lerp(p1CtrlPlayer.position.clone().add(off),dt*6);
    camera.lookAt(p1CtrlPlayer.position.clone().add(new THREE.Vector3(0,1.5,0)));
  }
}

// ===== QUARTER END / GAME OVER =====
function triggerQuarterEnd() {
  gamePhase='QUARTER_BREAK'; playBuzzer();
  const hs=document.getElementById('home-score').innerText;
  const as=document.getElementById('away-score').innerText;
  document.getElementById('qb-home-abbr').innerText=p1Team.abbr;
  document.getElementById('qb-away-abbr').innerText=p2Team.abbr;
  document.getElementById('qb-home-score').innerText=hs;
  document.getElementById('qb-away-score').innerText=as;
  if(qtr>=4){
    document.getElementById('qb-header').innerText='FINAL'; document.getElementById('qb-next').innerText='GAME OVER';
    document.getElementById('quarter-break').classList.remove('hidden');
    setTimeout(()=>{document.getElementById('quarter-break').classList.add('hidden');showGameOver(hs,as);},4000);
  } else {
    document.getElementById('qb-header').innerText='END OF QUARTER '+qtr;
    document.getElementById('qb-next').innerText='NEXT: Q'+(qtr+1)+' STARTING';
    document.getElementById('quarter-break').classList.remove('hidden');
    setTimeout(()=>{
      document.getElementById('quarter-break').classList.add('hidden');
      qtr++; timeClock=720; gamePhase='PLAYING';
      document.getElementById('qtr-disp').innerText=qtr;
    },3500);
  }
}

function showGameOver(hs, as) {
  const h=parseInt(hs), a=parseInt(as);
  document.getElementById('go-home-abbr').innerText=p1Team.abbr;
  document.getElementById('go-away-abbr').innerText=p2Team.abbr;
  document.getElementById('go-home-score').innerText=h;
  document.getElementById('go-away-score').innerText=a;
  document.getElementById('go-winner').innerText=h>a?p1Team.name+' WIN! 🏆':h<a?p2Team.name+' WIN! 🏆':'TIE GAME!';
  document.getElementById('game-over').classList.remove('hidden');
  mode='OVER';
}

// ===== MAIN LOOP =====
function animate() {
  requestAnimationFrame(animate);
  if(mode!=='GAME'||gamePhase==='QUARTER_BREAK') return;
  dt=clock.getDelta(); if(dt>.1)dt=.1; t+=dt;
  if(gamePhase==='PLAYING'){
    timeClock-=dt;
    if(timeClock<=0){timeClock=0;triggerQuarterEnd();return;}
  }
  const mm=Math.floor(timeClock/60), ss=Math.floor(timeClock%60);
  document.getElementById('game-clock').innerText=`${mm}:${ss<10?'0':''}${ss}`;
  document.getElementById('qtr-disp').innerText=qtr;
  if(ballHolder){
    shotClock-=dt;
    if(shotClock<=0){
      shotClock=24; playWhistle();
      const opps=players.filter(p=>p.isHome!==ballHolder.isHome&&!p.bench);
      if(opps.length) giveBall(opps[0]);
    }
  }
  const sce=document.getElementById('shot-clock');
  sce.innerText=Math.ceil(Math.max(0,shotClock));
  sce.style.color=shotClock<5?'#ff2200':shotClock<10?'#ffaa00':'#ffffff';
  momentumHome+=(50-momentumHome)*.002; momentumAway+=(50-momentumAway)*.002;
  updateMomentum();
  runAI(dt); updateMovement(dt); updatePhysics(dt); updateCamera(dt);
  renderer.render(scene,camera);
}

// ===== INPUT =====
const _km={KeyW:'w',KeyS:'s',KeyA:'a',KeyD:'d',Space:'space',ShiftLeft:'shift',ShiftRight:'shift',KeyQ:'q',KeyE:'e',KeyF:'f',KeyC:'c'};
window.addEventListener('keydown',e=>{
  const k=_km[e.code]; if(k) controls[k]=1;
  if(e.code==='Space') e.preventDefault();
  if(e.code==='KeyQ'&&p1CtrlPlayer){
    const my=players.filter(p=>!p.bench&&p.isHome===p1CtrlPlayer.isHome&&p!==p1CtrlPlayer);
    if(ballHolder===p1CtrlPlayer&&my.length){
      const tgt=my[Math.floor(Math.random()*my.length)];
      giveBall(tgt); p1CtrlPlayer=tgt; showFloatLabel(tgt,'PASS!','#88ccff');
    } else if(my.length) p1CtrlPlayer=my[Math.floor(Math.random()*my.length)];
  }
  if(e.code==='KeyF'){
    const sp=document.getElementById('sub-panel');
    sp.classList.toggle('hidden');
    if(!sp.classList.contains('hidden')) renderSubPanel();
  }
  if(e.code==='KeyC') camMode=camMode==='BROADCAST'?'FOLLOW':'BROADCAST';
});
window.addEventListener('keyup',e=>{const k=_km[e.code];if(k)controls[k]=0;});

// ===== SUB PANEL =====
function renderSubPanel(){
  ['home','away'].forEach(side=>{
    const isHome=side==='home';
    const plrs=players.filter(p=>p.isHome===isHome);
    const bench=plrs.find(p=>p.bench);
    document.getElementById(isHome?'t1-bench':'t2-bench').innerText=
      'BENCH — '+(bench?bench.pd.name+' ('+bench.pd.type+')':'None');
    const cd=document.getElementById(isHome?'t1-court':'t2-court'); cd.innerHTML='';
    plrs.filter(p=>!p.bench).forEach(p=>{
      const btn=document.createElement('button'); btn.className='sub-btn';
      btn.innerHTML=`<span class="sub-btn-num">#${p.pd.num}</span> ${p.pd.name} <span class="sub-btn-type">${p.pd.type}</span>`;
      btn.onclick=()=>{
        if(!bench) return;
        p.bench=true; p.position.set(isHome?8:-8,0,isHome?14:-14);
        bench.bench=false; bench.position.copy(p.position.clone().add(new THREE.Vector3(0,0,isHome?-1:1)));
        if(p1CtrlPlayer===p){p1CtrlPlayer=bench;giveBall(bench);}
        if(p2CtrlPlayer===p) p2CtrlPlayer=bench;
        renderSubPanel();
      };
      cd.appendChild(btn);
    });
  });
}

// ===== 3D ANIMAL HEAD FEATURES =====
// buildAnimalFeatures3D is called once per player at spawn time.
// group   — the player THREE.Group
// type    — pd.type string  ('Goat', 'Lion', etc.)
// hy      — head sphere centre Y in group local space
// r       — head radius
// h       — full player height
// animalMat — base MeshLambertMaterial for this animal
function buildAnimalFeatures3D(group, type, hy, r, h, animalMat) {
  const LM = c => new THREE.MeshLambertMaterial({ color: c });
  const put = (geo, mat, x, y, z, rx, ry, rz) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.set(rx, ry||0, rz||0);
    group.add(m); return m;
  };

  // Reusable materials
  const grey  = LM(0xaaaaaa);
  const cream = LM(0xddccaa);
  const white = LM(0xfffff0);
  const brown = LM(0x885533);
  const dark  = LM(0x221100);
  const gold  = LM(0xdd9944);
  const red   = LM(0xff3300);

  // Curved horn helper (uses TubeGeometry + CatmullRomCurve3)
  const addHorn = (x0,y0,z0, x1,y1,z1, x2,y2,z2, mat, rad) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x0,y0,z0), new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,8,rad||r*.1,6,false), mat||grey));
  };

  switch (type) {

    case 'Goat':
      for (const s of [-1,1])
        addHorn(s*r*.4, hy-r*.6, r*.3,  s*r*.9, hy+r*.2, 0,  s*r*.55, hy+r*.85, -r*.3, grey, r*.1);
      put(new THREE.CylinderGeometry(r*.08,r*.16,r*.5,6), LM(0xddddcc), 0, hy-r*1.2, r*.3);
      break;

    case 'Lion':
      for (let i=0;i<9;i++){
        const a=(i/9)*Math.PI*2;
        put(new THREE.SphereGeometry(r*.38,7,7), LM(0x884400),
          Math.cos(a)*r*1.25, hy+Math.sin(a)*r*.5, Math.sin(a)*r*.3);
      }
      for (const s of [-1,1])
        put(new THREE.SphereGeometry(r*.3,7,7), animalMat, s*r*.88, hy+r*.82, 0);
      break;

    case 'Bear': case 'PolarBear':
      for (const s of [-1,1]) {
        put(new THREE.SphereGeometry(r*.32,7,7), animalMat, s*r*.9, hy+r*.85, -r*.1);
        put(new THREE.SphereGeometry(r*.15,5,5), dark, s*r*.9, hy+r*.85, r*.22);
      }
      put(new THREE.SphereGeometry(r*.45,9,9), animalMat, 0, hy-r*.2, r*.75);
      break;

    case 'Rhino':
      put(new THREE.ConeGeometry(r*.12,r*.72,8), grey, 0, hy+r*.5, r*.82, -Math.PI/4);
      for (const s of [-1,1])
        put(new THREE.SphereGeometry(r*.2,6,6), animalMat, s*r*.78, hy+r*.82, 0);
      break;

    case 'Bull':
      for (const s of [-1,1])
        addHorn(s*r*.55,hy+r*.3,0, s*r*1.5,hy+r*.65,0, s*r*1.3,hy+r*1.15,0, cream, r*.1);
      put(new THREE.TorusGeometry(r*.22,r*.04,6,12), LM(0xbbbbbb), 0, hy-r*.5, r*.92, Math.PI/2);
      break;

    case 'Horse':
      put(new THREE.CylinderGeometry(r*.42,r*.48,r*.9,10), animalMat, 0, hy-r*.5, r*.65, Math.PI/2.4);
      for (const s of [-1,1])
        put(new THREE.ConeGeometry(r*.18,r*.48,6), animalMat, s*r*.6, hy+r*.88, 0, 0,0,s*-.28);
      put(new THREE.CylinderGeometry(r*.08,r*.18,r*.55,6), LM(0x553300), 0, hy+r*.8, -r*.25);
      break;

    case 'Gorilla':
      put(new THREE.BoxGeometry(r*2.2,r*.24,r*.35), animalMat, 0, hy+r*.12, r*.82);
      put(new THREE.BoxGeometry(r*.55,r*.30,r*.20), dark, 0, hy-r*.2, r*.92);
      break;

    case 'Giraffe':
      for (const s of [-1,1])
        put(new THREE.CylinderGeometry(r*.07,r*.10,r*.6,6), gold, s*r*.35, hy+r*1.1, 0);
      break;

    case 'Alligator':
      put(new THREE.BoxGeometry(r*1.7,r*.38,r*1.15), animalMat, 0, hy-r*.48, r*.82);
      for (let i=-2;i<=2;i++)
        put(new THREE.ConeGeometry(r*.07,r*.22,4), white, i*r*.28, hy-r*.35, r*1.3);
      break;

    case 'Ostrich':
      put(new THREE.ConeGeometry(r*.13,r*.62,6), LM(0xffaa00), 0, hy-r*.3, r*.95, Math.PI/2);
      for (const s of [-1,1])
        put(new THREE.SphereGeometry(r*.12,5,5), animalMat, s*r*.92, hy+r*.1, r*.3);
      break;

    case 'Moose':
      for (const s of [-1,1]) {
        put(new THREE.CylinderGeometry(r*.08,r*.10,r*.65,6), brown, s*r*.45, hy+r*.78, 0, 0,0,s*-.28);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(r*1.05,r*.12,r*.72), brown);
        plate.position.set(s*r*1.0, hy+r*1.1, 0); plate.rotation.z = s*.3; group.add(plate);
        put(new THREE.CylinderGeometry(r*.05,r*.07,r*.4,5), brown, s*r*1.35, hy+r*1.22, 0);
      }
      break;

    case 'Walrus':
      for (const s of [-1,1])
        put(new THREE.CylinderGeometry(r*.07,r*.11,r*.9,6), white, s*r*.35, hy-r*.95, r*.55, .3);
      put(new THREE.SphereGeometry(r*.52,9,9), animalMat, 0, hy-r*.22, r*.72);
      break;

    case 'ArcticWolf': case 'Meerkat': case 'FennecFox': {
      const eh = type==='FennecFox' ? r*.9 : r*.62;
      const ew = type==='FennecFox' ? r*.38 : r*.25;
      for (const s of [-1,1])
        put(new THREE.ConeGeometry(ew,eh,6), animalMat, s*r*.62, hy+r*.9+eh*.3, 0, 0,0,s*.18);
      put(new THREE.ConeGeometry(r*.20,r*.68,8), animalMat, 0, hy-r*.45, r*.85, Math.PI/2.2);
      break;
    }

    case 'Sabertooth':
      for (const s of [-1,1]) {
        put(new THREE.ConeGeometry(r*.23,r*.48,6), animalMat, s*r*.65, hy+r*.82, 0, 0,0,s*.22);
        put(new THREE.ConeGeometry(r*.09,r*.68,6), white, s*r*.25, hy-r*.62, r*.78, .22,0,s*.1);
      }
      put(new THREE.SphereGeometry(r*.36,8,8), animalMat, 0, hy-r*.22, r*.85);
      break;

    case 'Panther': case 'Jaguar': case 'SnowLeopard': case 'SandCat':
      for (const s of [-1,1])
        put(new THREE.ConeGeometry(r*.23,r*.48,6), animalMat, s*r*.65, hy+r*.82, 0, 0,0,s*.22);
      put(new THREE.SphereGeometry(r*.36,8,8), animalMat, 0, hy-r*.22, r*.85);
      break;

    case 'Komodo': case 'Lizard':
      put(new THREE.BoxGeometry(r*1.45,r*.32,r*.75), animalMat, 0, hy-r*.32, r*.72);
      for (const s of [-1,1])
        put(new THREE.CylinderGeometry(r*.03,r*.03,r*.5,4), red, s*r*.12, hy-r*.42, r*1.18, Math.PI/2.2,0,s*.15);
      break;

    case 'BlackMamba': case 'Sidewinder':
      put(new THREE.ConeGeometry(r*.5,r*.72,4), animalMat, 0, hy-r*.15, r*.5, Math.PI/2,Math.PI/4);
      for (const s of [-1,1])
        put(new THREE.CylinderGeometry(r*.025,r*.025,r*.48,4), red, s*r*.1, hy-r*.1, r*1.12, Math.PI/2,0,s*.15);
      break;

    case 'Camel':
      put(new THREE.CylinderGeometry(r*.36,r*.42,r*.82,9), animalMat, 0, hy-r*.52, r*.68, Math.PI/2.3);
      for (const s of [-1,1])
        put(new THREE.SphereGeometry(r*.09,5,5), dark, s*r*.16, hy-r*.58, r*1.02);
      break;

    case 'Scorpion':
      for (const s of [-1,1]) {
        put(new THREE.CylinderGeometry(r*.1,r*.16,r*.65,6), LM(0x443311), s*r*1.1, hy, 0, 0,0,s*-.8);
        put(new THREE.SphereGeometry(r*.22,6,6), LM(0x443311), s*r*1.55, hy+r*.12, 0);
      }
      break;

    case 'Salamander':
      for (let i=-2;i<=2;i++)
        put(new THREE.ConeGeometry(r*.08,r*.45,4), red, i*r*.32, hy+r*.88+r*.22, 0);
      break;

    default:
      for (const s of [-1,1])
        put(new THREE.SphereGeometry(r*.3,7,7), animalMat, s*r*.88, hy+r*.82, 0);
  }
}

// ===== stub kept to avoid reference errors — no longer used =====
function drawCharacters2D() {
  if (!charCanvas || !players.length) return;
  const ctx = charCtx;
  ctx.clearRect(0, 0, charCanvas.width, charCanvas.height);

  const sorted = [...players].filter(p => !p.bench).sort((a,b) =>
    camera.position.distanceTo(b.position) - camera.position.distanceTo(a.position)
  );

  sorted.forEach(p => {
    const feetNDC = p.position.clone().project(camera);
    if (feetNDC.z > 1) return;
    // Screen position of feet (y=0 ground)
    const footX = (feetNDC.x * 0.5 + 0.5) * charCanvas.width;
    const footY = (-feetNDC.y * 0.5 + 0.5) * charCanvas.height;
    // Screen position of top of head using actual player height
    const heightM = parseHeight(p.pd.ht) * 0.0254; // inches → metres
    const topPos = p.position.clone(); topPos.y = heightM;
    const topNDC = topPos.clone().project(camera);
    const topY = (-topNDC.y * 0.5 + 0.5) * charCanvas.height;
    const charH = Math.max(18, footY - topY);
    drawPlayerSprite(ctx, p, footX, footY, charH);
  });
}

function drawPlayerSprite(ctx, player, x, y, charH) {
  // charH = total pixel height of character at current perspective
  const pd = player.pd;
  const tc = '#' + player.teamCol.toString(16).padStart(6, '0');
  const ac = '#' + (pd.animalColor || 0xaa8855).toString(16).padStart(6, '0');
  const sk = '#' + (pd.skinColor || 0xf0c080).toString(16).padStart(6, '0');
  const s  = charH / 55; // line-width scale

  const spd = player.vel.length();
  const moving = spd > 0.5;
  player.animTimer += 0.016 * (moving ? spd * 3.5 : 2.5);
  const bob      = moving ? Math.sin(player.animTimer * 8) * s * 1.8 : Math.sin(player.animTimer * 2) * s * 0.6;
  const legSwing = moving ? Math.sin(player.animTimer * 8) * s * 7   : 0;

  // Proportions relative to charH
  const headR  = charH * 0.15;
  const torsoH = charH * 0.28;
  const torsoW = charH * 0.30;
  const shortsH = charH * 0.10;
  const legH   = charH * 0.37;
  // Layout from feet (y) upward: legs → shorts → torso → head
  const legTopY   = y   - legH + bob;           // top of legs = bottom of shorts
  const shortsTop = legTopY - shortsH;           // top of shorts = bottom of torso
  const torsoTop  = shortsTop - torsoH;          // top of torso = bottom of neck
  const headCY    = torsoTop - headR + s * 1.5; // head centre just above torso

  // Shadow
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x, y, torsoW * 0.9, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Legs (skin coloured)
  ctx.lineCap = 'round';
  ctx.lineWidth = 6 * s; ctx.strokeStyle = sk;
  ctx.beginPath(); ctx.moveTo(x - torsoW * 0.28, shortsTop + shortsH); ctx.lineTo(x - torsoW * 0.28 - legSwing * 0.35, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + torsoW * 0.28, shortsTop + shortsH); ctx.lineTo(x + torsoW * 0.28 + legSwing * 0.35, y); ctx.stroke();
  // Shoes
  ctx.lineWidth = 5 * s; ctx.strokeStyle = '#111111';
  ctx.beginPath(); ctx.moveTo(x - torsoW * 0.28 - legSwing * 0.35, y); ctx.lineTo(x - torsoW * 0.28 - legSwing * 0.35 - 4 * s, y + 2 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + torsoW * 0.28 + legSwing * 0.35, y); ctx.lineTo(x + torsoW * 0.28 + legSwing * 0.35 + 4 * s, y + 2 * s); ctx.stroke();

  // Shorts
  ctx.fillStyle = tc;
  ctx.beginPath(); ctx.roundRect(x - torsoW * 0.55, shortsTop, torsoW * 1.1, shortsH, 2 * s); ctx.fill();

  // Jersey
  ctx.fillStyle = tc;
  ctx.beginPath(); ctx.roundRect(x - torsoW * 0.6, torsoTop, torsoW * 1.2, torsoH, 3 * s); ctx.fill();

  // Jersey number
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.max(7, 7 * s)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(pd.num), x, torsoTop + torsoH * 0.42);

  // Arms (swing opposite to legs)
  ctx.lineWidth = 5 * s; ctx.strokeStyle = sk;
  ctx.beginPath(); ctx.moveTo(x - torsoW * 0.6, torsoTop + torsoH * 0.18); ctx.lineTo(x - torsoW * 1.05, torsoTop + torsoH * 0.62 + legSwing * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + torsoW * 0.6, torsoTop + torsoH * 0.18); ctx.lineTo(x + torsoW * 1.05, torsoTop + torsoH * 0.62 - legSwing * 0.2); ctx.stroke();

  // Neck
  ctx.fillStyle = sk;
  ctx.beginPath(); ctx.ellipse(x, torsoTop + s, 2.5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();

  // Animal head
  drawAnimalHead2D(ctx, pd.type, x, headCY, headR, ac, s);

  // Ball held indicator
  if (player === ballHolder) {
    const ballR = charH * 0.11;
    const bx = x + torsoW * 0.95, ballY = torsoTop + torsoH * 0.35;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(bx, ballY, ballR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#331100'; ctx.lineWidth = 1.5 * s; ctx.stroke();
    ctx.lineWidth = s;
    ctx.beginPath(); ctx.moveTo(bx - ballR, ballY); ctx.lineTo(bx + ballR, ballY); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, ballY, ballR, 0, Math.PI, false); ctx.stroke();
  }

  // Controlled player indicator
  if (player === p1CtrlPlayer) {
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2 * s;
    ctx.setLineDash([3 * s, 3 * s]);
    ctx.beginPath(); ctx.ellipse(x, y + s, torsoW * 0.75, 3.5 * s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hot streak
  if (player.isHot) {
    ctx.font = `${Math.max(8, 8 * s)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🔥', x, headCY - headR * 1.9);
  }
}

function drawAnimalHead2D(ctx, type, x, y, r, color, s) {
  ctx.fillStyle = color;

  // Head shape varies by animal
  if (['Gorilla','Bear','PolarBear','Rhino','Bull','Walrus'].includes(type)) {
    ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, Math.PI * 2); ctx.fill();
  } else if (['Giraffe','Horse','Camel'].includes(type)) {
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r * 1.15, 0, 0, Math.PI * 2); ctx.fill();
  } else if (['Alligator','Komodo','Lizard'].includes(type)) {
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  } else if (['BlackMamba','Sidewinder'].includes(type)) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.9, y); ctx.lineTo(x, y + r * 0.5); ctx.lineTo(x - r * 0.9, y); ctx.closePath(); ctx.fill();
  } else if (type === 'Scorpion') {
    ctx.beginPath(); ctx.moveTo(x, y-r); ctx.lineTo(x+r*0.9,y-r*0.5); ctx.lineTo(x+r*0.9,y+r*0.5); ctx.lineTo(x,y+r); ctx.lineTo(x-r*0.9,y+r*0.5); ctx.lineTo(x-r*0.9,y-r*0.5); ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Animal-specific features
  switch(type) {
    case 'Goat':
      ctx.strokeStyle='#ccccaa'; ctx.lineWidth=2.5*scale;
      ctx.beginPath(); ctx.moveTo(x-r*.5,y-r*.7); ctx.bezierCurveTo(x-r*.9,y-r*1.6,x-r*.3,y-r*1.9,x-r*.1,y-r*1.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+r*.5,y-r*.7); ctx.bezierCurveTo(x+r*.9,y-r*1.6,x+r*.3,y-r*1.9,x+r*.1,y-r*1.4); ctx.stroke();
      ctx.fillStyle='#ddddcc'; ctx.beginPath(); ctx.ellipse(x,y+r*.9,r*.2,r*.35,0,0,Math.PI*2); ctx.fill();
      break;
    case 'Lion':
      ctx.fillStyle='#884400';
      for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*1.25,y+Math.sin(a)*r*1.25,r*.35,r*.5,a,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x-r*.75,y-r*.75,r*.28,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*.75,y-r*.75,r*.28,0,Math.PI*2); ctx.fill();
      break;
    case 'Panther': case 'Jaguar': case 'SnowLeopard': case 'SandCat':
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.moveTo(x-r*.6,y-r*.6); ctx.lineTo(x-r*.95,y-r*1.35); ctx.lineTo(x-r*.15,y-r*.8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+r*.6,y-r*.6); ctx.lineTo(x+r*.95,y-r*1.35); ctx.lineTo(x+r*.15,y-r*.8); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x,y+r*.2,r*.45,r*.35,0,0,Math.PI*2); ctx.fill();
      break;
    case 'Rhino':
      ctx.fillStyle='#aaaaaa'; ctx.beginPath(); ctx.moveTo(x-r*.18,y-r*.85); ctx.lineTo(x+r*.18,y-r*.85); ctx.lineTo(x,y-r*1.9); ctx.fill();
      break;
    case 'Bull':
      ctx.strokeStyle='#ddccaa'; ctx.lineWidth=3.5*scale;
      ctx.beginPath(); ctx.moveTo(x-r*.7,y-r*.3); ctx.quadraticCurveTo(x-r*1.6,y-r*.9,x-r*1.2,y-r*1.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+r*.7,y-r*.3); ctx.quadraticCurveTo(x+r*1.6,y-r*.9,x+r*1.2,y-r*1.4); ctx.stroke();
      ctx.strokeStyle='#cccccc'; ctx.lineWidth=2*scale; ctx.beginPath(); ctx.arc(x,y+r*.55,r*.2,0,Math.PI*2); ctx.stroke();
      break;
    case 'Horse':
      ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y+r*.65,r*.55,r*.55,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#553300'; ctx.beginPath(); ctx.ellipse(x,y-r*.5,r*.25,r*.75,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.moveTo(x-r*.45,y-r*.8); ctx.lineTo(x-r*.65,y-r*1.45); ctx.lineTo(x-r*.1,y-r*.9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+r*.45,y-r*.8); ctx.lineTo(x+r*.65,y-r*1.45); ctx.lineTo(x+r*.1,y-r*.9); ctx.fill();
      break;
    case 'Bear': case 'PolarBear':
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x-r*.9,y-r*.9,r*.35,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*.9,y-r*.9,r*.35,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*.5,r*.4,0,0,Math.PI*2); ctx.fill();
      break;
    case 'Gorilla':
      ctx.fillStyle=color; ctx.beginPath(); ctx.rect(x-r*1.15,y-r*.55,r*2.3,r*.32); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x,y+r*.15,r*.65,r*.7,0,0,Math.PI*2); ctx.fill();
      break;
    case 'Giraffe':
      ctx.fillStyle='#cc8833';
      ctx.beginPath(); ctx.rect(x-r*.4,y-r*1.05,r*.18,r*.65); ctx.fill();
      ctx.beginPath(); ctx.rect(x+r*.22,y-r*1.05,r*.18,r*.65); ctx.fill();
      break;
    case 'Alligator':
      ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y+r*.55,r*.95,r*.5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='white';
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*r*.3,y+r*.3);ctx.lineTo(x+i*r*.3+r*.08,y+r*.75);ctx.lineTo(x+i*r*.3-r*.08,y+r*.75);ctx.fill();}
      break;
    case 'Ostrich':
      ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.moveTo(x-r*.2,y+r*.3); ctx.lineTo(x+r*.2,y+r*.3); ctx.lineTo(x,y+r*1.05); ctx.fill();
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x-r*.7,y-r*.75,r*.28,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*.7,y-r*.75,r*.28,0,Math.PI*2); ctx.fill();
      break;
    case 'Moose':
      ctx.strokeStyle='#885533'; ctx.lineWidth=3*scale;
      ctx.beginPath(); ctx.moveTo(x-r*.4,y-r*.8); ctx.lineTo(x-r*.9,y-r*1.7); ctx.moveTo(x-r*.65,y-r*1.25); ctx.lineTo(x-r*1.2,y-r*1.5); ctx.moveTo(x-r*.75,y-r*1.55); ctx.lineTo(x-r*.4,y-r*1.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+r*.4,y-r*.8); ctx.lineTo(x+r*.9,y-r*1.7); ctx.moveTo(x+r*.65,y-r*1.25); ctx.lineTo(x+r*1.2,y-r*1.5); ctx.moveTo(x+r*.75,y-r*1.55); ctx.lineTo(x+r*.4,y-r*1.75); ctx.stroke();
      break;
    case 'Walrus':
      ctx.fillStyle='#fffff0'; ctx.beginPath(); ctx.ellipse(x-r*.3,y+r*.85,r*.12,r*.48,-0.15,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+r*.3,y+r*.85,r*.12,r*.48,0.15,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(x,y+r*.25,r*.6,r*.38,0,0,Math.PI*2); ctx.fill();
      break;
    case 'ArcticWolf': case 'Meerkat': case 'FennecFox': {
      const eh = type==='FennecFox' ? 1.5 : 1.1;
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.moveTo(x,y+r*.95); ctx.lineTo(x-r*.42,y+r*.1); ctx.lineTo(x+r*.42,y+r*.1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x-r*.4,y-r*.7); ctx.lineTo(x-r*.7,y-r*eh); ctx.lineTo(x-r*.05,y-r*.85); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+r*.4,y-r*.7); ctx.lineTo(x+r*.7,y-r*eh); ctx.lineTo(x+r*.05,y-r*.85); ctx.fill();
      break;
    }
    case 'Sabertooth':
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.moveTo(x-r*.6,y-r*.6); ctx.lineTo(x-r*.95,y-r*1.35); ctx.lineTo(x-r*.15,y-r*.8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+r*.6,y-r*.6); ctx.lineTo(x+r*.95,y-r*1.35); ctx.lineTo(x+r*.15,y-r*.8); ctx.fill();
      ctx.fillStyle='#fffff0';
      ctx.beginPath(); ctx.moveTo(x-r*.18,y+r*.4); ctx.lineTo(x-r*.32,y+r*1.05); ctx.lineTo(x-r*.04,y+r*1.05); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+r*.18,y+r*.4); ctx.lineTo(x+r*.32,y+r*1.05); ctx.lineTo(x+r*.04,y+r*1.05); ctx.fill();
      break;
    case 'Komodo': case 'Lizard':
      ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y+r*.5,r*.95,r*.5,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#ff2200'; ctx.lineWidth=2*scale;
      ctx.beginPath(); ctx.moveTo(x,y+r*.5); ctx.lineTo(x-r*.22,y+r*1.1); ctx.moveTo(x,y+r*.5); ctx.lineTo(x+r*.22,y+r*1.1); ctx.stroke();
      break;
    case 'BlackMamba': case 'Sidewinder':
      ctx.strokeStyle='#ff2200'; ctx.lineWidth=2*scale;
      ctx.beginPath(); ctx.moveTo(x,y+r*.4); ctx.lineTo(x-r*.28,y+r*1.05); ctx.moveTo(x,y+r*.4); ctx.lineTo(x+r*.28,y+r*1.05); ctx.stroke();
      break;
    case 'Camel':
      ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y+r*.55,r*.6,r*.55,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x-r*.82,y-r*.45,r*.22,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*.82,y-r*.45,r*.22,0,Math.PI*2); ctx.fill();
      break;
    case 'Scorpion':
      ctx.fillStyle='#443311';
      ctx.beginPath(); ctx.ellipse(x-r*1.35,y,r*.42,r*.25,-0.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+r*1.35,y,r*.42,r*.25,0.3,0,Math.PI*2); ctx.fill();
      break;
    case 'Salamander':
      ctx.strokeStyle='#ff3300'; ctx.lineWidth=3*scale;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*r*.35,y-r*.8);ctx.lineTo(x+i*r*.35,y-r*1.55);ctx.stroke();}
      break;
    default:
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.arc(x-r*.75,y-r*.75,r*.32,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*.75,y-r*.75,r*.32,0,Math.PI*2); ctx.fill();
  }

  // Eyes
  if (!['BlackMamba','Sidewinder','Scorpion'].includes(type)) {
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(x-r*.35,y-r*.1,r*.13,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+r*.35,y-r*.1,r*.13,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white';
    ctx.beginPath(); ctx.arc(x-r*.3,y-r*.15,r*.05,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+r*.4,y-r*.15,r*.05,0,Math.PI*2); ctx.fill();
  }
}
