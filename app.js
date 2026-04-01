let isGameLoading = false;
let currentScreen = 'main-menu';

const images = [
    'assets/roarball_2k26_cover_1775049000775.png',
    'assets/will_goat_1775049016052.png',
    'assets/jett_panther_1775049031196.png'
];

window.onload = () => {
    document.getElementById('menu-bg').src = images[0];
    document.getElementById('showcase-player').src = images[1];
    
    setInterval(() => {
        const showcase = document.getElementById('showcase-player');
        const infoName = document.querySelector('.player-info h3');
        const infoSub = document.querySelector('.player-info p');
        
        if(showcase.src.includes('will_goat')) {
            showcase.src = images[2];
            infoName.innerText = 'JETT FILLMORE';
            infoSub.innerText = 'OVR: 99 | PANTHER';
        } else {
            showcase.src = images[1];
            infoName.innerText = 'WILL HARRIS';
            infoSub.innerText = 'OVR: 85 | GOAT';
        }
    }, 5000);
};

function startGame() {
    if(isGameLoading) return;
    isGameLoading = true;
    switchScreen('hud');
    
    // Delay for transition
    setTimeout(() => {
        p1Team = TEAMS[0]; 
        p2Team = TEAMS[1]; 
        p1Idx = 5; // Will Harris
        p2Idx = 0; // Mane Attraction
        
        start2k26Game();
    }, 500);
}

function showRoster() {
    alert("Roster features unlock in full game!");
}

function showOptions() {
    alert("Options coming soon.");
}

function quitGame() {
    alert("Thanks for playing RoarBall 2K26!");
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        if(el.id !== screenId && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
        }
    });
    
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);
    }
}
