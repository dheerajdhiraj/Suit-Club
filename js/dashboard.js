// dashboard.js

let token = 'firebase-auth';

// Authorization check on load (Firebase)
auth.onAuthStateChanged((user) => {
    if (user) {
        // Display admin name
        document.getElementById('adminNameDisplay').textContent = user.email || 'Suit Club Admin';
        // We can update the token with something more specific if needed
        token = user.uid; 
        
        // Fetch initial data only after auth is confirmed
        fetchCategories();
        fetchProducts();
    } else {
        // Not logged in
        window.location.href = 'admin.html';
    }
});

// Tab switching logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active', 'bg-gold/10'));

    document.getElementById(tabId).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active', 'bg-gold/10');
        }
    });

    // Fetch data based on tab
    if (tabId === 'bookings') fetchBookings();
    if (tabId === 'reviews') fetchReviews();
    if (tabId === 'newsletter') fetchNewsletter();
    if (tabId === 'orders') fetchOrders();
}

async function logout() {
    try {
        await auth.signOut();
        localStorage.removeItem('adminToken'); // Clean up old mock data just in case
        localStorage.removeItem('adminUser');
        window.location.href = 'admin.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to sign out.');
    }
}

// Modal handling
function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Notification Alert
function showAlert(message, type = 'success') {
    const box = document.getElementById('notificationArea');
    const msg = document.getElementById('notifMessage');
    const icon = document.getElementById('notifIcon');

    box.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'bg-red-50', 'text-red-800');

    if (type === 'success') {
        box.classList.add('bg-green-50', 'text-green-800');
        icon.textContent = 'check_circle';
    } else {
        box.classList.add('bg-red-50', 'text-red-800');
        icon.textContent = 'error';
    }

    msg.textContent = message;
    setTimeout(() => box.classList.add('hidden'), 4000);
}

// Global cache
let _allCategories = [];

// ─── Fetch & Render ───────────────────────────────────────────────────────────

async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        _allCategories = categories;

        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';

        // Populate category dropdowns
        ['prodCategory', 'editProdCategory'].forEach(selId => {
            const select = document.getElementById(selId);
            if (!select) return;
            select.innerHTML = '';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat._id;
                opt.textContent = cat.name;
                select.appendChild(opt);
            });
        });

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-12 text-gray-400 italic">No collections yet.</td></tr>';
            return;
        }

        categories.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-4 px-6">
                    <img src="${cat.imageUrl || './assets/20549.jpg'}" class="w-14 h-14 object-cover rounded-xl shadow-sm bg-gray-100">
                </td>
                <td class="py-4 px-6 font-bold text-navy">${cat.name}</td>
                <td class="py-4 px-6 text-gray-500 text-sm max-w-xs truncate">${cat.description || '<em class="text-gray-300">No description</em>'}</td>
                <td class="py-4 px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="editCategory('${cat._id}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="deleteCategory('${cat._id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-gray-400 italic">No suits in inventory.</td></tr>';
            return;
        }

        products.forEach(prod => {
            const badgeHTML = prod.badge ? `<span class="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-2 ${prod.badge === 'New Arrival' ? 'bg-green-100 text-green-700' : prod.badge === 'Bestseller' ? 'bg-gold/20 text-gold' : 'bg-red-100 text-red-700'}">${prod.badge}</span>` : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-4 px-6">
                    <img src="${prod.imageUrl || './assets/20547.jpg'}" class="w-14 h-18 object-cover rounded shadow-sm bg-gray-100">
                </td>
                <td class="py-4 px-6 font-bold text-navy">${prod.title}${badgeHTML}</td>
                <td class="py-4 px-6">
                    <div class="flex flex-wrap gap-1">
                        ${(prod.categories || []).map(cat => `<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">${cat.name || 'N/A'}</span>`).join('')}
                    </div>
                </td>
                <td class="py-4 px-6 font-medium text-navy">${prod.price ? 'Rs. ' + prod.price.toLocaleString() : '-'}</td>
                <td class="py-4 px-6 text-gray-500 text-sm italic">${prod.materialQuality || '-'}</td>
                <td class="py-4 px-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="editProduct('${prod._id}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="deleteProduct('${prod._id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

async function fetchBookings() {
    try {
        const res = await fetch('/api/bookings', { headers: { 'x-auth-token': token } });
        const bookings = await res.json();
        const tbody = document.getElementById('bookingsTableBody');
        tbody.innerHTML = '';

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-gray-400 italic">No appointments booked yet.</td></tr>';
            return;
        }

        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-4 px-6">
                    <p class="font-bold text-navy">${b.fullName}</p>
                    <p class="text-xs text-gray-500">Ref: ${b.referenceNumber || '-'}</p>
                </td>
                <td class="py-4 px-6 text-sm">
                    <p>${b.email}</p>
                    <p class="text-gray-500">${b.phone}</p>
                </td>
                <td class="py-4 px-6 text-sm">
                    <p class="font-medium">${new Date(b.bookingDate).toLocaleDateString()}</p>
                    <p class="text-gold font-bold">${b.timeSlot || 'Anytime'}</p>
                </td>
                <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Confirmed</span>
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick="deleteBooking('${b._id}')" class="p-2 text-red-400 hover:text-red-600 transition">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

async function fetchReviews() {
    try {
        const res = await fetch('/api/reviews');
        const reviews = await res.json();
        const grid = document.getElementById('reviewsGrid');
        grid.innerHTML = '';

        if (reviews.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400 italic">No reviews submitted yet.</div>';
            return;
        }

        reviews.forEach(r => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative group';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-bold text-navy">${r.reviewerName}</h4>
                        <p class="text-[10px] text-gray-400 uppercase tracking-widest">${new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="flex text-gold">
                        ${Array(5).fill().map((_, i) => `<span class="material-symbols-outlined text-[16px]">${i < r.rating ? 'star' : 'star_outline'}</span>`).join('')}
                    </div>
                </div>
                <p class="text-sm text-gray-600 italic leading-relaxed">"${r.comment || 'No comment provided'}"</p>
                <div class="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span class="text-[10px] font-bold text-gray-400">ID: ${r._id.slice(-6)}</span>
                    <button onclick="deleteReview('${r._id}')" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

async function fetchNewsletter() {
    try {
        const res = await fetch('/api/newsletter', { headers: { 'x-auth-token': token } });
        const subs = await res.json();
        const tbody = document.getElementById('newsletterTableBody');
        tbody.innerHTML = '';

        if (subs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-12 text-gray-400 italic">No subscribers yet.</td></tr>';
            return;
        }

        subs.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-4 px-6 font-medium text-navy">${s.email}</td>
                <td class="py-4 px-6 text-sm text-gray-500">${new Date(s.createdAt).toLocaleDateString()}</td>
                <td class="py-4 px-6 text-right">
                    <button onclick="deleteNewsletter('${s._id}')" class="text-red-400 hover:text-red-600 transition">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

async function fetchOrders() {
    try {
        const res = await fetch('/api/orders', { headers: { 'x-auth-token': token } });
        const orders = await res.json();
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-gray-400 italic">No orders recorded yet.</td></tr>';
            return;
        }

        orders.forEach(o => {
            const itemsList = (o.items || []).map(i => `<div class="text-[10px]"><span class="font-bold">${i.quantity}x</span> ${i.title}</div>`).join('');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-4 px-6 text-xs font-mono text-gray-400">#${o._id.slice(-8)}</td>
                <td class="py-4 px-6">
                    <p class="font-bold text-navy text-sm">${o.customer?.fName} ${o.customer?.lName}</p>
                    <p class="text-[10px] text-gray-500">${o.customer?.email}</p>
                </td>
                <td class="py-4 px-6">${itemsList}</td>
                <td class="py-4 px-6 font-bold text-navy">Rs. ${o.total?.toLocaleString()}</td>
                <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">${o.status || 'Pending'}</span>
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick="deleteOrder('${o._id}')" class="text-red-400 hover:text-red-600 transition">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}

async function deleteOrder(id) {
    if (!confirm('Delete this order record?')) return;
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Order record removed'); fetchOrders(); }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function deleteBooking(id) {
    if (!confirm('Cancel this appointment?')) return;
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Booking removed'); fetchBookings(); }
}

async function deleteReview(id) {
    if (!confirm('Delete this customer review?')) return;
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Review deleted'); fetchReviews(); }
}

async function deleteNewsletter(id) {
    if (!confirm('Remove this subscriber?')) return;
    const res = await fetch(`/api/newsletter/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Subscriber removed'); fetchNewsletter(); }
}

// ─── Category Handlers ────────────────────────────────────────────────────────

function editCategory(id) {
    const cat = _allCategories.find(c => c._id === id);
    if (!cat) return;
    document.getElementById('editCatId').value = cat._id;
    document.getElementById('editCatName').value = cat.name;
    document.getElementById('editCatDesc').value = cat.description || '';
    openModal('editCategoryModal');
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value;
    const desc = document.getElementById('catDesc').value;
    const manualImg = document.getElementById('catManualImage')?.value;
    const fileImg = document.getElementById('catImage').files[0];

    if (!name) return showAlert('Category name is required', 'error');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', desc);
    if (fileImg) formData.append('image', fileImg);
    if (manualImg) formData.append('manualImageUrl', manualImg);

    const res = await fetch('/api/categories', { 
        method: 'POST', 
        headers: { 'x-auth-token': token }, 
        body: formData 
    });
    if (res.ok) { 
        showAlert('Collection created'); 
        closeModal('categoryModal'); 
        fetchCategories(); 
        e.target.reset(); 
    } else {
        const error = await res.json();
        showAlert(error.message || 'Error creating collection', 'error');
    }
});

document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editCatId').value;
    const name = document.getElementById('editCatName').value;
    const desc = document.getElementById('editCatDesc').value;
    const manualImg = document.getElementById('editCatManualImage')?.value;
    const fileImg = document.getElementById('editCatImage').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', desc);
    if (fileImg) formData.append('image', fileImg);
    if (manualImg) formData.append('manualImageUrl', manualImg);

    const res = await fetch(`/api/categories/${id}`, { 
        method: 'PUT', 
        headers: { 'x-auth-token': token }, 
        body: formData 
    });
    if (res.ok) { 
        showAlert('Collection updated'); 
        closeModal('editCategoryModal'); 
        fetchCategories(); 
    } else {
        const error = await res.json();
        showAlert(error.message || 'Error updating collection', 'error');
    }
});

async function deleteCategory(id) {
    if (!confirm('Delete this collection?')) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Collection removed'); fetchCategories(); fetchProducts(); }
}

// ─── Product Handlers ─────────────────────────────────────────────────────────

let _imagesToRemove = [];

async function editProduct(id) {
    const res = await fetch(`/api/products/${id}`);
    const prod = await res.json();
    _imagesToRemove = [];

    document.getElementById('editProdId').value = prod._id;
    document.getElementById('editProdTitle').value = prod.title;
    document.getElementById('editProdPrice').value = prod.price || '';
    document.getElementById('editProdStyle').value = prod.style || '';
    document.getElementById('editProdMaterial').value = prod.materialQuality || '';
    document.getElementById('editProdBadge').value = prod.badge || '';
    document.getElementById('editProdDesc').value = prod.description || '';

    // Categories
    const sel = document.getElementById('editProdCategory');
    const ids = (prod.categories || []).map(c => c._id || c);
    Array.from(sel.options).forEach(opt => opt.selected = ids.includes(opt.value));

    // Gallery Preview
    const preview = document.getElementById('editGalleryPreview');
    preview.innerHTML = '';
    (prod.galleryImages || []).forEach(img => {
        const div = document.createElement('div');
        div.className = 'relative w-16 h-20 group';
        div.innerHTML = `
            <img src="${img}" class="w-full h-full object-cover rounded-lg border">
            <button type="button" onclick="markImageForRemoval('${img}', this)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center">
                <span class="material-symbols-outlined text-[10px]">close</span>
            </button>
        `;
        preview.appendChild(div);
    });

    openModal('editProductModal');
}

function markImageForRemoval(url, btn) {
    _imagesToRemove.push(url);
    btn.parentElement.classList.add('opacity-30', 'grayscale');
    btn.remove();
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('prodTitle').value;
    const cats = Array.from(document.getElementById('prodCategory').selectedOptions).map(o => o.value);
    const price = document.getElementById('prodPrice').value;
    const desc = document.getElementById('prodDesc').value;
    const manualMain = document.getElementById('prodManualImage')?.value;
    const fileMain = document.getElementById('prodImage').files[0];

    if (!title || cats.length === 0) {
        return showAlert('Title and at least one category are required', 'error');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('categories', cats.join(','));
    formData.append('price', price);
    formData.append('description', desc);
    formData.append('style', document.getElementById('prodStyle').value);
    formData.append('materialQuality', document.getElementById('prodMaterial').value);
    formData.append('badge', document.getElementById('prodBadge').value);
    
    if (fileMain) formData.append('image', fileMain);
    if (manualMain) formData.append('manualImageUrl', manualMain);

    const gallery = document.getElementById('prodGallery').files;
    for (let i = 0; i < gallery.length; i++) {
        formData.append('galleryImages', gallery[i]);
    }
    const manualGallery = document.getElementById('prodManualGallery')?.value;
    if (manualGallery) formData.append('manualGalleryImages', manualGallery);

    const res = await fetch('/api/products', { 
        method: 'POST', 
        headers: { 'x-auth-token': token }, 
        body: formData 
    });
    if (res.ok) { 
        showAlert('Suit added to inventory'); 
        closeModal('productModal'); 
        fetchProducts(); 
        e.target.reset(); 
    } else {
        const error = await res.json();
        showAlert(error.message || 'Error adding suit', 'error');
    }
});

document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editProdId').value;
    const title = document.getElementById('editProdTitle').value;
    const cats = Array.from(document.getElementById('editProdCategory').selectedOptions).map(o => o.value);
    const price = document.getElementById('editProdPrice').value;
    const desc = document.getElementById('editProdDesc').value;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('categories', cats.join(','));
    formData.append('price', price);
    formData.append('description', desc);
    formData.append('style', document.getElementById('editProdStyle').value);
    formData.append('materialQuality', document.getElementById('editProdMaterial').value);
    formData.append('badge', document.getElementById('editProdBadge').value);
    
    const fileMain = document.getElementById('editProdImage').files[0];
    if (fileMain) formData.append('image', fileMain);
    const manualMain = document.getElementById('editProdManualImage')?.value;
    if (manualMain) formData.append('manualImageUrl', manualMain);

    const gallery = document.getElementById('editProdGallery').files;
    for (let i = 0; i < gallery.length; i++) {
        formData.append('galleryImages', gallery[i]);
    }
    const manualGallery = document.getElementById('editProdManualGallery')?.value;
    if (manualGallery) formData.append('manualGalleryImages', manualGallery);

    _imagesToRemove.forEach(img => formData.append('removeImages', img));

    const res = await fetch(`/api/products/${id}`, { 
        method: 'PUT', 
        headers: { 'x-auth-token': token }, 
        body: formData 
    });
    if (res.ok) { 
        showAlert('Suit details updated'); 
        closeModal('editProductModal'); 
        fetchProducts(); 
    } else {
        const error = await res.json();
        showAlert(error.message || 'Error updating suit', 'error');
    }
});

async function deleteProduct(id) {
    if (!confirm('Remove this suit from inventory?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
    if (res.ok) { showAlert('Suit removed'); fetchProducts(); }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

// Initialization is handled by onAuthStateChanged for security/sync
