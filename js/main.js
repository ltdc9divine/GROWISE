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
const invalidFields=new Map();
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
 document.getElementById('successMessage').classList.add('show');
 document.getElementById('successMessage').scrollIntoView({behavior:'smooth',block:'nearest'});
 toast(i18n.t('consultation.demo.toast'));
});
document.addEventListener('growise:localechange',()=>{
 invalidFields.forEach((key,field)=>field.setCustomValidity(i18n.t(key)));
});
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}

window.Growise = window.Growise || {};
window.Growise.toast = toast;
})();
