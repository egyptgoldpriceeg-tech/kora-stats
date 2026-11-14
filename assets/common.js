const ST=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{return null}};
let lang=ST('lang')==='en'?'en':'ar',theme=ST('theme')==='dark'?'dark':'light';
const R=document.documentElement,$=s=>document.querySelector(s);
function apply(){R.lang=lang;R.dir=lang==='ar'?'rtl':'ltr';R.dataset.theme=theme;
$('#lang').textContent=lang==='ar'?'EN':'ع';$('#theme').textContent=theme==='dark'?'☀':'☾';
document.title=document.body.dataset[lang==='ar'?'ta':'te'];}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.id==='lang'){lang=lang==='ar'?'en':'ar';ST('lang',lang);apply()}
if(b.id==='theme'){theme=theme==='dark'?'light':'dark';ST('theme',theme);apply()}});
apply();
