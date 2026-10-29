(function(){

const pageNames=['home','about','services','planner','resources','consultation'];
const navlinks=document.getElementById('navlinks');
const i18n=window.Growise.i18n;
function updateMenuLabel(){document.getElementById('menuBtn').setAttribute('aria-label',i18n.t(navlinks.classList.contains('open')?'accessibility.closeNavigation':'accessibility.openNavigation'))}
function showPage(name,updateHash=true){
 if(!pageNames.includes(name)) name='home';
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.view===name));
 document.querySelectorAll('[data-page]').forEach(a=>a.classList.toggle('active',a.dataset.page===name && a.closest('.navlinks')));
 navlinks.classList.remove('open');
 updateMenuLabel();
 if(updateHash && location.hash!==`#${name}`) history.pushState({page:name},'',`#${name}`);
 window.scrollTo({top:0,behavior:'smooth'});
 setTimeout(observeReveals,80);
}
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-page]');
 if(link){e.preventDefault();showPage(link.dataset.page);return;}
});
window.addEventListener('popstate',()=>showPage(location.hash.slice(1)||'home',false));
window.addEventListener('load',()=>{const p=location.hash.slice(1);if(pageNames.includes(p))showPage(p,false);observeReveals();});
document.getElementById('menuBtn').addEventListener('click',()=>{navlinks.classList.toggle('open');updateMenuLabel()});
document.querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>i18n.setLocale(button.dataset.locale)));
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12}) : null;
function observeReveals(){document.querySelectorAll('.page.active .reveal:not(.visible)').forEach(el=>observer?observer.observe(el):el.classList.add('visible'));}

const modal=document.getElementById('articleModal');
let activeArticle=null;
function renderArticle(){
 if(!activeArticle)return;
 const article=i18n.getArticle(activeArticle);
 if(!article)return;
 document.getElementById('modalTitle').textContent=article.title;
 const content=document.getElementById('modalContent');
 content.replaceChildren();
 const intro=document.createElement('p');
 intro.textContent=article.intro;
 const list=document.createElement('ol');
 article.items.forEach(([heading,body])=>{
  const item=document.createElement('li');
  const title=document.createElement('strong');
  title.style.color='var(--text)';
  title.textContent=heading;
  item.append(title,document.createElement('br'),document.createTextNode(body));
  list.append(item);
 });
 content.append(intro,list);
}
document.querySelectorAll('[data-article]').forEach(btn=>btn.addEventListener('click',()=>{
 activeArticle=btn.dataset.article;
 renderArticle();
 modal.classList.add('open');
}));
function closeModal(){modal.classList.remove('open');activeArticle=null}
document.getElementById('closeModal').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.getElementById('modalPlanner').addEventListener('click',()=>{closeModal();showPage('planner')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));
 const cards=document.querySelectorAll('.resource-card');
 let visible=0;
 cards.forEach(card=>{
  const show=btn.dataset.filter==='all'||card.dataset.category===btn.dataset.filter;
  card.style.display=show?'':'none';
  if(show)visible++;
 });
 document.getElementById('resourceEmpty').hidden=visible>0;
}));
document.addEventListener('growise:localechange',()=>{
 updateMenuLabel();
 if(modal.classList.contains('open'))renderArticle();
});
const dateInput=document.getElementById('date');dateInput.min=new Date().toISOString().slice(0,10);
const consultForm=document.getElementById('consultForm');
const consultationStep=document.getElementById('consultationStep');
const feedbackStep=document.getElementById('feedbackStep');
const feedbackForm=document.getElementById('feedbackForm');
const feedbackGroups={
 overall:'feedback.rating.overall',
 usability:'feedback.rating.usability',
 usefulness:'feedback.rating.usefulness',
 marketing:'feedback.rating.marketing',
 planner:'feedback.rating.planner',
 resources:'feedback.rating.resources',
 assistant:'feedback.rating.assistant'
};
const invalidFields=new Map();
let feedbackMissingKeys=[];
let feedbackSubmitted=false;
function renderRatingGroup(group){
 const key=feedbackGroups[group.dataset.rating];
 if(!key)return;
 const groupName=i18n.t(key);
 const selected=Number(group.dataset.value||0);
 const stars=[...group.querySelectorAll('.rating-star')];
 stars.forEach((star,index)=>{
  const value=Number(star.dataset.ratingValue);
  star.textContent=value<=selected?'★':'☆';
  star.setAttribute('aria-label',i18n.t('feedback.rating.star',{group:groupName,rating:value}));
  star.setAttribute('aria-checked',String(value===selected));
  star.tabIndex=selected?(value===selected?0:-1):-1;
 });
 if(!selected&&stars[0])stars[0].tabIndex=0;
}
function renderFeedbackError(){
 const error=document.getElementById('feedbackError');
 const list=document.getElementById('feedbackMissingList');
 list.replaceChildren();
 feedbackMissingKeys.forEach(key=>{
  const item=document.createElement('li');
  item.textContent=i18n.t(key);
  list.append(item);
 });
 error.hidden=feedbackMissingKeys.length===0;
}
function updateFeedbackLocalization(){
 feedbackForm.querySelectorAll('.star-rating').forEach(renderRatingGroup);
 renderFeedbackError();
}
function setRating(group,value){
 group.dataset.value=String(value);
 renderRatingGroup(group);
 const key=feedbackGroups[group.dataset.rating];
 if(key)feedbackMissingKeys=feedbackMissingKeys.filter(missing=>missing!==key);
 renderFeedbackError();
}
feedbackForm.addEventListener('click',event=>{
 const star=event.target.closest('.rating-star');
 if(star)setRating(star.closest('.star-rating'),Number(star.dataset.ratingValue));
});
feedbackForm.addEventListener('keydown',event=>{
 const star=event.target.closest('.rating-star');
 if(!star)return;
 const group=star.closest('.star-rating');
 const current=Number(group.dataset.value||star.dataset.ratingValue);
 let next=current;
 if(event.key==='ArrowRight'||event.key==='ArrowUp')next=Math.min(5,current+1);
 else if(event.key==='ArrowLeft'||event.key==='ArrowDown')next=Math.max(1,current-1);
 else if(event.key==='Home')next=1;
 else if(event.key==='End')next=5;
 else return;
 event.preventDefault();
 setRating(group,next);
 group.querySelector(`[data-rating-value="${next}"]`).focus();
});
document.getElementById('backToConsultation').addEventListener('click',()=>{
 feedbackStep.hidden=true;
 consultationStep.hidden=false;
 consultationStep.classList.remove('form-step-enter');
 requestAnimationFrame(()=>consultationStep.classList.add('form-step-enter'));
 consultForm.querySelector('h2').focus();
});
feedbackForm.addEventListener('submit',event=>{
 event.preventDefault();
 if(feedbackSubmitted)return;
 feedbackMissingKeys=Object.entries(feedbackGroups)
  .filter(([name])=>!Number(feedbackForm.querySelector(`[data-rating="${name}"]`).dataset.value))
  .map(([,key])=>key);
 renderFeedbackError();
 if(feedbackMissingKeys.length){
  feedbackForm.querySelector(`[data-rating="${Object.keys(feedbackGroups).find(name=>!Number(feedbackForm.querySelector(`[data-rating="${name}"]`).dataset.value))}"] .rating-star`).focus();
  return;
 }
 feedbackSubmitted=true;
 feedbackForm.hidden=true;
 document.getElementById('feedbackComplete').hidden=false;
 document.getElementById('feedbackComplete').querySelector('.panel-title').focus();
});
function updateFieldValidity(field,key){
 if(key) {
  invalidFields.set(field,key);
  field.setCustomValidity(i18n.t(key));
 } else {
  invalidFields.delete(field);
  field.setCustomValidity('');
 }
}
consultForm.querySelectorAll('input,select,textarea').forEach(field=>field.addEventListener('input',()=>updateFieldValidity(field,null)));
consultForm.addEventListener('submit',e=>{
 e.preventDefault();
 invalidFields.clear();
 consultForm.querySelectorAll('[required]').forEach(field=>{
  if(!field.value.trim())updateFieldValidity(field,'validation.required');
  else if(field.type==='email'&&field.validity.typeMismatch)updateFieldValidity(field,'validation.invalidEmail');
  else updateFieldValidity(field,null);
 });
 if(!e.target.reportValidity())return;
 consultationStep.hidden=true;
 feedbackStep.hidden=false;
 feedbackStep.classList.remove('form-step-enter');
 requestAnimationFrame(()=>feedbackStep.classList.add('form-step-enter'));
 document.getElementById('feedbackTitle').focus();
});
document.addEventListener('growise:localechange',()=>{
 invalidFields.forEach((key,field)=>field.setCustomValidity(i18n.t(key)));
 updateFeedbackLocalization();
});
updateFeedbackLocalization();
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}

window.Growise = window.Growise || {};
window.Growise.toast = toast;
})();
