(function(root){
  'use strict';
  const WIDTH=1536, FEET=850, MAX_WAVES=3, RELOAD_TIME=4, ENEMY_FALL_TIME=1.05;
  const WAVE_COUNTS=Object.freeze([1,1,2]);
  const hitMasks=typeof module!=='undefined'&&module.exports?require('./enemy-hit-masks.js'):root.NoirEnemyHitMasks;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function createState(){return {mode:'ready',time:0,player:{x:768,facing:1,phase:1,hp:100,ammo:2,reload:0,cooldown:0,invulnerable:0,y:0,vy:0,crouch:0,crouching:false,grounded:true,jumpHeld:false,moving:false,aiming:false,aimBlend:0,steady:0,recoil:0,aimX:1100,aimY:708,angle:0,spread:.15},enemies:[],corpses:[],shots:[],playerShots:[],effects:[],feedback:null,wave:1,spawned:0,kills:0,score:0,spawnIn:1.2,intermission:0,events:[],nextId:1};}
  function start(s){Object.assign(s,createState());s.mode='playing';}
  function reload(s){const p=s.player;if(s.mode==='playing'&&p.ammo<2&&!p.reload){p.reload=RELOAD_TIME;p.aiming=false;p.steady=0;s.events.push('reload');}}
  // The illustrated sequence follows simulation time, so pausing freezes the pose too.
  function reloadFrame(p){return p.reload>0?clamp(Math.floor((RELOAD_TIME-p.reload)/RELOAD_TIME*8),0,7):-1;}
  const artGeometry=[
 {anchor:[151,480],shoulder:[109,119],pivot:[169,242],muzzle:[332,321]},
 {anchor:[140,480],shoulder:[108,124],pivot:[198,160],muzzle:[359,124]},
 {anchor:[139,480],shoulder:[110,113],pivot:[207,83],muzzle:[367,81]},
 {anchor:[148,480],shoulder:[121,119],pivot:[216,87],muzzle:[378,87]},
 {anchor:[140,487],shoulder:[103,119],pivot:[209,84],muzzle:[374,86]},
 {anchor:[145,487],shoulder:[110,124],pivot:[211,171],muzzle:[373,252]},
 {anchor:[142,487],shoulder:[110,126],pivot:[202,247],muzzle:[349,314]},
 {anchor:[147,487],shoulder:[110,126],pivot:[205,254],muzzle:[338,328]}
 ];
 function weaponPose(p){
   if(p.reload>0){const x=p.x+p.facing*4,y=FEET+p.y-142+p.crouch*66-p.aimBlend*40,angle=Math.atan2(p.aimY-y,p.aimX-x);return {x,y,angle,muzzleX:x+Math.cos(angle)*112,muzzleY:y+Math.sin(angle)*112};}
   const g=artGeometry[aimFrame(p)],scale=.53,[sx,sy]=g.shoulder;
   const x=p.x+p.facing*(sx-g.anchor[0])*scale,y=FEET+p.y+(sy-g.anchor[1])*scale+p.crouch*66;
   const sourceAngle=Math.atan2(g.muzzle[1]-g.pivot[1],g.muzzle[0]-g.pivot[0]);
   const dx=(g.muzzle[0]-sx)*scale,dy=(g.muzzle[1]-sy)*scale;
   const perpendicular=-Math.sin(sourceAngle)*dx+Math.cos(sourceAngle)*dy;
   const tx=(p.aimX-x)*p.facing,ty=p.aimY-y,distance=Math.hypot(tx,ty);
   const localAngle=Math.atan2(ty,tx)-Math.asin(clamp(perpendicular/Math.max(1,distance),-.95,.95));
   const rotation=localAngle-sourceAngle,c=Math.cos(rotation),sn=Math.sin(rotation);
   return {x,y,angle:Math.atan2(Math.sin(localAngle),Math.cos(localAngle)*p.facing),rotation,shoulder:g.shoulder,muzzleX:x+p.facing*(dx*c-dy*sn),muzzleY:y+dx*sn+dy*c};
 }
  function aimFrame(p){return p.aiming?Math.min(3,Math.floor(p.aimBlend*4)):Math.min(7,4+Math.floor((1-p.aimBlend)*4));}
  function spread(p){return .012+(1-p.steady)*.065+(p.aiming?0:.08)+(p.moving?.095:0)+(p.grounded?0:.16)+(p.crouching?0:.025)+p.recoil*.065;}
  // One circle for both rendering and sampling. Capture it before applying recoil.
  function aimCircle(p){const w=weaponPose(p);return {x:p.aimX,y:p.aimY,radius:Math.max(5,Math.tan(spread(p))*Math.hypot(p.aimX-w.x,p.aimY-w.y))};}
  function sampleImpact(circle,random=Math.random){const radius=circle.radius*Math.sqrt(random()),angle=random()*Math.PI*2;return {x:circle.x+Math.cos(angle)*radius,y:circle.y+Math.sin(angle)*radius};}
  function intersect(x,y,dx,dy,box){let lo=0,hi=1;for(const [v,d,min,max] of [[x,dx,box.left,box.right],[y,dy,box.top,box.bottom]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return null;}else{let a=(min-v)/d,b=(max-v)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;}}return lo;}
  const enemyWalkFrames=[
 {rect:[10,33,422,458],anchor:[235,486],muzzle:[15,110]},
 {rect:[388,33,416,452],anchor:[601,480],muzzle:[392,109]},
 {rect:[766,33,390,455],anchor:[973,484],muzzle:[771,109]},
 {rect:[1129,33,402,458],anchor:[1348,486],muzzle:[1134,108]},
 {rect:[8,529,418,442],anchor:[235,967],muzzle:[13,603]},
 {rect:[386,528,410,444],anchor:[600,968],muzzle:[391,602]},
 {rect:[749,528,425,445],anchor:[970,969],muzzle:[754,601]},
 {rect:[1116,527,414,448],anchor:[1341,971],muzzle:[1121,602]}
 ];
 const enemyFallFrames=[
 {rect:[5,61,388,519],anchor:[200,575]},
 {rect:[392,141,365,435],anchor:[579,572]},
 {rect:[756,197,382,379],anchor:[946,572]},
 {rect:[1146,239,379,340],anchor:[1336,575]},
 {rect:[10,644,388,266],anchor:[206,906]},
 {rect:[399,722,370,189],anchor:[582,907]},
 {rect:[756,749,395,160],anchor:[956,905]},
 {rect:[1144,761,386,145],anchor:[1337,902]}
 ];
 const enemyStanding={rect:[34,27,1249,1129],anchor:[760,1152],muzzle:[37,195]};
 function enemyPose(e){
   const falling=Number.isFinite(e.fallTime),frame=falling?Math.min(7,Math.floor(e.fallTime/ENEMY_FALL_TIME*8)):e.moving?Math.floor(e.phase||0)%8:0;
   const art=falling?enemyFallFrames[frame]:e.moving?enemyWalkFrames[frame]:enemyStanding;
   const scale=falling?.458:e.moving?.52:235/1123;
   const pose={...art,scale,frame,kind:falling?'fall':e.moving?'walk':'stand'};
   if(pose.kind==='walk'){
     const row=Math.floor(frame/4),col=frame%4,top=row?520:20,bottom=row?990:500;
     const high=row?[0,375,745,1110,1536]:[0,380,750,1110,1536],low=row?[0,430,810,1190,1536]:[0,440,815,1190,1536];
     pose.clip=[[high[col],top],[high[col+1],top],[high[col+1],top+130],[low[col+1],top+260],[low[col+1],bottom],[low[col],bottom],[low[col],top+260],[high[col],top+130]];
   }
   if(art.muzzle){pose.muzzleX=e.x-e.facing*(art.muzzle[0]-art.anchor[0])*scale;pose.muzzleY=FEET+(art.muzzle[1]-art.anchor[1])*scale;}
   return pose;
 }
  // Alpha silhouettes are baked from the same cropped artwork, so holes between
  // limbs stay empty. No browser pixel readback is needed, even in standalone files.
  function enemyContainsPoint(e,x,y){
    if(e.hp<=0||Number.isFinite(e.fallTime))return false;
    const pose=enemyPose(e),[sx,sy,w,h]=pose.rect,[ax,ay]=pose.anchor;
    const localX=(x-e.x)/(-(e.facing||-1)*pose.scale)+ax-sx,localY=(y-FEET)/pose.scale+ay-sy;
    if(localX<0||localY<0||localX>=w||localY>=h)return false;
    const mask=pose.kind==='walk'?hitMasks.walk[pose.frame]:hitMasks.stand,row=mask.rows[Math.floor(localY/mask.step)]||[],column=Math.floor(localX/mask.step);
    for(let i=0;i<row.length;i+=2)if(column>=row[i]&&column<row[i+1])return true;
    return false;
  }
  function resolveImpact(s,shot){
    // Last drawn enemy is in front when silhouettes overlap. The flight path
    // intentionally never damages a figure; only this final point can hit.
    const target=[...s.enemies].reverse().find(e=>enemyContainsPoint(e,shot.endX,shot.endY));
    const kind=target?'hit':'miss',life=target?.5:1.4;
    s.effects.push({type:'impact-'+kind,x:shot.endX,y:shot.endY,life,duration:life});
    s.feedback={kind,life:.8};s.events.push(kind);
    if(!target)return;
    target.hp-=2;target.hit=.16;
    if(target.hp<=0){s.enemies=s.enemies.filter(e=>e.id!==target.id);s.corpses.push({...target,fallTime:0,moving:false});s.score+=100;s.kills++;}
  }
  function fire(s,random=Math.random){const p=s.player;if(s.mode!=='playing'||p.cooldown>0||p.reload>0)return false;if(p.ammo===0){reload(s);return false;}
    const w=weaponPose(p),circle=aimCircle(p),impact=sampleImpact(circle,random),distance=Math.hypot(impact.x-w.muzzleX,impact.y-w.muzzleY);
    s.playerShots.push({startX:w.muzzleX,startY:w.muzzleY,endX:impact.x,endY:impact.y,age:0,duration:clamp(distance/2200,.08,.22),circle});
    p.ammo--;p.cooldown=.65;p.recoil=Math.min(2,p.recoil+1);p.steady*=.35;s.events.push('shot');
    s.effects.push({x:w.muzzleX,y:w.muzzleY,life:.09,type:'flash'});
    return true;
  }
  function damage(s,amount){const p=s.player;if(p.invulnerable>0||s.mode!=='playing')return;p.hp=Math.max(0,p.hp-amount);p.invulnerable=.65;s.events.push('hurt');if(!p.hp){s.mode='lost';s.events.push('lost');}}
  function update(s,input,dt,random=Math.random){if(s.mode!=='playing')return;dt=clamp(dt,0,.05);s.time+=dt;const p=s.player;
    s.effects.forEach(e=>e.life-=dt);s.effects=s.effects.filter(e=>e.life>0);
    if(s.feedback){s.feedback.life-=dt;if(s.feedback.life<=0)s.feedback=null;}
    for(const key of ['cooldown','invulnerable'])p[key]=Math.max(0,p[key]-dt);
    if(p.reload>0){p.reload=Math.max(0,p.reload-dt);if(p.reload===0){p.ammo=2;s.events.push('loaded');}}
    const direction=Number(!!input.right)-Number(!!input.left);
    p.crouching=!!input.crouch&&p.grounded;p.crouch+=(Number(p.crouching)-p.crouch)*Math.min(1,dt*14);
    if(input.jump&&!p.jumpHeld&&p.grounded&&!p.crouching){p.vy=-620;p.grounded=false;p.steady=0;}p.jumpHeld=!!input.jump;
    p.vy+=1600*dt;p.y+=p.vy*dt;if(p.y>=0){p.y=0;p.vy=0;p.grounded=true;}
    const old=p.x;p.x=clamp(p.x+(p.crouching?0:direction*250)*dt,110,WIDTH-110);p.moving=p.x!==old;p.phase=p.moving?(p.phase+dt*10)%8:1;
    if(Number.isFinite(input.aimX)&&Number.isFinite(input.aimY)){p.aimX=input.aimX;p.aimY=input.aimY;}p.facing=p.aimX>=p.x?1:-1;
    const oldAngle=p.angle;p.angle=weaponPose(p).angle;const turn=Math.abs(Math.atan2(Math.sin(p.angle-oldAngle),Math.cos(p.angle-oldAngle)));
    p.aiming=!!input.aim&&!p.reload;p.aimBlend=clamp(p.aimBlend+(p.aiming?1:-1)*dt/.55,0,1);
    p.steady=clamp(p.steady+(p.aiming&&!p.moving&&p.grounded?dt/1.4:-dt*4)-turn*.8,0,1);p.recoil=Math.max(0,p.recoil-dt*1.8);p.spread=spread(p);
    if(input.reload)reload(s);if(input.fire)fire(s,random);
    const count=WAVE_COUNTS[s.wave-1];
    if(s.intermission>0){s.intermission=Math.max(0,s.intermission-dt);if(s.intermission===0){s.wave++;s.spawned=0;s.spawnIn=.8;p.hp=Math.min(100,p.hp+20);p.ammo=2;p.reload=0;s.events.push('wave');}}
    else if(s.spawned<count){s.spawnIn-=dt;if(s.spawnIn<=0){const side=random()<.5?-1:1;s.enemies.push({id:s.nextId++,x:side<0?-80:WIDTH+80,hp:2,phase:0,hit:0,attack:1.7+random(),facing:-side});s.spawned++;s.spawnIn=Math.max(1.2,3-s.wave*.4);}}
    for(const body of s.corpses)body.fallTime+=dt;
    s.corpses=s.corpses.filter(body=>body.fallTime<3.5);
    for(const e of s.enemies){
      e.hit=Math.max(0,e.hit-dt);e.facing=p.x>e.x?1:-1;const distance=Math.abs(p.x-e.x);
      e.moving=distance>330;if(e.moving){const step=(65+s.wave*12)*dt;e.x+=e.facing*step;e.phase=((e.phase||0)+step/11)%8;}
      e.attack-=dt;
      if(e.attack<=0&&distance<760){const muzzle=enemyPose(e);s.shots.push({x:muzzle.muzzleX,y:muzzle.muzzleY,previousX:muzzle.muzzleX,vx:e.facing*550,life:3});s.effects.push({x:muzzle.muzzleX,y:muzzle.muzzleY,life:.07,type:'flash'});e.attack=2.5-s.wave*.2;s.events.push('enemyShot');}
      if(distance<65)damage(s,12);
    }
    for(const shot of s.playerShots){shot.age+=dt;if(shot.age>=shot.duration)resolveImpact(s,shot);}
    s.playerShots=s.playerShots.filter(shot=>shot.age<shot.duration);
    for(const shot of s.shots){const before=shot.x;shot.previousX=before;shot.x+=shot.vx*dt;shot.life-=dt;const height=p.crouching?115:235;if(intersect(before,shot.y,shot.x-before,0,{left:p.x-24,right:p.x+24,top:FEET+p.y-height,bottom:FEET+p.y})!==null){damage(s,16);shot.life=0;}}
    s.shots=s.shots.filter(b=>b.life>0&&b.x>-50&&b.x<WIDTH+50);
    if(s.mode==='playing'&&s.spawned===count&&!s.enemies.length&&!s.playerShots.length&&!s.intermission&&s.corpses.every(body=>body.fallTime>=ENEMY_FALL_TIME)){s.shots=[];if(s.wave===MAX_WAVES){s.mode='won';s.events.push('won');}else{s.intermission=3;s.events.push('clear');}}
  }
  const api={WIDTH,FEET,MAX_WAVES,RELOAD_TIME,WAVE_COUNTS,ENEMY_FALL_TIME,enemyPose,enemyContainsPoint,aimCircle,sampleImpact,createState,start,reload,fire,damage,update,weaponPose,aimFrame,reloadFrame,spread,intersect};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NoirEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
