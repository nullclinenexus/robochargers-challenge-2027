// Practice-map generator. Built from practice.mjs, practice-map.mjs, practice-aruco.mjs and
// maze-endpoints.mjs as one ordinary script, so it also runs when the page is opened from disk.
(function(){
'use strict';
// The maze is a connected tree: its farthest cell from any start is a dead end.
function chooseEndpoints(cells,w,h,dirs,random,distancesFrom){
 const leaves=cells.flatMap((walls,i)=>dirs.filter(([, ,wall])=>!(walls&wall)).length===1?[i]:[]);
 if(!leaves.length)return {startCell:0,finishCell:0};
 const edge=i=>i%w===0||i%w===w-1||i<w||i>=w*(h-1);
 const edgeLeaves=leaves.filter(edge), candidates=edgeLeaves.length?edgeLeaves:leaves.slice();
 let fallback;
 while(candidates.length){
  const [startCell]=candidates.splice(Math.floor(random()*candidates.length),1);
  const distance=distancesFrom(startCell);
  const farthest=Math.max(...distance);
  const finishes=leaves.filter(i=>distance[i]===farthest);
  const edgeFinishes=finishes.filter(edge);
  if(edge(startCell)&&edgeFinishes.length){
   return {startCell,finishCell:edgeFinishes[Math.floor(random()*edgeFinishes.length)]};
  }
  if(!fallback)fallback={startCell,finishCell:finishes[Math.floor(random()*finishes.length)]};
 }
 return fallback;
}

function passageDirection(walls,dirs){
 const passage=dirs.find(([, ,wall])=>!(walls&wall));
 return passage?.slice(0,2);
}

const N=1,E=2,S=4,W=8;
const dirs=[[0,-1,N,S],[1,0,E,W],[0,1,S,N],[-1,0,W,E]];
const center=(i,w)=>[i%w+.5,Math.floor(i/w)+.5];
function makeMaze(w,h,seed){
 let x=2166136261;for(const c of seed)x=Math.imul(x^c.codePointAt(0),16777619);
 const random=()=>{x=(x+0x6D2B79F5)|0;let t=Math.imul(x^(x>>>15),1|x);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296};
 const cells=Array(w*h).fill(15),seen=new Set([0]),stack=[0];
 while(stack.length){const i=stack.at(-1),cx=i%w,cy=Math.floor(i/w);const options=dirs.filter(([dx,dy])=>cx+dx>=0&&cx+dx<w&&cy+dy>=0&&cy+dy<h&&!seen.has(i+dx+dy*w));
 if(!options.length){stack.pop();continue;}const [dx,dy,a,b]=options[Math.floor(random()*options.length)],j=i+dx+dy*w;
 cells[i]&=~a;cells[j]&=~b;seen.add(j);stack.push(j);}
 const walls=[];
 cells.forEach((v,i)=>{const x=i%w,y=Math.floor(i/w);if(v&N)walls.push([x,y,x+1,y]);if(v&W)walls.push([x,y,x,y+1]);if(y===h-1)walls.push([x,y+1,x+1,y+1]);if(x===w-1)walls.push([x+1,y,x+1,y+1]);});
 function pathsFrom(start){
  const queue=[start],distance=new Int32Array(w*h).fill(-1);
  distance[start]=0;
  for(let k=0;k<queue.length;k++){
   const i=queue[k];
   for(const [dx,dy,wall] of dirs){
    if(cells[i]&wall)continue;
    const j=i+dx+dy*w;
    if(distance[j]!==-1)continue;
    distance[j]=distance[i]+1;queue.push(j);
   }
  }
  return distance;
 }
 const {startCell,finishCell}=chooseEndpoints(cells,w,h,dirs,random,pathsFrom);
 return {w,h,seed,walls,startCell,finishCell,
  startPassage:passageDirection(cells[startCell],dirs),finishPassage:passageDirection(cells[finishCell],dirs)};
}

const ARUCO_DICTIONARY="DICT_4X4_50";
// Canonical OpenCV patterns with a one-module black border.
const ARUCO_PATTERNS={"0":["000000","010110","001010","000110","000100","000000"],"1":["000000","000000","011110","010010","010100","000000"],"2":["000000","000110","000110","000100","011010","000000"],"8":["000000","011110","011100","011010","010100","000000"],"17":["000000","001100","001100","000000","000000","000000"]};
function markerLayout(w,h,start=[.5,.5],finish=[w-.5,h-.5]){
 const size=1, inset=size/2+.12, padX=1.32, padY=.34;
 return {padX,padY,markers:[
  {id:0,region:'Upper left',x:-inset,y:.5,size,quiet:1},
  {id:1,region:'Upper right',x:w+inset,y:.5,size,quiet:1},
  {id:2,region:'Lower right',x:w+inset,y:h-.5,size,quiet:1},
  {id:17,region:'Start',x:start[0],y:start[1],size:.88,quiet:1},
  {id:8,region:'Finish',x:finish[0],y:finish[1],size:.88,quiet:1}
 ]};
}

function endpointLabel(x,y,w,h,passage){
 // Prefer the top or bottom at corners to clear the side calibration markers.
 if(y===.5)return {x,y:-.18,'text-anchor':'middle'};
 if(y===h-.5)return {x,y:h+.18,'text-anchor':'middle'};
 if(x===.5)return {x:-.12,y,'text-anchor':'end'};
 if(x===w-.5)return {x:w+.12,y,'text-anchor':'start'};
 // Inside the maze, place the label just beyond the tag in its open corridor.
 const [dx,dy]=passage??[0,1];
 if(dx)return {x:x+dx*.54,y,'text-anchor':dx<0?'end':'start'};
 return {x,y:y+dy*.66,'text-anchor':'middle'};
}


const $=id=>document.getElementById(id), svg=$('practice-svg'), board=$('practice-board');
const levels={easy:[7,5],standard:[14,10],hard:[21,15]};
const node=(name,attrs,parent=svg)=>{
 const n=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
 parent.append(n);return n;
};
function generate(code){
 const [w,h]=levels[$('practice-size').value];
 const typed=typeof code==='string'?code.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12):'';
 const seed=typed||crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
 const maze=makeMaze(w,h,seed);
 const {markers,padX,padY}=markerLayout(w,h,center(maze.startCell,w),center(maze.finishCell,w));
 svg.replaceChildren();
 svg.setAttribute('viewBox',`${-padX} ${-padY} ${w+2*padX} ${h+2*padY}`);
 svg.style.aspectRatio=`${w+2*padX} / ${h+2*padY}`;
 node('rect',{width:w,height:h,fill:'#0b1424'});
 const d=maze.walls.map(([x,y,a,b])=>`M${x} ${y}L${a} ${b}`).join(' ');
 node('path',{d,fill:'none',stroke:'#96bedc','stroke-width':'.078','stroke-linecap':'round'});
 for(const {id,x,y,size,quiet,region} of markers){
  const modules=6+2*quiet;
  const g=node('g',{'data-marker-id':id,transform:`translate(${x-size/2} ${y-size/2}) scale(${size/modules})`,'shape-rendering':'crispEdges'});
  node('rect',{width:modules,height:modules,fill:'#fff'},g);
  node('rect',{x:quiet,y:quiet,width:6,height:6,fill:'#000'},g);
  ARUCO_PATTERNS[id].forEach((row,j)=>[...row].forEach((bit,i)=>{
   if(bit==='1')node('rect',{x:i+quiet,y:j+quiet,width:1,height:1,fill:'#fff'},g);
  }));
  if(id===17||id===8)node('text',{...endpointLabel(x,y,w,h,id===17?maze.startPassage:maze.finishPassage),'dominant-baseline':'central','font-family':'ui-monospace,monospace','font-size':'.24','font-weight':700,fill:'#c4cfdf'}).textContent=region.toUpperCase();
 }
 $('practice-meta').textContent=`${w} × ${h} cells · Map ${seed}`;
 $('practice-code').value=seed;
 current={level:$('practice-size').value,seed};
}
$('skip-content').onclick=()=>$('main').focus();
let current={level:'easy',seed:''};
$('practice-controls').onsubmit=e=>{e.preventDefault();generate();};
$('practice-size').onchange=()=>generate();
$('practice-load').onclick=()=>generate($('practice-code').value);
$('practice-code').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();generate($('practice-code').value);}};
function saveFile(blob,name){
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
$('practice-download').onclick=()=>{
 const name=`maze-${current.level}-${current.seed}`;
 const copy=svg.cloneNode(true);
 const [x,y,vw,vh]=svg.getAttribute('viewBox').split(' ').map(Number);
 const width=2000,height=Math.round(width*vh/vw);
 copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
 copy.setAttribute('width',width);copy.setAttribute('height',height);
 copy.removeAttribute('style');copy.removeAttribute('id');
 const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
 for(const [k,v] of Object.entries({x,y,width:vw,height:vh,fill:getComputedStyle(board).backgroundColor||'#0b1424'}))bg.setAttribute(k,v);
 copy.prepend(bg);
 const source=new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'});
 const url=URL.createObjectURL(source),img=new Image();
 img.onload=()=>{
  try{
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   canvas.getContext('2d').drawImage(img,0,0,width,height);
   canvas.toBlob(png=>{URL.revokeObjectURL(url);png?saveFile(png,name+'.png'):saveFile(source,name+'.svg');},'image/png');
  }catch{URL.revokeObjectURL(url);saveFile(source,name+'.svg');}
 };
 img.onerror=()=>{URL.revokeObjectURL(url);saveFile(source,name+'.svg');};
 img.src=url;
};
const expand=$('practice-fullscreen'), exit=$('practice-exit');
function setBackgroundInert(inert){
 for(let el=board;el.parentElement&&el.parentElement!==document.documentElement;el=el.parentElement)
  for(const sibling of el.parentElement.children)if(sibling!==el)sibling.inert=inert;
}
function closeExpanded(){
 if(document.fullscreenElement===board){document.exitFullscreen();return;}
 board.classList.remove('expanded');
 document.body.classList.remove('practice-expanded');
 setBackgroundInert(false);
 expand.focus();
}
expand.onclick=async()=>{
 try{await board.requestFullscreen();}
 catch{
  board.classList.add('expanded');
  document.body.classList.add('practice-expanded');
  setBackgroundInert(true);
  exit.focus();
 }
};
exit.onclick=closeExpanded;
document.addEventListener('fullscreenchange',()=>{
 if(document.fullscreenElement===board)exit.focus();
 else if(!board.classList.contains('expanded'))expand.focus();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&board.classList.contains('expanded'))closeExpanded();
});
generate();

})();
