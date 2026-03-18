// collection.js — Collection page with search, sort, filter & badges

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode persistence
  if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark');

  const urlParams = new URLSearchParams(window.location.search);
  const categoryName = urlParams.get('category');
  const categoryIdParam = urlParams.get('id');

  if (!categoryName && !categoryIdParam) {
    document.getElementById('collectionTitle').textContent = 'Collection Not Found';
    document.getElementById('loadingState').innerHTML = '<p class="text-red-500">Invalid link. Please return home.</p>';
    return;
  }

  // Fetch Category Details
  fetch('/api/categories')
    .then(res => res.json())
    .then(categories => {
      const currentCat = categories.find(c =>
        (categoryName && c.name.toLowerCase() === categoryName.toLowerCase()) ||
        (categoryIdParam && c._id === categoryIdParam)
      );

      if (currentCat) {
        document.getElementById('collectionTitle').textContent = currentCat.name;
        document.getElementById('collectionDesc').textContent = currentCat.description || 'Explore our exclusive range for this collection.';
        document.title = `${currentCat.name} | Suit Club`;
        fetchProducts(currentCat._id);
      } else {
        document.getElementById('collectionTitle').textContent = categoryName || 'Collection';
        document.getElementById('loadingState').innerHTML = `<p class="text-gray-500">No category found matching "${categoryName}". <br> Make sure you create this collection in the Admin Dashboard exactly as spelled!</p>`;
      }
    })
    .catch(err => console.error('Error fetching categories:', err));

  // Search, Sort, Filter listeners
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
  const priceRange = document.getElementById('priceRange');
  priceRange?.addEventListener('input', () => {
    document.getElementById('priceLabel').textContent = `Rs. ${Number(priceRange.value).toLocaleString()}`;
    applyFilters();
  });

  function fetchProducts(categoryId) {
    fetch(`/api/products?categoryId=${categoryId}`)
      .then(res => res.json())
      .then(products => {
        allProducts = products;
        const loadEl = document.getElementById('loadingState');
        if (loadEl) loadEl.remove();

        if (products.length === 0) {
          document.getElementById('productsGrid').innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">No suits found in this collection currently. Check back later!</div>';
          return;
        }

        // Set price range max
        const maxPrice = Math.max(...products.filter(p => p.price).map(p => p.price), 100000);
        if (priceRange) { priceRange.max = maxPrice; priceRange.value = maxPrice; document.getElementById('priceLabel').textContent = `Rs. ${maxPrice.toLocaleString()}`; }

        applyFilters();
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        const loadEl = document.getElementById('loadingState');
        if (loadEl) loadEl.remove();
        document.getElementById('productsGrid').innerHTML = '<div class="col-span-full text-center text-red-500">Error loading products.</div>';
      });
  }
});

function applyFilters() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const sortBy = document.getElementById('sortSelect')?.value || 'newest';
  const maxPrice = Number(document.getElementById('priceRange')?.value || 999999999);

  let filtered = allProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm) ||
      (p.materialQuality || '').toLowerCase().includes(searchTerm) ||
      (p.style || '').toLowerCase().includes(searchTerm);
    const matchesPrice = !p.price || p.price <= maxPrice;
    return matchesSearch && matchesPrice;
  });

  // Sort
  switch (sortBy) {
    case 'price-low': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
    case 'price-high': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
    case 'popular': filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
    case 'newest': default: filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
  }

  renderProducts(filtered);
}

function getBadgeClass(badge) {
  switch (badge) {
    case 'New Arrival': return 'badge-new';
    case 'Bestseller': return 'badge-bestseller';
    case 'Limited Edition': return 'badge-limited';
    case 'Sale': return 'badge-sale';
    default: return '';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultCount');

  if (countEl) countEl.textContent = `Showing ${products.length} suit${products.length !== 1 ? 's' : ''}`;

  if (products.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">No suits match your filters. Try adjusting your search.</div>';
    return;
  }

  grid.innerHTML = products.map(prod => {
    const badgeHTML = prod.badge ? `<span class="badge ${getBadgeClass(prod.badge)}">${prod.badge}</span>` : '';
    return `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group flex flex-col cursor-pointer" onclick="window.location.href='/product.html?id=${prod._id}'">
        <div class="aspect-[3/4] overflow-hidden bg-gray-100 relative">
          ${badgeHTML}
          <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" alt="${prod.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
          <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-navy flex items-center gap-1 shadow">
            <span class="material-symbols-outlined text-[14px] text-red-500">favorite</span> ${prod.likes || 0}
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="font-serif text-xl font-bold text-navy mb-1 line-clamp-1">${prod.title}</h3>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">${prod.materialQuality || 'Premium Quality'}</p>
          <div class="mt-auto flex justify-between items-end">
            <span class="font-medium text-gray-900">${prod.price ? 'Rs. ' + prod.price.toLocaleString() : 'Price on request'}</span>
            <span class="text-gold text-sm font-medium group-hover:underline">View Details →</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
