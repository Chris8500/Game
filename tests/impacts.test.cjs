const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../src/engine.js');
function game(){const s=E.createState();E.start(s);s.spawnIn=100;s.player.invulnerable=100;return s;}
function foe(x=1000,id=1){return {id,x,hp:2,facing:-1,phase:0,moving:false,attack:100,hit:0};}
function aim(s,x,y){Object.assign(s.player,{aimX:x,aimY:y,facing:x>=s.player.x?1:-1});}
function land(s){for(let i=0;i<30&&s.playerShots.length;i++)E.update(s,{},.01,()=>.1);assert.equal(s.playerShots.length,0);}
function samples(circle){const points=[];for(let i=0;i<40;i++)for(let j=0;j<40;j++){let n=0;points.push(E.sampleImpact(circle,()=>[(i+.5)/40,(j+.5)/40][n++]));}return points;}

test('impact points fill the circular area uniformly, including both axes and the edge',()=>{
 const circle={x:100,y:200,radius:80},points=samples(circle);
 for(const point of points)assert.ok(Math.hypot(point.x-circle.x,point.y-circle.y)<=circle.radius);
 const mean=key=>points.reduce((total,p)=>total+p[key],0)/points.length;
 assert.ok(Math.abs(mean('x')-circle.x)<1e-9);assert.ok(Math.abs(mean('y')-circle.y)<1e-9);
 const squared=points.reduce((sum,p)=>sum+(p.x-circle.x)**2+(p.y-circle.y)**2,0)/points.length;
 assert.ok(Math.abs(squared-circle.radius**2/2)<1e-8);
 let i=0;assert.deepEqual(E.sampleImpact(circle,()=>[1,0][i++]),{x:180,y:200});
});
test('shot uses the displayed circle before recoil and retains its endpoint when aim changes',()=>{
 const s=game();aim(s,1200,600);const before=E.aimCircle(s.player),w=E.weaponPose(s.player);E.fire(s,()=>.75);
 const shot=s.playerShots[0],endpoint=[shot.endX,shot.endY];assert.deepEqual(shot.circle,before);
 assert.equal(shot.startX,w.muzzleX);assert.equal(shot.startY,w.muzzleY);
 assert.ok(Math.hypot(shot.endX-before.x,shot.endY-before.y)<=before.radius);
 assert.ok(E.aimCircle(s.player).radius>before.radius);
 E.update(s,{aimX:20,aimY:50,right:true},.01);assert.deepEqual([shot.endX,shot.endY],endpoint);
});
test('crossing a figure on the way to a background point is a miss',()=>{
 const s=game(),e=foe();s.enemies=[e];aim(s,1250,730);E.fire(s,()=>0);const shot=s.playerShots[0];
 const t=(e.x-shot.startX)/(shot.endX-shot.startX),crossY=shot.startY+(shot.endY-shot.startY)*t;
 assert.ok(t>0&&t<1);assert.equal(E.enemyContainsPoint(e,e.x,crossY),true);
 land(s);assert.equal(e.hp,2);assert.equal(s.score,0);assert.equal(s.corpses.length,0);
 const impact=s.effects.find(e=>e.type==='impact-miss');assert.equal(impact.x,1250);assert.equal(impact.y,730);assert.equal(s.feedback.kind,'miss');
});
test('transparent space between legs misses in both facings; a torso point hits',()=>{
 for(const facing of [-1,1])for(const [y,hit] of [[820,false],[730,true]]){
  const s=game(),e=foe();s.player.x=facing===1?1250:768;e.facing=facing;s.enemies=[e];aim(s,e.x,y);
  assert.equal(E.enemyContainsPoint(e,e.x,y),hit);E.fire(s,()=>0);land(s);
  assert.equal(s.score,hit?100:0);assert.equal(s.feedback.kind,hit?'hit':'miss');
  assert.equal(s.effects.some(effect=>effect.type==='impact-'+(hit?'hit':'miss')),true);
 }
});
test('walking silhouette tests mirror exactly and use the current pose',()=>{
 const right=foe(900),left=foe(900);right.facing=1;right.moving=left.moving=true;
 let changed=false;
 for(let frame=0;frame<8;frame++){
  right.phase=left.phase=frame;
  for(let dx=-130;dx<=130;dx+=5)for(let y=620;y<850;y+=5){
   const hit=E.enemyContainsPoint(left,900+dx,y);assert.equal(E.enemyContainsPoint(right,900-dx,y),hit);
   if(frame>0&&hit!==E.enemyContainsPoint({...left,phase:0},900+dx,y))changed=true;
  }
 }
 assert.equal(changed,true);assert.equal(E.enemyContainsPoint({...left,fallTime:0},900,730),false);
});
test('collision uses the figure present at arrival, not the one there when fired',()=>{
 const s=game(),original=foe();s.enemies=[original];aim(s,1000,730);E.fire(s,()=>0);original.x=1250;
 land(s);assert.equal(original.hp,2);assert.equal(s.score,0);
 const b=game();aim(b,1000,730);E.fire(b,()=>0);b.enemies=[foe()];land(b);assert.equal(b.score,100);
});
test('overlapping silhouettes award only one hit to the frontmost drawn enemy',()=>{
 const s=game();s.enemies=[foe(1000,1),foe(1000,2)];aim(s,1000,730);E.fire(s,()=>0);land(s);
 assert.deepEqual(s.enemies.map(e=>e.id),[1]);assert.equal(s.corpses[0].id,2);assert.equal(s.score,100);
});
test('settling and crouching shrink the circle and materially improve the chance of a torso hit',()=>{
 const s=game();s.player.x=400;aim(s,1000,730);const e=foe(),hip=E.aimCircle(s.player);
 Object.assign(s.player,{aiming:true,aimBlend:1,steady:1,crouching:true,crouch:1});const steady=E.aimCircle(s.player);
 const ratio=c=>samples(c).filter(p=>E.enemyContainsPoint(e,p.x,p.y)).length/1600;
 assert.ok(steady.radius<hip.radius/4);assert.ok(ratio(steady)>.95);assert.ok(ratio(steady)>ratio(hip)*2);
});
test('flight and impact effects pause with the game; restart clears them',()=>{
 const s=game();aim(s,1200,600);E.fire(s,()=>0);E.update(s,{},.02);const shot=s.playerShots[0],age=shot.age;
 s.mode='paused';E.update(s,{},.05);assert.equal(shot.age,age);assert.equal(s.feedback,null);
 s.mode='playing';land(s);const impact=s.effects.find(e=>e.type==='impact-miss'),life=impact.life;
 s.mode='paused';E.update(s,{},.05);assert.equal(impact.life,life);E.start(s);
 assert.equal(s.playerShots.length,0);assert.equal(s.effects.length,0);assert.equal(s.feedback,null);
});
test('final victory waits for an in-flight background shot to arrive',()=>{
 const s=game();s.wave=3;s.spawned=2;aim(s,1200,500);E.fire(s,()=>0);E.update(s,{},.01);assert.equal(s.mode,'playing');
 land(s);assert.equal(s.mode,'won');assert.ok(s.effects.some(e=>e.type==='impact-miss'));
});
