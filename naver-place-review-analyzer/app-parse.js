function parsePasted(text){
 const src=cleanText(text);if(!src)return[];
 const blocks=src.includes('\n\n')?src.split(/\n\s*\n+/):src.split(/\n+/);
 return blocks.map((line,i)=>{
   const cols=line.split('\t').map(x=>x.trim());
   if(cols.length>=3){const maybeRating=numberOrNull(cols[1]);return{date:normalizeDate(cols[0]),rating:maybeRating,body:cleanText(cols.slice(2).join(' ')),url:state.placeUrl};}
   if(cols.length===2&&/^20\d{2}/.test(cols[0]))return{date:normalizeDate(cols[0]),body:cleanText(cols[1]),url:state.placeUrl};
   return{date:'',body:cleanText(line),url:state.placeUrl};
 }).filter(x=>x.body);
}

function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
   else{if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell='';}else if(ch!=='\r')cell+=ch;}
 }
 row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);return rows;
}
function findHeaderMap(rows){
 const aliases={date:['날짜','작성일','등록일','date'],rating:['별점','평점','rating','score'],body:['리뷰 내용','리뷰내용','내용','리뷰','review','body','content'],url:['출처 url','url','링크','source','source url']};
 for(let r=0;r<Math.min(rows.length,15);r++){
   const vals=rows[r].map(v=>cleanText(v).toLowerCase());const map={};
   for(const [k,list] of Object.entries(aliases)){const idx=vals.findIndex(v=>list.some(a=>v===a||v.includes(a)));if(idx>=0)map[k]=idx;}
   if(map.body!==undefined)return{row:r,map};
 }
 return null;
}
function rowsToReviews(rows){
 const found=findHeaderMap(rows);if(found){
   return rows.slice(found.row+1).map(r=>({date:r[found.map.date],rating:r[found.map.rating],body:r[found.map.body],url:r[found.map.url]||state.placeUrl})).filter(x=>cleanText(x.body));
 }
 return rows.map(r=>{const vals=r.filter(v=>cleanText(v));if(!vals.length)return null;const first=normalizeDate(vals[0]);return{date:/^20\d{2}-/.test(first)?first:'',body:cleanText((/^20\d{2}-/.test(first)?vals.slice(1):vals).join(' ')),url:state.placeUrl};}).filter(x=>x&&x.body);
}

async function parseExcel(buffer){
 if(!window.ExcelJS)throw new Error('엑셀 모듈을 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
 const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer);
 const ws=wb.getWorksheet('고객리뷰')||wb.worksheets.find(s=>/리뷰/i.test(s.name))||wb.worksheets[0];if(!ws)throw new Error('읽을 수 있는 워크시트가 없습니다.');
 const rows=[];ws.eachRow({includeEmpty:false},row=>{rows.push(row.values.slice(1).map(v=>v&&typeof v==='object'&&v.text!==undefined?v.text:v));});
 return rowsToReviews(rows);
}
async function readFile(file){
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 if(['xlsx','xls'].includes(ext))return parseExcel(await file.arrayBuffer());
 const text=await file.text();
 if(ext==='csv')return rowsToReviews(parseCSV(text));
 if(ext==='json'){
   const data=JSON.parse(text);const arr=Array.isArray(data)?data:(data.reviews||data.items||[]);return arr.map(x=>({date:x.date||x.createdAt||x.visitDate,rating:x.rating||x.score,body:x.body||x.content||x.review||x.text,url:x.url||x.sourceUrl||state.placeUrl})).filter(x=>cleanText(x.body));
 }
 return parsePasted(text);
}

function setRawReviews(arr,source){
 state.rawReviews=arr.map((r,i)=>({date:normalizeDate(r.date),rating:numberOrNull(r.rating),body:cleanText(r.body),url:safeUrl(r.url)||state.placeUrl,no:i+1})).filter(r=>r.body);
 state.source=source;$('#reviewStatus').textContent=`${state.rawReviews.length.toLocaleString()}건`;$('#fileStatus').textContent=source||'직접 입력';$('#analysisStatus').textContent='분석 전';$('#analysisStatus').className='warn';
}
