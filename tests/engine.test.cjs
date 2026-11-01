const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../src/engine.js');
function game(){const s=E.createState();E.start(s);s.spawnIn=100;return s;}
function advance(s,seconds,input={}){for(let i=0;i<Math.ceil(seconds/.05);i++)E.update(s,input,.05,()=>.1);}
function land(s){for(let i=0;i<30&&s.playerShots.length;i++)E.update(s,{},.01,()=>.1);assert.equal(s.playerShots.length,0);}
function fireAt(s,x=1000,y=730){Object.assign(s.player,{aimX:x,aimY:y,facing:x>=s.player.x?1:-1});return E.fire(s,()=>0);}
test('movement clamps to street and pauses without advancing',()=>{const s=game();advance(s,10,{left:true});assert.equal(s.player.x,110);s.mode='paused';const time=s.time;advance(s,1,{right:true});assert.equal(s.time,time);assert.equal(s.player.x,110);});
test('shot only damages the enemy at the endpoint after arrival and consumes one shell',()=>{const s=game();s.enemies=[{id:1,x:900,hp:2},{id:2,x:1000,hp:2},{id:3,x:700,hp:2}];assert.equal(fireAt(s),true);assert.equal(s.enemies.length,3);assert.equal(s.score,0);land(s);assert.deepEqual(s.enemies.map(e=>e.id),[1,3]);assert.equal(s.score,100);assert.equal(s.player.ammo,1);assert.equal(E.fire(s),false);});
test('reload takes time and blocks firing; empty weapon reloads automatically',()=>{const s=game();s.player.ammo=0;E.fire(s);assert.equal(s.player.reload,4);assert.equal(E.fire(s),false);advance(s,1);assert.equal(s.player.ammo,0);advance(s,3.05);assert.equal(s.player.ammo,2);assert.equal(s.player.reload,0);});
test('fast projectile crossing player hits even without exact point overlap',()=>{const s=game();s.shots=[{x:s.player.x-30,vx:2000,y:720,life:1}];E.update(s,{},.05);assert.equal(s.player.hp,84);assert.equal(s.shots.length,0);});
test('wave intermission heals and refills then third wave ends in victory',()=>{const s=game();s.spawned=1;s.player.hp=50;E.update(s,{},.05);assert.equal(s.intermission,3);advance(s,3.1);assert.equal(s.wave,2);assert.equal(s.player.hp,70);s.wave=3;s.spawned=2;s.enemies=[];E.update(s,{},.05);assert.equal(s.mode,'won');});
test('death stops simulation and restart removes old entities',()=>{const s=game();E.damage(s,100);assert.equal(s.mode,'lost');const time=s.time;advance(s,1);assert.equal(s.time,time);s.shots.push({});E.start(s);assert.equal(s.player.hp,100);assert.equal(s.shots.length,0);assert.equal(s.score,0);assert.equal(s.mode,'playing');});

test('crouch requires hold, blocks movement, and release restores movement',()=>{const s=game(),x=s.player.x;advance(s,.3,{crouch:true,right:true});assert.equal(s.player.x,x);assert.ok(s.player.crouch>.9);advance(s,.1,{right:true});assert.ok(s.player.x>x);assert.equal(s.player.crouching,false);});
test('jump has flight, landing and requires a fresh press',()=>{const s=game();advance(s,.2,{jump:true});assert.ok(s.player.y<0);assert.equal(s.player.grounded,false);advance(s,1,{jump:true});assert.equal(s.player.y,0);advance(s,.1,{});advance(s,.1,{jump:true});assert.ok(s.player.y<0);});
test('holding aim settles, crouch improves, movement and recoil worsen spread',()=>{const s=game();advance(s,2,{aim:true});const standing=s.player.spread;advance(s,1,{aim:true,crouch:true});assert.ok(s.player.spread<standing);const rested=s.player.spread;E.fire(s,()=>.5);assert.ok(E.spread(s.player)>rested);advance(s,2,{aim:true,right:true});assert.ok(s.player.spread>standing);});
test('aiming away misses, mouse on left changes facing',()=>{const s=game();s.enemies=[{id:1,x:1000,hp:2,attack:100,phase:0,hit:0}];E.update(s,{aimX:1000,aimY:100},.01);E.fire(s,()=>.5);assert.equal(s.enemies[0].hp,2);E.update(s,{aimX:100,aimY:700},.01);assert.equal(s.player.facing,-1);});
test('crouch ducks under incoming rounds while standing takes damage',()=>{const s=game();E.update(s,{crouch:true},.05);s.shots=[{x:s.player.x-30,vx:2000,y:720,life:1}];E.update(s,{crouch:true},.05);assert.equal(s.player.hp,100);});
test('spread changes the endpoint in both screen axes',()=>{const a=game(),b=game();let next=0;E.fire(a,()=>[1,0][next++]);next=0;E.fire(b,()=>[1,.25][next++]);assert.ok(a.playerShots[0].endX>b.playerShots[0].endX);assert.ok(a.playerShots[0].endY<b.playerShots[0].endY);});

test('drawn aim poses raise, hold, lower and restart without looping',()=>{const s=game(),raising=new Set(),lowering=new Set();for(let i=0;i<20;i++){E.update(s,{aim:true},.05);raising.add(E.aimFrame(s.player));}assert.deepEqual([...raising],[0,1,2,3]);assert.equal(E.aimFrame(s.player),3);for(let i=0;i<20;i++){E.update(s,{},.05);lowering.add(E.aimFrame(s.player));}assert.deepEqual([...lowering],[4,5,6,7]);E.start(s);assert.equal(E.aimFrame(s.player),7);});
test('painted barrel and shot ray align with cursor across poses and facings',()=>{const s=game(),p=s.player;for(const facing of [-1,1])for(const aiming of [false,true])for(const blend of [0,.3,.6,1])for(const height of [200,650,1000]){Object.assign(p,{facing,aiming,aimBlend:blend,aimX:p.x+facing*650,aimY:height});const w=E.weaponPose(p),dx=p.aimX-w.muzzleX,dy=p.aimY-w.muzzleY;assert.ok(Math.abs(dx*Math.sin(w.angle)-dy*Math.cos(w.angle))<1e-8);assert.ok(dx*Math.cos(w.angle)+dy*Math.sin(w.angle)>0);}});

test('reload plays all eight poses once, pauses with simulation, and refills only on completion',()=>{
  const s=game();s.player.ammo=0;s.player.aiming=true;s.player.steady=1;E.reload(s);
  assert.equal(s.player.aiming,false);assert.equal(s.player.steady,0);
  const frames=new Set([E.reloadFrame(s.player)]);
  for(let i=0;i<40;i++){E.update(s,{},.05);frames.add(E.reloadFrame(s.player));assert.equal(s.player.ammo,0);assert.equal(E.fire(s),false);}
  const remaining=s.player.reload,pose=E.reloadFrame(s.player);s.mode='paused';advance(s,1);
  assert.equal(s.player.reload,remaining);assert.equal(E.reloadFrame(s.player),pose);
  s.mode='playing';for(let i=0;i<39;i++){E.update(s,{},.05);frames.add(E.reloadFrame(s.player));assert.equal(s.player.ammo,0);}
  assert.deepEqual([...frames],[0,1,2,3,4,5,6,7]);advance(s,.1);
  assert.equal(s.player.ammo,2);assert.equal(E.reloadFrame(s.player),-1);
});
test('reload keeps progressing through movement, crouch and facing changes; restart clears it',()=>{
  const s=game();s.player.ammo=1;E.reload(s);advance(s,.6,{right:true,aimX:1400,aimY:700});
  const x=s.player.x,remaining=s.player.reload;assert.ok(x>768);
  advance(s,.6,{crouch:true,right:true,aimX:0,aimY:700});assert.equal(s.player.x,x);assert.equal(s.player.facing,-1);
  assert.ok(s.player.reload<remaining);const saved=s.player.reload;E.reload(s);assert.equal(s.player.reload,saved);
  E.start(s);assert.equal(E.reloadFrame(s.player),-1);assert.equal(s.player.ammo,2);
});

test('reduced waves spawn exactly 1, 1 and 2 enemies, then end in victory',()=>{
 const s=game();s.player.invulnerable=10000;s.spawnIn=0;const counts=[];
 for(const expected of [1,1,2]){
   advance(s,12);counts.push(s.spawned);assert.equal(s.enemies.length,expected);
   assert.equal(s.intermission,0);s.enemies=[];E.update(s,{},.05);
   if(s.wave<3){assert.equal(s.intermission,3);advance(s,3.05);}else assert.equal(s.mode,'won');
 }
 assert.deepEqual(counts,[1,1,2]);assert.equal(counts.reduce((a,b)=>a+b),4);
});

test('enemy rounds and muzzle flashes start at the painted barrel in every walking pose and facing',()=>{
 for(const facing of [-1,1])for(const moving of [false,true])for(let phase=0;phase<8;phase++){
  const s=game(),e={id:1,x:s.player.x-facing*(moving?500:300),hp:2,phase,attack:0,hit:0,facing};s.enemies=[e];
  E.update(s,{},.01);const muzzle=E.enemyPose(e),shot=s.shots[0],flash=s.effects.find(effect=>effect.type==='flash');
  assert.equal(e.moving,moving);assert.ok(shot);assert.equal(shot.previousX,muzzle.muzzleX);assert.equal(shot.y,muzzle.muzzleY);
  assert.equal(shot.x,muzzle.muzzleX+facing*550*.01);assert.equal(flash.x,muzzle.muzzleX);assert.equal(flash.y,muzzle.muzzleY);
  assert.ok((muzzle.muzzleX-e.x)*facing>0);
 }
});
test('enemy walk advances with distance travelled and stops on reaching shooting range',()=>{
 const s=game(),e={id:1,x:1100,hp:2,phase:0,attack:100,hit:0,facing:-1};s.enemies=[e];
 E.update(s,{},.05);assert.equal(e.moving,true);assert.ok(e.x<1100);assert.ok(e.phase>0);
 const phase=e.phase;E.update(s,{},.05);assert.equal(e.moving,false);assert.equal(e.phase,phase);assert.equal(E.enemyPose(e).kind,'stand');
});
test('a defeated enemy falls through all eight frames, cannot attack or score twice, and fades away',()=>{
 const s=game();s.enemies=[{id:1,x:1000,hp:2,phase:0,attack:100,hit:0,facing:-1}];fireAt(s);land(s);
 assert.equal(s.enemies.length,0);assert.equal(s.corpses.length,1);assert.equal(s.score,100);assert.equal(s.kills,1);
 const body=s.corpses[0],frames=new Set([E.enemyPose(body).frame]);
 for(let i=0;i<22;i++){E.update(s,{},.05);frames.add(E.enemyPose(body).frame);}
 assert.deepEqual([...frames],[0,1,2,3,4,5,6,7]);assert.equal(s.shots.length,0);assert.equal(s.events.includes('enemyShot'),false);
 E.fire(s,()=>.5);assert.equal(s.score,100);assert.equal(s.kills,1);assert.equal(s.corpses.length,1);
 advance(s,2.5);assert.equal(s.corpses.length,0);
});
test('falling pauses with the game and restart clears bodies',()=>{
 const s=game();s.enemies=[{id:1,x:1000,hp:2,facing:-1}];fireAt(s);land(s);advance(s,.3);
 const body=s.corpses[0],time=body.fallTime,frame=E.enemyPose(body).frame;s.mode='paused';advance(s,1);
 assert.equal(body.fallTime,time);assert.equal(E.enemyPose(body).frame,frame);
 E.start(s);assert.equal(s.corpses.length,0);assert.equal(s.score,0);
});
test('wave clear and victory wait until the final enemy has reached the ground',()=>{
 for(const wave of [1,3]){
  const s=game();s.wave=wave;s.spawned=E.WAVE_COUNTS[wave-1];s.enemies=[{id:1,x:1000,hp:2,facing:-1}];fireAt(s);land(s);
  advance(s,.95);assert.equal(s.mode,'playing');assert.equal(s.intermission,0);
  advance(s,.15);assert.equal(E.enemyPose(s.corpses[0]).frame,7);
  if(wave===3)assert.equal(s.mode,'won');else assert.ok(s.intermission>0);
 }
});
