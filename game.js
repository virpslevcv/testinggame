const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const playButton = document.querySelector('#play-button');
const playIcon = document.querySelector('#play-icon');
const playLabel = document.querySelector('#play-label');
const dialogEyebrow = document.querySelector('#dialog-eyebrow');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCopy = document.querySelector('#dialog-copy');
const distanceReadout = document.querySelector('#run-distance');
const bestReadout = document.querySelector('#best-distance');
const progressFill = document.querySelector('#progress-fill');
const musicToggle = document.querySelector('#music-toggle');
const musicState = document.querySelector('#music-state');
const levelSubtitle = document.querySelector('#brand-sub');
const levelButtons = [...document.querySelectorAll('.level-button')];

const WIDTH = 960;
const HEIGHT = 540;
const PLAYER_X = 225;
const GROUND_Y = 430;
const CUBE_SIZE = 30;
const GRAVITY = 1450;
const JUMP_VELOCITY = -575;
const AUTO_JUMP_DISTANCE = 105;
const palettes = {
  mint: '#72f5be',
  coral: '#ff755d',
  yellow: '#f3d16b',
  paper: '#e5f1eb',
};

const levels = [
  {
    name: 'WARM-UP',
    length: 6200,
    speed: 230,
    obstacles: [
      { x: 560, type: 'spike' }, { x: 1200, type: 'spike' }, { x: 1840, type: 'block' },
      { x: 2480, type: 'spike' }, { x: 3120, type: 'spike' }, { x: 3760, type: 'block' },
      { x: 4400, type: 'spike' }, { x: 5040, type: 'spike' }, { x: 5680, type: 'block' },
    ],
  },
  {
    name: 'STEP UP',
    length: 6800,
    speed: 250,
    obstacles: [
      { x: 560, type: 'spike' }, { x: 1130, type: 'double' }, { x: 1770, type: 'block' },
      { x: 2400, type: 'double' }, { x: 3040, type: 'spike' }, { x: 3670, type: 'block' },
      { x: 4300, type: 'double' }, { x: 4930, type: 'spike' }, { x: 5560, type: 'block' },
      { x: 6190, type: 'double' },
    ],
  },
  {
    name: 'FULL SEND',
    length: 7200,
    speed: 270,
    obstacles: [
      { x: 560, type: 'spike' }, { x: 1060, type: 'double' }, { x: 1590, type: 'block' },
      { x: 2110, type: 'triple' }, { x: 2670, type: 'double' }, { x: 3230, type: 'block' },
      { x: 3790, type: 'triple' }, { x: 4370, type: 'spike' }, { x: 4930, type: 'double' },
      { x: 5490, type: 'block' }, { x: 6050, type: 'triple' }, { x: 6610, type: 'double' },
    ],
  },
];

const obstacleShapes = {
  spike: { width: 32, height: 34, count: 1 },
  double: { width: 62, height: 34, count: 2 },
  triple: { width: 92, height: 34, count: 3 },
  block: { width: 38, height: 42, count: 1 },
};

const backgroundMarks = Array.from({ length: 40 }, (_, index) => ({
  x: (index * 173 + 29) % WIDTH,
  y: (index * 97 + 47) % HEIGHT,
  size: index % 5 === 0 ? 2 : 1,
}));

let state = 'ready';
let held = false;
let jumpQueued = false;
let distance = 0;
let playerY = GROUND_Y - CUBE_SIZE / 2;
let velocityY = 0;
let grounded = true;
let rotation = 0;
let particles = [];
let lastFrame = 0;
let best = loadBest();
let selectedLevel = 0;
let scaleX = 1;
let scaleY = 1;
let musicEnabled = true;
let audioContext = null;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;
let nextMusicTime = 0;

const melody = [72, null, 79, 76, 79, null, 76, 72, 69, null, 76, 72, 77, null, 81, 77];
const chords = [
  [60, 64, 67],
  [55, 59, 62],
  [57, 60, 64],
  [53, 57, 60],
];
const musicStepDuration = 60 / 124 / 2;

bestReadout.textContent = String(best).padStart(3, '0');

function loadBest() {
  try {
    return Number(localStorage.getItem('voltrun-best')) || 0;
  } catch {
    return 0;
  }
}

function activeLevel() {
  return levels[selectedLevel];
}

function selectLevel(index) {
  if (state === 'running') return;
  selectedLevel = index;
  const level = activeLevel();
  const levelNumber = String(index + 1).padStart(2, '0');
  levelSubtitle.textContent = `CUBE RUNNER · LEVEL ${levelNumber}`;
  levelButtons.forEach((button, buttonIndex) => {
    button.setAttribute('aria-pressed', String(buttonIndex === index));
  });
  distanceReadout.textContent = '000';
  progressFill.style.width = '0%';
  dialogEyebrow.textContent = `LEVEL ${levelNumber} · ${level.name}`;
  dialogTitle.textContent = 'Ready?';
  dialogCopy.textContent = 'Auto-jump is on. Choose a level and go.';
  playIcon.textContent = '▶';
  playLabel.textContent = state === 'ready' ? 'Start run' : 'Start level';
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  scaleX = canvas.width / WIDTH;
  scaleY = canvas.height / HEIGHT;
}

function startRun() {
  distance = 0;
  playerY = GROUND_Y - CUBE_SIZE / 2;
  velocityY = 0;
  grounded = true;
  rotation = 0;
  jumpQueued = false;
  particles = [];
  state = 'running';
  held = false;
  startMusic();
  overlay.classList.add('hidden');
  progressFill.style.width = '0%';
  distanceReadout.textContent = '000';
}

function finishRun(won = false) {
  if (state !== 'running') return;
  state = won ? 'won' : 'dead';
  held = false;
  jumpQueued = false;
  particles = Array.from({ length: 24 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 24;
    return { x: PLAYER_X, y: playerY, vx: Math.cos(angle) * (65 + (index % 4) * 28), vy: Math.sin(angle) * (65 + (index % 4) * 28), life: 0.7 + (index % 5) * 0.08 };
  });
  const score = Math.floor(distance / 10);
  if (score > best) {
    best = score;
    bestReadout.textContent = String(best).padStart(3, '0');
    try { localStorage.setItem('voltrun-best', String(best)); } catch { /* Storage is optional. */ }
  }
  dialogEyebrow.textContent = won ? 'LEVEL COMPLETE' : 'CRASHED · ' + score + 'M';
  dialogTitle.textContent = won ? 'Clean run.' : 'Try again?';
  dialogCopy.textContent = won ? 'You made it through the level.' : 'Time your jump and keep moving.';
  playIcon.textContent = '↻';
  playLabel.textContent = 'Try again';
  overlay.classList.remove('hidden');
}

function obstacleScreenX(obstacle) {
  return PLAYER_X + obstacle.x - distance;
}

function collides() {
  const playerLeft = distance + PLAYER_X - CUBE_SIZE / 2;
  const playerRight = distance + PLAYER_X + CUBE_SIZE / 2;
  const playerTop = playerY - CUBE_SIZE / 2;
  const playerBottom = playerY + CUBE_SIZE / 2;
  for (const obstacle of activeLevel().obstacles) {
    const shape = obstacleShapes[obstacle.type];
    const inset = obstacle.type === 'block' ? 0 : 6;
    const overlapsX = playerRight > obstacle.x + inset && playerLeft < obstacle.x + shape.width - inset;
    const overlapsY = playerBottom > GROUND_Y - shape.height && playerTop < GROUND_Y;
    if (overlapsX && overlapsY) return true;
  }
  return false;
}

function update(delta) {
  if (state === 'running') {
    const level = activeLevel();
    distance += level.speed * delta;
    const playerWorldX = distance + PLAYER_X;
    const nextObstacle = level.obstacles.find(obstacle => obstacle.x + obstacleShapes[obstacle.type].width > playerWorldX);
    const extraWidth = nextObstacle ? obstacleShapes[nextObstacle.type].width - obstacleShapes.spike.width : 0;
    const autoJumpDistance = AUTO_JUMP_DISTANCE - extraWidth * 0.8;
    const autoJump = nextObstacle && nextObstacle.x - playerWorldX <= autoJumpDistance;
    if (grounded && (jumpQueued || held || autoJump)) {
      velocityY = JUMP_VELOCITY;
      grounded = false;
      jumpQueued = false;
    }
    if (!grounded) {
      playerY += velocityY * delta;
      velocityY += GRAVITY * delta;
      rotation += level.speed * delta / CUBE_SIZE * (Math.PI / 2);
      const floorCenter = GROUND_Y - CUBE_SIZE / 2;
      if (playerY >= floorCenter) {
        playerY = floorCenter;
        velocityY = 0;
        grounded = true;
        rotation = Math.round(rotation / (Math.PI / 2)) * (Math.PI / 2);
      }
    }
    const meters = Math.floor(distance / 10);
    distanceReadout.textContent = String(meters).padStart(3, '0');
    progressFill.style.width = `${Math.min(100, (distance / level.length) * 100)}%`;
    if (collides()) finishRun();
    else if (distance >= level.length) finishRun(true);
  }
  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  }
  particles = particles.filter(particle => particle.life > 0);
}

function drawBackground() {
  ctx.fillStyle = '#0c1413';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(PLAYER_X, playerY, 20, PLAYER_X, playerY, 470);
  glow.addColorStop(0, 'rgba(25, 88, 68, 0.17)');
  glow.addColorStop(1, 'rgba(10, 19, 17, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(142, 189, 169, .055)';
  ctx.lineWidth = 1;
  for (let x = -((distance * 0.4) % 48); x < WIDTH; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 24; y < HEIGHT; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  for (const mark of backgroundMarks) {
    const x = ((mark.x - distance * 0.13) % WIDTH + WIDTH) % WIDTH;
    ctx.fillStyle = 'rgba(202, 241, 220, .22)';
    ctx.fillRect(x, mark.y, mark.size, mark.size);
  }

  ctx.fillStyle = '#17221f';
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.fillStyle = 'rgba(114, 245, 190, .12)';
  ctx.fillRect(0, GROUND_Y, WIDTH, 2);
  ctx.strokeStyle = 'rgba(202, 241, 220, .08)';
  for (let x = -((distance * 0.6) % 40); x < WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, GROUND_Y + 2); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
}

function drawObstacle(obstacle) {
  const x = obstacleScreenX(obstacle);
  const shape = obstacleShapes[obstacle.type];
  if (x < -shape.width - 10 || x > WIDTH + 10) return;
  ctx.fillStyle = palettes.coral;
  ctx.shadowColor = palettes.coral;
  ctx.shadowBlur = 14;
  if (obstacle.type === 'block') {
    ctx.fillRect(x, GROUND_Y - shape.height, shape.width, shape.height);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffb09f';
    ctx.fillRect(x + 5, GROUND_Y - shape.height + 5, shape.width - 10, 3);
    ctx.fillStyle = '#542820';
    ctx.fillRect(x + 8, GROUND_Y - 15, 5, 5);
    ctx.fillRect(x + 25, GROUND_Y - 15, 5, 5);
  } else {
    for (let index = 0; index < shape.count; index += 1) {
      const spikeX = x + index * 30;
      ctx.beginPath();
      ctx.moveTo(spikeX, GROUND_Y);
      ctx.lineTo(spikeX + 16, GROUND_Y - shape.height);
      ctx.lineTo(spikeX + 32, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffb09f';
      ctx.beginPath();
      ctx.moveTo(spikeX + 9, GROUND_Y - 15);
      ctx.lineTo(spikeX + 16, GROUND_Y - shape.height + 6);
      ctx.lineTo(spikeX + 22, GROUND_Y - 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = palettes.coral;
      ctx.shadowColor = palettes.coral;
      ctx.shadowBlur = 14;
    }
  }
}

function drawCube() {
  if (state === 'dead' || state === 'won') return;
  ctx.save();
  ctx.translate(PLAYER_X, playerY);
  ctx.rotate(rotation);
  ctx.shadowColor = palettes.mint;
  ctx.shadowBlur = 18;
  ctx.fillStyle = palettes.mint;
  ctx.fillRect(-CUBE_SIZE / 2, -CUBE_SIZE / 2, CUBE_SIZE, CUBE_SIZE);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#e9fff4';
  ctx.lineWidth = 2;
  ctx.strokeRect(-10, -10, 20, 20);
  ctx.fillStyle = '#173a2d';
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = palettes.mint;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  drawBackground();
  for (const obstacle of activeLevel().obstacles) drawObstacle(obstacle);
  drawCube();
  drawParticles();
  if (state === 'ready') {
    ctx.fillStyle = 'rgba(229, 241, 235, .55)';
    ctx.font = '10px "DM Mono", monospace';
    ctx.fillText('DISTANCE', 28, 48);
    ctx.fillStyle = 'rgba(114, 245, 190, .7)';
    ctx.fillRect(28, 57, 55, 2);
  }
}

function frame(timestamp) {
  const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, 0.04);
  lastFrame = timestamp;
  update(delta);
  render();
  requestAnimationFrame(frame);
}

function midiFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function playTone(note, time, duration, waveform, volume) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(midiFrequency(note), time);
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(volume, time + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(envelope);
  envelope.connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
}

function playKick(time) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(135, time);
  oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.13);
  envelope.gain.setValueAtTime(0.09, time);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
  oscillator.connect(envelope);
  envelope.connect(musicGain);
  oscillator.start(time);
  oscillator.stop(time + 0.16);
}

function playSnare(time) {
  const bufferLength = Math.floor(audioContext.sampleRate * 0.09);
  const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < bufferLength; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / bufferLength);
  }
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const envelope = audioContext.createGain();
  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  envelope.gain.setValueAtTime(0.04, time);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  noise.connect(filter);
  filter.connect(envelope);
  envelope.connect(musicGain);
  noise.start(time);
  noise.stop(time + 0.1);
}

function scheduleMusicStep(time) {
  const note = melody[musicStep];
  const chord = chords[Math.floor(musicStep / 4)];
  if (note !== null) playTone(note, time, 0.17, 'square', 0.025);
  if (musicStep % 2 === 0) playTone(chord[0] - 24, time, 0.22, 'triangle', 0.04);
  if (musicStep % 4 === 0) {
    for (const chordNote of chord) playTone(chordNote, time, 0.85, 'triangle', 0.008);
    playKick(time);
  } else if (musicStep % 4 === 2) {
    playSnare(time);
  }
  musicStep = (musicStep + 1) % melody.length;
}

function pumpMusic() {
  if (!musicEnabled || !audioContext) return;
  const now = audioContext.currentTime;
  if (nextMusicTime < now - 0.25) nextMusicTime = now + 0.05;
  while (nextMusicTime < now + 0.12) {
    scheduleMusicStep(nextMusicTime);
    nextMusicTime += musicStepDuration;
  }
}

function startMusic() {
  if (!musicEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    musicGain = audioContext.createGain();
    musicGain.gain.value = 0.0001;
    musicGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  if (!musicTimer) {
    nextMusicTime = audioContext.currentTime + 0.05;
    musicTimer = window.setInterval(pumpMusic, 25);
  }
  musicGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicGain.gain.setTargetAtTime(0.32, audioContext.currentTime, 0.08);
}

function updateMusicButton() {
  musicState.textContent = musicEnabled ? 'ON' : 'OFF';
  musicToggle.setAttribute('aria-label', musicEnabled ? 'Mute music' : 'Turn music on');
  musicToggle.title = musicEnabled ? 'Mute music' : 'Turn music on';
}

musicToggle.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  updateMusicButton();
  if (musicEnabled) {
    if (audioContext) nextMusicTime = audioContext.currentTime + 0.05;
    startMusic();
  } else if (musicGain && audioContext) {
    musicGain.gain.cancelScheduledValues(audioContext.currentTime);
    musicGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
  }
});

levelButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectLevel(index));
});
playButton.addEventListener('click', startRun);
canvas.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (state !== 'running') startRun();
  held = true;
  jumpQueued = true;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup', () => { held = false; });
canvas.addEventListener('pointercancel', () => { held = false; });
canvas.addEventListener('lostpointercapture', () => { held = false; });
window.addEventListener('keydown', event => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault();
    if (state !== 'running') startRun();
    if (!held) jumpQueued = true;
    held = true;
  } else if (event.code === 'KeyR' && state !== 'running') {
    startRun();
  }
});
window.addEventListener('keyup', event => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') held = false;
});
window.addEventListener('blur', () => { held = false; });
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
requestAnimationFrame(frame);