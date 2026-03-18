/**
 * Suit Club — API Mock Layer
 * This script intercepts all fetch calls to "/api/" and handles them using localStorage.
 * This allows the project to run as a static website without a real server or database.
 */

(function() {
    const STORAGE_KEY = 'suitclub_mock_db';
    
    // ─── Default Data ──────────────────────────────────────────────────────────
    const DEFAULT_DATA = {
        categories: [
            { _id: 'c1', name: 'The Executive', description: 'Timeless sophistication for the modern leader.', imageUrl: './assets/20549.jpg' },
            { _id: 'c2', name: 'Wedding Luxe', description: 'Make your day unforgettable with bespoke elegance.', imageUrl: './assets/20541.jpg' },
            { _id: 'c3', name: 'Nepalese Heritage', description: 'Local inspiration, global craftsmanship.', imageUrl: './assets/20547.jpg' },
            { _id: 'c4', name: 'Black Tie', description: 'Command every room in a perfectly tailored tuxedo.', imageUrl: './assets/20543.jpg' },
            { _id: 'c5', name: 'Smart Casual', description: 'Relaxed refinement for weekends and casual gatherings.', imageUrl: './assets/20545.jpg' },
            { _id: 'c6', name: 'Festive Collection', description: 'Vibrant fabrics and rich textures for every celebration.', imageUrl: './assets/20536.jpg' }
        ],
        products: [
            { _id: 'p1', title: 'Midnight Navy Power Suit', price: 45000, categories: ['c1'], imageUrl: './assets/20549.jpg', materialQuality: 'Super 120s Wool', style: 'Peak Lapel', badge: 'Bestseller', likes: 124, createdAt: new Date().toISOString() },
            { _id: 'p2', title: 'Royal Ivory Wedding Sherwani', price: 65000, categories: ['c2'], imageUrl: './assets/20541.jpg', materialQuality: 'Hand-woven Silk', style: 'Mandarin Collar', badge: 'New Arrival', likes: 89, createdAt: new Date().toISOString() },
            { _id: 'p3', title: 'Charcoal Grey Heritage Blazer', price: 28000, categories: ['c3', 'c5'], imageUrl: './assets/20547.jpg', materialQuality: 'Cashmere Blend', style: 'Natural Shoulder', badge: '', likes: 56, createdAt: new Date().toISOString() },
            { _id: 'p4', title: 'Classic Tuxedo (Black Tie)', price: 55000, categories: ['c4'], imageUrl: './assets/20543.jpg', materialQuality: 'VBC Italian Wool', style: 'Shawl Lapel', badge: 'Limited Edition', likes: 210, createdAt: new Date().toISOString() }
        ],
        bookings: [],
        reviews: [
            { _id: 'r1', reviewerName: 'Arun Sharma', rating: 5, comment: 'Exceptional fit and the quality is outstanding!', createdAt: new Date().toISOString() }
        ],
        newsletter: [],
        users: [
            { _id: 'u1', name: 'Admin', email: 'dheerajdhiraj91@gmail.com', password: 'password123', role: 'admin' }
        ],
        wishlist: {} // userId -> array of productIds
    };

    // ─── Local Database Methods ───────────────────────────────────────────────
    function getDB() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
            return DEFAULT_DATA;
        }
        return JSON.parse(stored);
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

    window.fetch = function(url, options = {}) {
        const path = typeof url === 'string' ? url : url.url;
        if (!path.startsWith('/api/')) {
            return originalFetch.apply(this, arguments);
        }

        const method = options.method || 'GET';
        const db = getDB();
        const parts = path.split('/').filter(p => p && p !== 'api'); // e.g., ["products", "123"]
        const resource = parts[0];
        const id = parts[1];

        console.log(`[Mock API] ${method} ${path}`, options.body ? JSON.parse(options.body) : '');

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
                // Handle FormData for files if needed, but here we just take the fields
                const name = options.body.get('name');
                const description = options.body.get('description');
                const imageUrl = options.body.get('manualImageUrl') || './assets/20549.jpg';
                const newCat = { _id: generateId(), name, description, imageUrl };
                db.categories.push(newCat);
                saveDB(db);
                return mockResponse(newCat);
            }
            if (method === 'PUT') {
                const name = options.body.get('name');
                const description = options.body.get('description');
                const imageUrl = options.body.get('manualImageUrl');
                const idx = db.categories.findIndex(c => c._id === id);
                if (idx !== -1) {
                    db.categories[idx] = { ...db.categories[idx], name, description, imageUrl: imageUrl || db.categories[idx].imageUrl };
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
                const urlObj = new URL(path, window.location.origin);
                const categoryId = urlObj.searchParams.get('categoryId');
                let list = db.products;
                if (categoryId) {
                    list = list.filter(p => p.categories.includes(categoryId));
                }
                const populated = list.map(p => ({
                    ...p,
                    categories: p.categories.map(cid => db.categories.find(c => c._id === cid) || { name: 'Unknown' })
                }));
                return mockResponse(populated);
            }
            if (method === 'POST') {
                const title = options.body.get('title');
                const cats = options.body.get('categories').split(',');
                const price = Number(options.body.get('price'));
                const description = options.body.get('description');
                const imageUrl = options.body.get('manualImageUrl') || './assets/20549.jpg';
                const newProd = { _id: generateId(), title, categories: cats, price, description, imageUrl, likes: 0, createdAt: new Date().toISOString() };
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
                 // Simplified update
                 const title = options.body.get('title');
                 const idx = db.products.findIndex(p => p._id === id);
                 if (idx !== -1) {
                     db.products[idx] = { ...db.products[idx], title };
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

        // --- BOOKING ROUTES ---
        if (resource === 'bookings') {
            if (method === 'GET') return mockResponse(db.bookings);
            if (method === 'POST') {
                const data = JSON.parse(options.body);
                const newBooking = { _id: generateId(), ...data, referenceNumber: 'REF-' + Math.floor(Math.random()*100000), createdAt: new Date().toISOString() };
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

    console.log('[Mock API] Interceptor Loaded. Database:', getDB());
})();
