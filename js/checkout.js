// checkout.js — Checkout logic for Suit Club

function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutSummary();

    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        placeOrder();
    });
});

async function loadCheckoutSummary() {
    try {
        const res = await fetch('/api/cart');
        const items = await res.json();
        
        if (items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        renderSummary(items);
    } catch (err) {
        console.error('Error loading summary:', err);
    }
}

function renderSummary(items) {
    const list = document.getElementById('summaryItems');
    const subtotalEl = document.getElementById('summarySubtotal');
    const totalEl = document.getElementById('summaryTotal');
    const btnTotalEl = document.getElementById('btnTotal');

    let total = 0;
    list.innerHTML = items.map(item => {
        total += (item.price * item.quantity);
        return `
            <div class="flex gap-4 items-center">
                <div class="w-12 h-16 rounded overflow-hidden bg-gray-50 flex-shrink-0 border">
                    <img src="${item.imageUrl || './assets/20549.jpg'}" alt="${item.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 text-sm">
                    <h4 class="font-bold text-navy line-clamp-1">${item.title}</h4>
                    <p class="text-gray-500">Qty: ${item.quantity}</p>
                </div>
                <div class="text-sm font-bold text-navy">
                    Rs. ${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `;
    }).join('');

    subtotalEl.textContent = `Rs. ${total.toLocaleString()}`;
    totalEl.textContent = `Rs. ${total.toLocaleString()}`;
    btnTotalEl.textContent = total.toLocaleString();
}

async function placeOrder() {
    const btn = document.getElementById('placeOrderBtn');
    const originalContent = btn.innerHTML;
    
    const customer = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-2xl">sync</span> Processing...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });

        if (res.ok) {
            const order = await res.json();
            showSuccess(order);
        } else {
            throw new Error('Failed to place order');
        }
    } catch (err) {
        console.error('Error placing order:', err);
        showToast('❌ Order failed. Please try again.');
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

function showSuccess(order) {
    document.getElementById('checkoutGrid').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');
    document.getElementById('orderId').textContent = order._id;
    
    // Clear cart badge if exists
    if (typeof updateCartBadge === 'function') updateCartBadge();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
