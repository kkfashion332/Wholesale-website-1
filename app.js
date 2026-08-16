// Live PythonAnywhere API URL set kar diya gaya hai
const API_URL = "https://kasif.pythonanywhere.com/api/home_data";

let currentBannerIndex = 0;

// 1. Loader Animation Control
window.onload = () => {
    // 3 Second baad loader hide aur main website show
    setTimeout(() => {
        document.getElementById('loader-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            fetchDataFromPython(); // Screen dikhte hi data fetch karna
        }, 500);
    }, 3000);
};

// 2. Fetch Data from Python Backend
async function fetchDataFromPython() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if(data.success) {
            renderBanners(data.banners);
            renderProducts(data.products);
        }
    } catch (error) {
        console.error("Error fetching from Python API:", error);
    }
}

// 3. Render Auto-Swiping Square Banners
function renderBanners(banners) {
    const bannerBox = document.getElementById('bannerBox');
    bannerBox.innerHTML = ''; // Clear default
    
    if(banners.length === 0) {
        bannerBox.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">No Banners Found</div>';
        return;
    }

    banners.forEach((banner, index) => {
        const img = document.createElement('img');
        img.src = banner.image_url;
        img.className = `banner-slide ${index === 0 ? 'active' : ''}`;
        bannerBox.appendChild(img);
    });

    // Auto Swipe Logic (Every 3 seconds)
    setInterval(() => {
        const slides = document.querySelectorAll('.banner-slide');
        if (slides.length > 0) {
            slides[currentBannerIndex].classList.remove('active');
            currentBannerIndex = (currentBannerIndex + 1) % slides.length;
            slides[currentBannerIndex].classList.add('active');
        }
    }, 3000);
}

// 4. Render 2-Row Horizontal Scroll Products
function renderProducts(products) {
    const productBox = document.getElementById('productBox');
    productBox.innerHTML = ''; // Clear default

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = "border rounded p-2 text-center shadow-sm flex flex-col justify-between";
        
        card.innerHTML = `
            <img src="${product.image_url}" alt="product" class="w-full h-28 object-cover rounded mb-2">
            <h3 class="text-sm text-gray-700 truncate">${product.name}</h3>
            <p class="text-green-600 font-bold text-md mt-1">${product.price}</p>
            <button class="w-full mt-2 bg-yellow-400 text-black py-1 rounded text-sm font-bold shadow">View Price</button>
        `;
        productBox.appendChild(card);
    });
}
