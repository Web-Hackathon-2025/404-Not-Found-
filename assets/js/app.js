const $ = (sel, ctx=document) => ctx.querySelector(sel)
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel))
const state = {
  session: null,
  users: [],
  providers: [],
  requests: [],
  reviews: [],
  categories: ["Plumber","Electrician","Tutor","Cleaner","Mechanic","Carpenter"],
  cities: ["Karachi","Lahore","Islamabad","Peshawar","Quetta"]
}
const roles = { customer:'customer', provider:'provider', admin:'admin' }
const statuses = ['requested','confirmed','completed','cancelled']
function icon(name){
  if(name==='location') return `<span class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/></svg></span>`
  if(name==='price') return `<span class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v18M7 8c0-3 10-3 10 0s-10 3-10 6 10 3 10 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>`
  if(name==='clock') return `<span class="icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>`
  if(name==='spark') return `<span class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" stroke="currentColor" stroke-width="2"/></svg></span>`
  return `<span class="icon">⭐</span>`
}
init()
function init(){
  load()
  seedIfEmpty()
  renderNav()
  route()
  window.addEventListener('hashchange', route)
  window.addEventListener('hashchange', ()=> setNavOpen(false))
}
function setNavOpen(open){
  document.body.classList.toggle('nav-open', open)
  const b = $('#nav-toggle')
  if(b) b.setAttribute('aria-expanded', open?'true':'false')
}
function setupNavToggle(){
  const b = $('#nav-toggle')
  if(b) b.onclick = ()=> setNavOpen(!document.body.classList.contains('nav-open'))
}
function load(){
  const j = k => JSON.parse(localStorage.getItem(k) || 'null')
  state.session = j('session')
  state.users = j('users') || []
  state.providers = j('providers') || []
  state.requests = j('requests') || []
  state.reviews = j('reviews') || []
}
function save(){
  localStorage.setItem('users', JSON.stringify(state.users))
  localStorage.setItem('providers', JSON.stringify(state.providers))
  localStorage.setItem('requests', JSON.stringify(state.requests))
  localStorage.setItem('reviews', JSON.stringify(state.reviews))
  localStorage.setItem('session', JSON.stringify(state.session))
}
async function hash(str){
  const enc = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
}
function seedIfEmpty(){
  if(!state.users.length){
    const admin = { id:uid(), name:'Admin', email:'admin@karigar.local', role:roles.admin, password:'admin123', suspended:false }
    state.users.push(admin)
    save()
  }
  if(!state.providers.length){
    const sample = [
      { name:'Ali Plumbing', categories:['Plumber'], city:'Karachi', pricing:800, availability:'9am–6pm', bio:'Pipe and leak specialists', rating:4.6 },
      { name:'Bright Spark', categories:['Electrician'], city:'Lahore', pricing:1000, availability:'10am–7pm', bio:'Wiring and appliances', rating:4.4 },
      { name:'CleanCo', categories:['Cleaner'], city:'Islamabad', pricing:600, availability:'Flexible', bio:'Home and office cleaning', rating:4.2 }
    ]
    sample.forEach((p,i)=>{
      const u = { id:uid(), name:p.name, email:`p${i+1}@karigar.local`, role:roles.provider, password:'provider123' , suspended:false }
      state.users.push(u)
      state.providers.push({ id:u.id, categories:p.categories, city:p.city, pricing:p.pricing, availability:p.availability, bio:p.bio, rating:p.rating, services:p.categories })
    })
    save()
  }
}
function uid(){ return Math.random().toString(36).slice(2) }
function now(){ return new Date().toISOString() }
function sessionUser(){ return state.users.find(u=>state.session && u.id===state.session.userId) }
function logout(){ state.session=null; save(); location.hash='#/login' }
async function login(email, password){
  const u = state.users.find(x=>x.email===email)
  if(!u || u.suspended) return false
  const h = await hash(password)
  const okHashed = u.password === h
  const okPlain = u.password && u.password === password
  if(!okHashed && !okPlain) return false
  if(okPlain){ u.password = h; save() }
  state.session = { userId:u.id, role:u.role, time:now() }
  save()
  return true
}
async function register(name,email,password,role){
  if(state.users.some(u=>u.email===email)) return false
  const u = { id:uid(), name, email, role, password: await hash(password), suspended:false }
  state.users.push(u)
  if(role===roles.provider) state.providers.push({ id:u.id, categories:[], city:'', pricing:0, availability:'', bio:'', rating:0, services:[] })
  save()
  return true
}
function renderNav(){
  const nav = $('#nav-actions')
  nav.innerHTML = ''
  if(!state.session){
    nav.innerHTML = `
      <li><a href="#/login">Sign in</a></li>
      <li><a href="#/register" role="button">Create account</a></li>
    `
  } else {
    nav.innerHTML = `
      <li><a href="#/">Home</a></li>
      <li><a href="#/dashboard">Dashboard</a></li>
      <li><a href="#/search">Search</a></li>
      <li><button class="secondary outline" id="logout">Logout</button></li>
    `
    $('#logout').onclick = logout
  }
  setupNavToggle()
  $$('#nav-actions a, #nav-actions button').forEach(el=> el.addEventListener('click', ()=> setNavOpen(false)))
}
function route(){
  const path = location.hash.slice(1)||'/'
  if(path==='/') return renderHome()
  if(path.startsWith('/login')) return renderLogin()
  if(path.startsWith('/register')) return renderRegister()
  if(path.startsWith('/dashboard')) return renderDashboard()
  if(path.startsWith('/search')) return renderSearch()
  if(path.startsWith('/provider/')) return renderProviderProfile(path.split('/')[2])
  renderHome()
}
function renderHome(){
  const u = sessionUser()
  const avgRating = (state.providers.length? (state.providers.reduce((a,b)=>a+(b.rating||0),0)/state.providers.length).toFixed(2):'0.0')
  $('#root').innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <h1>Find trusted local pros, fast</h1>
        <p class="muted">A sleek hyperlocal marketplace connecting you to nearby services</p>
        <div class="hero-cta">
          <a href="#/search" role="button" class="cta-primary">Browse providers</a>
          ${u?`<a href="#/dashboard" role="button" class="cta-outline">Go to dashboard</a>`:`<a href="#/register" role="button" class="cta-outline">Get started</a>`}
        </div>
        <div class="toolbar hero-search">
          <select id="home-category">${state.categories.map(c=>`<option>${c}</option>`).join('')}</select>
          <select id="home-city">${state.cities.map(c=>`<option>${c}</option>`).join('')}</select>
          <button id="home-search">Search</button>
        </div>
        <div class="stats">
          <div class="stat"><small class="muted">Providers</small><strong>${state.providers.length}</strong></div>
          <div class="stat"><small class="muted">Requests</small><strong>${state.requests.length}</strong></div>
          <div class="stat"><small class="muted">Avg Rating</small><strong>${avgRating}</strong></div>
        </div>
        <div class="popular-grid">
          ${state.categories.slice(0,6).map(c=>`
            <div class="category-card" data-cat="${c}">
              ${icon('spark')} <strong>${c}</strong>
            </div>`).join('')}
        </div>
      </div>
    </section>
    <section class="feature-grid">
      <article class="feature-card">
        <div class="feature-icon">🔧</div>
        <h3>Skilled pros</h3>
        <p class="muted">Plumbers, electricians, cleaners, tutors and more.</p>
      </article>
      <article class="feature-card">
        <div class="feature-icon">📍</div>
        <h3>Hyperlocal</h3>
        <p class="muted">Filter by city and category to find nearby services.</p>
      </article>
      <article class="feature-card">
        <div class="feature-icon">⏱️</div>
        <h3>Fast requests</h3>
        <p class="muted">Send a request and track status in one place.</p>
      </article>
      <article class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h3>Trusted reviews</h3>
        <p class="muted">Rate completed jobs to help others choose confidently.</p>
      </article>
      <article class="feature-card">
        <div class="feature-icon">💬</div>
        <h3>Direct messaging</h3>
        <p class="muted">Coordinate details quickly with providers (coming soon).</p>
      </article>
    </section>
    <section>
      <div id="home-results" class="grid-3" style="margin-top:1rem"></div>
    </section>
  `
  $$('.category-card').forEach(el=>{
    el.onclick = ()=>{
      const c = el.dataset.cat
      $('#home-category').value = c
      $('#home-search').click()
    }
  })
  $('#home-search').onclick = ()=>{
    const c = $('#home-category').value
    const city = $('#home-city').value
    const list = state.providers.filter(p=>p.categories.includes(c) && p.city===city)
    const box = $('#home-results')
    box.innerHTML = list.map(p=>{
      const user = state.users.find(u=>u.id===p.id)
      return `<article class="card">
          <h3>${user.name}</h3>
          <p class="muted">${icon('location')} ${p.city}</p>
          <div>${p.categories.map(x=>`<span class="pill">${x}</span>`).join('')}</div>
          <p>${icon('price')} PKR ${p.pricing} • ${icon('clock')} ${p.availability}</p>
          <footer class="toolbar">
            <a href="#/provider/${p.id}">View profile</a>
            ${state.session && state.session.role===roles.customer?`<button data-id="${p.id}" class="request">Request</button>`:''}
          </footer>
        </article>`
    }).join('') || '<p class="muted">No providers found</p>'
    $$('.request', box).forEach(btn=>{
      btn.onclick = ()=> openRequestModal(btn.dataset.id)
    })
  }
}
function renderLogin(){
  $('#root').innerHTML = `
    <article class="card">
      <h2>Sign in</h2>
      <form id="login-form">
        <label>Email <input type="email" required name="email"></label>
        <label>Password <input type="password" required name="password"></label>
        <button type="submit">Sign in</button>
      </form>
    </article>
  `
  $('#login-form').onsubmit = async e=>{
    e.preventDefault()
    const ok = await login(e.target.email.value, e.target.password.value)
    if(!ok) alert('Invalid credentials or account suspended')
    else { renderNav(); location.hash='#/dashboard' }
  }
}
function renderRegister(){
  $('#root').innerHTML = `
    <article class="card">
      <h2>Create account</h2>
      <form id="reg-form">
        <label>Name <input required name="name"></label>
        <label>Email <input type="email" required name="email"></label>
        <label>Password <input type="password" required name="password"></label>
        <fieldset>
          <legend>Role</legend>
          <label><input type="radio" name="role" value="${roles.customer}" checked> Customer</label>
          <label><input type="radio" name="role" value="${roles.provider}"> Service Provider</label>
        </fieldset>
        <button type="submit">Create</button>
      </form>
    </article>
  `
  $('#reg-form').onsubmit = async e=>{
    e.preventDefault()
    const role = new FormData(e.target).get('role')
    const ok = await register(e.target.name.value, e.target.email.value, e.target.password.value, role)
    if(!ok) alert('Email already exists')
    else { alert('Account created, please sign in'); location.hash='#/login' }
  }
}
function renderDashboard(){
  const u = sessionUser()
  if(!u) { location.hash='#/login'; return }
  if(u.role===roles.customer) return renderCustomerDashboard(u)
  if(u.role===roles.provider) return renderProviderDashboard(u)
  return renderAdminDashboard(u)
}
function renderCustomerDashboard(u){
  const mine = state.requests.filter(r=>r.customerId===u.id).sort((a,b)=>b.time.localeCompare(a.time))
  $('#root').innerHTML = `
    <h2>Customer Dashboard</h2>
    <div class="toolbar">
      <a href="#/search" role="button">Search providers</a>
    </div>
    <h3>Requests</h3>
    <div>${mine.map(r=>renderRequestRow(r,u.role)).join('') || '<p class="muted">No requests yet</p>'}</div>
  `
  $$('.action-complete').forEach(b=> b.onclick=()=> markCompleted(b.dataset.id, u))
  $$('.action-cancel').forEach(b=> b.onclick=()=> markCancelled(b.dataset.id))
  $$('.action-review').forEach(b=> b.onclick=()=> openReviewModal(b.dataset.id))
}
function renderProviderDashboard(u){
  const p = state.providers.find(x=>x.id===u.id)
  const incoming = state.requests.filter(r=>r.providerId===u.id).sort((a,b)=>b.time.localeCompare(a.time))
  $('#root').innerHTML = `
    <h2>Provider Dashboard</h2>
    <article class="card">
      <h3>Profile</h3>
      <form id="prov-form">
        <label>City
          <select name="city">${state.cities.map(c=>`<option ${p.city===c?'selected':''}>${c}</option>`).join('')}</select>
        </label>
        <label>Categories
          <select name="categories" multiple size="6">${state.categories.map(c=>`<option ${p.categories.includes(c)?'selected':''}>${c}</option>`).join('')}</select>
        </label>
        <label>Pricing (PKR) <input type="number" name="pricing" value="${p.pricing}"></label>
        <label>Availability <input name="availability" value="${p.availability}"></label>
        <label>Bio <textarea name="bio">${p.bio}</textarea></label>
        <button type="submit">Save</button>
      </form>
    </article>
    <h3>Incoming Requests</h3>
    <div>${incoming.map(r=>renderRequestRow(r,u.role)).join('') || '<p class="muted">No requests</p>'}</div>
    <h3>Booking History</h3>
    <div>${incoming.filter(r=>r.status!=='requested').map(r=>renderRequestRow(r,u.role)).join('') || '<p class="muted">No history</p>'}</div>
  `
  $('#prov-form').onsubmit = e=>{
    e.preventDefault()
    p.city = e.target.city.value
    p.categories = Array.from(e.target.categories.selectedOptions).map(o=>o.value)
    p.pricing = Number(e.target.pricing.value||0)
    p.availability = e.target.availability.value
    p.bio = e.target.bio.value
    save()
    alert('Profile updated')
  }
  $$('.action-accept').forEach(b=> b.onclick=()=> markConfirmed(b.dataset.id))
  $$('.action-reject').forEach(b=> b.onclick=()=> markCancelled(b.dataset.id))
  $$('.action-complete').forEach(b=> b.onclick=()=> markCompleted(b.dataset.id))
}
function renderAdminDashboard(u){
  const activeUsers = state.users.filter(x=>!x.suspended)
  const suspendedUsers = state.users.filter(x=>x.suspended)
  const metrics = {
    users: state.users.length,
    providers: state.providers.length,
    requests: state.requests.length,
    completed: state.requests.filter(r=>r.status==='completed').length
  }
  $('#root').innerHTML = `
    <h2>Admin Dashboard</h2>
    <div class="grid-3">
      <article class="card"><h3>Users</h3><p>${metrics.users}</p></article>
      <article class="card"><h3>Providers</h3><p>${metrics.providers}</p></article>
      <article class="card"><h3>Requests</h3><p>${metrics.requests}</p></article>
      <article class="card"><h3>Completed</h3><p>${metrics.completed}</p></article>
    </div>
    <h3>Manage Accounts</h3>
    <details>
      <summary>Active</summary>
      <ul>${activeUsers.map(u=>`<li>${u.name} (${u.role}) <button data-id="${u.id}" class="suspend">Suspend</button></li>`).join('') || '<li class="muted">None</li>'}</ul>
    </details>
    <details>
      <summary>Suspended</summary>
      <ul>${suspendedUsers.map(u=>`<li>${u.name} (${u.role}) <button data-id="${u.id}" class="restore">Restore</button></li>`).join('') || '<li class="muted">None</li>'}</ul>
    </details>
  `
  $$('.suspend').forEach(b=> b.onclick=()=> { const t=state.users.find(x=>x.id===b.dataset.id); t.suspended=true; save(); renderAdminDashboard(u) })
  $$('.restore').forEach(b=> b.onclick=()=> { const t=state.users.find(x=>x.id===b.dataset.id); t.suspended=false; save(); renderAdminDashboard(u) })
}
function renderSearch(){
  $('#root').innerHTML = `
    <h2>Search</h2>
    <div class="toolbar">
      <select id="q-category"><option value="">All</option>${state.categories.map(c=>`<option>${c}</option>`).join('')}</select>
      <select id="q-city"><option value="">All</option>${state.cities.map(c=>`<option>${c}</option>`).join('')}</select>
      <input id="q-text" placeholder="Keyword">
      <button id="q-go">Search</button>
    </div>
    <div id="q-results" class="grid-3" style="margin-top:1rem"></div>
  `
  $('#q-go').onclick = ()=>{
    const cat = $('#q-category').value
    const city = $('#q-city').value
    const kw = $('#q-text').value.toLowerCase()
    const list = state.providers.filter(p=>{
      const okCat = !cat || p.categories.includes(cat)
      const okCity = !city || p.city===city
      const u = state.users.find(x=>x.id===p.id)
      const okKw = !kw || u.name.toLowerCase().includes(kw) || p.bio.toLowerCase().includes(kw)
      return okCat && okCity && okKw
    })
    const box = $('#q-results')
    box.innerHTML = list.map(p=>{
      const user = state.users.find(u=>u.id===p.id)
      return `<article class="card">
          <h3>${user.name}</h3>
          <p class="muted">${icon('location')} ${p.city} • ⭐ ${p.rating}</p>
          <div>${p.categories.map(x=>`<span class="pill">${x}</span>`).join('')}</div>
          <footer class="toolbar">
            <a href="#/provider/${p.id}">View profile</a>
            ${state.session && state.session.role===roles.customer?`<button data-id="${p.id}" class="request">Request</button>`:''}
          </footer>
        </article>`
    }).join('') || '<p class="muted">No results</p>'
    $$('.request', box).forEach(btn=> btn.onclick=()=> openRequestModal(btn.dataset.id))
  }
}
function renderProviderProfile(id){
  const p = state.providers.find(x=>x.id===id)
  if(!p){ $('#root').innerHTML='<p class="muted">Provider not found</p>'; return }
  const u = state.users.find(x=>x.id===id)
  const recent = state.reviews.filter(r=>r.providerId===id).slice(-5).reverse()
  $('#root').innerHTML = `
    <article class="card">
      <h2>${u.name}</h2>
      <p class="muted">${p.city} • Availability ${p.availability}</p>
      <p>${p.bio}</p>
      <div>${p.categories.map(x=>`<span class="pill">${x}</span>`).join('')}</div>
      <p>PKR ${p.pricing}</p>
      <footer class="toolbar">
        ${state.session && state.session.role===roles.customer?`<button class="request" data-id="${p.id}">Request service</button>`:''}
      </footer>
    </article>
    <section>
      <h3>Recent Reviews</h3>
      ${recent.map(r=>`<article class="card"><strong>${r.rating} ★</strong><p>${r.text}</p><small class="muted">${new Date(r.time).toLocaleString()}</small></article>`).join('') || '<p class="muted">No reviews yet</p>'}
    </section>
  `
  const btn = $('.request')
  if(btn) btn.onclick = ()=> openRequestModal(btn.dataset.id)
}
function renderRequestRow(r, role){
  const prov = state.users.find(u=>u.id===r.providerId)
  const cust = state.users.find(u=>u.id===r.customerId)
  const actions = []
  if(role===roles.provider && r.status==='requested'){
    actions.push(`<button class="action-accept" data-id="${r.id}">Accept</button>`)
    actions.push(`<button class="action-reject" data-id="${r.id}">Reject</button>`)
  }
  if(role===roles.provider && r.status==='confirmed') actions.push(`<button class="action-complete" data-id="${r.id}">Mark complete</button>`)
  if(role===roles.customer && r.status==='requested') actions.push(`<button class="action-cancel" data-id="${r.id}">Cancel</button>`)
  if(role===roles.customer && r.status==='completed' && !state.reviews.some(x=>x.requestId===r.id)) actions.push(`<button class="action-review" data-id="${r.id}">Review</button>`)
  const badgeClass = `status-badge status-${r.status}`
  return `<article class="card">
    <strong>${prov.name}</strong> • <span class="${badgeClass}">${r.status}</span>
    <p class="muted">${new Date(r.time).toLocaleString()}</p>
    <p>${r.details}</p>
    <footer class="toolbar">${actions.join(' ')}</footer>
  </article>`
}
function openRequestModal(providerId){
  const dlg = $('#modal')
  const prov = state.users.find(u=>u.id===providerId)
  dlg.innerHTML = `
    <article>
      <header><strong>Request ${prov.name}</strong></header>
      <form id="req-form">
        <label>Describe your need <textarea required name="details"></textarea></label>
        <label>Preferred date <input type="date" name="date"></label>
        <footer class="toolbar">
          <button type="submit">Send request</button>
          <button class="secondary" id="close">Cancel</button>
        </footer>
      </form>
    </article>
  `
  dlg.showModal()
  $('#close').onclick = e=> { e.preventDefault(); dlg.close() }
  $('#req-form').onsubmit = e=>{
    e.preventDefault()
    const u = sessionUser()
    if(!u || u.role!==roles.customer){ alert('Sign in as customer'); dlg.close(); return }
    const r = { id:uid(), providerId, customerId:u.id, status:'requested', details:e.target.details.value, preferredDate:e.target.date.value, time:now() }
    state.requests.push(r)
    save()
    dlg.close()
    location.hash = '#/dashboard'
  }
}
function markConfirmed(id){
  const r = state.requests.find(x=>x.id===id)
  if(!r) return
  r.status='confirmed'; save(); route()
}
function markCompleted(id){
  const r = state.requests.find(x=>x.id===id)
  if(!r) return
  r.status='completed'; save(); route()
}
function markCancelled(id){
  const r = state.requests.find(x=>x.id===id)
  if(!r) return
  r.status='cancelled'; save(); route()
}
function openReviewModal(requestId){
  const dlg = $('#modal')
  dlg.innerHTML = `
    <article>
      <header><strong>Leave a review</strong></header>
      <form id="rev-form">
        <label>Rating (1–5) <input type="number" min="1" max="5" name="rating" required></label>
        <label>Feedback <textarea name="text" required></textarea></label>
        <footer class="toolbar">
          <button type="submit">Submit</button>
          <button class="secondary" id="close">Cancel</button>
        </footer>
      </form>
    </article>
  `
  dlg.showModal()
  $('#close').onclick = e=> { e.preventDefault(); dlg.close() }
  $('#rev-form').onsubmit = e=>{
    e.preventDefault()
    const r = state.requests.find(x=>x.id===requestId)
    if(!r) { dlg.close(); return }
    const rev = { id:uid(), providerId:r.providerId, requestId, rating:Number(e.target.rating.value), text:e.target.text.value, time:now() }
    state.reviews.push(rev)
    const p = state.providers.find(x=>x.id===r.providerId)
    const provReviews = state.reviews.filter(x=>x.providerId===r.providerId)
    const avg = provReviews.reduce((a,b)=>a+b.rating,0)/provReviews.length
    p.rating = Number(avg.toFixed(2))
    save()
    dlg.close()
    route()
  }
}
