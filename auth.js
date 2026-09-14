const SESSION_KEY='kelo-admin-session-v1';
const ADMIN_USER='kelo';
const ADMIN_PASS='kelo';

function signedIn(){return sessionStorage.getItem(SESSION_KEY)==='admin'}
function setSignedIn(){sessionStorage.setItem(SESSION_KEY,'admin')}
function signOut(){sessionStorage.removeItem(SESSION_KEY);location.reload()}

function injectAuth(){
  const gate=document.createElement('div');
  gate.id='authGate';
  gate.className=`auth-gate ${signedIn()?'auth-hidden':''}`;
  gate.innerHTML=`<form class="auth-card" id="authForm" autocomplete="off">
    <div class="auth-logo" aria-hidden="true">K</div>
    <h1>Kelo Associates</h1>
    <p>Acceso privado al centro operativo. Esta cuenta tiene permisos de administrador.</p>
    <div class="auth-field"><label for="authUser">Usuario</label><input id="authUser" name="username" autocapitalize="none" autocomplete="username" required></div>
    <div class="auth-field"><label for="authPass">Contraseña</label><input id="authPass" name="password" type="password" autocomplete="current-password" required></div>
    <button class="auth-submit" type="submit">Entrar</button>
    <div class="auth-error" id="authError" role="alert" aria-live="polite"></div>
    <div class="auth-meta"><span class="auth-badge">● Admin</span><span>Sesión local de prototipo</span></div>
  </form>`;
  document.body.prepend(gate);

  const form=gate.querySelector('#authForm');
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const user=form.elements.username.value.trim();
    const pass=form.elements.password.value;
    if(user===ADMIN_USER&&pass===ADMIN_PASS){
      setSignedIn();
      gate.classList.add('auth-hidden');
      document.dispatchEvent(new CustomEvent('kelo:admin-login',{detail:{role:'admin',username:'kelo'}}));
      return;
    }
    gate.querySelector('#authError').textContent='Usuario o contraseña incorrectos.';
    form.elements.password.select();
  });
}

function injectAdminSession(){
  const more=document.querySelector('[data-screen="more"] .grid.two');
  if(!more||document.querySelector('#adminSessionCard'))return;
  const card=document.createElement('div');
  card.id='adminSessionCard';
  card.className='card stack';
  card.innerHTML=`<div class="sectiontitle"><h3>Sesión</h3><span class="admin-session">● Admin · kelo</span></div><p class="muted">Acceso administrativo activo en este dispositivo.</p><button class="secondary wide admin-logout" id="adminLogout">Cerrar sesión</button>`;
  more.prepend(card);
  card.querySelector('#adminLogout').addEventListener('click',signOut);
}

function boot(){injectAuth();injectAdminSession()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

export {signedIn,signOut};