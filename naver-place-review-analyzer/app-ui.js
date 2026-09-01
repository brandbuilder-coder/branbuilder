async function runAnalysis(){
 state.businessName=cleanText($('#businessName').value)||'상호 미입력';state.placeUrl=safeUrl($('#placeUrl').value);state.industry=$('#industry').value;
 let arr=[...state.rawReviews];const pasted=parsePasted($('#pasteData').value);if(pasted.length)arr=arr.concat(pasted);
 const seen=new Set();arr=arr.filter(r=>{const key=(normalizeDate(r.date)+'|'+cleanText(r.body)).toLowerCase();if(!r.body||seen.has(key))return false;seen.add(key);return true;});
 if(!arr.length){toast('분석할 리뷰 파일 또는 원문을 입력하세요.','error');return;}
 $('#analyzeBtn').disabled=true;$('#analyzeBtn').innerHTML='<span class="spinner"></span> 분석 중';setProgress(18);
 await new Promise(r=>setTimeout(r,80));state.reviews=arr.map(analyzeOne);setProgress(58);aggregate();setProgress(90);state.analyzedAt=today();renderAll();setProgress(100);
 $('#workspace').hidden=false;$('#analysisStatus').textContent='완료';$('#analysisStatus').className='ok';$('#reviewStatus').textContent=`${state.reviews.length.toLocaleString()}건`;$('#analyzeBtn').disabled=false;$('#analyzeBtn').textContent='분석 다시 실행';setTimeout(()=>setProgress(0),700);$('#workspace').scrollIntoView({behavior:'smooth',block:'start'});toast(`${state.reviews.length}건 분석을 완료했습니다.`,'success');
}

function renderAll(){renderDashboard();renderReviews();renderClassification();renderSNS();renderImprovements();}
function renderDashboard(){
 const analyzed=state.reviews.filter(r=>r.sentiment!=='분석 제외');const pos=analyzed.filter(r=>r.sentiment==='긍정').length;const mixed=analyzed.filter(r=>r.sentiment==='개선동반 긍정').length;const neg=analyzed.filter(r=>r.sentiment==='부정').length;const positiveRatio=analyzed.length?((pos+mixed)/analyzed.length*100):0;
 $('#kpiGrid').innerHTML=[['전체 리뷰',state.reviews.length,'yellow'],['긍정 리뷰',pos,'green'],['개선동반 긍정',mixed,'yellow'],['부정 리뷰',neg,'red'],['긍정 경험 비율',positiveRatio.toFixed(1)+'%','']].map(x=>`<div class="kpi ${x[2]}"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join('');
 const top=state.positiveThemes[0]?.name||'명확한 반복 강점';const risk=state.improvements[0]?.theme;
 $('#conclusion').innerHTML=risk?`핵심은 <strong>“${esc(top)}”</strong>입니다. 가장 먼저 점검할 개선 신호는 <strong>“${esc(risk)}”</strong>이며, 강점을 더 선명하게 알리는 동시에 선택권과 운영 기준을 보완해야 합니다.`:`핵심은 <strong>“${esc(top)}”</strong>입니다. 명확한 부정 신호가 거의 없어, 반복되는 강점을 대표 콘텐츠와 플레이스 첫 화면에 집중 노출하는 전략이 우선입니다.`;
 renderBars('#positiveBars',state.positiveThemes.slice(0,8),false);
 renderBars('#negativeBars',state.improvements.slice(0,8).map(x=>({name:x.theme,count:x.count})),true);
 const actions=[];
 if(state.snsPlans[0])actions.push({badge:'콘텐츠 1순위',title:state.snsPlans[0].theme,text:`${state.snsPlans[0].format}으로 월간 대표 콘텐츠를 제작합니다. 첫 훅: ${state.snsPlans[0].hooks[0]}`});
 if(state.improvements[0])actions.push({badge:'운영 1순위',title:state.improvements[0].theme,text:state.improvements[0].action});
 actions.push({badge:'리뷰 운영',title:'고객의 언어를 자산화',text:'반복 표현을 플레이스 소개·대표 사진 문구·SNS 캡션에 동일한 맥락으로 연결합니다.'});
 actions.push({badge:'측정 기준',title:'언급 수 추이를 월 단위로 비교',text:'한 번의 평가보다 같은 개선 신호의 재발 여부와 긍정 주제의 증가를 추적합니다.'});
 $('#actionSummary').innerHTML=actions.map(x=>`<article class="result-card"><span class="badge pos">${esc(x.badge)}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('');
}
function renderBars(target,items,isRed){
 if(!items.length){$(target).innerHTML='<div class="empty">해당 신호가 없습니다.</div>';return;}const max=Math.max(...items.map(x=>x.count),1);
 $(target).innerHTML=items.map(x=>`<div class="bar-row"><div class="bar-label">${esc(x.name)}</div><div class="bar-bg"><div class="bar ${isRed?'redbar':''}" style="width:${Math.max(5,x.count/max*100)}%"></div></div><div class="bar-num">${x.count}</div></div>`).join('');
}
function renderReviews(){
 const q=cleanText($('#reviewSearch')?.value).toLowerCase();const filter=$('#sentimentFilter')?.value||'';const arr=state.reviews.filter(r=>(!filter||r.sentiment===filter)&&(!q||(r.body+' '+r.positive.join(' ')+' '+r.negative.join(' ')).toLowerCase().includes(q)));
 $('#reviewCountLabel').textContent=`${arr.length}건 표시`;
 $('#reviewList').innerHTML=arr.length?arr.map(r=>`<article class="review"><div class="review-top"><div><span class="badge ${badgeClass(r.sentiment)}">${esc(r.sentiment)}</span> <span class="meta">${esc(r.date||'날짜 없음')}</span></div><div class="rating">${r.rating?'★ '+r.rating:''}</div></div><div class="review-body">${esc(r.body)}</div>${r.positive.length?`<div class="review-tags">${r.positive.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>`:''}${r.negative.length?`<div class="signal"><b>개선 신호</b> · ${esc(r.negative.join(' · '))}<br><b>제안</b> · ${esc(r.improvement)}</div>`:''}</article>`).join(''):'<div class="empty">조건에 맞는 리뷰가 없습니다.</div>';
}
function renderClassification(){
 $('#classificationBody').innerHTML=state.reviews.map(r=>`<tr><td>${esc(r.date)}</td><td><span class="badge ${badgeClass(r.sentiment)}">${esc(r.sentiment)}</span></td><td>${esc(r.positive.join(' · '))}</td><td>${esc(r.negative.join(' · '))}</td><td>${esc(r.improvement)}</td><td>${esc(r.body)}</td></tr>`).join('');
}
function renderSNS(){
 $('#snsCards').innerHTML=state.snsPlans.length?state.snsPlans.map(x=>`<article class="result-card"><span class="badge pos">TOP ${x.rank} · 근거 ${x.count}</span><h3>${esc(x.theme)}</h3><p><b>${esc(x.format)}</b> · ${esc(x.frequency)}</p><p>${esc(x.shoot)}</p><p><b>CTA</b> · ${esc(x.cta)}</p><details><summary><b>훅 5안 + 작동 이유</b></summary><ol class="hooks">${x.hooks.map((h,i)=>`<li>${esc(h)}<span class="reason">${esc(x.reasons[i])}</span></li>`).join('')}</ol></details></article>`).join(''):'<div class="empty">긍정 주제가 충분하지 않습니다.</div>';
}
function renderImprovements(){
 $('#improvementCards').innerHTML=state.improvements.length?state.improvements.map(x=>`<article class="result-card"><span class="badge ${x.priority==='높음'?'high':x.priority==='중간'?'mid':'low'}">${esc(x.priority)} · 신호 ${x.count}</span><h3>${esc(x.theme)}</h3><p><b>대표 고객 신호</b><br>${esc(x.signal)}</p><p><b>실행 제안</b><br>${esc(x.action)}</p><p><b>권장 KPI</b> · ${esc(x.metric)}</p></article>`).join(''):'<div class="empty">명확한 부정·개선 신호가 발견되지 않았습니다. 억지로 부정을 만들지 않고 긍정 자산을 우선 활용하세요.</div>';
}

async function collectFromApi(){
 const endpoint=safeUrl($('#apiEndpoint').value);const placeUrl=safeUrl($('#placeUrl').value);if(!endpoint){toast('수집 API 엔드포인트를 먼저 입력하세요.','error');return;}if(!placeUrl){toast('네이버 플레이스 주소를 입력하세요.','error');return;}
 $('#collectBtn').disabled=true;$('#collectBtn').innerHTML='<span class="spinner"></span> 수집 중';
 try{
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeUrl,businessName:cleanText($('#businessName').value),limit:Number($('#reviewLimit').value)})});
   if(!res.ok)throw new Error(`수집 서버 응답 ${res.status}`);const data=await res.json();const arr=Array.isArray(data)?data:(data.reviews||data.items||[]);if(!arr.length)throw new Error('수집 결과에 리뷰가 없습니다.');
   setRawReviews(arr.map(x=>({date:x.date||x.createdAt,rating:x.rating||x.score,body:x.body||x.content||x.text||x.review,url:x.url||placeUrl})),`URL 자동수집 ${arr.length}건`);toast(`${arr.length}건을 수집했습니다.`,'success');
 }catch(e){toast(`URL 수집 실패: ${e.message}`,'error');}
 finally{$('#collectBtn').disabled=false;$('#collectBtn').textContent='URL로 리뷰 수집';}
}

function saveProject(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:APP_VERSION,businessName:$('#businessName').value,placeUrl:$('#placeUrl').value,industry:$('#industry').value,apiEndpoint:$('#apiEndpoint').value,rawReviews:state.rawReviews,pasteData:$('#pasteData').value}));toast('현재 작업을 이 브라우저에 저장했습니다.','success');}catch(e){toast('브라우저 저장 공간이 부족합니다.','error');}
}
function loadProject(){
 try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!d)throw new Error('저장 작업 없음');$('#businessName').value=d.businessName||'';$('#placeUrl').value=d.placeUrl||'';$('#industry').value=d.industry||'외식업·카페';$('#apiEndpoint').value=d.apiEndpoint||'';$('#pasteData').value=d.pasteData||'';setRawReviews(d.rawReviews||[],'브라우저 저장 작업');toast('저장 작업을 불러왔습니다.','success');}catch(e){toast('불러올 저장 작업이 없습니다.','error');}
}
function resetApp(){if(!confirm('입력과 분석 결과를 모두 초기화할까요?'))return;state.rawReviews=[];state.reviews=[];state.positiveThemes=[];state.improvements=[];state.snsPlans=[];$('#businessName').value='';$('#placeUrl').value='';$('#pasteData').value='';$('#fileInput').value='';$('#workspace').hidden=true;$('#fileStatus').textContent='없음';$('#reviewStatus').textContent='0건';$('#analysisStatus').textContent='대기';$('#analysisStatus').className='warn';$('#analyzeBtn').textContent='분석 실행';toast('초기화했습니다.');}
