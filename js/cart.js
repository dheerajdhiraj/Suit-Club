// cart.js — Shopping bag logic for Suit Club

function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });
});

async function loadCart() {
    try {
        const res = await fetch('/api/cart');
        const items = await res.json();
        renderCart(items);
    } catch (err) {
        console.error('Error loading cart:', err);
    }
}

function renderCart(items) {
    const list = document.getElementById('cartItemsList');
    const empty = document.getElementById('emptyCart');
    const content = document.getElementById('cartContent');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (items.length === 0) {
        content.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    content.classList.remove('hidden');
    empty.classList.add('hidden');

    let total = 0;
    list.innerHTML = items.map(item => {
        total += (item.price * item.quantity);
        return `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center group">
                <div class="w-24 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src="${item.imageUrl || './assets/20549.jpg'}" alt="${item.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-navy text-lg line-clamp-1">${item.title}</h3>
                    <p class="text-sm text-gray-500 mb-3">Unit Price: Rs. ${item.price.toLocaleString()}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border">
                            <button onclick="updateQty('${item._id}', ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition text-gray-500">-</button>
                            <span class="font-bold text-navy w-6 text-center">${item.quantity}</span>
                            <button onclick="updateQty('${item._id}', ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition text-gray-500">+</button>
                        </div>
                        <button onclick="removeItem('${item._id}')" class="text-red-400 hover:text-red-600 transition p-2">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
                <div class="text-right pl-4">
                    <p class="text-lg font-bold text-navy">Rs. ${(item.price * item.quantity).toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');

    subtotalEl.textContent = `Rs. ${total.toLocaleString()}`;
    totalEl.textContent = `Rs. ${total.toLocaleString()}`;
}

async function updateQty(id, newQty) {
    if (newQty < 1) {
        if (!confirm('Remove this item from your bag?')) return;
        removeItem(id);
        return;
    }

    try {
        const res = await fetch(`/api/cart/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQty })
        });
        const items = await res.json();
        renderCart(items);
    } catch (err) {
        console.error('Error updating quantity:', err);
        showToast('❌ Failed to update quantity');
    }
}

async function removeItem(id) {
    try {
        await fetch(`/api/cart/${id}`, { method: 'DELETE' });
        loadCart();
        showToast('🗑️ Item removed');
    } catch (err) {
        console.error('Error removing item:', err);
    }
}
