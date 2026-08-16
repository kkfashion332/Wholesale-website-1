// Firebase SDKs को सीधा CDN से इंपोर्ट कर रहे हैं (अब Python बैकएंड की कोई ज़रूरत नहीं)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// तेरी Firebase Config (वेब वाली)
const firebaseConfig = {
  apiKey: "AIzaSyAHrl_w4Ms66T5ynVFDtUrvHUHrVN3TNf4",
  authDomain: "wholesale-1-f7184.firebaseapp.com",
  databaseURL: "https://wholesale-1-f7184-default-rtdb.firebaseio.com",
  projectId: "wholesale-1-f7184",
  storageBucket: "wholesale-1-f7184.firebasestorage.app",
  messagingSenderId: "637054398569",
  appId: "1:637054398569:web:d575744fe2fb5bad4872f8"
};

// Firebase Initialize करना
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentBannerIndex = 0;
// Banners का डमी डेटा
const bannersList = [
    {"image_url": "https://via.placeholder.com/400x200?text=Welcome+to+KK+Fashion"},
    {"image_url": "https://via.placeholder.com/400x200?text=Mega+Discount+on+Mens+Apparel"}
];

window.onload = () => {
    // 3 Second बाद लोडर हटाना और मेन कंटेंट दिखाना
    setTimeout(() => {
        document.getElementById('loader-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            
            // स्क्रीन दिखते ही एडमिन पैनल का UI अपने आप जनरेट करना
            createAdminPanel();
            
            // बैनर और डेटाबेस से डेटा लाना शुरू करना
            renderBanners(bannersList);
            fetchDataFromFirebase(); 
        }, 500);
    }, 3000);
};

// ==========================================
// 1. DATA FETCHING LOGIC (Firebase Realtime)
// ==========================================

function fetchDataFromFirebase() {
    const productsRef = ref(db, 'products');
    
    // onValue का फायदा: डेटाबेस में कुछ भी चेंज होगा तो वेबसाइट रीलोड किये बिना अपडेट हो जाएगी
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        const products = [];
        if (data) {
            for (let key in data) {
                products.push({ id: key, ...data[key] });
            }
        }
        renderProducts(products);
        renderAdminTable(products); // एडमिन टेबल भी अपडेट हो जाएगी
    });
}

// ==========================================
// 2. FRONTEND DISPLAY LOGIC
// ==========================================

function renderBanners(banners) {
    const bannerBox = document.getElementById('bannerBox');
    if(!bannerBox) return;
    bannerBox.innerHTML = ''; 
    
    banners.forEach((banner, index) => {
        const img = document.createElement('img');
        img.src = banner.image_url;
        img.className = `banner-slide ${index === 0 ? 'active' : ''}`;
        bannerBox.appendChild(img);
    });

    setInterval(() => {
        const slides = document.querySelectorAll('.banner-slide');
        if (slides.length > 0) {
            slides[currentBannerIndex].classList.remove('active');
            currentBannerIndex = (currentBannerIndex + 1) % slides.length;
            slides[currentBannerIndex].classList.add('active');
        }
    }, 3000);
}

function renderProducts(products) {
    const productBox = document.getElementById('productBox');
    if(!productBox) return;
    productBox.innerHTML = ''; 

    if (products.length === 0) {
        productBox.innerHTML = '<p class="text-center text-gray-500 w-full mt-4">No products available</p>';
        return;
    }

    products.forEach(product => {
        const imgUrl = product.image_url || "https://via.placeholder.com/150";
        const price = product.price ? (product.price.toString().includes('₹') ? product.price : `₹${product.price}`) : "₹0";

        const card = document.createElement('div');
        card.className = "border rounded p-2 text-center shadow-sm flex flex-col justify-between";
        card.innerHTML = `
            <img src="${imgUrl}" alt="product" class="w-full h-28 object-cover rounded mb-2">
            <h3 class="text-sm text-gray-700 truncate">${product.name || 'Unnamed Product'}</h3>
            <p class="text-green-600 font-bold text-md mt-1">${price}</p>
            <button class="w-full mt-2 bg-yellow-400 text-black py-1 rounded text-sm font-bold shadow">Buy Now</button>
        `;
        productBox.appendChild(card);
    });
}

// ==========================================
// 3. ADMIN PANEL LOGIC (सब कुछ JS में!)
// ==========================================

function createAdminPanel() {
    // अगर main-content है तो उसमें, नहीं तो body में एडमिन पैनल जोड़ देंगे
    const container = document.getElementById('main-content') || document.body;
    
    const adminDiv = document.createElement('div');
    adminDiv.className = "max-w-4xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg border-t-4 border-blue-600";
    adminDiv.innerHTML = `
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Admin Control Panel</h2>
        <div class="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded border">
            <input type="text" id="adminName" placeholder="Product Name (e.g. Jeans)" class="border p-2 rounded flex-1 min-w-[200px]">
            <input type="number" id="adminPrice" placeholder="Price (e.g. 500)" class="border p-2 rounded flex-1 min-w-[150px]">
            <input type="text" id="adminImage" placeholder="Image URL (optional)" class="border p-2 rounded flex-1 min-w-[200px]">
            <button id="addBtn" class="bg-blue-600 text-white px-8 py-2 rounded font-bold hover:bg-blue-700">Add Product</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-800 text-white">
                        <th class="p-3 rounded-tl">Product</th>
                        <th class="p-3">Price</th>
                        <th class="p-3 rounded-tr">Action</th>
                    </tr>
                </thead>
                <tbody id="adminTableBody"></tbody>
            </table>
        </div>
    `;
    container.appendChild(adminDiv);

    // बटन पर क्लिक करने का एक्शन सेट करना
    document.getElementById('addBtn').addEventListener('click', addProduct);
}

function renderAdminTable(products) {
    const tbody = document.getElementById('adminTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if(products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-500">No products in database</td></tr>';
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50";
        tr.innerHTML = `
            <td class="p-3 flex items-center gap-3">
                <img src="${product.image_url || 'https://via.placeholder.com/50'}" class="w-10 h-10 rounded object-cover">
                <span class="font-semibold text-gray-700">${product.name}</span>
            </td>
            <td class="p-3 text-green-600 font-bold">₹${product.price}</td>
            <td class="p-3">
                <button class="delete-btn text-white bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600" data-id="${product.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Delete बटन पर क्लिक एक्शन सेट करना
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteProduct(e.target.getAttribute('data-id'));
        });
    });
}

function addProduct() {
    const name = document.getElementById('adminName').value;
    const price = document.getElementById('adminPrice').value;
    const image = document.getElementById('adminImage').value || "https://via.placeholder.com/150";

    if (!name || !price) {
        alert("Name और Price डालना ज़रूरी है!");
        return;
    }

    const productsRef = ref(db, 'products');
    push(productsRef, {
        name: name,
        price: price,
        image_url: image
    }).then(() => {
        document.getElementById('adminName').value = '';
        document.getElementById('adminPrice').value = '';
        document.getElementById('adminImage').value = '';
        alert("Product successfully added!");
    }).catch(error => {
        alert("Error: " + error.message);
    });
}

function deleteProduct(id) {
    if(confirm("क्या आप सच में इस प्रोडक्ट को डिलीट करना चाहते हैं?")) {
        const productRef = ref(db, `products/${id}`);
        remove(productRef).catch(error => {
            alert("Error: " + error.message);
        });
    }
}
