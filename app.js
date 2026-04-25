// ===== APP STATE =====
let selectedHomeTeamIdx = 0;
let selectedAwayTeamIdx = 1;
let introTimer = 0, introPlayerList = [], introIdx = 0, introInterval = null;
let introProgressInterval = null;
const INTRO_PER_PLAYER = 1800; // ms per player card

// ===== WINDOW LOAD =====
window.onload = () => {
  // Showcase rotation on main menu
  const showcasePlayers = [
    { src: 'assets/will_goat_1775049016052.png', name: 'WILL HARRIS', sub: 'OVR: 85 | GOAT | PG', spd: 10, sht: 10, drb: 9 },
    { src: 'assets/jett_panther_1775049031196.png', name: 'JETT FILLMORE', sub: 'OVR: 99 | PANTHER | SG', spd: 10, sht: 10, drb: 9 },
    { src: 'assets/mane_horse_1775063149935.png', name: 'MANE ATTRACTION', sub: 'OVR: 93 | HORSE | SF', spd: 10, sht: 8, drb: 8 }
  ];
  let showcaseIdx = 0;
  function cycleShowcase() {
    showcaseIdx = (showcaseIdx + 1) % showcasePlayers.length;
    const p = showcasePlayers[showcaseIdx];
    const img = document.getElementById('showcase-player');
    img.style.opacity = 0;
    setTimeout(() => {
      img.src = p.src;
      img.style.opacity = 1;
      document.getElementById('showcase-name').innerText = p.name;
      document.getElementById('showcase-sub').innerText = p.sub;
      const pills = document.querySelectorAll('.stat-pill strong');
      if (pills[0]) pills[0].innerText = p.spd;
      if (pills[1]) pills[1].innerText = p.sht;
      if (pills[2]) pills[2].innerText = p.drb;
    }, 300);
  }
  document.getElementById('showcase-player').style.transition = 'opacity 0.3s';
  document.getElementById('showcase-player').src = showcasePlayers[0].src;
  setInterval(cycleShowcase, 4500);

  buildTeamSelectCards();
};

// ===== SCREEN MANAGEMENT =====
const app = {

  goToMenu() {
    // Hide overlays
    document.getElementById('intro-overlay').classList.add('hidden');
    document.getElementById('quarter-break').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    // Reset game state
    mode = 'MENU';
    if (renderer) renderer.domElement.style.display = 'none';
    switchScreen('main-menu');
  },

  goToTeamSelect() {
    buildTeamSelectCards();
    switchScreen('team-select');
  },

  startMatchup() {
    p1Team = TEAMS[selectedHomeTeamIdx];
    p2Team = TEAMS[selectedAwayTeamIdx];
    p1Idx = p1Team.players.findIndex(p => p.name === 'Will Harris');
    if (p1Idx < 0) p1Idx = 0;
    p2Idx = 0;
    is2P = false;

    // Reset game vars
    qtr = 1; timeClock = 720; shotClock = 24;
    momentumHome = 50; momentumAway = 50;
    players = []; mixers = [];
    playerBaseModel = null; playerAnimations = [];
    playerDribbleAnim = null; playerShootAnim = null;
    ballHolder = null; shotShooter = null;
    shotMeterActive = false; shotMeterVal = 0;
    document.getElementById('home-score').innerText = '0';
    document.getElementById('away-score').innerText = '0';
    document.getElementById('qtr-disp').innerText = '1';
    document.getElementById('game-clock').innerText = '12:00';
    document.getElementById('shot-clock').innerText = '24';
    document.getElementById('shot-meter-ui').classList.add('hidden');
    document.getElementById('hot-indicator').classList.remove('visible');
    document.getElementById('labels').innerHTML = '';

    switchScreen('hud');
    playIntroSequence(() => start2k26Game());
  },

  showRoster() {
    alert('ROSTER COMING SOON — Stay Wild!');
  },

  showOptions() {
    alert('OPTIONS COMING SOON');
  },

  quitGame() {
    alert('Thanks for playing RoarBall 2K26! 🐐');
  },

  skipIntro() {
    clearIntro();
    start2k26Game();
  }
};

// ===== TEAM SELECT CARDS =====
function buildTeamSelectCards() {
  ['home', 'away'].forEach(side => {
    const isHome = side === 'home';
    const container = document.getElementById(`${side}-team-cards`);
    container.innerHTML = '';
    TEAMS.forEach((team, idx) => {
      const card = document.createElement('div');
      card.className = 'team-card' + ((isHome ? selectedHomeTeamIdx : selectedAwayTeamIdx) === idx ? ' selected' : '');
      card.innerHTML = `
        <div class="team-card-color" style="background:#${team.color.toString(16).padStart(6,'0')}"></div>
        <div class="team-card-info">
          <h4>${team.name}</h4>
          <p>${team.location} • ${team.abbr}</p>
        </div>`;
      card.onclick = () => selectTeam(side, idx);
      container.appendChild(card);
    });
    updateSelectedDisplay(side);
  });
}

function selectTeam(side, idx) {
  if (side === 'home') selectedHomeTeamIdx = idx;
  else selectedAwayTeamIdx = idx;
  buildTeamSelectCards();
}

function updateSelectedDisplay(side) {
  const isHome = side === 'home';
  const team = TEAMS[isHome ? selectedHomeTeamIdx : selectedAwayTeamIdx];
  const colorHex = '#' + team.color.toString(16).padStart(6, '0');
  document.getElementById(`${side}-color-bar`).style.background = colorHex;
  document.getElementById(`${side}-team-name`).innerText = team.name;
  document.getElementById(`${side}-team-abbr`).innerText = team.abbr;
}

// ===== INTRO SEQUENCE =====
function playIntroSequence(onDone) {
  // Build player list: home team first, then away
  introPlayerList = [
    ...p1Team.players.slice(0, 5).map(p => ({ ...p, teamName: p1Team.name, teamColor: p1Team.color })),
    ...p2Team.players.slice(0, 5).map(p => ({ ...p, teamName: p2Team.name, teamColor: p2Team.color }))
  ];
  introIdx = 0;

  const overlay = document.getElementById('intro-overlay');
  overlay.classList.remove('hidden');
  showIntroPlayer(introIdx);

  let progress = 0;
  const totalMs = introPlayerList.length * INTRO_PER_PLAYER;

  introProgressInterval = setInterval(() => {
    progress += 50 / totalMs * 100;
    document.getElementById('intro-progress-fill').style.width = Math.min(100, progress) + '%';
  }, 50);

  introInterval = setInterval(() => {
    introIdx++;
    if (introIdx >= introPlayerList.length) {
      clearIntro();
      onDone();
    } else {
      showIntroPlayer(introIdx);
    }
  }, INTRO_PER_PLAYER);
}

function showIntroPlayer(idx) {
  const p = introPlayerList[idx];
  const colorHex = '#' + p.teamColor.toString(16).padStart(6, '0');

  document.getElementById('intro-team-banner').innerText = p.teamName.toUpperCase();
  document.getElementById('intro-team-banner').style.color = colorHex;
  document.getElementById('intro-name').innerText = p.name.toUpperCase();
  document.getElementById('intro-type').innerText = p.type.toUpperCase() + ' • ' + (p.pos || '');
  document.getElementById('intro-ovr').innerText = p.ovr || '';

  const statsEl = document.getElementById('intro-stats');
  statsEl.innerHTML = [
    { lbl: 'SPD', val: p.spd },
    { lbl: 'SHT', val: p.sht },
    { lbl: 'DRB', val: p.drb },
    { lbl: 'DEF', val: p.def },
    { lbl: 'STR', val: p.str }
  ].map(s => `<div class="intro-stat"><div class="intro-stat-val">${s.val}</div><div class="intro-stat-lbl">${s.lbl}</div></div>`).join('');

  // Flash effect
  const card = document.getElementById('intro-player-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'fadeUp 0.5s forwards';

  // Background spotlight color pulse
  document.getElementById('intro-overlay').style.background =
    `radial-gradient(ellipse at 50% 80%, ${colorHex}22 0%, #000 60%)`;
}

function clearIntro() {
  clearInterval(introInterval);
  clearInterval(introProgressInterval);
  introInterval = null; introProgressInterval = null;
  document.getElementById('intro-overlay').classList.add('hidden');
  document.getElementById('intro-progress-fill').style.width = '0%';
}

// ===== SCREEN SWITCHER =====
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
    el.classList.add('hidden');
  });
  const t = document.getElementById(id);
  if (t) {
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('active'), 30);
  }
}

// Global app reference for HTML onclick handlers
window.startGame = () => app.startMatchup();
window.showRoster = () => app.showRoster();
window.showOptions = () => app.showOptions();
window.quitGame = () => app.quitGame();
