/* Draws crewmate faces the same way the game client does: stacks layers from the game's sprite sheets
   (body, outfit, hair, face, head piece, item) chosen by the crewmate's on-chain "appearance".
   Ported from influence-client src/lib/spriteUtils.js. Art © Unstoppable Games (Influence), used for this community tool.
   Sheets come through sprite.php, which caches them on our server. */
const PARTS=['body','feature','hair','headPiece','item','leadership','misc','outfit'];
const atlas={},sheet={},faceCache=new Map();
let ready=null;
const MASKS=[['gender',4],['body',16],['face',16],['hair',16],['hairColor',16],['clothes',16],['head',16],['item',8]];
function unpack(v){const o={};let a;try{a=BigInt(v||0)}catch(e){a=0n}for(const [k,e] of MASKS){o[k]=Number(a&((1n<<BigInt(e))-1n));a>>=BigInt(e)}return{o,has:a!==undefined&&BigInt(v||0)>0n}}
function loadImg(u){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u})}
function load(){
  if(!ready)ready=Promise.all(PARTS.map(async p=>{
    try{atlas[p]=await (await fetch('sprite.php?p='+p+'&t=json')).json()}catch(e){atlas[p]=null}
  })).then(()=>true);
  return ready}
async function getSheet(p){if(!sheet[p])sheet[p]=loadImg('sprite.php?p='+p+'&t=png').catch(()=>null);return sheet[p]}
const has=(p,f)=>!!(atlas[p]&&atlas[p].frames&&atlas[p].frames[f]);
function layers(cm){
  const {o}=unpack(cm.appearance),coll=cm.coll||0,{gender,body,face,hair,hairColor,clothes,head,item}=o,L=[];
  const add=(p,f)=>{if(has(p,f))L.push([p,f])};
  if(coll===0)add('body','body'+body);
  if([1,2,4].includes(coll)){
    if([2,3,4,5].includes(item))add('item','item'+item);
    if(has('body','body'+body+'_feature'+face))add('body','body'+body+'_feature'+face);else add('body','body'+body);
    if(has('outfit','outfit'+clothes+'_body'+body))add('outfit','outfit'+clothes+'_body'+body);else add('outfit','outfit'+clothes);
    add('item','item'+item+'_outfit'+clothes+'_sex'+gender);
    if(head!==5){if(has('hair','hair'+hair+'_hairColor'+hairColor+'_body'+body))add('hair','hair'+hair+'_hairColor'+hairColor+'_body'+body);else add('hair','hair'+hair+'_hairColor'+hairColor)}
    if(![4,5].includes(head))add('feature','feature'+face+'_hairColor'+hairColor+'_body'+body);
    const hp=['headPiece'+head+'_hair'+hair+'_body'+body,'headPiece'+head+'_hair'+hair+'_sex'+gender,'headPiece'+head+'_hair'+hair,'headPiece'+head+'_body'+body,'headPiece'+head];
    const f=hp.find(k=>has('headPiece',k));if(f)add('headPiece',f);
  }
  if(coll===3)add('leadership',String(cm.title));
  return L}
async function drawFrame(ctx,p,f,w,h){const fr=atlas[p]&&atlas[p].frames[f];if(!fr)return;const s=await getSheet(p);if(!s)return;ctx.drawImage(s,fr.x,fr.y,fr.w,fr.h,0,0,w,h)}
export async function faceURL(cm){
  if(!cm)return null;
  const coll=cm.coll||0;if(coll!==0&&!(BigInt(cm.appearance||0)>0n))return null;
  const key=[coll,cm.class,cm.title,cm.appearance].join(':');
  if(faceCache.has(key))return faceCache.get(key);
  const pr=(async()=>{
    await load();if(!atlas.body)return null;
    const w=atlas.body.targetWidth||250,h=Math.round(1200*w/900);
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
    for(const [p,f] of layers(cm))await drawFrame(ctx,p,f,w,h);
    if(has('misc','texture')){const t=document.createElement('canvas');t.width=w;t.height=h;const tc=t.getContext('2d');
      await drawFrame(tc,'misc','texture',w,h);tc.globalCompositeOperation='destination-in';tc.drawImage(c,0,0);
      ctx.globalCompositeOperation='soft-light';ctx.drawImage(t,0,0);ctx.globalCompositeOperation='source-over'}
    const b=await new Promise(r=>c.toBlob(r,'image/png'));return b?URL.createObjectURL(b):null})();
  faceCache.set(key,pr);return pr}
/* Swap any <img data-face="crewmateId"> on the page for the drawn face */
export function fillFaces(root,mates){root.querySelectorAll('img[data-face]').forEach(img=>{const id=img.dataset.face;img.removeAttribute('data-face');
  faceURL(mates[id]).then(u=>{if(u)img.src=u}).catch(()=>{})})}
