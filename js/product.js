// product.js — Product detail page with gallery, reviews, related, wishlist, badges

let currentProduct = null;

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode persistence
  if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark');

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    document.getElementById('loadingState').innerHTML = '<p class="text-red-500">Product Not Found.</p>';
    return;
  }

  // Book Button
  document.getElementById('bookBtn').addEventListener('click', () => {
    window.location.href = '/index.html#bespoke';
  });

  // Star rating input
  const starInput = document.getElementById('starInput');
  let selectedRating = 0;
  starInput?.addEventListener('click', (e) => {
    const star = e.target.closest('.star-btn');
    if (!star) return;
    selectedRating = parseInt(star.dataset.star);
    document.getElementById('reviewRating').value = selectedRating;
    updateStarUI(starInput, selectedRating);
  });
  starInput?.addEventListener('mouseover', (e) => {
    const star = e.target.closest('.star-btn');
    if (!star) return;
    updateStarUI(starInput, parseInt(star.dataset.star));
  });
  starInput?.addEventListener('mouseleave', () => {
    updateStarUI(starInput, selectedRating);
  });

  // Review form submission
  document.getElementById('reviewForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reviewName').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();

    if (!name) { showToast('⚠️ Please enter your name'); return; }
    if (rating < 1) { showToast('⚠️ Please select a rating'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: productId, reviewerName: name, rating, comment })
    })
    .then(res => res.json())
    .then(() => {
      btn.textContent = 'Submit Review';
      btn.disabled = false;
      document.getElementById('reviewForm').reset();
      selectedRating = 0;
      updateStarUI(starInput, 0);
      showToast('⭐ Review submitted! Thank you.');
      loadReviews(productId);
      loadRatingStats(productId);
    })
    .catch(() => {
      btn.textContent = 'Submit Review';
      btn.disabled = false;
      showToast('❌ Failed to submit review');
    });
  });

  // Wishlist button
  document.getElementById('addWishlistBtn')?.addEventListener('click', () => {
    if (!currentProduct) return;
    // Uses the globally available addToWishlist from script.js
    if (typeof addToWishlist === 'function') {
      addToWishlist({
        _id: currentProduct._id,
        title: currentProduct.title,
        price: currentProduct.price,
        imageUrl: currentProduct.imageUrl
      });
    }
  });

  // Fetch Product Details
  fetch(`/api/products/${productId}`)
    .then(res => {
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    })
    .then(product => {
      currentProduct = product;
      document.getElementById('loadingState').classList.add('hidden');
      document.getElementById('productContent').classList.remove('hidden');
      document.getElementById('reviewsSection').classList.remove('hidden');

      document.title = `${product.title} | Suit Club`;

      // Badge
      if (product.badge) {
        const badgeClass = getBadgeClass(product.badge);
        document.getElementById('prodBadge').innerHTML = `<span class="badge-detail ${badgeClass}">${product.badge}</span>`;
      }

      // Populate text
      document.getElementById('prodTitle').textContent = product.title || 'Untitled Suit';
      document.getElementById('prodCategory').textContent = (product.categories || []).map(c => c.name).join(', ');
      document.getElementById('prodPrice').textContent = product.price ? `Rs. ${product.price.toLocaleString()}` : 'Price on Consultation';
      document.getElementById('prodMaterial').textContent = product.materialQuality || 'Premium Blend';
      document.getElementById('prodStyle').textContent = product.style || 'Classic Bespoke';
      document.getElementById('prodDesc').textContent = product.description || 'Experience the finest craftsmanship tailored to your exact measurements.';
      document.getElementById('likeCount').textContent = product.likes || 0;

      // Image Gallery
      const mainImg = document.getElementById('prodImage');
      const allImages = [];
      if (product.imageUrl) allImages.push(product.imageUrl);
      if (product.galleryImages && product.galleryImages.length > 0) {
        product.galleryImages.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
      }
      if (allImages.length === 0) allImages.push('https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');

      mainImg.src = allImages[0];
      mainImg.alt = product.title;

      // Render thumbnails
      if (allImages.length > 1) {
        const thumbRow = document.getElementById('thumbnailRow');
        thumbRow.classList.remove('hidden');
        thumbRow.innerHTML = allImages.map((img, i) => `
          <img src="${img}" alt="View ${i+1}" 
               class="thumb w-16 h-20 object-cover rounded-lg ${i === 0 ? 'active' : ''}" 
               onclick="switchImage('${img}', this)">
        `).join('');
      }

      // Show wishlist header button
      document.getElementById('wishlistBtnProd').classList.remove('hidden');
      document.getElementById('wishlistBtnProd').addEventListener('click', () => {
        document.getElementById('addWishlistBtn').click();
      });

      // Handle Like
      const likeBtn = document.getElementById('likeBtn');
      const likeIcon = document.getElementById('likeIcon');
      const likeCountEl = document.getElementById('likeCount');
      const likedProducts = JSON.parse(localStorage.getItem('likedSuits')) || [];
      if (likedProducts.includes(productId)) {
        likeBtn.disabled = true;
        likeBtn.classList.replace('bg-red-50', 'bg-red-500');
        likeBtn.classList.replace('text-red-500', 'text-white');
        likeIcon.classList.add('text-white');
      }

      likeBtn.addEventListener('click', () => {
        if (likeBtn.disabled) return;
        const currentCount = parseInt(likeCountEl.textContent);
        likeCountEl.textContent = currentCount + 1;
        likeBtn.disabled = true;
        likeBtn.classList.replace('bg-red-50', 'bg-red-500');
        likeBtn.classList.replace('hover:text-red-700', 'hover:text-white');
        likeBtn.classList.replace('text-red-500', 'text-white');
        likeIcon.classList.add('text-white');
        likedProducts.push(productId);
        localStorage.setItem('likedSuits', JSON.stringify(likedProducts));

        fetch(`/api/products/${productId}/like`, { method: 'PUT' })
          .then(res => res.json())
          .then(data => { likeCountEl.textContent = data.likes; })
          .catch(err => console.error('Error liking product:', err));
      });

      // Load reviews and rating
      loadReviews(productId);
      loadRatingStats(productId);

      // Load related suits
      if (product.categories && product.categories.length > 0) {
        const primaryCategory = product.categories[0]._id || product.categories[0];
        loadRelated(primaryCategory, productId);
      }
    })
    .catch(err => {
      console.error('Error loading product:', err);
      document.getElementById('loadingState').innerHTML = '<p class="text-red-500 font-medium text-lg">Error loading product details. Please return home.</p>';
    });
});

// ─── Image Gallery Functions ───────────────────────────────────────────────
function switchImage(src, thumbEl) {
  document.getElementById('prodImage').src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function openLightbox() {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = document.getElementById('prodImage').src;
  lb.classList.add('open');
  lb.style.display = 'flex';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.style.display = 'none';
}

// ─── Star Rating UI ──────────────────────────────────────────────────────────
function updateStarUI(container, rating) {
  if (!container) return;
  container.querySelectorAll('.star-btn').forEach(star => {
    const val = parseInt(star.dataset.star);
    star.classList.toggle('text-gold', val <= rating);
    star.classList.toggle('text-gray-300', val > rating);
  });
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="material-symbols-outlined text-sm ${i <= Math.round(rating) ? 'text-gold' : 'text-gray-300'}">star</span>`;
  }
  return html;
}

// ─── Badge Helpers ───────────────────────────────────────────────────────────
function getBadgeClass(badge) {
  switch (badge) {
    case 'New Arrival': return 'badge-new';
    case 'Bestseller': return 'badge-bestseller';
    case 'Limited Edition': return 'badge-limited';
    case 'Sale': return 'badge-sale';
    default: return '';
  }
}

// ─── Load Reviews ────────────────────────────────────────────────────────────
function loadReviews(productId) {
  fetch(`/api/reviews?productId=${productId}`)
    .then(res => res.json())
    .then(reviews => {
      const container = document.getElementById('reviewsList');
      if (reviews.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No reviews yet. Be the first to share your experience!</p>';
        return;
      }
      container.innerHTML = reviews.map(r => `
        <div class="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="bg-navy text-white flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm">${r.reviewerName.charAt(0).toUpperCase()}</div>
              <div>
                <h4 class="font-bold text-navy text-sm">${r.reviewerName}</h4>
                <p class="text-xs text-gray-400">${new Date(r.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
              </div>
            </div>
            <div class="flex gap-0.5">${renderStars(r.rating)}</div>
          </div>
          ${r.comment ? `<p class="text-gray-600 text-sm">${r.comment}</p>` : ''}
        </div>
      `).join('');
    })
    .catch(err => console.error('Error loading reviews:', err));
}

// ─── Load Rating Stats ──────────────────────────────────────────────────────
function loadRatingStats(productId) {
  fetch(`/api/reviews/stats/${productId}`)
    .then(res => res.json())
    .then(stats => {
      document.getElementById('avgStars').innerHTML = renderStars(stats.avgRating);
      document.getElementById('avgText').textContent = stats.count > 0 ? `${stats.avgRating} out of 5 (${stats.count} review${stats.count !== 1 ? 's' : ''})` : 'No reviews yet';
    })
    .catch(err => console.error('Error loading rating stats:', err));
}

// ─── Load Related Suits ──────────────────────────────────────────────────────
function loadRelated(categoryId, excludeId) {
  fetch(`/api/products?categoryId=${categoryId}`)
    .then(res => res.json())
    .then(products => {
      const related = products.filter(p => p._id !== excludeId).slice(0, 4);
      if (related.length === 0) return;

      document.getElementById('relatedSection').classList.remove('hidden');
      const grid = document.getElementById('relatedGrid');
      grid.innerHTML = related.map(prod => {
        const badgeHTML = prod.badge ? `<span class="badge ${getBadgeClass(prod.badge)}" style="position:absolute;top:8px;left:8px;z-index:5;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;">${prod.badge}</span>` : '';
        return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group cursor-pointer" onclick="window.location.href='/product.html?id=${prod._id}'">
          <div class="aspect-[3/4] overflow-hidden bg-gray-100 relative">
            ${badgeHTML}
            <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-navy flex items-center gap-1 shadow">
              <span class="material-symbols-outlined text-[14px] text-red-500">favorite</span> ${prod.likes || 0}
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-serif text-lg font-bold text-navy mb-1 line-clamp-1">${prod.title}</h3>
            <p class="text-sm text-gray-500">${prod.price ? 'Rs. ' + prod.price.toLocaleString() : 'Price on request'}</p>
          </div>
        </div>
      `;}).join('');
    })
    .catch(err => console.error('Error loading related:', err));
}
