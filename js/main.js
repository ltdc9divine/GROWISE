(function(){

const pageNames=['home','about','services','planner','resources','consultation','feedback'];
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
 if(consultationSubmitting){
  consultForm.querySelector('[type="submit"]').textContent=i18n.t('consultation.submit.pending');
 }
 if(feedbackSubmitting){
  feedbackForm.querySelector('[type="submit"]').textContent=i18n.t('feedback.submit.pending');
 }
 if(modal.classList.contains('open'))renderArticle();
});
const dateInput=document.getElementById('date');
const today=new Date();
dateInput.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const consultForm=document.getElementById('consultForm');
const consultationSuccess=document.getElementById('successMessage');
const feedbackForm=document.getElementById('feedbackForm');
const formSubmissionClient=window.GrowiseFormSubmissions.createClient(window.GROWISE_SUPABASE_CONFIG);
document.querySelector('[data-feedback-scroll]').addEventListener('click',event=>{
 event.preventDefault();
 feedbackForm.scrollIntoView({behavior:'smooth',block:'start'});
});
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
let feedbackSubmitting=false;
let consultationSubmitting=false;
function showSubmissionError(error){
 const key=error?.code==='network_error'
  ?'publicForm.networkError'
  :error?.code==='rate_limited'
   ?'publicForm.rateLimited'
   :'publicForm.submitError';
 window.Growise.toast(i18n.t(key));
}
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
feedbackForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(feedbackSubmitted||feedbackSubmitting)return;
 feedbackMissingKeys=Object.entries(feedbackGroups)
  .filter(([name])=>!Number(feedbackForm.querySelector(`[data-rating="${name}"]`).dataset.value))
  .map(([,key])=>key);
 renderFeedbackError();
 if(feedbackMissingKeys.length){
  const firstMissing=Object.keys(feedbackGroups).find(name=>
   !Number(feedbackForm.querySelector(`[data-rating="${name}"]`).dataset.value)
  );
  feedbackForm.querySelector(`[data-rating="${firstMissing}"] .rating-star`).focus();
  return;
 }

 const submitButton=feedbackForm.querySelector('[type="submit"]');
 const ratings=Object.fromEntries(Object.keys(feedbackGroups).map(name=>[
  name,
  Number(feedbackForm.querySelector(`[data-rating="${name}"]`).dataset.value)
 ]));
 feedbackSubmitting=true;
 submitButton.disabled=true;
 submitButton.dataset.i18n='feedback.submit.pending';
 submitButton.textContent=i18n.t('feedback.submit.pending');
 feedbackForm.setAttribute('aria-busy','true');
 try{
  await formSubmissionClient.submit('feedback',{
   ratings,
   liked:document.getElementById('feedbackLiked').value,
   improve:document.getElementById('feedbackImprove').value,
   requested_features:document.getElementById('feedbackFeatures').value
  });
  feedbackSubmitted=true;
  feedbackForm.hidden=true;
  document.getElementById('feedbackComplete').hidden=false;
  document.getElementById('feedbackComplete').querySelector('.panel-title').focus();
 }catch(error){
  showSubmissionError(error);
 }finally{
  feedbackSubmitting=false;
  submitButton.disabled=false;
  submitButton.dataset.i18n='feedback.submit';
  submitButton.textContent=i18n.t('feedback.submit');
  feedbackForm.removeAttribute('aria-busy');
 }
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
consultForm.querySelectorAll('input,select,textarea').forEach(field=>{
 field.addEventListener('input',()=>{
  updateFieldValidity(field,null);
  consultationSuccess.classList.remove('show');
 });
 field.addEventListener('change',()=>consultationSuccess.classList.remove('show'));
});
consultForm.addEventListener('submit',async e=>{
 e.preventDefault();
 if(consultationSubmitting)return;
 invalidFields.clear();
 consultForm.querySelectorAll('input,select,textarea').forEach(field=>{
  if(field.required&&!field.value.trim())updateFieldValidity(field,'validation.required');
  else if(field.type==='email'&&field.value&&field.validity.typeMismatch)updateFieldValidity(field,'validation.invalidEmail');
  else if(field.type==='date'&&field.value&&field.validity.rangeUnderflow)updateFieldValidity(field,'validation.invalidDate');
  else updateFieldValidity(field,null);
 });
 if(!e.target.reportValidity())return;
 const submitButton=consultForm.querySelector('[type="submit"]');
 const fields={
  full_name:document.getElementById('fullName').value,
  email:document.getElementById('email').value,
  startup_name:document.getElementById('consultStartup').value,
  industry:document.getElementById('consultIndustry').value,
  monthly_budget:document.getElementById('consultBudget').value,
  preferred_method:document.getElementById('method').value,
  preferred_date:document.getElementById('date').value,
  preferred_time:document.getElementById('time').value,
  challenge:document.getElementById('challenge').value
 };
 consultationSubmitting=true;
 submitButton.disabled=true;
 submitButton.dataset.i18n='consultation.submit.pending';
 submitButton.textContent=i18n.t('consultation.submit.pending');
 consultForm.setAttribute('aria-busy','true');
 consultationSuccess.classList.remove('show');
 try{
  await formSubmissionClient.submit('consultation',fields);
  consultForm.reset();
  consultationSuccess.classList.add('show');
  consultationSuccess.scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(error){
  showSubmissionError(error);
 }finally{
  consultationSubmitting=false;
  submitButton.disabled=false;
  submitButton.dataset.i18n='consultation.submit';
  submitButton.textContent=i18n.t('consultation.submit');
  consultForm.removeAttribute('aria-busy');
 }
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
