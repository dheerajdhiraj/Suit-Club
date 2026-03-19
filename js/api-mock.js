/**
 * Suit Club — API Mock Layer
 * This script intercepts all fetch calls to "/api/" and handles them using localStorage.
 * This allows the project to run as a static website without a real server or database.
 */

(function () {
    const STORAGE_KEY = 'suitclub_mock_db';

    // ─── Default Data ──────────────────────────────────────────────────────────
    const DEFAULT_DATA = {
        version: 5, // Increment to force reset if needed
        categories: [
            { _id: 'c1', name: 'The Executive', description: 'Timeless sophistication for the modern leader.', imageUrl: './assets/executive.jpg' },
            { _id: 'c2', name: 'Wedding Luxe', description: 'Make your day unforgettable with bespoke elegance.', imageUrl: './assets/nepalease heritage.jpg' },
            { _id: 'c3', name: 'Nepalese Heritage', description: 'Local inspiration, global craftsmanship.', imageUrl: './assets/classic.jpg' },
            { _id: 'c4', name: 'Black Tie', description: 'Command every room in a perfectly tailored tuxedo.', imageUrl: './assets/black tie.png' },
            { _id: 'c5', name: 'Smart Casual', description: 'Relaxed refinement for weekends and casual gatherings.', imageUrl: './assets/dhiraj.jpg' },
            { _id: 'c6', name: 'Festive Collection', description: 'Vibrant fabrics and rich textures for every celebration.', imageUrl: './assets/niraj1.jpg' }
        ],
        products: [
            { _id: 'p1', title: 'Midnight Navy Power Suit', price: 45000, categories: ['c1'], imageUrl: './assets/executive.jpg', materialQuality: 'Super 120s Wool', style: 'Peak Lapel', badge: 'Bestseller', likes: 124, createdAt: new Date().toISOString() },
            { _id: 'p2', title: 'Royal Ivory Sherwani', price: 65000, categories: ['c2'], imageUrl: './assets/nepalease heritage.jpg', materialQuality: 'Hand-woven Silk', style: 'Mandarin Collar', badge: 'New Arrival', likes: 89, createdAt: new Date().toISOString() },
            { _id: 'p3', title: 'Charcoal Grey Heritage Blazer', price: 28000, categories: ['c3', 'c5'], imageUrl: './assets/tradition1.jpg', materialQuality: 'Cashmere Blend', style: 'Natural Shoulder', badge: '', likes: 56, createdAt: new Date().toISOString() },
            { _id: 'p4', title: 'Classic Black Tie Tuxedo', price: 55000, categories: ['c4'], imageUrl: './assets/black tie.png', materialQuality: 'VBC Italian Wool', style: 'Shawl Lapel', badge: 'Limited Edition', likes: 210, createdAt: new Date().toISOString() },
            { _id: 'p5', title: 'Slim Fit Royal Sky Blazer', price: 32000, categories: ['c5'], imageUrl: './assets/slim fit.jpg', materialQuality: 'Linen Blend', style: 'Soft Shoulder', badge: 'Trending', likes: 45, createdAt: new Date().toISOString() },
            { _id: 'p6', title: 'Festive Silk Suit', price: 42000, categories: ['c6'], imageUrl: './assets/tradition2.jpg', materialQuality: 'Raw Silk', style: 'Nehru Jacket', badge: 'New', likes: 32, createdAt: new Date().toISOString() },
            { _id: 'p7', title: 'TAHVO beige suit', price: 55000, categories: ['c5', 'c4', 'c6', 'c2'], imageUrl: './assets/niraj2.jpg', materialQuality: 'Linen Blend', style: 'Solid Slim Fit peaked lapel double-breasted blazer', badge: 'Bestseller', likes: 124, createdAt: new Date().toISOString() },
            { _id: 'p8', title: 'Blazer', price: 5000, categories: ['c1', 'c5', 'c6', 'c4'], imageUrl: './assets/product1.jpg', materialQuality: 'woolsilk blend', style: 'The Blazer has soft, natural shoulders and slim-fit silhouette', badge: 'Bestseller', likes: 300, createdAt: new Date().toISOString() },
            { _id: 'p9', title: 'Slim-fit Blazer', price: 55000, categories: ['c5', 'c4', 'c6', 'c1'], imageUrl: './assets/executive2.jpg', materialQuality: 'Siyaram clothing', style: 'Notched lapel and a single-breasted two-button closure to mimic the tailor silhouette', badge: 'Trending', likes: 201, createdAt: new Date().toISOString() },
            { _id: 'p10', title: 'Slim-fit Blazer (Dhiraj)', price: 55000, categories: ['c5', 'c4', 'c6', 'c1'], imageUrl: './assets/dhiraj2.jpg', materialQuality: 'Siyaram clothing', style: 'Notched lapel and a single-breasted two-button closure', badge: 'Trending', likes: 201, createdAt: new Date().toISOString() },
            { _id: 'p11', title: 'Festive Silk Luxe Suit', price: 42000, categories: ['c6'], imageUrl: './assets/tradition2.jpg', materialQuality: 'Raw Silk', style: 'Nehru Jacket', badge: 'New', likes: 32, createdAt: new Date().toISOString() }
        ],
        bookings: [],
        reviews: [
            { _id: 'r1', reviewerName: 'Arun Sharma', rating: 5, comment: 'Exceptional fit and the quality is outstanding!', createdAt: new Date().toISOString() }
        ],
        newsletter: [],
        users: [
            { _id: 'u1', name: 'Admin', email: 'dheerajdhiraj91@gmail.com', password: 'password123', role: 'admin' }
        ],
        wishlist: {},
        cart: [],
        orders: []
    };

    // ─── Local Database Methods ───────────────────────────────────────────────
    function getDB() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
        let db = JSON.parse(stored);

        // Force reset if version is outdated (ensure every user sees the new catalog)
        if (db.version !== DEFAULT_DATA.version) {
            console.log("Mock DB version mismatch, resetting to DEFAULT_DATA...");
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }

        // Ensure new fields exist for backward compatibility
        if (!db.cart) db.cart = [];
        if (!db.orders) db.orders = [];
        return db;
    }

    function saveDB(db) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // ─── API Response Helper ──────────────────────────────────────────────────
    function mockResponse(data, status = 200) {
        return Promise.resolve({
            ok: status >= 200 && status < 300,
            status: status,
            json: () => Promise.resolve(data)
        });
    }

    // ─── Fetch Interception ───────────────────────────────────────────────────
    const originalFetch = window.fetch;

    window.fetch = function (urlInput, options = {}) {
        const urlStr = typeof urlInput === 'string' ? urlInput : urlInput.url;
        const urlObj = new URL(urlStr, window.location.origin);
        const path = urlObj.pathname;
        const search = urlObj.searchParams;

        if (!path.startsWith('/api/')) {
            return originalFetch.apply(this, arguments);
        }

        const method = options.method || 'GET';
        const db = getDB();

        // Split path to find resource, e.g., /api/products/123 -> ["products", "123"]
        const parts = path.split('/').filter(p => p && p !== 'api');
        const resource = parts[0];
        const id = parts[1];

        console.log(`[Mock API] ${method} ${path}${urlObj.search}`, options.body instanceof FormData ? 'FormData Payload' : options.body);

        // --- AUTH ROUTES ---
        if (resource === 'auth') {
            const sub = parts[1];
            if (sub === 'login') {
                const { email, username, password } = JSON.parse(options.body);
                const user = db.users.find(u => (u.email === email || u.name === username) && u.password === (password || 'password123'));
                if (user) {
                    return mockResponse({ token: 'mock-jwt-token', ...user });
                }
                return mockResponse({ message: 'Invalid credentials' }, 401);
            }
            if (sub === 'register') {
                const { name, email, password } = JSON.parse(options.body);
                const newUser = { _id: generateId(), name, email, password, role: 'user' };
                db.users.push(newUser);
                saveDB(db);
                return mockResponse({ token: 'mock-jwt-token', ...newUser });
            }
            if (sub === 'me' && options.headers?.['x-auth-token']) {
                return mockResponse(db.users[0]); // Return the first user for simplicity
            }
        }

        // --- CATEGORY ROUTES ---
        if (resource === 'categories') {
            if (method === 'GET') {
                return mockResponse(db.categories);
            }
            if (method === 'POST') {
                const name = options.body.get('name');
                const description = options.body.get('description');
                const fileMain = options.body.get('image');
                const manualImg = options.body.get('manualImageUrl');

                let imageUrl = manualImg || './assets/executive.jpg';
                if (fileMain && fileMain.name) imageUrl = `./assets/${fileMain.name}`;

                const newCat = { _id: generateId(), name, description, imageUrl };
                db.categories.push(newCat);
                saveDB(db);
                return mockResponse(newCat);
            }
            if (method === 'PUT') {
                const name = options.body.get('name');
                const description = options.body.get('description');
                const fileMain = options.body.get('image');
                const manualImg = options.body.get('manualImageUrl');

                const idx = db.categories.findIndex(c => c._id === id);
                if (idx !== -1) {
                    let imageUrl = manualImg || db.categories[idx].imageUrl;
                    if (fileMain && fileMain.name) imageUrl = `./assets/${fileMain.name}`;

                    db.categories[idx] = { ...db.categories[idx], name, description, imageUrl };
                    saveDB(db);
                    return mockResponse(db.categories[idx]);
                }
            }
            if (method === 'DELETE') {
                db.categories = db.categories.filter(c => c._id !== id);
                saveDB(db);
                return mockResponse({ message: 'Removed' });
            }
        }

        // --- PRODUCT ROUTES ---
        if (resource === 'products') {
            if (method === 'GET') {
                if (id) { // Single product
                    const prod = db.products.find(p => p._id === id);
                    if (prod) {
                        const populated = { ...prod, categories: prod.categories.map(cid => db.categories.find(c => c._id === cid) || { name: 'Unknown' }) };
                        return mockResponse(populated);
                    }
                    return mockResponse({ message: 'Not found' }, 404);
                }
                // Filtered or all
                const categoryId = search.get('categoryId');
                let list = db.products;
                if (categoryId) {
                    list = list.filter(p => p.categories && p.categories.includes(categoryId));
                }
                const populated = list.map(p => ({
                    ...p,
                    categories: (p.categories || []).map(cid => db.categories.find(c => c._id === cid) || { name: 'Unknown' })
                }));
                return mockResponse(populated);
            }
            if (method === 'POST') {
                const title = options.body.get('title');
                const catsRaw = options.body.get('categories') || '';
                const cats = catsRaw.split(',').map(c => c.trim()).filter(c => c);
                const price = Number(options.body.get('price'));
                const description = options.body.get('description');
                const style = options.body.get('style');
                const materialQuality = options.body.get('materialQuality');
                const badge = options.body.get('badge');

                const fileMain = options.body.get('image');
                const manualImg = options.body.get('manualImageUrl');
                let imageUrl = manualImg || './assets/classic.jpg';
                if (fileMain && fileMain.name) imageUrl = `./assets/${fileMain.name}`;

                const newProd = {
                    _id: generateId(),
                    title,
                    categories: cats,
                    price,
                    description,
                    style,
                    materialQuality,
                    badge,
                    imageUrl,
                    likes: 0,
                    createdAt: new Date().toISOString()
                };
                db.products.push(newProd);
                saveDB(db);
                return mockResponse(newProd);
            }
            if (method === 'PUT' && path.endsWith('/like')) {
                const pid = path.split('/')[2];
                const idx = db.products.findIndex(p => p._id === pid);
                if (idx !== -1) {
                    db.products[idx].likes = (db.products[idx].likes || 0) + 1;
                    saveDB(db);
                    return mockResponse({ likes: db.products[idx].likes });
                }
            }
            if (method === 'PUT') {
                // Expanded update to handle all fields
                const title = options.body.get('title');
                const cats = options.body.get('categories')?.split(',');
                const price = Number(options.body.get('price'));
                const description = options.body.get('description');
                const style = options.body.get('style');
                const materialQuality = options.body.get('materialQuality');
                const badge = options.body.get('badge');
                const manualImg = options.body.get('manualImageUrl');

                const idx = db.products.findIndex(p => p._id === id);
                if (idx !== -1) {
                    db.products[idx] = {
                        ...db.products[idx],
                        title: title || db.products[idx].title,
                        categories: cats || db.products[idx].categories,
                        price: price || db.products[idx].price,
                        description: description || db.products[idx].description,
                        style: style || db.products[idx].style,
                        materialQuality: materialQuality || db.products[idx].materialQuality,
                        badge: badge !== undefined ? badge : db.products[idx].badge,
                        imageUrl: manualImg || db.products[idx].imageUrl
                    };
                    saveDB(db);
                    return mockResponse(db.products[idx]);
                }
            }
            if (method === 'DELETE') {
                db.products = db.products.filter(p => p._id !== id);
                saveDB(db);
                return mockResponse({ message: 'Removed' });
            }
        }

        // --- CART ROUTES ---
        if (resource === 'cart') {
            if (method === 'GET') return mockResponse(db.cart);
            if (method === 'POST') {
                const item = JSON.parse(options.body);
                const existing = db.cart.find(c => c.productId === item.productId);
                if (existing) {
                    existing.quantity += (item.quantity || 1);
                } else {
                    db.cart.push({ ...item, quantity: item.quantity || 1, _id: generateId() });
                }
                saveDB(db);
                return mockResponse(db.cart);
            }
            if (method === 'PUT') {
                const { quantity } = JSON.parse(options.body);
                const idx = db.cart.findIndex(c => c._id === id);
                if (idx !== -1) {
                    db.cart[idx].quantity = quantity;
                    if (quantity <= 0) db.cart.splice(idx, 1);
                    saveDB(db);
                    return mockResponse(db.cart);
                }
            }
            if (method === 'DELETE') {
                if (id) {
                    db.cart = db.cart.filter(c => c._id !== id);
                } else {
                    db.cart = [];
                }
                saveDB(db);
                return mockResponse({ message: 'Cart updated' });
            }
        }

        // --- ORDERS ---
        if (resource === 'orders') {
            if (method === 'GET') return mockResponse(db.orders);
            if (method === 'DELETE') {
                db.orders = db.orders.filter(o => o._id !== id);
                saveDB(db);
                return mockResponse({ message: 'Deleted' });
            }
        }

        // --- CHECKOUT ROUTE ---
        if (resource === 'checkout') {
            if (method === 'POST') {
                const customerDetails = JSON.parse(options.body);
                const order = {
                    _id: 'ORD-' + Math.floor(Math.random() * 1000000),
                    customer: customerDetails,
                    items: [...db.cart],
                    total: db.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    status: 'Pending',
                    createdAt: new Date().toISOString()
                };
                db.orders.push(order);
                db.cart = []; // Clear cart after checkout
                saveDB(db);
                return mockResponse(order);
            }
        }

        // --- BOOKING ROUTES ---
        if (resource === 'bookings') {
            if (method === 'GET') return mockResponse(db.bookings);
            if (method === 'POST') {
                const data = JSON.parse(options.body);
                const newBooking = { _id: generateId(), ...data, referenceNumber: 'REF-' + Math.floor(Math.random() * 100000), createdAt: new Date().toISOString() };
                db.bookings.push(newBooking);
                saveDB(db);
                return mockResponse(newBooking);
            }
            if (method === 'DELETE') {
                db.bookings = db.bookings.filter(b => b._id !== id);
                saveDB(db);
                return mockResponse({ message: 'Deleted' });
            }
        }

        // --- REVIEW ROUTES ---
        if (resource === 'reviews') {
            if (method === 'GET') return mockResponse(db.reviews);
            if (method === 'POST') {
                const data = JSON.parse(options.body);
                const newReview = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
                db.reviews.push(newReview);
                saveDB(db);
                return mockResponse(newReview);
            }
            if (method === 'DELETE') {
                db.reviews = db.reviews.filter(r => r._id !== id);
                saveDB(db);
                return mockResponse({ message: 'Deleted' });
            }
            // Stats summary for a product
            if (parts[1] === 'stats') {
                const pid = parts[2];
                const prodReviews = db.reviews.filter(r => r.product === pid);
                const count = prodReviews.length;
                const avg = count > 0 ? (prodReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) : 0;
                return mockResponse({ count, avgRating: avg });
            }
        }

        // --- USER / WISHLIST ---
        if (resource === 'user') {
            if (parts[1] === 'wishlist') {
                if (method === 'GET') return mockResponse([]); // Simplified
                if (method === 'POST') return mockResponse({ message: 'Added' });
            }
        }

        // --- NEWSLETTER ---
        if (resource === 'newsletter') {
            if (method === 'GET') return mockResponse(db.newsletter);
            if (method === 'POST') {
                const data = JSON.parse(options.body);
                const newSub = { _id: generateId(), email: data.email, createdAt: new Date().toISOString() };
                db.newsletter.push(newSub);
                saveDB(db);
                return mockResponse({ message: 'Subscribed' });
            }
        }

        return mockResponse({ message: 'Mock route not implemented' }, 404);
    };

    // --- DEPLOYMENT HELPER ---
    // If you add suits/collections via the dashboard, they only save in YOUR browser.
    // To make them visible to everyone on GitHub:
    // 1. Run 'exportData()' in your browser console.
    // 2. Copy the JSON.
    // 3. Paste it over 'DEFAULT_DATA' at the top of this file.
    window.exportData = function () {
        const db = getDB();
        console.log("--- START COPYING FROM HERE ---");
        console.log(JSON.stringify(db, null, 2));
        console.log("--- END COPYING ---");
        alert("Data JSON printed to console. Copy it and paste it into DEFAULT_DATA at the top of api-mock.js!");
    };

    console.log('[Mock API] Interceptor Loaded. Run exportData() to sync with GitHub.');
})();
