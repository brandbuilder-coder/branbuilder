'use strict';
const APP_VERSION='1.0.0';
const STORAGE_KEY='brandbuilder-naver-place-analyzer-v1';
const state={rawReviews:[],reviews:[],positiveThemes:[],improvements:[],snsPlans:[],businessName:'',placeUrl:'',industry:'외식업·카페',source:'',analyzedAt:''};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];

const POSITIVE_THEMES=[
 {key:'맛·제품 완성도',patterns:[/맛있|맛나요|맛깔|존맛|훌륭한 맛|풍미|간이 좋|고소|담백|깔끔한 맛|진한 맛|국물|육즙|바삭|부드럽|신선|퀄리티|품질/i],format:'릴스 15~20초',shoot:'대표 메뉴·제품의 디테일 → 고객이 칭찬한 핵심 장면 → 실제 리뷰 한 줄',cta:'대표 메뉴를 저장하고 방문 전 확인',frequency:'월 2회'},
 {key:'친절·세심한 서비스',patterns:[/친절|상냥|응대.*좋|설명.*잘|세심|배려|서비스.*좋|직원.*좋|사장님.*좋|편하게 해|환대/i],format:'비하인드 릴스',shoot:'입장 인사 → 주문·상담 설명 → 고객 배려 → 마무리 인사',cta:'편하게 방문할 사람에게 공유',frequency:'월 1~2회'},
 {key:'깨끗함·정갈함',patterns:[/깨끗|깔끔|정갈|청결|위생|쾌적|정돈|관리.*잘/i],format:'오픈 준비 릴스',shoot:'오픈 전 공간 정돈 → 테이블·도구 세팅 → 고객 맞이 준비',cta:'안심하고 방문하기 위해 저장',frequency:'월 1회'},
 {key:'분위기·공간 경험',patterns:[/분위기|감성|인테리어|예뻐|예쁘|멋진|뷰가|경치|공간.*좋|아늑|편안|힐링|사진.*좋/i],format:'공간 릴스·카루셀',shoot:'입구 → 좌석·동선 → 빛·소품 → 실제 이용 장면',cta:'데이트·모임 장소 폴더에 저장',frequency:'월 2회'},
 {key:'푸짐함·구성·가성비',patterns:[/푸짐|양이 많|양도 많|가성비|혜자|리필|구성.*좋|든든|배부|합리적|가격.*좋|무료 추가/i],format:'탑뷰 카루셀',shoot:'전체 구성 → 크기 비교 → 포함 서비스·리필 안내',cta:'몇 명이서 이용할지 댓글',frequency:'월 1회'},
 {key:'재방문·추천',patterns:[/재방문|또 방문|다시 오|또 오|단골|추천|꼭 가|무조건|다음에도|또 갈|재이용|소개하고/i],format:'리뷰 증거 릴스',shoot:'재방문 리뷰 문구 → 대표 경험 → 다시 찾는 이유 3가지',cta:'같이 갈 사람에게 공유',frequency:'월 2회'},
 {key:'주차·접근 편의',patterns:[/주차.*(편|넓|좋)|접근.*좋|찾기 쉽|위치.*좋|교통.*편|진입.*편|주차장/i],format:'동선 안내 카드',shoot:'진입로 → 주차 위치 → 입구까지 이동 동선',cta:'운전자에게 공유',frequency:'월 1회'},
 {key:'가족·모임·동반',patterns:[/가족|아이|부모님|어르신|유모차|모임|회식|단체|데이트|친구와|아이와/i],format:'상황별 카루셀',shoot:'가족·데이트·모임별 추천 좌석과 메뉴·서비스 구성',cta:'일정에 함께 갈 사람 태그',frequency:'월 1회'},
 {key:'지역·여행 경험',patterns:[/여행|관광|지역 맛집|동네 맛집|로컬|속초|강화|태안|양구|설악|바다|드라이브|아침식사/i],format:'여행 코스형 카루셀',shoot:'지역 이동 동선 → 방문 시간 → 대표 경험 → 주변 코스 연결',cta:'여행 일정에 저장',frequency:'월 2회'},
 {key:'속도·편리한 이용',patterns:[/빠르게|빨리 나|대기 없이|예약.*편|주문.*편|편리|간편|쉽게|신속/i],format:'이용방법 숏폼',shoot:'예약·입장 → 주문 → 이용 완료까지 시간을 압축해 보여주기',cta:'방문 전 이용법 저장',frequency:'월 1회'},
 {key:'포장·배달·확장성',patterns:[/포장.*좋|배달.*좋|택배|선물|테이크아웃|밀키트|집에서도/i],format:'사용 장면 릴스',shoot:'포장 과정 → 이동·보관 → 집에서 즐기는 장면',cta:'필요한 사람에게 공유',frequency:'월 1회'}
];

const NEGATIVE_THEMES=[
 {key:'맛·품질 편차',patterns:[/맛없|별로였|비린|질기|눅눅|탄 맛|덜 익|너무 짜|너무 싱거|차갑게 나|미지근|냄새가 나|품질.*아쉽/i],action:'레시피·제조·제공 온도 체크리스트를 만들고, 동일 메뉴의 편차를 주간 샘플링으로 점검합니다.',metric:'동일 불만 재언급률·메뉴별 반품/재조리 건수'},
 {key:'맵기·간·선택권',patterns:[/너무 매워|맵찔|아이.*못 먹|간이 세|짜서|싱거워|순한 맛|맑은.*추가|맵기.*선택/i],action:'주문 단계에서 맵기·간 옵션을 명확히 제시하고, 어린이·순한 선택지를 테스트합니다.',metric:'순한 옵션 선택률·동반 고객 만족도'},
 {key:'가격 첫인상·가치 전달',patterns:[/비싸|가격.*부담|가격.*높|가성비.*아쉽|돈 아까|가격 대비.*별로/i],action:'가격에 포함된 원재료·구성·서비스를 메뉴판과 플레이스 첫 화면에서 한눈에 설명합니다.',metric:'가격 관련 부정 언급률·객단가 대비 만족도'},
 {key:'대기·속도',patterns:[/너무 오래|오래 기다|대기.*길|늦게 나|느려|주문.*누락|서빙.*늦|예약.*대기/i],action:'피크타임 병목 구간을 주문·조리·결제 단계별로 측정하고, 예상 대기시간을 선제 안내합니다.',metric:'평균 대기시간·주문 누락·현장 이탈'},
 {key:'친절·응대',patterns:[/불친절|응대.*아쉽|직원.*무뚝뚝|설명.*부족|서비스.*별로|사장.*불편|말투.*기분/i],action:'첫 인사·메뉴 설명·문제 대응·마무리 인사까지 최소 응대 기준과 48시간 리뷰 답글 기준을 정합니다.',metric:'응대 관련 부정 언급률·리뷰 답글률'},
 {key:'청결·위생',patterns:[/더러|지저분|청결.*아쉽|위생.*아쉽|냄새.*불쾌|벌레|화장실.*아쉽|테이블.*끈적/i],action:'오픈·피크타임·마감 3회 위생 점검표를 운영하고, 고객 접점 공간은 담당자를 명확히 지정합니다.',metric:'위생 체크 이행률·동일 불만 재발률'},
 {key:'주차·접근',patterns:[/주차.*불편|주차.*좁|주차.*없|찾기 어려|입구.*헷갈|길.*불편|접근.*아쉽/i],action:'플레이스 사진과 SNS에 진입로·주차 위치·대체 주차 정보를 3컷으로 고정 안내합니다.',metric:'주차 문의·길 찾기 전화·관련 리뷰 추이'},
 {key:'메뉴·품절·정보',patterns:[/품절|메뉴.*없|단종|재료.*소진|헛걸음|영업시간.*다르|정보.*틀|메뉴판.*다르/i],action:'당일 품절·한정 수량·메뉴 변경을 네이버 소식과 매장 안내에 동시에 업데이트합니다.',metric:'품절 문의·헛걸음 리뷰·공지 조회수'},
 {key:'포장·배달 미지원',patterns:[/포장.*안|포장이 안|배달.*안|택배.*안|테이크아웃.*불가/i],action:'포장 가능 메뉴와 불가 사유를 먼저 안내하고, 누수·온도·품질 테스트 후 단계적으로 확대합니다.',metric:'포장 문의·판매 건수·포장 후 품질 리뷰'},
 {key:'공간·소음·온도',patterns:[/시끄|좁아|좌석.*불편|너무 덥|너무 춥|환기.*아쉽|냄새.*새 건물|공간.*불편/i],action:'혼잡 시간대의 좌석·음향·온도·환기 기준을 정하고, 예약 단계에서 적합한 좌석을 안내합니다.',metric:'공간 불편 언급률·좌석 변경 요청'},
 {key:'예약·운영 안내',patterns:[/예약.*안|예약.*어려|전화.*안 받|휴무.*몰랐|마감.*일찍|브레이크타임.*몰랐|운영시간.*아쉽/i],action:'플레이스 영업정보·예약 가능 시간·브레이크타임·마감 주문 시간을 매주 검수합니다.',metric:'예약 실패·운영시간 문의·헛걸음'},
 {key:'기대 불일치',patterns:[/생각과.*달|기대와.*달|사진과.*달|알고 있던.*아니|설명과.*다르|대표 사진.*다르/i],action:'대표 사진·핵심 문구·메뉴 설명을 실제 경험과 일치시키고 차별점을 주문 전에 명확히 알립니다.',metric:'기대 불일치 언급 추이·대표 사진 클릭률'}
];

const GENERAL_POSITIVE=[/좋아요|좋았|최고|만족|훌륭|완벽|추천|감동|행복|재밌|편안|감사|짱|대박|👍|❤️|😊|😍/i];
const GENERAL_NEGATIVE=[/아쉽|실망|최악|불편|별로|문제|개선|싫|화가|기분 나|안 되|안돼|못했|부족/i];

const SAMPLE_REVIEWS=[
 {date:'2026-08-29',rating:5,body:'국물이 진하고 시래기도 푸짐해서 아침 해장으로 정말 좋았어요. 매장도 깔끔하고 직원분이 친절해 다시 오고 싶습니다.'},
 {date:'2026-08-27',rating:5,body:'주차장이 넓고 부모님과 함께 오기 편했어요. 음식도 정갈하고 양이 많아 만족했습니다.'},
 {date:'2026-08-24',rating:4,body:'맛은 좋은데 아이가 먹기에는 조금 매웠어요. 순한 맛을 선택할 수 있으면 더 좋겠습니다.'},
 {date:'2026-08-21',rating:5,body:'여행 중 우연히 들렀는데 지역 맛집으로 추천하고 싶어요. 다음 여행에도 또 방문할 예정입니다.'},
 {date:'2026-08-19',rating:3,body:'점심시간에 손님이 많아 음식이 나오기까지 조금 오래 기다렸습니다. 예상 대기시간 안내가 있으면 좋겠어요.'},
 {date:'2026-08-17',rating:5,body:'인테리어가 깔끔하고 사진 찍기 좋습니다. 대표 메뉴도 기대 이상으로 맛있었어요.'},
 {date:'2026-08-13',rating:4,body:'전체적으로 만족하지만 포장이 안 돼서 아쉬웠습니다. 집에서도 먹을 수 있으면 좋겠어요.'},
 {date:'2026-08-10',rating:5,body:'사장님이 메뉴를 자세히 설명해주시고 아이 의자도 챙겨주셔서 가족 식사하기 편했습니다.'},
 {date:'2026-08-06',rating:5,body:'가격이 합리적이고 반찬 리필도 가능해서 가성비가 좋았습니다. 친구들에게 추천했어요.'},
 {date:'2026-08-02',rating:2,body:'대표 사진과 실제 메뉴가 조금 달라 당황했습니다. 메뉴 설명을 더 정확하게 보여주면 좋겠습니다.'},
 {date:'2026-07-28',rating:5,body:'재료가 신선하고 맛의 밸런스가 좋습니다. 벌써 세 번째 방문이에요.'},
 {date:'2026-07-24',rating:4,body:'주차 입구를 찾기 조금 어려웠지만 음식과 서비스는 만족스러웠습니다.'}
];

function toast(message,type='normal'){
 const el=$('#toast');el.textContent=message;el.style.borderLeftColor=type==='error'?'#d91f37':type==='success'?'#31a05f':'#ffcc00';el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200);
}
function setProgress(v){$('#progressBar').style.width=Math.max(0,Math.min(100,v))+'%'}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function cleanText(v){return String(v??'').replace(/\u0000/g,'').replace(/\r\n/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()}
function safeUrl(v){const s=String(v??'').trim();return /^https?:\/\//i.test(s)?s:''}
function normalizeDate(v){
 if(!v)return'';if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
 if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toISOString().slice(0,10)}
 const s=String(v).trim().replace(/[.\/]/g,'-').replace(/\s.*$/,'');
 const m=s.match(/(20\d{2})-?(\d{1,2})-?(\d{1,2})/);if(m)return`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
 return s.length<=20?s:'';
}
function numberOrNull(v){const n=Number(String(v??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>0?n:null}
function containsAny(text,patterns){return patterns.some(p=>p.test(text))}
function matchedConfigs(text,configs){return configs.filter(c=>containsAny(text,c.patterns))}
function unique(arr){return [...new Set(arr.filter(Boolean))]}
function badgeClass(s){return s==='긍정'?'pos':s==='개선동반 긍정'?'mix':s==='부정'?'neg':'neu'}
function today(){return new Date().toISOString().slice(0,10)}
function filenameSafe(s){return String(s||'네이버플레이스').replace(/[\\/:*?"<>|]/g,'_').trim()||'네이버플레이스'}

function analyzeOne(raw,index){
 const body=cleanText(raw.body||raw.content||raw.review||'');const text=body.toLowerCase();
 if(!body)return{...raw,no:index+1,body:'',sentiment:'분석 제외',positive:[],negative:[],improvement:'본문이 없어 감성 분류에서 제외했습니다.'};
 const pos=matchedConfigs(text,POSITIVE_THEMES);const neg=matchedConfigs(text,NEGATIVE_THEMES);
 const rating=numberOrNull(raw.rating);let posScore=pos.length+(containsAny(text,GENERAL_POSITIVE)?1:0)+(rating>=4?1:0);
 let negScore=neg.length+(containsAny(text,GENERAL_NEGATIVE)?1:0)+(rating&&rating<=2?2:0);
 let sentiment='중립';
 if(negScore>0&&posScore>0)sentiment='개선동반 긍정';else if(negScore>0)sentiment='부정';else if(posScore>0)sentiment='긍정';
 const improvement=neg.slice(0,2).map(x=>x.action).join(' / ');
 return{no:index+1,date:normalizeDate(raw.date),rating,body,url:safeUrl(raw.url||raw.sourceUrl||state.placeUrl),sentiment,positive:pos.map(x=>x.key),negative:neg.map(x=>x.key),improvement};
}

function aggregate(){
 const analyzed=state.reviews.filter(r=>r.sentiment!=='분석 제외');
 state.positiveThemes=POSITIVE_THEMES.map(c=>({name:c.key,count:analyzed.filter(r=>r.positive.includes(c.key)).length,config:c})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
 state.improvements=NEGATIVE_THEMES.map(c=>{
   const arr=analyzed.filter(r=>r.negative.includes(c.key));
   if(!arr.length)return null;
   const ratio=arr.length/Math.max(analyzed.length,1);const priority=arr.length>=5||ratio>=.12?'높음':arr.length>=2||ratio>=.05?'중간':'낮음';
   const representative=arr.slice().sort((a,b)=>b.body.length-a.body.length)[0];
   return{theme:c.key,count:arr.length,priority,signal:representative.body,action:c.action,metric:c.metric};
 }).filter(Boolean).sort((a,b)=>b.count-a.count);
 state.snsPlans=state.positiveThemes.slice(0,8).map((x,i)=>makeSnsPlan(x,i+1));
}

function makeSnsPlan(item,rank){
 const name=state.businessName||'우리 매장';const theme=item.name;const count=item.count;
 const hooks=[
   `${name}, 고객리뷰 ${count}건이 반복해서 말한 ‘${theme}’`,
   `광고 문구보다 정확한 답: 고객이 직접 남긴 ${theme}`,
   `${theme} 하나로 첫 방문을 재방문으로 바꾸는 방법`,
   `“왜 다시 오세요?” 리뷰 데이터가 보여준 ${name}의 강점`,
   `오늘 방문 전 10초만 보세요—${name}에서 놓치면 안 될 경험`
 ];
 const reasons=['숫자와 고객 권위를 결합해 신뢰를 만듭니다.','광고가 아닌 실제 고객 언어라는 반전이 주목도를 높입니다.','브랜드 강점을 재방문 행동과 연결해 효용을 선명하게 합니다.','질문형 구조가 호기심을 만들고 브랜드의 본질을 드러냅니다.','즉각적인 방문 이익을 제시해 저장과 공유를 유도합니다.'];
 return{rank,theme,count,hooks,reasons,format:item.config.format,shoot:item.config.shoot,cta:item.config.cta,frequency:item.config.frequency};
}
