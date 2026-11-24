'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {pageRoutes,type View} from '@/lib/routes';
import {readDemoIssues} from '@/lib/demo';
import {ArrowUpRight,ArrowRight,Plus,Search,LayoutDashboard,Map,Compass,CheckCheck,ChartNoAxesCombined,Info,LifeBuoy,ChevronDown,MapPin,ThumbsUp,SlidersHorizontal,List,ShieldCheck,Menu,X,Globe,Camera,FileText,Send,Users,Clock,CheckCircle2,Activity,LocateFixed,Bookmark,LogOut,ChevronLeft,ChevronRight,Heart,TreePine,Droplets,Route,Lightbulb,Trash2,Eye,Lock,Flag,Quote,ImagePlus,Hash,CalendarDays,Sparkles} from 'lucide-react';
import {words,issues as samples,categories,districts,type Issue,type Language} from '@/lib/data';
import {supabase} from '@/lib/supabase';
import {editorial,heroImages,topicImages} from '@/lib/editorial';
import {innerCopy} from '@/lib/inner';

type Modal='report'|'auth'|'track'|'privacy'|null;
const trackSteps=['submitted','review','published','followup','verified'] as const;
const stepIndex=(s:string)=>{const i=trackSteps.indexOf(s as typeof trackSteps[number]);if(i>=0)return i;return ({information_required:1,complaint_filed:3,action_reported:3,closed:4} as Record<string,number>)[s]??0;};
const ui={
 en:{menu:'Menu',navigate:'Navigate',account:'Your account',language:'Language',glance:'At a glance',quick:'Get involved',oldest:'Oldest first',sort:'Sort',reference:'Reference',reported:'Reported on',supporters:'supporters',photoSource:'Illustrative photo source',stronger:'A stronger voice, together.',strongerText:'Supporting this issue tells your community that this concern matters. One account, one support.',discussion:'Community discussion',noComments:'No comments yet. Start a thoughtful conversation.',addComment:'Add your comment',respect:'Be respectful. Do not share private personal information.',post:'Post comment',join:'Join the conversation',joinText:'Sign in or create an account to add a comment.',signup:'Sign up',createTitle:'Create your account',create:'Create account',displayName:'Public display name',password:'Password',confirm:'Confirm your email before submitting reports or comments.',created:'Account created. Confirm your email before signing in.',titleHint:'A short, clear title for your concern',placeHint:'Locality or nearby public landmark',fileHint:'JPEG, PNG, WebP · max 5 MB · Avoid private information',chooseFile:'Choose a photo',demoCitizen:'Demo citizen',demoComment:'Illustrative discussion: a clear location and dated evidence will help reviewers follow up on this concern.',signinComment:'Sign in to add a comment.',about:'About the issue',details:'Details',resolvedCount:'resolutions documented',districtLabel:'District',chooseDistrict:'Choose a district',designed:'Designed and Powered by'},
 kn:{menu:'ಮೆನು',navigate:'ಪುಟಗಳು',account:'ನಿಮ್ಮ ಖಾತೆ',language:'ಭಾಷೆ',glance:'ಒಂದು ನೋಟದಲ್ಲಿ',quick:'ಭಾಗವಹಿಸಿ',oldest:'ಹಳೆಯವು ಮೊದಲು',sort:'ವಿಂಗಡಿಸಿ',reference:'ಉಲ್ಲೇಖ',reported:'ವರದಿ ದಿನಾಂಕ',supporters:'ಬೆಂಬಲಿಗರು',photoSource:'ಮಾದರಿ ಛಾಯಾಚಿತ್ರದ ಮೂಲ',stronger:'ಒಟ್ಟಾಗಿ ಬಲವಾದ ಧ್ವನಿ.',strongerText:'ಈ ಸಮಸ್ಯೆಯನ್ನು ಬೆಂಬಲಿಸುವುದು ಸಮುದಾಯಕ್ಕೆ ಅದರ ಮಹತ್ವ ತಿಳಿಸುತ್ತದೆ.',discussion:'ಸಮುದಾಯ ಚರ್ಚೆ',noComments:'ಇನ್ನೂ ಪ್ರತಿಕ್ರಿಯೆಗಳಿಲ್ಲ. ಚರ್ಚೆ ಆರಂಭಿಸಿ.',addComment:'ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ಸೇರಿಸಿ',respect:'ಗೌರವದಿಂದ ಬರೆಯಿರಿ. ಖಾಸಗಿ ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',post:'ಪ್ರತಿಕ್ರಿಯೆ ಪ್ರಕಟಿಸಿ',join:'ಚರ್ಚೆಯಲ್ಲಿ ಸೇರಿ',joinText:'ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಲು ಲಾಗಿನ್ ಅಥವಾ ನೋಂದಣಿ ಮಾಡಿ.',signup:'ನೋಂದಣಿ',createTitle:'ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ',create:'ಖಾತೆ ರಚಿಸಿ',displayName:'ಸಾರ್ವಜನಿಕ ಹೆಸರು',password:'ಪಾಸ್‌ವರ್ಡ್',confirm:'ವರದಿ ಅಥವಾ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಮೊದಲು ಇಮೇಲ್ ದೃಢೀಕರಿಸಿ.',created:'ಖಾತೆ ರಚಿಸಲಾಗಿದೆ. ಲಾಗಿನ್ ಮಾಡುವ ಮೊದಲು ಇಮೇಲ್ ದೃಢೀಕರಿಸಿ.',titleHint:'ನಿಮ್ಮ ಸಮಸ್ಯೆಗೆ ಚಿಕ್ಕ, ಸ್ಪಷ್ಟ ಶೀರ್ಷಿಕೆ',placeHint:'ಪ್ರದೇಶ ಅಥವಾ ಹತ್ತಿರದ ಸಾರ್ವಜನಿಕ ಗುರುತು',fileHint:'JPEG, PNG, WebP · ಗರಿಷ್ಠ 5 MB · ಖಾಸಗಿ ಮಾಹಿತಿ ಬೇಡ',chooseFile:'ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ',demoCitizen:'ಮಾದರಿ ನಾಗರಿಕ',demoComment:'ಮಾದರಿ ಚರ್ಚೆ: ಸ್ಪಷ್ಟ ಸ್ಥಳ ಮತ್ತು ದಿನಾಂಕದ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆಗೆ ಸಹಾಯಕ.',signinComment:'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.',about:'ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ',details:'ವಿವರಗಳು',resolvedCount:'ದಾಖಲಿತ ಪರಿಹಾರಗಳು',districtLabel:'ಜಿಲ್ಲೆ',chooseDistrict:'ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ',designed:'Designed and Powered by'},
 hi:{menu:'मेनू',navigate:'पेज',account:'आपका खाता',language:'भाषा',glance:'एक नज़र में',quick:'भाग लें',oldest:'सबसे पुराने',sort:'क्रम',reference:'संदर्भ',reported:'रिपोर्ट तिथि',supporters:'समर्थक',photoSource:'उदाहरण फ़ोटो का स्रोत',stronger:'साथ मिलकर मज़बूत आवाज़।',strongerText:'समर्थन से समुदाय को पता चलता है कि यह चिंता महत्वपूर्ण है।',discussion:'समुदाय चर्चा',noComments:'अभी कोई टिप्पणी नहीं। चर्चा शुरू करें।',addComment:'अपनी टिप्पणी जोड़ें',respect:'सम्मानपूर्वक लिखें। निजी जानकारी साझा न करें।',post:'टिप्पणी पोस्ट करें',join:'चर्चा में शामिल हों',joinText:'टिप्पणी करने के लिए साइन इन करें या खाता बनाएँ।',signup:'साइन अप',createTitle:'अपना खाता बनाएँ',create:'खाता बनाएँ',displayName:'सार्वजनिक नाम',password:'पासवर्ड',confirm:'रिपोर्ट या टिप्पणी से पहले ईमेल सत्यापित करें।',created:'खाता बना। साइन इन से पहले अपना ईमेल सत्यापित करें।',titleHint:'अपनी समस्या के लिए छोटा, स्पष्ट शीर्षक',placeHint:'इलाका या पास का सार्वजनिक स्थल',fileHint:'JPEG, PNG, WebP · अधिकतम 5 MB · निजी जानकारी न डालें',chooseFile:'फ़ोटो चुनें',demoCitizen:'डेमो नागरिक',demoComment:'उदाहरण चर्चा: स्पष्ट स्थान और दिनांक वाले साक्ष्य समीक्षा में सहायक हैं।',signinComment:'कृपया साइन इन करें।',about:'समस्या के बारे में',details:'विवरण',resolvedCount:'दर्ज समाधान',districtLabel:'ज़िला',chooseDistrict:'ज़िला चुनें',designed:'Designed and Powered by'}
};

export default function PublicSite({initialView='home'}:{initialView?:View}){
 const router=useRouter();
 const [lang,setLang]=useState<Language>('en'),[view,setView]=useState<View>(initialView),[modal,setModal]=useState<Modal>(null),[selected,setSelected]=useState<Issue|null>(null),[rows,setRows]=useState<Issue[]>(samples),[supported,setSupported]=useState<string[]>([]),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[district,setDistrict]=useState('all'),[status,setStatus]=useState('all'),[sort,setSort]=useState('recent'),[mobile,setMobile]=useState(false),[message,setMessage]=useState(''),[email,setEmail]=useState(''),[user,setUser]=useState<string|null>(null),[reference,setReference]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false),[mapList,setMapList]=useState(false),[authMode,setAuthMode]=useState<'signin'|'signup'>('signin'),[password,setPassword]=useState(''),[displayName,setDisplayName]=useState(''),[commentText,setCommentText]=useState(''),[comments,setComments]=useState<{id:string;display_name:string;body:string;created_at:string}[]>([]),[commentBusy,setCommentBusy]=useState(false),[commentMessage,setCommentMessage]=useState('');
 const [heroSlide,setHeroSlide]=useState(0),[paused,setPaused]=useState(false),[scrolled,setScrolled]=useState(false),[fileName,setFileName]=useState('');
 const t=words[lang];
 const u=ui[lang];
 const brandParts={en:['VOICE','OF','YOU'],kn:['ವಾಯ್ಸ್','ಆಫ್','ಯು'],hi:['वॉइस','ऑफ़','यू']}[lang];
 const copy=editorial[lang];
 const inner=innerCopy[lang];
 const demo=!supabase;
 const locale=lang==='kn'?'kn-IN':lang==='hi'?'hi-IN':'en-IN';

 useEffect(()=>{
  try {const l=localStorage.getItem('voy-language') as Language;if(l&&words[l])setLang(l);if(!supabase){setRows(readDemoIssues().filter(i=>!['rejected','restricted','withdrawn'].includes(i.status)));setSupported(JSON.parse(localStorage.getItem('voy-supports')||'[]'));}} catch {}
  if(!supabase)return;
  const db=supabase;
  type DbRow={reference:string;title:string;description:string;category:string;district:string;locality:string;status:string;created_at:string};
  const convert=(r:DbRow,mine=false):Issue=>({id:r.reference,title:{en:r.title,kn:r.title,hi:r.title},description:{en:r.description,kn:r.description,hi:r.description},category:r.category,district:r.district,locality:r.locality,status:r.status,support:0,image:'',date:r.created_at,x:50,y:50,mine});
  async function load(){
   const {data:{user:u}}=await db.auth.getUser();setUser(u?.email??null);
   const [{data:publicData,error},{data:counts}]=await Promise.all([db.from('public_issues').select('*').order('created_at',{ascending:false}),db.from('support_counts').select('*')]);
   if(error){setMessage(error.message);return;}
   let next=(publicData||[]).map(r=>convert(r));
   if(u){const [{data:own},{data:votes}]=await Promise.all([db.from('issues').select('*').eq('user_id',u.id),db.from('supports').select('issue_reference').eq('user_id',u.id)]);const ownRows=(own||[]).map(r=>convert(r,true));next=[...ownRows,...next.filter(i=>!ownRows.some(o=>o.id===i.id))];setSupported((votes||[]).map(v=>v.issue_reference));}else setSupported([]);
   setRows(next.map(i=>({...i,support:(counts||[]).find(c=>c.issue_reference===i.id)?.count||0})));
  }
  void load();const {data:{subscription}}=db.auth.onAuthStateChange(()=>{setTimeout(()=>void load(),0);});return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{document.documentElement.lang=lang;localStorage.setItem('voy-language',lang);},[lang]);
 useEffect(()=>{if(!modal&&!selected)return;const previous=document.activeElement as HTMLElement|null;document.body.style.overflow='hidden';const timer=setTimeout(()=>document.querySelector<HTMLElement>('.modal button,.modal input')?.focus(),0);const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setModal(null);setSelected(null);}if(event.key==='Tab'){const items=Array.from(document.querySelectorAll<HTMLElement>('.modal button,.modal input,.modal select,.modal textarea,.modal a[href]')).filter(el=>!el.hasAttribute('disabled'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};document.addEventListener('keydown',onKey);return()=>{clearTimeout(timer);document.body.style.overflow='';document.removeEventListener('keydown',onKey);previous?.focus();};},[modal,selected]);
 // Mobile drawer: lock scroll and close on Escape.
 useEffect(()=>{if(!mobile)return;document.body.style.overflow='hidden';const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMobile(false);};document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow='';document.removeEventListener('keydown',onKey);};},[mobile]);
 // Header elevation once the page scrolls.
 useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>12);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll);},[]);
 // Hero autoplay, disabled for reduced motion and while hovered/focused.
 useEffect(()=>{if(view!=='home'||paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const id=setInterval(()=>setHeroSlide(s=>(s+1)%3),7000);return()=>clearInterval(id);},[view,paused,heroSlide]);
 // Gentle reveal for static editorial sections.
 useEffect(()=>{document.documentElement.classList.add('js-reveal');const items=Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('is-visible'));return;}const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});items.forEach(el=>io.observe(el));return()=>io.disconnect();},[view,lang]);

 const navigate=(v:View,topic?:string)=>{const target=pageRoutes[v]+(topic?'?category='+encodeURIComponent(topic):'');setMobile(false);if(v!==view){router.push(target);}else{setView(v);setQuery('');setCategory(topic||'all');setStatus('all');setDistrict('all');setMapList(false);window.scrollTo({top:0,behavior:'smooth'});}};
 useEffect(()=>{const topic=new URLSearchParams(window.location.search).get('category');if(topic&&categories.includes(topic as typeof categories[number]))setCategory(topic);},[]);
 const open=(m:Modal)=>{setMobile(false);setModal(m);setMessage('');setSuccess('');};
 const support=async(i:Issue)=>{if(supabase){const {data:{user:u}}=await supabase.auth.getUser();if(!u){open('auth');return;}const has=supported.includes(i.id);const result=has?await supabase.from('supports').delete().eq('issue_reference',i.id).eq('user_id',u.id):await supabase.from('supports').insert({issue_reference:i.id,user_id:u.id});if(result.error){setMessage(result.error.message);return;}}const next=supported.includes(i.id)?supported.filter(id=>id!==i.id):[...supported,i.id];if(supabase){const delta=supported.includes(i.id)?-1:1;setRows(prev=>prev.map(row=>row.id===i.id?{...row,support:Math.max(0,row.support+delta)}:row));setSelected(prev=>prev?.id===i.id?{...prev,support:Math.max(0,prev.support+delta)}:prev);}setSupported(next);localStorage.setItem('voy-supports',JSON.stringify(next));};
 const filtered=rows.filter(i=>(view!=='resolved'||i.status==='verified')&&(view!=='my'||i.mine)&&(view!=='saved'||supported.includes(i.id))&&(view!=='watch'||i.category==='roads')&&(category==='all'||i.category===category)&&(district==='all'||i.district===district)&&(status==='all'||i.status===status)&&`${i.title[lang]} ${i.title.en} ${i.district} ${i.locality} ${i.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='support'?b.support-a.support:sort==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
 const scoped=rows.filter(i=>(view!=='resolved'||i.status==='verified')&&(view!=='my'||i.mine)&&(view!=='saved'||supported.includes(i.id))&&(view!=='watch'||i.category==='roads'));
 const clearFilters=()=>{setQuery('');setCategory('all');setDistrict('all');setStatus('all');};
 const hasFilters=Boolean(query||category!=='all'||district!=='all'||status!=='all');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const form=e.currentTarget;const f=new FormData(form);const title=String(f.get('title')).trim(),description=String(f.get('description')).trim();if(!title||!description){setMessage(t.required);setBusy(false);return;}const image=f.get('image') as File;if(image?.size>5*1024*1024){setMessage('Maximum image size: 5 MB.');setBusy(false);return;}if(image?.size&&!['image/jpeg','image/png','image/webp'].includes(image.type)){setMessage('JPEG, PNG or WebP only.');setBusy(false);return;}const id=`VOY-2026-${crypto.randomUUID().slice(0,8).toUpperCase()}`;const item:Issue={id,title:{en:title,kn:title,hi:title},description:{en:description,kn:description,hi:description},category:String(f.get('category')),district:String(f.get('district')),locality:String(f.get('locality')).trim(),date:new Date().toISOString().slice(0,10),status:'submitted',support:0,image:'',x:50,y:50,mine:true};try{if(supabase){const {data:{user:u}}=await supabase.auth.getUser();if(!u)throw Error(t.auth);const {data,error}=await supabase.from('issues').insert({reference:id,user_id:u.id,title,description,category:item.category,district:item.district,locality:item.locality,consent:true}).select('id').single();if(error)throw error;if(image?.size){const path=`${u.id}/${data.id}/${crypto.randomUUID()}.${image.type.split('/')[1]}`;const uploaded=await supabase.storage.from('evidence').upload(path,image);if(uploaded.error){setMessage('Report saved, but evidence upload failed. Keep your reference and retry from your account.');}else{const attached=await supabase.from('evidence').insert({issue_id:data.id,user_id:u.id,path});if(attached.error)setMessage('Report saved; evidence needs to be attached again.');}}}else{if(image?.size)item.image=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(image);});const own=rows.filter(i=>i.mine);localStorage.setItem('voy-reports',JSON.stringify([item,...own]));}setRows(prev=>[item,...prev]);setSuccess(id);form.reset();setFileName('');}catch(error){setMessage(error instanceof Error?error.message:'Unable to save. Please try again.');}finally{setBusy(false);}}
 async function signIn(e:FormEvent){e.preventDefault();if(!supabase){setMessage(t.authDemo);return;}setBusy(true);if(authMode==='signup'){const {error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName.trim()||'Citizen'},emailRedirectTo:window.location.origin}});setMessage(error?error.message:u.created);}else{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMessage(error.message);else{setModal(null);setPassword('');}}setBusy(false);}
 useEffect(()=>{let active=true;setCommentText('');setCommentMessage('');setComments([]);if(!selected)return;if(!supabase){setComments([{id:'demo-'+selected.id,display_name:ui[lang].demoCitizen,body:ui[lang].demoComment,created_at:selected.date}]);return;}supabase.from('public_comments').select('*').eq('issue_reference',selected.id).order('created_at',{ascending:true}).then(({data,error})=>{if(!active)return;if(error)setCommentMessage(error.message);else setComments(data||[]);});return()=>{active=false;};},[selected?.id,lang]);
 async function postComment(e:FormEvent){e.preventDefault();if(!supabase||!selected||!user){setCommentMessage(u.signinComment);return;}setCommentBusy(true);setCommentMessage('');try{const {data:{user:account}}=await supabase.auth.getUser();if(!account||!account.email_confirmed_at)throw Error('Confirm your email and sign in before commenting.');const body=commentText.trim();if(body.length<3||body.length>2000)throw Error('Comments must contain 3 to 2000 characters.');const name=String(account.user_metadata.display_name||'Citizen').slice(0,60);const {data,error}=await supabase.from('comments').insert({issue_reference:selected.id,user_id:account.id,display_name:name,body}).select('id,display_name,body,created_at').single();if(error)throw error;setComments(prev=>[...prev,data]);setCommentText('');}catch(error){setCommentMessage(error instanceof Error?error.message:JSON.stringify(error));}finally{setCommentBusy(false);}}

 const icons={home:LayoutDashboard,explore:Compass,map:Map,watch:ChartNoAxesCombined,resolved:CheckCheck,about:Info,help:LifeBuoy,my:FileText,saved:Bookmark};
 const catIcon=(c:string,size=15)=>c==='roads'?<Route size={size}/>:c==='water'?<Droplets size={size}/>:c==='sanitation'?<Trash2 size={size}/>:c==='electricity'?<Lightbulb size={size}/>:<LayoutDashboard size={size}/>;
 const label=(s:string)=>t[s as 'review']||s.replaceAll('_',' ');
 const count=(i:Issue)=>i.support+(demo&&supported.includes(i.id)?1:0);
 const fmt=(d:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'short',year:'numeric'})=>new Date(d).toLocaleDateString(locale,opts);
 const stats=[{value:rows.length,label:t.reported,icon:FileText},{value:rows.filter(i=>['review','published','followup','information_required','complaint_filed','action_reported'].includes(i.status)).length,label:t.progress,icon:Activity},{value:rows.filter(i=>i.status==='verified').length,label:t.fixed,icon:CheckCircle2},{value:new Set(rows.map(i=>i.district)).size,label:t.districts,icon:MapPin}];

 const brand=(footer=false)=><button className={`brand-lockup ${footer?'is-footer':''}`} onClick={()=>navigate('home')} aria-label="Voice of You home"><span className="logo-symbol"><img src="/logo.png" alt=""/></span><span className={`brand-text is-${lang}`}><span className="brand-name"><strong>{brandParts[0]}</strong><small>{brandParts[1]}</small><strong>{brandParts[2]}</strong></span><span className="brand-tagline">{t.mission}</span><span className="brand-tricolor" aria-hidden="true"><i/><i/><i/></span></span></button>;

 const card=(i:Issue)=><article className="issue-card" key={i.id}>
  <button className="card-media" onClick={()=>setSelected(i)} aria-label={i.title[lang]}>
   {i.image?<img src={i.image} alt={`${t[i.category as 'roads']||i.category} · ${t.demo}`} loading="lazy"/>:<span className="no-photo">{catIcon(i.category,34)}</span>}
   <span className={`status status-${i.status}`}><span/>{label(i.status)}</span>
   <span className="photo-label">{demo?(i.mine?'LOCAL':'DEMO'):'REPORT'}</span>
  </button>
  <div className="card-body">
   <div className="card-meta"><span className={`category category-${i.category}`}>{catIcon(i.category,13)}{t[i.category as 'roads']||i.category}</span><span className="card-date">{fmt(i.date,{day:'numeric',month:'short'})}</span></div>
   <h3><button className="card-title" onClick={()=>setSelected(i)}>{i.title[lang]}</button></h3>
   <p className="location"><MapPin size={14}/>{i.locality}, {i.district}</p>
   <p className="card-excerpt">{i.description[lang]}</p>
   <div className="card-foot">
    <button className={`support-pill ${supported.includes(i.id)?'is-supported':''}`} onClick={()=>support(i)} aria-pressed={supported.includes(i.id)}><ThumbsUp size={15}/><strong>{count(i)}</strong><span>{supported.includes(i.id)?t.supported:t.support}</span></button>
    <span className="card-ref">{i.id}</span>
    <button className="card-arrow" onClick={()=>setSelected(i)} aria-label={t.view}><ArrowUpRight size={18}/></button>
   </div>
  </div>
 </article>;

 const mapPanel=()=><div className="map-panel"><div className="map-caption"><span className="live-dot"/>{t.mapTitle}<small>{demo?t.demo:t.official}</small></div><svg viewBox="0 0 360 430" role="img" aria-label={t.mapTitle}><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e4d8c0" strokeWidth=".6"/></pattern><linearGradient id="state" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6ecd8"/><stop offset="1" stopColor="#ecdcbc"/></linearGradient></defs><rect width="360" height="430" fill="url(#grid)"/><path d="M112 34 L152 43 176 27 214 39 233 20 267 41 264 72 283 99 258 125 269 151 239 174 246 199 224 222 242 248 220 269 232 302 205 316 207 341 173 366 155 399 123 388 112 354 91 329 83 297 65 277 62 242 46 216 55 182 70 157 69 127 93 109 87 80Z" fill="url(#state)" stroke="#0b2d4f" strokeOpacity=".35" strokeWidth="1.6"/><path d="M87 80L154 107 214 39M69 127L163 145 258 125M55 182L142 184 239 174M62 242L161 225 246 199M83 297L166 277 220 269M112 354L173 316 232 302M154 107L142 184 161 225 166 277 173 316 155 399" fill="none" stroke="#c9b48c" strokeWidth=".8"/>{filtered.map((i,index)=><g key={i.id} className="map-pin" role="button" tabIndex={0} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i);}}} aria-label={`${i.title[lang]}, ${i.district}`}><circle cx={60+i.x*2} cy={30+i.y*3.6} r="15" fill={i.status==='verified'?'#1f7a52':'#e8892f'} opacity=".18"/><circle cx={60+i.x*2} cy={30+i.y*3.6} r="6" fill={i.status==='verified'?'#1f7a52':'#e8892f'} stroke="white" strokeWidth="2"/><text x={75+i.x*2} y={34+i.y*3.6} fontSize="10" fill="#0b2d4f">{index%2===0?i.locality:''}</text></g>)}<text x="80" y="419" fontSize="9" letterSpacing="1.5" fill="#7a6a4c">KARNATAKA · APPROXIMATE LOCATIONS</text></svg><div className="map-note"><LocateFixed size={14}/>{t.mapSub}</div></div>;

 const verified=samples.find(i=>i.status==='verified');
 const isListing=!['home','about','help'].includes(view);

 return <div className={`app-shell ${view==='home'?'is-home':'is-inner'}`}>
  <a className="skip-link" href="#main">Skip to content</a>

  <div className="announcement"><div className="wrap"><span><Heart size={13}/>{copy.announcement}</span><span className="announcement-mid">{t.independent}</span><button onClick={()=>open('track')}>{t.track}<ArrowUpRight size={13}/></button></div></div>

  <header className={`site-header ${scrolled?'is-scrolled':''}`}>
   <div className="wrap header-row">
    {brand()}
    <nav className="primary-nav" aria-label="Primary">{(['home','explore','resolved','about'] as View[]).map(v=><Link key={v} href={pageRoutes[v]} className={view===v?'current':''} aria-current={view===v?'page':undefined}>{t[v]}</Link>)}</nav>
    <div className="header-actions">
     <label className="language"><Globe size={16}/><span className="sr-only">Language</span><select aria-label="Language / ಭಾಷೆ / भाषा" value={lang} onChange={e=>setLang(e.target.value as Language)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="hi">हिन्दी</option></select><ChevronDown size={13}/></label>
     {user?<button className="header-link" aria-label={t.signout} onClick={async()=>{await supabase?.auth.signOut();setUser(null);}}><LogOut size={16}/><span>{t.signout}</span></button>:<button className="header-link" onClick={()=>open('auth')}><span>{t.signin}</span><ArrowUpRight size={15}/></button>}
     <button className="button primary header-cta" onClick={()=>open('report')}><Plus size={17}/><span>{t.report}</span></button>
     <button className="menu-toggle" onClick={()=>setMobile(true)} aria-label="Open navigation" aria-expanded={mobile}><Menu size={22}/></button>
    </div>
   </div>
  </header>

  {mobile&&<button className="drawer-scrim" onClick={()=>setMobile(false)} aria-label={t.close} tabIndex={-1}/>}
  <aside className={`drawer ${mobile?'is-open':''}`} aria-hidden={!mobile} aria-label={u.menu} inert={!mobile}>
   <div className="drawer-head">{brand()}<button className="icon-button" onClick={()=>setMobile(false)} aria-label={t.close}><X size={20}/></button></div>
   <p className="drawer-label">{t.platform}</p>
   <nav>{(['home','explore','resolved','map','watch'] as View[]).map(v=>{const Icon=icons[v];return <button className={view===v?'active':''} onClick={()=>navigate(v)} key={v}><Icon size={18}/>{t[v]}{v==='explore'&&<span className="nav-count">{rows.length}</span>}</button>;})}</nav>
   <p className="drawer-label">{t.community}</p>
   <nav>{(['my','saved','about','help'] as View[]).map(v=>{const Icon=icons[v];return <button key={v} className={view===v?'active':''} onClick={()=>navigate(v)}><Icon size={18}/>{t[v]}</button>;})}</nav>
   <div className="drawer-foot">
    <label className="language is-block"><Globe size={16}/><select aria-label="Language / ಭಾಷೆ / भाषा" value={lang} onChange={e=>setLang(e.target.value as Language)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="hi">हिन्दी</option></select><ChevronDown size={13}/></label>
    {user?<button className="button outline" onClick={async()=>{await supabase?.auth.signOut();setUser(null);setMobile(false);}}><LogOut size={16}/>{t.signout}</button>:<button className="button outline" onClick={()=>open('auth')}>{t.signin}<ArrowUpRight size={15}/></button>}
    <button className="button primary" onClick={()=>open('report')}><Plus size={17}/>{t.report}</button>
    <p className="drawer-note"><ShieldCheck size={15}/>{t.independent}</p>
   </div>
  </aside>

  <main id="main">
   {message&&!modal&&<div className="wrap"><p className="form-message is-floating" role="status">{message}<button onClick={()=>setMessage('')} aria-label={t.close}><X size={14}/></button></p></div>}

   {view==='home'&&<>
    <section className="hero" aria-label={copy.heroLabel} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}>
     <div className="hero-art">{heroImages.map((src,n)=><img key={src} className={heroSlide===n?'is-active':''} src={src} alt={heroSlide===n?copy.imageAlts[n]:''} aria-hidden={heroSlide!==n}/>)}<div className="hero-shade"/></div>
     <div className="wrap hero-inner">
      <div className="hero-copy" key={heroSlide}>
       <p className="eyebrow is-light">{copy.heroLabel}</p>
       <h1>{copy.headlines[heroSlide][0]}<br/><em>{copy.headlines[heroSlide][1]}</em></h1>
       <p className="hero-description">{copy.descriptions[heroSlide]}</p>
       <div className="hero-actions"><button className="button primary large" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={18}/></button><button className="button ghost large" onClick={()=>navigate('explore')}>{t.exploreCta}<ArrowRight size={18}/></button></div>
      </div>
      <div className="hero-seal" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="seal-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text><textPath href="#seal-circle">YOUR VOICE · YOUR FUTURE · CITIZEN FIRST ·</textPath></text></svg><ShieldCheck size={28}/></div>
      <div className="hero-controls">
       <div className="slide-number">0{heroSlide+1}<small>/ 03</small></div>
       <div className="slide-tabs">{copy.slideLabels.map((l,n)=><button key={n} className={heroSlide===n?'current':''} onClick={()=>setHeroSlide(n)} aria-pressed={heroSlide===n}><i/><span>{l}</span></button>)}</div>
       <div className="slide-arrows"><button onClick={()=>setHeroSlide((heroSlide+2)%3)} aria-label={copy.previous}><ChevronLeft size={18}/></button><button onClick={()=>setHeroSlide((heroSlide+1)%3)} aria-label={copy.next}><ChevronRight size={18}/></button></div>
      </div>
     </div>
    </section>

    <div className="values-ribbon" aria-label={copy.values.join(', ')}><div className="ribbon-track" aria-hidden="true">{[...copy.values,...copy.values].map((value,n)=><span key={n}>{value}<i>✦</i></span>)}</div></div>

    <section className="stats-band"><div className="wrap stats-grid">{stats.map((s,n)=><div className="stat reveal" key={n} style={{transitionDelay:`${n*70}ms`}}><span className="stat-icon"><s.icon size={20}/></span><strong>{s.value.toString().padStart(2,'0')}</strong><span>{s.label}</span></div>)}<p className="stats-note">{demo?t.demo:t.official}</p></div></section>

    <section className="section topic-section" id="discover"><div className="wrap">
     <div className="reveal"><Heading eyebrow={copy.topicsLabel} title={copy.topicsTitle} intro={copy.topicsIntro} center/></div>
     <div className="topic-grid">{categories.map((c,n)=><button key={c} className={`topic-card reveal topic-${c}`} style={{transitionDelay:`${n*80}ms`}} onClick={()=>navigate('explore',c)}><img src={topicImages[n]} alt="" loading="lazy"/><span className="topic-number">0{n+1}</span><span className="topic-copy"><span className="topic-eyebrow">{copy.topicCaptions[n]}</span><strong>{t[c]}</strong><span className="topic-count">{rows.filter(i=>i.category===c).length} · {t.explore}</span></span><span className="topic-arrow"><ArrowUpRight size={20}/></span></button>)}</div>
     <p className="photo-disclosure">{copy.photoNote}</p>
    </div></section>

    <section className="mission-statement reveal"><div className="wrap narrow"><Quote size={34} className="statement-mark"/><p>{copy.statement[0]} <em>{copy.statement[1]}</em> {copy.statement[2]}</p><span className="statement-signature">VOICE OF YOU <i/> KARNATAKA</span></div></section>
   </>}

   {view==='about'&&<>
    <section className="page-hero about-hero"><div className="wrap page-hero-grid">
     <div className="page-hero-copy"><Crumbs here={t.about} home={t.home} go={()=>navigate('home')}/><p className="eyebrow">{inner.aboutLabel}</p><h1>{inner.aboutTitle[0]}<br/><em>{inner.aboutTitle[1]}</em></h1><p className="lede">{inner.aboutIntro}</p><div className="hero-actions"><button className="button primary large" onClick={()=>open('report')}>{inner.join}<ArrowUpRight size={18}/></button><button className="button outline large" onClick={()=>navigate('explore')}>{t.exploreCta}</button></div></div>
     <figure className="page-hero-media"><img src={heroImages[0]} alt={copy.imageAlts[0]}/><figcaption><MapPin size={14}/>Karnataka, India</figcaption><span className="media-badge"><ShieldCheck size={18}/>{t.independent}</span></figure>
    </div></section>
    <section className="section about-story"><div className="wrap split">
     <div className="reveal"><Heading eyebrow={inner.aboutStoryLabel} title={inner.aboutStoryTitle}/></div>
     <div className="prose reveal"><p className="dropcap">{inner.aboutStoryText}</p><p>{inner.aboutStoryText2}</p><span className="signature"><i/>VOICE OF YOU · KARNATAKA</span></div>
    </div></section>
    <section className="pullquote reveal"><div className="wrap narrow"><Quote size={36}/><blockquote>{inner.aboutQuote}</blockquote><span>{t.mission}</span></div></section>
    <section className="section"><div className="wrap">
     <div className="reveal"><Heading eyebrow={inner.valuesLabel} title={inner.valuesTitle} center/></div>
     <div className="value-grid">{[Flag,Eye,Lock,Activity].map((Icon,n)=><article className="value-card reveal" style={{transitionDelay:`${n*70}ms`}} key={n}><span className="value-number">0{n+1}</span><span className="icon-badge"><Icon size={22}/></span><h3>{inner.valueTitles[n]}</h3><p>{inner.valueTexts[n]}</p></article>)}</div>
    </div></section>
    <section className="section process-section"><div className="wrap split is-wide">
     <div className="reveal"><Heading eyebrow={inner.reviewLabel} title={inner.reviewTitle} intro={inner.reviewText} light/><button className="text-link is-light" onClick={()=>navigate('help')}>{inner.learn}<ArrowUpRight size={16}/></button></div>
     <ol className="process-steps">{[Send,ShieldCheck,CheckCheck].map((Icon,n)=><li className="reveal" style={{transitionDelay:`${n*90}ms`}} key={n}><span className="step-index">0{n+1}</span><span className="icon-badge is-dark"><Icon size={20}/></span><div><h3>{inner.reviewTitles[n]}</h3><p>{inner.reviewTexts[n]}</p></div></li>)}</ol>
    </div></section>
    <section className="section"><div className="wrap"><div className="invite-card reveal"><p className="eyebrow is-center">ENGLISH · ಕನ್ನಡ · हिन्दी</p><h2>{inner.aboutCtaTitle[0]}<br/><em>{inner.aboutCtaTitle[1]}</em></h2><p className="lede">{inner.aboutCtaText}</p><button className="button primary large" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={18}/></button><small>{inner.notOfficial}</small></div></div></section>
   </>}

   {view==='help'&&<>
    <section className="page-hero is-compact"><div className="wrap"><Crumbs here={t.help} home={t.home} go={()=>navigate('home')}/><p className="eyebrow">{t.official}</p><h1>{t.help}</h1><p className="lede">{t.helpText}</p></div></section>
    <section className="section is-tight"><div className="wrap">
     <div className="info-grid">
      <article className="info-card"><span className="icon-badge"><ShieldCheck size={22}/></span><h2>{t.privacy}</h2><p>{t.policy}</p><button className="text-link" onClick={()=>open('privacy')}>{t.privacy}<ArrowUpRight size={15}/></button></article>
      <article className="info-card is-accent"><span className="icon-badge is-dark"><Search size={22}/></span><h2>{t.track}</h2><p>{t.notGov}</p><button className="button primary" onClick={()=>open('track')}>{t.track}<ArrowRight size={16}/></button></article>
     </div>
     <ol className="help-steps">{[{title:t.step1,desc:t.step1d,icon:Send},{title:t.step2,desc:t.step2d,icon:ShieldCheck},{title:t.step3,desc:t.step3d,icon:CheckCheck}].map((s,n)=><li key={n}><span className="step-index">0{n+1}</span><s.icon size={20}/><h3>{s.title}</h3><p>{s.desc}</p></li>)}</ol>
     <p className="notice"><Info size={16}/>{t.notice}</p>
    </div></section>
   </>}

   {view==='explore'&&<section className="explore-hero"><div className="wrap"><div className="explore-banner">
    <img src={heroImages[0]} alt={copy.imageAlts[0]}/><div className="banner-shade"/>
    <div className="banner-copy"><Crumbs here={t.explore} home={t.home} go={()=>navigate('home')} light/><p className="eyebrow is-light">{inner.browseLabel}</p><h1>{inner.browseTitle[0]}<br/><em>{inner.browseTitle[1]}</em></h1><p className="lede">{inner.browseIntro}</p><div className="hero-actions"><a className="button primary large" href="#issue-results">{t.exploreCta}<ArrowRight size={17}/></a><button className="button ghost large" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={17}/></button></div></div>
    <div className="banner-stats">{stats.slice(0,3).map((s,n)=><div key={n}><strong>{s.value.toString().padStart(2,'0')}</strong><span>{s.label}</span></div>)}</div>
    <div className="banner-foot"><span><ShieldCheck size={16}/>{inner.browseNote}</span><span><MapPin size={14}/>{inner.browsePlace} · {inner.browsePlaceTitle}</span></div>
   </div></div></section>}

   {view==='resolved'&&<>
    <section className="page-hero resolved-hero"><div className="wrap page-hero-grid">
     <div className="page-hero-copy"><Crumbs here={t.resolved} home={t.home} go={()=>navigate('home')}/><p className="eyebrow">{inner.resolvedLabel}</p><h1>{inner.resolvedTitle[0]}<br/><em>{inner.resolvedTitle[1]}</em></h1><p className="lede">{inner.resolvedIntro}</p><div className="resolved-count"><CheckCircle2 size={26}/><strong>{rows.filter(i=>i.status==='verified').length.toString().padStart(2,'0')}</strong><span>{u.resolvedCount}<small>{demo?t.demo:t.official}</small></span></div></div>
     <figure className="page-hero-media"><img src={heroImages[1]} alt={copy.imageAlts[1]}/><span className="media-badge is-green"><CheckCircle2 size={18}/>{t.verified}</span></figure>
    </div></section>
    {demo&&verified&&<section className="section is-tight"><div className="wrap"><div className="spotlight reveal">
     <div className="spotlight-media"><img src={verified.image||heroImages[1]} alt={copy.imageAlts[1]}/><span className="media-badge is-green"><CheckCircle2 size={16}/>{inner.resolvedPill}</span><span className="spotlight-place"><MapPin size={14}/>{verified.locality}, Karnataka</span></div>
     <div className="spotlight-copy"><p className="eyebrow">{t.stories}</p><h2>{inner.resolvedFeatureTitle[0]}<br/><em>{inner.resolvedFeatureTitle[1]}</em></h2><p className="lede">{inner.resolvedFeatureText}</p><dl className="spotlight-facts"><div><dt>{t.category}</dt><dd>{t.electricity}</dd></div><div><dt>{t.status}</dt><dd>{t.verified}</dd></div></dl><button className="button primary" onClick={()=>setSelected(verified)}>{inner.readStory}<ArrowUpRight size={17}/></button><small>{inner.resolvedNote}</small></div>
    </div></div></section>}
    <section className="section proof-section"><div className="wrap">
     <div className="reveal"><Heading eyebrow={t.verified} title={[inner.verifiedMeaning]} intro={inner.verifiedIntro} center/></div>
     <div className="proof-grid">{[Camera,ShieldCheck,Users].map((Icon,n)=><article className="proof-card reveal" style={{transitionDelay:`${n*80}ms`}} key={n}><span className="icon-badge is-green"><Icon size={22}/></span><span className="value-number">0{n+1}</span><h3>{inner.proofTitles[n]}</h3><p>{inner.proofText[n]}</p></article>)}</div>
    </div></section>
   </>}

   {['map','watch','my','saved'].includes(view)&&<section className="page-hero is-compact"><div className="wrap"><Crumbs here={view==='map'?t.mapTitle:t[view as 'my']} home={t.home} go={()=>navigate('home')}/><p className="eyebrow">VOICE OF YOU · KARNATAKA</p><h1>{view==='map'?t.mapTitle:t[view as 'my']}</h1><p className="lede">{view==='map'?t.mapSub:t.recentSub}</p><span className="data-badge">{demo?t.demo:t.official}</span></div></section>}

   {(isListing||view==='home')&&<section id="issue-results" className={`section issues-section is-${view}`}><div className="wrap">
    {view==='home'?<div className="row-head reveal"><Heading eyebrow={copy.issuesLabel} title={copy.issuesTitle} intro={t.recentSub}/><button className="button outline" onClick={()=>navigate('explore')}>{t.exploreCta}<ArrowRight size={16}/></button></div>
    :<div className="toolbar-head"><div>{view==='explore'&&<><h2 className="h3">{inner.filterLabel}</h2><p>{inner.filterIntro}</p></>}{view==='resolved'&&<><p className="eyebrow">{t.demo}</p><h2 className="h3">{inner.moreResolved}</h2></>}</div>
     <div className="view-toggle" role="group" aria-label={`${t.list} / ${t.mapView}`}><button className={!mapList&&view!=='map'?'selected':''} onClick={()=>{if(view==='map')navigate('explore');setMapList(false);}} aria-pressed={!mapList&&view!=='map'}><List size={16}/><span>{t.list}</span></button><button className={mapList||view==='map'?'selected':''} onClick={()=>setMapList(true)} aria-pressed={mapList||view==='map'}><Map size={16}/><span>{t.mapView}</span></button></div>
    </div>}

    {view!=='home'&&<div className="filter-panel">
     <div className="filter-bar">
      <label className="field search-field"><Search size={18}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label>
      <label className="field select-field"><MapPin size={16}/><select value={district} onChange={e=>setDistrict(e.target.value)} aria-label={t.district}><option value="all">{t.district}</option>{districts.map(d=><option key={d}>{d}</option>)}</select><ChevronDown size={15}/></label>
      <label className="field select-field"><SlidersHorizontal size={16}/><select value={status} onChange={e=>setStatus(e.target.value)} aria-label={t.status}><option value="all">{t.allStatus}</option>{['submitted','review','published','followup','verified'].map(s=><option key={s} value={s}>{t[s as 'review']}</option>)}</select><ChevronDown size={15}/></label>
      <label className="field select-field"><Clock size={16}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label={u.sort}><option value="recent">{t.latest}</option><option value="support">{t.support}</option><option value="oldest">{u.oldest}</option></select><ChevronDown size={15}/></label>
     </div>
     <div className="chip-row" role="group" aria-label={t.category}>{['all',...categories].map(c=><button className={category===c?'chip active':'chip'} key={c} onClick={()=>setCategory(c)} aria-pressed={category===c}>{catIcon(c,15)}{t[c as 'all']}<span className="chip-count">{c==='all'?scoped.length:scoped.filter(i=>i.category===c).length}</span></button>)}</div>
    </div>}

    {view!=='home'&&<div className="results-summary"><span><strong>{filtered.length.toString().padStart(2,'0')}</strong> {filtered.length===1?inner.result:inner.results}<i/>{demo?t.demo:t.official}</span>{hasFilters&&<button onClick={clearFilters}>{inner.clear}<X size={14}/></button>}</div>}

    {filtered.length===0?<div className="empty-state"><span className="icon-badge"><Search size={24}/></span><h3>{['my','saved'].includes(view)?t.empty:t.noResults}</h3>{hasFilters?<button className="button outline" onClick={clearFilters}>{t.reset}</button>:<button className="button primary" onClick={()=>view==='my'?open('report'):navigate('explore')}>{view==='my'?t.report:t.exploreCta}<ArrowRight size={16}/></button>}</div>
    :mapList||view==='map'?<div className="map-layout">{mapPanel()}<div className="map-results">{filtered.map(i=><button key={i.id} onClick={()=>setSelected(i)}><span className={`map-result-icon category-${i.category}`}>{catIcon(i.category,17)}</span><span className="map-result-text"><strong>{i.title[lang]}</strong><small><MapPin size={12}/>{i.locality}, {i.district}</small><span className={`status status-${i.status}`}><span/>{label(i.status)}</span></span><ArrowUpRight size={18}/></button>)}</div></div>
    :<div className="issue-grid">{(view==='home'?filtered.slice(0,3):filtered).map(card)}</div>}
   </div></section>}

   {view==='home'&&<>
    <section className="section feature-section"><div className="wrap feature">
     <figure className="feature-media reveal"><img src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=85" alt={copy.storyImageAlt} loading="lazy"/><figcaption><TreePine size={22}/><span>{copy.storyAnnotation}</span></figcaption></figure>
     <div className="feature-copy reveal"><Heading eyebrow={copy.storyLabel} title={copy.storyTitle} intro={copy.storyText}/><div className="principles"><div><span className="icon-badge"><ShieldCheck size={20}/></span><strong>{copy.principles[0]}</strong><span>{copy.principleText[0]}</span></div><div><span className="icon-badge"><Users size={20}/></span><strong>{copy.principles[1]}</strong><span>{copy.principleText[1]}</span></div></div><button className="button primary" onClick={()=>navigate('about')}>{copy.ourStory}<ArrowUpRight size={17}/></button></div>
    </div></section>

    <section className="section promise-section"><div className="wrap">
     <div className="reveal"><Heading eyebrow={copy.promiseLabel} title={copy.promiseTitle} center light/></div>
     <div className="promise-grid">{[ShieldCheck,FileText,Heart].map((Icon,n)=><article className="promise-card reveal" style={{transitionDelay:`${n*80}ms`}} key={n}><span className="icon-badge is-gold"><Icon size={24}/></span><h3>{copy.promises[n]}</h3><p>{copy.promiseText[n]}</p><span className="promise-tag">{copy.promiseBadges[n]}</span></article>)}</div>
    </div></section>

    <section className="section how-section"><div className="wrap split is-wide">
     <div className="how-head reveal"><Heading eyebrow={copy.howLabel} title={[t.how]} intro={copy.howIntro}/><button className="button outline" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={16}/></button></div>
     <ol className="process-steps is-light">{[{title:t.step1,desc:t.step1d,icon:Send},{title:t.step2,desc:t.step2d,icon:ShieldCheck},{title:t.step3,desc:t.step3d,icon:CheckCheck}].map((step,n)=><li className="reveal" style={{transitionDelay:`${n*90}ms`}} key={n}><span className="step-index">0{n+1}</span><span className="icon-badge"><step.icon size={20}/></span><div><h3>{step.title}</h3><p>{step.desc}</p></div></li>)}</ol>
    </div></section>

    <section className="cta-band"><img src="https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1800&q=85" alt="" loading="lazy"/><div className="wrap cta-inner reveal"><p className="eyebrow is-light">{copy.ctaLabel}</p><h2>{t.together}<br/><em>{t.together2}</em></h2><p className="lede">{t.ctaSub}</p><div className="hero-actions"><button className="button primary large" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={18}/></button><button className="button ghost large" onClick={()=>open('track')}>{t.track}<Search size={17}/></button></div></div></section>
   </>}
  </main>

  <footer className="site-footer">
   <div className="wrap">
    <div className="footer-cta"><h2>{copy.footerTitle[0]}<br/><em>{copy.footerTitle[1]}</em></h2><div className="hero-actions"><button className="button primary large" onClick={()=>open('report')}>{t.report}<ArrowUpRight size={18}/></button><button className="button ghost large" onClick={()=>navigate('explore')}>{t.exploreCta}</button></div></div>
    <div className="footer-grid">
     <div className="footer-about">{brand(true)}<p>{t.footer}</p><p className="footer-flag"><ShieldCheck size={16}/>{t.independent}</p></div>
     <div className="footer-col"><h3>{t.platform}</h3>{(['home','explore','resolved','map','watch'] as View[]).map(v=><button key={v} onClick={()=>navigate(v)}>{t[v]}</button>)}</div>
     <div className="footer-col"><h3>{t.community}</h3>{(['my','saved','about','help'] as View[]).map(v=><button key={v} onClick={()=>navigate(v)}>{t[v]}</button>)}</div>
     <div className="footer-col"><h3>{u.quick}</h3><button onClick={()=>open('report')}>{t.report}</button><button onClick={()=>open('track')}>{t.track}</button><button onClick={()=>open('privacy')}>{t.privacy}</button><label className="language is-footer"><Globe size={15}/><select aria-label="Language / ಭಾಷೆ / भाषा" value={lang} onChange={e=>setLang(e.target.value as Language)}><option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="hi">हिन्दी</option></select><ChevronDown size={13}/></label></div>
    </div>
    <div className="footer-bottom"><span>© 2026 Voice of You · {t.notGov}</span><span className="footer-attribution">{u.designed} <a href="https://rakvih.in/" target="_blank" rel="noopener noreferrer">Rakvih</a></span></div>
   </div>
  </footer>

  {(modal||selected)&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setModal(null);setSelected(null);}}}><section className={`modal ${selected?'issue-modal':modal==='report'&&!success?'report-modal':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="close-modal" onClick={()=>{setModal(null);setSelected(null);}} aria-label={t.close}><X size={20}/></button>
   {selected?<>
    <div className="issue-cover">{selected.image?<img src={selected.image} alt=""/>:<span className="no-photo">{catIcon(selected.category,48)}</span>}<div className="issue-cover-shade"/><div className="issue-cover-tags"><span className={`status status-${selected.status}`}><span/>{label(selected.status)}</span><span className="data-badge is-glass">{selected.mine?t.local:(demo?t.demo:t.official)}</span></div></div>
    <div className="issue-layout">
     <div className="issue-main">
      <p className="reference"><Hash size={13}/>{selected.id}</p>
      <h2 id="modal-title">{selected.title[lang]}</h2>
      <p className="location"><MapPin size={15}/>{selected.locality}, {selected.district}</p>
      <p className="detail-description">{selected.description[lang]}</p>
      {selected.imageSource&&<a className="photo-credit" href={selected.imageSource} target="_blank" rel="noopener noreferrer">{u.photoSource}<ArrowUpRight size={12}/></a>}
      <h3 className="detail-heading">{t.timeline}</h3>
      <ol className="tracker">{trackSteps.map((s,n)=>{const at=stepIndex(selected.status);return <li key={s} className={n<at?'done':n===at?'current':''}><span className="tracker-dot">{n<=at?<CheckCircle2 size={16}/>:<Clock size={14}/>}</span><span className="tracker-label">{n===at&&!trackSteps.includes(selected.status as typeof trackSteps[number])?label(selected.status):t[s as 'review']}{n===0&&<small>{fmt(selected.date)}</small>}{n===at&&n!==0&&<small>{selected.mine?t.local:(demo?t.demo:t.official)}</small>}</span></li>;})}</ol>
      <p className="notice"><Info size={15}/>{t.notGov}</p>
      <section className="comments"><div className="comments-head"><h3>{u.discussion}</h3><span>{comments.length}</span></div>
       {comments.map(comment=><article className="comment" key={comment.id}><span className="avatar">{comment.display_name.slice(0,1).toUpperCase()}</span><div><div className="comment-meta"><strong>{comment.display_name}</strong><small>{new Date(comment.created_at).toLocaleDateString(locale)}</small></div><p>{comment.body}</p></div></article>)}
       {comments.length===0&&<p className="comments-empty">{u.noComments}</p>}
       {user&&!demo?<form className="comment-form" onSubmit={postComment}><label>{u.addComment}<textarea required minLength={3} maxLength={2000} rows={3} value={commentText} onChange={e=>setCommentText(e.target.value)}/></label><div className="comment-actions"><small>{u.respect}</small><button className="button primary" disabled={commentBusy}>{commentBusy?'…':u.post}<Send size={15}/></button></div></form>
       :<div className="comment-signin"><span className="icon-badge"><Lock size={18}/></span><div><strong>{u.join}</strong><p>{u.joinText}</p></div><button className="button outline" onClick={()=>{setSelected(null);open('auth');}}>{t.signin}<ArrowRight size={15}/></button></div>}
       {commentMessage&&<p className="form-message" role="status">{commentMessage}</p>}
      </section>
     </div>
     <aside className="issue-aside">
      <div className="support-card"><span className="support-count"><strong>{count(selected)}</strong>{u.supporters}</span><h3>{u.stronger}</h3><p>{u.strongerText}</p><button className={`button primary block ${supported.includes(selected.id)?'is-active':''}`} onClick={()=>support(selected)} aria-pressed={supported.includes(selected.id)}><ThumbsUp size={17}/>{supported.includes(selected.id)?t.supported:t.support}</button></div>
      <dl className="fact-list"><div><dt><Hash size={14}/>{u.reference}</dt><dd>{selected.id}</dd></div><div><dt>{catIcon(selected.category,14)}{t.category}</dt><dd>{t[selected.category as 'roads']||selected.category}</dd></div><div><dt><MapPin size={14}/>{t.location}</dt><dd>{selected.district}</dd></div><div><dt><CalendarDays size={14}/>{u.reported}</dt><dd>{fmt(selected.date)}</dd></div></dl>
     </aside>
    </div>
   </>
   :modal==='report'?success?<div className="success-panel"><span className="success-icon"><CheckCircle2 size={44}/></span><h2 id="modal-title">{t.success}</h2><p>{t.successSub}</p><strong className="success-ref">{success}</strong><p className="notice">{supabase?t.submitted:t.local}</p>{message&&<p className="form-message" role="status">{message}</p>}<button className="button primary" onClick={()=>{setModal(null);navigate('my');}}>{t.my}<ArrowRight size={16}/></button></div>
   :<div className="form-modal">
    <div className="modal-head"><span className="icon-badge"><Sparkles size={20}/></span><div><p className="eyebrow">VOICE OF YOU</p><h2 id="modal-title">{t.report}</h2><p className="modal-intro">{t.step1d}</p></div></div>
    {!supabase&&<p className="notice"><Info size={15}/>{t.local}</p>}
    <form onSubmit={submit} className="form">
     <label className="form-field">{t.title}<input name="title" required maxLength={140} placeholder={u.titleHint}/></label>
     <div className="form-row"><label className="form-field">{t.category}<span className="select-shell"><select name="category" required defaultValue=""><option value="" disabled>{t.choose}</option>{categories.map(c=><option key={c} value={c}>{t[c]}</option>)}</select><ChevronDown size={15}/></span></label><label className="form-field">{u.districtLabel}<span className="select-shell"><select name="district" required defaultValue=""><option value="" disabled>{u.chooseDistrict}</option>{districts.map(d=><option key={d}>{d}</option>)}</select><ChevronDown size={15}/></span></label></div>
     <label className="form-field">{t.location}<input name="locality" required maxLength={180} placeholder={u.placeHint}/></label>
     <label className="form-field">{t.description}<textarea name="description" required minLength={20} maxLength={4000} rows={4}/></label>
     <label className={`upload ${fileName?'has-file':''}`}><span className="icon-badge">{fileName?<CheckCircle2 size={20}/>:<ImagePlus size={20}/>}</span><span className="upload-text"><strong>{fileName||t.evidence}</strong><small>{u.fileHint}</small></span><span className="upload-button">{u.chooseFile}</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFileName(e.target.files?.[0]?.name||'')}/></label>
     <label className="checkbox"><input name="consent" type="checkbox" required/><span>{t.consent}</span></label>
     {message&&<p className="form-message" role="alert">{message}</p>}
     <button className="button primary large block" disabled={busy}>{busy?'…':t.submit}<ArrowRight size={17}/></button>
    </form>
   </div>
   :modal==='auth'?<div className="form-modal is-narrow">
    <div className="modal-head is-center"><span className="icon-badge"><ShieldCheck size={22}/></span><h2 id="modal-title">{authMode==='signup'?u.createTitle:t.signin}</h2><p className="modal-intro">{t.independent}</p></div>
    <div className="segmented" role="tablist"><button role="tab" aria-selected={authMode==='signin'} className={authMode==='signin'?'active':''} onClick={()=>{setAuthMode('signin');setMessage('');}}>{t.signin}</button><button role="tab" aria-selected={authMode==='signup'} className={authMode==='signup'?'active':''} onClick={()=>{setAuthMode('signup');setMessage('');}}>{u.signup}</button></div>
    <form onSubmit={signIn} className="form">
     {authMode==='signup'&&<label className="form-field">{u.displayName}<input required minLength={2} maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)} autoComplete="nickname"/></label>}
     <label className="form-field">{t.email}<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
     <label className="form-field">{u.password}<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode==='signup'?'new-password':'current-password'}/></label>
     <button className="button primary large block" disabled={busy}>{busy?'…':authMode==='signup'?u.create:t.signin}<ArrowRight size={17}/></button>
     {authMode==='signup'&&<p className="notice"><Info size={15}/>{u.confirm}</p>}
     {message&&<p className="form-message" role="status">{message}</p>}
    </form>
   </div>
   :modal==='track'?<div className="form-modal is-narrow">
    <div className="modal-head is-center"><span className="icon-badge"><Search size={22}/></span><h2 id="modal-title">{t.track}</h2><p className="modal-intro">{t.notGov}</p></div>
    <form className="form" onSubmit={e=>{e.preventDefault();const found=rows.find(i=>i.id.toLowerCase()===reference.trim().toLowerCase());if(found){setModal(null);setSelected(found);}else setMessage(t.noResults);}}><label className="form-field">{t.trackHint}<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="VOY-2026-1042" required/></label><button className="button primary large block">{t.trackButton}<Search size={17}/></button>{message&&<p className="form-message" role="status">{message}</p>}</form>
   </div>
   :<div className="form-modal is-narrow"><div className="modal-head is-center"><span className="icon-badge"><Lock size={22}/></span><h2 id="modal-title">{t.privacy}</h2></div><p className="detail-description">{t.policy}</p><p className="notice"><Info size={15}/>{t.notice}</p></div>}
  </section></div>}
 </div>;
}

function Crumbs({here,home,go,light=false}:{here:string;home:string;go:()=>void;light?:boolean}){
 return <nav className={`crumbs ${light?'is-light':''}`} aria-label="Breadcrumb"><button onClick={go}>{home}</button><ChevronRight size={13}/><span aria-current="page">{here}</span></nav>;
}

function Heading({eyebrow,title,intro,center=false,light=false}:{eyebrow?:string;title:readonly string[]|string[];intro?:string;center?:boolean;light?:boolean}){
 return <div className={`section-head ${center?'is-center':''} ${light?'is-light':''}`}>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2>{title[0]}{title[1]&&<><br/><em>{title[1]}</em></>}</h2>{intro&&<p className="lede">{intro}</p>}</div>;;
}
