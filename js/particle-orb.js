// Custom particle orb: many glowing points, intersecting orbital trails, 3-axis rotation and drag control.
(()=>{
 const canvas=document.getElementById('particleOrb');if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let w=0,h=0,dpr=1,points=[],backgroundPoints=[],rx=-.42,ry=.2,rz=.04,drag=false,px=0,py=0,mx=0,my=0,t=0,raf=null,canvasVisible=false;
 const rand=(a,b)=>a+Math.random()*(b-a);
 function resize(){
  const r=canvas.getBoundingClientRect();
  if(r.width<=0||r.height<=0){canvasVisible=false;stop();return}
  const nextDpr=Math.min(devicePixelRatio||1,1.7),sizeChanged=r.width!==w||r.height!==h;
  const bitmapWidth=Math.max(1,Math.round(r.width*nextDpr)),bitmapHeight=Math.max(1,Math.round(r.height*nextDpr));
  const bitmapChanged=canvas.width!==bitmapWidth||canvas.height!==bitmapHeight;
  w=r.width;h=r.height;dpr=nextDpr;
  if(bitmapChanged){canvas.width=bitmapWidth;canvas.height=bitmapHeight;ctx.setTransform(dpr,0,0,dpr,0,0)}
  if(sizeChanged)build();
 }
 function build(){points=[];backgroundPoints=[];const n=Math.min(1650,Math.max(850,Math.floor(w*h/165)));const golden=Math.PI*(3-Math.sqrt(5));for(let i=0;i<n;i++){const y=1-2*i/(n-1),r=Math.sqrt(1-y*y),a=golden*i;points.push({x:Math.cos(a)*r*rand(.985,1.015),y:y*rand(.985,1.015),z:Math.sin(a)*r*rand(.985,1.015),size:rand(.35,1.45),phase:rand(0,6.28),bright:rand(.35,1)})}for(let i=0;i<180;i++){const a=rand(0,Math.PI*2),u=Math.acos(rand(-1,1)),r=rand(1.04,1.48);backgroundPoints.push({x:r*Math.sin(u)*Math.cos(a),y:r*Math.cos(u),z:r*Math.sin(u)*Math.sin(a),size:rand(.25,.8),phase:rand(0,6.28)})}}
 function rot(p){let{x,y,z}=p;let c=Math.cos(ry),s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(rx);s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];return{x,y,z}}
 function project(p,scale){const q=rot(p),k=3.4/(3.4-q.z);return{x:w/2+q.x*scale*k,y:h/2+q.y*scale*k,z:q.z,k}}
 function orbit(ax,ay,tilt,phase,scale,alpha){const arr=[];for(let i=0;i<200;i++){const a=i/200*Math.PI*2+phase,x=Math.cos(a)*ax,y=Math.sin(a)*ay;arr.push(project({x,y:y*Math.cos(tilt),z:y*Math.sin(tilt)},scale))}ctx.beginPath();arr.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.globalAlpha=alpha;ctx.strokeStyle=alpha>.5?'#527A20':'#8CAC4C';ctx.lineWidth=1.1;ctx.shadowColor='#C8F672';ctx.shadowBlur=13;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1}
 function shouldAnimate(){return canvasVisible&&document.visibilityState==='visible'&&w>0&&h>0}
 function stop(){if(raf!==null){cancelAnimationFrame(raf);raf=null}}
 function start(){if(!shouldAnimate()||raf!==null)return;raf=requestAnimationFrame(draw)}
 function draw(){raf=null;if(!shouldAnimate())return;t++;ctx.clearRect(0,0,w,h);const scale=Math.min(w,h)*.37;if(!reduce&&!drag){ry+=.0031;rx+=.00125;rz+=.00055;rx+=(my*.13-rx)*.001;ry+=(mx*.13-ry)*.001}
 const aura=ctx.createRadialGradient(w/2,h/2,scale*.05,w/2,h/2,scale*1.2);aura.addColorStop(0,'rgba(200,246,114,.12)');aura.addColorStop(.5,'rgba(140,167,76,.045)');aura.addColorStop(1,'rgba(82,122,32,0)');ctx.fillStyle=aura;ctx.fillRect(0,0,w,h);
 orbit(1.38,.42,.25,.8,scale,.15);orbit(1.46,.34,1.05,2.4,scale,.2);orbit(1.27,.65,-.55,4.1,scale,.12);
 const atmosphere=ctx.createRadialGradient(w/2-scale*.25,h/2-scale*.3,scale*.06,w/2,h/2,scale);atmosphere.addColorStop(0,'rgba(220,244,154,.2)');atmosphere.addColorStop(.48,'rgba(140,167,76,.12)');atmosphere.addColorStop(1,'rgba(82,122,32,0)');ctx.fillStyle=atmosphere;ctx.beginPath();ctx.arc(w/2,h/2,scale*.91,0,Math.PI*2);ctx.fill();
 const sorted=points.map(p=>({...project(p,scale*.9),p})).sort((a,b)=>a.z-b.z);
 // sparse connecting filaments give the sphere a dense, dimensional particle field
 for(let i=0;i<sorted.length;i+=3){const a=sorted[i];if(a.z<-.15)continue;for(let j=i+2;j<Math.min(i+8,sorted.length);j++){const b=sorted[j],dx=a.x-b.x,dy=a.y-b.y;if(dx*dx+dy*dy<scale*scale*.0025&&Math.random()>.52){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(140,167,76,${.035+.07*(a.z+1)/2})`;ctx.lineWidth=.45;ctx.stroke()}}}
 for(const p of backgroundPoints){const q=project(p,scale),a=.15+.42*(.5+.5*Math.sin(t*.027+p.phase));ctx.beginPath();ctx.arc(q.x,q.y,p.size*q.k,0,Math.PI*2);ctx.fillStyle=`rgba(140,167,76,${a*.52})`;ctx.fill()}
 for(const a of sorted){const p=a.p,depth=(a.z+1)/2,tw=.62+.38*Math.sin(t*.035+p.phase),alpha=Math.min(1,(.2+depth*.72)*tw*p.bright),r=p.size*a.k*(.65+depth*.55);ctx.beginPath();ctx.arc(a.x,a.y,r,0,Math.PI*2);ctx.fillStyle=`rgba(${Math.round(54+depth*146)},${Math.round(76+depth*170)},${Math.round(33+depth*81)},${alpha})`;ctx.shadowColor=depth>.68?'#DCF49A':'#C8F672';ctx.shadowBlur=depth>.48?4+tw*7:1.4;ctx.fill();ctx.shadowBlur=0}
 orbit(1.03,.47,.79,1.25,scale,.88);orbit(1.04,.43,-.83,3.35,scale,.83);
 const a=t*.018,node=project({x:Math.cos(a)*1.04,y:Math.sin(a)*.43*Math.cos(-.83),z:Math.sin(a)*.43*Math.sin(-.83)},scale),g=ctx.createRadialGradient(node.x,node.y,0,node.x,node.y,20);g.addColorStop(0,'rgba(220,244,154,.98)');g.addColorStop(.2,'rgba(200,246,114,.76)');g.addColorStop(1,'rgba(82,122,32,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(node.x,node.y,20,0,Math.PI*2);ctx.fill();
 for(let i=0;i<9;i++){const q=project({x:Math.sin(t*.012+i*7)*1.16,y:Math.cos(t*.018+i*3)*.9,z:Math.sin(t*.014+i)*1.1},scale);if(Math.sin(t*.07+i)>0.8){ctx.fillStyle='rgba(220,244,154,.9)';ctx.fillRect(q.x,q.y,1.5,1.5)}}if(shouldAnimate())start()}
 canvas.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mx=(e.clientX-r.left-r.width/2)/(r.width/2);my=(e.clientY-r.top-r.height/2)/(r.height/2);if(drag){ry+=(e.clientX-px)*.008;rx+=(e.clientY-py)*.008;px=e.clientX;py=e.clientY}});const end=()=>drag=false;canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 const hasIntersectionObserver='IntersectionObserver'in window;
 function checkVisibility(){canvasVisible=canvas.getClientRects().length>0;if(canvasVisible)resize();else stop();start()}
 if(hasIntersectionObserver){new IntersectionObserver(entries=>{for(const entry of entries){canvasVisible=entry.isIntersecting&&entry.intersectionRect.width>0&&entry.intersectionRect.height>0;if(canvasVisible)resize();else stop();start()}}).observe(canvas)}
 else{canvasVisible=canvas.getClientRects().length>0;const page=canvas.closest('.page');if(page&&'MutationObserver'in window)new MutationObserver(checkVisibility).observe(page,{attributes:true,attributeFilter:['class']})}
 if('ResizeObserver'in window)new ResizeObserver(()=>{resize();start()}).observe(canvas);
 else window.addEventListener('resize',()=>{resize();start()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){resize();start()}else stop()});
 window.addEventListener('resize',()=>{if(!hasIntersectionObserver)checkVisibility();else{resize();start()}});
 resize();start();
})();
