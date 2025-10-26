const canvas = document.getElementById('carrom');
const ctx = canvas.getContext('2d');

// Load board
const board = new Image();
board.src = 'assets/board.png';

// Coins
const coins = [];
for(let i=1;i<=8;i++){
  const w = new Image(); w.src=`assets/white${i}.png`;
  const b = new Image(); b.src=`assets/black${i}.png`;
  coins.push({img:w,x:100+i*40,y:250,vx:0,vy:0,type:'white',pocketed:false,r:15});
  coins.push({img:b,x:100+i*40,y:350,vx:0,vy:0,type:'black',pocketed:false,r:15});
}

// Queen
const queen = {img:new Image(),x:280,y:300,vx:0,vy:0,r:15,pocketed:false};
queen.img.src='assets/queen.png';

// Striker
const striker = {img:new Image(),x:300,y:550,vx:0,vy:0,r:20};
striker.img.src='assets/striker.png';

// Load sounds
const soundHit = new Audio('sound/hit.wav');
const soundPocket = new Audio('sound/pocket.wav');
const soundQueen = new Audio('sound/queenpocket.mp3');

// Earthquake / shake effect
function earthquake(duration=500,magnitude=5){
  const start=Date.now();
  function shake(){
    const elapsed=Date.now()-start;
    if(elapsed<duration){
      const dx=(Math.random()-0.5)*magnitude*2;
      const dy=(Math.random()-0.5)*magnitude*2;
      canvas.style.transform=`translate(${dx}px,${dy}px)`;
      // slight coin jitter
      for(const c of coins) if(!c.pocketed){c.x+=(Math.random()-0.5)*2;c.y+=(Math.random()-0.5)*2;}
      if(!queen.pocketed){queen.x+=(Math.random()-0.5)*2; queen.y+=(Math.random()-0.5)*2;}
      requestAnimationFrame(shake);
    } else canvas.style.transform='translate(0,0)';
  }
  shake();
}

// Draw everything
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(board,0,0,600,600);
  for(const c of coins) if(!c.pocketed) ctx.drawImage(c.img,c.x-15,c.y-15,30,30);
  if(!queen.pocketed) ctx.drawImage(queen.img,queen.x-15,queen.y-15,30,30);
  ctx.drawImage(striker.img,striker.x-striker.r,striker.y-striker.r,striker.r*2,striker.r*2);
}

// Simple physics update
function update(){
  const friction = 0.98;

  // Move striker
  striker.x += striker.vx; striker.y += striker.vy;
  striker.vx *= friction; striker.vy *= friction;
  keepInsideBoard(striker);

  // Move coins
  for(const c of coins){
    c.x += c.vx; c.y += c.vy;
    c.vx *= friction; c.vy *= friction;
    keepInsideBoard(c);
  }

  // Queen
  queen.x += queen.vx; queen.y += queen.vy;
  queen.vx *= friction; queen.vy *= friction;
  keepInsideBoard(queen);

  // Coin collisions
  handleCollisions();

  checkPocket();
  draw();
  requestAnimationFrame(update);
}

board.onload = ()=>{
  draw();
  update();
}

// Keep piece inside board
function keepInsideBoard(p){
  if(p.x<p.r)p.x=p.r, p.vx*=-0.5;
  if(p.x>600-p.r)p.x=600-p.r, p.vx*=-0.5;
  if(p.y<p.r)p.y=p.r, p.vy*=-0.5;
  if(p.y>600-p.r)p.y=600-p.r, p.vy*=-0.5;
}

// Striker drag & release
let dragging=false, startPos=null;
canvas.addEventListener('mousedown', e=>{
  if(Math.hypot(e.offsetX-striker.x,e.offsetY-striker.y)<striker.r){
    dragging=true;
    startPos={x:e.offsetX,y:e.offsetY};
  }
});
canvas.addEventListener('mousemove', e=>{
  if(dragging){striker.x=e.offsetX; striker.y=e.offsetY; draw();}
});
canvas.addEventListener('mouseup', e=>{
  if(dragging){
    dragging=false;
    striker.vx=(startPos.x-e.offsetX)/5;
    striker.vy=(startPos.y-e.offsetY)/5;
    soundHit.play();
    earthquake(300,5);
  }
});

// Pocket positions
const pockets=[
  {x:0,y:0},{x:570,y:0},{x:0,y:570},{x:570,y:570}
];

function checkPocket(){
  // Coins
  for(const c of coins){
    if(!c.pocketed){
      for(const p of pockets){
        if(Math.hypot(c.x-p.x,c.y-p.y)<20){
          c.pocketed=true;
          soundPocket.play();
          earthquake(200,3);
          c.vx=0;c.vy=0;
          break;
        }
      }
    }
  }
  // Queen
  if(!queen.pocketed){
    for(const p of pockets){
      if(Math.hypot(queen.x-p.x,queen.y-p.y)<20){
        queen.pocketed=true;
        soundQueen.play();
        earthquake(600,10);
        queen.vx=0; queen.vy=0;
        break;
      }
    }
  }
}

// Coin-to-coin collisions
function handleCollisions(){
  const all=[...coins,queen];
  for(let i=0;i<all.length;i++){
    const a=all[i];
    if(a.pocketed) continue;
    for(let j=i+1;j<all.length;j++){
      const b=all[j];
      if(b.pocketed) continue;
      const dx=b.x-a.x, dy=b.y-a.y;
      const dist=Math.hypot(dx,dy);
      const minDist=a.r+b.r;
      if(dist<minDist && dist>0){
        const angle=Math.atan2(dy,dx);
        const targetX=a.x+Math.cos(angle)*minDist;
        const targetY=a.y+Math.sin(angle)*minDist;
        const ax=(targetX-b.x)*0.5;
        const ay=(targetY-b.y)*0.5;
        a.x-=ax; a.y-=ay; b.x+=ax; b.y+=ay;

        // Simple velocity exchange
        const vxTotal=a.vx-b.vx;
        const vyTotal=a.vy-b.vy;
        a.vx-=vxTotal*0.5; a.vy-=vyTotal*0.5;
        b.vx+=vxTotal*0.5; b.vy+=vyTotal*0.5;
      }
    }
  }
}
