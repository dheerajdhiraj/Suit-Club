// script.js — Suit Club Homepage

// ─── Element References ─────────────────────────────────────────────────────
const bookingModal = document.getElementById('bookingModal');
const confirmationModal = document.getElementById('confirmationModal');
const authModal = document.getElementById('authModal');

// ─── Toast Notifications ─────────────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ─── Dark Mode ───────────────────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') document.documentElement.classList.add('dark');
  updateDarkIcon();
  document.getElementById('darkToggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    updateDarkIcon();
  });
}
function updateDarkIcon() {
  const icon = document.getElementById('darkIcon');
  if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
function openMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');
  menu.style.pointerEvents = 'auto';
  menu.classList.add('open');
  overlay.style.pointerEvents = 'auto';
  overlay.style.opacity = '1';
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');
  menu.classList.remove('open');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => { menu.style.pointerEvents = 'none'; document.body.style.overflow = ''; }, 350);
}

// ─── Booking Modal ───────────────────────────────────────────────────────────
function openBookingModal() {
  bookingModal.classList.remove('hidden');
  bookingModal.classList.add('flex');
}
function closeBookingModal() {
  bookingModal.classList.add('hidden');
  bookingModal.classList.remove('flex');
}
function closeConfirmationModal() {
  confirmationModal.classList.add('hidden');
  confirmationModal.classList.remove('flex');
}

// ─── Booking Form Submission (saves to MongoDB) ──────────────────────────────
async function submitBooking(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.fullName || !data.email || !data.phone) { showToast('⚠️ Please fill all required fields.'); return; }
  if (!data.bookingDate) { showToast('⚠️ Please select a date.'); return; }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        bookingDate: data.bookingDate,
        timeSlot: data.selectedTime || '',
        requests: data.requests || ''
      })
    });
    const booking = await res.json();

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    form.reset();
    document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('border-gold', 'bg-gold/10', 'text-gold', 'border-2', 'font-medium'));
    document.getElementById('selectedTime').value = '';

    const chosenDate = data.bookingDate ? new Date(data.bookingDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const chosenTime = data.selectedTime || '—';
    document.getElementById('confirmedDate').textContent = chosenDate;
    document.getElementById('confirmedTime').textContent = chosenTime;
    document.getElementById('confirmedRef').textContent = booking.referenceNumber ? `Reference: ${booking.referenceNumber}` : '';

    closeBookingModal();
    confirmationModal.classList.remove('hidden');
    confirmationModal.classList.add('flex');
  } catch (err) {
    console.error('Booking error:', err);
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    showToast('❌ Could not save booking. Please try again.');
  }
}

// ─── Auth System (localStorage-based) ────────────────────────────────────────
let authMode = 'login';

function openAuthModal(mode) {
  authMode = mode;
  closeUserDropdown();
  authModal.classList.remove('hidden');
  authModal.classList.add('flex');
  updateAuthUI();
}
function closeAuthModal() {
  authModal.classList.add('hidden');
  authModal.classList.remove('flex');
  document.getElementById('authError').classList.add('hidden');
}
function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  updateAuthUI();
}
function updateAuthUI() {
  const isLogin = authMode === 'login';
  document.getElementById('authTitle').textContent = isLogin ? 'Sign In' : 'Create Account';
  document.getElementById('authSubmitBtn').textContent = isLogin ? 'Sign In' : 'Create Account';
  document.getElementById('registerFields').classList.toggle('hidden', isLogin);
  document.getElementById('authToggleText').textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authToggleBtn').textContent = isLogin ? 'Create one' : 'Sign in';
  if (!isLogin) document.getElementById('authName').required = true;
  else if (document.getElementById('authName')) document.getElementById('authName').required = false;
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail')?.value.trim();
  const username = document.getElementById('authName')?.value.trim(); // used for login as well
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  errEl.classList.add('hidden');

  const submitBtn = document.getElementById('authSubmitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Wait...';
  submitBtn.disabled = true;

  try {
    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = authMode === 'register' 
      ? { name: username, email, password } 
      : (email ? { email, password } : { username, password });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Auth failed');

    localStorage.setItem('suitclub_token', data.token);
    localStorage.setItem('suitclub_user', JSON.stringify(data));
    
    closeAuthModal();
    updateUserUI();
    showToast(`Welcome back, ${data.name}! 🎉`);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function logoutUser() {
  localStorage.removeItem('suitclub_token');
  localStorage.removeItem('suitclub_user');
  localStorage.removeItem('suitclub_wishlist');
  closeUserDropdown();
  updateUserUI();
  showToast('Signed out successfully');
}

function updateUserUI() {
  const current = JSON.parse(localStorage.getItem('suitclub_user'));
  const loggedIn = document.getElementById('loggedInMenu');
  const loggedOut = document.getElementById('loggedOutMenu');
  if (current) {
    if (loggedIn) loggedIn.classList.remove('hidden');
    if (loggedOut) loggedOut.classList.add('hidden');
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = current.name;
    
    // Admin check
    const adminLink = document.getElementById('adminDashboardLink');
    if (adminLink) adminLink.classList.toggle('hidden', current.role !== 'admin');
  } else {
    if (loggedIn) loggedIn.classList.add('hidden');
    if (loggedOut) loggedOut.classList.remove('hidden');
  }
  updateWishlistCount();
}

// ─── User Dropdown ───────────────────────────────────────────────────────────
function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('open');
}
function closeUserDropdown() {
  document.getElementById('userDropdown').classList.remove('open');
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
function getWishlist() {
  return JSON.parse(localStorage.getItem('suitclub_wishlist') || '[]');
}
async function addToWishlist(product) {
  const list = getWishlist();
  if (list.find(p => p._id === product._id)) { showToast('Already in wishlist'); return; }
  
  const token = localStorage.getItem('suitclub_token');
  if (token) {
    try {
      await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ productId: product._id })
      });
    } catch (err) { console.error('Error syncing wishlist:', err); }
  }

  list.push(product);
  localStorage.setItem('suitclub_wishlist', JSON.stringify(list));
  updateWishlistCount();
  showToast('❤️ Added to wishlist!');
}
async function removeFromWishlist(id) {
  let list = getWishlist();
  list = list.filter(p => p._id !== id);
  localStorage.setItem('suitclub_wishlist', JSON.stringify(list));
  
  const token = localStorage.getItem('suitclub_token');
  if (token) {
    try {
      await fetch(`/api/user/wishlist/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
    } catch (err) { console.error('Error syncing wishlist:', err); }
  }

  updateWishlistCount();
  renderWishlistItems();
}
function updateWishlistCount() {
  const count = getWishlist().length;
  const badge = document.getElementById('wishlistCount');
  const menuCount = document.getElementById('wishlistMenuCount');
  if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
  if (menuCount) menuCount.textContent = count;
}
function showWishlist() {
  closeUserDropdown();
  const sidebar = document.getElementById('wishlistSidebar');
  const panel = document.getElementById('wishlistPanel');
  sidebar.classList.remove('hidden');
  setTimeout(() => panel.style.transform = 'translateX(0)', 10);
  document.body.style.overflow = 'hidden';
  renderWishlistItems();
}
function closeWishlist() {
  const panel = document.getElementById('wishlistPanel');
  panel.style.transform = 'translateX(100%)';
  setTimeout(() => {
    document.getElementById('wishlistSidebar').classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}
function renderWishlistItems() {
  const container = document.getElementById('wishlistItems');
  const items = getWishlist();
  if (items.length === 0) {
    container.innerHTML = '<p class="py-12 text-center text-gray-500">Your wishlist is empty.<br><a href="#collections" onclick="closeWishlist()" class="text-gold font-medium">Browse Collections</a></p>';
    return;
  }
  container.innerHTML = items.map(p => `
    <div class="flex gap-3 rounded-xl bg-gray-50 p-3 transition hover:shadow-md">
      <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200'}" alt="${p.title}" class="h-24 w-20 rounded-lg object-cover">
      <div class="min-w-0 flex-1">
        <h4 class="text-navy truncate text-sm font-bold">${p.title}</h4>
        <p class="mt-1 text-xs text-gray-500">${p.price ? 'Rs. ' + p.price.toLocaleString() : 'Price on request'}</p>
        <a href="/product.html?id=${p._id}" onclick="closeWishlist()" class="text-gold mt-2 inline-block text-xs font-medium hover:underline">View →</a>
      </div>
      <button onclick="removeFromWishlist('${p._id}')" class="self-start p-1 text-red-400 hover:text-red-600"><span class="material-symbols-outlined text-lg">delete</span></button>
    </div>
  `).join('');
}

// ─── Newsletter Subscription ─────────────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletterEmail');
  const email = emailInput.value.trim();
  if (!email) return;
  const btn = document.getElementById('newsletterBtn');
  btn.textContent = 'Subscribing...';
  btn.disabled = true;

  fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    btn.textContent = 'Subscribe';
    btn.disabled = false;
    emailInput.value = '';
    showToast(data.message || '✉️ Subscribed successfully!');
  })
  .catch(() => {
    btn.textContent = 'Subscribe';
    btn.disabled = false;
    showToast('❌ Subscription failed. Try again.');
  });
}

// ─── Testimonial Carousel ────────────────────────────────────────────────────
let carouselIndex = 0;
let autoSlideInterval;

function initCarousel() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  const slides = track.querySelectorAll('.carousel-slide');
  const isDesktop = window.innerWidth >= 768;
  const perView = isDesktop ? 3 : 1;
  const maxIndex = Math.max(0, slides.length - perView);

  // Create dots
  const dotsContainer = document.getElementById('carouselDots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('button');
    dot.className = `w-2.5 h-2.5 rounded-full transition-all ${i === 0 ? 'bg-gold w-6' : 'bg-gray-300'}`;
    dot.onclick = () => goToSlide(i);
    dotsContainer.appendChild(dot);
  }
  goToSlide(0);

  // Auto-slide every 4s
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(() => {
    const next = carouselIndex >= maxIndex ? 0 : carouselIndex + 1;
    goToSlide(next);
  }, 4000);
}

function goToSlide(index) {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  const slides = track.querySelectorAll('.carousel-slide');
  const isDesktop = window.innerWidth >= 768;
  const perView = isDesktop ? 3 : 1;
  const maxIndex = Math.max(0, slides.length - perView);
  carouselIndex = Math.max(0, Math.min(index, maxIndex));
  const pct = (carouselIndex / slides.length) * 100;
  track.style.transform = `translateX(-${pct}%)`;
  // Update dots
  const dots = document.getElementById('carouselDots')?.children;
  if (dots) Array.from(dots).forEach((d, i) => {
    d.className = `h-2.5 rounded-full transition-all ${i === carouselIndex ? 'bg-gold w-6' : 'bg-gray-300 w-2.5'}`;
  });
}

function moveCarousel(dir) {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  const slides = track.querySelectorAll('.carousel-slide');
  const isDesktop = window.innerWidth >= 768;
  const perView = isDesktop ? 3 : 1;
  const maxIndex = Math.max(0, slides.length - perView);
  let next = carouselIndex + dir;
  if (next < 0) next = maxIndex;
  if (next > maxIndex) next = 0;
  goToSlide(next);
  // Reset auto-slide
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(() => {
    const n = carouselIndex >= maxIndex ? 0 : carouselIndex + 1;
    goToSlide(n);
  }, 4000);
}

// ─── Scroll Animations ───────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ─── Back to Top ─────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 300);
  });
}

// ─── Dynamic Collections from API ────────────────────────────────────────────
const FALLBACK_CARDS = [
  { name: 'The Executive', description: 'Timeless sophistication for the modern leader.', imageUrl: './assets/20549.jpg' },
  { name: 'Wedding Luxe', description: 'Make your day unforgettable with bespoke elegance.', imageUrl: './assets/20549.jpg' },
  { name: 'Nepalese Heritage', description: 'Local inspiration, global craftsmanship.', imageUrl: './assets/20547.jpg' },
];

function renderCategoryCard(cat, index) {
  const fallbackImg = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  const card = document.createElement('div');
  card.className = `group relative cursor-pointer overflow-hidden bg-white shadow-lg transition hover:shadow-2xl animate-on-scroll delay-${(index % 4) + 1}`;
  card.innerHTML = `
    <div class="aspect-[3/4] overflow-hidden">
      <img src="${cat.imageUrl || fallbackImg}" alt="${cat.name}" loading="lazy" decoding="async"
           class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
           onerror="this.src='${fallbackImg}'">
    </div>
    <div class="p-6">
      <h3 class="mb-2 font-serif text-2xl font-bold">${cat.name}</h3>
      <p class="mb-4 text-gray-600">${cat.description || 'Exclusive suits crafted with the finest materials.'}</p>
      <a href="/collection.html?category=${encodeURIComponent(cat.name)}" class="text-gold inline-flex items-center gap-1 font-medium transition hover:gap-2">
        Explore <span class="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
    </div>
  `;
  card.addEventListener('click', () => { window.location.href = `/collection.html?category=${encodeURIComponent(cat.name)}`; });
  return card;
}

async function fetchCollections() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('API error');
    const categories = await res.json();
    grid.innerHTML = '';
    const source = categories.length > 0 ? categories : FALLBACK_CARDS;
    source.forEach((cat, i) => grid.appendChild(renderCategoryCard(cat, i)));
  } catch (err) {
    console.warn('Could not load categories from API, showing fallback cards.', err);
    grid.innerHTML = '';
    FALLBACK_CARDS.forEach((cat, i) => grid.appendChild(renderCategoryCard(cat, i)));
  }
  // Re-observe new cards
  setTimeout(initScrollAnimations, 100);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  // Session check
  const token = localStorage.getItem('suitclub_token');
  if (token) {
    fetch('/api/auth/me', { headers: { 'x-auth-token': token } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(user => {
        localStorage.setItem('suitclub_user', JSON.stringify(user));
        if (user.wishlist) localStorage.setItem('suitclub_wishlist', JSON.stringify(user.wishlist));
        updateUserUI();
      })
      .catch(() => {
        localStorage.removeItem('suitclub_token');
        localStorage.removeItem('suitclub_user');
        updateUserUI();
      });
  }

  // Dark mode
  initDarkMode();

  // Mobile menu
  document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileMenu);

  // User dropdown toggle
  document.getElementById('userBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserDropdown();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#userDropdown') && !e.target.closest('#userBtn')) closeUserDropdown();
  });

  // Auth form
  document.getElementById('loginForm')?.addEventListener('submit', handleAuth);
  updateUserUI();

  // Book appointment buttons
  const bookButtons = document.querySelectorAll('#openBookingBtn, #heroBookBtn, #bespokeBookBtn');
  bookButtons.forEach(btn => btn.addEventListener('click', openBookingModal));

  // Set booking date minimum to today
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Time slot selection
  document.getElementById('timeSlots')?.addEventListener('click', function (e) {
    const btn = e.target.closest('.time-slot');
    if (!btn) return;
    document.querySelectorAll('.time-slot').forEach(b => {
      b.classList.remove('border-gold', 'bg-gold/10', 'text-gold', 'border-2', 'font-medium');
      b.classList.add('border-gray-300');
    });
    btn.classList.add('border-gold', 'bg-gold/10', 'text-gold', 'border-2', 'font-medium');
    btn.classList.remove('border-gray-300');
    document.getElementById('selectedTime').value = btn.dataset.time;
  });

  // Newsletter
  document.getElementById('newsletterForm')?.addEventListener('submit', handleNewsletter);

  // Load dynamic collections
  fetchCollections();

  // Carousel
  initCarousel();
  window.addEventListener('resize', initCarousel);

  // Scroll animations
  initScrollAnimations();

  // Back to top
  initBackToTop();

  // Escape key to close modals
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!bookingModal?.classList.contains('hidden')) closeBookingModal();
      if (!confirmationModal?.classList.contains('hidden')) closeConfirmationModal();
      if (!authModal?.classList.contains('hidden')) closeAuthModal();
      closeMobileMenu();
      closeWishlist();
    }
  });
});