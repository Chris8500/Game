'use strict';
const E=NoirEngine, state=E.createState(), canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),keys=new Set(),pointers=new Map();
const bg=new Image(),player=new Image(),enemy=new Image(),aimStudy=new Image(),handStudy=new Image(),enemyWalk=new Image(),enemyFall=new Image();
let enemyWalkLayers=[],enemyFallLayers=[],aimLayers=[],reloadWeapon=null,walkSeams=[],reloadParts=[];
const anchors=[{x:224,y:473},{x:210,y:473},{x:211,y:477},{x:208,y:472},{x:220,y:470},{x:211,y:469},{x:211,y:478},{x:211,y:473}];
const mouse={x:1100,y:708};
let ready=false,previous=0,audio=null,sound=false,shake=0,lastMode='';
function clearInput(){keys.clear();pointers.clear();}
function held(action){return keys.has(action)||[...pointers.values()].includes(action);}
function tone(frequency,duration,volume=.04){if(!sound)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(frequency,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(40,audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch{/* Audio is optional. */}}
function begin(){if(!ready)return;clearInput();E.start(state);lastMode='';canvas.focus();if(sound)tone(160,.08);}
function pause(){if(!ready)return;clearInput();if(state.mode==='playing')state.mode='paused';else if(state.mode==='paused')state.mode='playing';lastMode='';}
function renderOverlay(){if(lastMode===state.mode)return;lastMode=state.mode;const mode=state.mode;$('overlay').hidden=mode==='playing';$('pause').textContent=mode==='paused'?'Weiter':'Pause';if(mode==='ready')return;
  const content={paused:['KURZE ATEMPAUSE','Die Straße wartet.','Mit „Weiter“ oder P kehrst du zurück.','Weiter'],won:['DIE NACHT GEHÖRT DIR','Straße gesichert.',`${state.score} Punkte · Drei Wellen überstanden.`,'Noch einmal spielen'],lost:['DIE STADT VERGISST NICHT','Ende der Schicht.',`${state.score} Punkte · Welle ${state.wave} von 3. Ducke dich unter Schüssen und nutze ruhiges Zielen.`,'Erneut versuchen']}[mode];
  if(content){$('overlay-kicker').textContent=content[0];$('overlay-title').textContent=content[1];$('overlay-copy').textContent=content[2];$('start').textContent=content[3];}
}
// Source-space masks retain the illustrated sleeves, hands and weapon as one layer.
// Atlas cells: four columns, two rows; coordinates are local to each 384 x 512 cell.
const aimFrames=[
 {anchor:[151,480],pivot:[169,242],muzzle:[332,321],mask:[[83,98],[128,105],[170,204],[200,247],[337,314],[338,333],[198,288],[159,267],[65,241],[68,202],[105,207],[82,158]]},
 {anchor:[140,480],pivot:[198,160],muzzle:[359,124],mask:[[101,103],[130,110],[158,151],[203,143],[361,116],[366,132],[279,153],[277,170],[216,186],[153,203],[96,190],[83,153]]},
 {anchor:[139,480],pivot:[207,83],muzzle:[367,81],mask:[[99,88],[139,98],[184,81],[222,66],[370,72],[372,89],[288,92],[282,126],[234,150],[171,160],[126,155],[88,139]]},
 {anchor:[148,480],pivot:[216,87],muzzle:[378,87],mask:[[111,92],[151,99],[197,81],[230,71],[381,77],[383,93],[302,95],[291,128],[243,156],[185,164],[135,157],[99,141]]},
 {anchor:[140,487],pivot:[209,84],muzzle:[374,86],mask:[[91,94],[133,101],[181,80],[222,70],[379,77],[381,94],[293,95],[287,132],[238,156],[178,161],[118,151],[80,135]]},
 {anchor:[145,487],pivot:[211,171],muzzle:[373,252],mask:[[99,103],[138,110],[164,135],[222,143],[262,184],[380,245],[381,262],[257,214],[219,203],[174,187],[111,192],[83,158]]},
 {anchor:[142,487],pivot:[202,247],muzzle:[349,314],mask:[[105,107],[135,113],[169,207],[211,233],[353,306],[356,323],[228,274],[194,265],[163,261],[81,242],[81,209],[105,211],[88,154]]},
 {anchor:[147,487],pivot:[205,254],muzzle:[338,328],mask:[[105,108],[139,114],[169,209],[213,241],[342,319],[346,336],[228,282],[191,271],[162,267],[76,243],[81,208],[104,209],[88,154]]}
];
function maskPath(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function prepareAimLayers(){aimLayers=aimFrames.map((frame,i)=>{const body=document.createElement('canvas'),arms=document.createElement('canvas');body.width=arms.width=384;body.height=arms.height=512;const b=body.getContext('2d'),a=arms.getContext('2d'),sx=i%4*384,sy=Math.floor(i/4)*512;
 b.drawImage(aimStudy,sx,sy,384,512,0,0,384,512);b.globalCompositeOperation='destination-out';maskPath(b,frame.mask);b.fill();b.globalCompositeOperation='destination-over';
 // Fill the small occluded torso area with coat fabric from this same painted pose.
 b.save();maskPath(b,[[101,102],[154,112],[180,200],[181,284],[85,284],[83,169]]);b.clip();b.drawImage(aimStudy,sx+100,sy+280,60,70,80,101,105,190);b.restore();
 a.save();maskPath(a,frame.mask);a.clip();a.drawImage(aimStudy,sx,sy,384,512,0,0,384,512);a.restore();return {body,arms};});}
// Match the actual coat edges at the join, rather than unrelated foot x anchors.
// Both sheets share one destination seam and one ground line, also when mirrored.
// Calibrated from the median widest opaque run in five rows around each seam.
// Stored with the atlas layout so local/standalone files need no canvas pixel readback.
const seamEdges={
 walk:[[107,248],[100,229],[103,230],[88,235],[103,253],[91,245],[89,239],[102,257]],
 aim:[[82,181],[68,187],[62,187],[79,205],[68,196],[80,207],[80,197],[85,213]],
 reload:[[148,254],[141,247],[139,245],[138,247],[146,254],[141,249],[133,241],[149,256]]
};
function prepareBodyParts(image,sx,sy,anchor,edges){
 const split=anchor[1]-210,seam={left:edges[0],right:edges[1],split};
 const upper=document.createElement('canvas');upper.width=384;upper.height=split+10;
 const c=upper.getContext('2d');c.drawImage(image,sx,sy,384,split+10,0,0,384,split+10);
 // A small overlap blends the two painted fabrics without a gap or a hard cut.
 c.globalCompositeOperation='destination-in';const fade=c.createLinearGradient(0,split-6,0,split+10);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');c.fillStyle=fade;c.fillRect(0,0,384,upper.height);
 return {upper,seam};
}
function prepareBodyJoins(){
 walkSeams=anchors.map((anchor,i)=>({left:seamEdges.walk[i][0],right:seamEdges.walk[i][1],split:anchor.y-210,feet:anchor.y}));
 aimLayers.forEach((layer,i)=>{layer.parts=prepareBodyParts(layer.body,0,0,aimFrames[i].anchor,seamEdges.aim[i]);});
 reloadParts=reloadFrames.map((frame,i)=>prepareBodyParts(handStudy,i%4*384,Math.floor(i/4)*512,frame.anchor,seamEdges.reload[i]));
}
function drawBody(p,image,sx,sy,anchor,scale,parts){
 const [ax,ay]=anchor,drop=p.crouch*66,split=parts.seam.split,seamY=(split-ay)*scale+drop;
 if(p.moving||!p.grounded){
   const walk=Math.floor(p.phase),source=walkSeams[walk],target=parts.seam;
   const scaleX=(target.right-target.left)*scale/(source.right-source.left);
   const scaleY=-seamY/(source.feet-source.split);
   const x=(target.left-ax)*scale-source.left*scaleX,top=source.split-12;
   ctx.drawImage(player,walk%4*384,Math.floor(walk/4)*512+top,384,512-top,x,seamY-12*scaleY,384*scaleX,(512-top)*scaleY);
   ctx.drawImage(parts.upper,-ax*scale,-ay*scale+drop,384*scale,parts.upper.height*scale);
 }else{
   ctx.drawImage(image,sx,sy,384,split,-ax*scale,-ay*scale+drop,384*scale,split*scale);
   ctx.drawImage(image,sx,sy+split,384,512-split,-ax*scale,seamY,384*scale,(512-split)*scale*(1-drop/((ay-split)*scale)));
 }
}
function drawPlayer(){const p=state.player;if(p.reload>0){drawReloadPlayer();return;}
 const index=E.aimFrame(p),frame=aimFrames[index],layers=aimLayers[index],feet=E.FEET+p.y,drop=p.crouch*66;
 ctx.save();ctx.fillStyle='#060a0a66';ctx.beginPath();ctx.ellipse(p.x,E.FEET+2,Math.max(25,62+p.y*.12),9,0,0,Math.PI*2);ctx.fill();
 if(p.invulnerable>0)ctx.globalAlpha=.65;ctx.translate(p.x,feet);ctx.scale(p.facing,1);
 drawBody(p,layers.body,0,0,frame.anchor,.53,layers.parts);
 ctx.restore();
 const w=E.weaponPose(p);
 ctx.save();if(p.invulnerable>0)ctx.globalAlpha=.65;ctx.translate(w.x,w.y);ctx.scale(p.facing,1);ctx.rotate(w.rotation);ctx.scale(.53,.53);ctx.drawImage(layers.arms,-w.shoulder[0],-w.shoulder[1]);ctx.restore();
}
// Foot and hand anchors are measured in each 384 x 512 cell of the hand study.
const reloadFrames=[
 {anchor:[194,501],grip:[253,185],angle:.14,open:0,hands:[[235,166],[275,165],[278,197],[237,200]]},
 {anchor:[190,501],grip:[254,216],angle:.24,open:.25,hands:[[232,195],[269,196],[272,230],[239,238]]},
 {anchor:[192,501],grip:[252,218],angle:.28,open:.52,hands:[[230,196],[268,197],[272,234],[238,240]]},
 {anchor:[190,501],grip:[235,235],angle:.28,open:.52,hands:[[166,191],[201,193],[206,227],[175,233]]},
 {anchor:[191,500],grip:[254,186],angle:.24,open:.52,hands:[[237,163],[275,164],[280,199],[238,204]]},
 {anchor:[191,500],grip:[282,204],angle:.18,open:.45,hands:[[235,151],[277,150],[283,180],[303,189],[305,224],[278,230],[262,194],[236,186]]},
 {anchor:[190,500],grip:[240,230],angle:.14,open:.15,hands:[[221,211],[255,212],[259,247],[225,252]]},
 {anchor:[211,501],grip:[262,184],angle:.08,open:0,hands:[[242,163],[280,163],[284,199],[244,204]]}
];
function prepareReloadWeapon(){
 // Reuse painted wood and metal from the aiming atlas, instead of the old flat shapes.
 const weapon=document.createElement('canvas');weapon.width=384;weapon.height=512;
 const c=weapon.getContext('2d');maskPath(c,[[117,89],[171,87],[191,76],[215,71],[369,74],[369,86],[288,86],[271,96],[224,97],[207,103],[180,104],[133,108],[117,103]]);c.clip();
 c.drawImage(aimStudy,768,0,384,512,0,0,384,512);reloadWeapon=weapon;
}
function drawReloadPlayer(){
 const p=state.player,index=E.reloadFrame(p);if(index<0)return;
 const f=reloadFrames[index],[ax,ay]=f.anchor,sx=index%4*384,sy=Math.floor(index/4)*512;
 const scale=.51,drop=p.crouch*66;
 ctx.save();ctx.fillStyle='#060a0a66';ctx.beginPath();ctx.ellipse(p.x,E.FEET+2,Math.max(25,62+p.y*.12),9,0,0,Math.PI*2);ctx.fill();
 ctx.translate(p.x,E.FEET+p.y);ctx.scale(p.facing,1);if(p.invulnerable>0)ctx.globalAlpha=.65;
 drawBody(p,handStudy,sx,sy,f.anchor,scale,reloadParts[index]);
 // Place the painted prop at the current hand anchor; the forward part hinges during the middle poses.
 ctx.save();ctx.translate(-ax*scale,-ay*scale+drop);ctx.scale(scale,scale);
 ctx.save();ctx.translate(f.grip[0],f.grip[1]);ctx.rotate(f.angle);
 ctx.drawImage(reloadWeapon,0,0,216,512,-207,-83,216,512);
 ctx.translate(9,0);ctx.rotate(f.open);ctx.drawImage(reloadWeapon,216,0,168,512,0,-83,168,512);ctx.restore();
 // Painted fingers remain in front of the prop, so it sits within the grip.
 ctx.save();maskPath(ctx,f.hands);ctx.clip();ctx.drawImage(handStudy,sx,sy,384,512,0,0,384,512);ctx.restore();
 ctx.restore();ctx.restore();
}
function drawCrosshair(){if(state.mode!=='playing')return;const p=state.player,{x:cx,y:cy,radius}=E.aimCircle(p);ctx.save();ctx.strokeStyle=p.reload?'#bf8971':'#e7dfb5';ctx.lineWidth=1.5;ctx.shadowColor='#101715';ctx.shadowBlur=3;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.beginPath();ctx.moveTo(cx+x*(radius+4),cy+y*(radius+4));ctx.lineTo(cx+x*(radius+12),cy+y*(radius+12));ctx.stroke();}ctx.fillStyle='#fff4d4';ctx.fillRect(cx-1,cy-1,2,2);ctx.restore();}
// The generated drawings have irregular gutters. These boundaries isolate adjacent
// sprites where a coat hem crosses the nominal grid, without clipping the coat.
function prepareEnemyLayers(){
 enemyWalkLayers=Array.from({length:8},(_,i)=>{
  const e={moving:true,phase:i,x:0,facing:1},pose=E.enemyPose(e),[sx,sy,w,h]=pose.rect;
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.translate(-sx,-sy);
  maskPath(x,pose.clip);x.clip();x.drawImage(enemyWalk,0,0);return c;
 });
 enemyFallLayers=Array.from({length:8},(_,i)=>{
  const pose=E.enemyPose({fallTime:i*E.ENEMY_FALL_TIME/8+.001}),[sx,sy,w,h]=pose.rect;
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.translate(-sx,-sy);
  if(i>=4){const col=i%4,high=[0,398,772,1154,1536],low=[0,398,752,1142,1536];
   maskPath(x,[[high[col],640],[high[col+1],640],[high[col+1],870],[low[col+1],897],[low[col+1],920],[low[col],920],[low[col],897],[high[col],870]]);x.clip();
  }
  x.drawImage(enemyFall,0,0);return c;
 });
}
function drawEnemy(e){
 const pose=E.enemyPose(e),[sx,sy,w,h]=pose.rect,[ax,ay]=pose.anchor,falling=pose.kind==='fall';
 ctx.save();if(falling)ctx.globalAlpha=Math.min(1,(3.5-e.fallTime)/.7);
 ctx.fillStyle='#060a0a66';ctx.beginPath();ctx.ellipse(e.x,E.FEET+2,falling?75:48,9,0,0,Math.PI*2);ctx.fill();
 ctx.translate(e.x,E.FEET);ctx.scale(-e.facing*pose.scale,pose.scale);
 if(e.hit&&!falling)ctx.globalAlpha=.7;
 if(pose.kind==='walk')ctx.drawImage(enemyWalkLayers[pose.frame],sx-ax,sy-ay);
 else if(falling)ctx.drawImage(enemyFallLayers[pose.frame],sx-ax,sy-ay);
 else ctx.drawImage(enemy,sx,sy,w,h,sx-ax,sy-ay,w,h);
 ctx.restore();
 if(falling)return;
 ctx.fillStyle=e.attack<.65?'#ed926b':'#916f54';ctx.fillRect(e.x-22,E.FEET-260,e.hp*22,3);
 if(e.attack<.65){ctx.fillStyle='#e3a17b';ctx.font='bold 24px Georgia';ctx.textAlign='center';ctx.fillText('!',e.x,E.FEET-276);}
}
function drawPlayerProjectile(shot){
 const progress=Math.min(1,shot.age/shot.duration),dx=shot.endX-shot.startX,dy=shot.endY-shot.startY,distance=Math.hypot(dx,dy);
 const tail=Math.max(0,progress-(38-22*progress)/Math.max(1,distance));
 const x=shot.startX+dx*progress,y=shot.startY+dy*progress;
 ctx.save();ctx.strokeStyle='#f3dbab';ctx.lineWidth=3-1.8*progress;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(shot.startX+dx*tail,shot.startY+dy*tail);ctx.lineTo(x,y);ctx.stroke();
 ctx.fillStyle='#fff0c8';ctx.beginPath();ctx.arc(x,y,2.7-1.5*progress,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawImpact(effect){
 const age=effect.duration-effect.life,progress=age/effect.duration,hit=effect.type==='impact-hit';
 ctx.save();ctx.translate(effect.x,effect.y);
 if(hit){
  ctx.globalAlpha=Math.min(1,effect.life/.2);ctx.strokeStyle='#ffe1a0';ctx.lineWidth=2.5;ctx.shadowColor='#c68d40';ctx.shadowBlur=8;
  const inner=5+progress*5,outer=13+progress*8;
  for(const [x,y] of [[1,1],[-1,1],[-1,-1],[1,-1]]){ctx.beginPath();ctx.moveTo(x*inner,y*inner);ctx.lineTo(x*outer,y*outer);ctx.stroke();}
  ctx.globalAlpha*=Math.max(0,1-age/.16);ctx.fillStyle='#fff2c6';ctx.beginPath();ctx.arc(0,0,8+age*35,0,Math.PI*2);ctx.fill();
 }else{
  // Dust and the small chip are behind the figures, anchored to the wall/floor.
  ctx.globalAlpha=Math.min(1,effect.life/.35);ctx.fillStyle='#101514';ctx.strokeStyle='#9d9d8b';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.ellipse(0,0,3.7,2.8,-.4,0,Math.PI*2);ctx.fill();ctx.stroke();
  const dust=Math.min(1,age/.48);ctx.globalAlpha=.6*(1-dust);ctx.fillStyle='#bbc1b2';
  for(let i=0;i<5;i++){const angle=i*2.4;ctx.beginPath();ctx.ellipse(Math.cos(angle)*(4+dust*16),Math.sin(angle)*(3+dust*12)-dust*7,3+dust*6,2+dust*4,angle,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=.7*(1-dust);ctx.fillStyle='#cfccb6';for(let i=0;i<5;i++){const angle=i*1.8;ctx.fillRect(Math.cos(angle)*age*65,Math.sin(angle)*age*48+age*age*60,2,2);}
 }
 ctx.restore();
}
function draw(){if(!ready)return;ctx.save();if(shake>0)ctx.translate(Math.sin(state.time*170)*shake,Math.cos(state.time*110)*shake*.4);ctx.drawImage(bg,0,0,1536,1024);
  for(const effect of state.effects)if(effect.type==='impact-miss')drawImpact(effect);
  for(const e of state.corpses)drawEnemy(e);for(const e of state.enemies)drawEnemy(e);drawPlayer();
  for(const shot of state.playerShots)drawPlayerProjectile(shot);
  for(const b of state.shots){ctx.strokeStyle='#e2b986';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.previousX??b.x,b.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  for(const e of state.effects){if(e.type==='impact-miss')continue;if(e.type==='impact-hit'){drawImpact(e);continue;}ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=Math.min(1,e.life*10);ctx.fillStyle='#ffe5a2';ctx.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%2?8:24;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}
  // Rain and vignette stay subtle so the original hand-drawn scene remains readable.
  ctx.strokeStyle='#c1d2cc21';ctx.lineWidth=1;for(let i=0;i<65;i++){const x=(i*137+state.time*28)%1536,y=(i*83+state.time*420)%1024;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+20);ctx.stroke();}const shade=ctx.createLinearGradient(0,0,0,1024);shade.addColorStop(0,'#07101222');shade.addColorStop(.65,'#07101200');shade.addColorStop(1,'#07101266');ctx.fillStyle=shade;ctx.fillRect(0,0,1536,1024);ctx.restore();drawCrosshair();
  const p=state.player;$('health').textContent=p.hp;$('health-bar').style.width=p.hp+'%';$('wave').textContent=`WELLE ${state.wave} / 3`;$('ammo').textContent='● '.repeat(p.ammo)+'○ '.repeat(2-p.ammo);$('reload-status').textContent=p.reload>0?`LÄDT … ${p.reload.toFixed(1)}s`:`${p.ammo} / 2 PATRONEN`;$('score').textContent=String(state.score).padStart(4,'0')+' PUNKTE';$('message').textContent=state.feedback?(state.feedback.kind==='hit'?'TREFFER':'FEHLSCHUSS · HINTERGRUND'):state.intermission>0?`STRASSE FREI · NÄCHSTE WELLE IN ${Math.ceil(state.intermission)}`:p.reload>0?'NACHLADEN':p.aiming?(p.crouching?'GEDUCKT · ':'')+'ANGELEGT · RUHE '+Math.round(p.steady*100)+'%':'HÜFTANSCHLAG';renderOverlay();
}
function loop(t){const dt=previous?Math.min((t-previous)/1000,.05):0;previous=t;E.update(state,{left:held('left'),right:held('right'),fire:held('fire'),jump:held('jump'),crouch:held('crouch'),aim:held('aim'),aimX:mouse.x,aimY:mouse.y},dt);shake=Math.max(0,shake-dt*45);for(const event of state.events.splice(0)){if(event==='shot'){shake=5;tone(110,.14,.075);}if(event==='hurt'){shake=8;tone(60,.2);}if(event==='loaded')tone(420,.06);if(event==='hit')tone(180,.06);if(event==='wave'||event==='won')tone(560,.25);}draw();requestAnimationFrame(loop);}
const map={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyS:'crouch',ArrowDown:'crouch',ControlLeft:'crouch',ControlRight:'crouch'};
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&['Space','Enter'].includes(e.code))return;if(map[e.code]){e.preventDefault();keys.add(map[e.code]);}if(!e.repeat&&e.code==='KeyR')E.reload(state);if(!e.repeat&&(e.code==='KeyP'||e.code==='Escape'))pause();});
window.addEventListener('keyup',e=>keys.delete(map[e.code]));
function loseFocus(){clearInput();if(state.mode==='playing'){state.mode='paused';lastMode='';}previous=0;}
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
for(const button of document.querySelectorAll('[data-action]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,button.dataset.action);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>pointers.delete(e.pointerId));}

function aimPointer(e){const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/canvas.width,r.height/canvas.height),ox=(r.width-canvas.width*scale)/2,oy=(r.height-canvas.height*scale)/2;mouse.x=Math.max(0,Math.min(canvas.width,(e.clientX-r.left-ox)/scale));mouse.y=Math.max(0,Math.min(canvas.height,(e.clientY-r.top-oy)/scale));}
canvas.addEventListener('pointermove',e=>{aimPointer(e);if(e.pointerType==='mouse'&&state.mode==='playing'){if(e.buttons&1)keys.add('fire');else keys.delete('fire');if(e.buttons&2)keys.add('aim');else keys.delete('aim');}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(state.mode!=='playing')return;e.preventDefault();canvas.focus();aimPointer(e);canvas.setPointerCapture(e.pointerId);if(e.button===0)keys.add('fire');if(e.button===2)keys.add('aim');});
window.addEventListener('pointerup',e=>{if(e.button===0)keys.delete('fire');if(e.button===2)keys.delete('aim');});
canvas.addEventListener('pointercancel',()=>{keys.delete('fire');keys.delete('aim');});
canvas.addEventListener('lostpointercapture',()=>{keys.delete('fire');keys.delete('aim');});
$('start').onclick=()=>state.mode==='paused'?pause():begin();$('restart').onclick=begin;$('pause').onclick=pause;$('reload').onclick=()=>E.reload(state);$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Ton an':'Ton aus';$('sound').setAttribute('aria-pressed',String(sound));if(sound)tone(300,.07);};
function load(image,path){return new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error(path));image.src=path;});}
Promise.all([load(bg,'assets/street.png'),load(player,'assets/player-walk.png'),load(enemy,'assets/enemy.png'),load(aimStudy,'assets/player-aim-study.png'),load(handStudy,'assets/player-hand-study.png'),load(enemyWalk,'assets/enemy-walk.png'),load(enemyFall,'assets/enemy-fall.png')]).then(()=>{prepareEnemyLayers();prepareAimLayers();prepareReloadWeapon();prepareBodyJoins();ready=true;$('start').disabled=false;$('start').textContent='Schicht beginnen →';$('load-status').textContent='';draw();}).catch(err=>{$('load-status').textContent=`Bild fehlt: ${err.message}. Bitte das vollständige Projekt entpacken und npm start ausführen.`;$('start').textContent='Laden fehlgeschlagen';});
requestAnimationFrame(loop);
