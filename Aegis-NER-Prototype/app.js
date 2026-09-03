const regions = {
  gangtok:{title:'Gangtok · NH-10',meta:'East Sikkim · 27.3389° N, 88.6065° E',risk:91,severity:'Critical',window:'6–12 hours',confidence:'96.4%',rain:128,soil:91,slope:42,history:7,explanation:'Rapid 24-hour rainfall and near-saturated soil are the strongest drivers. Steep cut slopes along NH-10 increase failure likelihood.'},
  tawang:{title:'Tawang · BCT Road',meta:'Arunachal Pradesh · 27.5861° N, 91.8594° E',risk:83,severity:'High',window:'12–18 hours',confidence:'92.8%',rain:104,soil:84,slope:48,history:5,explanation:'Persistent rainfall and very steep terrain are the leading risk factors. Road cut instability near Sela Pass requires continuous watch.'},
  cherrapunji:{title:'Cherrapunji · SH-5',meta:'Meghalaya · 25.2702° N, 91.7320° E',risk:76,severity:'High',window:'12–24 hours',confidence:'90.6%',rain:142,soil:88,slope:34,history:4,explanation:'Exceptional rainfall and saturated surface soil dominate the forecast. Moderate slope geometry lowers risk slightly but cracks require inspection.'},
  kohima:{title:'Kohima · NH-29',meta:'Nagaland · 25.6751° N, 94.1086° E',risk:58,severity:'Moderate',window:'24–36 hours',confidence:'86.1%',rain:74,soil:66,slope:38,history:3,explanation:'Moisture is elevated but below the local failure threshold. Maintain caution along exposed cut slopes and watch for new field reports.'},
  agartala:{title:'Agartala · NH-8',meta:'Tripura · 23.8315° N, 91.2868° E',risk:31,severity:'Low',window:'No immediate event',confidence:'88.7%',rain:38,soil:44,slope:18,history:1,explanation:'Rainfall, saturation and slope are all below critical thresholds. Routine monitoring is sufficient at present.'}
};

const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
let selectedRegion = 'gangtok';
let offlineMode = localStorage.getItem('aegis-offline') === 'true';
let queue = JSON.parse(localStorage.getItem('aegis-report-queue') || '[]');
let toastTimer;

function setRegion(key, scroll=false){
  const data=regions[key]; if(!data) return;
  selectedRegion=key;
  $('#regionTitle').textContent=data.title; $('#regionMeta').textContent=data.meta;
  $('#riskScore').textContent=data.risk; $('#riskRing').style.setProperty('--risk',data.risk);
  const ringColor=data.risk>=85?'var(--red)':data.risk>=65?'var(--orange)':data.risk>=40?'var(--yellow)':'var(--green)';
  $('#riskRing').style.background=`conic-gradient(${ringColor} ${data.risk}%,#1c312b 0)`;
  const badge=$('#severityBadge'); badge.textContent=data.severity; badge.className=`severity ${data.severity.toLowerCase()}`;
  $('#forecastWindow').textContent=data.window; $('#confidenceText').textContent=`Model confidence ${data.confidence}`;
  $('#rainfallMetric').innerHTML=`${data.rain} <small>mm</small>`; $('#soilMetric').innerHTML=`${data.soil} <small>%</small>`; $('#slopeMetric').innerHTML=`${data.slope} <small>°</small>`; $('#historyMetric').textContent=String(data.history).padStart(2,'0');
  $('#rainBar').style.width=`${Math.min(100,data.rain/1.5)}%`; $('#soilBar').style.width=`${data.soil}%`; $('#slopeBar').style.width=`${Math.min(100,data.slope*2)}%`; $('#historyBar').style.width=`${Math.min(100,data.history*10)}%`;
  $('#aiExplanation').textContent=data.explanation;
  $$('.map-marker').forEach(el=>el.classList.toggle('selected',el.dataset.region===key));
  $('#alertPreviewTitle').textContent=data.title.replace(' · ',' — ');
  if(scroll) $('#risk-map').scrollIntoView({behavior:'smooth',block:'start'});
}

$$('.map-marker').forEach(marker=>{
  marker.addEventListener('click',()=>setRegion(marker.dataset.region));
  marker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setRegion(marker.dataset.region);}});
});
$$('[data-focus-region]').forEach(button=>button.addEventListener('click',()=>setRegion(button.dataset.focusRegion,true)));

$$('.chip').forEach(chip=>chip.addEventListener('click',()=>{
  $$('.chip').forEach(c=>c.classList.remove('active')); chip.classList.add('active');
  const layer=chip.dataset.layer;
  $('.road-layer').style.opacity=layer==='sensors'?.18:1;
  $('.sensor-layer').style.opacity=layer==='roads'?.18:1;
  $('.risk-markers').style.opacity=layer==='risk'?1:.55;
}));

$$('.nav-item').forEach(item=>item.addEventListener('click',()=>{
  $$('.nav-item').forEach(n=>n.classList.remove('active')); item.classList.add('active');
  document.getElementById(item.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});
}));

function showToast(title,text){
  clearTimeout(toastTimer); $('#toastTitle').textContent=title; $('#toastText').textContent=text;
  $('#toast').classList.add('visible'); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);
}

function updateNetwork(){
  $('#offlineDemo').classList.toggle('offline',offlineMode); $('#offlineDemo').setAttribute('aria-pressed',String(offlineMode));
  $('#networkText').textContent=offlineMode?'Offline demo':'Live network'; $('#offlineNotice').classList.toggle('visible',offlineMode);
  $('#queueCount').textContent=queue.length;
  localStorage.setItem('aegis-offline',String(offlineMode));
}

$('#offlineDemo').addEventListener('click',()=>{
  offlineMode=!offlineMode;
  if(!offlineMode && queue.length){ const count=queue.length; queue=[]; localStorage.setItem('aegis-report-queue','[]'); showToast('Reports synced',`${count} queued field report${count>1?'s':''} sent to the command center.`); }
  updateNetwork();
});

const reportDialog=$('#reportDialog'), alertDialog=$('#alertDialog');
['#openReport','#openReportSecondary'].forEach(id=>$(id).addEventListener('click',()=>reportDialog.showModal()));
['#openAlert','#panelAlert','#openAlertSecondary'].forEach(id=>$(id).addEventListener('click',()=>alertDialog.showModal()));

$('#mediaUpload').addEventListener('change',e=>$('#fileName').textContent=e.target.files[0]?.name||'JPG, PNG or MP4 · saved offline if needed');
$('#useLocation').addEventListener('click',()=>{
  $('#gpsStatus').textContent='Requesting secure GPS location…';
  if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>{ $('#reportLocation').value=`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`; $('#gpsStatus').textContent='GPS verified · accuracy '+Math.round(pos.coords.accuracy)+' m'; },()=>{ $('#reportLocation').value='Gangtok, NH-10 (demo GPS)'; $('#gpsStatus').textContent='Using prototype coordinates · GPS permission unavailable'; }); }
  else { $('#reportLocation').value='Gangtok, NH-10 (demo GPS)'; $('#gpsStatus').textContent='Using prototype coordinates'; }
});

$('#reportForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('#incidentType').value, location=$('#reportLocation').value;
  if(!type||!location||!$('#incidentDescription').value){ showToast('Missing information','Add the incident type, location and description.'); return; }
  const report={type,location,severity:$('#incidentSeverity').value,time:new Date().toISOString()};
  if(offlineMode){ queue.push(report); localStorage.setItem('aegis-report-queue',JSON.stringify(queue)); updateNetwork(); showToast('Saved offline','The geo-tagged report is queued and will sync automatically.'); }
  else { showToast('Report submitted','Field intelligence sent for district verification.'); }
  const article=document.createElement('article'); article.innerHTML=`<span class="report-type movement">NEW</span><div><strong>${escapeHtml(type)} · ${escapeHtml(location)}</strong><p>${offlineMode?'Queued offline':'Awaiting verification'} · evidence attached</p></div><time>now</time>`;
  $('#reportList').prepend(article); reportDialog.close(); e.target.reset(); $('#fileName').textContent='JPG, PNG or MP4 · saved offline if needed';
});

function escapeHtml(value){const node=document.createElement('div');node.textContent=value;return node.innerHTML;}

const alertMessages={
  en:'Landslide risk is critical. Avoid NH-10 and follow district administration instructions. Possible slope failure within 6–12 hours.',
  hi:'भूस्खलन का खतरा गंभीर है। NH-10 से बचें और जिला प्रशासन के निर्देशों का पालन करें। 6–12 घंटों में ढलान खिसकने की आशंका है।',
  as:'ভূমিস্খলনৰ আশংকা অতি গুৰুতৰ। NH-10 পৰিহাৰ কৰক আৰু জিলা প্ৰশাসনৰ নিৰ্দেশ মানি চলক। ৬–১২ ঘণ্টাৰ ভিতৰত ঢাল খহাৰ সম্ভাৱনা আছে।',
  bn:'ভূমিধসের ঝুঁকি অত্যন্ত গুরুতর। NH-10 এড়িয়ে চলুন এবং জেলা প্রশাসনের নির্দেশ মেনে চলুন। ৬–১২ ঘণ্টার মধ্যে ঢাল ধসের আশঙ্কা রয়েছে।',
  ne:'पहिरोको जोखिम अत्यन्त गम्भीर छ। NH-10 प्रयोग नगर्नुहोस् र जिल्ला प्रशासनको निर्देशन पालना गर्नुहोस्। ६–१२ घण्टाभित्र पहिरो जान सक्ने सम्भावना छ।',
  lus:'Leimin hlauhawmna a sang lutuk. NH-10 kal loh tur a ni a, district administration thupek zawm rawh. Darkar 6–12 chhungin lei a min thei.',
  kha:'Ka jingma twa khyndew ka jur bha. Wat leit lyngba NH-10 bad bud ïa ki jingbthah jong ka bor district. Ka lah ban twa hapoh 6–12 kynta.',
  nag:'Landslide risk critical ase. NH-10 pora najabi aru district administration laga instruction follow koribi. 6–12 ghonta bhitor slope giribo pare.'
};
const warningMessages={
  en:'Extreme soil saturation and 128 mm rainfall indicate a possible landslide within 6–12 hours.',
  hi:'अत्यधिक मिट्टी संतृप्ति और 128 मिमी वर्षा से 6–12 घंटों में भूस्खलन की आशंका है।',
  as:'অতিৰিক্ত মাটিৰ আৰ্দ্ৰতা আৰু ১২৮ মিমি বৰষুণে ৬–১২ ঘণ্টাৰ ভিতৰত ভূমিস্খলনৰ আশংকা দেখুৱাইছে।',
  bn:'অতিরিক্ত মাটির আর্দ্রতা এবং ১২৮ মিমি বৃষ্টি আগামী ৬–১২ ঘণ্টার মধ্যে ভূমিধসের আশঙ্কা দেখাচ্ছে।',
  ne:'अत्यधिक माटोको चिस्यान र १२८ मिमि वर्षाले ६–१२ घण्टाभित्र पहिरोको सम्भावना देखाउँछ।'
};
$('#alertLanguage').innerHTML=$('#languageSelect').innerHTML;
function setLanguage(lang){ $('#warningText').textContent=warningMessages[lang]||warningMessages.en; $('#alertPreviewText').textContent=alertMessages[lang]||alertMessages.en; $('#alertLanguage').value=lang; }
$('#languageSelect').addEventListener('change',e=>setLanguage(e.target.value));
$('#alertLanguage').addEventListener('change',e=>{ $('#alertPreviewText').textContent=alertMessages[e.target.value]||alertMessages.en; $('#languageSelect').value=e.target.value; });

$('#alertForm').addEventListener('submit',e=>{ e.preventDefault(); alertDialog.close(); showToast('Warning issued','Multi-channel alert sent to communities and authorities.'); });
$('#dispatchBtn').addEventListener('click',()=>showToast('Response team assigned',`SDRF unit dispatched to ${regions[selectedRegion].title}.`));
$('#refreshRoads').addEventListener('click',e=>{ e.target.textContent='Refreshing…'; setTimeout(()=>{e.target.textContent='Refresh';showToast('Road network updated','Latest district control room reports loaded.');},700); });

const sliders={rain:$('#rainSlider'),soil:$('#soilSlider'),slope:$('#slopeSlider'),history:$('#historySlider')};
function calculateRisk(){
  const rain=+sliders.rain.value,soil=+sliders.soil.value,slope=+sliders.slope.value,history=+sliders.history.value;
  $('#rainOutput').textContent=`${rain} mm`; $('#soilOutput').textContent=`${soil}%`; $('#slopeOutput').textContent=`${slope}°`; $('#historyOutput').textContent=history;
  const score=Math.round(Math.min(99,(rain/180)*32+(soil/100)*32+(slope/60)*24+(history/12)*12));
  const severity=score>=85?'CRITICAL':score>=65?'HIGH':score>=40?'MODERATE':'LOW';
  $('#simScore').textContent=`${score}%`; $('#simBand').style.width=`${score}%`; $('#simSeverity').textContent=severity;
  $('#simSeverity').style.color=score>=85?'var(--red)':score>=65?'var(--orange)':score>=40?'var(--yellow)':'var(--green)';
  $('#simForecast').textContent=score>=85?'Action window: 6–12 hours':score>=65?'Action window: 12–24 hours':score>=40?'Enhanced monitoring advised':'Routine monitoring';
}
Object.values(sliders).forEach(slider=>slider.addEventListener('input',calculateRisk));

setInterval(()=>{ const seconds=Math.floor(Date.now()/1000)%60; $('#updatedTime').textContent=seconds<5?'just now':`${seconds} sec ago`; },1000);
updateNetwork(); calculateRisk(); setRegion('gangtok');

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
