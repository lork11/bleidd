const canvas = document.getElementById('carrom');
const ctx = canvas.getContext('2d');

// Load board
const board = new Image();
board.src = 'assets/board.png';

// Coins
const coins = [];
for (let i = 1; i <= 8; i++) {
  const w = new Image();
  const b = new Image();
  w.src = `assets/white${i}.png`;
  b.src = `assets/black${i}.png`;
  coins.push({ img: w, x: 100 + i*40, y: 250, vx:0, vy:0, type: 'white', pocketed: false });
  coins.push({ img: b, x: 100 + i*40, y: 350, vx:0, vy:0, type: 'black', pocketed: false });
}

// Queen
const queen = { img: new Image(), x: 280, y: 300, vx:0, vy:0, r: 15, pocketed: false };
queen.img.src = 'assets/queen.png';

// Striker
const striker = { img: new Image(), x: 300, y: 550, r: 20, vx:0, vy:0 };
striker.img.src = 'assets/striker.png';

// Load sounds
const soundHit = new Audio('sound/hit.wav');
const soundPocket = new Audio('sound/pocket.wav');
const soundQueen = new Audio('sound/queenpocket.mp3');

// Earthquake / shake effect
function earthquake(duration=500, magnitude=5) {
  const start = Date.now();
  function shake() {
    const elapsed = Date.now() - start;
    if(elapsed < duration){
      const dx = (Math.random()-0.5)*magnitude*2;
      const dy = (Math.random()-0.5)*magnitude*2;
      canvas.style.transform = `translate(${dx}px,${dy}px)`;
      // slight coin jitter for realism
      for(const c of coins) if(!c.pocketed){c.x += (Math.random()-0.5)*2; c.y += (Math.random()-0.5)*2;}
      if(!queen.pocketed){queen.x += (Math.random()-0.5)*2; queen.y += (Math.random()-0.5)*2;}
      requestAnimationFrame(shake);
    } else canvas.style.transform = `translate(0,0)`;
  }
  shake();
}

// Draw everything
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(board,0,0,600,600);

  for(const c of coins) if(!c.pocketed) ctx.drawImage(c.img, c.x, c.y, 30, 30);
  if(!queen.pocketed) ctx.drawImage(queen.img, queen.x, queen.y, 30,30);
  ctx.drawImage(striker.img, striker.x-20,striker.y-20,40,40);
}

// Simple physics
function update(){
  const friction = 0.98;

  // Striker
  striker.x += striker.vx;
  striker.y += striker.vy;
  striker.vx *= friction;
  striker.vy *= friction;

  // Coins
  for(const c of coins){
    c.x += c.vx;
    c.y += c.vy;
    c.vx *= friction;
    c.vy *= friction;
  }
  queen.x += queen.vx; queen.y += queen.vy;
  queen.vx *= friction; queen.vy *= friction;

  checkPocket();
  draw();
  requestAnimationFrame(update);
}

board.onload = () => {
  draw();
  update();
}

// Striker drag & release
let dragging = false, startPos = null;
canvas.addEventListener('mousedown', e => {
  if(Math.hypot(e.offsetX-striker.x, e.offsetY-striker.y) < striker.r){
    dragging = true;
    startPos = {x:e.offsetX, y:e.offsetY};
  }
});

canvas.addEventListener('mousemove', e => {
  if(dragging){
    striker.x = e.offsetX;
    striker.y = e.offsetY;
    draw();
  }
});

canvas.addEventListener('mouseup', e => {
  if(dragging){
    dragging=false;
    // set velocity based on drag
    striker.vx = (startPos.x - e.offsetX)/5;
    striker.vy = (startPos.y - e.offsetY)/5;
    soundHit.play();
    earthquake(300,5);
  }
});

// Simple pocket detection
const pockets = [
  {x:0,y:0},{x:570,y:0},{x:0,y:570},{x:570,y:570}
];

function checkPocket(){
  for(const c of coins){
    if(!c.pocketed){
      for(const p of pockets){
        if(Math.hypot(c.x-p.x,c.y-p.y)<20){
          c.pocketed=true;
          soundPocket.play();
          earthquake(200,3);
          break;
        }
      }
    }
  }
  if(!queen.pocketed){
    for(const p of pockets){
      if(Math.hypot(queen.x-p.x,queen.y-p.y)<20){
        queen.pocketed=true;
        soundQueen.play();
        earthquake(600,10);
        break;
      }
    }
  }
}
