(()=>{
const scenes={
 growth:{
  rotation:[.17,.12,.07],ambient:14,
  rings:[
   {rx:1.18,ry:.42,tiltX:.9,tiltY:-.3,speed:.34,phase:.2},
   {rx:.93,ry:.69,tiltX:-.68,tiltY:.55,speed:-.25,phase:1.8},
   {rx:.62,ry:.86,tiltX:.45,tiltY:.95,speed:.19,phase:3.1}
  ],
  nodes:[[0,.18,.72,7],[0,2.4,.62,5],[1,1.25,.78,6],[1,4.35,.55,5],[2,2.8,.66,4]]
 },
 services:{
  rotation:[.12,.2,-.08],ambient:12,
  rings:[
   {rx:1.05,ry:.38,tiltX:.36,tiltY:.25,speed:.31,phase:.1},
   {rx:1.02,ry:.4,tiltX:1.25,tiltY:-.58,speed:-.27,phase:1.1},
   {rx:.72,ry:.7,tiltX:-.8,tiltY:.9,speed:.23,phase:2.6}
  ],
  nodes:[[0,0,.68,8],[0,1.57,.82,7],[0,3.14,.58,7],[0,4.71,.76,7],[1,2.1,.65,5],[2,5.25,.58,5]]
 },
 budget:{
  rotation:[.2,.1,.11],ambient:10,
  rings:[
   {rx:1.23,ry:.36,tiltX:.68,tiltY:-.45,speed:.25,phase:.1},
   {rx:1.02,ry:.55,tiltX:-.92,tiltY:.55,speed:-.34,phase:1.4},
   {rx:.77,ry:.7,tiltX:.25,tiltY:1.1,speed:.4,phase:2.9}
  ],
  nodes:[[0,.5,.75,6],[1,2.1,.66,5],[2,3.8,.72,5],[0,5.7,.58,4]]
 },
 resources:{
  rotation:[.14,.16,.055],ambient:30,
  rings:[
   {rx:1.48,ry:.48,tiltX:.8,tiltY:-.2,speed:.27,phase:.3,opacity:1.35,width:1.15},
   {rx:1.18,ry:.65,tiltX:-.58,tiltY:.78,speed:-.21,phase:1.75,opacity:1.2,width:1.1},
   {rx:.73,ry:.78,tiltX:.42,tiltY:1.12,speed:.32,phase:3.2}
  ],
  nodes:[[0,.6,.62,5],[1,2.35,.78,6],[1,4.7,.48,4],[2,1.2,.69,5],[2,4.15,.59,4]]
 },
 consultation:{
  rotation:[.18,.13,-.09],ambient:16,
  rings:[
   {rx:1.2,ry:.42,tiltX:.82,tiltY:.32,speed:.3,phase:.4},
   {rx:.97,ry:.65,tiltX:-.76,tiltY:.75,speed:-.24,phase:1.9},
   {rx:.65,ry:.78,tiltX:.5,tiltY:-1.05,speed:.35,phase:3.25}
  ],
  nodes:[[0,.25,.68,7],[1,2.3,.58,7],[2,4.45,.7,7],[1,5.3,.47,5]]
 }
};

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function rotate(point,rx,ry,rz){
 let{x,y,z}=point,c=Math.cos(rx),s=Math.sin(rx);
 [y,z]=[y*c-z*s,y*s+z*c];
 c=Math.cos(ry);s=Math.sin(ry);
 [x,z]=[x*c+z*s,-x*s+z*c];
 c=Math.cos(rz);s=Math.sin(rz);
 [x,y]=[x*c-y*s,x*s+y*c];
 return{x,y,z};
}

class OrbitScene{
 constructor(canvas,config){
  this.canvas=canvas;this.host=canvas.parentElement;this.page=canvas.closest('.page');
  this.config=config;this.ctx=canvas.getContext('2d',{alpha:true});
  this.reduce=matchMedia('(prefers-reduced-motion: reduce)');
  this.w=0;this.h=0;this.dpr=1;this.elapsed=0;this.lastFrame=0;this.raf=null;this.intersecting=false;
  this.points=Array.from({length:config.ambient},(_,i)=>{
   const y=1-2*(i+.5)/config.ambient,a=i*2.39996323,r=Math.sqrt(1-y*y)*(1.18+(i%4)*.075);
   return{x:Math.cos(a)*r,y:y*r,z:Math.sin(a)*r,size:.8+(i%3)*.35,phase:i*1.73};
  });
  if(!this.ctx){console.error('Canvas 2D is unavailable for a subpage hero orbit.');return}
  this.host.classList.add('orbit-canvas-ready');
  this.resize();
  this.io='IntersectionObserver'in window?new IntersectionObserver(entries=>{
   this.intersecting=entries.some(entry=>entry.isIntersecting);
   this.sync();
  }):null;
  if(this.io)this.io.observe(this.host);
  this.mo=new MutationObserver(()=>this.sync());
  if(this.page)this.mo.observe(this.page,{attributes:true,attributeFilter:['class']});
  this.ro='ResizeObserver'in window?new ResizeObserver(()=>{this.resize();this.sync()}):null;
  if(this.ro)this.ro.observe(this.host);
  this.reduce.addEventListener('change',()=>this.sync());
 }
 resize(){
  const rect=this.host.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
  if(width===this.canvas.width&&height===this.canvas.height)return;
  this.w=rect.width;this.h=rect.height;this.dpr=dpr;
  this.canvas.width=Math.max(1,width);this.canvas.height=Math.max(1,height);
  this.ctx.setTransform(dpr,0,0,dpr,0,0);
  this.render();
 }
 visible(){
  if(!this.page||!this.page.classList.contains('active')||document.visibilityState!=='visible')return false;
  const rect=this.host.getBoundingClientRect();
  return this.intersecting&&rect.width>0&&rect.height>0;
 }
 sync(){
  if(!this.ctx)return;
  if(!this.visible()){this.stop();return}
  if(this.reduce.matches){this.stop();this.elapsed=0;this.render();return}
  this.start();
 }
 start(){if(this.raf===null)this.raf=requestAnimationFrame(time=>this.frame(time))}
 stop(){if(this.raf!==null){cancelAnimationFrame(this.raf);this.raf=null}this.lastFrame=0}
 frame(now){
  this.raf=null;
  if(!this.visible()||this.reduce.matches)return;
  if(this.lastFrame)this.elapsed+=Math.min((now-this.lastFrame)/1000,.05);
  this.lastFrame=now;
  this.render();
  this.start();
 }
 project(point,scale,time){
  const r=this.config.rotation;
  const q=rotate(point,time*r[0],time*r[1],time*r[2]);
  const k=4.4/(4.4-q.z);
  return{x:this.w/2+q.x*scale*k,y:this.h/2+q.y*scale*k,z:q.z,k};
 }
 orbitPoint(ring,angle,time,scale=1){
  const wobbleX=Math.sin(time*.16+ring.phase)*.16;
  const wobbleY=Math.cos(time*.13+ring.phase)*.14;
  const local=rotate(
   {x:Math.cos(angle)*ring.rx*scale,y:Math.sin(angle)*ring.ry*scale,z:0},
   ring.tiltX+wobbleX,ring.tiltY+wobbleY,ring.tiltZ||0
  );
  return this.project(local,Math.min(this.w*.34,this.h*.4),time);
 }
 drawOrbit(ring,time){
  const segments=80,points=[];
  for(let i=0;i<segments;i++){
   const angle=i/segments*Math.PI*2+ring.phase+time*ring.speed;
   points.push(this.orbitPoint(ring,angle,time));
  }
  const edges=[];
  points.forEach((point,index)=>{
   const next=points[(index+1)%segments];
   edges.push({a:point,b:next,z:(point.z+next.z)/2});
  });
  edges.sort((a,b)=>a.z-b.z);
  for(const edge of edges){
   const depth=clamp((edge.z+1.5)/3,0,1);
   this.ctx.beginPath();
   this.ctx.moveTo(edge.a.x,edge.a.y);this.ctx.lineTo(edge.b.x,edge.b.y);
   this.ctx.strokeStyle=`rgba(82,122,32,${clamp((.16+depth*.42)*(ring.opacity||1),0,.88)})`;
   this.ctx.lineWidth=(.8+depth*.5)*(ring.width||1);
   this.ctx.shadowColor='#C8F672';this.ctx.shadowBlur=depth>.63?4:0;
   this.ctx.stroke();
  }
  this.ctx.shadowBlur=0;
 }
 drawSatellite(node,time){
  const ring=this.config.rings[node[0]],phase=node[1]+time*ring.speed*(node[2]||1);
  const breath=this.config===scenes.consultation?1+.055*Math.sin(time*.55+node[1]):1;
  const point=this.orbitPoint(ring,phase,time,breath);
  return{...point,size:node[3],phase:node[1]};
 }
 drawParticle(point,time,scale){
  const p=this.project(point,scale,time),depth=clamp((p.z+1.5)/3,0,1);
  const twinkle=.72+.28*Math.sin(time*1.8+point.phase);
  const radius=point.size*p.k*(.65+depth*.6);
  this.ctx.beginPath();this.ctx.arc(p.x,p.y,radius,0,Math.PI*2);
  this.ctx.fillStyle=`rgba(91,132,42,${(.12+depth*.5)*twinkle})`;
  this.ctx.shadowColor='#C8F672';this.ctx.shadowBlur=depth>.55?5+depth*5:0;
  this.ctx.fill();this.ctx.shadowBlur=0;
 }
 drawNode(point){
  const depth=clamp((point.z+1.5)/3,0,1),radius=point.size*(.68+depth*.48);
  const halo=this.ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,radius*3.3);
  halo.addColorStop(0,`rgba(200,246,114,${.24+depth*.28})`);
  halo.addColorStop(1,'rgba(200,246,114,0)');
  this.ctx.fillStyle=halo;this.ctx.beginPath();this.ctx.arc(point.x,point.y,radius*3.3,0,Math.PI*2);this.ctx.fill();
  const sphere=this.ctx.createRadialGradient(point.x-radius*.34,point.y-radius*.38,0,point.x,point.y,radius);
  sphere.addColorStop(0,'#F4FFD9');sphere.addColorStop(.38,'#C8F672');sphere.addColorStop(1,depth>.5?'#527A20':'#8CAC4C');
  this.ctx.fillStyle=sphere;this.ctx.shadowColor='#C8F672';this.ctx.shadowBlur=4+depth*8;
  this.ctx.beginPath();this.ctx.arc(point.x,point.y,radius,0,Math.PI*2);this.ctx.fill();this.ctx.shadowBlur=0;
 }
 render(){
  if(!this.ctx||!this.w||!this.h)return;
  const ctx=this.ctx,time=this.reduce.matches?0:this.elapsed;
  const scale=Math.min(this.w*.34,this.h*.4);
  ctx.clearRect(0,0,this.w,this.h);
  const aura=ctx.createRadialGradient(this.w/2,this.h/2,scale*.05,this.w/2,this.h/2,scale*1.35);
  aura.addColorStop(0,'rgba(200,246,114,.13)');aura.addColorStop(.55,'rgba(140,167,76,.045)');aura.addColorStop(1,'rgba(82,122,32,0)');
  ctx.fillStyle=aura;ctx.fillRect(0,0,this.w,this.h);
  this.config.rings.forEach(ring=>this.drawOrbit(ring,time));

  const center=this.project({x:0,y:0,z:0},scale,time);
  const satellites=this.config.nodes.map(node=>this.drawSatellite(node,time)).sort((a,b)=>a.z-b.z);
  ctx.lineWidth=.8;
  for(const point of satellites){
   const depth=clamp((point.z+1.5)/3,0,1);
   ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(point.x,point.y);
   ctx.strokeStyle=`rgba(82,122,32,${.08+depth*.2})`;ctx.stroke();
  }

  const particles=this.points.map(point=>this.project(point,scale,time)).sort((a,b)=>a.z-b.z);
  particles.forEach(point=>this.drawParticle(point,time,scale));
  satellites.forEach(point=>this.drawNode(point));
  this.drawNode({...center,size:10.5});
 }
}

const scenesOnPage=[...document.querySelectorAll('.subpage-orbit-canvas')].map(canvas=>{
 const config=scenes[canvas.parentElement.dataset.orbitScene];
 return config?new OrbitScene(canvas,config):null;
}).filter(Boolean);
document.addEventListener('visibilitychange',()=>scenesOnPage.forEach(scene=>scene.sync()));
window.addEventListener('resize',()=>scenesOnPage.forEach(scene=>{scene.resize();scene.sync()}));
if(scenesOnPage.some(scene=>!scene.io||!scene.ro)){
 const syncFallback=()=>scenesOnPage.forEach(scene=>{
  const rect=scene.host.getBoundingClientRect();
  scene.intersecting=rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
  scene.resize();scene.sync();
 });
 window.addEventListener('scroll',syncFallback,{passive:true});
 syncFallback();
}
})();
