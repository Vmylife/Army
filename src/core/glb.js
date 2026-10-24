// Army GLB loader – explicit errors + retry on mobile network failures.
const COMPONENTS={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const SIZE={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const nap=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function download(url){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const uri=attempt===0?url:url+(url.includes('?')?'&':'?')+'armyretry='+attempt;
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),16000);
   let response;
   try{response=await fetch(uri,{cache:attempt?'no-store':'default',signal:controller.signal});
       if(!response.ok)throw Error('HTTP '+response.status);
       const bytes=await response.arrayBuffer();
       if(bytes.byteLength<20)throw Error('資料長度不正確');
       return bytes;
   }finally{clearTimeout(timer)}
  }catch(e){last=e;if(attempt!==2)await nap(350*(attempt+1));}
 }
 throw new Error('無法下載 '+url+'（重試 3 次；'+String(last?.message||last)+'）');
}
export async function loadGlb(url){
 const bytes=await download(url),view=new DataView(bytes);
 try{
  if(view.getUint32(0,true)!==0x46546c67)throw Error('非 GLB 格式');
  const jLen=view.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jLen)));
  const binStart=20+jLen,binLen=view.getUint32(binStart,true),bin=bytes.slice(binStart+8,binStart+8+binLen);
  const read=ix=>{
   const a=j.accessors[ix],bv=j.bufferViews[a.bufferView],T=COMPONENTS[a.componentType],n=SIZE[a.type];
   if(!T||!n)throw Error('不支援 accessor 類型');
   const start=(bv.byteOffset||0)+(a.byteOffset||0),stride=bv.byteStride||n*T.BYTES_PER_ELEMENT;
   if(stride===n*T.BYTES_PER_ELEMENT&&start%T.BYTES_PER_ELEMENT===0)return new T(bin,start,a.count*n);
   const output=new T(a.count*n),dv=new DataView(bin);
   for(let i=0;i<a.count;i++)for(let k=0;k<n;k++){
    const addr=start+i*stride+k*T.BYTES_PER_ELEMENT;
    output[i*n+k]=a.componentType===5126?dv.getFloat32(addr,true):a.componentType===5125?dv.getUint32(addr,true):a.componentType===5123?dv.getUint16(addr,true):dv.getUint8(addr);
   }
   return output;
  };
  const imageFrom=ix=>{const im=j.images[ix],bv=j.bufferViews[im.bufferView];return new Blob([bin.slice(bv.byteOffset,bv.byteOffset+bv.byteLength)],{type:im.mimeType})};
  return {json:j,binary:bin,read,imageFrom};
 }catch(e){throw Error('模型檔解析錯誤 '+url+'：'+String(e.message||e))}
}
